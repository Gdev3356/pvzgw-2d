// src/utils/simulation.ts
//
// Pure, DOM-free game-state stepping — chili beans, stink grenades/clouds,
// projectiles, explosions, shooting, and player-vs-player collision. Runs
// identically on the server tick loop; never touches canvas/Audio/Image.
//
// Sounds and hit-splat text are reported as events, not played/pushed
// directly — same pattern as Player.pendingSoundEvents.

import {
    Player,
    Projectile,
    TargetDummy,
    check3DCollision,
    checkLineBlockedByStructure,
    resolveWallCollision,
    VISUAL_Y_FACTOR,
} from './engine';
import {
    MapBounds,
    MapStructure,
    ChiliBean,
    StinkGrenade,
    StinkCloud,
    ExplosionEffect,
    PendingSoundEvent,
    Vector2D,
    KeysState,
    WeaponConfig,
    Team,
} from './types/game';
import { HitEvent } from './types/network';

export type ChiliBeanEntity = ChiliBean & { id: string };
export type StinkGrenadeEntity = StinkGrenade & { id: string };
export type StinkCloudEntity = StinkCloud & { z: number; id: string };
export type ExplosionEntity = ExplosionEffect & { z: number; id: string };

export interface RoomState {
    mapBounds: MapBounds;
    structures: MapStructure[];
    dummies: TargetDummy[];
    players: Map<string, Player>;
    projectiles: Projectile[];
    chiliBeans: ChiliBeanEntity[];
    stinkGrenades: StinkGrenadeEntity[];
    stinkClouds: StinkCloudEntity[];
    explosions: ExplosionEntity[];
    pendingHitEvents: HitEvent[];
}

export interface PlayerInputSnapshot {
    keys: KeysState;
    mousePos: Vector2D;
    isMouseDown: boolean;
}

export function createIdGenerator(prefix: string): () => string {
    let counter = 0;
    return () => `${prefix}_${counter++}`;
}

export function createRoomState(
    mapBounds: MapBounds,
    structures: MapStructure[],
    dummies: TargetDummy[]
): RoomState {
    return {
        mapBounds,
        structures,
        dummies,
        players: new Map(),
        projectiles: [],
        chiliBeans: [],
        stinkGrenades: [],
        stinkClouds: [],
        explosions: [],
        pendingHitEvents: [],
    };
}

export function triggerExplosion(
    state: RoomState,
    x: number, y: number, z: number, radius: number, maxDamage: number,
    genExplosionId: () => string,
    excludeDummy?: TargetDummy,
    type: 'chili' | 'pea' = 'chili',
    angle?: number,
    shooterTeam?: Team,
    excludePlayerId?: string,
    impactStructureId?: string
): void {
    state.explosions.push({
        id: genExplosionId(),
        x, y, z,
        maxRadius: radius, currentRadius: 5,
        color: type === 'pea' ? '#8BC34A' : '#FF5722',
        alpha: 0.9, life: 15, maxLife: 15,
        type, angle,
        impactStructureId,
    });

    state.dummies.forEach((dummy) => {
        if (dummy === excludeDummy || dummy.isDead) return;

        const vertDiff = Math.abs(dummy.z - z);
        if (vertDiff > 35) return;

        const horizDist = Math.hypot(dummy.x - x, dummy.y - y);
        const maxHitDist = radius + dummy.radius;
        if (horizDist > maxHitDist) return;

        if (checkLineBlockedByStructure(x, y, z, dummy.x, dummy.y, dummy.z, state.structures)) return;

        const dist3D = Math.hypot(horizDist, vertDiff * 1.5);
        const falloffFactor = Math.max(0.2, 1 - dist3D / maxHitDist);
        const damage = Math.round(maxDamage * falloffFactor);

        dummy.takeDamage(damage);
        state.pendingHitEvents.push({
            x: dummy.x,
            y: dummy.y - dummy.z * VISUAL_Y_FACTOR - 15,
            damage,
            isSplash: true,
        });
    });

    if (shooterTeam) {
        state.players.forEach((targetPlayer, id) => {
            if (id === excludePlayerId) return;
            if (targetPlayer.isDead) return;
            if (targetPlayer.team === shooterTeam) return; // no friendly fire

            const vertDiff = Math.abs(targetPlayer.z - z);
            if (vertDiff > 35) return;

            const horizDist = Math.hypot(targetPlayer.x - x, targetPlayer.y - y);
            const maxHitDist = radius + targetPlayer.radius;
            if (horizDist > maxHitDist) return;

            if (checkLineBlockedByStructure(x, y, z, targetPlayer.x, targetPlayer.y, targetPlayer.z, state.structures)) return;

            const dist3D = Math.hypot(horizDist, vertDiff * 1.5);
            const falloffFactor = Math.max(0.2, 1 - dist3D / maxHitDist);
            const damage = Math.round(maxDamage * falloffFactor);

            targetPlayer.takeDamage(damage);
            state.pendingHitEvents.push({
                x: targetPlayer.x,
                y: targetPlayer.y - targetPlayer.z * VISUAL_Y_FACTOR - 15,
                damage,
                isSplash: true,
            });
        });
    }
}

export function updateShooting(
    state: RoomState,
    player: Player,
    input: PlayerInputSnapshot,
    time: number,
    genProjectileId: () => string
): PendingSoundEvent[] {
    const soundEvents: PendingSoundEvent[] = [];

    if ((input.keys['r'] || input.keys['R']) && !player.isReloading && player.ammo < player.maxAmmo) {
        player.startReload(time);
    }

    const fireRate = player.isGatlingMode ? 70 : player.config.weapon.fireRate;
    if (input.isMouseDown && player.canShoot() && time - player.lastFired > fireRate) {
        // Height-assisted aiming used to only scan state.dummies, so it could
        // never lock onto an actual enemy — a shot aimed at a player camping
        // on a rooftop would fall back to "same height as the shooter" and
        // sail clean over/under them unless your cursor happened to land
        // exactly on the roof's own screen footprint. Feeding in every other
        // living player fixes that the same way it already worked for dummies.
        // Enemy-only: there's no support ability today that would want this to
        // lock onto a teammate instead (a heal beam or similar, say) — if one
        // gets added, that ability's own call site is the place to pass a
        // differently-filtered list, not this general shooting path.
        const otherPlayers = Array.from(state.players.values()).filter(
            (p) => p !== player && !p.isDead && p.team !== player.team
        );
        const { targetZ, aimDist, overrideAngle } = player.calculateTargetZ(
            input.mousePos, [...state.dummies, ...otherPlayers], state.structures
        );
        const fireAngle = overrideAngle !== undefined ? overrideAngle : player.angle;

        if (player.isGatlingMode) {
            const gatlingWeapon: WeaponConfig = {
                ...player.config.weapon,
                directDamage: 12,
                projectileSpeed: 13,
                projectileColor: '#C0CA33',
                projectileRadius: 4,
                // Gatling inherited the full Pea Cannon's splashRadius (50)
                // via the spread above — proportionally way too big for a
                // rapid-fire, individually-weaker shot. triggerExplosion's
                // maxRadius comes directly from this same number, so this
                // one value shrinks both the actual AOE damage radius and
                // the visual hit-effect ring size together; splashDamage is
                // untouched, only the reach/size of the explosion.
                splashRadius: 24,
            };
            state.projectiles.push(new Projectile(
                player.x, player.y, fireAngle, gatlingWeapon, player.team,
                player.z, aimDist, targetZ, genProjectileId()
            ));
            player.gatlingAmmo -= 1;
            // Without this, player.isShooting never flips true during gatling
            // fire (unlike the regular-weapon branch below), so it never
            // reaches the client at all: the gatling firing/idle flicker in
            // engine.ts is gated on isShooting, and so is the remote-puppet
            // muzzle-flash spawn (false->true transition) in GameCanvas.tsx.
            // Local muzzle-flash particles looked fine only because those are
            // keyed off the 'gatling_core' sound event below, not isShooting.
            player.triggerShoot();
            soundEvents.push({ key: 'gatling_core', volume: 0.75, pitchVariation: 0.05 });
            if (player.gatlingAmmo <= 0) player.exitGatlingMode(time);
        } else {
            state.projectiles.push(new Projectile(
                player.x, player.y, fireAngle, player.config.weapon, player.team,
                player.z, aimDist, targetZ, genProjectileId()
            ));
            player.ammo -= 1;
            player.triggerShoot();

            if (player.classType === 'peashooter') {
                soundEvents.push({ key: 'shoot_mono', volume: 0.7, pitchVariation: 0.03 });
            }

            if (player.ammo === 0) player.startReload(time);
        }
        player.lastFired = time;
    }

    return soundEvents;
}

// Reflects the REMAINING portion of a throwable's path off whichever face of
// `struct` it just penetrated, damped so the bounce is shorter/lower than the
// original throw. Mutates the throwable in place: repositions start at the
// current point of impact, computes a new (shorter) target, resets progress
// to 0, and shrinks arcHeight for a lower secondary hop. Marking `bounced`
// ensures this only ever happens once per throwable.
function bounceOffStructure<T extends {
    x: number; y: number; z: number;
    startX: number; startY: number; startZ: number;
    targetX: number; targetY: number;
    progress: number; flightSpeed: number; arcHeight: number;
    bounced?: boolean;
    radius?: number; // Added radius support
}>(thrown: T, struct: MapStructure): void {
    const r = thrown.radius || 4;
    const overlapLeft = (thrown.x + r) - struct.x;
    const overlapRight = (struct.x + struct.width) - (thrown.x - r);
    const overlapTop = (thrown.y + r) - struct.y;
    const overlapBottom = (struct.y + struct.height) - (thrown.y - r);
    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

    const fullDX = thrown.targetX - thrown.startX;
    const fullDY = thrown.targetY - thrown.startY;
    const remainingFrac = 1 - thrown.progress;
    let remainingDX = fullDX * remainingFrac;
    let remainingDY = fullDY * remainingFrac;

    // Force ejection from the wall before calculating the new bounce path
    if (minOverlap === overlapLeft) {
        remainingDX = -Math.abs(remainingDX);
        thrown.x = struct.x - r - 0.1;
    } else if (minOverlap === overlapRight) {
        remainingDX = Math.abs(remainingDX);
        thrown.x = struct.x + struct.width + r + 0.1;
    } else if (minOverlap === overlapTop) {
        remainingDY = -Math.abs(remainingDY);
        thrown.y = struct.y - r - 0.1;
    } else {
        remainingDY = Math.abs(remainingDY);
        thrown.y = struct.y + struct.height + r + 0.1;
    }

    const DAMPING = 0.45;
    const newTargetX = thrown.x + remainingDX * DAMPING;
    const newTargetY = thrown.y + remainingDY * DAMPING;

    thrown.startX = thrown.x;
    thrown.startY = thrown.y;
    thrown.startZ = thrown.z;
    thrown.targetX = newTargetX;
    thrown.targetY = newTargetY;
    thrown.progress = 0;
    thrown.arcHeight = Math.max(4, thrown.arcHeight * 0.35);
    thrown.bounced = true;
}

export function updateChiliBeans(
    state: RoomState,
    dt60: number,
    deltaMs: number,
    genExplosionId: () => string
): PendingSoundEvent[] {
    const soundEvents: PendingSoundEvent[] = [];

    for (let i = state.chiliBeans.length - 1; i >= 0; i--) {
        const bean = state.chiliBeans[i] as ChiliBeanEntity & { rotation?: number; rotationSpeed?: number };

        if (!bean.isLanded) {
            bean.rotation = (bean.rotation || 0) + (bean.rotationSpeed || 0.1) * dt60;
            bean.progress = Math.min(1.0, bean.progress + bean.flightSpeed * dt60);
            bean.x = bean.startX + (bean.targetX - bean.startX) * bean.progress;
            bean.y = bean.startY + (bean.targetY - bean.startY) * bean.progress;

            let targetFloorZ = 0;
                state.structures.forEach((struct) => {
                    if (struct.type !== 'building') return;

                    if (
                        bean.targetX >= struct.x && bean.targetX <= struct.x + struct.width &&
                        bean.targetY >= struct.y && bean.targetY <= struct.y + struct.height
                    ) {
                        targetFloorZ = Math.max(targetFloorZ, struct.z);
                    }
                });

            const linearZ = bean.startZ + (targetFloorZ - bean.startZ) * bean.progress;
            bean.z = linearZ + Math.sin(bean.progress * Math.PI) * bean.arcHeight;

            let hitWall = false;
            for (const struct of state.structures) {
                const r = bean.radius || 12;
                // Account for entity radius instead of central point testing
                if (
                    bean.x + r >= struct.x && bean.x - r <= struct.x + struct.width &&
                    bean.y + r >= struct.y && bean.y - r <= struct.y + struct.height
                ) {
                    // Tightened Z tolerance to prevent top-clipping
                    if (bean.z < struct.z - 2) {
                        if (!bean.bounced) {
                            bounceOffStructure(bean, struct);
                        } else {
                            hitWall = true;
                            bean.progress = 1.0;
                            bean.isLanded = true;
                            // Removed the bean.z = 0 drop so it doesn't sink into the floor if trapped
                        }
                        break;
                    }
                }
            }

            if (bean.progress >= 1.0) {
                bean.isLanded = true;
                if (!hitWall && bean.z > 0) bean.z = targetFloorZ;
            }
        }

        state.players.forEach((player) => {
            if (player.isDead) return;

            const vertDiff = player.z - bean.z;

            // Step/Jump on top of the bean if falling over it
            if (vertDiff >= 8 && vertDiff <= 20) {
                const horizDist = Math.hypot(player.x - bean.x, player.y - bean.y);
                if (horizDist < player.radius + bean.radius) {
                    player.z = bean.z + 10;
                    player.vz = Math.max(0, player.vz);
                    return;
                }
            }

            // Same-height solid collision (pushes players out of the bean's space)
            if (Math.abs(vertDiff) < 15) {
                const dx = player.x - bean.x;
                const dy = player.y - bean.y;
                const dist = Math.hypot(dx, dy);
                const minDist = player.radius + bean.radius;

                if (dist < minDist) {
                    const overlap = minDist - dist;
                    const pushX = dist === 0 ? 1 : (dx / dist) * overlap;
                    const pushY = dist === 0 ? 0 : (dy / dist) * overlap;

                    player.x += pushX;
                    player.y += pushY;

                    const resolved = resolveWallCollision(player.x, player.y, player.z, player.radius, state.structures);
                    player.x = resolved.x;
                    player.y = resolved.y;
                }
            }
        });

        // Same-height solid collision vs dummies — mirrors the player check
        // above so beans push dummies out of their way too, not just players.
        state.dummies.forEach((dummy) => {
            if (dummy.isDead) return;

            const vertDiff = dummy.z - bean.z;
            if (Math.abs(vertDiff) >= 15) return;

            const dx = dummy.x - bean.x;
            const dy = dummy.y - bean.y;
            const dist = Math.hypot(dx, dy);
            const minDist = dummy.radius + bean.radius;

            if (dist < minDist) {
                const overlap = minDist - dist;
                const pushX = dist === 0 ? 1 : (dx / dist) * overlap;
                const pushY = dist === 0 ? 0 : (dy / dist) * overlap;

                dummy.x += pushX;
                dummy.y += pushY;

                const resolved = resolveWallCollision(dummy.x, dummy.y, dummy.z, dummy.radius, state.structures);
                dummy.x = resolved.x;
                dummy.y = resolved.y;

                dummy.x = Math.max(dummy.radius, Math.min(state.mapBounds.width - dummy.radius, dummy.x));
                dummy.y = Math.max(dummy.radius, Math.min(state.mapBounds.height - dummy.radius, dummy.y));
            }
        });

        bean.fuseTimer -= deltaMs;
        if (bean.fuseTimer <= 0) {
            triggerExplosion(
                state, bean.x, bean.y, bean.z, bean.explosionRadius, bean.damage,
                genExplosionId, undefined, 'chili', undefined, bean.team
            );
            soundEvents.push({ key: 'chili_explode' });
            state.chiliBeans.splice(i, 1);
        }
    }

    return soundEvents;
}

export function updateStinkGrenades(state: RoomState, dt60: number, genStinkCloudId: () => string): void {
    for (let i = state.stinkGrenades.length - 1; i >= 0; i--) {
        const grenade = state.stinkGrenades[i];
        grenade.progress += grenade.flightSpeed * dt60;
        grenade.x = grenade.startX + (grenade.targetX - grenade.startX) * grenade.progress;
        grenade.y = grenade.startY + (grenade.targetY - grenade.startY) * grenade.progress;

        let targetFloorZ = 0;
        state.structures.forEach((struct) => {
            if (
                grenade.targetX >= struct.x && grenade.targetX <= struct.x + struct.width &&
                grenade.targetY >= struct.y && grenade.targetY <= struct.y + struct.height
            ) {
                targetFloorZ = Math.max(targetFloorZ, struct.z);
            }
        });

        const linearZ = grenade.startZ + (targetFloorZ - grenade.startZ) * grenade.progress;
        grenade.z = linearZ + Math.sin(grenade.progress * Math.PI) * grenade.arcHeight;

        let hitWall = false;
        for (const struct of state.structures) {
            if (
                grenade.x >= struct.x && grenade.x <= struct.x + struct.width &&
                grenade.y >= struct.y && grenade.y <= struct.y + struct.height
            ) {
                if (grenade.z < struct.z - 5) {
                    if (!grenade.bounced) {
                        bounceOffStructure(grenade, struct);
                    } else {
                        hitWall = true;
                        state.stinkClouds.push({
                            id: genStinkCloudId(),
                            team: grenade.team,
                            x: grenade.x, y: grenade.y, z: 0,
                            radius: 90, duration: 8000, damagePerTick: 4, tickTimer: 0,
                        });
                        state.stinkGrenades.splice(i, 1);
                    }
                    break;
                }
            }
        }

        if (hitWall) continue;

        if (grenade.progress >= 1.0) {
            state.stinkClouds.push({
                id: genStinkCloudId(),
                team: grenade.team,
                x: grenade.targetX, y: grenade.targetY, z: targetFloorZ,
                radius: 90, duration: 8000, damagePerTick: 4, tickTimer: 0,
            });
            state.stinkGrenades.splice(i, 1);
        }
    }
}

export function updateStinkClouds(state: RoomState, deltaMs: number): void {
    for (let i = state.stinkClouds.length - 1; i >= 0; i--) {
        const cloud = state.stinkClouds[i];
        cloud.duration -= deltaMs;
        cloud.tickTimer += deltaMs;

        if (cloud.tickTimer >= 400) {
            cloud.tickTimer = 0;

            state.dummies.forEach((dummy) => {
                if (dummy.isDead) return;
                const horizDist = Math.hypot(dummy.x - cloud.x, dummy.y - cloud.y);
                const vertDist = Math.abs(dummy.z - cloud.z);
                if (horizDist <= cloud.radius && vertDist <= 30) {
                    if (!checkLineBlockedByStructure(cloud.x, cloud.y, cloud.z, dummy.x, dummy.y, dummy.z, state.structures)) {
                        dummy.takeDamage(cloud.damagePerTick);
                        state.pendingHitEvents.push({
                            x: dummy.x,
                            y: dummy.y - dummy.z * VISUAL_Y_FACTOR - 10,
                            damage: cloud.damagePerTick,
                            isSplash: true,
                        });
                    }
                }
            });

            if (cloud.team) {
                state.players.forEach((targetPlayer) => {
                    if (targetPlayer.isDead || targetPlayer.team === cloud.team) return;
                    const horizDist = Math.hypot(targetPlayer.x - cloud.x, targetPlayer.y - cloud.y);
                    const vertDist = Math.abs(targetPlayer.z - cloud.z);
                    if (horizDist <= cloud.radius && vertDist <= 30) {
                        if (!checkLineBlockedByStructure(cloud.x, cloud.y, cloud.z, targetPlayer.x, targetPlayer.y, targetPlayer.z, state.structures)) {
                            targetPlayer.takeDamage(cloud.damagePerTick);
                            state.pendingHitEvents.push({
                                x: targetPlayer.x,
                                y: targetPlayer.y - targetPlayer.z * VISUAL_Y_FACTOR - 10,
                                damage: cloud.damagePerTick,
                                isSplash: true,
                            });
                        }
                    }
                });
            }
        }

        if (cloud.duration <= 0) state.stinkClouds.splice(i, 1);
    }
}

export function updateProjectiles(state: RoomState, dt60: number, genExplosionId: () => string): PendingSoundEvent[] {
    const soundEvents: PendingSoundEvent[] = [];

    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        p.update(state.mapBounds, dt60);

        const isPea = p.weapon.name.toLowerCase().includes('pea') || p.team === 'plants';
        const impactAngle = Math.atan2(p.vy, p.vx);
        const impactSoundKey = p.team === 'plants' ? 'impact' : 'impact_zombie';

        let hitStructure = false;
        for (const struct of state.structures) {
            if (
                p.x >= struct.x && p.x <= struct.x + struct.width &&
                p.y >= struct.y && p.y <= struct.y + struct.height
            ) {
                if (p.currentZ <= struct.z) {
                    hitStructure = true;
                    p.toRemove = true;
                    if (p.weapon.splashRadius > 0) {
                        triggerExplosion(
                            state, p.x, p.y, p.currentZ, p.weapon.splashRadius, p.weapon.splashDamage,
                            genExplosionId, undefined, isPea ? 'pea' : 'chili', impactAngle, p.team,
                            undefined, struct.id
                        );
                    }
                    break;
                }
            }
        }

        if (hitStructure) {
            state.projectiles.splice(i, 1);
            soundEvents.push({ key: impactSoundKey, volume: 0.4, pitchVariation: 0.05 });
            continue;
        }

        let directHitDummy: TargetDummy | null = null;
        let directHitPlayerId: string | null = null;

        for (const dummy of state.dummies) {
            if (!dummy.isDead && p.team !== dummy.team) {
                if (check3DCollision(
                    p.x, p.y, p.currentZ, p.weapon.projectileRadius,
                    dummy.x, dummy.y, dummy.z, dummy.radius,
                    25
                )) {
                    directHitDummy = dummy;
                    const damage = p.getCalculatedDamage();
                    dummy.takeDamage(damage);
                    p.toRemove = true;

                    soundEvents.push({ key: impactSoundKey, volume: 0.6, pitchVariation: 0.05 });
                    state.pendingHitEvents.push({
                        x: dummy.x,
                        y: dummy.y - dummy.z * VISUAL_Y_FACTOR - 10,
                        damage,
                    });

                    if (p.weapon.splashRadius > 0) {
                        triggerExplosion(
                            state, p.x, p.y, p.currentZ, p.weapon.splashRadius, p.weapon.splashDamage,
                            genExplosionId, dummy, isPea ? 'pea' : 'chili', impactAngle, p.team
                        );
                    }
                    break;
                }
            }
        }

        if (!directHitDummy) {
            for (const [id, targetPlayer] of state.players) {
                if (targetPlayer.isDead || p.team === targetPlayer.team) continue;
                if (check3DCollision(
                    p.x, p.y, p.currentZ, p.weapon.projectileRadius,
                    targetPlayer.x, targetPlayer.y, targetPlayer.z, targetPlayer.radius,
                    25
                )) {
                    directHitPlayerId = id;
                    const damage = p.getCalculatedDamage();
                    targetPlayer.takeDamage(damage);
                    p.toRemove = true;

                    soundEvents.push({ key: impactSoundKey, volume: 0.6, pitchVariation: 0.05 });
                    state.pendingHitEvents.push({
                        x: targetPlayer.x,
                        y: targetPlayer.y - targetPlayer.z * VISUAL_Y_FACTOR - 10,
                        damage,
                    });

                    if (p.weapon.splashRadius > 0) {
                        triggerExplosion(
                            state, p.x, p.y, p.currentZ, p.weapon.splashRadius, p.weapon.splashDamage,
                            genExplosionId, undefined, isPea ? 'pea' : 'chili', impactAngle, p.team, id
                        );
                    }
                    break;
                }
            }
        }

        if (p.toRemove || p.isExpired) {
            if (p.weapon.splashRadius > 0) {
                if (!directHitDummy && !directHitPlayerId) {
                    triggerExplosion(
                        state, p.x, p.y, p.currentZ, p.weapon.splashRadius, p.weapon.splashDamage,
                        genExplosionId, undefined, isPea ? 'pea' : 'chili', impactAngle, p.team
                    );
                }
                state.projectiles.splice(i, 1);
            } else {
                p.alpha = (p.alpha ?? 1.0) - 0.2 * dt60;
                if (p.alpha <= 0) state.projectiles.splice(i, 1);
            }
        }
    }

    return soundEvents;
}

export function updateExplosions(state: RoomState, dt60: number): void {
    for (let i = state.explosions.length - 1; i >= 0; i--) {
        const exp = state.explosions[i];
        exp.life -= dt60;
        exp.currentRadius += (exp.maxRadius - exp.currentRadius) * Math.min(1, 0.2 * dt60);
        exp.alpha = Math.max(0, exp.life / exp.maxLife);
        if (exp.life <= 0) state.explosions.splice(i, 1);
    }
}

const PLAYER_COLLISION_Z_TOLERANCE = 30;

export function resolvePlayerCollisions(state: RoomState): void {
    const alivePlayers = Array.from(state.players.values()).filter((p) => !p.isDead);

    for (let i = 0; i < alivePlayers.length; i++) {
        for (let j = i + 1; j < alivePlayers.length; j++) {
            const a = alivePlayers[i];
            const b = alivePlayers[j];

            if (Math.abs(a.z - b.z) > PLAYER_COLLISION_Z_TOLERANCE) continue;

            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.hypot(dx, dy);
            const minDist = a.radius + b.radius;

            if (dist === 0) {
                a.x -= a.radius * 0.5;
                b.x += b.radius * 0.5;

                const resolvedA0 = resolveWallCollision(a.x, a.y, a.z, a.radius, state.structures);
                a.x = resolvedA0.x; a.y = resolvedA0.y;
                const resolvedB0 = resolveWallCollision(b.x, b.y, b.z, b.radius, state.structures);
                b.x = resolvedB0.x; b.y = resolvedB0.y;
                continue;
            }

            if (dist < minDist) {
                const overlap = minDist - dist;
                const pushX = (dx / dist) * overlap * 0.5;
                const pushY = (dy / dist) * overlap * 0.5;

                a.x -= pushX;
                a.y -= pushY;
                b.x += pushX;
                b.y += pushY;

                // Players only avoid walls when they move themselves (see
                // Player.update()); this push happens outside that path, so
                // without re-resolving here a stationary player could get
                // shoved straight through a wall by whoever bumps into them.
                const resolvedA = resolveWallCollision(a.x, a.y, a.z, a.radius, state.structures);
                a.x = resolvedA.x; a.y = resolvedA.y;
                const resolvedB = resolveWallCollision(b.x, b.y, b.z, b.radius, state.structures);
                b.x = resolvedB.x; b.y = resolvedB.y;

                a.x = Math.max(a.radius, Math.min(state.mapBounds.width - a.radius, a.x));
                a.y = Math.max(a.radius, Math.min(state.mapBounds.height - a.radius, a.y));
                b.x = Math.max(b.radius, Math.min(state.mapBounds.width - b.radius, b.x));
                b.y = Math.max(b.radius, Math.min(state.mapBounds.height - b.radius, b.y));
            }
        }
    }
}
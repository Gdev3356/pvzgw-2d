import {
    Team,
    CharacterClass,
    ClassConfig,
    WeaponConfig,
    MapBounds,
    Vector2D,
    KeysState,
    ChiliBean,
    StinkGrenade,
    MapStructure,
    CharacterSprites,
    PendingSoundEvent,
} from './types/game';


export const CLASS_CONFIGS: Record<CharacterClass, ClassConfig> = {
    peashooter: {
        className: 'peashooter',
        displayName: 'Peashooter',
        team: 'plants',
        maxHealth: 125,
        moveSpeed: 4.2,
        radius: 18,
        baseZoom: 0.82,
        aimZoom: 0.64,
        weapon: {
            name: 'Pea Cannon',
            maxAmmo: 10,
            fireRate: 350,
            reloadDuration: 1500,
            projectileSpeed: 10,
            directDamage: 25,
            splashDamage: 10,
            splashRadius: 50,
            maxRange: 700,
            falloffStartDistance: 350,
            minDamage: 18,
            projectileRadius: 7,
            projectileColor: '#8BC34A',
        },
        abilities: {
            ability1: { id: 'chili_bean', name: 'Chili Bean', cooldown: 12000, keyBind: 'Q', description: 'Deploys a ticking bomb with huge splash damage.' },
            ability2: { id: 'hyper', name: 'Hyper', cooldown: 15000, duration: 6000, keyBind: 'E', description: 'Boosts speed & jump height to reach high rooftops.' },
            ability3: { id: 'pea_gatling', name: 'Pea Gatling', cooldown: 20000, keyBind: 'F', description: 'Roots in place to fire rapid high-damage peas.' },
        },
    },
    footsoldier: {
        className: 'footsoldier',
        displayName: 'Foot Soldier',
        team: 'zombies',
        maxHealth: 125,
        moveSpeed: 4.0,
        radius: 18,
        baseZoom: 0.82,
        aimZoom: 0.51,
        weapon: {
            name: 'Z-1 Assault Blaster',
            maxAmmo: 30,
            fireRate: 100,
            reloadDuration: 1800,
            projectileSpeed: 13,
            directDamage: 11,
            splashDamage: 0,
            splashRadius: 0,
            maxRange: 800,
            falloffStartDistance: 250,
            minDamage: 5,
            projectileRadius: 3,
            projectileColor: '#FFC107',
        },
        abilities: {
            ability1: { id: 'stink_cloud', name: 'Stink Cloud', cooldown: 14000, keyBind: 'Q', description: 'Throws a gas grenade that deploys toxic mist.' },
            ability2: { id: 'rocket_jump', name: 'Rocket Jump', cooldown: 10000, keyBind: 'E', description: 'Launches high airborne into the sky to mount rooftops.' },
            ability3: { id: 'zpg', name: 'ZPG Rocket', cooldown: 18000, keyBind: 'F', description: 'Winds up and launches an explosive heavy rocket.' },
        },
    },
};

export const Z_HEIGHT_SCALE = 0.0025;
export const VISUAL_Y_FACTOR = 1.2;
export const BARREL_HEIGHT = 2;

export type DirectionType = 'NE' | 'NW' | 'SE' | 'SW' | 'CARDINAL';
export type Direction8Way = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW';

export interface DirectionInfo {
    direction: Direction8Way;
    scaleX: number;
    scaleY: number;
    fallbackRotation: number;
    type: DirectionType;
    isDiagonal: boolean;
    centerAngle: number;
}

export const getAngle = (x1: number, y1: number, x2: number, y2: number): number => {
    return Math.atan2(y2 - y1, x2 - x1);
};

export function get8WayDirection(angle: number): DirectionInfo {
    let a = angle;
    while (a < 0) a += Math.PI * 2;
    while (a >= Math.PI * 2) a -= Math.PI * 2;

    const sector = Math.floor((a + Math.PI / 8) / (Math.PI / 4)) % 8;

    switch (sector) {
        case 0:
            return { direction: 'E', scaleX: 1, scaleY: 1, fallbackRotation: 0, type: 'CARDINAL', isDiagonal: false, centerAngle: 0 };
        case 1:
            return { direction: 'SE', scaleX: 1, scaleY: 1, fallbackRotation: 0, type: 'SE', isDiagonal: true, centerAngle: Math.PI / 4 };
        case 2:
            return { direction: 'S', scaleX: 1, scaleY: 1, fallbackRotation: 0, type: 'CARDINAL', isDiagonal: false, centerAngle: Math.PI / 2 };
        case 3:
            return { direction: 'SW', scaleX: -1, scaleY: 1, fallbackRotation: 0, type: 'SW', isDiagonal: true, centerAngle: (3 * Math.PI) / 4 };
        case 4:
            return { direction: 'W', scaleX: -1, scaleY: 1, fallbackRotation: 0, type: 'CARDINAL', isDiagonal: false, centerAngle: Math.PI };
        case 5:
            return { direction: 'NW', scaleX: -1, scaleY: 1, fallbackRotation: 0, type: 'NW', isDiagonal: true, centerAngle: (5 * Math.PI) / 4 };
        case 6:
            return { direction: 'N', scaleX: 1, scaleY: 1, fallbackRotation: 0, type: 'CARDINAL', isDiagonal: false, centerAngle: (3 * Math.PI) / 2 };
        case 7:
            return { direction: 'NE', scaleX: 1, scaleY: 1, fallbackRotation: 0, type: 'NE', isDiagonal: true, centerAngle: (7 * Math.PI) / 4 };
        default:
            return { direction: 'N', scaleX: 1, scaleY: 1, fallbackRotation: 0, type: 'CARDINAL', isDiagonal: false, centerAngle: (3 * Math.PI) / 2 };
    }
}
export const check3DCollision = (
    px: number, py: number, pz: number, pradius: number,
    tx: number, ty: number, tz: number, tradius: number,
    heightTolerance: number = 25
): boolean => {
    const dx = tx - px;
    const dy = ty - py;
    const horizontalHit = dx * dx + dy * dy < (pradius + tradius) * (pradius + tradius);
    const verticalHit = Math.abs(pz - tz) <= heightTolerance;
    return horizontalHit && verticalHit;
};

export const checkLineBlockedByStructure = (
    x1: number, y1: number, z1: number,
    x2: number, y2: number, z2: number,
    structures: MapStructure[]
): boolean => {
    for (const struct of structures) {
        const minX = struct.x;
        const maxX = struct.x + struct.width;
        const minY = struct.y;
        const maxY = struct.y + struct.height;

        const dx = x2 - x1;
        const dy = y2 - y1;
        const dz = z2 - z1;

        let t0 = 0;
        let t1 = 1;

        const p = [-dx, dx, -dy, dy];
        const q = [x1 - minX, maxX - x1, y1 - minY, maxY - y1];

        let blocked = true;
        for (let i = 0; i < 4; i++) {
            if (p[i] === 0) {
                if (q[i] < 0) { blocked = false; break; }
            } else {
                const r = q[i] / p[i];
                if (p[i] < 0) {
                    if (r > t1) { blocked = false; break; }
                    if (r > t0) t0 = r;
                } else {
                    if (r < t0) { blocked = false; break; }
                    if (r < t1) t1 = r;
                }
            }
        }

        if (blocked && t0 <= t1) {
            const zAtStart = z1 + t0 * dz;
            const zAtEnd = z1 + t1 * dz;

            if (zAtStart < struct.z - 5 || zAtEnd < struct.z - 5) {
                return true;
            }
        }
    }
    return false;
};

// Shared wall/structure collision resolver — pushes a circle of the given
// radius back out of any structure it's below-roof-inside of. Used both for
// normal movement (nextX/nextY) and for any post-hoc displacement (knockback,
// dummy pushback, player-vs-player separation) that would otherwise skip
// wall collision entirely since it never runs through Player.update()'s
// movement path.
export function resolveWallCollision(
    x: number, y: number, z: number, radius: number, structures: MapStructure[]
): Vector2D {
    let resultX = x;
    let resultY = y;
    const ROOF_SNAP_TOLERANCE = 15;

    for (const struct of structures) {
        const isBelowRoof = z < struct.z - 8;
        const hasClearedRoofHeight = z >= struct.z - ROOF_SNAP_TOLERANCE;

        if (isBelowRoof && !hasClearedRoofHeight) {
            const closestX = Math.max(struct.x, Math.min(resultX, struct.x + struct.width));
            const closestY = Math.max(struct.y, Math.min(resultY, struct.y + struct.height));

            const distX = resultX - closestX;
            const distY = resultY - closestY;
            const distance = Math.hypot(distX, distY);

            if (distance < radius) {
                const overlap = radius - distance;
                if (distance > 0) {
                    resultX += (distX / distance) * overlap;
                    resultY += (distY / distance) * overlap;
                } else {
                    resultX = x;
                    resultY = y;
                }
            }
        }
    }

    return { x: resultX, y: resultY };
}

// Height of whatever surface (structure or open ground) sits directly under
// a given point — i.e. what an entity there would land on / rest on. Shared
// by Player.update(), TargetDummy.update(), and the client's remote-puppet
// sync (puppets never run update() themselves, so without calling this
// separately their groundZ would just stay frozen at whatever it started as,
// breaking anything that depends on "height above current surface" — like
// shadow scaling — for anyone but the locally-simulated player).
export function computeGroundZ(
    x: number, y: number, z: number, radius: number, structures: MapStructure[],
    tolerance: number = 15
): number {
    let groundZ = 0;
    for (const struct of structures) {
        if (
            x >= struct.x - radius * 0.4 &&
            x <= struct.x + struct.width + radius * 0.4 &&
            y >= struct.y - radius * 0.4 &&
            y <= struct.y + struct.height + radius * 0.4
        ) {
            if (z >= struct.z - tolerance) {
                groundZ = Math.max(groundZ, struct.z);
            }
        }
    }
    return groundZ;
}

function projectThrowTarget(
    mousePos: Vector2D,
    structures: MapStructure[]
): { targetX: number; targetY: number } {
    for (const struct of structures) {
        if (struct.type !== 'building') continue;

        const roofVisualY = struct.y - struct.z * VISUAL_Y_FACTOR;
        if (
            mousePos.x >= struct.x && mousePos.x <= struct.x + struct.width &&
            mousePos.y >= roofVisualY && mousePos.y <= roofVisualY + struct.height
        ) {
            return { targetX: mousePos.x, targetY: mousePos.y + struct.z * VISUAL_Y_FACTOR };
        }
    }
    return { targetX: mousePos.x, targetY: mousePos.y };
}

// Minimal shape calculateTargetZ needs from anything it can lock onto for
// height-assisted aiming. TargetDummy and Player both already satisfy this
// structurally — no inheritance or casting needed to pass either, or a mix
// of both, in the same array.
interface AimTarget {
    x: number;
    y: number;
    z: number;
    radius: number;
    isDead: boolean;
}

export class Player {
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    // Height of whatever surface the player is currently resting on (0 =
    // ground, or a structure's z once landed on it). Used so a jump's shadow
    // separation is measured from the surface actually underfoot, not from
    // world-ground — otherwise standing still atop a tall roof would show
    // the shadow cast all the way down at ground level instead of at the feet.
    groundZ: number = 0;
    radius: number;
    speed: number;
    angle: number = 0;
    health: number;
    maxHealth: number;
    team: Team;
    classType: CharacterClass;
    config: ClassConfig;

    ammo: number;
    maxAmmo: number;
    isReloading: boolean = false;
    reloadStartTime: number = 0;
    lastFired: number = 0;

    cooldowns: Record<string, number> = { Q: 0, E: 0, F: 0 };
    activeBuffs: Record<string, number> = { hyper: 0 };
    isGatlingMode: boolean = false;
    gatlingAmmo: number = 0;
    // Time since entering gatling mode, ticked in update() — separate from
    // animTimer because animTimer only advances while isMoving, and gatling
    // mode always forces isMoving=false (rooted in place), so it would
    // otherwise stay stuck at 0 for the entire duration.
    gatlingAnimTimer: number = 0;
    // True for the brief window after leaving gatling mode where we play the
    // activation frames back to front (an "un-rooting" transition) instead
    // of snapping straight back to the normal idle/walk sprite. Cosmetic
    // only — like isBlinking, it isn't networked; it's set locally wherever
    // isGatlingMode's true->false edge is observed (exitGatlingMode() for
    // the player who owns this instance, or the reconciliation/puppet-sync
    // code in GameCanvas.tsx for everyone else's copy of them).
    isGatlingDeactivating: boolean = false;
    gatlingDeactivateTimer: number = 0;

    lastJumpTime: number = 0;
    baseJumpCooldown: number = 6000;

    isChargingZPG: boolean = false;
    zpgStartTime: number = 0;
    zpgWindupDuration: number = 800;

    isRocketJumping: boolean = false;
    jumpVx: number = 0;
    jumpVy: number = 0;

    isMoving: boolean = false;
    animTimer: number = 0;
    wasHyperActive: boolean = false;

    isShooting: boolean = false;
    shootTimer: number = 0;

    isBlinking: boolean = false;
    blinkTimer: number = 0;
    blinkDuration: number = 10;
    idleTimer: number = 0;
    nextBlinkThreshold: number = 150 + Math.random() * 240;

    pendingSoundEvents: PendingSoundEvent[] = [];

    private queueSound(key: string, volume?: number, pitchVariation?: number): void {
        this.pendingSoundEvents.push({ key, volume, pitchVariation });
    }

    // Called once per frame/tick by whoever owns this Player — client pulls these into
    // soundManager.play(), server just discards them. Returns-and-clears atomically so
    // nothing can double-play a sound if two systems both poll it.
    consumePendingSounds(): PendingSoundEvent[] {
        const events = this.pendingSoundEvents;
        this.pendingSoundEvents = [];
        return events;
    }

    constructor(x: number, y: number, characterClass: CharacterClass = 'peashooter') {
        this.x = x;
        this.y = y;
        this.classType = characterClass;
        this.config = CLASS_CONFIGS[characterClass];

        this.radius = this.config.radius;
        this.speed = this.config.moveSpeed;
        this.health = this.config.maxHealth;
        this.maxHealth = this.config.maxHealth;
        this.team = this.config.team;

        this.ammo = this.config.weapon.maxAmmo;
        this.maxAmmo = this.config.weapon.maxAmmo;
    }

    setClass(characterClass: CharacterClass): void {
        this.classType = characterClass;
        this.config = CLASS_CONFIGS[characterClass];
        this.radius = this.config.radius;
        this.speed = this.config.moveSpeed;
        this.health = this.config.maxHealth;
        this.maxHealth = this.config.maxHealth;
        this.team = this.config.team;
        this.ammo = this.config.weapon.maxAmmo;
        this.maxAmmo = this.config.weapon.maxAmmo;
        this.isReloading = false;
        this.isGatlingMode = false;
        this.isGatlingDeactivating = false;
        this.gatlingDeactivateTimer = 0;
        this.isChargingZPG = false;
        this.isRocketJumping = false;
        this.isShooting = false;
        this.shootTimer = 0;
        this.isBlinking = false;
        this.blinkTimer = 0;
        this.idleTimer = 0;
        this.nextBlinkThreshold = 150 + Math.random() * 240;
        this.z = 0;
        this.vz = 0;
        this.jumpVx = 0;
        this.jumpVy = 0;
        this.lastJumpTime = 0;
        this.cooldowns = { Q: 0, E: 0, F: 0 };
        this.activeBuffs = { hyper: 0 };
    }

    triggerShoot(): void {
        this.isShooting = true;
        this.shootTimer = 12;
    }

    calculateTargetZ(
        mousePos: Vector2D,
        targets: AimTarget[] = [],
        structures: MapStructure[] = []
    ): { targetZ: number; aimDist: number; overrideAngle?: number } {
        const playerGunZ = this.z + BARREL_HEIGHT;

        for (const target of targets) {
            if (!target.isDead) {
                const targetVisualY = target.y - target.z * VISUAL_Y_FACTOR;
                const distToVisualTarget = Math.hypot(mousePos.x - target.x, mousePos.y - targetVisualY);

                if (distToVisualTarget <= target.radius * 2.2) {
                    const actualDist = Math.hypot(target.x - this.x, target.y - this.y);
                    const actualAngle = Math.atan2(target.y - this.y, target.x - this.x);
                    return {
                        targetZ: target.z + BARREL_HEIGHT,
                        aimDist: actualDist,
                        overrideAngle: actualAngle,
                    };
                }
            }
        }

        for (const struct of structures) {
            if (struct.type !== 'building') continue;

            const roofVisualY = struct.y - struct.z * VISUAL_Y_FACTOR;
            if (
                mousePos.x >= struct.x && mousePos.x <= struct.x + struct.width &&
                mousePos.y >= roofVisualY && mousePos.y <= roofVisualY + struct.height
            ) {
                const worldTargetY = mousePos.y + struct.z * VISUAL_Y_FACTOR;
                const actualDist = Math.hypot(mousePos.x - this.x, worldTargetY - this.y);
                const actualAngle = Math.atan2(worldTargetY - this.y, mousePos.x - this.x);
                return {
                    targetZ: struct.z + BARREL_HEIGHT,
                    aimDist: actualDist,
                    overrideAngle: actualAngle,
                };
            }
        }

        const aimDist = Math.hypot(mousePos.x - this.x, mousePos.y - this.y);
        return { targetZ: playerGunZ, aimDist };
    }

    // Drives a Player instance that's purely a visual stand-in for a remote
    // networked player — no local movement/physics at all. Position/angle/
    // isMoving/isShooting come straight from the network snapshot each frame;
    // blinking is deliberately NOT networked (it's cosmetic-only) and runs its
    // own independent idle timer here, exactly mirroring the real update()'s
    // idle branch, just decoupled from movement input.
    applyRemotePuppetState(
        x: number, y: number, z: number, angle: number,
        isMoving: boolean, isShootingNow: boolean,
        isHyperActive: boolean,
        hyperRemaining: number,
        dt60: number,
        now: number
    ): void {
        this.x = x;
        this.y = y;
        this.z = z;
        this.angle = angle;
        this.isMoving = isMoving;

        this.wasHyperActive = isHyperActive;

        // `now` MUST be the same clock the caller compares activeBuffs.hyper
        // against (GameCanvas's rAF `time`, i.e. performance.now()-based) —
        // NOT Date.now(). Mixing clocks here silently stomped the caller's
        // correct assignment right after it was made; it happened to still
        // evaluate truthy purely because epoch time is orders of magnitude
        // larger than performance.now() time, which is an accident of scale
        // to fix, not something to rely on.
        this.activeBuffs.hyper = isHyperActive ? now + hyperRemaining : 0;

        if (isShootingNow && !this.isShooting) {
            this.triggerShoot();
        }
        if (this.shootTimer > 0) {
            this.shootTimer -= dt60;
            if (this.shootTimer <= 0) {
                this.shootTimer = 0;
                this.isShooting = false;
            }
        }

        if (this.blinkTimer > 0) {
            this.blinkTimer -= dt60;
            if (this.blinkTimer <= 0) {
                this.blinkTimer = 0;
                this.isBlinking = false;
            }
        }

        if (this.isGatlingMode) {
            this.gatlingAnimTimer += dt60;
        } else {
            this.gatlingAnimTimer = 0;
        }
        if (this.isGatlingDeactivating) {
            this.gatlingDeactivateTimer += dt60;
        }

        if (this.isMoving) {
            this.animTimer += dt60;
            this.idleTimer = 0;
            this.isBlinking = false;
            this.blinkTimer = 0;
        } else {
            this.animTimer = 0;
            this.idleTimer += dt60;
            if (!this.isBlinking && this.idleTimer >= this.nextBlinkThreshold) {
                this.isBlinking = true;
                this.blinkTimer = this.blinkDuration;
                this.idleTimer = 0;
                this.nextBlinkThreshold = 150 + Math.random() * 240;
            }
        }
    }

    canShoot(): boolean {
        return !this.isReloading && !this.isChargingZPG && (this.isGatlingMode ? this.gatlingAmmo > 0 : this.ammo > 0);
    }

    startReload(currentTime: number): void {
        if (this.isReloading || this.isGatlingMode || this.isChargingZPG || this.ammo === this.maxAmmo) return;
        this.isReloading = true;
        this.reloadStartTime = currentTime;

        if (this.classType === 'peashooter') {
            this.queueSound('reload');
            this.queueSound('reload_vo');
        }
    }

    updateReload(currentTime: number): void {
        if (!this.isReloading) return;
        if (currentTime - this.reloadStartTime >= this.config.weapon.reloadDuration) {
            this.ammo = this.maxAmmo;
            this.isReloading = false;
        }
    }

    exitGatlingMode(currentTime: number): void {
        if (!this.isGatlingMode) return;
        this.isGatlingMode = false;
        this.gatlingAmmo = 0;
        this.cooldowns['F'] = currentTime + this.config.abilities.ability3.cooldown;
        this.queueSound('gatling_unroot');

        // Play the activation animation backwards instead of snapping
        // straight back to the regular idle/walk sprite.
        this.isGatlingDeactivating = true;
        this.gatlingDeactivateTimer = 0;
    }

    triggerAbility(
        slot: 'Q' | 'E' | 'F',
        currentTime: number,
        mousePos: Vector2D,
        _projectiles: Projectile[],
        chiliBeans: ChiliBean[],
        stinkGrenades: StinkGrenade[],
        structures: MapStructure[] = [],
        genEntityId?: () => string
    ): boolean {
        if (this.cooldowns[slot] > currentTime || this.isChargingZPG) return false;

        const ability =
            slot === 'Q' ? this.config.abilities.ability1 :
                slot === 'E' ? this.config.abilities.ability2 :
                    this.config.abilities.ability3;

        if (this.isGatlingMode && ability.id !== 'pea_gatling') return false;

        if (ability.id === 'hyper') {
            // Hyper's cooldown starts when the buff ENDS, not when it's activated —
            // same rule as Pea Gatling (see exitGatlingMode / the wasHyperActive
            // check in update() below), matching the original game. Guard against
            // re-triggering while already active: without an immediate cooldown
            // there's nothing else stopping a re-press from refreshing the buff.
            if (this.activeBuffs.hyper > currentTime) return false;
            this.activeBuffs.hyper = currentTime + (ability.duration || 6000);
            this.queueSound('hyper_on_vo');
            this.queueSound('hyper_start');
            return true;
        }
        else if (ability.id === 'pea_gatling') {
            if (this.isGatlingMode) {
                this.exitGatlingMode(currentTime);
            } else {
                this.isGatlingMode = true;
                this.gatlingAmmo = 100;
                this.isReloading = false;
                this.gatlingAnimTimer = 0;
                this.isGatlingDeactivating = false;
                this.queueSound('gatling_root');
            }
            return true;
        }
        else if (ability.id === 'chili_bean') {
            const maxThrowRange = 220 + this.z * 1.2;

            const projected = projectThrowTarget(mousePos, structures);
            const dx = projected.targetX - this.x;
            const dy = projected.targetY - this.y;
            const dist = Math.hypot(dx, dy);

            const actualDist = Math.min(dist, maxThrowRange);
            const angle = Math.atan2(dy, dx);
            const targetX = this.x + Math.cos(angle) * actualDist;
            const targetY = this.y + Math.sin(angle) * actualDist;

            chiliBeans.push({
                id: genEntityId?.(),
                team: this.team,
                x: this.x,
                y: this.y,
                startX: this.x,
                startY: this.y,
                startZ: this.z,
                targetX,
                targetY,
                progress: 0,
                flightSpeed: Math.max(0.02, 12 / (actualDist || 1)),
                arcHeight: Math.min(14, 5 + actualDist * 0.04),
                z: this.z,
                isLanded: false,
                fuseTimer: 2500,
                radius: 12,
                damage: 100,
                explosionRadius: 120,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() * 0.15 + 0.1) * (Math.random() < 0.5 ? 1 : -1),
            });
            this.queueSound('chili_fire');
            this.queueSound('chili_vo');
        }
        else if (ability.id === 'rocket_jump') {
            this.isRocketJumping = true;
            this.z = Math.max(this.z, 2);
            this.vz = 12.5;
            this.jumpVx = Math.cos(this.angle) * 7;
            this.jumpVy = Math.sin(this.angle) * 7;
        }
        else if (ability.id === 'stink_cloud') {
            const maxThrowRange = 400 + this.z * 2.5;

            const projected = projectThrowTarget(mousePos, structures);
            const dx = projected.targetX - this.x;
            const dy = projected.targetY - this.y;
            const dist = Math.hypot(dx, dy);

            const actualDist = Math.min(dist, maxThrowRange);
            const angle = Math.atan2(dy, dx);
            const targetX = this.x + Math.cos(angle) * actualDist;
            const targetY = this.y + Math.sin(angle) * actualDist;

            stinkGrenades.push({
                id: genEntityId?.(),
                team: this.team,
                x: this.x,
                y: this.y,
                startX: this.x,
                startY: this.y,
                startZ: this.z,
                targetX,
                targetY,
                progress: 0,
                flightSpeed: Math.max(0.02, 14 / (actualDist || 1)),
                arcHeight: Math.min(120, actualDist * 0.3),
                z: this.z,
            });
        }
        else if (ability.id === 'zpg') {
            this.isChargingZPG = true;
            this.zpgStartTime = currentTime;
            this.cooldowns[slot] = currentTime + ability.cooldown;
            return true;
        }

        this.cooldowns[slot] = currentTime + ability.cooldown;
        return true;
    }

    update(
        keys: KeysState,
        mousePos: Vector2D,
        mapBounds: MapBounds,
        currentTime: number,
        projectiles: Projectile[],
        structures: MapStructure[] = [],
        targets: TargetDummy[] = [],
        dt60: number = 1,
        // Separate from `targets` above on purpose: `targets` also drives the
        // pushable-cylinder collision loop below, which physically shoves
        // whatever's in it — real players already get their own collision
        // pass via resolvePlayerCollisions() in room.ts, so mixing them into
        // `targets` would shove them a second time, redundantly and out of
        // sync with that pass. This one is read-only (see calculateTargetZ)
        // and exists purely so height-assisted aiming can lock onto players,
        // not just dummies.
        aimAssistTargets: AimTarget[] = []
    ): void {
        if (this.shootTimer > 0) {
            this.shootTimer -= dt60;
            if (this.shootTimer <= 0) {
                this.shootTimer = 0;
                this.isShooting = false;
            }
        }

        if (this.blinkTimer > 0) {
            this.blinkTimer -= dt60;
            if (this.blinkTimer <= 0) {
                this.blinkTimer = 0;
                this.isBlinking = false;
            }
        }

        if (this.isGatlingMode) {
            this.gatlingAnimTimer += dt60;
        } else {
            this.gatlingAnimTimer = 0;
        }
        if (this.isGatlingDeactivating) {
            this.gatlingDeactivateTimer += dt60;
        }

        const { targetZ, aimDist, overrideAngle } = this.calculateTargetZ(mousePos, [...targets, ...aimAssistTargets], structures);

        if (this.isChargingZPG) {
            if (currentTime - this.zpgStartTime >= this.zpgWindupDuration) {
                const zpgWeapon: WeaponConfig = {
                    name: 'ZPG',
                    maxAmmo: 1,
                    fireRate: 0,
                    reloadDuration: 0,
                    projectileSpeed: 20,
                    directDamage: 110,
                    splashDamage: 40,
                    splashRadius: 80,
                    maxRange: 900,
                    falloffStartDistance: 900,
                    minDamage: 110,
                    projectileRadius: 8,
                    projectileColor: '#FF3D00',
                };
                const fireAngle = overrideAngle !== undefined ? overrideAngle : this.angle;
                projectiles.push(new Projectile(this.x, this.y, fireAngle, zpgWeapon, this.team, this.z, aimDist, targetZ));
                this.isChargingZPG = false;
            }
        }

        const isHyperActive = this.activeBuffs.hyper > currentTime;
        const currentSpeed = this.speed * (isHyperActive ? 1.5 : 1.0);

        let dx = 0;
        let dy = 0;
        if (keys['w'] || keys['W']) dy -= 1;
        if (keys['s'] || keys['S']) dy += 1;
        if (keys['a'] || keys['A']) dx -= 1;
        if (keys['d'] || keys['D']) dx += 1;

        this.isMoving = (dx !== 0 || dy !== 0) && !this.isGatlingMode && !this.isChargingZPG;

        let nextX = this.x;
        let nextY = this.y;

        if (this.isRocketJumping) {
            nextX += this.jumpVx * dt60;
            nextY += this.jumpVy * dt60;
        } else if (this.isMoving) {
            if (dx !== 0 && dy !== 0) {
                dx *= 0.7071;
                dy *= 0.7071;
            }
            nextX += dx * currentSpeed * dt60;
            nextY += dy * currentSpeed * dt60;
        }

        const ROOF_SNAP_TOLERANCE = 15;
        const currentGroundZ = computeGroundZ(nextX, nextY, this.z, this.radius, structures, ROOF_SNAP_TOLERANCE);

        const jumpCooldown = isHyperActive ? 1200 : this.baseJumpCooldown;
        const spacePressed = keys[' '] || keys['Space'] || keys['space'];

        if (this.wasHyperActive && !isHyperActive) {
            // Hyper just ended naturally — the only place its cooldown starts,
            // mirroring exitGatlingMode's "cooldown begins on end, not on
            // activation" behavior.
            this.cooldowns['E'] = currentTime + this.config.abilities.ability2.cooldown;
            if (this.classType === 'peashooter') {
                this.queueSound('hyper_stop');
            }
        }
        this.wasHyperActive = isHyperActive;

        if (this.isMoving) {
            const prevStep = Math.floor(this.animTimer / 7);
            this.animTimer += dt60;
            const currStep = Math.floor(this.animTimer / 7);
            if (this.classType === 'peashooter' && currStep !== prevStep && currStep % 2 === 0) {
                this.queueSound('cloth', 0.2, 0.08);
            }
            // moving cancels any in-progress blink immediately
            this.idleTimer = 0;
            this.isBlinking = false;
            this.blinkTimer = 0;
        } else {
            this.animTimer = 0;

            if (!this.isShooting) {
                this.idleTimer += dt60;
                if (!this.isBlinking && this.idleTimer >= this.nextBlinkThreshold) {
                    this.isBlinking = true;
                    this.blinkTimer = this.blinkDuration;
                    this.idleTimer = 0;
                    this.nextBlinkThreshold = 150 + Math.random() * 240;
                }
            }
        }

        if (spacePressed && !this.isGatlingMode && this.z <= currentGroundZ && (currentTime - this.lastJumpTime >= jumpCooldown)) {
            this.lastJumpTime = currentTime;
            this.vz = isHyperActive ? 12.5 : 6.0;
            if (isHyperActive && this.classType === 'peashooter') {
                this.queueSound('hyper_vo');
                this.queueSound('hyper_start');
            }
        }

        if (this.z > currentGroundZ || this.vz !== 0) {
            this.z += this.vz * dt60;
            this.vz -= 0.6 * dt60;
            if (this.z <= currentGroundZ) {
                this.z = currentGroundZ;
                this.vz = 0;
                this.isRocketJumping = false;
            }
        }

        // Recorded for draw() — see the groundZ field comment above.
        this.groundZ = currentGroundZ;

        {
            const resolved = resolveWallCollision(nextX, nextY, this.z, this.radius, structures);
            nextX = resolved.x;
            nextY = resolved.y;
        }

        // Cylinder collision vs Target Dummies (Pushable)
        for (const target of targets) {
            if (target.isDead) continue;

            // Check if player and dummy are on similar vertical levels
            if (Math.abs(this.z - target.z) <= 25) {
                const dx = nextX - target.x;
                const dy = nextY - target.y;
                const dist = Math.hypot(dx, dy);
                const minDist = this.radius + target.radius;

                if (dist < minDist) {
                    const overlap = minDist - dist;
                    if (dist > 0) {
                        // 50/50 displacement split
                        const pushX = (dx / dist) * (overlap * 0.5);
                        const pushY = (dy / dist) * (overlap * 0.5);

                        // Push player out
                        nextX += pushX;
                        nextY += pushY;

                        // Push dummy away
                        target.x -= pushX;
                        target.y -= pushY;
                    } else {
                        // Fallback for exact center overlap
                        nextX += minDist * 0.5;
                        target.x -= minDist * 0.5;
                    }

                    // Re-resolve both the player and the dummy against walls —
                    // this pushback bypasses normal movement, so without this
                    // either side could get shoved straight through a wall.
                    const resolvedPlayer = resolveWallCollision(nextX, nextY, this.z, this.radius, structures);
                    nextX = resolvedPlayer.x;
                    nextY = resolvedPlayer.y;

                    const resolvedTarget = resolveWallCollision(target.x, target.y, target.z, target.radius, structures);
                    target.x = resolvedTarget.x;
                    target.y = resolvedTarget.y;

                    // Clamp dummy to map boundaries so they aren't pushed out of bounds
                    target.x = Math.max(target.radius, Math.min(mapBounds.width - target.radius, target.x));
                    target.y = Math.max(target.radius, Math.min(mapBounds.height - target.radius, target.y));
                }
            }
        }
        
        this.x = Math.max(this.radius, Math.min(mapBounds.width - this.radius, nextX));
        this.y = Math.max(this.radius, Math.min(mapBounds.height - this.radius, nextY));

        this.angle = overrideAngle !== undefined ? overrideAngle : getAngle(this.x, this.y, mousePos.x, mousePos.y);
    }

    draw(ctx: CanvasRenderingContext2D, sprites?: CharacterSprites | HTMLImageElement[] | null): void {
        const scale = 1 + this.z * Z_HEIGHT_SCALE;
        const visualYOffset = -this.z * VISUAL_Y_FACTOR;

        ctx.save();
        ctx.translate(this.x, this.y + visualYOffset);

        // Drop Shadow. Two corrections stacked here:
        //
        // 1. FEET_OFFSET: the sprite artwork is drawn centered on this local
        //    origin (spans -renderSize/2 to +renderSize/2 below), so a shadow
        //    at y=0 lands in the middle of the character — behind the body,
        //    not below the feet — and is invisible even standing on flat
        //    ground. Push it down toward the bottom of the sprite's bounds.
        //    (Tuned by eye — adjust the multiplier if it still looks off.)
        //
        // 2. heightAboveGround: separation should come from how far the
        //    character is airborne above whatever it's currently standing on
        //    (this.groundZ), not from raw z. Raw z includes the height of the
        //    surface itself, so a character resting still atop a tall roof
        //    would otherwise show its shadow shoved all the way down to
        //    world-ground instead of sitting right at its own feet.
        const FEET_OFFSET = this.radius * 1.1;
        const heightAboveGround = this.z - this.groundZ;
        // Shadow shrinks the higher off the ground it is — a shadow directly
        // underfoot is close to full size, but as the character gets further
        // away from whatever they're standing on, it tightens up toward the
        // point it'd be cast from, same as any drop shadow. Tuned so a normal
        // jump (apex ~30) visibly shrinks it to about half size.
        const shadowScale = Math.max(0.35, 1 - heightAboveGround * 0.018);
        ctx.beginPath();
        ctx.ellipse(
            0, FEET_OFFSET + heightAboveGround * VISUAL_Y_FACTOR,
            this.radius * 1.15 * shadowScale, this.radius * 0.6 * shadowScale,
            0, 0, Math.PI * 2
        );
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fill();

        ctx.scale(scale, scale);

        const dirInfo = get8WayDirection(this.angle);

        let upSprites: HTMLImageElement[] | null = null;
        let sideSprites: HTMLImageElement[] | null = null;
        let diagonalSprites: HTMLImageElement[] | null = null;
        let diagonalDownSprites: HTMLImageElement[] | null = null;
        let downSprites: HTMLImageElement[] | null = null;

        if (sprites) {
            if (Array.isArray(sprites)) {
                upSprites = sprites;
            } else {
                const isShoot = this.isShooting;
                const isBlink = this.isBlinking && !isShoot;
                const dict = sprites as Record<string, HTMLImageElement[] | undefined>;

                const getSpriteSet = (shootKey: string, baseKey: string, blinkKey?: string): HTMLImageElement[] | null => {
                    if (isShoot) {
                        if (dict[shootKey] && dict[shootKey]!.length > 0) return dict[shootKey]!;
                        if (dict.shoot && dict.shoot.length > 0) return dict.shoot;
                    }
                    if (isBlink && blinkKey) {
                        if (dict[blinkKey] && dict[blinkKey]!.length > 0) return dict[blinkKey]!;
                        if (dict.blink && dict.blink.length > 0) return dict.blink;
                    }
                    return dict[baseKey] || null;
                };

                upSprites = getSpriteSet('upShoot', 'up'); // no blinkKey — up never blinks
                sideSprites = getSpriteSet('sideShoot', 'side', 'sideBlink') || getSpriteSet('sideShoot', 'right', 'sideBlink');
                diagonalSprites = getSpriteSet('diagonalShoot', 'diagonal', 'diagonalBlink');
                diagonalDownSprites = getSpriteSet('diagonalDownShoot', 'diagonalDown', 'diagonalDownBlink');
                downSprites = getSpriteSet('downShoot', 'down', 'downBlink');
            }
        }

        let activeSpriteSet: HTMLImageElement[] | null = null;
        let needsFallbackRotation = false;

        switch (dirInfo.direction) {
            case 'E':
            case 'W':
                if (sideSprites && sideSprites.length > 0) {
                    activeSpriteSet = sideSprites;
                } else {
                    activeSpriteSet = upSprites;
                    needsFallbackRotation = true;
                }
                break;
            case 'NE':
            case 'NW':
                if (diagonalSprites && diagonalSprites.length > 0) {
                    activeSpriteSet = diagonalSprites;
                } else if (sideSprites && sideSprites.length > 0) {
                    activeSpriteSet = sideSprites;
                } else {
                    activeSpriteSet = upSprites;
                }
                break;
            case 'SE':
            case 'SW':
                if (diagonalDownSprites && diagonalDownSprites.length > 0) {
                    activeSpriteSet = diagonalDownSprites;
                } else if (downSprites && downSprites.length > 0) {
                    activeSpriteSet = downSprites;
                } else if (diagonalSprites && diagonalSprites.length > 0) {
                    activeSpriteSet = diagonalSprites;
                } else if (sideSprites && sideSprites.length > 0) {
                    activeSpriteSet = sideSprites;
                } else {
                    activeSpriteSet = upSprites;
                }
                break;
            case 'S':
                if (downSprites && downSprites.length > 0) {
                    activeSpriteSet = downSprites;
                } else if (diagonalDownSprites && diagonalDownSprites.length > 0) {
                    activeSpriteSet = diagonalDownSprites;
                } else {
                    activeSpriteSet = upSprites;
                    needsFallbackRotation = true;
                }
                break;
            case 'N':
            default:
                activeSpriteSet = upSprites;
                break;
        }

        let activeSprite: HTMLImageElement | null = null;

        if (activeSpriteSet && activeSpriteSet.length > 0) {
            if (this.isShooting) {
                const frameIdx = Math.floor((12 - this.shootTimer) / Math.max(1, 12 / activeSpriteSet.length)) % activeSpriteSet.length;
                activeSprite = activeSpriteSet[frameIdx];
            } else if (this.isBlinking && dirInfo.direction !== 'N' && activeSpriteSet.length > 1) {
                const blinkFrameIdx = Math.floor((this.blinkDuration - this.blinkTimer) / Math.max(1, this.blinkDuration / activeSpriteSet.length)) % activeSpriteSet.length;
                activeSprite = activeSpriteSet[blinkFrameIdx];
            } else if (this.isMoving && activeSpriteSet.length >= 3) {
                const ticksPerFrame = 7;
                const cycleStep = Math.floor(this.animTimer / ticksPerFrame) % 4;
                const frameSequence = [activeSpriteSet[1], activeSpriteSet[0], activeSpriteSet[2], activeSpriteSet[0]];
                activeSprite = frameSequence[cycleStep];
            } else {
                activeSprite = activeSpriteSet[0];
            }
        }

        // Pea Gatling stance (and its exit transition) overrides whatever the
        // regular directional selection above came up with. NE/NW, E/W, and
        // now SE/SW all have their own art (see pickFacingOrUp below); only
        // N and S still fall back to the "up" view — S via the same rotation
        // trick used elsewhere for missing side/down sprites, rather than
        // leaving it undrawn.
        if ((this.isGatlingMode || this.isGatlingDeactivating) && sprites && !Array.isArray(sprites)) {
            const dict = sprites as Record<string, HTMLImageElement[] | undefined>;

            // NE/NW, E/W, and SE/SW each have their own gatling art now.
            // Mirrors the regular walk/shoot dispatch above, which reuses a
            // single "diagonal" set for both NE and NW, a single "side" set
            // for both E and W, and a single "diagonalDown" set for both SE
            // and SW — the horizontal flip for NW/W/SW comes for free from
            // the shared ctx.scale(dirInfo.scaleX, ...) call at the end of
            // draw(), so one asset set covers each mirrored pair.
            const isDiagonalFacing = dirInfo.direction === 'NE' || dirInfo.direction === 'NW';
            const isSideFacing = dirInfo.direction === 'E' || dirInfo.direction === 'W';
            const isDiagonalDownFacing = dirInfo.direction === 'SE' || dirInfo.direction === 'SW';
            const pickFacingOrUp = (facingKey: string, upKey: string): HTMLImageElement[] | undefined => {
                if (isDiagonalFacing || isSideFacing || isDiagonalDownFacing) {
                    const facingSet = dict[facingKey];
                    if (facingSet && facingSet.length > 0) return facingSet;
                }
                return dict[upKey];
            };

            const gatlingFacingKey = (side: string, diagonal: string, diagonalDown: string): string =>
                isSideFacing ? side : isDiagonalDownFacing ? diagonalDown : diagonal;

            const gatlingIdle = pickFacingOrUp(gatlingFacingKey('gatlingSide', 'gatlingDiagonal', 'gatlingDiagonalDown'), 'gatlingUp');
            const gatlingFiring = pickFacingOrUp(gatlingFacingKey('gatlingFiringSide', 'gatlingFiringDiagonal', 'gatlingFiringDiagonalDown'), 'gatlingFiringUp');
            const gatlingActivation = pickFacingOrUp(gatlingFacingKey('gatlingActivationSide', 'gatlingActivationDiagonal', 'gatlingActivationDiagonalDown'), 'gatlingActivationUp');

            // Only relevant for the one facing still standing in on the "up"
            // art (S) — NE/NW, E/W, and SE/SW have real art now (same as
            // they always did for walk/shoot), so none of those three pairs
            // goes through this rotation trick anymore.
            needsFallbackRotation = dirInfo.direction === 'S';

            const ACTIVATION_TICKS_PER_FRAME = 4;
            const activationFrameCount = gatlingActivation?.length ?? 0;
            const activationDuration = activationFrameCount * ACTIVATION_TICKS_PER_FRAME;

            if (this.isGatlingMode) {
                if (gatlingActivation && activationFrameCount > 0 && this.gatlingAnimTimer < activationDuration) {
                    // One-shot root-down transition — plays through once, then
                    // settles into the idle/firing loop below.
                    const frameIdx = Math.min(
                        activationFrameCount - 1,
                        Math.floor(this.gatlingAnimTimer / ACTIVATION_TICKS_PER_FRAME)
                    );
                    activeSprite = gatlingActivation[frameIdx];
                } else if (this.isShooting && gatlingFiring && gatlingFiring.length > 0 && gatlingIdle && gatlingIdle.length > 0) {
                    // Flickers between the resting pose and the firing pose,
                    // faster than the regular idle loop, for a rapid-fire look.
                    const FIRING_TICKS_PER_FRAME = 3;
                    const settledTimer = this.gatlingAnimTimer - activationDuration;
                    const flicker = Math.floor(Math.max(0, settledTimer) / FIRING_TICKS_PER_FRAME) % 2;
                    activeSprite = flicker === 0 ? gatlingIdle[0] : gatlingFiring[0];
                } else if (gatlingIdle && gatlingIdle.length > 0) {
                    // Rooted but not firing — simple looping idle sequence, since
                    // isMoving is always false in gatling mode (nothing else
                    // would otherwise animate it).
                    const IDLE_TICKS_PER_FRAME = 9;
                    const settledTimer = this.gatlingAnimTimer - activationDuration;
                    const frameIdx = Math.floor(Math.max(0, settledTimer) / IDLE_TICKS_PER_FRAME) % gatlingIdle.length;
                    activeSprite = gatlingIdle[frameIdx];
                }
            } else if (this.isGatlingDeactivating) {
                // "Un-rooting" — the same activation frames, played back to
                // front. Ends itself once it's played all the way through;
                // from that point on this whole block stops matching (both
                // isGatlingMode and isGatlingDeactivating are false) and the
                // regular directional sprite picked above shows through.
                if (gatlingActivation && activationFrameCount > 0 && this.gatlingDeactivateTimer < activationDuration) {
                    const frameIdx = Math.max(
                        0,
                        activationFrameCount - 1 - Math.floor(this.gatlingDeactivateTimer / ACTIVATION_TICKS_PER_FRAME)
                    );
                    activeSprite = gatlingActivation[frameIdx];
                } else {
                    this.isGatlingDeactivating = false;
                }
            }
        }

        if (activeSprite && activeSprite.complete && activeSprite.naturalWidth !== 0) {
            const renderSize = this.radius * 3.55;

            ctx.save();
            ctx.scale(dirInfo.scaleX, dirInfo.scaleY);

            if (needsFallbackRotation && dirInfo.fallbackRotation !== 0) {
                ctx.rotate(dirInfo.fallbackRotation);
            }

            ctx.drawImage(
                activeSprite,
                -renderSize / 2,
                -renderSize / 2,
                renderSize,
                renderSize
            );

            ctx.restore();
        }

        ctx.restore();
    }

    isDead: boolean = false;
    respawnTimer: number = 0;

    takeDamage(amount: number): boolean {
        if (this.isDead) return false;
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.respawnTimer = Date.now();
            return true;
        }
        return false;
    }

    // currentTime/respawnTimer are Date.now()-based (server clock) — this only
    // ever runs server-side, never on a client's local Player copy.
    checkRespawn(currentTime: number, respawnDelayMs: number, spawnX: number, spawnY: number): void {
        if (this.isDead && currentTime - this.respawnTimer > respawnDelayMs) {
            this.isDead = false;
            this.health = this.maxHealth;
            this.x = spawnX;
            this.y = spawnY;
            this.z = 0;
            this.vz = 0;
        }
    }
}

export class Projectile {
    id: string;
    x: number;
    y: number;
    startX: number;
    startY: number;
    vx: number;
    vy: number;
    team: Team;
    weapon: WeaponConfig;
    toRemove: boolean = false;
    isExpired: boolean = false;
    alpha: number = 1.0;

    startZ: number;
    targetZ: number;
    currentZ: number;
    zRate: number;

    constructor(
        x: number,
        y: number,
        angle: number,
        weapon: WeaponConfig,
        team: Team,
        startZ: number = 0,
        aimDistance: number = 220,
        targetZ: number = 0,
        id?: string
    ) {
        // Falls back to a locally-generated id when none is supplied — keeps every
        // existing `new Projectile(...)` call site compiling untouched. The server
        // will pass a real one once shooting logic moves there; until then this
        // fallback is only ever seen client-side in single-player, where it's never
        // networked and never needs to be stable across frames.
        this.id = id ?? `local_${Math.random().toString(36).slice(2, 10)}`;

        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        this.weapon = weapon;
        this.team = team;

        this.startZ = startZ + BARREL_HEIGHT;
        this.targetZ = targetZ;
        this.currentZ = this.startZ;

        const validAimDist = Math.max(20, aimDistance);
        this.zRate = (this.targetZ - this.startZ) / validAimDist;

        this.vx = Math.cos(angle) * weapon.projectileSpeed;
        this.vy = Math.sin(angle) * weapon.projectileSpeed;
    }

    getCalculatedDamage(): number {
        const dist = Math.hypot(this.x - this.startX, this.y - this.startY);
        if (dist <= this.weapon.falloffStartDistance) return this.weapon.directDamage;
        const falloffSpan = this.weapon.maxRange - this.weapon.falloffStartDistance;
        if (falloffSpan <= 0) return this.weapon.directDamage;

        const excess = Math.min(dist - this.weapon.falloffStartDistance, falloffSpan);
        const ratio = excess / falloffSpan;
        const damage = this.weapon.directDamage - ratio * (this.weapon.directDamage - this.weapon.minDamage);
        return Math.max(this.weapon.minDamage, Math.round(damage));
    }

    update(mapBounds: MapBounds, dt60: number = 1): void {
        this.x += this.vx * dt60;
        this.y += this.vy * dt60;

        const dist = Math.hypot(this.x - this.startX, this.y - this.startY);
        this.currentZ = this.startZ + this.zRate * dist;

        if (this.currentZ < 0) {
            this.currentZ = 0;
            this.isExpired = true;
        }

        if (
            this.x < 0 || this.x > mapBounds.width ||
            this.y < 0 || this.y > mapBounds.height ||
            dist >= this.weapon.maxRange
        ) {
            this.isExpired = true;
        }
    }

    draw(ctx: CanvasRenderingContext2D, sprite?: HTMLImageElement | null): void {
        const scale = Math.max(0.2, 1 + this.currentZ * Z_HEIGHT_SCALE);
        const renderedRadius = Math.max(1, this.weapon.projectileRadius * scale);
        const visualYOffset = -this.currentZ * VISUAL_Y_FACTOR;
        const drawY = this.y + visualYOffset;

        ctx.save();
        ctx.globalAlpha = this.alpha;

        if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
            const size = renderedRadius * 2;
            ctx.drawImage(sprite, this.x - renderedRadius, drawY - renderedRadius, size, size);
        } else {
            ctx.beginPath();
            ctx.arc(this.x, drawY, renderedRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.weapon.projectileColor;
            ctx.fill();
        }

        ctx.restore();
    }
}

export class TargetDummy {
    x: number;
    y: number;
    z: number = 0;
    vz: number = 0;
    // Same purpose as Player.groundZ — the height of the surface currently
    // underfoot, so the shadow separates from a jump/fall rather than from
    // absolute world-ground (a dummy resting on the z:100 roof needs its
    // shadow right at its own feet, not cast all the way down to y=0).
    groundZ: number = 0;
    radius: number = 20;
    health: number = 125;
    maxHealth: number = 125;
    team: Team = 'zombies';
    isDead: boolean = false;
    respawnTimer: number = 0;

    // Optional aim-training behavior: hops in place on a fixed cadence
    // instead of standing still. Off by default so the existing static
    // dummies (rooftop + ground) are unaffected — only a dummy explicitly
    // constructed with autoJump=true does this.
    readonly autoJump: boolean;
    jumpTimer: number = 0;

    // Original placement, captured once at construction. x/y drift away from
    // this over the dummy's life (pushed by players, chili beans, etc.), so
    // respawn needs its own copy to snap back to rather than reusing x/y.
    readonly spawnX: number;
    readonly spawnY: number;
    readonly spawnZ: number;

    constructor(x: number, y: number, team: Team = 'zombies', z: number = 0, autoJump: boolean = false) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.groundZ = z;
        this.team = team;
        this.autoJump = autoJump;
        this.spawnX = x;
        this.spawnY = y;
        this.spawnZ = z;
    }

    takeDamage(amount: number): boolean {
        if (this.isDead) return false;
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isDead = true;
            this.respawnTimer = Date.now();
            return true;
        }
        return false;
    }
    
    update(structures: MapStructure[] = [], dt60: number = 1): void {
        if (this.isDead) {
            if (Date.now() - this.respawnTimer > 3000) {
                this.isDead = false;
                this.health = this.maxHealth;
                this.x = this.spawnX;
                this.y = this.spawnY;
                this.z = this.spawnZ;
                this.vz = 0;
                this.groundZ = this.spawnZ;
                this.jumpTimer = 0;
            }
            return;
        }

        // Gravity — mirrors Player.update()'s ground-height/fall logic, so a
        // dummy shoved off a ledge (or otherwise left mid-air) actually drops
        // instead of staying suspended at whatever z it last had.
        const currentGroundZ = computeGroundZ(this.x, this.y, this.z, this.radius, structures);

        if (this.autoJump) {
            this.jumpTimer += dt60;
            const JUMP_INTERVAL_TICKS = 60; // ~1 second at the game's 60fps-normalized dt60
            const JUMP_VELOCITY = 6.0;      // same as Player's regular (non-Hyper) jump
            // Gate on being grounded so this can't stack onto an in-flight
            // jump — irrelevant at a 1s cadence against this jump's ~0.33s
            // airtime, but keeps it well-behaved if either number changes.
            if (this.jumpTimer >= JUMP_INTERVAL_TICKS && this.z <= currentGroundZ) {
                this.vz = JUMP_VELOCITY;
                this.jumpTimer = 0;
            }
        }

        if (this.z > currentGroundZ || this.vz !== 0) {
            this.z += this.vz * dt60;
            this.vz -= 0.6 * dt60;
            if (this.z <= currentGroundZ) {
                this.z = currentGroundZ;
                this.vz = 0;
            }
        }

        this.groundZ = currentGroundZ;
    }

    draw(ctx: CanvasRenderingContext2D): void {
        if (this.isDead) return;

        const scale = 1 + this.z * Z_HEIGHT_SCALE;
        const visualYOffset = -this.z * VISUAL_Y_FACTOR;

        ctx.save();
        ctx.translate(this.x, this.y + visualYOffset);

        // Drop Shadow — height above whatever it's currently resting on
        // (this.groundZ), same reasoning as Player.draw(). A dummy standing
        // still on the z:100 roof needs its shadow right at its own feet,
        // not shoved all the way down toward world-ground. It's drawn as a
        // plain circle at the local origin (no sprite art extending past it
        // like the player), so no separate feet-offset is needed here.
        const heightAboveGround = this.z - this.groundZ;
        const shadowScale = Math.max(0.35, 1 - heightAboveGround * 0.018);
        ctx.beginPath();
        ctx.ellipse(0, heightAboveGround * VISUAL_Y_FACTOR, this.radius * 1.15 * shadowScale, this.radius * 0.6 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fill();

        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.team === 'zombies' ? '#9C27B0' : '#4CAF50';
        ctx.fill();
        ctx.strokeStyle = this.team === 'zombies' ? '#4A148C' : '#1B5E20';
        ctx.lineWidth = 3;
        ctx.stroke();

        const healthRatio = this.health / this.maxHealth;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-18, -32, 36, 5);
        ctx.fillStyle = healthRatio > 0.5 ? '#4CAF50' : '#F44336';
        ctx.fillRect(-18, -32, 36 * healthRatio, 5);

        ctx.restore();
    }
}
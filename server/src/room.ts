// server/src/room.ts
import { Server, Socket } from 'socket.io';
import { Player, TargetDummy } from '../../shared/src/engine';
import {
    createRoomState, createIdGenerator, updateShooting,
    updateChiliBeans, updateStinkGrenades, updateStinkClouds,
    updateProjectiles, updateExplosions, resolvePlayerCollisions,
    RoomState,
} from '../../shared/src/simulation';
import { MapBounds, MapStructure } from '../../shared/src/types/game';
import { ClientJoinMessage, ClientInputMessage, ClientAbilityMessage, ClientSwitchClassMessage, ServerSnapshotMessage } from '../../shared/src/types/network';

const TICK_RATE = 30;

const mapBounds: MapBounds = { width: 1000, height: 700 };

const structures: MapStructure[] = [
    {
        id: 'building_rooftop', x: 120, y: 120, width: 160, height: 160, z: 100,
        type: 'building', color: '#37474F', topColor: '#546E7A', label: 'Roof (Z: 100)',
    },
    {
        id: 'low_wall', x: 550, y: 180, width: 28, height: 340, z: 20,
        type: 'wall', color: '#4E342E', topColor: '#6D4C41', label: 'Wall (Z: 20)',
    },
];

const dummies: TargetDummy[] = [
    new TargetDummy(200, 200, 'zombies', 100),
    new TargetDummy(750, 200, 'zombies', 0),
    // Aim trainer — ground level, hops in place once a second (see
    // TargetDummy's autoJump in engine.ts) so you can practice timing shots
    // against vertical movement without also needing height-assisted aiming.
    // Placed clear of both structures' footprints.
    new TargetDummy(475, 550, 'zombies', 0, true),
];

const genAbilityEntityId = createIdGenerator('ability');
const genStinkCloudId = createIdGenerator('cloud');
const genExplosionId = createIdGenerator('explosion');
const genProjectileId = createIdGenerator('proj');

const state: RoomState = createRoomState(mapBounds, structures, dummies);
const players = state.players;
const latestInputs = new Map<string, ClientInputMessage>();

export function startRoom(io: Server): void {
    io.on('connection', (socket: Socket) => {
        socket.on('join', (msg: ClientJoinMessage) => {
            const player = new Player(mapBounds.width / 2, mapBounds.height / 2, msg.selectedClass);
            players.set(socket.id, player);
            console.log(`[server] player joined: ${socket.id} as ${msg.selectedClass}`);
        });

        socket.on('input', (msg: ClientInputMessage) => {
            latestInputs.set(socket.id, msg);
        });

        socket.on('ability', (msg: ClientAbilityMessage) => {
            const player = players.get(socket.id);
            if (!player) return;
            const activated = player.triggerAbility(
                msg.slot,
                Date.now(),
                msg.mousePos,
                state.projectiles,
                state.chiliBeans,
                state.stinkGrenades,
                structures,
                genAbilityEntityId
            );
            // TEMP DEBUG — remove once confirmed.
            if (msg.slot === 'E') {
                console.log('[server][ability]', {
                    socketId: socket.id,
                    slot: msg.slot,
                    activated,
                    classType: player.classType,
                    hyperEndStamp: player.activeBuffs.hyper,
                    now: Date.now(),
                });
            }
        });

        socket.on('disconnect', () => {
            players.delete(socket.id);
            latestInputs.delete(socket.id);
            console.log(`[server] player left: ${socket.id}`);
        });

        socket.on('switchClass', (msg: ClientSwitchClassMessage) => {
            const existing = players.get(socket.id);
            const x = existing?.x ?? mapBounds.width / 2;
            const y = existing?.y ?? mapBounds.height / 2;
            const player = new Player(x, y, msg.selectedClass);
            players.set(socket.id, player);
            console.log(`[server] ${socket.id} switched class to ${msg.selectedClass}`);
        });
    });

    let tick = 0;

    setInterval(() => {
        const now = Date.now();
        const dt60 = 60 / TICK_RATE;
        const deltaMs = 1000 / TICK_RATE;

        const soundEvents: ServerSnapshotMessage['soundEvents'] = [];

        players.forEach((player, id) => {
            if (player.isDead) {
                const spawnX = player.team === 'plants' ? 150 : mapBounds.width - 150;
                player.checkRespawn(now, 3000, spawnX, mapBounds.height / 2);
                return;
            }

            // TEMP DEBUG — remove once confirmed.
            if (player.activeBuffs.hyper > now) {
                console.log('[server][tick] hyper active on', id, 'ends in', player.activeBuffs.hyper - now, 'ms');
            }

            const input = latestInputs.get(id);
            if (!input) return;

            // Same reasoning as updateShooting's copy of this filter: lets
            // height-assisted aiming (and the ZPG throw, which shares this
            // same calculateTargetZ call inside update()) lock onto an
            // elevated enemy player, not just dummies. Enemy-only, same as
            // there — no support ability exists yet that would want this to
            // lock onto a teammate.
            const otherPlayers = Array.from(players.values()).filter(
                (p) => p !== player && !p.isDead && p.team !== player.team
            );
            player.update(input.keys, input.mousePos, mapBounds, now, state.projectiles, structures, dummies, dt60, otherPlayers);
            player.updateReload(now);

            updateShooting(state, player, { keys: input.keys, mousePos: input.mousePos, isMouseDown: input.isMouseDown }, now, genProjectileId)
                .forEach((evt) => soundEvents.push({ playerId: id, ...evt }));

            player.consumePendingSounds().forEach((evt) => soundEvents.push({ playerId: id, ...evt }));
        });

        // Runs AFTER every player's own movement, so two players can't walk
        // through each other — same idea as structure collision, but between
        // players rather than against static geometry.
        resolvePlayerCollisions(state);

        updateChiliBeans(state, dt60, deltaMs, genExplosionId).forEach((evt) => soundEvents.push({ playerId: '', ...evt }));
        updateStinkGrenades(state, dt60, genStinkCloudId);
        updateStinkClouds(state, deltaMs);
        updateProjectiles(state, dt60, genExplosionId).forEach((evt) => soundEvents.push({ playerId: '', ...evt }));
        updateExplosions(state, dt60);

        // Pass structures + dt60 through so dummies fall/land the same way
        // players do, instead of staying pinned at whatever z they last had.
        dummies.forEach((dummy) => dummy.update(structures, dt60));

        const snapshot: ServerSnapshotMessage = {
            tick: tick++,
            serverTime: now,
            players: Array.from(players.entries()).map(([id, p]) => ({
                id,
                x: p.x, y: p.y, z: p.z, angle: p.angle,
                health: p.health, maxHealth: p.maxHealth,
                isDead: p.isDead,
                ammo: p.ammo, maxAmmo: p.maxAmmo,
                isReloading: p.isReloading,
                classType: p.classType,
                isMoving: p.isMoving,
                isShooting: p.isShooting,
                isBlinking: p.isBlinking,
                isGatlingMode: p.isGatlingMode,
                gatlingAmmo: p.gatlingAmmo,
                isHyperActive: p.activeBuffs.hyper > now,
                activeBuffs: { hyperRemaining: Math.max(0, p.activeBuffs.hyper - now) },
                lastProcessedInputSeq: latestInputs.get(id)?.seq ?? 0,
            })),
            dummies: dummies.map((d) => ({
                x: d.x, y: d.y, z: d.z,
                radius: d.radius,
                health: d.health, maxHealth: d.maxHealth,
                isDead: d.isDead,
                team: d.team,
            })),
            projectiles: state.projectiles.map((p) => ({
                id: p.id,
                x: p.x, y: p.y, currentZ: p.currentZ,
                team: p.team, alpha: p.alpha,
                weaponColor: p.weapon.projectileColor,
                weaponRadius: p.weapon.projectileRadius,
            })),
            chiliBeans: state.chiliBeans.map((b) => ({
                id: b.id, x: b.x, y: b.y, z: b.z, isLanded: b.isLanded, fuseTimer: b.fuseTimer, radius: b.radius,
            })),
            stinkGrenades: state.stinkGrenades.map((g) => ({ id: g.id, x: g.x, y: g.y, z: g.z })),
            stinkClouds: state.stinkClouds.map((c) => ({ id: c.id, x: c.x, y: c.y, z: c.z, radius: c.radius })),
            explosions: state.explosions.map((e) => ({
                id: e.id, x: e.x, y: e.y, z: e.z,
                currentRadius: e.currentRadius, alpha: e.alpha,
                type: e.type, angle: e.angle,
                impactStructureId: e.impactStructureId,
            })),
            hitEvents: state.pendingHitEvents,
            soundEvents,
        };


        io.emit('snapshot', snapshot);
        state.pendingHitEvents = [];
    }, 1000 / TICK_RATE);
}

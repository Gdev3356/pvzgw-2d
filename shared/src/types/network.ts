import { CharacterClass, Vector2D, KeysState } from './game';

// What a client sends, every input frame
export interface ClientJoinMessage {
    selectedClass: CharacterClass;
}

export interface ClientInputMessage {
    seq: number;
    keys: KeysState;
    mousePos: Vector2D;
    isMouseDown: boolean;
    isAimingRmb: boolean;
    timestamp: number;
}

// Sent once per actual key-press edge (Q/E/F down), not every tick —
// mirrors how the client already calls triggerAbility() from handleKeyDown.
export interface ClientAbilityMessage {
    slot: 'Q' | 'E' | 'F';
    mousePos: Vector2D;
    timestamp: number;
}

export interface ClientSwitchClassMessage {
    selectedClass: CharacterClass;
}

export interface HitEvent {
    x: number;
    y: number;
    damage: number;
    isSplash?: boolean;
}

// Was previously defined in src/utils/network.ts (the client's socket
// wrapper) and imported back into this file — backwards, since a type file
// shouldn't depend on a client-only, socket.io-client-carrying module. It
// lives here now, as the single source of truth used by both client and
// server.
export interface NetworkedDummy {
    x: number; y: number; z: number;
    radius: number;
    health: number; maxHealth: number;
    isDead: boolean;
    team: string;
}

export interface NetworkedPlayerState {
    id: string;
    x: number; y: number; z: number; angle: number;
    health: number; maxHealth: number;
    // Server's snapshot mapping already sends this field; it was missing
    // from this interface (an existing gap — tsc would have flagged it as
    // an excess-property error the moment anyone actually ran `tsc` over
    // server/src/room.ts instead of just executing it through tsx).
    isDead: boolean;
    ammo: number; maxAmmo: number;
    isReloading: boolean;
    classType: CharacterClass;
    isMoving: boolean;
    isShooting: boolean;
    isHyperActive: boolean;
    isBlinking: boolean;
    isGatlingMode: boolean;
    gatlingAmmo: number;
    activeBuffs: { hyperRemaining: number };
    lastProcessedInputSeq: number;
}

export interface NetworkedProjectile {
    id: string;
    x: number; y: number; currentZ: number;
    team: string;
    alpha: number;
    weaponColor: string;
    weaponRadius: number;
}

// What the server broadcasts, every tick
export interface ServerSnapshotMessage {
    tick: number;
    serverTime: number;
    players: NetworkedPlayerState[];
    projectiles: NetworkedProjectile[];
    chiliBeans: Array<{ id: string; x: number; y: number; z: number; isLanded: boolean; fuseTimer: number; radius: number; rotation?: number;}>;
    stinkGrenades: Array<{ id: string; x: number; y: number; z: number }>;
    stinkClouds: Array<{ id: string; x: number; y: number; z: number; radius: number }>;
    explosions: Array<{
        id: string; x: number; y: number; z: number;
        currentRadius: number; alpha: number;
        type?: 'chili' | 'pea'; angle?: number;
        impactStructureId?: string;
    }>;
    hitEvents: HitEvent[];
    soundEvents: Array<{ playerId: string; key: string; volume?: number; pitchVariation?: number }>;
    dummies: NetworkedDummy[];
}

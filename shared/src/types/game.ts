export type Team = 'plants' | 'zombies';
export type CharacterClass = 'peashooter' | 'footsoldier';

export interface Vector2D {
    x: number;
    y: number;
}

export interface MapBounds {
    width: number;
    height: number;
}

export interface MapStructure {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    z: number;
    type: 'building' | 'wall';
    color: string;
    topColor: string;
    label: string;
}

export interface WeaponConfig {
    name: string;
    maxAmmo: number;
    fireRate: number;
    reloadDuration: number;
    projectileSpeed: number;
    directDamage: number;
    splashDamage: number;
    splashRadius: number;
    maxRange: number;
    falloffStartDistance: number;
    minDamage: number;
    projectileRadius: number;
    projectileColor: string;
}

export interface AbilityConfig {
    id: string;
    name: string;
    cooldown: number;
    duration?: number;
    keyBind: 'Q' | 'E' | 'F';
    description: string;
}

export interface ClassConfig {
    className: CharacterClass;
    displayName: string;
    team: Team;
    maxHealth: number;
    moveSpeed: number;
    radius: number;
    baseZoom: number;
    aimZoom: number;
    weapon: WeaponConfig;
    abilities: {
        ability1: AbilityConfig;
        ability2: AbilityConfig;
        ability3: AbilityConfig;
    };
}

export interface AbilityCooldownState {
    cooldownRemaining: number;
    maxCooldown: number;
    activeRemaining: number;
}

export interface PlayerStats {
    health: number;
    maxHealth: number;
    ammo: number;
    maxAmmo: number;
    isReloading: boolean;
    className: CharacterClass;
    displayName: string;
    weaponName: string;
    abilities: {
        ability1: AbilityCooldownState;
        ability2: AbilityCooldownState;
        ability3: AbilityCooldownState;
    };
    isRooted: boolean;
    isChargingZPG?: boolean;
}

export interface ChiliBean {
    id?: string;
    team?: Team;
    bounced?: boolean;
    x: number;
    y: number;
    startX: number;
    startY: number;
    startZ: number;
    targetX: number;
    targetY: number;
    progress: number;
    flightSpeed: number;
    arcHeight: number;
    z: number;
    isLanded: boolean;
    fuseTimer: number;
    radius: number;
    rotation?: number;
    rotationSpeed?: number;
    damage: number;
    explosionRadius: number;
}

export interface StinkGrenade {
    id?: string;
    team?: Team;
    bounced?: boolean;
    x: number;
    y: number;
    startX: number;
    startY: number;
    startZ: number;
    targetX: number;
    targetY: number;
    progress: number;
    flightSpeed: number;
    arcHeight: number;
    z: number;
}

export interface StinkCloud {
    id?: string;
    team?: Team;
    x: number;
    y: number;
    radius: number;
    duration: number;
    damagePerTick: number;
    tickTimer: number;
}

export interface KeysState {
    [key: string]: boolean;
}

export interface DamageNumber {
    x: number;
    y: number;
    damage: number;
    alpha: number;
    life: number;
    isSplash?: boolean;
}

export interface ExplosionEffect {
    id?: string;
    team?: Team;
    x: number; y: number;
    maxRadius: number; currentRadius: number;
    color: string; alpha: number; life: number; maxLife: number;
    type?: 'chili' | 'pea';
    angle?: number;
    impactStructureId?: string;
}

export interface CharacterSprites {
    up?: HTMLImageElement[];
    diagonal?: HTMLImageElement[];
    side?: HTMLImageElement[];
    right?: HTMLImageElement[];
    down?: HTMLImageElement[];
    diagonalDown?: HTMLImageElement[];

    // Shooting animation frames
    upShoot?: HTMLImageElement[];
    diagonalShoot?: HTMLImageElement[];
    sideShoot?: HTMLImageElement[];
    downShoot?: HTMLImageElement[];
    diagonalDownShoot?: HTMLImageElement[];

    // Blinking animation frames — no upBlink; eyes aren't visible from directly above
    diagonalBlink?: HTMLImageElement[];
    sideBlink?: HTMLImageElement[];
    downBlink?: HTMLImageElement[];
    diagonalDownBlink?: HTMLImageElement[];

    // Optional generic fallbacks shared across all directions
    shoot?: HTMLImageElement[];
    blink?: HTMLImageElement[];

    // Pea Gatling ability (rooted-in-place rapid-fire stance). Started out
    // "up"-only with every other facing falling back to it (same idea as the
    // missing side/diagonal walk sprites falling back to "up" elsewhere);
    // NE/NW and now E/W have their own art too. Mirrors how the regular
    // walk/shoot sets only ever need ONE side asset for both E and W (and one
    // diagonal asset for NE/NW) — W/NW reuse them horizontally flipped via
    // the existing dirInfo.scaleX handling, so there's no separate mirrored
    // pair needed for either.
    gatlingActivationUp?: HTMLImageElement[]; // plays once, root-down transition
    gatlingUp?: HTMLImageElement[];           // idle loop while rooted, not firing
    gatlingFiringUp?: HTMLImageElement[];     // alternates with gatlingUp[0] while firing
    gatlingActivationDiagonal?: HTMLImageElement[]; // NE/NW variant of gatlingActivationUp
    gatlingDiagonal?: HTMLImageElement[];           // NE/NW variant of gatlingUp
    gatlingFiringDiagonal?: HTMLImageElement[];     // NE/NW variant of gatlingFiringUp
    gatlingActivationSide?: HTMLImageElement[];     // E/W variant of gatlingActivationUp
    gatlingSide?: HTMLImageElement[];               // E/W variant of gatlingUp
    gatlingFiringSide?: HTMLImageElement[];         // E/W variant of gatlingFiringUp
}

// A sound the simulation wants played, reported rather than played directly —
// this is what lets Player/engine.ts run on a server with no Audio API at all.
// Client wrappers pass `key` straight through to soundManager.play(key, volume, pitchVariation);
// server wrappers just discard these every tick.
export interface PendingSoundEvent {
    key: string;
    volume?: number;
    pitchVariation?: number;
}
import React, { useRef, useEffect } from 'react';
import { Player, Projectile, TargetDummy, VISUAL_Y_FACTOR, Z_HEIGHT_SCALE, get8WayDirection, computeGroundZ } from '@shared/engine';
import {
    PlayerStats,
    MapBounds,
    Vector2D,
    KeysState,
    DamageNumber,
    CharacterClass,
    MapStructure,
    CharacterSprites,
    LayeredBodyPart,
    LayeredDirection,
    LayeredAnimState,
} from '@shared/types/game';

import { socket } from '../utils/network';
import { ServerSnapshotMessage } from '@shared/types/network';

// Pea Gatling ability — "up" view (other non-diagonal facings fall back to it).
// pea_gatling_up_1.png is a duplicate of pea_gatling_up.png, so it's
// intentionally not imported/used here.
import peaGatlingActivationUpSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_up.png';
import peaGatlingActivationUp1Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_up_1.png';
import peaGatlingActivationUp2Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_up_2.png';
import peaGatlingActivationUp3Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_up_3.png';
import peaGatlingActivationUp4Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_up_4.png';
import peaGatlingActivationUp5Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_up_5.png';
import peaGatlingUpSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_up.png';
import peaGatlingUp2Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_up_2.png';
import peaGatlingUp3Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_up_3.png';
import peaGatlingUp4Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_up_4.png';
import peaGatlingUpFiringSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_up_firing.png';

// Pea Gatling — NE view (reused mirrored for NW, same as the regular
// walk/shoot diagonal sprites elsewhere in this file).
// pea_gatling_northeast_2.png is a duplicate of pea_gatling_northeast.png,
// so it's intentionally not imported/used here, same treatment as the
// pea_gatling_up_1.png duplicate above.
import peaGatlingActivationNESrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_northeast.png';
import peaGatlingActivationNE1Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_northeast_1.png';
import peaGatlingActivationNE2Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_northeast_2.png';
import peaGatlingActivationNE3Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_northeast_3.png';
import peaGatlingActivationNE4Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_northeast_4.png';
import peaGatlingActivationNE5Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_northeast_5.png';
import peaGatlingNESrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_northeast.png';
import peaGatlingNE1Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_northeast_1.png';
import peaGatlingNE3Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_northeast_3.png';
import peaGatlingNE4Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_northeast_4.png';
import peaGatlingNEFiringSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_northeast_firing.png';

// Pea Gatling — E view (reused mirrored for W, same idea as the regular
// walk/shoot side sprites elsewhere in this file).
// pea_gatling_right_1.png is a duplicate of pea_gatling_right.png, so it's
// intentionally not imported/used here — same treatment as the up/NE
// duplicates above, just a different frame number this time.
import peaGatlingActivationRightSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_right.png';
import peaGatlingActivationRight1Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_right_1.png';
import peaGatlingActivationRight2Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_right_2.png';
import peaGatlingActivationRight3Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_right_3.png';
import peaGatlingActivationRight4Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_right_4.png';
import peaGatlingActivationRight5Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_right_5.png';
import peaGatlingRightSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_right.png';
import peaGatlingRight2Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_right_2.png';
import peaGatlingRight3Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_right_3.png';
import peaGatlingRight4Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_right_4.png';
import peaGatlingRightFiringSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_right_firing.png';

// Pea Gatling — SE view (reused mirrored for SW, same idea as NE/E above).
// pea_gatling_southeast_1.png is a duplicate of pea_gatling_southeast.png,
// so it's deliberately not imported below — same idea as the
// pea_gatling_up_1.png / pea_gatling_right_1.png duplicates elsewhere in
// this file.
import peaGatlingActivationSESrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_southeast.png';
import peaGatlingActivationSE1Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_southeast_1.png';
import peaGatlingActivationSE2Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_southeast_2.png';
import peaGatlingActivationSE3Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_southeast_3.png';
import peaGatlingActivationSE4Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_southeast_4.png';
import peaGatlingActivationSE5Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_southeast_5.png';
import peaGatlingSESrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_southeast.png';
import peaGatlingSE2Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_southeast_2.png';
import peaGatlingSE3Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_southeast_3.png';
import peaGatlingSE4Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_southeast_4.png';
import peaGatlingSEFiringSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_southeast_firing.png';

// Pea Gatling — S (fully/straight down) view. NOT the SE/SW pair above —
// this is the one cardinal facing that, until now, had no dedicated art and
// fell back to the "up" set with a rotation hack (see engine.ts). S has no
// mirrored counterpart to reuse either, same as "up" itself.
// pea_gatling_down_1.png is a duplicate of pea_gatling_down.png, so it's
// deliberately not imported/used here — same treatment as the up/NE/right/
// southeast duplicates above.
import peaGatlingActivationDownSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_down.png';
import peaGatlingActivationDown1Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_down_1.png';
import peaGatlingActivationDown2Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_down_2.png';
import peaGatlingActivationDown3Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_down_3.png';
import peaGatlingActivationDown4Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_down_4.png';
import peaGatlingActivationDown5Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_activation_down_5.png';
import peaGatlingDownSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_down.png';
import peaGatlingDown2Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_down_2.png';
import peaGatlingDown3Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_down_3.png';
import peaGatlingDown4Src from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_down_4.png';
import peaGatlingDownFiringSrc from '../assets/Peashooter/Sprites/Abilities/PeaGatling/pea_gatling_down_firing.png';

import peaSpriteSrc from '../assets/Peashooter/Sprites/pea.png';
import peaFired1Src from '../assets/Peashooter/Sprites/pea_fired_1.png';
import peaFired2Src from '../assets/Peashooter/Sprites/pea_fired_2.png';
import peaSplashSrc from '../assets/Peashooter/Sprites/pea_splash.png';
import peaSplash1Src from '../assets/Peashooter/Sprites/pea_splash_1.png';
import peaSplash2Src from '../assets/Peashooter/Sprites/pea_splash_2.png';

import chiliBeanThrownSrc from '../assets/Peashooter/Sprites/Abilities/ChiliBean/chili_bean_bomb.png';
import chiliBeanStage1Src from '../assets/Peashooter/Sprites/Abilities/ChiliBean/chili_bean_bomb_1.png';
import chiliBeanStage2Src from '../assets/Peashooter/Sprites/Abilities/ChiliBean/chili_bean_bomb_2.png';
import chiliBeanStage3Src from '../assets/Peashooter/Sprites/Abilities/ChiliBean/chili_bean_bomb_3.png';

import chiliExplosion0Src from '../assets/Peashooter/Sprites/Abilities/ChiliBean/chili_bean_bomb_explosion.png';
import chiliExplosion1Src from '../assets/Peashooter/Sprites/Abilities/ChiliBean/chili_bean_bomb_explosion_1.png';
import chiliExplosion2Src from '../assets/Peashooter/Sprites/Abilities/ChiliBean/chili_bean_bomb_explosion_2.png';
import chiliExplosion3Src from '../assets/Peashooter/Sprites/Abilities/ChiliBean/chili_bean_bomb_explosion_3.png';
import chiliExplosion4Src from '../assets/Peashooter/Sprites/Abilities/ChiliBean/chili_bean_bomb_explosion_4.png';
import chiliExplosion5Src from '../assets/Peashooter/Sprites/Abilities/ChiliBean/chili_bean_bomb_explosion_5.png';

import { SoundKey, soundManager } from './soundManager';

interface GameCanvasProps {
    selectedClass: CharacterClass;
    onStatsUpdate: (stats: PlayerStats) => void;
}

interface PeaFiredParticle {
    x: number; y: number; z: number;
    angle: number;
    life: number; maxLife: number;
}

const isEntityBehindStructure = (
    x: number, y: number, z: number, radius: number, s: MapStructure
): boolean => {
    const visualYOffset = s.z * VISUAL_Y_FACTOR;
    const padding = radius;
    const xOverlap = x >= s.x - padding && x <= s.x + s.width + padding;
    const yBehind = y >= s.y - visualYOffset && y <= s.y + s.height;
    const isBelowRoof = z < s.z - 8;
    return xOverlap && yBehind && isBelowRoof;
};

const getEffectiveSortY = (
    x: number, y: number, z: number, radius: number, structures: MapStructure[],
    tolerance: number = 15
): number => {
    // Baseline: elevation alone should nudge paint order forward, even when
    // the entity isn't sitting inside any mapped structure's footprint. It's
    // drawn shifted up on screen by z * VISUAL_Y_FACTOR regardless of what's
    // underneath it, so sorting purely by raw ground y (ignoring z) lets an
    // elevated-but-unsupported entity draw in front of things that are
    // actually closer to the camera.
    let sortY = y + z;
    structures.forEach((s) => {
        // The structure's north edge is drawn shifted up on screen by its own
        // z * VISUAL_Y_FACTOR (that's what makes a tall roof visually loom
        // over anything standing near its top edge). isEntityBehindStructure
        // already buffers its bounds check by that same amount; this needs
        // to match, or someone standing right at the roof's edge — still on
        // it by z — falls just outside a radius-only buffer, gets treated as
        // "not on this structure" for sorting, and renders behind it.
        const northBuffer = Math.max(radius, s.z * VISUAL_Y_FACTOR);
        if (x >= s.x - radius && x <= s.x + s.width + radius && y >= s.y - northBuffer && y <= s.y + s.height + radius) {
            if (z >= s.z - tolerance) {
                // Must draw after the roof (sortY > s.y + s.height) for EVERY
                // y this entity could have while still being recognized as
                // "on the roof" — including y as low as s.y - northBuffer,
                // near the top edge. A bump of "y + s.height" alone only
                // clears the roof's own baseline once y >= s.y, so anyone
                // standing right at that top edge (y < s.y, body still
                // overlapping the footprint) fell right back under it. Adding
                // northBuffer here guarantees the worst case still clears,
                // while adding a constant keeps relative y-ordering intact
                // for multiple entities standing on the same roof.
                sortY = Math.max(sortY, y + s.height + northBuffer + 0.1);
            }
        }
    });
    return sortY;
};

// Draws the Hyper trail as several continuous, tapered ribbons following the
// player's recent path history, instead of a chain of independently-angled
// streaks. Built from left/right offset points perpendicular to the path at
// each sample; because the sample points ARE the actual path, each ribbon
// curves naturally through turns rather than jumping between fixed segment
// angles. Tapers from ~0 width at the tail up to full width at the head
// (the player's current position) and fades alpha the same way. Drawn as
// multiple parallel strands (like the old system's 3 lateral streaks)
// rather than a single central ribbon.
const drawHyperTrail = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number; z: number }[]
): void => {
    const n = points.length;
    if (n < 2) return;

    const visualY = (p: { y: number; z: number }) => p.y - p.z * VISUAL_Y_FACTOR;

    // Perpendicular direction at each sample, computed once and shared by
    // every strand — each strand just offsets along it by a different amount.
    const perp: { x: number; y: number; vy: number; perpX: number; perpY: number }[] = [];
    for (let i = 0; i < n; i++) {
        const p = points[i];
        const vy = visualY(p);
        const prev = points[i - 1] ?? p;
        const next = points[i + 1] ?? p;
        const dirX = next.x - prev.x;
        const dirY = visualY(next) - visualY(prev);
        const dirLen = Math.hypot(dirX, dirY) || 1;
        perp.push({ x: p.x, y: p.y, vy, perpX: -dirY / dirLen, perpY: dirX / dirLen });
    }

    const strands = [-9, 0, 9];
    strands.forEach((lateralOffset) => {
        const leftEdge: Vector2D[] = [];
        const rightEdge: Vector2D[] = [];

        for (let i = 0; i < n; i++) {
            const s = perp[i];
            const baseX = s.x + s.perpX * lateralOffset;
            const baseVy = s.vy + s.perpY * lateralOffset;

            const t = i / (n - 1); // 0 at the tail, 1 at the head
            const halfWidth = 0.4 + t * 3.5;

            leftEdge.push({ x: baseX + s.perpX * halfWidth, y: baseVy + s.perpY * halfWidth });
            rightEdge.push({ x: baseX - s.perpX * halfWidth, y: baseVy - s.perpY * halfWidth });
        }

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
        for (let i = 1; i < n; i++) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
        for (let i = n - 1; i >= 0; i--) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
        ctx.closePath();

        const head = perp[n - 1];
        const tail = perp[0];
        const gradient = ctx.createLinearGradient(
            tail.x + tail.perpX * lateralOffset, tail.vy + tail.perpY * lateralOffset,
            head.x + head.perpX * lateralOffset, head.vy + head.perpY * lateralOffset
        );
        gradient.addColorStop(0, 'rgba(139, 195, 74, 0)');
        gradient.addColorStop(1, 'rgba(139, 195, 74, 0.5)');
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();
    });
};

// Same tapered-ribbon idea as drawHyperTrail, deliberately simplified for a
// projectile: one strand instead of three parallel ones (a small object
// doesn't need the "width" a player-sized trail does), a much smaller taper,
// and colored to match the projectile itself rather than a fixed green —
// different weapons have different weaponColor, so this reads correctly for
// any of them without per-weapon trail-color configuration.
// NOTE: assumes color is a clean 6-digit "#RRGGBB" hex string (true of every
// current weaponColor) — the alpha suffixes below rely on that.
// Deliberately shorter than a player's MAX_TRAIL_POINTS (26) — a projectile
// travels in a straight/near-straight line, so a short streak reads as a
// tracer; a long one would just look like a second, wider projectile.
const MAX_PROJECTILE_TRAIL_POINTS = 8;

// A freshly spawned trail is capped to a handful of visible points (below)
// and faded in via `growth`, both driven by how long ago the trail started
// rather than by how many points happen to have accumulated — that keeps
// the "starts short, races out to full length" pop independent of display
// refresh rate (point accumulation alone would take longer to read as short
// on a 30Hz screen than a 144Hz one). Short window + ease-out curve = fast
// start that settles rather than a mechanically linear grow.
const TRAIL_GROWTH_MS = 90;

const drawProjectileTrail = (
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number; z: number }[],
    color: string,
    growth: number = 1
): void => {
    const n = points.length;
    if (n < 2) return;

    const visualY = (p: { y: number; z: number }) => p.y - p.z * VISUAL_Y_FACTOR;

    const perp: { x: number; vy: number; perpX: number; perpY: number }[] = [];
    for (let i = 0; i < n; i++) {
        const p = points[i];
        const vy = visualY(p);
        const prev = points[i - 1] ?? p;
        const next = points[i + 1] ?? p;
        const dirX = next.x - prev.x;
        const dirY = visualY(next) - visualY(prev);
        const dirLen = Math.hypot(dirX, dirY) || 1;
        perp.push({ x: p.x, vy, perpX: -dirY / dirLen, perpY: dirX / dirLen });
    }

    const leftEdge: Vector2D[] = [];
    const rightEdge: Vector2D[] = [];
    for (let i = 0; i < n; i++) {
        const s = perp[i];
        const t = i / (n - 1); // 0 at the tail, 1 at the head (current position)
        // Scaled by `growth` so a brand-new trail starts as a thin sliver
        // and thickens up to the normal taper as it ages in, instead of
        // the head snapping straight to full width the moment a 2nd point
        // exists (t is always 0..1 across whatever points ARE there, so
        // width alone can't tell "short trail" from "young trail" apart).
        const halfWidth = (0.3 + t * 2.2) * growth;
        leftEdge.push({ x: s.x + s.perpX * halfWidth, y: s.vy + s.perpY * halfWidth });
        rightEdge.push({ x: s.x - s.perpX * halfWidth, y: s.vy - s.perpY * halfWidth });
    }

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(leftEdge[0].x, leftEdge[0].y);
    for (let i = 1; i < n; i++) ctx.lineTo(leftEdge[i].x, leftEdge[i].y);
    for (let i = n - 1; i >= 0; i--) ctx.lineTo(rightEdge[i].x, rightEdge[i].y);
    ctx.closePath();

    const head = perp[n - 1];
    const tail = perp[0];
    const gradient = ctx.createLinearGradient(tail.x, tail.vy, head.x, head.vy);
    gradient.addColorStop(0, `${color}00`);
    gradient.addColorStop(1, `${color}99`);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();
};

// We deliberately render slightly in the past so there's always a pair of
// server snapshots to interpolate between (smooths over normal network
// jitter, same idea as most client-side entity interpolation schemes).
// IMPORTANT: this only works if the snapshot history buffer below actually
// holds enough past snapshots to bracket "now - RENDER_DELAY_MS". With
// TICK_RATE=30 on the server (~33ms between snapshots), a 100ms delay needs
// roughly 3+ ticks of history, not just the single previous snapshot.
const RENDER_DELAY_MS = 100;

// Finds the two buffered snapshots whose serverTime straddles `renderTime`,
// so remote puppets always interpolate smoothly regardless of how large
// RENDER_DELAY_MS is relative to the server tick rate. Keeping only the
// latest two snapshots (as a previous version of this code did) silently
// breaks the moment RENDER_DELAY_MS exceeds one tick interval: renderTime
// then falls behind both buffered snapshots, the interpolation factor `t`
// clamps to 0 for the puppet's entire lifetime, and position only ever
// updates in a single snap the instant the buffer rolls over — which is
// exactly the "frozen, then one big jump" pattern the puppetMovePerTick
// debug log showed (0.000 for many frames, then an isolated spike).
const findSnapshotBracket = (
    buffer: ServerSnapshotMessage[],
    renderTime: number
): { prev: ServerSnapshotMessage; next: ServerSnapshotMessage } | null => {
    if (buffer.length === 0) return null;
    if (buffer.length === 1) return { prev: buffer[0], next: buffer[0] };

    if (renderTime <= buffer[0].serverTime) {
        return { prev: buffer[0], next: buffer[1] };
    }
    for (let i = buffer.length - 2; i >= 0; i--) {
        if (buffer[i].serverTime <= renderTime) {
            return { prev: buffer[i], next: buffer[i + 1] };
        }
    }
    // renderTime is newer than everything buffered (a hiccup ate our
    // lookback window) — fall back to the newest pair rather than nothing.
    return { prev: buffer[buffer.length - 2], next: buffer[buffer.length - 1] };
};

// Static reference geometry — MUST stay identical to server/src/room.ts's
// `structures` array. Duplicated rather than fetched over the network because
// it never changes at runtime; if you ever add a map editor or multiple maps,
// this should instead come from the server on join.
const STRUCTURES: MapStructure[] = [
    {
        id: 'building_rooftop', x: 120, y: 120, width: 160, height: 160, z: 100,
        type: 'building', color: '#37474F', topColor: '#546E7A', label: 'Roof (Z: 100)',
    },
    {
        id: 'low_wall', x: 550, y: 180, width: 28, height: 340, z: 20,
        type: 'wall', color: '#4E342E', topColor: '#6D4C41', label: 'Wall (Z: 20)',
    },
];

// Head/lowerBody split — loaded via import.meta.glob rather than one named
// import per file. This set is already ~90 files and growing as more
// direction/state combinations get art; a glob keeps adding a new frame
// later a matter of dropping the file in, not also writing a new import
// line and loadImages() call for it. Vite resolves each match to its final
// built asset URL as the module's default export. This only matches files
// with an extra "_<bodypart>_" segment (peashooter_down_head_idle.png etc),
// so it doesn't overlap with the old single-sprite peashooter_*.png files
// or the pea_gatling_*.png files, both of which live under this same
// Sprites/ folder but don't match this specific shape.
const layeredSpriteModules = import.meta.glob<{ default: string }>(
    '../assets/Peashooter/Sprites/peashooter_*_*_*.png',
    { eager: true }
);
const LAYERED_FILENAME_RE = /peashooter_([a-z]+)_(head|lowerbody|upperbody)_([a-z]+)(?:_(\d+))?\.png$/;

export const GameCanvas: React.FC<GameCanvasProps> = ({ selectedClass, onStatsUpdate }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const playerRef = useRef<Player | null>(null);

    const prevTimeRef = useRef<number>(performance.now());
    const seqRef = useRef(0);
    const myIdRef = useRef<string | null>(null);
    const latestSnapshotRef = useRef<ServerSnapshotMessage | null>(null);
    const prevSnapshotRef = useRef<ServerSnapshotMessage | null>(null);
    // Short history of received snapshots, used ONLY to find the pair that
    // brackets the delayed render time for remote-puppet interpolation.
    // prevSnapshotRef/latestSnapshotRef above stay as-is since other code
    // (e.g. the gatling-mode edge detection on "mine") intentionally wants
    // "the tick right before this one", not an interpolation bracket.
    const snapshotBufferRef = useRef<ServerSnapshotMessage[]>([]);
    const snapshotReceivedAtRef = useRef<number>(performance.now());
    const remotePuppetsRef = useRef<Map<string, Player>>(new Map());
    // Persists each structure's current fade opacity across frames, keyed by
    // structure id, so the reveal-fade below can ease toward its target
    // instead of snapping the instant something crosses the X-ray radius.
    const structureAlphaRef = useRef<Map<string, number>>(new Map());
    // Per-puppet Hyper trails, keyed by player id — mirrors the local
    // hyperTrailPoints array below, just one per remote player instead of
    // a single one scoped to `player`.
    const remoteHyperTrailsRef = useRef<Map<string, { x: number; y: number; z: number }[]>>(new Map());
    // Same idea, one per projectile instead of one per player — only
    // populated for projectiles whose weapon has hasTrail set (Pea Cannon/
    // Gatling, Z-1 Assault Blaster), keyed by the projectile's own network
    // id so it's independent of any particular player.
    const projectileTrailsRef = useRef<Map<string, { x: number; y: number; z: number }[]>>(new Map());
    // renderTime (not wall-clock time) each trail first appeared, keyed the
    // same as projectileTrailsRef — lets the trail's spawn-growth animation
    // (TRAIL_GROWTH_MS) run off "how long ago this trail started" rather
    // than off how many points have piled up, so it stays framerate-independent.
    const projectileTrailSpawnRef = useRef<Map<string, number>>(new Map());
    const whizzedProjectileIdsRef = useRef<Set<string>>(new Set());
    const lastProcessedTickRef = useRef<number>(-1);
    // TEMP DEBUG — rate counters, remove once diagnosis is confirmed.
    const snapshotCountRef = useRef<number>(0);
    const renderCountRef = useRef<number>(0);
    const lastRateLogRef = useRef<number>(performance.now());

    // Connect exactly once for the whole component lifetime — NOT tied to selectedClass.
    useEffect(() => {
        socket.connect();

        socket.on('connect', () => {
            myIdRef.current = socket.id ?? null;
            socket.emit('join', { selectedClass });
        });

        socket.on('snapshot', (snapshot: ServerSnapshotMessage) => {
            prevSnapshotRef.current = latestSnapshotRef.current;
            latestSnapshotRef.current = snapshot;
            snapshotReceivedAtRef.current = performance.now();
            snapshotCountRef.current++;

            const buffer = snapshotBufferRef.current;
            buffer.push(snapshot);
            // Trim anything older than we could possibly still need: the
            // render delay plus a jitter margin. Comparing serverTime (not
            // array length) means this stays correct even if the tick rate
            // or renderDelay changes later.
            const oldestNeeded = snapshot.serverTime - RENDER_DELAY_MS - 200;
            while (buffer.length > 2 && buffer[0].serverTime < oldestNeeded) {
                buffer.shift();
            }
        });

        socket.on('connect_error', (err) => {
            console.error('[client] connection failed:', err.message);
        });

        return () => {
            socket.off('connect');
            socket.off('snapshot');
            socket.off('connect_error');
            socket.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Class change sends a message on the SAME connection instead of reconnecting.
    const didMountRef = useRef(false);
    useEffect(() => {
        if (!didMountRef.current) {
            didMountRef.current = true; // first run is the initial join above, skip it
            return;
        }
        socket.emit('switchClass', { selectedClass });
    }, [selectedClass]);

    const peashooterSpritesRef = useRef<CharacterSprites>({});

    useEffect(() => {
        const loadImages = (sources: string[]) =>
            sources.map((src) => {
                const img = new Image();
                img.src = src;
                return img;
            });

        // Groups the flat glob match list into direction -> state -> sorted
        // frames, for one bodypart at a time (called once for 'head', once
        // for 'lowerbody'). frameIndex defaults to 0 for the base file with
        // no numeric suffix (e.g. peashooter_down_head_idle.png has no
        // trailing _N, sorts first ahead of _1, _2, etc).
        const buildLayeredBodyPart = (bodypart: 'head' | 'lowerbody' | 'upperbody'): LayeredBodyPart => {
            const buckets: Record<string, Record<string, { frameIndex: number; url: string }[]>> = {};

            for (const [path, mod] of Object.entries(layeredSpriteModules)) {
                const match = path.match(LAYERED_FILENAME_RE);
                if (!match || match[2] !== bodypart) continue;
                const [, direction, , state, frameIndexStr] = match;
                const frameIndex = frameIndexStr ? parseInt(frameIndexStr, 10) : 0;
                if (!buckets[direction]) buckets[direction] = {};
                if (!buckets[direction][state]) buckets[direction][state] = [];
                buckets[direction][state].push({ frameIndex, url: mod.default });
            }

            const part: LayeredBodyPart = {};
            for (const direction of Object.keys(buckets)) {
                const dirKey = direction as LayeredDirection;
                part[dirKey] = {};
                for (const state of Object.keys(buckets[direction])) {
                    const stateKey = state as LayeredAnimState;
                    const sorted = buckets[direction][state].sort((a, b) => a.frameIndex - b.frameIndex);
                    part[dirKey]![stateKey] = loadImages(sorted.map((f) => f.url));
                }
            }
            return part;
        };

        peashooterSpritesRef.current = {
            head: buildLayeredBodyPart('head'),
            lowerBody: buildLayeredBodyPart('lowerbody'),
            upperBody: buildLayeredBodyPart('upperbody'),

            // pea_gatling_up_1.png deliberately omitted — duplicate of pea_gatling_up.png.
            gatlingActivationUp: loadImages([
                peaGatlingActivationUpSrc, peaGatlingActivationUp1Src, peaGatlingActivationUp2Src,
                peaGatlingActivationUp3Src, peaGatlingActivationUp4Src, peaGatlingActivationUp5Src,
            ]),
            gatlingUp: loadImages([peaGatlingUpSrc, peaGatlingUp2Src, peaGatlingUp3Src, peaGatlingUp4Src]),
            gatlingFiringUp: loadImages([peaGatlingUpFiringSrc]),

            // NE/NW — reuses the NE art mirrored for NW via dirInfo.scaleX,
            // same as every other diagonal sprite set in this file.
            // pea_gatling_northeast_2.png deliberately omitted — duplicate
            // of pea_gatling_northeast.png.
            gatlingActivationDiagonal: loadImages([
                peaGatlingActivationNESrc, peaGatlingActivationNE1Src, peaGatlingActivationNE2Src,
                peaGatlingActivationNE3Src, peaGatlingActivationNE4Src, peaGatlingActivationNE5Src,
            ]),
            gatlingDiagonal: loadImages([peaGatlingNESrc, peaGatlingNE1Src, peaGatlingNE3Src, peaGatlingNE4Src]),
            gatlingFiringDiagonal: loadImages([peaGatlingNEFiringSrc]),

            // E/W — reuses the E (right) art mirrored for W via dirInfo.scaleX,
            // same as every other side sprite set in this file.
            // pea_gatling_right_1.png deliberately omitted — duplicate of
            // pea_gatling_right.png.
            gatlingActivationSide: loadImages([
                peaGatlingActivationRightSrc, peaGatlingActivationRight1Src, peaGatlingActivationRight2Src,
                peaGatlingActivationRight3Src, peaGatlingActivationRight4Src, peaGatlingActivationRight5Src,
            ]),
            gatlingSide: loadImages([peaGatlingRightSrc, peaGatlingRight2Src, peaGatlingRight3Src, peaGatlingRight4Src]),
            gatlingFiringSide: loadImages([peaGatlingRightFiringSrc]),

            // pea_gatling_southeast_1.png deliberately omitted — duplicate
            // of pea_gatling_southeast.png.
            gatlingActivationDiagonalDown: loadImages([
                peaGatlingActivationSESrc, peaGatlingActivationSE1Src, peaGatlingActivationSE2Src,
                peaGatlingActivationSE3Src, peaGatlingActivationSE4Src, peaGatlingActivationSE5Src,
            ]),
            gatlingDiagonalDown: loadImages([peaGatlingSESrc, peaGatlingSE2Src, peaGatlingSE3Src, peaGatlingSE4Src]),
            gatlingFiringDiagonalDown: loadImages([peaGatlingSEFiringSrc]),

            // S — the one facing that used to fall back to "up" (see
            // engine.ts's needsFallbackRotation). pea_gatling_down_1.png
            // deliberately omitted — duplicate of pea_gatling_down.png.
            gatlingActivationDown: loadImages([
                peaGatlingActivationDownSrc, peaGatlingActivationDown1Src, peaGatlingActivationDown2Src,
                peaGatlingActivationDown3Src, peaGatlingActivationDown4Src, peaGatlingActivationDown5Src,
            ]),
            gatlingDown: loadImages([peaGatlingDownSrc, peaGatlingDown2Src, peaGatlingDown3Src, peaGatlingDown4Src]),
            gatlingFiringDown: loadImages([peaGatlingDownFiringSrc]),
        };
    }, []);

    const peaSpriteRef = useRef<HTMLImageElement | null>(null);
    const peaFiredFramesRef = useRef<HTMLImageElement[]>([]);
    const peaSplashFramesRef = useRef<HTMLImageElement[]>([]);
    const chiliBeanThrownRef = useRef<HTMLImageElement | null>(null);
    const chiliBeanStage1Ref = useRef<HTMLImageElement | null>(null);
    const chiliBeanStage2Ref = useRef<HTMLImageElement | null>(null);
    const chiliBeanStage3Ref = useRef<HTMLImageElement | null>(null);
    const chiliExplosionFramesRef = useRef<HTMLImageElement[]>([]);

    useEffect(() => {
        const load = (src: string) => {
            const img = new Image();
            img.src = src;
            return img;
        };

        peaSpriteRef.current = load(peaSpriteSrc);
        peaFiredFramesRef.current = [peaFired1Src, peaFired2Src].map(load);
        peaSplashFramesRef.current = [peaSplashSrc, peaSplash1Src, peaSplash2Src].map(load);

        chiliBeanThrownRef.current = load(chiliBeanThrownSrc);
        chiliBeanStage1Ref.current = load(chiliBeanStage1Src);
        chiliBeanStage2Ref.current = load(chiliBeanStage2Src);
        chiliBeanStage3Ref.current = load(chiliBeanStage3Src);

        chiliExplosionFramesRef.current = [
            chiliExplosion0Src, chiliExplosion1Src, chiliExplosion2Src,
            chiliExplosion3Src, chiliExplosion4Src, chiliExplosion5Src,
        ].map(load);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // World/gameplay bounds stay fixed — this is the authoritative map
        // size the server also uses, unrelated to how big the canvas is on
        // screen. The canvas's actual pixel size below is decoupled from
        // this: it fills whatever space its container gives it, and since
        // the render loop already reads canvas.width/height fresh every
        // frame for the camera transform, a bigger canvas just naturally
        // shows more of the world at the same zoom — no separate "fill the
        // screen" logic needed elsewhere, no black borders left over.
        const mapBounds: MapBounds = { width: 1000, height: 700 };

        const resizeCanvasToContainer = (): void => {
            const parent = canvas.parentElement;
            const width = Math.round(parent ? parent.clientWidth : window.innerWidth);
            const height = Math.round(parent ? parent.clientHeight : window.innerHeight);
            if (canvas.width !== width) canvas.width = width;
            if (canvas.height !== height) canvas.height = height;
        };
        resizeCanvasToContainer();

        // ResizeObserver catches container size changes ResizeObserver a
        // plain window 'resize' listener would miss — e.g. the header above
        // the canvas reflowing once its custom fonts finish loading.
        const resizeObserver = new ResizeObserver(resizeCanvasToContainer);
        if (canvas.parentElement) resizeObserver.observe(canvas.parentElement);
        window.addEventListener('resize', resizeCanvasToContainer);

        const structures = STRUCTURES;

        const player = new Player(mapBounds.width / 2, mapBounds.height / 2, selectedClass);
        playerRef.current = player;

        // Local-only puppet dummies, purely for aim-assist (calculateTargetZ) and
        // reusing TargetDummy.draw()'s health-bar rendering — their state is copied
        // from the snapshot every frame, never simulated locally.
        const dummies: TargetDummy[] = [];

        // Satisfies Player.update()'s signature (used internally for ZPG's charged-shot
        // push) — never rendered, never read. The server's own Player instance is what
        // actually creates the real, networked ZPG projectile.
        const localPhantomProjectiles: Projectile[] = [];

        const damageNumbers: DamageNumber[] = [];
        const peaFiredParticles: PeaFiredParticle[] = [];
        // Hyper trail — a continuous, tapered ribbon built from the player's
        // own recent path history (purely cosmetic, purely local), rather
        // than a series of independently-angled streaks. Because it's
        // literally the path itself, it curves naturally through turns
        // instead of showing a jump between fixed segment angles, and it
        // responds to jumping/falling too since sampling + the trigger both
        // account for z, not just x/y.
        type HyperTrailPoint = { x: number; y: number; z: number };
        const hyperTrailPoints: HyperTrailPoint[] = [];
        let prevPlayerX = player.x;
        let prevPlayerY = player.y;
        let prevPlayerZ = player.z;

        const keys: KeysState = {};
        const mouseScreenPos: Vector2D = { x: 0, y: 0 };
        const mousePos: Vector2D = { x: 0, y: 0 };
        let isMouseDown = false;
        let isAimingRmb = false;

        let currentZoom = player.config.baseZoom;
        let animationFrameId: number;
        let lastFrameTime = performance.now();

        const handleKeyDown = (e: KeyboardEvent): void => {
            keys[e.key] = true;
            keys[e.key.toLowerCase()] = true;
            const keyUpper = e.key.toUpperCase();
            if (['Q', 'E', 'F'].includes(keyUpper)) {
                const slot = keyUpper as 'Q' | 'E' | 'F';

                // Local call is for instant cooldown-icon feedback only — it does NOT
                // spawn the actual chili bean/stink cloud; that's server-authoritative.
                // Passing empty arrays means nothing gets created locally.
                player.triggerAbility(slot, performance.now(), mousePos, [], [], [], structures);

                socket.emit('ability', { slot, mousePos, timestamp: performance.now() });
            }
        };

        const handleKeyUp = (e: KeyboardEvent): void => {
            keys[e.key] = false;
            keys[e.key.toLowerCase()] = false;
        };

        const handleMouseMove = (e: MouseEvent): void => {
            const rect = canvas.getBoundingClientRect();
            mouseScreenPos.x = e.clientX - rect.left;
            mouseScreenPos.y = e.clientY - rect.top;
        };

        const handleMouseDown = (e: MouseEvent): void => {
            if (e.button === 0) isMouseDown = true;
            if (e.button === 2) isAimingRmb = true;
        };

        const handleMouseUp = (e: MouseEvent): void => {
            if (e.button === 0) isMouseDown = false;
            if (e.button === 2) isAimingRmb = false;
        };

        const handleContextMenu = (e: MouseEvent): void => e.preventDefault();

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        canvas.addEventListener('contextmenu', handleContextMenu);

        const drawStructure = (s: MapStructure) => {
            const visualYOffset = -s.z * VISUAL_Y_FACTOR;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillRect(s.x - 4, s.y - 4, s.width + 8, s.height + 8);

            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x, s.y + visualYOffset);
            ctx.lineTo(s.x, s.y + s.height + visualYOffset);
            ctx.lineTo(s.x, s.y + s.height);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#263238';
            ctx.beginPath();
            ctx.moveTo(s.x + s.width, s.y);
            ctx.lineTo(s.x + s.width, s.y + visualYOffset);
            ctx.lineTo(s.x + s.width, s.y + s.height + visualYOffset);
            ctx.lineTo(s.x + s.width, s.y + s.height);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = s.color;
            ctx.fillRect(s.x, s.y + s.height + visualYOffset, s.width, -visualYOffset);
            ctx.strokeStyle = '#1c252b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(s.x, s.y + s.height + visualYOffset, s.width, -visualYOffset);

            ctx.fillStyle = s.topColor;
            ctx.fillRect(s.x, s.y + visualYOffset, s.width, s.height);
            ctx.strokeStyle = '#263238';
            ctx.lineWidth = 2;
            ctx.strokeRect(s.x, s.y + visualYOffset, s.width, s.height);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(s.label, s.x + s.width / 2, s.y + visualYOffset + s.height / 2 + 4);
        };

        const render = (time: number): void => {
            renderCountRef.current++;
            if (time - lastRateLogRef.current >= 1000) {
                console.log(
                    `[rate-debug] renders/sec=${renderCountRef.current} snapshots/sec=${snapshotCountRef.current} ` +
                    `documentHidden=${document.hidden} hasFocus=${document.hasFocus()}`
                );
                renderCountRef.current = 0;
                snapshotCountRef.current = 0;
                lastRateLogRef.current = time;
            }
            const dt = Math.min((time - lastFrameTime) / 1000, 0.1);
            const dt60 = dt * 60;
            lastFrameTime = time;

            const targetZoom = isAimingRmb ? player.config.aimZoom : player.config.baseZoom;
            currentZoom += (targetZoom - currentZoom) * Math.min(1, 0.12 * dt60);

            // currentZoom is tuned against a 1000x700 reference viewport (the
            // canvas's original fixed size, before it started filling the
            // screen). Scaling only by height (canvas.height / 700) keeps the
            // vertical field of view correct, but leaves width uncapped — on
            // a wide monitor the canvas is far wider relative to its height
            // than 1000:700, so horizontally you'd still see much more world
            // than intended even though vertically it matched. Using
            // whichever ratio is larger caps BOTH dimensions at the
            // reference amount of world, so a wide screen zooms in a bit
            // further (trading a taller view for a properly capped wide one)
            // instead of just revealing extra world off to both sides.
            const REFERENCE_WIDTH = 1000;
            const REFERENCE_HEIGHT = 700;
            const screenScale = Math.max(canvas.width / REFERENCE_WIDTH, canvas.height / REFERENCE_HEIGHT);
            const displayZoom = currentZoom * screenScale;

            mousePos.x = player.x + (mouseScreenPos.x - canvas.width / 2) / displayZoom;
            mousePos.y = player.y + (mouseScreenPos.y - canvas.height / 2) / displayZoom;

            if (socket.connected) {
                socket.emit('input', {
                    seq: seqRef.current++,
                    keys, mousePos, isMouseDown, isAimingRmb,
                    timestamp: time,
                });
            }

            // Client-side prediction: movement/aim/jump/blink feel instant. Health,
            // ammo, reload, gatling mode, and hyper are overwritten by the server's
            // snapshot right after this, since those are authoritative there.
            // Remote puppets are passed as aim-assist targets (mirroring what the
            // server does with its own player list in room.ts/simulation.ts) so the
            // locally-predicted aim arc already accounts for an elevated enemy,
            // instead of momentarily flattening out until the next server snapshot
            // corrects it. Enemy-only, same as the server-side copies of this
            // filter — no support ability exists yet that would want this to lock
            // onto a teammate instead.
            const otherPlayersForAim = Array.from(remotePuppetsRef.current.values()).filter(
                (p) => !p.isDead && p.team !== player.team
            );
            player.update(keys, mousePos, mapBounds, time, localPhantomProjectiles, structures, dummies, dt60, otherPlayersForAim);
            player.updateReload(time);
            player.consumePendingSounds();

            // Cosmetic-only local approximation of player-vs-player collision — the
            // server's resolvePlayerCollisions is what's actually authoritative; this
            // just reduces the "briefly overlap a remote player, then snap back" pop
            // that would otherwise happen every time prediction runs ahead of a snapshot.
            remotePuppetsRef.current.forEach((puppet) => {
                if (Math.abs(player.z - puppet.z) > 30) return;
                const dx = player.x - puppet.x;
                const dy = player.y - puppet.y;
                const dist = Math.hypot(dx, dy);
                const minDist = player.radius + puppet.radius;
                if (dist > 0 && dist < minDist) {
                    const overlap = minDist - dist;
                    player.x += (dx / dist) * overlap;
                    player.y += (dy / dist) * overlap;
                }
            });

            // --- Hyper trail (purely cosmetic, purely local — driven by observed
            // movement, exactly as before networking existed) ---
            // 3D movement, not just x/y — otherwise jumping or falling
            // straight up/down with little horizontal motion never crosses
            // the threshold and the trail simply never appears while airborne.
            const moveDX = player.x - prevPlayerX;
            const moveDY = player.y - prevPlayerY;
            const moveDZ = player.z - prevPlayerZ;
            const moveDist = Math.hypot(moveDX, moveDY, moveDZ);
            const movePerTick = dt60 > 0 ? moveDist / dt60 : 0;
            const isHyperActive = player.activeBuffs.hyper > time;

            const MAX_TRAIL_POINTS = 26;
            if (isHyperActive && player.classType === 'peashooter' && movePerTick > 0.35) {
                // Sample every frame — closer-together points make the
                // eventual ribbon read as one smooth, continuously curving
                // shape instead of a chain of separately-angled pieces.
                hyperTrailPoints.push({ x: player.x, y: player.y, z: player.z });
                if (hyperTrailPoints.length > MAX_TRAIL_POINTS) hyperTrailPoints.shift();
            } else if (hyperTrailPoints.length > 0) {
                // Not actively trailing right now — drain from the tail so
                // it fades away smoothly instead of freezing in place or
                // popping out the instant Hyper ends.
                hyperTrailPoints.shift();
            }
            prevPlayerX = player.x;
            prevPlayerY = player.y;
            prevPlayerZ = player.z;

            for (let i = peaFiredParticles.length - 1; i >= 0; i--) {
                peaFiredParticles[i].life -= dt60;
                if (peaFiredParticles[i].life <= 0) peaFiredParticles.splice(i, 1);
            }

            for (let i = damageNumbers.length - 1; i >= 0; i--) {
                const dn = damageNumbers[i];
                dn.y -= 0.8 * dt60;
                dn.life -= dt60;
                dn.alpha = Math.max(0, dn.life / 40);
                if (dn.life <= 0) damageNumbers.splice(i, 1);
            }

            // --- Consume this frame's snapshot ---
            const snapshot = latestSnapshotRef.current;
            const prevSnapshot = prevSnapshotRef.current;
            const renderTime = performance.now() - snapshotReceivedAtRef.current + (snapshot?.serverTime ?? 0) - RENDER_DELAY_MS;
            // Bracket for remote-puppet interpolation — NOT the same as
            // prevSnapshot/snapshot above once RENDER_DELAY_MS spans more
            // than one tick (see findSnapshotBracket's comment).
            const interpBracket = findSnapshotBracket(snapshotBufferRef.current, renderTime);

            if (snapshot) {
                // One-shot events (sounds, muzzle flash, hit-splat text) must only fire the
                // instant a NEW snapshot arrives — not once per render frame. render() runs
                // at display refresh rate (~60fps); the server only produces a new snapshot
                // ~30 times/sec, so without this guard the same snapshot object gets
                // processed 2+ times before the next one arrives, replaying the same sounds.
                if (snapshot.tick !== lastProcessedTickRef.current) {
                    lastProcessedTickRef.current = snapshot.tick;

                    snapshot.soundEvents.forEach((evt) => {
                        soundManager.play(evt.key as SoundKey, evt.volume, evt.pitchVariation);
                    });

                    snapshot.soundEvents.forEach((evt) => {
                        if (evt.playerId === myIdRef.current && (evt.key === 'shoot_mono' || evt.key === 'gatling_core')) {
                            const barrelDist = player.radius * 0.85;
                            peaFiredParticles.push({
                                x: player.x + Math.cos(player.angle) * barrelDist,
                                y: player.y + Math.sin(player.angle) * barrelDist,
                                z: player.z,
                                angle: player.angle,
                                life: 8, maxLife: 8,
                            });
                        }
                    });
                }

                // Reconcile MY player — server is authority on health/ammo/reload/gatling/hyper.
                const mine = snapshot.players.find((p) => p.id === myIdRef.current);
                if (mine) {
                    player.health = mine.health;
                    player.maxHealth = mine.maxHealth;
                    player.ammo = mine.ammo;
                    player.maxAmmo = mine.maxAmmo;
                    player.isReloading = mine.isReloading;

                    // Compare against gatling mode as of the PREVIOUS confirmed server
                    // snapshot — not player.isGatlingMode, which can already be true from
                    // THIS frame's local prediction before the server has even processed
                    // the 'ability' message. Comparing against that local flag made every
                    // activation look like an "end" transition (true locally -> still
                    // false in the not-yet-caught-up snapshot) and seeded a cooldown the
                    // instant F was pressed, while Pea Gatling was still active.
                    const prevMine = prevSnapshot?.players.find((p) => p.id === myIdRef.current);
                    const wasGatlingModeOnServer = prevMine?.isGatlingMode ?? mine.isGatlingMode;

                    player.isGatlingMode = mine.isGatlingMode;
                    player.gatlingAmmo = mine.gatlingAmmo;
                    if (wasGatlingModeOnServer && !mine.isGatlingMode && player.cooldowns['F'] <= time) {
                        // Server ended gatling mode on its own (ammo depleted / forced exit).
                        // Local prediction never ran exitGatlingMode, so seed the cooldown here
                        // using our own clock, otherwise the ability icon renders "ready".
                        player.cooldowns['F'] = time + player.config.abilities.ability3.cooldown;
                        // Same story for the reverse-activation transition — exitGatlingMode()
                        // (the only place that normally starts it) was never called either.
                        player.isGatlingDeactivating = true;
                        player.gatlingDeactivateTimer = 0;
                    }

                    // Take the larger of the two: if Hyper was just activated locally, this
                    // snapshot may still predate the server processing that 'ability'
                    // message, and its hyperRemaining would otherwise stomp the fresh local
                    // prediction back to 0 — the same premature-cooldown bug Pea Gatling had,
                    // just via activeBuffs.hyper hitting 0 and tripping the
                    // wasHyperActive -> !isHyperActive check in update(). Hyper has no
                    // server-forced early exit (unlike gatling's ammo depletion), so it's
                    // always safe to trust whichever end-time is further out.
                    const serverHyperEnd = mine.activeBuffs.hyperRemaining > 0 ? time + mine.activeBuffs.hyperRemaining : 0;
                    player.activeBuffs.hyper = Math.max(player.activeBuffs.hyper, serverHyperEnd);

                    if (mine.isShooting && !player.isShooting) {
                        player.triggerShoot();
                    }
                    const posError = Math.hypot(mine.x - player.x, mine.y - player.y);
                    const correctionStrength = posError > 60 ? 1 : 0.15;
                    player.x += (mine.x - player.x) * correctionStrength;
                    player.y += (mine.y - player.y) * correctionStrength;
                    player.z += (mine.z - player.z) * correctionStrength;
                }

                // Remote players — interpolate using the buffer-derived bracket
                // that actually straddles the delayed render time.
                const seenIds = new Set<string>();
                snapshot.players.forEach((netPlayer) => {
                    if (netPlayer.id === myIdRef.current) return;
                    seenIds.add(netPlayer.id);

                    let puppet = remotePuppetsRef.current.get(netPlayer.id);
                    if (!puppet) {
                        puppet = new Player(netPlayer.x, netPlayer.y, netPlayer.classType);
                        remotePuppetsRef.current.set(netPlayer.id, puppet);
                    }
                    if (puppet.classType !== netPlayer.classType) {
                        puppet.setClass(netPlayer.classType);
                    }

                    let ix = netPlayer.x, iy = netPlayer.y, iz = netPlayer.z, iangle = netPlayer.angle;

                    if (interpBracket) {
                        const bracketPrev = interpBracket.prev.players.find((p) => p.id === netPlayer.id);
                        const bracketNext = interpBracket.next.players.find((p) => p.id === netPlayer.id);
                        if (bracketPrev && bracketNext) {
                            const span = interpBracket.next.serverTime - interpBracket.prev.serverTime || 1;
                            const t = Math.max(0, Math.min(1, (renderTime - interpBracket.prev.serverTime) / span));
                            ix = bracketPrev.x + (bracketNext.x - bracketPrev.x) * t;
                            iy = bracketPrev.y + (bracketNext.y - bracketPrev.y) * t;
                            iz = bracketPrev.z + (bracketNext.z - bracketPrev.z) * t;
                            iangle = bracketPrev.angle + (bracketNext.angle - bracketPrev.angle) * t;
                        }
                    }

                    const prevPuppetX = puppet.x, prevPuppetY = puppet.y, prevPuppetZ = puppet.z;

                    const wasPuppetGatlingMode = puppet.isGatlingMode;
                    puppet.health = netPlayer.health;
                    puppet.maxHealth = netPlayer.maxHealth;
                    puppet.isGatlingMode = netPlayer.isGatlingMode;
                    puppet.gatlingAmmo = netPlayer.gatlingAmmo;
                    // Puppets never call exitGatlingMode()/triggerAbility() themselves
                    // (they're driven purely off these network booleans), so the
                    // true->false edge that normally starts the reverse-activation
                    // transition has to be detected here instead.
                    if (wasPuppetGatlingMode && !puppet.isGatlingMode) {
                        puppet.isGatlingDeactivating = true;
                        puppet.gatlingDeactivateTimer = 0;
                    } else if (puppet.isGatlingMode) {
                        puppet.isGatlingDeactivating = false;
                    }

                    const wasShooting = puppet.isShooting;

                    // `time` (this frame's rAF timestamp) is passed through as the
                    // clock applyRemotePuppetState stamps activeBuffs.hyper with —
                    // it MUST match the domain used by isPuppetHyperActive's `> time`
                    // check below. A previous fix attempt set puppet.activeBuffs.hyper
                    // here directly, but applyRemotePuppetState immediately overwrote
                    // it with a Date.now()-based value, silently reintroducing a
                    // clock mismatch. Single source of truth now.
                    puppet.applyRemotePuppetState(ix, iy, iz, iangle, netPlayer.vz, netPlayer.isMoving, netPlayer.isShooting, netPlayer.isReloading, netPlayer.isHyperActive, netPlayer.activeBuffs.hyperRemaining, dt60, time);

                    // Just transitioned false -> true: a remote player pulled the trigger.
                    // Mirrors the local-player muzzle-flash spawn that's driven off the
                    // 'shoot_mono' / 'gatling_core' sound events, just keyed on the puppet's
                    // own state transition instead (remote shots don't carry a per-shot
                    // event we can hook into here without also duplicating on every snapshot).
                    if (!wasShooting && puppet.isShooting) {
                        const barrelDist = puppet.radius * 0.85;
                        peaFiredParticles.push({
                            x: puppet.x + Math.cos(puppet.angle) * barrelDist,
                            y: puppet.y + Math.sin(puppet.angle) * barrelDist,
                            z: puppet.z,
                            angle: puppet.angle,
                            life: 8, maxLife: 8,
                        });
                    }

                    // applyRemotePuppetState() never touches groundZ (it isn't
                    // running full physics), so without this it stays frozen
                    // at 0 forever — meaning this puppet's shadow would use
                    // raw z instead of height above its actual surface,
                    // breaking scaling for anyone standing on a roof/wall.
                    puppet.groundZ = computeGroundZ(ix, iy, iz, puppet.radius, structures);
                    puppet.updateAirborneAnimState(dt60);

                    // Same per-frame trail sampling as the local player's block
                    // below, just keyed per puppet id so each remote Hyper user
                    // gets their own independent ribbon.
                    let puppetTrail = remoteHyperTrailsRef.current.get(netPlayer.id);
                    if (!puppetTrail) {
                        puppetTrail = [];
                        remoteHyperTrailsRef.current.set(netPlayer.id, puppetTrail);
                    }
                    const puppetMoveDist = Math.hypot(puppet.x - prevPuppetX, puppet.y - prevPuppetY, puppet.z - prevPuppetZ);
                    const puppetMovePerTick = dt60 > 0 ? puppetMoveDist / dt60 : 0;
                    const isPuppetHyperActive = puppet.activeBuffs.hyper > time;
                    // TEMP DEBUG — remove once the trail is confirmed working.
                    // Throttled to ~2/sec per puppet so it's actually readable.
                    if (netPlayer.isHyperActive && (time % 500) < 17) {
                        console.log(
                            `[hyper-trail-debug] id=${netPlayer.id} netRemaining=${netPlayer.activeBuffs.hyperRemaining.toFixed(0)} ` +
                            `puppetHyperEndStamp=${puppet.activeBuffs.hyper.toFixed(0)} renderTime=${time.toFixed(0)} ` +
                            `isPuppetHyperActive=${isPuppetHyperActive} classType=${puppet.classType} ` +
                            `puppetMovePerTick=${puppetMovePerTick.toFixed(3)} puppetTrailLen=${puppetTrail.length}`
                        );
                    }
                    if (isPuppetHyperActive && puppet.classType === 'peashooter' && puppetMovePerTick > 0.35) {
                        puppetTrail.push({ x: puppet.x, y: puppet.y, z: puppet.z });
                        if (puppetTrail.length > MAX_TRAIL_POINTS) puppetTrail.shift();
                    } else if (puppetTrail.length > 0) {
                        puppetTrail.shift();
                    }
                });

                remotePuppetsRef.current.forEach((_, id) => {
                    if (!seenIds.has(id)) remotePuppetsRef.current.delete(id);
                });
                remoteHyperTrailsRef.current.forEach((_, id) => {
                    if (!seenIds.has(id)) remoteHyperTrailsRef.current.delete(id);
                });

                // Sync local puppet dummies (aim-assist + health-bar draw reuse only).
                snapshot.dummies.forEach((netDummy, idx) => {
                    if (!dummies[idx]) {
                        dummies[idx] = new TargetDummy(netDummy.x, netDummy.y, netDummy.team as any, netDummy.z);
                    }
                    const d = dummies[idx];
                    d.x = netDummy.x; d.y = netDummy.y; d.z = netDummy.z;
                    // Same reasoning as the remote player puppets above — this
                    // dummy never runs its own update(), so groundZ would
                    // otherwise stay stuck at whatever it was on the first
                    // snapshot that created it, breaking shadow scaling for
                    // the rest of its life (falls, pushes off a ledge, etc.).
                    d.groundZ = computeGroundZ(netDummy.x, netDummy.y, netDummy.z, netDummy.radius, structures);
                    d.radius = netDummy.radius;
                    d.health = netDummy.health; d.maxHealth = netDummy.maxHealth;
                    d.isDead = netDummy.isDead;
                    d.team = netDummy.team as any;
                });

                // Whizz — enemy projectiles passing near me, tracked by id so it only
                // plays once per projectile rather than every frame it's nearby.
                snapshot.projectiles.forEach((p) => {
                    if (p.team === player.team) return;
                    if (whizzedProjectileIdsRef.current.has(p.id)) return;
                    const distToPlayer = Math.hypot(p.x - player.x, p.y - player.y);
                    const zDiff = Math.abs(p.currentZ - player.z);
                    if (distToPlayer < 110 && zDiff < 35) {
                        whizzedProjectileIdsRef.current.add(p.id);
                        const volume = Math.max(0.2, 1 - distToPlayer / 110) * 0.6;
                        soundManager.play('whizz', volume, 0.08);
                    }
                });
                const currentProjectileIds = new Set(snapshot.projectiles.map((p) => p.id));
                whizzedProjectileIdsRef.current.forEach((id) => {
                    if (!currentProjectileIds.has(id)) whizzedProjectileIdsRef.current.delete(id);
                });

                // Damage numbers — spawned locally from one-shot hit events.
                snapshot.hitEvents.forEach((evt) => {
                    damageNumbers.push({ x: evt.x, y: evt.y, damage: evt.damage, alpha: 1.0, life: 40, isSplash: evt.isSplash });
                });
            }

            const prevTime = prevTimeRef.current;
            (['Q', 'E', 'F'] as const).forEach((slot) => {
                const cdTimestamp = player.cooldowns[slot];
                if (cdTimestamp > 0 && cdTimestamp > prevTime && cdTimestamp <= time) {
                    soundManager.play('ability_recharged', 0.6);
                }
            });
            prevTimeRef.current = time;

            const getCooldownState = (slot: 'Q' | 'E' | 'F') => {
                const ability =
                    slot === 'Q' ? player.config.abilities.ability1 :
                        slot === 'E' ? player.config.abilities.ability2 :
                            player.config.abilities.ability3;
                const cdRemaining = Math.max(0, player.cooldowns[slot] - time);
                const activeRemaining = slot === 'E' && player.activeBuffs.hyper > time ? player.activeBuffs.hyper - time : 0;
                return { cooldownRemaining: cdRemaining, maxCooldown: ability.cooldown, activeRemaining };
            };

            onStatsUpdate({
                health: player.health,
                maxHealth: player.maxHealth,
                ammo: player.isGatlingMode ? player.gatlingAmmo : player.ammo,
                maxAmmo: player.isGatlingMode ? 100 : player.maxAmmo,
                isReloading: player.isReloading,
                className: player.classType,
                displayName: player.config.displayName,
                weaponName: player.isGatlingMode ? 'Pea Gatling' : player.config.weapon.name,
                isRooted: player.isGatlingMode || player.isChargingZPG,
                isChargingZPG: player.isChargingZPG,
                abilities: {
                    ability1: getCooldownState('Q'),
                    ability2: getCooldownState('E'),
                    ability3: getCooldownState('F'),
                },
            });

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.scale(displayZoom, displayZoom);
            ctx.translate(-player.x, -player.y);

            ctx.strokeStyle = '#e0e0e0';
            ctx.lineWidth = 1;
            for (let x = 0; x < mapBounds.width; x += 50) {
                ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mapBounds.height); ctx.stroke();
            }
            for (let y = 0; y < mapBounds.height; y += 50) {
                ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mapBounds.width, y); ctx.stroke();
            }

            type RenderItem = { sortY: number; draw: () => void };
            const renderQueue: RenderItem[] = [];

            structures.forEach((s) => {
                renderQueue.push({
                    sortY: s.y + s.height,
                    draw: () => {
                        // Fade the structure whenever it's hiding ANYONE we're
                        // currently drawing, not just the local player — dummies
                        // and remote puppets standing under a roof deserve the
                        // same see-through treatment, otherwise they render
                        // fully occluded even though the local player next to
                        // them renders fine.
                        //
                        // BUT: gate that on the hidden entity being near the
                        // local player. Without this, a structure clear across
                        // the map fades the instant ANY player anywhere is
                        // behind ANY structure, which amounts to a map-wide
                        // wallhack — it gives away a camper's position from a
                        // distance and kills the surprise factor structures are
                        // supposed to provide. The local player's own occlusion
                        // check is exempt: you always get to see through
                        // whatever's currently hiding you specifically.
                        const STRUCTURE_XRAY_RADIUS = 420;
                        const isNearLocalPlayer = (ex: number, ey: number): boolean => {
                            const dx = ex - player.x;
                            const dy = ey - player.y;
                            return dx * dx + dy * dy <= STRUCTURE_XRAY_RADIUS * STRUCTURE_XRAY_RADIUS;
                        };

                        const isOccluded =
                            isEntityBehindStructure(player.x, player.y, player.z, player.radius, s) ||
                            dummies.some((d) =>
                                !d.isDead && isNearLocalPlayer(d.x, d.y) && isEntityBehindStructure(d.x, d.y, d.z, d.radius, s)
                            ) ||
                            Array.from(remotePuppetsRef.current.values()).some((p) =>
                                isNearLocalPlayer(p.x, p.y) && isEntityBehindStructure(p.x, p.y, p.z, p.radius, s)
                            );

                        // Ease toward the target opacity instead of snapping —
                        // same lerp-toward-target idea as the camera zoom above
                        // (currentZoom += (target - current) * rate * dt60).
                        // Without this, crossing the radius or stepping behind
                        // the structure caused an instant, jarring opacity flip.
                        const FADE_RATE = 0.1;
                        const targetAlpha = isOccluded ? 0.45 : 1;
                        const alphaMap = structureAlphaRef.current;
                        const currentAlpha = alphaMap.get(s.id) ?? 1;
                        const nextAlpha = currentAlpha + (targetAlpha - currentAlpha) * Math.min(1, FADE_RATE * dt60);
                        alphaMap.set(s.id, nextAlpha);

                        ctx.save();
                        ctx.globalAlpha = nextAlpha;
                        drawStructure(s);
                        ctx.restore();
                    },
                });
            });

            renderQueue.push({
                sortY: getEffectiveSortY(player.x, player.y, player.z, player.radius, structures),
                draw: () => {
                    const activeSprites = player.classType === 'peashooter' ? peashooterSpritesRef.current : null;
                    player.draw(ctx, activeSprites);
                },
            });

            if (hyperTrailPoints.length >= 2) {
                // Slightly behind the player's own sortY so the ribbon reads
                // as trailing out from under the character rather than
                // painted over top of them, while still sorting relative to
                // structures/other entities exactly like the player does.
                renderQueue.push({
                    sortY: getEffectiveSortY(player.x, player.y, player.z, player.radius, structures) - 0.05,
                    draw: () => drawHyperTrail(ctx, hyperTrailPoints),
                });
            }

            remotePuppetsRef.current.forEach((puppet, id) => {
                const puppetTrail = remoteHyperTrailsRef.current.get(id);
                if (puppetTrail && puppetTrail.length >= 2) {
                    // TEMP DEBUG — remove once the trail is confirmed working.
                    if (Math.random() < 0.05) {
                        console.log(
                            `[hyper-trail-draw] id=${id} points=${puppetTrail.length} ` +
                            `puppetPos=(${puppet.x.toFixed(0)},${puppet.y.toFixed(0)},${puppet.z.toFixed(0)}) ` +
                            `head=(${puppetTrail[puppetTrail.length - 1].x.toFixed(0)},${puppetTrail[puppetTrail.length - 1].y.toFixed(0)})`
                        );
                    }
                    // Same offset trick as the local trail — trails just
                    // behind that puppet's own sortY, not painted over it.
                    renderQueue.push({
                        sortY: getEffectiveSortY(puppet.x, puppet.y, puppet.z, puppet.radius, structures) - 0.05,
                        draw: () => drawHyperTrail(ctx, puppetTrail),
                    });
                }
                renderQueue.push({
                    sortY: getEffectiveSortY(puppet.x, puppet.y, puppet.z, puppet.radius, structures),
                    draw: () => {
                        const activeSprites = puppet.classType === 'peashooter' ? peashooterSpritesRef.current : null;
                        puppet.draw(ctx, activeSprites);
                    },
                });
            });

            peaFiredParticles.forEach((particle) => {
                const dirInfo = get8WayDirection(particle.angle);
                const isFacingUp = dirInfo.direction === 'N' || dirInfo.direction === 'NE' || dirInfo.direction === 'NW';
                const baseSortY = getEffectiveSortY(particle.x, particle.y, particle.z, player.radius, structures);
                renderQueue.push({
                    sortY: isFacingUp ? baseSortY - 1 : baseSortY + 1,
                    draw: () => {
                        ctx.save();
                        const drawY = particle.y - particle.z * VISUAL_Y_FACTOR;
                        const progress = Math.min(1, Math.max(0, 1 - particle.life / particle.maxLife));
                        const frames = peaFiredFramesRef.current;
                        const frameIdx = Math.min(frames.length - 1, Math.floor(progress * frames.length));
                        const frame = frames[frameIdx];
                        const size = player.radius * 3.2;

                        ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
                        ctx.translate(particle.x, drawY);
                        ctx.rotate(particle.angle);

                        if (frame && frame.complete && frame.naturalWidth !== 0) {
                            ctx.drawImage(frame, -size / 2, -size / 2, size, size);
                        } else {
                            ctx.beginPath();
                            ctx.arc(0, 0, player.radius * 0.7, 0, Math.PI * 2);
                            ctx.fillStyle = '#8BC34A';
                            ctx.fill();
                        }
                        ctx.restore();
                    },
                });
            });

            dummies.forEach((dummy) => {
                if (!dummy.isDead) {
                    renderQueue.push({
                        sortY: getEffectiveSortY(dummy.x, dummy.y, dummy.z, dummy.radius, structures),
                        draw: () => dummy.draw(ctx),
                    });
                }
            });

            snapshot?.chiliBeans.forEach((bean) => {
                renderQueue.push({
                    sortY: getEffectiveSortY(bean.x, bean.y, bean.z, bean.radius, structures, 15),
                    draw: () => {
                        let currentFloorZ = 0;
                        structures.forEach((s) => {
                            if (bean.x >= s.x && bean.x <= s.x + s.width && bean.y >= s.y && bean.y <= s.y + s.height) {
                                if (bean.z >= s.z - 15) currentFloorZ = Math.max(currentFloorZ, s.z);
                            }
                        });

                        const floorVisualY = bean.y - currentFloorZ * VISUAL_Y_FACTOR;
                        const beanVisualY = bean.y - bean.z * VISUAL_Y_FACTOR;

                        // The bean sprite is drawn centered on beanVisualY
                        // (spans ±beanSize/2), so when resting on the ground
                        // a shadow placed at the raw floor point lands at the
                        // sprite's vertical middle instead of its base — a
                        // bit too high, same class of mismatch as the player
                        // sprite had. Nudge it down toward the visual base.
                        const BEAN_FEET_OFFSET = bean.radius * 0.8;
                        const floorShadowY = floorVisualY + BEAN_FEET_OFFSET;

                        ctx.save();

                        // 1. Unrotated Ground Shadow
                        ctx.beginPath();
                        ctx.ellipse(bean.x, floorShadowY, bean.radius * 0.9, bean.radius * 0.45, 0, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(0,0,0,0.3)';
                        ctx.fill();

                        // 2. Unrotated Altitude Line
                        if (bean.z > currentFloorZ + 2) {
                            ctx.beginPath();
                            ctx.moveTo(bean.x, floorShadowY);
                            ctx.lineTo(bean.x, beanVisualY);
                            ctx.strokeStyle = 'rgba(255, 235, 59, 0.5)';
                            ctx.lineWidth = 1.5;
                            ctx.setLineDash([4, 4]);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }

                        // 3. Sprite Selection
                        let beanSprite: HTMLImageElement | null;
                        if (!bean.isLanded) {
                            beanSprite = chiliBeanThrownRef.current;
                        } else if (bean.fuseTimer >= 800) {
                            beanSprite = chiliBeanStage1Ref.current;
                        } else {
                            const isFlashFrame = Math.floor(performance.now() / 80) % 2 === 0;
                            beanSprite = isFlashFrame ? chiliBeanStage3Ref.current : chiliBeanStage2Ref.current;
                        }

                        const heightScale = 1 + bean.z * Z_HEIGHT_SCALE;
                        const beanSize = bean.radius * 2.4 * heightScale;
                        const isFlashing = bean.fuseTimer < 800 && Math.floor(performance.now() / 80) % 2 === 0;

                        // 4. Rotated Bean Body & Fallback
                        ctx.save();
                        ctx.translate(bean.x, beanVisualY);

                        const beanRotation = (bean as typeof bean & { rotation?: number }).rotation;
                        if (beanRotation !== undefined) {
                            ctx.rotate(beanRotation);
                        }

                        if (beanSprite && beanSprite.complete && beanSprite.naturalWidth !== 0) {
                            ctx.drawImage(beanSprite, -beanSize / 2, -beanSize / 2, beanSize, beanSize);
                        } else {
                            const fallbackRadius = bean.radius * heightScale;
                            ctx.beginPath();
                            ctx.arc(0, 0, fallbackRadius, 0, Math.PI * 2);
                            ctx.fillStyle = isFlashing ? '#FFEB3B' : '#D32F2F';
                            ctx.fill();
                            ctx.strokeStyle = '#FFEB3B';
                            ctx.lineWidth = 3;
                            ctx.stroke();
                        }
                        ctx.restore();

                        ctx.restore();
                    },
                });
            });

            snapshot?.stinkGrenades.forEach((grenade) => {
                renderQueue.push({
                    sortY: getEffectiveSortY(grenade.x, grenade.y, grenade.z, 6, structures, 24),
                    draw: () => {
                        let currentFloorZ = 0;
                        structures.forEach((s) => {
                            if (grenade.x >= s.x && grenade.x <= s.x + s.width && grenade.y >= s.y && grenade.y <= s.y + s.height) {
                                if (grenade.z >= s.z - 15) currentFloorZ = Math.max(currentFloorZ, s.z);
                            }
                        });

                        const floorVisualY = grenade.y - currentFloorZ * VISUAL_Y_FACTOR;
                        const grenadeVisualY = grenade.y - grenade.z * VISUAL_Y_FACTOR;

                        ctx.save();
                        ctx.beginPath();
                        ctx.ellipse(grenade.x, floorVisualY, 6, 3, 0, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(0,0,0,0.3)';
                        ctx.fill();

                        if (grenade.z > currentFloorZ + 2) {
                            ctx.beginPath();
                            ctx.moveTo(grenade.x, floorVisualY);
                            ctx.lineTo(grenade.x, grenadeVisualY);
                            ctx.strokeStyle = 'rgba(156, 39, 176, 0.5)';
                            ctx.lineWidth = 1.5;
                            ctx.setLineDash([3, 3]);
                            ctx.stroke();
                            ctx.setLineDash([]);
                        }

                        const heightScale = 1 + grenade.z * Z_HEIGHT_SCALE;
                        ctx.beginPath();
                        ctx.arc(grenade.x, grenadeVisualY, 6 * heightScale, 0, Math.PI * 2);
                        ctx.fillStyle = '#7B1FA2';
                        ctx.fill();
                        ctx.strokeStyle = '#E0E0E0';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();

                        ctx.restore();
                    },
                });
            });

            snapshot?.stinkClouds.forEach((cloud) => {
                renderQueue.push({
                    sortY: getEffectiveSortY(cloud.x, cloud.y, cloud.z, cloud.radius, structures, 24),
                    draw: () => {
                        const cloudVisualY = cloud.y - cloud.z * VISUAL_Y_FACTOR;
                        const heightScale = 1 + cloud.z * Z_HEIGHT_SCALE;
                        ctx.save();
                        ctx.beginPath();
                        ctx.ellipse(cloud.x, cloudVisualY, cloud.radius * heightScale, cloud.radius * 0.5 * heightScale, 0, 0, Math.PI * 2);
                        ctx.fillStyle = 'rgba(123, 31, 162, 0.35)';
                        ctx.fill();
                        ctx.strokeStyle = 'rgba(156, 39, 176, 0.5)';
                        ctx.lineWidth = 2;
                        ctx.stroke();
                        ctx.restore();
                    },
                });
            });

            // Projectiles are removed from server state the instant they hit
            // something (see server updateProjectiles) — unlike players, who
            // just flip isDead and stay in the list. Sourcing this loop from
            // `snapshot` (latestSnapshotRef — the newest, UNDELAYED snapshot)
            // meant a projectile vanished the moment the server removed it,
            // in real time — but rendering is deliberately RENDER_DELAY_MS
            // behind that (see RENDER_DELAY_MS above), so from the delayed
            // timeline's point of view it disappeared up to RENDER_DELAY_MS
            // worth of travel distance too early: "a few inches short of the
            // target" is exactly what that gap looks like, even though the
            // server's own hit position was correct the whole time. Sourcing
            // the draw list from the SAME interpolation bracket used to
            // position everything else keeps a projectile visible for
            // exactly as long as the delayed timeline says it should be, so
            // it disappears right where it actually lands instead of early.
            const bracketProjectiles = new Map<string, ServerSnapshotMessage['projectiles'][number]>();
            if (interpBracket) {
                interpBracket.prev.projectiles.forEach((bp) => bracketProjectiles.set(bp.id, bp));
                interpBracket.next.projectiles.forEach((bp) => bracketProjectiles.set(bp.id, bp)); // next wins where both have it
            } else {
                snapshot?.projectiles.forEach((sp) => bracketProjectiles.set(sp.id, sp));
            }

            // Cosmetic "motion smear" — elongates a projectile along its
            // direction of travel and squashes it slightly across that axis
            // (inverse-sqrt keeps the rendered area roughly constant) so
            // fast shots read as fast. Visual only: doesn't touch the
            // projectile's actual position, radius, or hit-testing.
            const PROJECTILE_STRETCH = 1.35;

            bracketProjectiles.forEach((p) => {
                // Same interpolation the remote-player branch above already
                // does — was missing here entirely, which is the actual
                // cause of the jankiness: projectiles were drawn at whatever
                // position the single most recent snapshot said, jumping in
                // discrete ~33ms (server tick) steps instead of gliding.
                // Invisible with only a few projectiles in flight at once;
                // increasingly obvious the more of them there are — which is
                // exactly why a fast-firing weapon made it stand out.
                let ix = p.x, iy = p.y, iz = p.currentZ;
                let travelAngle: number | null = null;
                if (interpBracket) {
                    const bracketPrev = interpBracket.prev.projectiles.find((bp) => bp.id === p.id);
                    const bracketNext = interpBracket.next.projectiles.find((bp) => bp.id === p.id);
                    if (bracketPrev && bracketNext) {
                        const span = interpBracket.next.serverTime - interpBracket.prev.serverTime || 1;
                        const t = Math.max(0, Math.min(1, (renderTime - interpBracket.prev.serverTime) / span));
                        ix = bracketPrev.x + (bracketNext.x - bracketPrev.x) * t;
                        iy = bracketPrev.y + (bracketNext.y - bracketPrev.y) * t;
                        iz = bracketPrev.currentZ + (bracketNext.currentZ - bracketPrev.currentZ) * t;

                        // Direction of travel over this bracket, in the same
                        // visual (y - z*VISUAL_Y_FACTOR) space everything is
                        // actually drawn in — used purely to orient the
                        // stretch effect below, not for positioning.
                        const dxWorld = bracketNext.x - bracketPrev.x;
                        const dyVisual =
                            (bracketNext.y - bracketNext.currentZ * VISUAL_Y_FACTOR) -
                            (bracketPrev.y - bracketPrev.currentZ * VISUAL_Y_FACTOR);
                        if (dxWorld !== 0 || dyVisual !== 0) {
                            travelAngle = Math.atan2(dyVisual, dxWorld);
                        }
                    }
                    // No bracketPrev usually means the projectile spawned
                    // this very tick — nothing to lerp (or orient the
                    // stretch from) yet, so it falls back to its raw
                    // snapshot position for one frame and starts
                    // interpolating smoothly from the next tick on, once it
                    // exists in two consecutive buffered snapshots.
                }

                // Trail sampling — uses the same interpolated ix/iy/iz as the
                // projectile itself, so the trail is exactly as smooth as
                // the head it's attached to, not a jankier version of it.
                if (p.hasTrail) {
                    let trail = projectileTrailsRef.current.get(p.id);
                    if (!trail) {
                        trail = [];
                        projectileTrailsRef.current.set(p.id, trail);
                        projectileTrailSpawnRef.current.set(p.id, renderTime);
                    }
                    trail.push({ x: ix, y: iy, z: iz });
                    if (trail.length > MAX_PROJECTILE_TRAIL_POINTS) trail.shift();
                }

                renderQueue.push({
                    sortY: getEffectiveSortY(ix, iy, iz, p.weaponRadius, structures),
                    draw: () => {
                        ctx.save();
                        ctx.globalAlpha = p.alpha;
                        const drawY = iy - iz * VISUAL_Y_FACTOR;
                        // This one path draws every generic projectile — primary
                        // weapon, Pea Gatling, and ZPG all funnel through the same
                        // state.projectiles array — so it was missing the same
                        // height-based scale chiliBeans/stinkGrenades/explosions
                        // already apply, making shots look identically-sized
                        // regardless of how high up they were.
                        const heightScale = 1 + iz * Z_HEIGHT_SCALE;
                        const displayRadius = p.weaponRadius * heightScale;
                        const sprite = p.team === 'plants' ? peaSpriteRef.current : null;

                        ctx.translate(ix, drawY);
                        if (travelAngle !== null) {
                            // Rotate the stretch axis onto travelAngle, scale,
                            // then rotate back — the sprite itself is round,
                            // so un-rotating after the scale leaves its look
                            // untouched and only the elongation ends up
                            // aligned with the direction of travel.
                            ctx.rotate(travelAngle);
                            ctx.scale(PROJECTILE_STRETCH, 1 / Math.sqrt(PROJECTILE_STRETCH));
                            ctx.rotate(-travelAngle);
                        }

                        if (sprite && sprite.complete && sprite.naturalWidth !== 0) {
                            const size = displayRadius * 2;
                            ctx.drawImage(sprite, -displayRadius, -displayRadius, size, size);
                        } else {
                            ctx.beginPath();
                            ctx.arc(0, 0, displayRadius, 0, Math.PI * 2);
                            ctx.fillStyle = p.weaponColor;
                            ctx.fill();
                        }
                        ctx.restore();
                    },
                });
            });

            // Trails render as their own pass rather than inside the loop
            // above: a trail's sortY needs to come from its own head point
            // (kept alongside it below), and stale entries — a projectile
            // that hit something and dropped out of the current
            // interpolation bracket — need pruning exactly once per frame,
            // not once per still-live projectile.
            {
                const liveProjectileIds = new Set(bracketProjectiles.keys());
                projectileTrailsRef.current.forEach((trail, id) => {
                    if (!liveProjectileIds.has(id)) {
                        // Gone from the current bracket — hit something, or
                        // expired. Simplified relative to the Hyper trail's
                        // gradual drain-on-deactivate: a projectile
                        // disappears outright (impact, or its own alpha
                        // fade already handles range-expiry), so the trail
                        // just goes with it rather than lingering to drain
                        // on its own.
                        projectileTrailsRef.current.delete(id);
                        projectileTrailSpawnRef.current.delete(id);
                        return;
                    }
                    if (trail.length < 2) return;

                    // Ease the visible slice of the trail out from the tail
                    // over TRAIL_GROWTH_MS — see TRAIL_GROWTH_MS's comment.
                    const spawnTime = projectileTrailSpawnRef.current.get(id) ?? renderTime;
                    const growthT = Math.max(0, Math.min(1, (renderTime - spawnTime) / TRAIL_GROWTH_MS));
                    const growth = 1 - Math.pow(1 - growthT, 3); // ease-out cubic: quick to start, settles into full length
                    const visibleCount = Math.max(2, Math.round(trail.length * growth));
                    const visiblePoints = visibleCount >= trail.length ? trail : trail.slice(trail.length - visibleCount);

                    const head = visiblePoints[visiblePoints.length - 1];
                    const ownerProjectile = bracketProjectiles.get(id)!;
                    renderQueue.push({
                        // Slightly behind the projectile's own sortY, same
                        // -0.05 convention as the Hyper trail relative to its
                        // player, so the projectile draws on top of its trail
                        // rather than the trail painting over it.
                        sortY: getEffectiveSortY(head.x, head.y, head.z, ownerProjectile.weaponRadius, structures) - 0.05,
                        draw: () => drawProjectileTrail(ctx, visiblePoints, ownerProjectile.weaponColor, growth),
                    });
                });
            }

            snapshot?.explosions.forEach((exp) => {
                let sortY = getEffectiveSortY(exp.x, exp.y, exp.z, exp.currentRadius, structures, 15);
                
                let drawX = exp.x;
                let drawBaseY = exp.y;

                if (exp.impactStructureId) {
                    const hitStruct = structures.find((s) => s.id === exp.impactStructureId);
                    
                    if (hitStruct && exp.angle !== undefined) {
                        const vx = Math.cos(exp.angle);
                        const vy = Math.sin(exp.angle);
                        
                        let t_x = Infinity;
                        let edgeX = '';
                        if (vx > 0.0001) {
                            t_x = (exp.x - hitStruct.x) / vx;
                            edgeX = 'left';
                        } else if (vx < -0.0001) {
                            t_x = (exp.x - (hitStruct.x + hitStruct.width)) / vx;
                            edgeX = 'right';
                        }

                        let t_y = Infinity;
                        let edgeY = '';
                        if (vy > 0.0001) {
                            t_y = (exp.y - hitStruct.y) / vy;
                            edgeY = 'top';
                        } else if (vy < -0.0001) {
                            t_y = (exp.y - (hitStruct.y + hitStruct.height)) / vy;
                            edgeY = 'bottom';
                        }

                        if (t_x !== Infinity || t_y !== Infinity) {
                            const impactedFace = t_x < t_y ? edgeX : edgeY;
                            const pushDistance = 10;

                            if (impactedFace === 'left') {
                                drawX -= pushDistance;
                                sortY = Math.min(sortY, hitStruct.y - 0.1);
                            } else if (impactedFace === 'right') {
                                drawX += pushDistance;
                                sortY = Math.min(sortY, hitStruct.y - 0.1);
                            } else if (impactedFace === 'top') {
                                drawBaseY -= pushDistance;
                                sortY = Math.min(sortY, hitStruct.y - 0.1);
                            } else if (impactedFace === 'bottom') {
                                drawBaseY += pushDistance;
                                sortY = Math.max(sortY, hitStruct.y + hitStruct.height + 0.2);
                            }
                        }
                    }
                }

                renderQueue.push({
                    sortY,
                    draw: () => {
                        ctx.save();
                        // Safely apply the Z-height factor to the correctly pushed base Y
                        const finalVisualY = drawBaseY - exp.z * VISUAL_Y_FACTOR;
                        const progress = 1 - exp.alpha;
                        const heightScale = 1 + exp.z * Z_HEIGHT_SCALE;

                        if (exp.type === 'pea') {
                            const frames = peaSplashFramesRef.current;
                            const frameIdx = Math.min(frames.length - 1, Math.floor(progress * frames.length));
                            const frame = frames[frameIdx];
                            const size = exp.currentRadius * 2.2 * heightScale;

                            ctx.globalAlpha = exp.alpha;
                            ctx.translate(drawX, finalVisualY);
                            if (exp.angle !== undefined) ctx.rotate(exp.angle);

                            if (frame && frame.complete && frame.naturalWidth !== 0) {
                                ctx.drawImage(frame, -size / 2, -size / 2, size, size);
                            } else {
                                ctx.beginPath();
                                ctx.arc(0, 0, exp.currentRadius, 0, Math.PI * 2);
                                ctx.fillStyle = `rgba(139, 195, 74, ${exp.alpha * 0.5})`;
                                ctx.fill();
                            }
                        } else {
                            const frames = chiliExplosionFramesRef.current;
                            const frameIdx = Math.min(frames.length - 1, Math.floor(progress * frames.length));
                            const frame = frames[frameIdx];
                            const size = exp.currentRadius * 2.6 * heightScale;

                            if (frame && frame.complete && frame.naturalWidth !== 0) {
                                ctx.globalAlpha = exp.alpha;
                                // Properly map drawX and finalVisualY instead of exp.x
                                ctx.drawImage(frame, drawX - size / 2, finalVisualY - size / 2, size, size);
                            } else {
                                ctx.beginPath();
                                // Properly map drawX and finalVisualY instead of exp.x
                                ctx.arc(drawX, finalVisualY, exp.currentRadius, 0, Math.PI * 2);
                                ctx.fillStyle = `rgba(255, 87, 34, ${exp.alpha * 0.4})`;
                                ctx.fill();
                            }
                        }
                        ctx.restore();
                    },
                });
            });

            renderQueue.sort((a, b) => a.sortY - b.sortY);
            renderQueue.forEach((item) => item.draw());

            damageNumbers.forEach((dn) => {
                ctx.save();
                ctx.font = 'bold 16px sans-serif';
                ctx.fillStyle = `rgba(255, 235, 59, ${dn.alpha})`;
                ctx.fillText(`-${dn.damage}`, dn.x, dn.y);
                ctx.restore();
            });

            ctx.restore();
            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvasToContainer);
            resizeObserver.disconnect();
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            canvas.removeEventListener('contextmenu', handleContextMenu);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onStatsUpdate, selectedClass]);

    return <canvas ref={canvasRef} className="game-viewport" />;
};
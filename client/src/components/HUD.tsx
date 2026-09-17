import React from 'react';
import { PlayerStats, AbilityCooldownState } from '@shared/types/game';

interface HUDProps {
    stats: PlayerStats;
}

const AbilityIcon: React.FC<{ label: string; keyBind: string; state: AbilityCooldownState }> = ({
    label,
    keyBind,
    state,
}) => {
    const isCd = state.cooldownRemaining > 0;
    const cdSeconds = (state.cooldownRemaining / 1000).toFixed(1);

    return (
        <div className={`ability-box ${isCd ? 'on-cooldown' : ''}`}>
            <span className="ability-key">{keyBind}</span>
            <span className="ability-name">{label}</span>
            {isCd && <div className="cooldown-overlay">{cdSeconds}s</div>}
        </div>
    );
};

export const HUD: React.FC<HUDProps> = ({ stats }) => {
    return (
        <div className="hud-container">
            <div className="hud-card health-card">
                <span className="hud-label">{stats.displayName.toUpperCase()}</span>
                <div className="health-bar-bg">
                    <div className="health-bar-fill" style={{ width: `${(stats.health / stats.maxHealth) * 100}%` }} />
                </div>
                <span className="hud-value">{stats.health} / {stats.maxHealth} HP</span>
            </div>

            <div className="abilities-bar">
                <AbilityIcon label="Skill 1" keyBind="Q" state={stats.abilities.ability1} />
                <AbilityIcon label="Skill 2" keyBind="E" state={stats.abilities.ability2} />
                <AbilityIcon label="Skill 3" keyBind="F" state={stats.abilities.ability3} />
            </div>

            <div className="hud-card ammo-card">
                <span className="hud-label">{stats.weaponName.toUpperCase()}</span>
                <span className="hud-value">
                    {stats.isReloading ? 'RELOADING...' : `${stats.ammo} / ${stats.maxAmmo}`}
                </span>
            </div>
        </div>
    );
};
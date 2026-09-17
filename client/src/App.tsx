import { useState, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { PlayerStats, CharacterClass } from '@shared/types/game';
import './styles/Game.css';

export default function App() {
    const [selectedClass, setSelectedClass] = useState<CharacterClass>('peashooter');
    const [stats, setStats] = useState<PlayerStats>({
        health: 125,
        maxHealth: 125,
        ammo: 10,
        maxAmmo: 10,
        isReloading: false,
        className: 'peashooter',
        displayName: 'Peashooter',
        weaponName: 'Pea Cannon',
        isRooted: false,
        abilities: {
            ability1: { cooldownRemaining: 0, maxCooldown: 12000, activeRemaining: 0 },
            ability2: { cooldownRemaining: 0, maxCooldown: 15000, activeRemaining: 0 },
            ability3: { cooldownRemaining: 0, maxCooldown: 20000, activeRemaining: 0 },
        },
    });

    const handleStatsUpdate = useCallback((newStats: PlayerStats) => {
        setStats(newStats);
    }, []);

    return (
        <div className="game-container">
            <div className="game-header">
                <h1 className="game-title">PvZ: Garden Warfare 2D Demake</h1>
                <div className="class-selector">
                    <button
                        className={`class-btn ${selectedClass === 'peashooter' ? 'active-plant' : ''}`}
                        onClick={() => setSelectedClass('peashooter')}
                    >
                        Peashooter (Plant)
                    </button>
                    <button
                        className={`class-btn ${selectedClass === 'footsoldier' ? 'active-zombie' : ''}`}
                        onClick={() => setSelectedClass('footsoldier')}
                    >
                        Foot Soldier (Zombie)
                    </button>
                </div>
            </div>
            <div className="viewport-wrapper">
                <GameCanvas selectedClass={selectedClass} onStatsUpdate={handleStatsUpdate} />
                <HUD stats={stats} />
            </div>
        </div>
    );
}
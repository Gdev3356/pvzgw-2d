// Imports mapping to the file names in your src/assets folder
import reloadWav from '../assets/Peashooter/Audios/wep_peashooter_peacannon_reload_standard.wav';
import shootCoreMonoWav from '../assets/Peashooter/Audios/wep_peashooter_peacannon_core_mono.wav';
import shootCoreStereoWav from '../assets/Peashooter/Audios/wep_peashooter_peacannon_core_stereo_distant.wav';
import speedbuffJumpVoWav from '../assets/Peashooter/Audios/VO_Peashooter_Speedbuff_Jump_NWA.wav';
import speedbuffBuffVoWav from '../assets/Peashooter/Audios/vo_peashooter_speedbuff.wav';
import reloadVoWav from '../assets/Peashooter/Audios/VO_Peashooter_Reload_NWA.wav';
import deathVoWav from '../assets/Peashooter/Audios/vo_peashooter_death.wav';
import abilityRechargedWav from '../assets/UI/Audio/UI_Ability_Recharged.wav';
import impactCloseWav from '../assets/Peashooter/Audios/Turret_PeaShooter_Weapon_Impact_Close.wav';
import gatlingUnrootWav from '../assets/Peashooter/Audios/Peashooter_PeaGatling_UnRoot.wav';
import gatlingRootWav from '../assets/Peashooter/Audios/Peashooter_PeaGatling_Root.wav';
import projectileWhizzWav from '../assets/Peashooter/Audios/peashooter_peacannon_whizz.wav';
import hyperStopWav from '../assets/Peashooter/Audios/peashooter_hyperjump_stop.wav';
import hyperStartWav from '../assets/Peashooter/Audios/peashooter_hyperjump_start.wav';
import clothWav from '../assets/Peashooter/Audios/Peashooter_Cloth.wav';
import gatlingCoreBassWav from '../assets/Peashooter/Audios/CoreBassClose_PeaGatling.wav';
import chiliVoWav from '../assets/Peashooter/Audios/chilibean_normal_vo.wav';
import chiliFireWav from '../assets/Peashooter/Audios/chilibean_normal_fire.wav';
import chiliExplodeWav from '../assets/Peashooter/Audios/chilibean_normal_explode_core.wav';

export type SoundKey =
    | 'reload'
    | 'reload_vo'
    | 'shoot_mono'
    | 'shoot_distant'
    | 'hyper_on_vo'
    | 'hyper_vo'
    | 'death'
    | 'ability_recharged'
    | 'impact'
    | 'gatling_root'
    | 'gatling_unroot'
    | 'whizz'
    | 'hyper_start'
    | 'hyper_stop'
    | 'cloth'
    | 'gatling_core'
    | 'chili_vo'
    | 'chili_fire'
    | 'chili_explode';

class SoundManager {
    private sounds: Map<SoundKey, HTMLAudioElement> = new Map();
    private isMuted: boolean = false;

    constructor() {
        const sources: Record<SoundKey, string> = {
            reload: reloadWav,
            reload_vo: reloadVoWav,
            shoot_mono: shootCoreMonoWav,
            shoot_distant: shootCoreStereoWav,
            hyper_on_vo: speedbuffBuffVoWav,
            hyper_vo: speedbuffJumpVoWav,
            death: deathVoWav,
            ability_recharged: abilityRechargedWav,
            impact: impactCloseWav,
            gatling_root: gatlingRootWav,
            gatling_unroot: gatlingUnrootWav,
            whizz: projectileWhizzWav,
            hyper_start: hyperStartWav,
            hyper_stop: hyperStopWav,
            cloth: clothWav,
            gatling_core: gatlingCoreBassWav,
            chili_vo: chiliVoWav,
            chili_fire: chiliFireWav,
            chili_explode: chiliExplodeWav,
        };

        Object.entries(sources).forEach(([key, src]) => {
            const audio = new Audio(src);
            audio.preload = 'auto';
            this.sounds.set(key as SoundKey, audio);
        });
    }

    public play(key: SoundKey, volume = 1.0, pitchVariation = 0.0): void {
        if (this.isMuted) return;
        const baseAudio = this.sounds.get(key);
        if (!baseAudio) return;

        // Clone node allows rapid overlapping plays (e.g. Gatling fire or fast cloth footsteps)
        const soundInstance = baseAudio.cloneNode(true) as HTMLAudioElement;
        soundInstance.volume = Math.max(0, Math.min(1, volume));

        if (pitchVariation > 0) {
            const randomPitch = 1 + (Math.random() * 2 - 1) * pitchVariation;
            soundInstance.playbackRate = randomPitch;
        }

        soundInstance.play().catch(() => {
            // Ignore autoplay restrictions prior to user interaction
        });
    }
}

export const soundManager = new SoundManager();
/* =========================================================
   NOVA CATALYST
   Audio Manager

   Build v0.3.0 · FULL SFX INTEGRATION
========================================================= */

const AUDIO_FILES = {

    menu: {
        path: "./assets/sounds/music/menu.mp3",
        category: "music",
        volume: 0.95
    },

    zoneA: {
        path: "./assets/sounds/music/zone_a.mp3",
        category: "music",
        volume: 0.700
    },

    boss: {
        path: "./assets/sounds/music/boss.mp3",
        category: "music",
        volume: 0.620
    },

    pistolFire: {
        path: "./assets/sounds/weapons/pistol_fire.mp3",
        category: "sfx",
        volume: 0.28
    },

    smgFire: {
        path: "./assets/sounds/weapons/smg_fire.mp3",
        category: "sfx",
        volume: 0.52
    },

    shotgunFire: {
        path: "./assets/sounds/weapons/shotgun_fire.mp3",
        category: "sfx",
        volume: 0.80
    },

    enemyCreature: {
        path: "./assets/sounds/enemies/enemy_creature.mp3",
        category: "sfx",
        volume: 0.20
    },

    enemyDeath: {
        path: "./assets/sounds/enemies/enemy_death.mp3",
        category: "sfx",
        volume: 0.65
    },

    playerHurt: {
        path: "./assets/sounds/player/player_hurt.mp3",
        category: "sfx",
        volume: 0.65
    },

    playerDeath: {
        path: "./assets/sounds/player/player_death.mp3",
        category: "sfx",
        volume: 0.82
    },

    pickup: {
        path: "./assets/sounds/pickups/pickup.mp3",
        category: "sfx",
        volume: 0.10
    },

    barrelExplosion: {
        path: "./assets/sounds/world/barrel_explosion.mp3",
        category: "sfx",
        volume: 0.80
    },

    cannonCharge: {
        path: "./assets/sounds/boss/cannon_charge.mp3",
        category: "sfx",
        volume: 0.80
    },

    cannonFire: {
        path: "./assets/sounds/boss/cannon_fire.mp3",
        category: "sfx",
        volume: .80
    },

    siren: {
        path: "./assets/sounds/ambient/siren.mp3",
        category: "ambient",
        volume: 0.50
    }
};


export class AudioManager {

    constructor() {

        this.context = null;

        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.ambientGain = null;

        this.masterVolume = 0.85;
        this.musicVolume = 0.50;
        this.sfxVolume = 0.90;
        this.ambientVolume = 0.60;

        this.buffers = new Map();
        this.loadingPromises = new Map();

        this.currentMusic = null;
        this.musicRequestId = 0;

        this.loops = new Map();

        this.activeSFX = new Map();
        this.cooldowns = new Map();

        this.unlocked = false;
        this.preloaded = false;
        this.pausedByGame = false;

        this.unlockHandler =
            this.unlock.bind(this);

        window.addEventListener(
            "pointerdown",
            this.unlockHandler
        );

        window.addEventListener(
            "keydown",
            this.unlockHandler
        );

        window.addEventListener(
            "touchstart",
            this.unlockHandler
        );

        this.preloadAll()
            .catch(
                error => {

                    console.warn(
                        "[Audio] Error durante preload:",
                        error
                    );
                }
            );
    }


    ensureContext() {

        if (
            this.context
        ) {

            return this.context;
        }

        const AudioContextClass =
            window.AudioContext
            ||
            window.webkitAudioContext;

        if (
            !AudioContextClass
        ) {

            console.error(
                "[Audio] Web Audio API no soportada."
            );

            return null;
        }

        this.context =
            new AudioContextClass();

        this.masterGain =
            this.context.createGain();

        this.masterGain.gain.value =
            this.masterVolume;

        this.masterGain.connect(
            this.context.destination
        );

        this.musicGain =
            this.context.createGain();

        this.musicGain.gain.value =
            this.musicVolume;

        this.musicGain.connect(
            this.masterGain
        );

        this.sfxGain =
            this.context.createGain();

        this.sfxGain.gain.value =
            this.sfxVolume;

        this.sfxGain.connect(
            this.masterGain
        );

        this.ambientGain =
            this.context.createGain();

        this.ambientGain.gain.value =
            this.ambientVolume;

        this.ambientGain.connect(
            this.masterGain
        );

        console.log(
            "[Audio] AudioContext ONLINE"
        );

        return this.context;
    }


    async unlock() {

        const context =
            this.ensureContext();

        if (
            !context
        ) {

            return false;
        }

        try {

            if (
                context.state ===
                "suspended"
            ) {

                await context.resume();
            }

            this.unlocked =
                true;

            window.removeEventListener(
                "pointerdown",
                this.unlockHandler
            );

            window.removeEventListener(
                "keydown",
                this.unlockHandler
            );

            window.removeEventListener(
                "touchstart",
                this.unlockHandler
            );

            console.log(
                "[Audio] Sistema desbloqueado"
            );

            return true;
        }

        catch (
            error
        ) {

            console.warn(
                "[Audio] No pudo desbloquearse:",
                error
            );

            return false;
        }
    }


    async loadSound(
        key
    ) {

        if (
            this.buffers.has(
                key
            )
        ) {

            return this.buffers.get(
                key
            );
        }

        if (
            this.loadingPromises.has(
                key
            )
        ) {

            return this.loadingPromises.get(
                key
            );
        }

        const config =
            AUDIO_FILES[key];

        if (
            !config
        ) {

            console.warn(
                `[Audio] Sonido desconocido: ${key}`
            );

            return null;
        }

        const context =
            this.ensureContext();

        if (
            !context
        ) {

            return null;
        }

        const promise =
            fetch(
                config.path
            )
                .then(
                    response => {

                        if (
                            !response.ok
                        ) {

                            throw new Error(
                                `${response.status} · ${config.path}`
                            );
                        }

                        return response.arrayBuffer();
                    }
                )
                .then(
                    arrayBuffer =>

                        context.decodeAudioData(
                            arrayBuffer
                        )
                )
                .then(
                    buffer => {

                        this.buffers.set(
                            key,
                            buffer
                        );

                        this.loadingPromises.delete(
                            key
                        );

                        return buffer;
                    }
                )
                .catch(
                    error => {

                        this.loadingPromises.delete(
                            key
                        );

                        console.warn(
                            `[Audio] No se pudo cargar "${key}"`,
                            error
                        );

                        return null;
                    }
                );

        this.loadingPromises.set(
            key,
            promise
        );

        return promise;
    }


    async preloadAll() {

        const keys =
            Object.keys(
                AUDIO_FILES
            );

        await Promise.allSettled(

            keys.map(
                key =>
                    this.loadSound(
                        key
                    )
            )

        );

        this.preloaded =
            true;

        console.log(
            `[Audio] PRELOAD COMPLETE · ${this.buffers.size}/${keys.length}`
        );
    }


    canPlayCooldown(
        id,
        seconds
    ) {

        const now =
            performance.now() /
            1000;

        const previous =
            this.cooldowns.get(
                id
            )
            ??
            -Infinity;

        if (
            now - previous <
            seconds
        ) {

            return false;
        }

        this.cooldowns.set(
            id,
            now
        );

        return true;
    }


    async playMusic(
        key,
        {
            fade = 1.5,
            restart = false
        } = {}
    ) {

        const config =
            AUDIO_FILES[key];

        if (
            !config
            ||
            config.category !==
            "music"
        ) {

            console.warn(
                `[Audio] Música inválida: ${key}`
            );

            return false;
        }

        if (
            this.currentMusic
            &&
            this.currentMusic.key ===
            key
            &&
            !restart
        ) {

            this.setCurrentMusicLevel(
                1,
                0.6
            );

            return true;
        }

        const requestId =
            ++this.musicRequestId;

        const buffer =
            await this.loadSound(
                key
            );

        if (
            !buffer
            ||
            requestId !==
            this.musicRequestId
        ) {

            return false;
        }

        const context =
            this.ensureContext();

        if (
            !context
        ) {

            return false;
        }

        const now =
            context.currentTime;

        const oldMusic =
            this.currentMusic;

        if (
            oldMusic
        ) {

            try {

                oldMusic.gain.gain
                    .cancelScheduledValues(
                        now
                    );

                oldMusic.gain.gain
                    .setValueAtTime(
                        oldMusic.gain.gain.value,
                        now
                    );

                oldMusic.gain.gain
                    .linearRampToValueAtTime(
                        0,
                        now + fade
                    );

                oldMusic.source.stop(
                    now + fade + 0.10
                );
            }

            catch (
                error
            ) {

                // Source anterior ya detenido.
            }
        }

        const source =
            context.createBufferSource();

        source.buffer =
            buffer;

        source.loop =
            true;

        const gain =
            context.createGain();

        gain.gain.setValueAtTime(
            0,
            now
        );

        gain.gain.linearRampToValueAtTime(
            config.volume,
            now + fade
        );

        source.connect(
            gain
        );

        gain.connect(
            this.musicGain
        );

        source.start(
            now
        );

        this.currentMusic = {
            key,
            source,
            gain
        };

        source.onended =
            () => {

                if (
                    this.currentMusic?.source ===
                    source
                ) {

                    this.currentMusic =
                        null;
                }
            };

        console.log(
            `[Audio] Music → ${key}`
        );

        return true;
    }


    stopMusic(
        fade = 1
    ) {

        ++this.musicRequestId;

        if (
            !this.currentMusic
            ||
            !this.context
        ) {

            return;
        }

        const current =
            this.currentMusic;

        const now =
            this.context.currentTime;

        current.gain.gain
            .cancelScheduledValues(
                now
            );

        current.gain.gain
            .setValueAtTime(
                current.gain.gain.value,
                now
            );

        current.gain.gain
            .linearRampToValueAtTime(
                0,
                now + fade
            );

        try {

            current.source.stop(
                now + fade + 0.10
            );
        }

        catch (
            error
        ) {

            // Ya estaba detenido.
        }

        this.currentMusic =
            null;
    }


    setCurrentMusicLevel(
        level = 1,
        fade = 0.8
    ) {

        if (
            !this.currentMusic
            ||
            !this.context
        ) {

            return;
        }

        const config =
            AUDIO_FILES[
                this.currentMusic.key
            ];

        if (
            !config
        ) {

            return;
        }

        const normalizedLevel =
            clamp(
                level,
                0,
                1
            );

        const targetVolume =
            config.volume *
            normalizedLevel;

        const now =
            this.context.currentTime;

        const gain =
            this.currentMusic
                .gain
                .gain;

        gain.cancelScheduledValues(
            now
        );

        gain.setValueAtTime(
            gain.value,
            now
        );

        gain.linearRampToValueAtTime(
            targetVolume,
            now +
            Math.max(
                0.01,
                fade
            )
        );

        console.log(
            `[Audio] Music level → ${Math.round(normalizedLevel * 100)}%`
        );
    }


    registerActiveSFX(
        key,
        source
    ) {

        if (
            !this.activeSFX.has(
                key
            )
        ) {

            this.activeSFX.set(
                key,
                new Set()
            );
        }

        const group =
            this.activeSFX.get(
                key
            );

        group.add(
            source
        );

        source.addEventListener(
            "ended",
            () => {

                group.delete(
                    source
                );

                if (
                    group.size ===
                    0
                ) {

                    this.activeSFX.delete(
                        key
                    );
                }
            },
            {
                once:
                    true
            }
        );
    }


    stopSFX(
        key
    ) {

        const group =
            this.activeSFX.get(
                key
            );

        if (
            !group
        ) {

            return;
        }

        for (
            const source
            of group
        ) {

            try {

                source.stop();
            }

            catch (
                error
            ) {

                // Ya detenido.
            }
        }

        this.activeSFX.delete(
            key
        );
    }


    async playSFX(
        key,
        {
            volume = 1,
            playbackRate = 1,
            randomPitch = 0,
            category = null
        } = {}
    ) {

        const config =
            AUDIO_FILES[key];

        if (
            !config
        ) {

            console.warn(
                `[Audio] SFX desconocido: ${key}`
            );

            return null;
        }

        const buffer =
            await this.loadSound(
                key
            );

        if (
            !buffer
        ) {

            return null;
        }

        const context =
            this.ensureContext();

        if (
            !context
        ) {

            return null;
        }

        const source =
            context.createBufferSource();

        source.buffer =
            buffer;

        let finalRate =
            playbackRate;

        if (
            randomPitch >
            0
        ) {

            finalRate +=
                (
                    Math.random() *
                    2 -
                    1
                )
                *
                randomPitch;
        }

        finalRate =
            Math.max(
                0.25,
                finalRate
            );

        source.playbackRate.value =
            finalRate;

        const gain =
            context.createGain();

        gain.gain.value =
            config.volume *
            volume;

        source.connect(
            gain
        );

        const targetCategory =
            category
            ||
            config.category;

        if (
            targetCategory ===
            "ambient"
        ) {

            gain.connect(
                this.ambientGain
            );
        }

        else {

            gain.connect(
                this.sfxGain
            );
        }

        this.registerActiveSFX(
            key,
            source
        );

        source.start();

        return source;
    }


    playWeaponFire(
        weaponKey
    ) {

        if (
            weaponKey ===
            "pistol"
        ) {

            return this.playSFX(
                "pistolFire",
                {
                    randomPitch:
                        0.025
                }
            );
        }

        if (
            weaponKey ===
            "smg"
        ) {

            return this.playSFX(
                "smgFire",
                {
                    volume:
                        0.90,

                    randomPitch:
                        0.045
                }
            );
        }

        if (
            weaponKey ===
            "shotgun"
        ) {

            return this.playSFX(
                "shotgunFire",
                {
                    randomPitch:
                        0.025
                }
            );
        }

        return null;
    }


    playEnemyCreature(
        mode = "attack"
    ) {

        const cooldowns = {

            spawn:
                0.35,

            attack:
                0.22,

            hit:
                0.11,

            boss:
                0.40
        };

        const cooldown =
            cooldowns[mode]
            ??
            0.18;

        if (
            !this.canPlayCooldown(
                `enemy-creature-${mode}`,
                cooldown
            )
        ) {

            return null;
        }

        let playbackRate =
            1;

        let volume =
            1;

        if (
            mode ===
            "hit"
        ) {

            playbackRate =
                1.10;

            volume =
                0.76;
        }

        else if (
            mode ===
            "spawn"
        ) {

            playbackRate =
                0.84;

            volume =
                0.92;
        }

        else if (
            mode ===
            "boss"
        ) {

            playbackRate =
                0.60;

            volume =
                1.05;
        }

        return this.playSFX(
            "enemyCreature",
            {
                playbackRate,
                volume,
                randomPitch:
                    0.035
            }
        );
    }


    playEnemyDeath() {

        if (
            !this.canPlayCooldown(
                "enemy-death",
                0.06
            )
        ) {

            return null;
        }

        return this.playSFX(
            "enemyDeath",
            {
                randomPitch:
                    0.05
            }
        );
    }


    playBossDeath() {

        this.stopSFX(
            "enemyCreature"
        );

        return this.playSFX(
            "enemyDeath",
            {
                playbackRate:
                    0.62,

                volume:
                    1.15
            }
        );
    }


    playPlayerHurt() {

        if (
            !this.canPlayCooldown(
                "player-hurt",
                0.18
            )
        ) {

            return null;
        }

        return this.playSFX(
            "playerHurt",
            {
                randomPitch:
                    0.025
            }
        );
    }


    playPlayerDeath() {

        this.stopSFX(
            "playerHurt"
        );

        return this.playSFX(
            "playerDeath",
            {
                volume:
                    1
            }
        );
    }


    playPickup(
        type = "ammo"
    ) {

        if (
            !this.canPlayCooldown(
                "pickup",
                0.08
            )
        ) {

            return null;
        }

        let playbackRate =
            1;

        let volume =
            1;

        if (
            type ===
            "weapon"
        ) {

            playbackRate =
                0.82;

            volume =
                1.10;
        }

        else if (
            type ===
            "medkit"
        ) {

            playbackRate =
                1.20;

            volume =
                0.90;
        }

        return this.playSFX(
            "pickup",
            {
                playbackRate,
                volume
            }
        );
    }


    playExplosion() {

        if (
            !this.canPlayCooldown(
                "barrel-explosion",
                0.05
            )
        ) {

            return null;
        }

        return this.playSFX(
            "barrelExplosion",
            {
                randomPitch:
                    0.035
            }
        );
    }


    playCannonCharge() {

        this.stopSFX(
            "cannonCharge"
        );

        return this.playSFX(
            "cannonCharge",
            {
                volume:
                    1
            }
        );
    }


    playCannonFire() {

        this.stopSFX(
            "cannonCharge"
        );

        if (
            !this.canPlayCooldown(
                "cannon-fire",
                0.22
            )
        ) {

            return null;
        }

        return this.playSFX(
            "cannonFire",
            {
                volume:
                    1
            }
        );
    }


    playCannonImpact() {

        if (
            !this.canPlayCooldown(
                "cannon-impact",
                0.16
            )
        ) {

            return null;
        }

        return this.playSFX(
            "barrelExplosion",
            {
                playbackRate:
                    0.72,

                volume:
                    1.10
            }
        );
    }


    async startLoop(
        id,
        key,
        {
            volume = 1,
            playbackRate = 1,
            fade = 0.5
        } = {}
    ) {

        await this.stopLoop(
            id,
            0.25
        );

        const buffer =
            await this.loadSound(
                key
            );

        if (
            !buffer
        ) {

            return null;
        }

        const context =
            this.ensureContext();

        if (
            !context
        ) {

            return null;
        }

        const source =
            context.createBufferSource();

        source.buffer =
            buffer;

        source.loop =
            true;

        source.playbackRate.value =
            playbackRate;

        const gain =
            context.createGain();

        const config =
            AUDIO_FILES[key];

        const targetVolume =
            config.volume *
            volume;

        const now =
            context.currentTime;

        gain.gain.setValueAtTime(
            0,
            now
        );

        gain.gain.linearRampToValueAtTime(
            targetVolume,
            now + fade
        );

        source.connect(
            gain
        );

        gain.connect(
            this.ambientGain
        );

        source.start();

        this.loops.set(
            id,
            {
                source,
                gain,
                key
            }
        );

        return source;
    }


    async stopLoop(
        id,
        fade = 0.4
    ) {

        const loop =
            this.loops.get(
                id
            );

        if (
            !loop
            ||
            !this.context
        ) {

            return;
        }

        const now =
            this.context.currentTime;

        loop.gain.gain
            .cancelScheduledValues(
                now
            );

        loop.gain.gain
            .setValueAtTime(
                loop.gain.gain.value,
                now
            );

        loop.gain.gain
            .linearRampToValueAtTime(
                0,
                now + fade
            );

        try {

            loop.source.stop(
                now + fade + 0.05
            );
        }

        catch (
            error
        ) {

            // Ya detenido.
        }

        this.loops.delete(
            id
        );
    }


    startZoneASiren() {

        return this.startLoop(
            "siren",
            "siren",
            {
                volume:
                    0.48,

                playbackRate:
                    1,

                fade:
                    1
            }
        );
    }


    startBossSiren() {

        return this.startLoop(
            "siren",
            "siren",
            {
                volume:
                    0.85,

                playbackRate:
                    0.88,

                fade:
                    0.7
            }
        );
    }


    stopSiren() {

        return this.stopLoop(
            "siren",
            0.8
        );
    }


    setMasterVolume(
        value
    ) {

        this.masterVolume =
            clamp(
                value,
                0,
                1
            );

        if (
            this.masterGain
        ) {

            this.masterGain.gain.value =
                this.masterVolume;
        }
    }


    setMusicVolume(
        value
    ) {

        this.musicVolume =
            clamp(
                value,
                0,
                1
            );

        if (
            this.musicGain
        ) {

            this.musicGain.gain.value =
                this.musicVolume;
        }
    }


    setSFXVolume(
        value
    ) {

        this.sfxVolume =
            clamp(
                value,
                0,
                1
            );

        if (
            this.sfxGain
        ) {

            this.sfxGain.gain.value =
                this.sfxVolume;
        }
    }


    setAmbientVolume(
        value
    ) {

        this.ambientVolume =
            clamp(
                value,
                0,
                1
            );

        if (
            this.ambientGain
        ) {

            this.ambientGain.gain.value =
                this.ambientVolume;
        }
    }


    async pauseAll() {

        if (
            !this.context
            ||
            this.context.state !==
            "running"
        ) {

            return;
        }

        this.pausedByGame =
            true;

        await this.context.suspend();
    }


    async resumeAll() {

        if (
            !this.context
            ||
            !this.pausedByGame
        ) {

            return;
        }

        this.pausedByGame =
            false;

        await this.context.resume();
    }


    stopAllSFX() {

        const keys =
            Array.from(
                this.activeSFX.keys()
            );

        for (
            const key
            of keys
        ) {

            this.stopSFX(
                key
            );
        }
    }


    stopAll() {

        this.stopMusic(
            0.25
        );

        const ids =
            Array.from(
                this.loops.keys()
            );

        for (
            const id
            of ids
        ) {

            this.stopLoop(
                id,
                0.20
            );
        }

        this.stopAllSFX();
    }
}


function clamp(
    value,
    min,
    max
) {

    return Math.min(
        max,
        Math.max(
            min,
            value
        )
    );
}


export const audioManager =
    new AudioManager();
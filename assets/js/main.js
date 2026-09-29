/* =========================================================
   NOVA CATALYST
   Main Controller

   Build v0.29.0 · FULL AUDIO INTEGRATION
========================================================= */

import * as THREE from "three";

import {
    EnvironmentManager,
    ENVIRONMENTS
} from "./environment.js";

import {
    CameraManager
} from "./camera.js";

import {
    PlayerController
} from "./player.js";

import {
    PhysicsManager
} from "./physics.js";

import {
    ObjectManager
} from "./objects.js";

import {
    WeaponManager
} from "./weapons.js";

import {
    EnemyManager
} from "./enemy.js";

import {
    BossManager
} from "./boss.js";

import {
    PlayerHealthManager
} from "./playerHealth.js";

import {
    WaveManager
} from "./waveManager.js";

import {
    PickupManager
} from "./pickupManager.js";

import {
    installBarrelEnemyDamage
} from "./barrelCombatBridge.js";

import {
    PauseMenu
} from "./pause.js";

import {
    ZoneAAtmosphere
} from "./zoneAAtmosphere.js";

import {
    audioManager
} from "./audioManager.js";


const PERFORMANCE = {

    maxPixelRatio:
        1.0,

    minPixelRatio:
        0.68,

    bossMaxPixelRatio:
        0.78,

    bossMinPixelRatio:
        0.52,

    adaptiveResolution:
        true,

    qualityCheckInterval:
        1.15,

    fpsCounterInterval:
        0.25,

    lowFPSThreshold:
        50,

    highFPSThreshold:
        59,

    debugInterval:
        0.25,

    shadowRefreshInterval:
        1 / 24,

    shadowFocusInterval:
        0.14,

    sirenUpdateInterval:
        0.05
};


let currentPixelRatio =
    Math.min(
        window.devicePixelRatio || 1,
        PERFORMANCE.maxPixelRatio
    );


let bossPerformanceMode =
    false;

let qualityTimer =
    0;

let qualityFrames =
    0;

let fpsTimer =
    0;

let fpsFrames =
    0;

let displayedFPS =
    60;

let debugTimer =
    0;

let shadowRefreshTimer =
    0;

let shadowFocusTimer =
    0;


const GAME_STATE = {

    MENU:
        "menu",

    BRIEFING:
        "briefing",

    ABOUT:
        "about",

    LOADING:
        "loading",

    INTRO:
        "intro",

    PLAYING:
        "playing",

    TRANSITION:
        "transition",

    BOSS_FIGHT:
        "boss_fight",

    PAUSED:
        "paused",

    DYING:
        "dying",

    GAME_OVER:
        "game_over",

    VICTORY:
        "victory"
};


let currentState =
    GAME_STATE.MENU;


let stateBeforePause =
    GAME_STATE.PLAYING;


let bossTransitionStarted =
    false;


let bossTransitionFailed =
    false;


let introPlaying =
    false;


let endingSequenceStarted =
    false;


const PLAYER_SPAWN_ZONE_A = {

    x:
        16.0,

    z:
        0,

    heightOffset:
        -4.4
};


const BOSS_ARENA_SPAWN_CONFIG = {

    gridSteps:
        9,

    centerRegionRatio:
        0.24,

    floorClusterTolerance:
        0.80,

    floorSelectionTolerance:
        0.75,

    maxFloorHeightRatio:
        0.58,

    playerClearance:
        1.05,

    bossClearance:
        1.80,

    halfSeparation:
        7.0
};


/* =========================================================
   DOM
========================================================= */

const gameContainer =
    document.getElementById(
        "game-container"
    );


const backgroundEffects =
    document.getElementById(
        "background-effects"
    );


const mainMenu =
    document.getElementById(
        "main-menu"
    );


const briefingScreen =
    document.getElementById(
        "briefing-screen"
    );


const aboutScreen =
    document.getElementById(
        "about-screen"
    );


const loadingScreen =
    document.getElementById(
        "loading-screen"
    );


const loadingProgress =
    document.getElementById(
        "loading-progress"
    );


const loadingText =
    document.getElementById(
        "loading-text"
    );


const inspectionUI =
    document.getElementById(
        "inspection-ui"
    );


const spawnDebug =
    document.getElementById(
        "spawn-debug"
    );


const notification =
    document.getElementById(
        "notification"
    );


const btnEnter =
    document.getElementById(
        "btn-enter"
    );


const btnAbout =
    document.getElementById(
        "btn-about"
    );


const btnBackBriefing =
    document.getElementById(
        "btn-back-from-briefing"
    );


const btnBackAbout =
    document.getElementById(
        "btn-back-from-about"
    );


const btnSurvive =
    document.getElementById(
        "btn-survive"
    );


/* =========================================================
   GAME OVER TRANSLATION
========================================================= */

function localizeGameOverButtons() {

    const buttons =
        document.querySelectorAll(
            "button"
        );


    for (
        const button
        of buttons
    ) {

        const walker =
            document.createTreeWalker(
                button,
                NodeFilter.SHOW_TEXT
            );


        const textNodes =
            [];


        let node;


        while (
            (
                node =
                    walker.nextNode()
            )
        ) {

            textNodes.push(
                node
            );
        }


        for (
            const textNode
            of textNodes
        ) {

            let text =
                textNode.nodeValue;


            text =
                text.replace(
                    /\bRetry\b/gi,
                    "Reintentar"
                );


            text =
                text.replace(
                    /\bTry Again\b/gi,
                    "Reintentar"
                );


            text =
                text.replace(
                    /\bFlee\b/gi,
                    "Huir"
                );


            text =
                text.replace(
                    /\bEscape\b/gi,
                    "Huir"
                );


            textNode.nodeValue =
                text;
        }
    }
}


/* =========================================================
   FPS COUNTER
========================================================= */

const fpsCounter =
    document.createElement(
        "div"
    );


Object.assign(
    fpsCounter.style,
    {

        position:
            "fixed",

        top:
            "10px",

        right:
            "12px",

        zIndex:
            "99999",

        padding:
            "4px 7px",

        borderRadius:
            "4px",

        background:
            "rgba(0,0,0,.50)",

        border:
            "1px solid rgba(255,255,255,.13)",

        color:
            "#8effa8",

        fontFamily:
            "Consolas, monospace",

        fontSize:
            "10px",

        fontWeight:
            "700",

        pointerEvents:
            "none"
    }
);


fpsCounter.textContent =
    "FPS 60";


document.body.appendChild(
    fpsCounter
);


/* =========================================================
   SCENE
========================================================= */

const scene =
    new THREE.Scene();


scene.background =
    new THREE.Color(
        0x010204
    );


scene.fog =
    new THREE.FogExp2(
        0x06080b,
        0.0055
    );


/* =========================================================
   CAMERA
========================================================= */

const camera =
    new THREE.PerspectiveCamera(
        60,
        window.innerWidth /
        window.innerHeight,
        0.05,
        350
    );


camera.position.set(
    0,
    2,
    8
);


scene.add(
    camera
);


/* =========================================================
   RENDERER
========================================================= */

const renderer =
    new THREE.WebGLRenderer({

        antialias:
            false,

        powerPreference:
            "high-performance",

        preserveDrawingBuffer:
            false,

        alpha:
            false
    });


renderer.setPixelRatio(
    currentPixelRatio
);


renderer.setSize(
    window.innerWidth,
    window.innerHeight
);


renderer.outputColorSpace =
    THREE.SRGBColorSpace;


renderer.toneMapping =
    THREE.ACESFilmicToneMapping;


renderer.toneMappingExposure =
    1.32;


renderer.shadowMap.enabled =
    true;


renderer.shadowMap.type =
    THREE.PCFShadowMap;


renderer.shadowMap.autoUpdate =
    false;


renderer.shadowMap.needsUpdate =
    true;


gameContainer.appendChild(
    renderer.domElement
);


/* =========================================================
   CLOCK
========================================================= */

const clock =
    new THREE.Clock();


/* =========================================================
   STARFIELD
========================================================= */

function createStarField() {

    const count =
        400;


    const positions =
        new Float32Array(
            count * 3
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        positions[
            i * 3
        ] =
            (
                Math.random() -
                0.5
            ) *
            300;


        positions[
            i * 3 + 1
        ] =
            (
                Math.random() -
                0.5
            ) *
            300;


        positions[
            i * 3 + 2
        ] =
            (
                Math.random() -
                0.5
            ) *
            300;
    }


    const geometry =
        new THREE.BufferGeometry();


    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(
            positions,
            3
        )
    );


    const material =
        new THREE.PointsMaterial({

            color:
                0xdde9ef,

            size:
                0.12,

            transparent:
                true,

            opacity:
                0.45,

            depthWrite:
                false
        });


    const result =
        new THREE.Points(
            geometry,
            material
        );


    result.frustumCulled =
        false;


    scene.add(
        result
    );


    return result;
}


const stars =
    createStarField();


/* =========================================================
   SYSTEMS
========================================================= */

const environmentManager =
    new EnvironmentManager(
        scene
    );


const zoneAAtmosphere =
    new ZoneAAtmosphere(
        scene
    );


const cameraManager =
    new CameraManager(
        camera,
        renderer
    );


const physicsManager =
    new PhysicsManager();


const playerController =
    new PlayerController(
        scene
    );


const objectManager =
    new ObjectManager(
        scene,
        physicsManager
    );


const weaponManager =
    new WeaponManager({

        scene,

        camera,

        cameraManager,

        playerController,

        physicsManager,

        objectManager
    });


/* =========================================================
   PLAYER HEALTH
========================================================= */

const playerHealth =
    new PlayerHealthManager({

        maxHealth:
            100,

        invulnerabilityTime:
            0.30,

        onDamage:
            () => {

                playerController.hit();


                audioManager.playPlayerHurt();
            },

        onDeath:
            () => {

                audioManager.playPlayerDeath();


                beginPlayerDeath();
            },

        onRetry:
            () => {

                retryGame();
            },

        onFlee:
            () => {

                fleeToMenu();
            }
    });


playerHealth.setVisible(
    false
);


queueMicrotask(
    localizeGameOverButtons
);


/* =========================================================
   ENEMY
========================================================= */

const enemyManager =
    new EnemyManager({

        scene,

        playerController,

        camera,

        physicsManager,

        objectManager,

        playerHealth
    });


/* =========================================================
   BOSS
========================================================= */

const bossManager =
    new BossManager({

        scene,

        playerController,

        playerHealth,

        onDeath:
            () => {

                audioManager.playBossDeath();


                finishBossEncounter();
            }
    });


/* =========================================================
   PICKUPS
========================================================= */

const pickupManager =
    new PickupManager({

        scene,

        playerController,

        weaponManager,

        playerHealth,

        onPickup:
            data => {

                if (
                    data?.message
                ) {

                    const pickupMessage =
                        String(
                            data.message
                        )
                            .toUpperCase();


                    if (
                        pickupMessage.includes(
                            "ADQUIRIDA"
                        )
                    ) {

                        audioManager.playPickup(
                            "weapon"
                        );
                    }

                    else if (
                        pickupMessage.includes(
                            "MUNICIÓN"
                        )

                        ||

                        pickupMessage.includes(
                            "CARTUCHOS"
                        )
                    ) {

                        audioManager.playPickup(
                            "ammo"
                        );
                    }

                    else if (
                        pickupMessage.includes(
                            "SALUD +"
                        )
                    ) {

                        audioManager.playPickup(
                            "medkit"
                        );
                    }


                    showNotification(
                        data.message
                    );
                }
            }
    });


/* =========================================================
   WAVES
========================================================= */

const waveManager =
    new WaveManager({

        enemyManager,

        playerController,

        onNotification:
            message => {

                showNotification(
                    message
                );
            },

        onWaveStarted:
            data => {

                console.log(
                    `[Nova] Wave ${data.wave} · ${data.amount} hostiles`
                );
            },

        onWaveCleared:
            data => {

                pickupManager
                    .spawnWaveRewards(
                        data.wave
                    );
            },

        onFinalWaveCleared:
            () => {

                beginBossTransition()
                    .catch(
                        error => {

                            handleBossTransitionError(
                                error
                            );
                        }
                    );
            }
    });


/* =========================================================
   COMBAT
========================================================= */

weaponManager.setEnemyManager(
    enemyManager
);


installBarrelEnemyDamage({

    weaponManager,

    enemyManager,

    radius:
        5.5,

    maxDamage:
        120,

    minDamage:
        25
});


/* =========================================================
   FULL SFX BRIDGE
========================================================= */

const audioPatchedEnemies =
    new WeakSet();


const enemyAttackAudioState =
    new WeakMap();


const bossAudioState = {

    chargeRunning:
        false,

    firePlayed:
        false,

    previousProjectiles:
        new Set(),

    projectilesInitialized:
        false
};


function getActionClipName(
    action
) {

    if (
        !action
        ||
        typeof action !==
        "object"
    ) {

        return "";
    }


    try {

        const clip =
            typeof action.getClip ===
            "function"
                ?
                action.getClip()
                :
                action._clip;


        return String(
            clip?.name || ""
        );
    }

    catch (
        error
    ) {

        return "";
    }
}


function isAnimationActionLike(
    value
) {

    return Boolean(
        value
        &&
        typeof value ===
        "object"
        &&
        (
            typeof value.isRunning ===
            "function"
            ||
            value._clip?.name
            ||
            typeof value.getClip ===
            "function"
        )
    );
}


function isActionRunning(
    action
) {

    if (
        !action
    ) {

        return false;
    }


    try {

        if (
            typeof action.isRunning ===
            "function"
        ) {

            return action.isRunning();
        }


        const weight =
            typeof action.getEffectiveWeight ===
            "function"
                ?
                action.getEffectiveWeight()
                :
                action.weight ?? 1;


        return (
            action.enabled !==
            false
            &&
            !action.paused
            &&
            weight >
            0.01
        );
    }

    catch (
        error
    ) {

        return false;
    }
}


function findAnimationAction(
    entity,
    pattern
) {

    if (
        !entity
    ) {

        return null;
    }


    const inspect =
        value => {

            if (
                isAnimationActionLike(
                    value
                )
            ) {

                const name =
                    getActionClipName(
                        value
                    );


                if (
                    pattern.test(
                        name
                    )
                ) {

                    return value;
                }
            }


            return null;
        };


    for (
        const [
            key,
            value
        ]
        of Object.entries(
            entity
        )
    ) {

        const direct =
            inspect(
                value
            );


        if (
            direct
        ) {

            return direct;
        }


        if (
            value instanceof Map
        ) {

            for (
                const candidate
                of value.values()
            ) {

                const found =
                    inspect(
                        candidate
                    );


                if (
                    found
                ) {

                    return found;
                }
            }
        }

        else if (
            Array.isArray(
                value
            )
        ) {

            for (
                const candidate
                of value
            ) {

                const found =
                    inspect(
                        candidate
                    );


                if (
                    found
                ) {

                    return found;
                }
            }
        }

        else if (
            value
            &&
            typeof value ===
            "object"
            &&
            /action|anim|clip/i.test(
                key
            )
        ) {

            for (
                const candidate
                of Object.values(
                    value
                )
            ) {

                const found =
                    inspect(
                        candidate
                    );


                if (
                    found
                ) {

                    return found;
                }
            }
        }
    }


    return null;
}


function installWeaponAudioHooks() {

    if (
        typeof weaponManager.fire ===
        "function"
        &&
        !weaponManager.fire.__novaAudioWrapped
    ) {

        const originalFire =
            weaponManager.fire;


        const wrappedFire =
            function (...args) {

                const weaponKey =
                    typeof this.getCurrentWeapon ===
                    "function"
                        ?
                        this.getCurrentWeapon()
                        :
                        this.currentWeapon ||
                        "pistol";


                const fired =
                    originalFire.apply(
                        this,
                        args
                    );


                if (
                    fired ===
                    true
                ) {

                    audioManager.playWeaponFire(
                        weaponKey
                    );
                }


                return fired;
            };


        wrappedFire.__novaAudioWrapped =
            true;


        weaponManager.fire =
            wrappedFire;
    }


    if (
        typeof weaponManager.explodeBarrel ===
        "function"
        &&
        !weaponManager.explodeBarrel.__novaAudioWrapped
    ) {

        const originalExplodeBarrel =
            weaponManager.explodeBarrel;


        const wrappedExplodeBarrel =
            function (
                barrel,
                ...args
            ) {

                const rigidBody =
                    barrel?.rigidBody;


                const alreadyExploded =
                    Boolean(
                        rigidBody
                        &&
                        this.explodedBodies?.has?.(
                            rigidBody
                        )
                    );


                const result =
                    originalExplodeBarrel.call(
                        this,
                        barrel,
                        ...args
                    );


                if (
                    rigidBody
                    &&
                    !alreadyExploded
                ) {

                    audioManager.playExplosion();
                }


                return result;
            };


        wrappedExplodeBarrel.__novaAudioWrapped =
            true;


        weaponManager.explodeBarrel =
            wrappedExplodeBarrel;
    }
}


function installBossDamageAudioHook() {

    if (
        typeof bossManager.takeDamage !==
        "function"
        ||
        bossManager.takeDamage.__novaAudioWrapped
    ) {

        return;
    }


    const originalTakeDamage =
        bossManager.takeDamage;


    const wrappedTakeDamage =
        function (...args) {

            const killed =
                originalTakeDamage.apply(
                    this,
                    args
                );


            if (
                !killed
            ) {

                audioManager.playEnemyCreature(
                    "boss"
                );
            }


            return killed;
        };


    wrappedTakeDamage.__novaAudioWrapped =
        true;


    bossManager.takeDamage =
        wrappedTakeDamage;
}


function patchEnemyAudio(
    enemy
) {

    if (
        !enemy
        ||
        audioPatchedEnemies.has(
            enemy
        )
    ) {

        return;
    }


    audioPatchedEnemies.add(
        enemy
    );


    audioManager.playEnemyCreature(
        "spawn"
    );


    if (
        typeof enemy.takeDamage ===
        "function"
    ) {

        const originalTakeDamage =
            enemy.takeDamage;


        enemy.takeDamage =
            function (...args) {

                const killed =
                    originalTakeDamage.apply(
                        this,
                        args
                    );


                if (
                    killed
                ) {

                    audioManager.playEnemyDeath();
                }

                else {

                    audioManager.playEnemyCreature(
                        "hit"
                    );
                }


                return killed;
            };
    }
}


function updateEnemyAudioObservers() {

    const enemies =
        typeof enemyManager.getAliveEnemies ===
        "function"
            ?
            enemyManager.getAliveEnemies()
            :
            [];


    for (
        const enemy
        of enemies
    ) {

        patchEnemyAudio(
            enemy
        );


        const attackAction =
            findAnimationAction(
                enemy,
                /attack|melee/i
            );


        if (
            !attackAction
        ) {

            continue;
        }


        const running =
            isActionRunning(
                attackAction
            );


        const previous =
            enemyAttackAudioState.get(
                enemy
            )
            ??
            false;


        if (
            running
            &&
            !previous
        ) {

            audioManager.playEnemyCreature(
                "attack"
            );
        }


        enemyAttackAudioState.set(
            enemy,
            running
        );
    }
}


function getBossProjectiles() {

    const projectiles =
        [];


    for (
        const [
            key,
            value
        ]
        of Object.entries(
            bossManager
        )
    ) {

        if (
            !/projectile/i.test(
                key
            )
        ) {

            continue;
        }


        if (
            Array.isArray(
                value
            )
        ) {

            for (
                const item
                of value
            ) {

                if (
                    item
                    &&
                    typeof item ===
                    "object"
                ) {

                    projectiles.push(
                        item
                    );
                }
            }
        }

        else if (
            value instanceof Set
            ||
            value instanceof Map
        ) {

            for (
                const item
                of value.values()
            ) {

                if (
                    item
                    &&
                    typeof item ===
                    "object"
                ) {

                    projectiles.push(
                        item
                    );
                }
            }
        }

        else if (
            value
            &&
            typeof value ===
            "object"
            &&
            !isAnimationActionLike(
                value
            )
        ) {

            projectiles.push(
                value
            );
        }
    }


    return projectiles;
}


function resetBossAudioObserver() {

    bossAudioState.chargeRunning =
        false;


    bossAudioState.firePlayed =
        false;


    bossAudioState.previousProjectiles =
        new Set();


    bossAudioState.projectilesInitialized =
        false;
}


function updateBossAudioObserver() {

    installBossDamageAudioHook();


    const cannonAction =
        findAnimationAction(
            bossManager,
            /cannon.*charge|charge.*cannon/i
        );


    if (
        cannonAction
    ) {

        const running =
            isActionRunning(
                cannonAction
            );


        if (
            running
            &&
            !bossAudioState.chargeRunning
        ) {

            bossAudioState.firePlayed =
                false;


            audioManager.playCannonCharge();
        }


        if (
            running
        ) {

            const clip =
                typeof cannonAction.getClip ===
                "function"
                    ?
                    cannonAction.getClip()
                    :
                    cannonAction._clip;


            const duration =
                Number(
                    clip?.duration
                )
                ||
                0;


            if (
                duration >
                0
                &&
                !bossAudioState.firePlayed
                &&
                cannonAction.time /
                duration >=
                0.72
            ) {

                bossAudioState.firePlayed =
                    true;


                audioManager.playCannonFire();
            }
        }


        if (
            !running
            &&
            bossAudioState.chargeRunning
        ) {

            bossAudioState.firePlayed =
                false;
        }


        bossAudioState.chargeRunning =
            running;
    }


    const currentProjectiles =
        new Set(
            getBossProjectiles()
        );


    if (
        !bossAudioState.projectilesInitialized
    ) {

        bossAudioState.previousProjectiles =
            currentProjectiles;


        bossAudioState.projectilesInitialized =
            true;


        return;
    }


    let projectileCreated =
        false;


    for (
        const projectile
        of currentProjectiles
    ) {

        if (
            !bossAudioState
                .previousProjectiles
                .has(
                    projectile
                )
        ) {

            projectileCreated =
                true;


            break;
        }
    }


    if (
        projectileCreated
        &&
        !bossAudioState.firePlayed
    ) {

        bossAudioState.firePlayed =
            true;


        audioManager.playCannonFire();
    }


    let projectileRemoved =
        false;


    for (
        const projectile
        of bossAudioState
            .previousProjectiles
    ) {

        if (
            !currentProjectiles.has(
                projectile
            )
        ) {

            projectileRemoved =
                true;


            break;
        }
    }


    if (
        projectileRemoved
        &&
        currentState ===
        GAME_STATE.BOSS_FIGHT
    ) {

        audioManager.playCannonImpact();
    }


    bossAudioState.previousProjectiles =
        currentProjectiles;
}


function updateDynamicAudioObservers() {

    if (
        currentState ===
        GAME_STATE.PLAYING
    ) {

        updateEnemyAudioObservers();
    }

    else if (
        currentState ===
        GAME_STATE.BOSS_FIGHT
    ) {

        updateBossAudioObserver();
    }
}


installWeaponAudioHooks();


installBossDamageAudioHook();


/* =========================================================
   CAMERA BLOCKERS
========================================================= */

cameraManager
    .setDynamicBlockersProvider(

        () => {

            if (
                currentState ===
                GAME_STATE.BOSS_FIGHT
            ) {

                if (
                    bossManager.isDead()
                ) {

                    return [];
                }


                return [
                    bossManager.getObject()
                ];
            }


            return enemyManager
                .getAliveEnemies()
                .filter(
                    enemy =>
                        !enemy.isSpawning()
                )
                .map(
                    enemy =>
                        enemy.getObject()
                );
        }
    );


cameraManager
    .setADSAnchorProvider(

        () =>
            weaponManager
                .getADSAnchor()

    );


/* =========================================================
   PAUSE
========================================================= */

const pauseMenu =
    new PauseMenu({

        onResume:
            () => {

                resumeGame();
            },

        onExit:
            () => {

                fleeToMenu();
            }
    });


let deathFallbackTimer =
    null;


playerController
    .setDeathFinishedHandler(

        () => {

            finishPlayerDeath();
        }
    );


/* =========================================================
   TEMP
========================================================= */

const cameraForward =
    new THREE.Vector3();


const cameraRight =
    new THREE.Vector3();


const cameraAimDirection =
    new THREE.Vector3();


let cachedCameraMode =
    null;


let cachedAiming =
    null;


let cachedFirstPerson =
    null;


/* =========================================================
   LIGHTING
========================================================= */

const ambientLight =
    new THREE.AmbientLight(
        0xb9c8d2,
        0.50
    );


scene.add(
    ambientLight
);


const hemisphereLight =
    new THREE.HemisphereLight(
        0xd9efff,
        0x15171c,
        0.88
    );


scene.add(
    hemisphereLight
);


const mainLight =
    new THREE.DirectionalLight(
        0xe7f2ff,
        2.75
    );


mainLight.position.set(
    14,
    24,
    10
);


mainLight.castShadow =
    true;


mainLight.shadow.mapSize.set(
    768,
    768
);


mainLight.shadow.camera.near =
    1;


mainLight.shadow.camera.far =
    70;


mainLight.shadow.camera.left =
    -25;


mainLight.shadow.camera.right =
    25;


mainLight.shadow.camera.top =
    25;


mainLight.shadow.camera.bottom =
    -25;


mainLight.shadow.bias =
    -0.00025;


mainLight.shadow.normalBias =
    0.035;


scene.add(
    mainLight
);


scene.add(
    mainLight.target
);


const secondaryFill =
    new THREE.DirectionalLight(
        0x7896ac,
        0.25
    );


secondaryFill.position.set(
    -12,
    9,
    -16
);


secondaryFill.castShadow =
    false;


scene.add(
    secondaryFill
);


/* =========================================================
   GLOBAL ZONE A RED FILL
========================================================= */

const emergencyLight =
    new THREE.PointLight(
        0xff2017,
        8,
        23,
        1.8
    );


emergencyLight.position.set(
    13,
    5,
    1
);


emergencyLight.castShadow =
    false;


scene.add(
    emergencyLight
);


/* =========================================================
   PLAYER FILL
========================================================= */

const playerLight =
    new THREE.PointLight(
        0xbde8ff,
        2.8,
        5,
        2
    );


playerLight.castShadow =
    false;


scene.add(
    playerLight
);


/* =========================================================
   BOSS SIREN
========================================================= */

const bossSiren = {

    active:
        false,

    angle:
        0,

    updateTimer:
        0,

    center:
        new THREE.Vector3(),

    floorY:
        0,

    height:
        8,

    radius:
        14
};


const bossSirenTarget =
    new THREE.Object3D();


scene.add(
    bossSirenTarget
);


const bossSirenLight =
    new THREE.SpotLight(
        0xff170a,
        0,
        70,
        Math.PI / 7,
        0.38,
        1.4
    );


bossSirenLight.castShadow =
    false;


bossSirenLight.visible =
    false;


bossSirenLight.target =
    bossSirenTarget;


scene.add(
    bossSirenLight
);


const bossRedGlow =
    new THREE.PointLight(
        0xb5160b,
        0,
        18,
        2
    );


bossRedGlow.castShadow =
    false;


bossRedGlow.visible =
    false;


scene.add(
    bossRedGlow
);


const beaconGeometry =
    new THREE.SphereGeometry(
        0.16,
        8,
        6
    );


const beaconMaterial =
    new THREE.MeshBasicMaterial({

        color:
            0xff180b
    });


const bossBeaconA =
    new THREE.Mesh(
        beaconGeometry,
        beaconMaterial
    );


bossBeaconA.visible =
    false;


scene.add(
    bossBeaconA
);


const bossBeaconB =
    new THREE.Mesh(
        beaconGeometry,
        beaconMaterial.clone()
    );


bossBeaconB.visible =
    false;


scene.add(
    bossBeaconB
);


/* =========================================================
   INTRO CINEMATIC UI
========================================================= */

const introOverlay =
    document.createElement(
        "div"
    );


Object.assign(
    introOverlay.style,
    {

        position:
            "fixed",

        inset:
            "0",

        zIndex:
            "60000",

        background:
            "#000",

        display:
            "flex",

        alignItems:
            "center",

        justifyContent:
            "center",

        visibility:
            "hidden",

        opacity:
            "0",

        transition:
            "opacity .45s ease",

        pointerEvents:
            "none"
    }
);


document.body.appendChild(
    introOverlay
);


const introText =
    document.createElement(
        "div"
    );


Object.assign(
    introText.style,
    {

        position:
            "relative",

        zIndex:
            "2",

        width:
            "min(1000px,90vw)",

        padding:
            "30px",

        textAlign:
            "center",

        fontFamily:
            "Orbitron,Consolas,monospace",

        fontWeight:
            "900",

        fontSize:
            "clamp(22px,4.2vw,58px)",

        letterSpacing:
            "6px",

        lineHeight:
            "1.25",

        color:
            "#eeeeee",

        textShadow:
            "0 0 24px rgba(255,255,255,.12)",

        opacity:
            "0",

        transform:
            "scale(.97)",

        transition:
            "opacity .30s ease, transform .40s ease"
    }
);


introOverlay.appendChild(
    introText
);


const introFlash =
    document.createElement(
        "div"
    );


Object.assign(
    introFlash.style,
    {

        position:
            "absolute",

        inset:
            "0",

        background:
            "#ff281c",

        opacity:
            "0",

        zIndex:
            "3",

        pointerEvents:
            "none",

        transition:
            "opacity .045s linear"
    }
);


introOverlay.appendChild(
    introFlash
);


/* =========================================================
   INTRO HELPERS
========================================================= */

function showIntroOverlay() {

    introOverlay.style.visibility =
        "visible";


    introOverlay.style.opacity =
        "1";
}


function hideIntroOverlay() {

    introText.style.opacity =
        "0";


    introOverlay.style.opacity =
        "0";


    setTimeout(
        () => {

            introOverlay.style.visibility =
                "hidden";
        },
        500
    );
}


async function showIntroText(
    text,
    duration = 900,
    {
        color = "#eeeeee",
        size = null,
        glow = null
    } = {}
) {

    introText.style.transition =
        "none";


    introText.style.opacity =
        "0";


    introText.style.transform =
        "scale(.96)";


    introText.textContent =
        text;


    introText.style.color =
        color;


    introText.style.fontSize =
        size
            ?
            size
            :
            "clamp(22px,4.2vw,58px)";


    introText.style.textShadow =
        glow
            ?
            glow
            :
            "0 0 24px rgba(255,255,255,.12)";


    await nextFrame();


    introText.style.transition =
        "opacity .28s ease, transform .40s ease";


    introText.style.opacity =
        "1";


    introText.style.transform =
        "scale(1)";


    await sleep(
        duration
    );


    introText.style.opacity =
        "0";


    introText.style.transform =
        "scale(1.025)";


    await sleep(
        260
    );
}


async function playIntroFlash() {

    introFlash.style.background =
        "#8b0b07";


    introFlash.style.opacity =
        "0.65";


    await sleep(
        45
    );


    introFlash.style.opacity =
        "0";


    await sleep(
        75
    );


    introFlash.style.background =
        "#ffffff";


    introFlash.style.opacity =
        "0.88";


    await sleep(
        38
    );


    introFlash.style.opacity =
        "0";


    await sleep(
        65
    );


    introFlash.style.background =
        "#ff2118";


    introFlash.style.opacity =
        "0.48";


    await sleep(
        55
    );


    introFlash.style.opacity =
        "0";
}


/* =========================================================
   RUN INTRO
========================================================= */

async function runIntroSequence() {

    if (
        introPlaying
    ) {

        return;
    }


    introPlaying =
        true;


    currentState =
        GAME_STATE.INTRO;


    audioManager.playMusic(
        "zoneA",
        {
            fade: 1.8
        }
    );


    playerController.setEnabled(
        false
    );


    weaponManager.setPaused(
        true
    );


    enemyManager.setEnabled(
        false
    );


    waveManager.setEnabled(
        false
    );


    waveManager.setVisible(
        false
    );


    pickupManager.setEnabled(
        false
    );


    cameraManager.setPaused(
        true
    );


    cameraManager
        .releasePointerLock();


    playerHealth.setVisible(
        false
    );


    inspectionUI
        ?.classList
        .add(
            "hidden-interface"
        );


    showIntroOverlay();


    await sleep(
        450
    );


    await showIntroText(
        "TODOS ESTÁN MUERTOS.",
        900
    );


    await sleep(
        180
    );


    await showIntroText(
        "NADIE RESPONDE.",
        800,
        {
            color:
                "#bbbbbb"
        }
    );


    await sleep(
        180
    );


    await showIntroText(
        "AHORA SOLO QUEDAS TÚ.",
        1050,
        {

            color:
                "#f4f4f4",

            glow:
                "0 0 30px rgba(255,55,45,.18)"
        }
    );


    await sleep(
        300
    );


    introText.style.transition =
        "none";


    introText.style.opacity =
        "0";


    introText.style.transform =
        "scale(.82)";


    introText.textContent =
        "SOBREVIVE";


    introText.style.color =
        "#ff4035";


    introText.style.fontSize =
        "clamp(38px,8vw,105px)";


    introText.style.textShadow =
        "0 0 38px rgba(255,35,25,.72)";


    await nextFrame();


    introText.style.transition =
        "opacity .13s ease, transform .30s cubic-bezier(.2,.8,.2,1)";


    introText.style.opacity =
        "1";


    introText.style.transform =
        "scale(1)";


    await sleep(
        720
    );


    await playIntroFlash();


    introText.style.opacity =
        "0";


    await sleep(
        100
    );


    hideIntroOverlay();


    await sleep(
        320
    );


    introPlaying =
        false;


    startZoneAGameplay();
}


/* =========================================================
   FINAL UI
========================================================= */

const endingOverlay =
    document.createElement(
        "div"
    );


Object.assign(
    endingOverlay.style,
    {

        position:
            "fixed",

        inset:
            "0",

        zIndex:
            "65000",

        background:
            "#000",

        display:
            "flex",

        flexDirection:
            "column",

        alignItems:
            "center",

        justifyContent:
            "center",

        visibility:
            "hidden",

        opacity:
            "0",

        transition:
            "opacity .75s ease",

        pointerEvents:
            "none",

        fontFamily:
            "Orbitron,Consolas,monospace"
    }
);


document.body.appendChild(
    endingOverlay
);


const endingEyebrow =
    document.createElement(
        "div"
    );


Object.assign(
    endingEyebrow.style,
    {

        fontSize:
            "clamp(8px,1vw,11px)",

        letterSpacing:
            "5px",

        color:
            "#d33630",

        marginBottom:
            "18px",

        opacity:
            "0",

        transition:
            "opacity .35s ease"
    }
);


endingOverlay.appendChild(
    endingEyebrow
);


const endingTitle =
    document.createElement(
        "div"
    );


Object.assign(
    endingTitle.style,
    {

        width:
            "min(1050px,90vw)",

        textAlign:
            "center",

        fontSize:
            "clamp(28px,5vw,70px)",

        fontWeight:
            "900",

        letterSpacing:
            "6px",

        lineHeight:
            "1.15",

        color:
            "#f1f1f1",

        opacity:
            "0",

        transform:
            "scale(.96)",

        transition:
            "opacity .40s ease, transform .55s ease",

        textShadow:
            "0 0 30px rgba(255,40,30,.20)"
    }
);


endingOverlay.appendChild(
    endingTitle
);


const endingSubtitle =
    document.createElement(
        "div"
    );


Object.assign(
    endingSubtitle.style,
    {

        width:
            "min(800px,85vw)",

        marginTop:
            "18px",

        textAlign:
            "center",

        fontSize:
            "clamp(10px,1.7vw,18px)",

        letterSpacing:
            "3px",

        lineHeight:
            "1.7",

        color:
            "rgba(255,255,255,.55)",

        opacity:
            "0",

        transition:
            "opacity .40s ease"
    }
);


endingOverlay.appendChild(
    endingSubtitle
);


const endingButton =
    document.createElement(
        "button"
    );


Object.assign(
    endingButton.style,
    {

        marginTop:
            "34px",

        minWidth:
            "250px",

        padding:
            "14px 26px",

        border:
            "1px solid rgba(255,75,60,.55)",

        borderRadius:
            "4px",

        background:
            "rgba(120,14,10,.18)",

        color:
            "#ffffff",

        fontFamily:
            "Orbitron,Consolas,monospace",

        fontWeight:
            "800",

        fontSize:
            "11px",

        letterSpacing:
            "3px",

        cursor:
            "pointer",

        opacity:
            "0",

        transform:
            "translateY(8px)",

        transition:
            "opacity .35s ease, transform .35s ease, background .2s ease",

        pointerEvents:
            "none"
    }
);


endingButton.addEventListener(
    "mouseenter",
    () => {

        endingButton.style.background =
            "rgba(160,20,15,.35)";
    }
);


endingButton.addEventListener(
    "mouseleave",
    () => {

        endingButton.style.background =
            "rgba(120,14,10,.18)";
    }
);


endingOverlay.appendChild(
    endingButton
);


const endingFlash =
    document.createElement(
        "div"
    );


Object.assign(
    endingFlash.style,
    {

        position:
            "absolute",

        inset:
            "0",

        zIndex:
            "10",

        background:
            "#ffffff",

        opacity:
            "0",

        pointerEvents:
            "none",

        transition:
            "opacity .05s linear"
    }
);


endingOverlay.appendChild(
    endingFlash
);


function showEndingOverlay() {

    endingOverlay.style.visibility =
        "visible";


    endingOverlay.style.pointerEvents =
        "auto";


    endingOverlay.style.opacity =
        "1";
}


function hideEndingContent() {

    endingEyebrow.style.opacity =
        "0";


    endingTitle.style.opacity =
        "0";


    endingTitle.style.transform =
        "scale(1.03)";


    endingSubtitle.style.opacity =
        "0";


    endingButton.style.opacity =
        "0";


    endingButton.style.transform =
        "translateY(8px)";


    endingButton.style.pointerEvents =
        "none";
}


async function showEndingText(
    title,
    {

        eyebrow = "",

        subtitle = "",

        duration = 1200,

        color = "#f1f1f1",

        fontSize =
            "clamp(28px,5vw,70px)"

    } = {}
) {

    hideEndingContent();


    endingEyebrow.textContent =
        eyebrow;


    endingTitle.textContent =
        title;


    endingSubtitle.textContent =
        subtitle;


    endingTitle.style.color =
        color;


    endingTitle.style.fontSize =
        fontSize;


    endingTitle.style.transform =
        "scale(.96)";


    await nextFrame();


    endingEyebrow.style.opacity =
        eyebrow
            ?
            "1"
            :
            "0";


    endingTitle.style.opacity =
        "1";


    endingTitle.style.transform =
        "scale(1)";


    endingSubtitle.style.opacity =
        subtitle
            ?
            "1"
            :
            "0";


    await sleep(
        duration
    );


    hideEndingContent();


    await sleep(
        320
    );
}


function waitForEndingButton(
    label
) {

    return new Promise(
        resolve => {

            endingButton.textContent =
                label;


            endingButton.style.pointerEvents =
                "auto";


            requestAnimationFrame(
                () => {

                    endingButton.style.opacity =
                        "1";


                    endingButton.style.transform =
                        "translateY(0)";
                }
            );


            const handler =
                () => {

                    endingButton
                        .removeEventListener(
                            "click",
                            handler
                        );


                    endingButton.style.pointerEvents =
                        "none";


                    resolve();
                };


            endingButton.addEventListener(
                "click",
                handler
            );
        }
    );
}


async function playEndingFlash() {

    endingFlash.style.background =
        "#ffffff";


    endingFlash.style.opacity =
        "0.82";


    await sleep(
        55
    );


    endingFlash.style.opacity =
        "0";


    await sleep(
        90
    );


    endingFlash.style.background =
        "#a40d08";


    endingFlash.style.opacity =
        "0.65";


    await sleep(
        65
    );


    endingFlash.style.opacity =
        "0";


    await sleep(
        110
    );


    endingFlash.style.background =
        "#ffffff";


    endingFlash.style.opacity =
        "0.40";


    await sleep(
        35
    );


    endingFlash.style.opacity =
        "0";
}


async function runEndingSequence() {

    if (
        endingSequenceStarted
    ) {

        return;
    }


    endingSequenceStarted =
        true;


    currentState =
        GAME_STATE.VICTORY;


    audioManager.stopSiren();


    audioManager.setCurrentMusicLevel(
        0.22,
        1.5
    );


    playerController.setEnabled(
        false
    );


    weaponManager.setPaused(
        true
    );


    enemyManager.setEnabled(
        false
    );


    bossManager.setEnabled(
        false
    );


    waveManager.setEnabled(
        false
    );


    waveManager.setVisible(
        false
    );


    pickupManager.setEnabled(
        false
    );


    cameraManager.cancelAim();


    cameraManager
        .releasePointerLock();


    playerHealth.setVisible(
        false
    );


    inspectionUI
        ?.classList
        .add(
            "hidden-interface"
        );


    await sleep(
        650
    );


    showEndingOverlay();


    await sleep(
        850
    );


    bossSiren.active =
        false;


    bossSirenLight.visible =
        false;


    bossRedGlow.visible =
        false;


    bossBeaconA.visible =
        false;


    bossBeaconB.visible =
        false;


    await showEndingText(

        "ESCAPASTE DE ELLOS...",

        {

            eyebrow:
                "NOVA ATLAS · SECTOR CORE",

            duration:
                1450
        }
    );


    await showEndingText(

        "POR AHORA.",

        {

            duration:
                1500,

            color:
                "#ff4439",

            fontSize:
                "clamp(38px,7vw,95px)"
        }
    );


    hideEndingContent();


    endingEyebrow.textContent =
        "TRANSMISIÓN INTERRUMPIDA";


    endingTitle.textContent =
        "PERO, ¿PODRÁS ESCAPAR DE LA BASE?";


    endingTitle.style.color =
        "#f3f3f3";


    endingTitle.style.fontSize =
        "clamp(24px,4.3vw,61px)";


    endingSubtitle.textContent =
        "La señal de Nova Atlas continúa activa.";


    endingTitle.style.transform =
        "scale(.96)";


    await nextFrame();


    endingEyebrow.style.opacity =
        "1";


    endingTitle.style.opacity =
        "1";


    endingTitle.style.transform =
        "scale(1)";


    endingSubtitle.style.opacity =
        "1";


    await sleep(
        550
    );


    await waitForEndingButton(
        "ESTOY LISTO"
    );


    hideEndingContent();


    await sleep(
        300
    );


    await playEndingFlash();


    await sleep(
        300
    );


    endingEyebrow.textContent =
        "NOVA CATALYST";


    endingTitle.textContent =
        "ZONA B";


    endingSubtitle.textContent =
        "PRÓXIMAMENTE";


    endingTitle.style.color =
        "#ff4338";


    endingTitle.style.fontSize =
        "clamp(55px,11vw,150px)";


    endingTitle.style.transform =
        "scale(.88)";


    await nextFrame();


    endingEyebrow.style.opacity =
        "1";


    endingTitle.style.opacity =
        "1";


    endingTitle.style.transform =
        "scale(1)";


    endingSubtitle.style.opacity =
        "1";


    await sleep(
        750
    );


    endingButton.textContent =
        "VOLVER AL INICIO";


    endingButton.style.opacity =
        "1";


    endingButton.style.transform =
        "translateY(0)";


    endingButton.style.pointerEvents =
        "auto";


    endingButton.addEventListener(
        "click",
        () => {

            fleeToMenu();
        },
        {
            once:
                true
        }
    );
}


/* =========================================================
   ZONE A LIGHTING
========================================================= */

function activateZoneALighting() {

    bossPerformanceMode =
        false;


    bossSiren.active =
        false;


    bossSirenLight.visible =
        false;


    bossRedGlow.visible =
        false;


    bossBeaconA.visible =
        false;


    bossBeaconB.visible =
        false;


    zoneAAtmosphere.setActive(
        false
    );


    ambientLight.intensity =
        0.50;


    hemisphereLight.intensity =
        0.88;


    mainLight.intensity =
        2.75;


    mainLight.castShadow =
        true;


    secondaryFill.intensity =
        0.25;


    emergencyLight.visible =
        true;


    emergencyLight.intensity =
        8;


    emergencyLight.distance =
        23;


    emergencyLight.position.set(
        13,
        5,
        1
    );


    playerLight.intensity =
        2.8;


    renderer.toneMappingExposure =
        1.22;


    renderer.shadowMap.enabled =
        true;


    scene.fog.density =
        0.0060;


    stars.visible =
        true;


    currentPixelRatio =
        Math.min(
            window.devicePixelRatio || 1,
            PERFORMANCE.maxPixelRatio
        );


    renderer.setPixelRatio(
        currentPixelRatio
    );


    renderer.setSize(
        window.innerWidth,
        window.innerHeight,
        false
    );


    renderer.shadowMap.needsUpdate =
        true;
}


/* =========================================================
   BOSS PERFORMANCE
========================================================= */

function activateBossPerformanceMode() {

    bossPerformanceMode =
        true;


    mainLight.castShadow =
        false;


    renderer.shadowMap.enabled =
        false;


    currentPixelRatio =
        Math.min(
            currentPixelRatio,
            PERFORMANCE.bossMaxPixelRatio
        );


    renderer.setPixelRatio(
        currentPixelRatio
    );


    renderer.setSize(
        window.innerWidth,
        window.innerHeight,
        false
    );


    stars.visible =
        false;


    console.log(
        `[Performance] Boss Mode ON · DPR ${currentPixelRatio.toFixed(2)}`
    );
}


/* =========================================================
   BOSS LIGHTING
========================================================= */

function activateBossEmergencyLighting(
    environment,
    spawns
) {

    activateBossPerformanceMode();


    environment.updateMatrixWorld(
        true
    );


    const box =
        new THREE.Box3()
            .setFromObject(
                environment
            );


    const size =
        new THREE.Vector3();


    box.getSize(
        size
    );


    bossSiren.center.set(

        (
            spawns.player.x +
            spawns.boss.x
        ) /
        2,

        (
            spawns.player.y +
            spawns.boss.y
        ) /
        2,

        (
            spawns.player.z +
            spawns.boss.z
        ) /
        2
    );


    bossSiren.floorY =
        Math.min(
            spawns.player.y,
            spawns.boss.y
        );


    bossSiren.height =
        bossSiren.floorY
        +
        Math.min(
            10,
            Math.max(
                6,
                size.y *
                0.43
            )
        );


    bossSiren.radius =
        Math.min(
            19,
            Math.max(
                11,
                Math.min(
                    size.x,
                    size.z
                ) *
                0.12
            )
        );


    bossSiren.angle =
        0;


    bossSiren.updateTimer =
        0;


    bossSiren.active =
        true;


    ambientLight.intensity =
        0.18;


    hemisphereLight.intensity =
        0.25;


    mainLight.intensity =
        0.95;


    secondaryFill.intensity =
        0.05;


    emergencyLight.visible =
        false;


    playerLight.intensity =
        1.75;


    renderer.toneMappingExposure =
        0.94;


    scene.fog.density =
        0.0062;


    bossSirenLight.position.set(
        bossSiren.center.x,
        bossSiren.height,
        bossSiren.center.z
    );


    bossRedGlow.position.set(
        bossSiren.center.x,
        bossSiren.floorY +
        3.4,
        bossSiren.center.z
    );


    bossBeaconA.position.set(
        bossSiren.center.x -
        3.5,
        bossSiren.height,
        bossSiren.center.z
    );


    bossBeaconB.position.set(
        bossSiren.center.x +
        3.5,
        bossSiren.height,
        bossSiren.center.z
    );


    bossSirenLight.visible =
        true;


    bossRedGlow.visible =
        true;


    bossBeaconA.visible =
        true;


    bossBeaconB.visible =
        true;
}


/* =========================================================
   BOSS SIREN UPDATE
========================================================= */

function updateBossEmergencyLighting(
    deltaTime,
    elapsedTime
) {

    if (
        !bossSiren.active
    ) {

        return;
    }


    bossSiren.updateTimer +=
        deltaTime;


    if (
        bossSiren.updateTimer <
        PERFORMANCE.sirenUpdateInterval
    ) {

        return;
    }


    const dt =
        bossSiren.updateTimer;


    bossSiren.updateTimer =
        0;


    bossSiren.angle +=
        dt *
        1.65;


    bossSirenTarget.position.set(

        bossSiren.center.x
        +
        Math.cos(
            bossSiren.angle
        ) *
        bossSiren.radius,

        bossSiren.floorY +
        0.80,

        bossSiren.center.z
        +
        Math.sin(
            bossSiren.angle
        ) *
        bossSiren.radius
    );


    bossSirenTarget
        .updateMatrixWorld();


    const pulse =
        0.5
        +
        0.5 *
        Math.sin(
            elapsedTime *
            8.3
        );


    const hardPulse =
        pulse *
        pulse;


    bossSirenLight.intensity =
        48
        +
        hardPulse *
        35;


    bossRedGlow.intensity =
        4
        +
        hardPulse *
        8;


    bossBeaconA.scale.setScalar(
        0.8
        +
        hardPulse *
        1.3
    );


    bossBeaconB.scale.setScalar(
        0.8
        +
        (
            1 -
            hardPulse
        ) *
        1.3
    );
}


/* =========================================================
   OPTIMIZATION
========================================================= */

function optimizeStaticEnvironment(
    environment
) {

    environment.traverse(
        object => {

            if (
                !object.isMesh
            ) {

                return;
            }


            object.castShadow =
                false;


            object.receiveShadow =
                true;


            object.frustumCulled =
                true;


            if (
                object.geometry
                &&
                !object.geometry.boundingSphere
            ) {

                object.geometry
                    .computeBoundingSphere();
            }
        }
    );
}


function configurePlayerShadows(
    root
) {

    root?.traverse(
        object => {

            if (
                !object.isMesh
            ) {

                return;
            }


            object.castShadow =
                true;


            object.receiveShadow =
                false;
        }
    );


    renderer.shadowMap.needsUpdate =
        true;
}


function configureDynamicObjectShadows() {

    const objects =
        objectManager
            .getDynamicObjects();


    for (
        const object
        of objects
    ) {

        object.mesh?.traverse(
            child => {

                if (
                    !child.isMesh
                ) {

                    return;
                }


                child.castShadow =
                    false;


                child.receiveShadow =
                    true;
            }
        );
    }


    renderer.shadowMap.needsUpdate =
        true;
}


/* =========================================================
   BOSS OVERLAY
========================================================= */

const bossOverlay =
    document.createElement(
        "div"
    );


Object.assign(
    bossOverlay.style,
    {

        position:
            "fixed",

        inset:
            "0",

        zIndex:
            "50000",

        background:
            "#000",

        display:
            "flex",

        justifyContent:
            "center",

        alignItems:
            "center",

        visibility:
            "hidden",

        opacity:
            "0",

        transition:
            "opacity .55s ease",

        pointerEvents:
            "none"
    }
);


document.body.appendChild(
    bossOverlay
);


const bossCinematicText =
    document.createElement(
        "div"
    );


Object.assign(
    bossCinematicText.style,
    {

        position:
            "absolute",

        left:
            "50%",

        top:
            "50%",

        transform:
            "translate(-50%,-50%) scale(.96)",

        width:
            "100%",

        textAlign:
            "center",

        color:
            "#f4f4f4",

        fontFamily:
            "Orbitron,Consolas,monospace",

        fontSize:
            "clamp(27px,5vw,66px)",

        fontWeight:
            "900",

        letterSpacing:
            "8px",

        textShadow:
            "0 0 30px rgba(255,45,35,.55)",

        opacity:
            "0",

        transition:
            "opacity .35s ease, transform .50s ease"
    }
);


bossOverlay.appendChild(
    bossCinematicText
);


const bossLoadingPanel =
    document.createElement(
        "div"
    );


Object.assign(
    bossLoadingPanel.style,
    {

        width:
            "min(440px,82vw)",

        padding:
            "26px",

        border:
            "1px solid rgba(255,255,255,.12)",

        borderRadius:
            "6px",

        background:
            "rgba(7,9,12,.92)",

        fontFamily:
            "Orbitron,Consolas,monospace",

        color:
            "#fff",

        opacity:
            "0",

        transform:
            "translateY(8px)",

        transition:
            "opacity .25s ease, transform .25s ease",

        display:
            "none"
    }
);


bossOverlay.appendChild(
    bossLoadingPanel
);


const bossLoadingEyebrow =
    document.createElement(
        "div"
    );


bossLoadingEyebrow.textContent =
    "PROTOCOLO DE TRANSFERENCIA";


Object.assign(
    bossLoadingEyebrow.style,
    {

        fontSize:
            "8px",

        letterSpacing:
            "3px",

        color:
            "#ff5148",

        marginBottom:
            "9px"
    }
);


const bossLoadingTitle =
    document.createElement(
        "div"
    );


bossLoadingTitle.textContent =
    "CARGANDO SECTOR CORE";


Object.assign(
    bossLoadingTitle.style,
    {

        fontSize:
            "15px",

        fontWeight:
            "900",

        letterSpacing:
            "2px",

        marginBottom:
            "18px"
    }
);


const bossLoadingTrack =
    document.createElement(
        "div"
    );


Object.assign(
    bossLoadingTrack.style,
    {

        width:
            "100%",

        height:
            "5px",

        background:
            "rgba(255,255,255,.10)",

        overflow:
            "hidden",

        borderRadius:
            "999px",

        marginBottom:
            "12px"
    }
);


const bossLoadingFill =
    document.createElement(
        "div"
    );


Object.assign(
    bossLoadingFill.style,
    {

        width:
            "0%",

        height:
            "100%",

        background:
            "#ef3930",

        transition:
            "width .20s ease"
    }
);


bossLoadingTrack.appendChild(
    bossLoadingFill
);


const bossLoadingStatus =
    document.createElement(
        "div"
    );


Object.assign(
    bossLoadingStatus.style,
    {

        fontSize:
            "8px",

        letterSpacing:
            "1.3px",

        color:
            "rgba(255,255,255,.55)",

        minHeight:
            "14px"
    }
);


const bossLoadingPercent =
    document.createElement(
        "div"
    );


Object.assign(
    bossLoadingPercent.style,
    {

        marginTop:
            "8px",

        fontSize:
            "8px",

        color:
            "rgba(255,255,255,.35)",

        textAlign:
            "right"
    }
);


const bossErrorButtons =
    document.createElement(
        "div"
    );


Object.assign(
    bossErrorButtons.style,
    {

        display:
            "none",

        gap:
            "8px",

        marginTop:
            "20px"
    }
);


const bossRetryButton =
    document.createElement(
        "button"
    );


bossRetryButton.textContent =
    "REINICIAR";


const bossMenuButton =
    document.createElement(
        "button"
    );


bossMenuButton.textContent =
    "MENÚ";


for (
    const button
    of [
        bossRetryButton,
        bossMenuButton
    ]
) {

    Object.assign(
        button.style,
        {

            flex:
                "1",

            padding:
                "11px",

            background:
                "#11151a",

            border:
                "1px solid rgba(255,255,255,.15)",

            color:
                "#fff",

            fontFamily:
                "Orbitron,Consolas,monospace",

            fontSize:
                "8px",

            cursor:
                "pointer"
        }
    );
}


bossRetryButton.addEventListener(
    "click",
    retryGame
);


bossMenuButton.addEventListener(
    "click",
    fleeToMenu
);


bossErrorButtons.append(
    bossRetryButton,
    bossMenuButton
);


bossLoadingPanel.append(
    bossLoadingEyebrow,
    bossLoadingTitle,
    bossLoadingTrack,
    bossLoadingStatus,
    bossLoadingPercent,
    bossErrorButtons
);


/* =========================================================
   BOSS OVERLAY HELPERS
========================================================= */

function setBossLoading(
    percentage,
    status
) {

    const value =
        THREE.MathUtils.clamp(
            percentage,
            0,
            100
        );


    bossLoadingFill.style.width =
        `${value}%`;


    bossLoadingPercent.textContent =
        `${Math.round(value)}%`;


    bossLoadingStatus.textContent =
        status;
}


function showBossOverlay() {

    bossOverlay.style.visibility =
        "visible";


    bossOverlay.style.opacity =
        "1";
}


function showCinematicText(
    text
) {

    showBossOverlay();


    bossLoadingPanel.style.display =
        "none";


    bossCinematicText.textContent =
        text;


    bossCinematicText.style.opacity =
        "0";


    bossCinematicText.style.transform =
        "translate(-50%,-50%) scale(.96)";


    requestAnimationFrame(
        () => {

            bossCinematicText.style.opacity =
                "1";


            bossCinematicText.style.transform =
                "translate(-50%,-50%) scale(1)";
        }
    );
}


function hideCinematicText() {

    bossCinematicText.style.opacity =
        "0";
}


async function showBossLoadingPanel() {

    bossCinematicText.style.opacity =
        "0";


    bossLoadingPanel.style.display =
        "block";


    bossLoadingPanel.style.opacity =
        "0";


    await nextFrame();


    bossLoadingPanel.style.opacity =
        "1";
}


function hideBossOverlay() {

    bossCinematicText.style.opacity =
        "0";


    bossLoadingPanel.style.opacity =
        "0";


    bossOverlay.style.opacity =
        "0";


    setTimeout(
        () => {

            bossOverlay.style.visibility =
                "hidden";


            bossLoadingPanel.style.display =
                "none";
        },
        600
    );
}


/* =========================================================
   HELPERS
========================================================= */

function sleep(
    milliseconds
) {

    return new Promise(
        resolve => {

            setTimeout(
                resolve,
                milliseconds
            );
        }
    );
}


function nextFrame() {

    return new Promise(
        resolve => {

            requestAnimationFrame(
                resolve
            );
        }
    );
}


/* =========================================================
   STATE
========================================================= */

function isGameplayState() {

    return (
        currentState ===
        GAME_STATE.PLAYING

        ||

        currentState ===
        GAME_STATE.BOSS_FIGHT
    );
}


/* =========================================================
   SCREENS
========================================================= */

function hideMainScreens() {

    [
        mainMenu,
        briefingScreen,
        aboutScreen
    ]
        .forEach(
            screen => {

                if (
                    !screen
                ) {

                    return;
                }


                screen.classList.remove(
                    "screen-visible"
                );


                screen.classList.add(
                    "hidden-screen"
                );
            }
        );
}


function showScreen(
    target
) {

    playerHealth.setVisible(
        false
    );


    hideMainScreens();


    loadingScreen
        ?.classList
        .add(
            "hidden-screen"
        );


    inspectionUI
        ?.classList
        .add(
            "hidden-interface"
        );


    if (
        target
    ) {

        target.classList.remove(
            "hidden-screen"
        );


        target.classList.add(
            "screen-visible"
        );
    }
}


/* =========================================================
   MENU
========================================================= */

btnEnter?.addEventListener(
    "click",
    () => {

        currentState =
            GAME_STATE.BRIEFING;


        showScreen(
            briefingScreen
        );
    }
);


btnAbout?.addEventListener(
    "click",
    () => {

        currentState =
            GAME_STATE.ABOUT;


        showScreen(
            aboutScreen
        );
    }
);


btnBackBriefing?.addEventListener(
    "click",
    () => {

        currentState =
            GAME_STATE.MENU;


        showScreen(
            mainMenu
        );
    }
);


btnBackAbout?.addEventListener(
    "click",
    () => {

        currentState =
            GAME_STATE.MENU;


        showScreen(
            mainMenu
        );
    }
);


btnSurvive?.addEventListener(
    "click",
    async () => {

        await enterZoneA();
    }
);


/* =========================================================
   POINTER LOCK
========================================================= */

cameraManager
    .setPointerLockChangeHandler(

        locked => {

            if (
                currentState ===
                GAME_STATE.DYING

                ||

                currentState ===
                GAME_STATE.GAME_OVER

                ||

                currentState ===
                GAME_STATE.TRANSITION

                ||

                currentState ===
                GAME_STATE.INTRO

                ||

                currentState ===
                GAME_STATE.VICTORY
            ) {

                return;
            }


            pauseMenu
                .setCaptureHintVisible(
                    isGameplayState()
                    &&
                    !locked
                );


            if (
                !locked
                &&
                isGameplayState()
            ) {

                pauseGame();
            }
        }
    );


/* =========================================================
   PAUSE
========================================================= */

function pauseGame() {

    if (
        !isGameplayState()
    ) {

        return;
    }


    stateBeforePause =
        currentState;


    currentState =
        GAME_STATE.PAUSED;


    playerController.setEnabled(
        false
    );


    cameraManager.setPaused(
        true
    );


    weaponManager.setPaused(
        true
    );


    enemyManager.setEnabled(
        false
    );


    bossManager.setEnabled(
        false
    );


    waveManager.setEnabled(
        false
    );


    pickupManager.setEnabled(
        false
    );


    audioManager.pauseAll();


    pauseMenu.setVisible(
        true
    );
}


function resumeGame() {

    if (
        currentState !==
        GAME_STATE.PAUSED
    ) {

        return;
    }


    pauseMenu.setVisible(
        false
    );


    audioManager.resumeAll();


    currentState =
        stateBeforePause;


    playerController.setEnabled(
        true
    );


    cameraManager.setPaused(
        false
    );


    weaponManager.setPaused(
        false
    );


    if (
        currentState ===
        GAME_STATE.BOSS_FIGHT
    ) {

        enemyManager.setEnabled(
            false
        );


        waveManager.setEnabled(
            false
        );


        pickupManager.setEnabled(
            false
        );


        bossManager.setEnabled(
            true
        );


        weaponManager.setEnemyManager(
            bossManager
        );
    }

    else {

        enemyManager.setEnabled(
            true
        );


        waveManager.setEnabled(
            true
        );


        pickupManager.setEnabled(
            true
        );


        bossManager.setEnabled(
            false
        );


        weaponManager.setEnemyManager(
            enemyManager
        );
    }


    cameraManager
        .requestPointerLock();
}


/* =========================================================
   PLAYER DEATH
========================================================= */

function beginPlayerDeath() {

    if (
        currentState ===
        GAME_STATE.DYING

        ||

        currentState ===
        GAME_STATE.GAME_OVER
    ) {

        return;
    }


    currentState =
        GAME_STATE.DYING;


    audioManager.stopSiren();


    audioManager.setCurrentMusicLevel(
        0.28,
        1.2
    );


    weaponManager.setPaused(
        true
    );


    enemyManager.setEnabled(
        false
    );


    bossManager.setEnabled(
        false
    );


    waveManager.setEnabled(
        false
    );


    pickupManager.setEnabled(
        false
    );


    cameraManager.cancelAim();


    if (
        cameraManager.getMode() ===
        "FPS"
    ) {

        cameraManager.toggleMode();
    }


    cameraManager
        .releasePointerLock();


    const started =
        playerController.die();


    if (
        !started
    ) {

        finishPlayerDeath();


        return;
    }


    const duration =
        playerController
            .getDeathDuration();


    deathFallbackTimer =
        setTimeout(
            finishPlayerDeath,
            Math.max(
                800,
                duration *
                1000 +
                250
            )
        );
}


function finishPlayerDeath() {

    if (
        currentState ===
        GAME_STATE.GAME_OVER
    ) {

        return;
    }


    if (
        deathFallbackTimer
    ) {

        clearTimeout(
            deathFallbackTimer
        );


        deathFallbackTimer =
            null;
    }


    currentState =
        GAME_STATE.GAME_OVER;


    cameraManager.setPaused(
        true
    );


    weaponManager.setPaused(
        true
    );


    enemyManager.setEnabled(
        false
    );


    bossManager.setEnabled(
        false
    );


    waveManager.setEnabled(
        false
    );


    pickupManager.setEnabled(
        false
    );


    playerHealth.showGameOver();


    requestAnimationFrame(
        localizeGameOverButtons
    );
}


/* =========================================================
   RETRY / FLEE
========================================================= */

function retryGame() {

    sessionStorage.setItem(
        "nova_retry_zone_a",
        "true"
    );


    window.location.reload();
}


function fleeToMenu() {

    sessionStorage.removeItem(
        "nova_retry_zone_a"
    );


    window.location.reload();
}


/* =========================================================
   LOADING
========================================================= */

function setLoading(
    percentage,
    text
) {

    if (
        loadingProgress
    ) {

        loadingProgress.style.width =
            `${percentage}%`;
    }


    if (
        loadingText
    ) {

        loadingText.textContent =
            text;
    }
}


/* =========================================================
   PRELOAD BOSS
========================================================= */

let bossPreloadPromise =
    null;


function preloadBossEncounter() {

    if (
        bossPreloadPromise
    ) {

        return bossPreloadPromise;
    }


    bossPreloadPromise =
        Promise.all([

            environmentManager
                .preloadEnvironment(
                    ENVIRONMENTS.BOSS_ARENA
                ),

            bossManager.preload()

        ])
            .catch(
                error => {

                    console.warn(
                        "[Nova] Boss preload incompleto:",
                        error
                    );
                }
            );


    return bossPreloadPromise;
}


/* =========================================================
   START GAMEPLAY
========================================================= */

function startZoneAGameplay() {

    currentState =
        GAME_STATE.PLAYING;


    audioManager.playMusic(
        "zoneA",
        {
            fade: 1.6
        }
    );


    audioManager.startZoneASiren();


    cameraManager.setPaused(
        false
    );


    playerController.setEnabled(
        true
    );


    weaponManager.setPaused(
        false
    );


    weaponManager.setEnabled(
        true
    );


    enemyManager.setEnabled(
        true
    );


    pickupManager.setEnabled(
        true
    );


    playerHealth.setVisible(
        true
    );


    inspectionUI
        ?.classList
        .remove(
            "hidden-interface"
        );


    waveManager.start();


    showNotification(
        "PREPÁRATE · YA VIENEN"
    );


    setTimeout(
        () => {

            if (
                currentState ===
                GAME_STATE.PLAYING
            ) {

                cameraManager
                    .requestPointerLock();
            }
        },
        180
    );
}


/* =========================================================
   ENTER ZONE A
========================================================= */

async function enterZoneA() {

    if (
        currentState ===
        GAME_STATE.LOADING

        ||

        currentState ===
        GAME_STATE.INTRO
    ) {

        return;
    }


    currentState =
        GAME_STATE.LOADING;


    audioManager.stopSiren();


    audioManager.stopMusic(
        1.0
    );


    activateZoneALighting();


    bossTransitionStarted =
        false;


    bossTransitionFailed =
        false;


    endingSequenceStarted =
        false;


    introPlaying =
        false;


    bossManager.setEnabled(
        false
    );


    bossManager.setVisible(
        false
    );


    weaponManager.setEnemyManager(
        enemyManager
    );


    playerHealth.setVisible(
        false
    );


    hideMainScreens();


    if (
        backgroundEffects
    ) {

        backgroundEffects.style.display =
            "none";
    }


    loadingScreen
        ?.classList
        .remove(
            "hidden-screen"
        );


    playerHealth.hideGameOver();


    try {

        const zoneA =
            await environmentManager
                .activateEnvironment(
                    ENVIRONMENTS.ZONE_A
                );


        optimizeStaticEnvironment(
            zoneA
        );


        cameraManager.setEnvironment(
            zoneA
        );


        setLoading(
            45,
            "Inicializando física..."
        );


        await physicsManager.init();


        physicsManager
            .createEnvironmentColliders(
                zoneA
            );


        const playerSpawn =
            calculateZoneASpawn(
                zoneA
            );


        zoneAAtmosphere.setup(
            zoneA,
            playerSpawn
        );


        setLoading(
            60,
            "Cargando jugador..."
        );


        await playerController.load(
            playerSpawn
        );


        physicsManager.createCharacter(
            playerSpawn,
            playerController
                .getHeight()
        );


        configurePlayerShadows(
            playerController.getObject()
        );


        playerHealth.reset();


        playerHealth.setVisible(
            false
        );


        setLoading(
            70,
            "Cargando arsenal..."
        );


        await weaponManager.load();


        weaponManager.setEnvironment(
            zoneA
        );


        setLoading(
            78,
            "Desplegando objetos..."
        );


        objectManager
            .createZoneAObjects(
                zoneA,
                playerSpawn
            );


        configureDynamicObjectShadows();


        weaponManager
            .refreshDynamicTargets();


        setLoading(
            84,
            "Distribuyendo suministros..."
        );


        pickupManager.setEnvironment(
            zoneA
        );


        pickupManager
            .createZoneAPickups(
                playerSpawn
            );


        setLoading(
            89,
            "Cargando amenazas..."
        );


        await enemyManager.load();


        enemyManager.setEnvironment(
            zoneA
        );


        enemyManager.setEnabled(
            false
        );


        waveManager.setEnvironment(
            zoneA
        );


        waveManager.setEnabled(
            false
        );


        waveManager.setVisible(
            false
        );


        setLoading(
            94,
            "Analizando zonas hostiles..."
        );


        const validSpawnCount =
            await waveManager
                .prepareSpawnPool();


        if (
            validSpawnCount ===
            0
        ) {

            throw new Error(
                "No hay spawns enemigos válidos."
            );
        }


        playerController.setEnabled(
            false
        );


        cameraManager.setTarget(
            playerController
                .getObject(),
            true
        );


        cameraManager.enable();


        cameraManager.setPaused(
            true
        );


        weaponManager.setEnabled(
            true
        );


        weaponManager.setPaused(
            true
        );


        weaponManager.setViewMode(
            "TPS"
        );


        pickupManager.setEnabled(
            false
        );


        cachedCameraMode =
            "TPS";


        cachedAiming =
            false;


        cachedFirstPerson =
            false;


        renderer.shadowMap.needsUpdate =
            true;


        setLoading(
            100,
            "Nova Atlas preparada"
        );


        preloadBossEncounter();


        setTimeout(
            async () => {

                loadingScreen
                    ?.classList
                    .add(
                        "hidden-screen"
                    );


                await runIntroSequence();
            },
            250
        );
    }

    catch (
        error
    ) {

        console.error(
            "Error iniciando Zona A:",
            error
        );


        setLoading(
            100,
            "ERROR AL INICIAR ZONA A"
        );
    }
}


/* =========================================================
   ZONE A SPAWN
========================================================= */

function calculateZoneASpawn(
    environment
) {

    const box =
        new THREE.Box3()
            .setFromObject(
                environment
            );


    const size =
        new THREE.Vector3();


    box.getSize(
        size
    );


    const raycaster =
        new THREE.Raycaster(

            new THREE.Vector3(
                PLAYER_SPAWN_ZONE_A.x,
                box.max.y +
                10,
                PLAYER_SPAWN_ZONE_A.z
            ),

            new THREE.Vector3(
                0,
                -1,
                0
            )
        );


    const meshes =
        [];


    environment.traverse(
        object => {

            if (
                object.isMesh
                &&
                object.visible
            ) {

                meshes.push(
                    object
                );
            }
        }
    );


    const hits =
        raycaster.intersectObjects(
            meshes,
            false
        );


    if (
        hits.length >
        0
    ) {

        return new THREE.Vector3(

            PLAYER_SPAWN_ZONE_A.x,

            hits[0].point.y
            +
            0.08
            +
            PLAYER_SPAWN_ZONE_A.heightOffset,

            PLAYER_SPAWN_ZONE_A.z
        );
    }


    return new THREE.Vector3(

        PLAYER_SPAWN_ZONE_A.x,

        box.min.y +
        size.y *
        0.55,

        PLAYER_SPAWN_ZONE_A.z
    );
}


/* =========================================================
   DEACTIVATE ZONE A
========================================================= */

function deactivateZoneAExtras() {

    zoneAAtmosphere.setActive(
        false
    );


    enemyManager.setEnabled(
        false
    );


    enemyManager.pruneDeadEnemies(
        0
    );


    pickupManager.setEnabled(
        false
    );


    for (
        const pickup
        of pickupManager.pickups || []
    ) {

        if (
            pickup?.root
        ) {

            pickup.root.visible =
                false;
        }
    }


    const dynamicObjects =
        typeof objectManager
            .getDynamicObjects ===
        "function"

            ?

            objectManager
                .getDynamicObjects()

            :

            [];


    for (
        const object
        of dynamicObjects
    ) {

        if (
            object?.mesh
        ) {

            object.mesh.visible =
                false;
        }


        if (
            object?.rigidBody
            &&
            typeof object
                .rigidBody
                .setEnabled ===
            "function"
        ) {

            object.rigidBody
                .setEnabled(
                    false
                );
        }
    }


    weaponManager.dynamicTargets =
        [];
}


/* =========================================================
   BOSS FLOOR HELPERS
========================================================= */

function getEnvironmentFloorMeshes(
    environment
) {

    const meshes =
        [];


    environment.updateMatrixWorld(
        true
    );


    environment.traverse(
        object => {

            if (
                object.isMesh
                &&
                object.visible
                &&
                object.geometry
            ) {

                meshes.push(
                    object
                );
            }
        }
    );


    return meshes;
}


function getArenaFloorHits(
    meshes,
    box,
    x,
    z
) {

    const size =
        new THREE.Vector3();


    box.getSize(
        size
    );


    const raycaster =
        new THREE.Raycaster(

            new THREE.Vector3(
                x,
                box.max.y +
                4,
                z
            ),

            new THREE.Vector3(
                0,
                -1,
                0
            ),

            0,

            size.y +
            10
        );


    const normalMatrix =
        new THREE.Matrix3();


    const normal =
        new THREE.Vector3();


    const hits =
        raycaster.intersectObjects(
            meshes,
            false
        );


    const valid =
        [];


    const maximumFloorY =
        box.min.y
        +
        size.y
        *
        BOSS_ARENA_SPAWN_CONFIG
            .maxFloorHeightRatio;


    for (
        const hit
        of hits
    ) {

        if (
            !hit.face
        ) {

            continue;
        }


        normalMatrix
            .getNormalMatrix(
                hit.object.matrixWorld
            );


        normal
            .copy(
                hit.face.normal
            )
            .applyMatrix3(
                normalMatrix
            )
            .normalize();


        if (
            normal.y <
            0.55
        ) {

            continue;
        }


        if (
            hit.point.y >
            maximumFloorY
        ) {

            continue;
        }


        valid.push(
            hit.point.clone()
        );
    }


    return valid;
}


function detectCentralArenaFloor(
    meshes,
    box
) {

    const size =
        new THREE.Vector3();


    const center =
        new THREE.Vector3();


    box.getSize(
        size
    );


    box.getCenter(
        center
    );


    const regionX =
        size.x
        *
        BOSS_ARENA_SPAWN_CONFIG
            .centerRegionRatio;


    const regionZ =
        size.z
        *
        BOSS_ARENA_SPAWN_CONFIG
            .centerRegionRatio;


    const steps =
        BOSS_ARENA_SPAWN_CONFIG
            .gridSteps;


    const points =
        [];


    for (
        let ix = 0;
        ix < steps;
        ix++
    ) {

        const x =
            center.x
            +
            THREE.MathUtils.lerp(

                -regionX,

                regionX,

                ix /
                (
                    steps -
                    1
                )
            );


        for (
            let iz = 0;
            iz < steps;
            iz++
        ) {

            const z =
                center.z
                +
                THREE.MathUtils.lerp(

                    -regionZ,

                    regionZ,

                    iz /
                    (
                        steps -
                        1
                    )
                );


            const hits =
                getArenaFloorHits(
                    meshes,
                    box,
                    x,
                    z
                );


            for (
                const point
                of hits
            ) {

                points.push(
                    point
                );
            }
        }
    }


    if (
        points.length ===
        0
    ) {

        return null;
    }


    const clusters =
        [];


    const tolerance =
        BOSS_ARENA_SPAWN_CONFIG
            .floorClusterTolerance;


    points.sort(
        (
            a,
            b
        ) =>
            a.y -
            b.y
    );


    for (
        const point
        of points
    ) {

        let cluster =
            null;


        for (
            const current
            of clusters
        ) {

            if (
                Math.abs(
                    current.averageY -
                    point.y
                ) <=
                tolerance
            ) {

                cluster =
                    current;


                break;
            }
        }


        if (
            !cluster
        ) {

            cluster = {

                points:
                    [],

                sumX:
                    0,

                sumY:
                    0,

                sumZ:
                    0,

                averageY:
                    point.y
            };


            clusters.push(
                cluster
            );
        }


        cluster.points.push(
            point
        );


        cluster.sumX +=
            point.x;


        cluster.sumY +=
            point.y;


        cluster.sumZ +=
            point.z;


        cluster.averageY =
            cluster.sumY /
            cluster.points.length;
    }


    clusters.sort(
        (
            a,
            b
        ) =>
            b.points.length -
            a.points.length
    );


    const selected =
        clusters[0];


    return {

        y:
            selected.averageY,

        center:
            new THREE.Vector3(

                selected.sumX /
                selected.points.length,

                selected.averageY,

                selected.sumZ /
                selected.points.length
            )
    };
}


function sampleCentralArenaFloor(
    meshes,
    box,
    x,
    z,
    floorY
) {

    const hits =
        getArenaFloorHits(
            meshes,
            box,
            x,
            z
        );


    let best =
        null;


    let difference =
        Infinity;


    for (
        const point
        of hits
    ) {

        const currentDifference =
            Math.abs(
                point.y -
                floorY
            );


        if (
            currentDifference >
            BOSS_ARENA_SPAWN_CONFIG
                .floorSelectionTolerance
        ) {

            continue;
        }


        if (
            currentDifference <
            difference
        ) {

            difference =
                currentDifference;


            best =
                point;
        }
    }


    return best
        ?
        best.clone()
        :
        null;
}


function hasSimpleClearance(
    position,
    meshes,
    radius
) {

    const origin =
        new THREE.Vector3(
            position.x,
            position.y +
            1.1,
            position.z
        );


    const directions = [

        new THREE.Vector3(
            1,
            0,
            0
        ),

        new THREE.Vector3(
            -1,
            0,
            0
        ),

        new THREE.Vector3(
            0,
            0,
            1
        ),

        new THREE.Vector3(
            0,
            0,
            -1
        )
    ];


    const raycaster =
        new THREE.Raycaster();


    for (
        const direction
        of directions
    ) {

        raycaster.set(
            origin,
            direction
        );


        raycaster.near =
            0.05;


        raycaster.far =
            radius;


        if (
            raycaster
                .intersectObjects(
                    meshes,
                    false
                )
                .length >
            0
        ) {

            return false;
        }
    }


    return true;
}


function tryBossSpawnPair(
    center,
    floorY,
    meshes,
    box,
    directionX,
    directionZ,
    distance
) {

    const playerX =
        center.x -
        directionX *
        distance;


    const playerZ =
        center.z -
        directionZ *
        distance;


    const bossX =
        center.x +
        directionX *
        distance;


    const bossZ =
        center.z +
        directionZ *
        distance;


    const player =
        sampleCentralArenaFloor(
            meshes,
            box,
            playerX,
            playerZ,
            floorY
        );


    if (
        !player
    ) {

        return null;
    }


    const boss =
        sampleCentralArenaFloor(
            meshes,
            box,
            bossX,
            bossZ,
            floorY
        );


    if (
        !boss
    ) {

        return null;
    }


    if (
        !hasSimpleClearance(
            player,
            meshes,
            BOSS_ARENA_SPAWN_CONFIG
                .playerClearance
        )
    ) {

        return null;
    }


    if (
        !hasSimpleClearance(
            boss,
            meshes,
            BOSS_ARENA_SPAWN_CONFIG
                .bossClearance
        )
    ) {

        return null;
    }


    return {

        player,

        boss
    };
}


function calculateBossArenaSpawns(
    environment
) {

    environment.updateMatrixWorld(
        true
    );


    const box =
        new THREE.Box3()
            .setFromObject(
                environment
            );


    const meshes =
        getEnvironmentFloorMeshes(
            environment
        );


    const floor =
        detectCentralArenaFloor(
            meshes,
            box
        );


    if (
        !floor
    ) {

        throw new Error(
            "No se encontró piso central en Boss Arena."
        );
    }


    const directions = [

        [
            0,
            1
        ],

        [
            1,
            0
        ],

        [
            0.707,
            0.707
        ],

        [
            0.707,
            -0.707
        ]
    ];


    const distances = [

        BOSS_ARENA_SPAWN_CONFIG
            .halfSeparation,

        6,

        5
    ];


    for (
        const distance
        of distances
    ) {

        for (
            const [
                x,
                z
            ]
            of directions
        ) {

            const result =
                tryBossSpawnPair(

                    floor.center,

                    floor.y,

                    meshes,

                    box,

                    x,

                    z,

                    distance
                );


            if (
                result
            ) {

                result.player.y +=
                    0.08;


                result.boss.y +=
                    0.04;


                console.log(
                    "[Boss Arena] Spawn optimizado:",
                    result
                );


                return result;
            }
        }
    }


    throw new Error(
        "No se encontró un spawn central seguro."
    );
}


/* =========================================================
   PLAYER TELEPORT
========================================================= */

function teleportPlayerTo(
    position,
    lookAtPosition = null
) {

    const root =
        playerController
            .getObject();


    root.position.copy(
        position
    );


    if (
        lookAtPosition
    ) {

        const direction =
            new THREE.Vector3()
                .subVectors(
                    lookAtPosition,
                    position
                );


        direction.y =
            0;


        if (
            direction.lengthSq() >
            0.0001
        ) {

            root.rotation.y =
                Math.atan2(
                    direction.x,
                    direction.z
                );
        }
    }


    const body =
        physicsManager
            .characterBody;


    const footOffset =
        Number.isFinite(
            physicsManager
                .characterFootOffset
        )
            ?
            physicsManager
                .characterFootOffset
            :
            0.90;


    const physicsPosition = {

        x:
            position.x,

        y:
            position.y +
            footOffset,

        z:
            position.z
    };


    body?.setTranslation?.(
        physicsPosition,
        true
    );


    body?.setNextKinematicTranslation?.(
        physicsPosition
    );


    if (
        "verticalVelocity"
        in physicsManager
    ) {

        physicsManager.verticalVelocity =
            0;
    }


    root.updateMatrixWorld(
        true
    );
}


/* =========================================================
   TRANSITION ERROR
========================================================= */

function handleBossTransitionError(
    error
) {

    console.error(
        "[Nova] Boss transition failed:",
        error
    );


    bossTransitionFailed =
        true;


    currentState =
        GAME_STATE.TRANSITION;


    showBossOverlay();


    bossCinematicText.style.opacity =
        "0";


    bossLoadingPanel.style.display =
        "block";


    bossLoadingPanel.style.opacity =
        "1";


    bossLoadingEyebrow.textContent =
        "ERROR DE TRANSFERENCIA";


    bossLoadingTitle.textContent =
        "SECTOR CORE NO RESPONDE";


    setBossLoading(
        100,
        "No se pudo completar la transición."
    );


    bossLoadingFill.style.background =
        "#d92828";


    bossErrorButtons.style.display =
        "flex";


    bossOverlay.style.pointerEvents =
        "auto";
}


/* =========================================================
   BOSS TRANSITION
========================================================= */

async function beginBossTransition() {

    if (
        bossTransitionStarted

        ||

        currentState ===
        GAME_STATE.DYING

        ||

        currentState ===
        GAME_STATE.GAME_OVER

        ||

        currentState ===
        GAME_STATE.VICTORY
    ) {

        return;
    }


    bossTransitionStarted =
        true;


    bossTransitionFailed =
        false;


    currentState =
        GAME_STATE.TRANSITION;


    audioManager.stopSiren();


    audioManager.playMusic(
        "boss",
        {
            fade: 1.35
        }
    );


    playerController.setEnabled(
        false
    );


    weaponManager.setPaused(
        true
    );


    enemyManager.setEnabled(
        false
    );


    waveManager.setEnabled(
        false
    );


    pickupManager.setEnabled(
        false
    );


    bossManager.setEnabled(
        false
    );


    cameraManager.cancelAim();


    if (
        cameraManager.getMode() ===
        "FPS"
    ) {

        cameraManager.toggleMode();
    }


    cameraManager
        .releasePointerLock();


    waveManager.setVisible(
        false
    );


    bossOverlay.style.pointerEvents =
        "none";


    bossErrorButtons.style.display =
        "none";


    showCinematicText(
        "ÉL VIENE POR TI"
    );


    await sleep(
        1400
    );


    hideCinematicText();


    await sleep(
        300
    );


    showBossOverlay();


    bossLoadingEyebrow.textContent =
        "PROTOCOLO DE TRANSFERENCIA";


    bossLoadingTitle.textContent =
        "CARGANDO SECTOR CORE";


    await showBossLoadingPanel();


    setBossLoading(
        5,
        "Aislando Zona A..."
    );


    deactivateZoneAExtras();


    await nextFrame();


    setBossLoading(
        12,
        "Sincronizando recursos precargados..."
    );


    await preloadBossEncounter();


    setBossLoading(
        28,
        "Activando Sector Core..."
    );


    const bossArena =
        await environmentManager
            .activateEnvironment(
                ENVIRONMENTS.BOSS_ARENA
            );


    optimizeStaticEnvironment(
        bossArena
    );


    await nextFrame();


    setBossLoading(
        45,
        "Construyendo colisiones..."
    );


    physicsManager
        .createEnvironmentColliders(
            bossArena
        );


    await nextFrame();


    cameraManager.setEnvironment(
        bossArena
    );


    weaponManager.setEnvironment(
        bossArena
    );


    bossManager.setEnvironment(
        bossArena
    );


    setBossLoading(
        63,
        "Localizando centro de combate..."
    );


    const spawns =
        calculateBossArenaSpawns(
            bossArena
        );


    activateBossEmergencyLighting(
        bossArena,
        spawns
    );


    setBossLoading(
        72,
        "Desplegando operador..."
    );


    teleportPlayerTo(
        spawns.player,
        spawns.boss
    );


    cameraManager.setTarget(
        playerController
            .getObject(),
        true
    );


    setBossLoading(
        82,
        "Inicializando anomalía..."
    );


    await bossManager.load();


    await bossManager.spawn(
        spawns.boss
    );


    resetBossAudioObserver();


    installBossDamageAudioHook();


    weaponManager.setEnemyManager(
        bossManager
    );


    weaponManager.setViewMode(
        "TPS"
    );


    weaponManager.setEnabled(
        true
    );


    weaponManager.dynamicTargets =
        [];


    weaponManager.setPaused(
        false
    );


    cachedCameraMode =
        "TPS";


    cachedFirstPerson =
        false;


    cachedAiming =
        false;


    playerController
        .setFirstPersonMode(
            false
        );


    playerController.setAimState(
        false,
        cameraAimDirection
    );


    setBossLoading(
        100,
        "SECTOR CORE ONLINE"
    );


    audioManager.startBossSiren();


    await sleep(
        250
    );


    bossLoadingPanel.style.opacity =
        "0";


    await sleep(
        180
    );


    bossLoadingPanel.style.display =
        "none";


    showCinematicText(
        "SOBREVIVE"
    );


    await sleep(
        800
    );


    playerController.setEnabled(
        true
    );


    playerHealth.setVisible(
        true
    );


    currentState =
        GAME_STATE.BOSS_FIGHT;


    hideBossOverlay();


    showNotification(
        "ALERTA MÁXIMA · ANOMALÍA CORE"
    );


    setTimeout(
        () => {

            if (
                currentState ===
                GAME_STATE.BOSS_FIGHT
            ) {

                cameraManager
                    .requestPointerLock();
            }
        },
        500
    );
}


/* =========================================================
   BOSS DEFEATED
========================================================= */

function finishBossEncounter() {

    if (
        endingSequenceStarted
    ) {

        return;
    }


    runEndingSequence()
        .catch(
            error => {

                console.error(
                    "[Nova] Error en cinemática final:",
                    error
                );


                fleeToMenu();
            }
        );
}


/* =========================================================
   NOTIFICATIONS
========================================================= */

let notificationTimeout =
    null;


function showNotification(
    text
) {

    if (
        !notification
    ) {

        return;
    }


    notification.textContent =
        text;


    notification.classList.add(
        "visible"
    );


    if (
        notificationTimeout
    ) {

        clearTimeout(
            notificationTimeout
        );
    }


    notificationTimeout =
        setTimeout(
            () => {

                notification.classList.remove(
                    "visible"
                );
            },
            2800
        );
}


/* =========================================================
   FPS
========================================================= */

function updateFPSCounter(
    deltaTime
) {

    fpsFrames++;


    fpsTimer +=
        deltaTime;


    if (
        fpsTimer <
        PERFORMANCE.fpsCounterInterval
    ) {

        return;
    }


    const measuredFPS =
        fpsFrames /
        fpsTimer;


    displayedFPS =
        displayedFPS *
        0.60
        +
        measuredFPS *
        0.40;


    const fps =
        Math.round(
            displayedFPS
        );


    fpsCounter.textContent =
        `FPS ${fps}`;


    fpsCounter.style.color =
        fps >= 55
            ?
            "#8effa8"
            :
            fps >= 40
                ?
                "#ffd75e"
                :
                "#ff635e";


    fpsTimer =
        0;


    fpsFrames =
        0;
}


/* =========================================================
   ADAPTIVE QUALITY
========================================================= */

function updateAdaptiveQuality(
    deltaTime
) {

    if (
        !PERFORMANCE.adaptiveResolution

        ||

        !isGameplayState()
    ) {

        return;
    }


    qualityTimer +=
        deltaTime;


    qualityFrames++;


    if (
        qualityTimer <
        PERFORMANCE.qualityCheckInterval
    ) {

        return;
    }


    const fps =
        qualityFrames /
        qualityTimer;


    const minimum =
        bossPerformanceMode
            ?
            PERFORMANCE.bossMinPixelRatio
            :
            PERFORMANCE.minPixelRatio;


    const maximum =
        bossPerformanceMode
            ?
            PERFORMANCE.bossMaxPixelRatio
            :
            PERFORMANCE.maxPixelRatio;


    let newRatio =
        currentPixelRatio;


    if (
        fps <
        PERFORMANCE.lowFPSThreshold
    ) {

        newRatio =
            Math.max(
                minimum,
                currentPixelRatio -
                0.055
            );
    }

    else if (
        fps >
        PERFORMANCE.highFPSThreshold
    ) {

        newRatio =
            Math.min(
                maximum,
                currentPixelRatio +
                0.025
            );
    }


    if (
        Math.abs(
            newRatio -
            currentPixelRatio
        ) >
        0.001
    ) {

        currentPixelRatio =
            newRatio;


        renderer.setPixelRatio(
            currentPixelRatio
        );


        renderer.setSize(
            window.innerWidth,
            window.innerHeight,
            false
        );
    }


    qualityTimer =
        0;


    qualityFrames =
        0;
}


/* =========================================================
   SHADOWS
========================================================= */

function updateShadowSystem(
    deltaTime,
    playerPosition
) {

    if (
        bossPerformanceMode
    ) {

        return;
    }


    shadowRefreshTimer +=
        deltaTime;


    shadowFocusTimer +=
        deltaTime;


    if (
        shadowFocusTimer >=
        PERFORMANCE.shadowFocusInterval
    ) {

        shadowFocusTimer =
            0;


        mainLight.position.set(
            playerPosition.x +
            14,
            playerPosition.y +
            24,
            playerPosition.z +
            10
        );


        mainLight.target.position.set(
            playerPosition.x,
            playerPosition.y,
            playerPosition.z
        );


        mainLight.target
            .updateMatrixWorld();
    }


    if (
        shadowRefreshTimer >=
        PERFORMANCE.shadowRefreshInterval
    ) {

        shadowRefreshTimer =
            0;


        renderer.shadowMap.needsUpdate =
            true;
    }
}


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setPixelRatio(
            currentPixelRatio
        );


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );
    }
);


/* =========================================================
   UPDATE
========================================================= */

function update(
    deltaTime,
    elapsedTime
) {

    updateFPSCounter(
        deltaTime
    );


    updateAdaptiveQuality(
        deltaTime
    );


    playerHealth.update(
        deltaTime
    );


    if (
        isGameplayState()
    ) {

        const bossFight =
            currentState ===
            GAME_STATE.BOSS_FIGHT;


        cameraManager
            .getForwardDirection(
                cameraForward
            );


        cameraManager
            .getRightDirection(
                cameraRight
            );


        cameraManager
            .getAimDirection(
                cameraAimDirection
            );


        const cameraMode =
            cameraManager.getMode();


        const aiming =
            cameraManager.isAiming();


        const firstPerson =
            cameraMode ===
            "FPS";


        if (
            firstPerson !==
            cachedFirstPerson
        ) {

            playerController
                .setFirstPersonMode(
                    firstPerson
                );


            cachedFirstPerson =
                firstPerson;
        }


        if (
            cameraMode !==
            cachedCameraMode
        ) {

            weaponManager
                .setViewMode(
                    cameraMode
                );


            cachedCameraMode =
                cameraMode;
        }


        if (
            aiming !==
            cachedAiming
        ) {

            weaponManager
                .setAiming(
                    aiming
                );


            cachedAiming =
                aiming;
        }


        playerController
            .setAimState(
                firstPerson ||
                aiming,
                cameraAimDirection
            );


        playerController.update(
            deltaTime,
            cameraForward,
            cameraRight
        );


        physicsManager
            .moveCharacter(
                playerController
                    .getDesiredMovement(),
                deltaTime
            );


        if (
            !bossFight
        ) {

            enemyManager
                .prePhysicsUpdate(
                    deltaTime
                );
        }


        /* ÚNICO RAPIER STEP */
        physicsManager.step(
            deltaTime
        );


        physicsManager
            .syncCharacter(
                playerController
                    .getObject()
            );


        if (
            !bossFight
        ) {

            enemyManager
                .postPhysicsUpdate(
                    deltaTime
                );


            objectManager.update();
        }

        else {

            bossManager.update(
                deltaTime
            );
        }


        updateDynamicAudioObservers();


        playerController
            .getObject()
            .updateMatrixWorld(
                true
            );


        cameraManager.update(
            deltaTime
        );


        if (
            !bossFight
        ) {

            enemyManager
                .updateVisuals();
        }


        weaponManager.update(
            deltaTime
        );


        if (
            !bossFight
        ) {

            pickupManager.update(
                deltaTime
            );


            waveManager.update(
                deltaTime
            );
        }


        const playerPosition =
            playerController
                .getPosition();


        playerLight.position.set(
            playerPosition.x,
            playerPosition.y +
            1.65,
            playerPosition.z +
            0.40
        );


        updateShadowSystem(
            deltaTime,
            playerPosition
        );


        debugTimer +=
            deltaTime;


        if (
            spawnDebug
            &&
            debugTimer >=
            PERFORMANCE.debugInterval
        ) {

            debugTimer =
                0;


            const threatText =
                bossFight
                    ?
                    ` · BOSS HP ${Math.ceil(bossManager.getHealth())}`
                    :
                    ` · WAVE ${waveManager.getWave()}/5 · HOSTILES ${enemyManager.getAliveCount()}`;


            spawnDebug.textContent =
                `${cameraMode}`
                +
                (
                    aiming
                        ?
                        " · ADS"
                        :
                        ""
                )
                +
                ` · HP ${Math.ceil(playerHealth.getHealth())}`
                +
                ` · ${weaponManager.getCurrentWeapon().toUpperCase()}`
                +
                threatText;
        }
    }


    else if (
        currentState ===
        GAME_STATE.INTRO
    ) {

        playerController
            .updateAnimationOnly(
                deltaTime
            );
    }


    else if (
        currentState ===
        GAME_STATE.DYING
    ) {

        playerController
            .updateAnimationOnly(
                deltaTime
            );


        playerController
            .getObject()
            .updateMatrixWorld(
                true
            );


        cameraManager.update(
            deltaTime
        );


        bossManager.update(
            deltaTime
        );
    }


    else if (
        currentState ===
        GAME_STATE.VICTORY
    ) {

        playerController
            .updateAnimationOnly(
                deltaTime
            );


        cameraManager.update(
            deltaTime
        );
    }


    zoneAAtmosphere.update(
        deltaTime,
        elapsedTime
    );


    if (
        bossSiren.active
    ) {

        updateBossEmergencyLighting(
            deltaTime,
            elapsedTime
        );
    }


    if (
        zoneAAtmosphere.active
        &&
        !bossSiren.active
    ) {

        emergencyLight.visible =
            true;


        const zonePulse =
            0.5
            +
            Math.sin(
                elapsedTime *
                2.2
            ) *
            0.5;


        emergencyLight.intensity =
            7
            +
            zonePulse *
            3.5;
    }


    stars.rotation.y +=
        deltaTime *
        0.0003;
}


/* =========================================================
   LOOP
========================================================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    const deltaTime =
        Math.min(
            clock.getDelta(),
            0.05
        );


    update(
        deltaTime,
        clock.elapsedTime
    );


    renderer.render(
        scene,
        camera
    );
}


/* =========================================================
   F9 DEBUG
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        if (
            event.code !==
            "F9"

            ||

            event.repeat
        ) {

            return;
        }


        if (
            currentState !==
            GAME_STATE.PLAYING
        ) {

            console.warn(
                "[DEBUG] F9 disponible después de la intro."
            );


            return;
        }


        console.warn(
            "[DEBUG] F9 → Boss Fight"
        );


        beginBossTransition()
            .catch(
                error => {

                    handleBossTransitionError(
                        error
                    );
                }
            );
    }
);


/* =========================================================
   ESC TRANSITION ERROR
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        if (
            event.code ===
            "Escape"

            &&

            currentState ===
            GAME_STATE.TRANSITION

            &&

            bossTransitionFailed
        ) {

            fleeToMenu();
        }
    }
);


/* =========================================================
   AUTO RETRY
========================================================= */

const autoRetryZoneA =
    sessionStorage.getItem(
        "nova_retry_zone_a"
    )
    ===
    "true";


if (
    !autoRetryZoneA
) {

    audioManager.playMusic(
        "menu",
        {
            fade: 1.4
        }
    );
}


if (
    autoRetryZoneA
) {

    sessionStorage.removeItem(
        "nova_retry_zone_a"
    );


    hideMainScreens();


    requestAnimationFrame(
        async () => {

            await enterZoneA();
        }
    );
}


/* =========================================================
   START
========================================================= */

activateZoneALighting();


localizeGameOverButtons();


playerHealth.setVisible(
    false
);


animate();


console.log(
    "%cNOVA CATALYST",
    "color:#d72924;font-size:24px;font-weight:bold;"
);


console.log(
    "%cFull Audio Integration · Build v0.29.0",
    "color:#8effa8;"
);
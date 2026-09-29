/* =========================================================
   NOVA CATALYST
   Main Controller

   Build v0.23.0 · BOSS PERFORMANCE
   ---------------------------------------------------------
   - Waves 1-5
   - Boss Arena
   - Central spawn
   - F9 Boss Debug
   - Boss performance mode
   - Reduced Boss pixel ratio
   - Shadows disabled during Boss Arena
   - Lightweight emergency siren
   - Simplified spawn calculations
   - Reintentar / Huir Game Over localization
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


/* =========================================================
   PERFORMANCE
========================================================= */

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

    /*
     * Sirena a 20 FPS internos.
     *
     * El juego sigue a 60 FPS,
     * pero la luz no necesita recalcularse cada frame.
     */
    sirenUpdateInterval:
        0.05
};


let currentPixelRatio =
    Math.min(

        window.devicePixelRatio ||
        1,

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


/* =========================================================
   GAME STATE
========================================================= */

const GAME_STATE = {

    MENU:
        "menu",

    BRIEFING:
        "briefing",

    ABOUT:
        "about",

    LOADING:
        "loading",

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


/* =========================================================
   PLAYER SPAWN ZONE A
========================================================= */

const PLAYER_SPAWN_ZONE_A = {

    x:
        16.0,

    z:
        0,

    heightOffset:
        -4.4
};


/* =========================================================
   BOSS SPAWN

   Mucho más barato que la versión anterior.
========================================================= */

const BOSS_ARENA_SPAWN_CONFIG = {

    /*
     * Antes:
     * 17 x 17 = 289 posiciones.
     *
     * Ahora:
     * 9 x 9 = 81.
     */
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

   No necesitamos modificar playerHealth.js.

   Conserva iconos/spans porque solamente cambia
   nodos de texto.
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
    1.42;


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
            },

        onDeath:
            () => {

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


/*
 * El manager normalmente crea su UI desde
 * el constructor, así que intentamos traducir
 * inmediatamente.
 */
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

                    bossManager
                        .getObject()

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
   NORMAL LIGHTING
========================================================= */

const ambientLight =
    new THREE.AmbientLight(

        0xb9c8d2,

        0.78

    );


scene.add(
    ambientLight
);


const hemisphereLight =
    new THREE.HemisphereLight(

        0xd9efff,

        0x15171c,

        1.35

    );


scene.add(
    hemisphereLight
);


const mainLight =
    new THREE.DirectionalLight(

        0xe7f2ff,

        4.0

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

        0.42

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


const emergencyLight =
    new THREE.PointLight(

        0xff3029,

        26,

        24,

        2

    );


emergencyLight.position.set(
    0,
    8,
    0
);


emergencyLight.castShadow =
    false;


scene.add(
    emergencyLight
);


const playerLight =
    new THREE.PointLight(

        0xbde8ff,

        3.2,

        5,

        2

    );


playerLight.castShadow =
    false;


scene.add(
    playerLight
);


/* =========================================================
   LIGHTWEIGHT BOSS SIREN

   Solo:
   - 1 SpotLight
   - 1 PointLight
   - 2 MeshBasic beacons

   Sin sombras.
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


/* =========================================================
   BEACONS

   Visuales baratos.
========================================================= */

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


    ambientLight.intensity =
        0.78;


    hemisphereLight.intensity =
        1.35;


    mainLight.intensity =
        4.0;


    mainLight.castShadow =
        true;


    secondaryFill.intensity =
        0.42;


    emergencyLight.visible =
        true;


    emergencyLight.intensity =
        26;


    playerLight.intensity =
        3.2;


    renderer.toneMappingExposure =
        1.42;


    renderer.shadowMap.enabled =
        true;


    scene.fog.density =
        0.0055;


    stars.visible =
        true;


    currentPixelRatio =
        Math.min(

            window.devicePixelRatio ||
            1,

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
   BOSS PERFORMANCE MODE
========================================================= */

function activateBossPerformanceMode() {

    bossPerformanceMode =
        true;


    /*
     * Sombra direccional desactivada solamente
     * en Boss Arena.
     *
     * Es uno de los ahorros más grandes.
     */
    mainLight.castShadow =
        false;


    renderer.shadowMap.enabled =
        false;


    /*
     * Reduce moderadamente la resolución interna.
     *
     * HUD/HTML siguen nítidos.
     */
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


    /*
     * No necesitamos estrellas detrás del escenario.
     */
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
        ) / 2,

        (
            spawns.player.y +
            spawns.boss.y
        ) / 2,

        (
            spawns.player.z +
            spawns.boss.z
        ) / 2

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
                size.y * 0.43
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


    /* =====================================================
       DARKER ARENA
    ====================================================== */

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


    /* =====================================================
       SIREN
    ====================================================== */

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


    console.log(
        "[Boss Arena] Emergency lighting optimized."
    );
}


/* =========================================================
   UPDATE SIREN

   20 Hz
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
        dt * 1.65;


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
            elapsedTime * 8.3
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


    const scaleA =
        0.8 +
        hardPulse * 1.3;


    const scaleB =
        0.8 +
        (
            1 - hardPulse
        ) * 1.3;


    bossBeaconA.scale.setScalar(
        scaleA
    );


    bossBeaconB.scale.setScalar(
        scaleB
    );
}


/* =========================================================
   STATIC ENVIRONMENT OPTIMIZATION
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

                !object.geometry
                    .boundingSphere
            ) {

                object.geometry
                    .computeBoundingSphere();
            }

        }

    );
}


/* =========================================================
   PLAYER SHADOW
========================================================= */

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


/* =========================================================
   DYNAMIC OBJECT SHADOWS
========================================================= */

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


/* =========================================================
   CINEMATIC TEXT
========================================================= */

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


/* =========================================================
   LOADING PANEL
========================================================= */

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
   OVERLAY HELPERS
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
   VICTORY UI
========================================================= */

const victoryOverlay =
    document.createElement(
        "div"
    );


Object.assign(

    victoryOverlay.style,

    {

        position:
            "fixed",

        inset:
            "0",

        zIndex:
            "51000",

        display:
            "none",

        alignItems:
            "center",

        justifyContent:
            "center",

        background:
            "rgba(0,0,0,.86)",

        fontFamily:
            "Orbitron,Consolas,monospace",

        color:
            "#fff"
    }

);


victoryOverlay.innerHTML = `

<div style="
    width:min(520px,88vw);
    text-align:center;
    padding:34px;
    border:1px solid rgba(255,255,255,.14);
    background:rgba(7,9,12,.90);
    border-radius:8px;
">

    <div style="
        font-size:10px;
        letter-spacing:4px;
        color:#ff554c;
        margin-bottom:12px;
    ">
        SECTOR CORE
    </div>

    <div style="
        font-size:clamp(25px,4vw,44px);
        font-weight:900;
        letter-spacing:4px;
        margin-bottom:10px;
    ">
        ANOMALÍA NEUTRALIZADA
    </div>

    <div style="
        font-size:9px;
        letter-spacing:2px;
        color:rgba(255,255,255,.55);
        margin-bottom:28px;
    ">
        OPERACIÓN COMPLETADA
    </div>

    <button
        id="nova-victory-retry"
        style="
            width:100%;
            padding:13px;
            margin-bottom:10px;
            background:#15191d;
            border:1px solid rgba(255,255,255,.16);
            color:white;
            cursor:pointer;
        "
    >
        REINICIAR OPERACIÓN
    </button>

    <button
        id="nova-victory-menu"
        style="
            width:100%;
            padding:13px;
            background:#0b0d10;
            border:1px solid rgba(255,255,255,.12);
            color:white;
            cursor:pointer;
        "
    >
        VOLVER AL MENÚ
    </button>

</div>
`;


document.body.appendChild(
    victoryOverlay
);


victoryOverlay
    .querySelector(
        "#nova-victory-retry"
    )
    ?.addEventListener(
        "click",
        retryGame
    );


victoryOverlay
    .querySelector(
        "#nova-victory-menu"
    )
    ?.addEventListener(
        "click",
        fleeToMenu
    );


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

    ].forEach(

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
   MENU EVENTS
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


    /*
     * Por si playerHealth crea la UI
     * justo al mostrar Game Over.
     */
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
   ENTER ZONE A
========================================================= */

async function enterZoneA() {

    if (
        currentState ===
        GAME_STATE.LOADING
    ) {

        return;
    }


    currentState =
        GAME_STATE.LOADING;


    activateZoneALighting();


    bossTransitionStarted =
        false;


    bossTransitionFailed =
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

        /* =================================================
           ENVIRONMENT
        ================================================= */

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


        /* =================================================
           PHYSICS
        ================================================= */

        setLoading(

            45,

            "Inicializando física..."

        );


        await physicsManager.init();


        physicsManager
            .createEnvironmentColliders(
                zoneA
            );


        /* =================================================
           PLAYER SPAWN
        ================================================= */

        const playerSpawn =
            calculateZoneASpawn(
                zoneA
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


        /* =================================================
           WEAPONS
        ================================================= */

        setLoading(

            70,

            "Cargando arsenal..."

        );


        await weaponManager.load();


        weaponManager.setEnvironment(
            zoneA
        );


        /* =================================================
           OBJECTS
        ================================================= */

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


        /* =================================================
           PICKUPS
        ================================================= */

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


        /* =================================================
           ENEMIES
        ================================================= */

        setLoading(

            89,

            "Cargando amenazas..."

        );


        await enemyManager.load();


        enemyManager.setEnvironment(
            zoneA
        );


        enemyManager.setEnabled(
            true
        );


        /* =================================================
           WAVES
        ================================================= */

        waveManager.setEnvironment(
            zoneA
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


        /* =================================================
           READY
        ================================================= */

        playerController.setEnabled(
            true
        );


        cameraManager.setTarget(

            playerController
                .getObject(),

            true

        );


        cameraManager.enable();


        weaponManager.setEnabled(
            true
        );


        weaponManager.setPaused(
            false
        );


        weaponManager.setViewMode(
            "TPS"
        );


        pickupManager.setEnabled(
            true
        );


        cachedCameraMode =
            "TPS";


        cachedAiming =
            false;


        cachedFirstPerson =
            false;


        setLoading(

            100,

            "Nova Atlas preparada"

        );


        setTimeout(

            () => {

                loadingScreen
                    ?.classList
                    .add(
                        "hidden-screen"
                    );


                inspectionUI
                    ?.classList
                    .remove(
                        "hidden-interface"
                    );


                currentState =
                    GAME_STATE.PLAYING;


                playerHealth.setVisible(
                    true
                );


                waveManager.start();


                showNotification(

                    "ARMAMENTO Y SUMINISTROS DISPERSOS EN ZONA A"

                );


                /*
                 * Empieza inmediatamente después
                 * de entrar a gameplay.
                 */
                preloadBossEncounter();

            },

            300

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

            PLAYER_SPAWN_ZONE_A
                .heightOffset,

            PLAYER_SPAWN_ZONE_A.z

        );
    }


    return new THREE.Vector3(

        PLAYER_SPAWN_ZONE_A.x,

        box.min.y +
        size.y * 0.55,

        PLAYER_SPAWN_ZONE_A.z

    );
}


/* =========================================================
   DEACTIVATE ZONE A
========================================================= */

function deactivateZoneAExtras() {

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
   BOSS ARENA FLOOR MESHES
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


/* =========================================================
   FLOOR HIT
========================================================= */

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


/* =========================================================
   CENTRAL FLOOR DETECTION
========================================================= */

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
                    steps - 1
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
                        steps - 1
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
        (a, b) =>
            a.y - b.y
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

        (a, b) =>
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


/* =========================================================
   SAMPLE FLOOR
========================================================= */

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


/* =========================================================
   SIMPLE CLEARANCE

   Solo 4 raycasts.
========================================================= */

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


/* =========================================================
   TRY SPAWN PAIR
========================================================= */

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
        directionX * distance;


    const playerZ =
        center.z -
        directionZ * distance;


    const bossX =
        center.x +
        directionX * distance;


    const bossZ =
        center.z +
        directionZ * distance;


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


/* =========================================================
   CALCULATE BOSS SPAWNS

   Pocas combinaciones alrededor del centro.
========================================================= */

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

        [0, 1],

        [1, 0],

        [0.707, 0.707],

        [0.707, -0.707]

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

    lookAtPosition =
        null

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
    ) {

        return;
    }


    bossTransitionStarted =
        true;


    bossTransitionFailed =
        false;


    currentState =
        GAME_STATE.TRANSITION;


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


    /* =====================================================
       WAIT FOR PRELOAD WHEN POSSIBLE
    ====================================================== */

    setBossLoading(

        12,

        "Sincronizando recursos precargados..."

    );


    /*
     * Si ya terminó, esto regresa inmediatamente.
     * Si F9 se presionó muy rápido, espera aquí.
     */
    await preloadBossEncounter();


    /* =====================================================
       ENVIRONMENT
    ====================================================== */

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


    /* =====================================================
       PHYSICS
    ====================================================== */

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


    /* =====================================================
       FAST SPAWN
    ====================================================== */

    setBossLoading(

        63,

        "Localizando centro de combate..."

    );


    const spawns =
        calculateBossArenaSpawns(
            bossArena
        );


    /* =====================================================
       PERFORMANCE + LIGHTS
    ====================================================== */

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


    /* =====================================================
       BOSS

       Ya debería estar precargado.
    ====================================================== */

    setBossLoading(

        82,

        "Inicializando anomalía..."

    );


    await bossManager.load();


    await bossManager.spawn(
        spawns.boss
    );


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
   VICTORY
========================================================= */

function finishBossEncounter() {

    if (
        currentState ===
        GAME_STATE.VICTORY
    ) {

        return;
    }


    currentState =
        GAME_STATE.VICTORY;


    playerController.setEnabled(
        false
    );


    weaponManager.setPaused(
        true
    );


    bossManager.setEnabled(
        false
    );


    cameraManager.cancelAim();


    cameraManager
        .releasePointerLock();


    showNotification(
        "ANOMALÍA NEUTRALIZADA"
    );


    setTimeout(

        () => {

            victoryOverlay.style.display =
                "flex";
        },

        900

    );
}


/* =========================================================
   NOTIFICATION
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
   SHADOW SYSTEM

   TOTALMENTE OMITIDO DURANTE BOSS.
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


        /* =================================================
           VIEW MODE
        ================================================= */

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


        /* =================================================
           PLAYER
        ================================================= */

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


        /* =================================================
           ENEMY PRE-PHYSICS
        ================================================= */

        if (
            !bossFight
        ) {

            enemyManager
                .prePhysicsUpdate(
                    deltaTime
                );
        }


        /* =================================================
           EXACTLY ONE PHYSICS STEP
        ================================================= */

        physicsManager.step(
            deltaTime
        );


        physicsManager
            .syncCharacter(

                playerController
                    .getObject()

            );


        /* =================================================
           ZONE A
        ================================================= */

        if (
            !bossFight
        ) {

            enemyManager
                .postPhysicsUpdate(
                    deltaTime
                );


            objectManager.update();
        }


        /* =================================================
           BOSS
        ================================================= */

        else {

            bossManager.update(
                deltaTime
            );
        }


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


        /* =================================================
           PLAYER LIGHT
        ================================================= */

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


        /*
         * En Boss Arena no actualiza shadow maps.
         */
        updateShadowSystem(

            deltaTime,

            playerPosition

        );


        /* =================================================
           DEBUG
        ================================================= */

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


    /* =====================================================
       DYING
    ====================================================== */

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


    /* =====================================================
       VICTORY
    ====================================================== */

    else if (
        currentState ===
        GAME_STATE.VICTORY
    ) {

        bossManager.update(
            deltaTime
        );


        playerController
            .updateAnimationOnly(
                deltaTime
            );


        cameraManager.update(
            deltaTime
        );
    }


    /* =====================================================
       SIREN
    ====================================================== */

    if (
        bossSiren.active
    ) {

        updateBossEmergencyLighting(

            deltaTime,

            elapsedTime

        );
    }

    else {

        emergencyLight.intensity =

            25

            +

            Math.sin(
                elapsedTime * 1.3
            ) *
            3;
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

                "[DEBUG] Espera a que Zona A termine de cargar."

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

    "%cBoss Performance Build v0.23.0",

    "color:#8effa8;"

);
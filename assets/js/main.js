/* =========================================================
   NOVA CATALYST
   Survival Build v0.15.0

   - Optimized rendering
   - Dynamic resolution
   - Controlled shadow refresh
   - Player shadow
   - Suspense lighting
   - Global pickups
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

    adaptiveResolution:
        true,

    qualityCheckInterval:
        1.25,

    fpsCounterInterval:
        0.25,

    lowFPSThreshold:
        50,

    highFPSThreshold:
        59,

    debugInterval:
        0.25,

    /*
     * Shadow map a ~30 actualizaciones por segundo.
     */
    shadowRefreshInterval:
        1 /
        30,

    /*
     * Recentramos el volumen de sombras
     * unas 8 veces por segundo.
     */
    shadowFocusInterval:
        0.125

};


let currentPixelRatio =
    Math.min(

        window.devicePixelRatio ||
        1,

        PERFORMANCE.maxPixelRatio

    );


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
   STATE
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

    PAUSED:
        "paused",

    DYING:
        "dying",

    GAME_OVER:
        "game_over"

};


let currentState =
    GAME_STATE.MENU;


/* =========================================================
   PLAYER SPAWN
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


/* =========================================================
   SHADOWS

   Volvemos al PCF estándar porque es más económico
   que PCFSoftShadowMap.
========================================================= */

renderer.shadowMap.enabled =
    true;


renderer.shadowMap.type =
    THREE.PCFShadowMap;


/*
 * Control manual.
 */
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
        500;


    const positions =
        new Float32Array(
            count *
            3
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        positions[
            i *
            3
        ] =

            (
                Math.random() -
                0.5
            )
            *
            300;


        positions[
            i *
            3 +
            1
        ] =

            (
                Math.random() -
                0.5
            )
            *
            300;


        positions[
            i *
            3 +
            2
        ] =

            (
                Math.random() -
                0.5
            )
            *
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
                0.50,

            depthWrite:
                false

        });


    const stars =
        new THREE.Points(

            geometry,

            material

        );


    stars.frustumCulled =
        false;


    scene.add(
        stars
    );


    return stars;

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
   HEALTH
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


/* =========================================================
   ENEMY MANAGER
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
   PICKUP MANAGER
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
   WAVE MANAGER
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

        onBossStarted:

            data => {

                console.log(

                    "[Nova] Boss solicitado:",

                    data.position

                );


                return null;

            },

        onMissionComplete:

            () => {

                showNotification(
                    "ZONE A SECURED"
                );

            }

    });


/* =========================================================
   COMBAT CONNECTIONS
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
   CAMERA
========================================================= */

cameraManager
    .setDynamicBlockersProvider(

        () =>

            enemyManager
                .getAliveEnemies()
                .filter(

                    enemy =>
                        !enemy.isSpawning()

                )
                .map(

                    enemy =>
                        enemy.getObject()

                )

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


/* =========================================================
   DEATH
========================================================= */

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


/* =========================================================
   MAIN SHADOW LIGHT
========================================================= */

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


/*
 * 768 vuelve a ser suficiente y es más barato.
 */
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


/* =========================================================
   SECONDARY FILL
========================================================= */

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


/* =========================================================
   EMERGENCY RED
========================================================= */

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


/* =========================================================
   PLAYER FILL
========================================================= */

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
   STATIC ENVIRONMENT

   RECIBE sombras pero NO las genera.
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

   Principal sombra dinámica.
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
   DYNAMIC OBJECTS

   Reciben sombra, pero ya NO todos generan shadow map.
   Esto reduce bastante el costo durante físicas.
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
            ) {

                return;

            }


            pauseMenu
                .setCaptureHintVisible(

                    currentState ===
                    GAME_STATE.PLAYING

                    &&

                    !locked

                );


            if (
                !locked

                &&

                currentState ===
                GAME_STATE.PLAYING
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
        currentState !==
        GAME_STATE.PLAYING
    ) {

        return;

    }


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
        GAME_STATE.PLAYING;


    playerController.setEnabled(
        true
    );


    cameraManager.setPaused(
        false
    );


    weaponManager.setPaused(
        false
    );


    enemyManager.setEnabled(
        true
    );


    waveManager.setEnabled(
        true
    );


    pickupManager.setEnabled(
        true
    );


    cameraManager
        .requestPointerLock();

}


/* =========================================================
   DEATH
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
                1000

                +

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


    waveManager.setEnabled(
        false
    );


    pickupManager.setEnabled(
        false
    );


    playerHealth.showGameOver();

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
   ZONE A
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
           SPAWN
        ================================================= */

        const playerSpawn =
            calculateZoneASpawn(
                zoneA
            );


        /* =================================================
           PLAYER
        ================================================= */

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

            playerController
                .getObject()

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

                "No se encontraron puntos válidos para enemigos."

            );

        }


        /* =================================================
           GAME READY
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


        renderer.shadowMap.needsUpdate =
            true;


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

            },

            300

        );


        environmentManager
            .preloadEnvironment(
                ENVIRONMENTS.BOSS_ARENA
            );

    }

    catch (
        error
    ) {

        console.error(

            "Error iniciando Zona A:",

            error

        );


        playerHealth.setVisible(
            false
        );


        setLoading(

            100,

            "ERROR AL INICIAR ZONA A"

        );

    }

}


/* =========================================================
   SPAWN
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
        size.y *
        0.55,

        PLAYER_SPAWN_ZONE_A.z

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
   FPS COUNTER
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


    const current =
        fpsFrames /
        fpsTimer;


    displayedFPS =

        displayedFPS *
        0.60

        +

        current *
        0.40;


    const fps =
        Math.round(
            displayedFPS
        );


    fpsCounter.textContent =
        `FPS ${fps}`;


    fpsCounter.style.color =

        fps >=
        55

            ?

            "#8effa8"

            :

            fps >=
            40

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

        currentState !==
        GAME_STATE.PLAYING
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


    let newRatio =
        currentPixelRatio;


    if (
        fps <
        PERFORMANCE.lowFPSThreshold
    ) {

        newRatio =
            Math.max(

                PERFORMANCE.minPixelRatio,

                currentPixelRatio -
                0.06

            );

    }

    else if (
        fps >
        PERFORMANCE.highFPSThreshold
    ) {

        newRatio =
            Math.min(

                PERFORMANCE.maxPixelRatio,

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
   SHADOW PERFORMANCE
========================================================= */

function updateShadowSystem(
    deltaTime,
    playerPosition
) {

    shadowRefreshTimer +=
        deltaTime;


    shadowFocusTimer +=
        deltaTime;


    /* =================================================
       RECENTER LIGHT
    ================================================= */

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


    /* =================================================
       REFRESH SHADOW MAP ~30HZ
    ================================================= */

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
        currentState ===
        GAME_STATE.PLAYING
    ) {

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
            cameraManager
                .getMode();


        const aiming =
            cameraManager
                .isAiming();


        const firstPerson =
            cameraMode ===
            "FPS";


        /* =================================================
           CAMERA MODE
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

                firstPerson

                ||

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
           ENEMIES PRE PHYSICS
        ================================================= */

        enemyManager
            .prePhysicsUpdate(
                deltaTime
            );


        /* =================================================
           ONE PHYSICS STEP ONLY
        ================================================= */

        physicsManager.step(
            deltaTime
        );


        /* =================================================
           SYNC PLAYER
        ================================================= */

        physicsManager
            .syncCharacter(

                playerController
                    .getObject()

            );


        /* =================================================
           SYNC ENEMIES
        ================================================= */

        enemyManager
            .postPhysicsUpdate(
                deltaTime
            );


        /* =================================================
           OBJECTS
        ================================================= */

        objectManager.update();


        playerController
            .getObject()
            .updateMatrixWorld(
                true
            );


        /* =================================================
           CAMERA
        ================================================= */

        cameraManager.update(
            deltaTime
        );


        /* =================================================
           VISUALS
        ================================================= */

        enemyManager
            .updateVisuals();


        weaponManager.update(
            deltaTime
        );


        pickupManager.update(
            deltaTime
        );


        waveManager.update(
            deltaTime
        );


        /* =================================================
           PLAYER POSITION
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


        /* =================================================
           CONTROLLED SHADOW UPDATE
        ================================================= */

        updateShadowSystem(

            deltaTime,

            playerPosition

        );


        /* =================================================
           DEBUG HUD
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

                ` · WAVE ${waveManager.getWave()}/5`

                +

                ` · HOSTILES ${enemyManager.getAliveCount()}`;

        }

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


        enemyManager
            .updateVisuals();


        objectManager.update();

    }


    stars.rotation.y +=
        deltaTime *
        0.0003;


    emergencyLight.intensity =

        25

        +

        Math.sin(

            elapsedTime *
            1.3

        )

        *

        3;

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

playerHealth.setVisible(
    false
);


animate();


console.log(

    "%cNOVA CATALYST",

    "color:#d72924;font-size:24px;font-weight:bold;"

);


console.log(

    "%cPerformance & Supply Build v0.15.0",

    "color:#8effa8;"

);
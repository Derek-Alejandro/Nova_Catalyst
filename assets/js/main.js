/* =========================================================
   NOVA CATALYST
   Project Nova

   Survival Build v0.13.0

   ---------------------------------------------------------
   - TPS / FPS
   - Rapier
   - Pistol
   - SMG GLTF
   - Shotgun GLTF
   - Mouse wheel weapons
   - Weapon pickups
   - E interaction
   - Health / Death / Retry
   - Enemy waves
   - Safe spawning
   - Barrel damage
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
        0.70,

    adaptiveResolution:
        true,

    qualityCheckInterval:
        1.5,

    fpsCounterInterval:
        0.25,

    lowFPSThreshold:
        47,

    highFPSThreshold:
        59,

    debugInterval:
        0.20

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


fpsCounter.id =
    "nova-fps-counter";


fpsCounter.textContent =
    "FPS 60";


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

        letterSpacing:
            "0.5px",

        pointerEvents:
            "none",

        userSelect:
            "none",

        backdropFilter:
            "blur(3px)"

    }

);


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
    1.34;


renderer.shadowMap.enabled =
    true;


renderer.shadowMap.type =
    THREE.PCFShadowMap;


renderer.shadowMap.autoUpdate =
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
   STAR FIELD
========================================================= */

function createStarField(

    count,

    radius,

    size,

    color,

    opacity

) {

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

        const index =
            i *
            3;


        positions[index] =

            (
                Math.random() -
                0.5
            )

            *

            radius;


        positions[
            index +
            1
        ] =

            (
                Math.random() -
                0.5
            )

            *

            radius;


        positions[
            index +
            2
        ] =

            (
                Math.random() -
                0.5
            )

            *

            radius;

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

            color,

            size,

            transparent:
                true,

            opacity,

            depthWrite:
                false

        });


    const field =
        new THREE.Points(

            geometry,

            material

        );


    field.frustumCulled =
        false;


    scene.add(
        field
    );


    return field;

}


const stars =
    createStarField(

        650,

        300,

        0.12,

        0xdde9ef,

        0.55

    );


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

                console.log(

                    `[Nova] Wave ${data.wave} eliminada.`

                );

            },


        onBossStarted:

            data => {

                console.log(

                    "[Nova] Boss solicitado:",

                    data.position

                );


                /*
                 * Boss real se conectará después.
                 */
                return null;

            },


        onMissionComplete:

            () => {

                console.log(
                    "[Nova] ZONE A SECURED"
                );

            }

    });


/* =========================================================
   PICKUP MANAGER
========================================================= */

const pickupManager =
    new PickupManager({

        scene,

        playerController,

        weaponManager,


        onPickup:

            data => {

                showNotification(

                    `${data.name} ADQUIRIDA · RUEDA PARA CAMBIAR`

                );


                console.log(

                    `[Nova] Pickup: ${data.name}`

                );

            }

    });


/* =========================================================
   WEAPON -> ENEMIES
========================================================= */

weaponManager.setEnemyManager(
    enemyManager
);


/* =========================================================
   BARRELS -> ENEMIES
========================================================= */

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
   CAMERA -> ENEMY
========================================================= */

cameraManager.setDynamicBlockersProvider(

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


/* =========================================================
   ADS
========================================================= */

cameraManager.setADSAnchorProvider(

    () =>
        weaponManager
            .getADSAnchor()

);


/* =========================================================
   PLAYER DEATH
========================================================= */

let deathFallbackTimer =
    null;


playerController.setDeathFinishedHandler(

    () => {

        finishPlayerDeath();

    }

);


/* =========================================================
   PAUSE MENU
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

        0.82

    );


scene.add(
    ambientLight
);


const hemisphereLight =
    new THREE.HemisphereLight(

        0xd9efff,

        0x11151b,

        1.25

    );


scene.add(
    hemisphereLight
);


const mainLight =
    new THREE.DirectionalLight(

        0xe8f5ff,

        3.65

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


const emergencyLight =
    new THREE.PointLight(

        0xff3029,

        36,

        27,

        1.9

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

        0xc6ecff,

        3.5,

        5,

        2

    );


playerLight.castShadow =
    false;


scene.add(
    playerLight
);


/* =========================================================
   PLAYER SHADOW
========================================================= */

function configureDynamicShadowCaster(
    root
) {

    if (
        !root
    ) {

        return;

    }


    root.traverse(

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

}


/* =========================================================
   OBJECT LIGHTING
========================================================= */

function configureDynamicObjectLighting() {

    if (
        typeof objectManager
            .getDynamicObjects !==
        "function"
    ) {

        return;

    }


    const objects =
        objectManager
            .getDynamicObjects();


    for (
        const object
        of objects
    ) {

        if (
            !object.mesh
        ) {

            continue;

        }


        object.mesh.traverse(

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

}


/* =========================================================
   OPTIMIZE ENVIRONMENT
========================================================= */

function optimizeStaticEnvironment(
    environment
) {

    environment.updateMatrixWorld(
        true
    );


    let count =
        0;


    environment.traverse(

        object => {

            object.matrixAutoUpdate =
                false;


            if (
                !object.isMesh
            ) {

                return;

            }


            count++;


            object.castShadow =
                false;


            object.receiveShadow =
                true;


            object.frustumCulled =
                true;


            if (
                object.geometry

                &&

                !object.geometry.boundingBox
            ) {

                object.geometry
                    .computeBoundingBox();

            }


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


    environment.updateMatrixWorld(
        true
    );


    console.log(

        `[Performance] Environment optimized: ${count} meshes`

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
        !target
    ) {

        return;

    }


    target.classList.remove(
        "hidden-screen"
    );


    target.classList.add(
        "screen-visible"
    );

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

cameraManager.setPointerLockChangeHandler(

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
   ESC
========================================================= */

window.addEventListener(

    "keydown",

    event => {

        if (
            event.code !==
            "Escape"
        ) {

            return;

        }


        if (
            currentState ===
            GAME_STATE.DYING

            ||

            currentState ===
            GAME_STATE.GAME_OVER
        ) {

            return;

        }


        if (
            currentState ===
            GAME_STATE.PLAYING

            &&

            !cameraManager
                .isInputCaptured()
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


    pauseMenu.setCaptureHintVisible(
        false
    );


    pauseMenu.setVisible(
        true
    );

}


/* =========================================================
   RESUME
========================================================= */

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


    cameraManager.requestPointerLock();

}


/* =========================================================
   BEGIN PLAYER DEATH
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


    console.log(
        "[Nova] PLAYER DYING..."
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


    cameraManager.cancelAim();


    if (
        cameraManager.getMode() ===
        "FPS"
    ) {

        cameraManager.toggleMode();

    }


    cameraManager.releasePointerLock();


    pauseMenu.setVisible(
        false
    );


    pauseMenu.setCaptureHintVisible(
        false
    );


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


    if (
        deathFallbackTimer
    ) {

        clearTimeout(
            deathFallbackTimer
        );

    }


    deathFallbackTimer =
        setTimeout(

            () => {

                finishPlayerDeath();

            },

            Math.max(

                800,

                duration *
                1000

                +

                250

            )

        );

}


/* =========================================================
   GAME OVER
========================================================= */

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


    console.log(
        "[Nova] GAME OVER"
    );

}


/* =========================================================
   RETRY
========================================================= */

function retryGame() {

    console.log(
        "[Nova] REINTENTANDO MISIÓN..."
    );


    sessionStorage.setItem(

        "nova_retry_zone_a",

        "true"

    );


    window.location.reload();

}


/* =========================================================
   FLEE
========================================================= */

function fleeToMenu() {

    console.log(
        "[Nova] ABANDONANDO MISIÓN..."
    );


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


    if (
        backgroundEffects
    ) {

        backgroundEffects.classList.add(
            "gameplay-mode"
        );


        backgroundEffects.style.display =
            "none";

    }


    hideMainScreens();


    loadingScreen
        ?.classList
        .remove(
            "hidden-screen"
        );


    playerHealth.hideGameOver();


    setLoading(

        0,

        "Estableciendo conexión con Nova Atlas..."

    );


    try {

        /* =================================================
           ENVIRONMENT
        ================================================= */

        const zoneA =
            await environmentManager
                .activateEnvironment(

                    ENVIRONMENTS.ZONE_A,

                    percent => {

                        const value =
                            Math.round(

                                percent *
                                0.40

                            );


                        setLoading(

                            value,

                            `Cargando Zona A · ${value}%`

                        );

                    }

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

            48,

            "Inicializando sistema físico..."

        );


        await physicsManager.init();


        setLoading(

            56,

            "Generando colisiones..."

        );


        physicsManager
            .createEnvironmentColliders(
                zoneA
            );


        /* =================================================
           PLAYER SPAWN
        ================================================= */

        setLoading(

            63,

            "Calculando zona segura..."

        );


        const playerSpawn =
            calculateZoneASpawn(
                zoneA
            );


        console.log(

            "[Nova] Player Spawn:",

            playerSpawn

        );


        /* =================================================
           PLAYER
        ================================================= */

        setLoading(

            68,

            "Cargando guardia..."

        );


        await playerController.load(
            playerSpawn
        );


        physicsManager.createCharacter(

            playerSpawn,

            playerController
                .getHeight()

        );


        configureDynamicShadowCaster(

            playerController
                .getObject()

        );


        /* =================================================
           HEALTH
        ================================================= */

        playerHealth.reset();


        playerHealth.setVisible(
            true
        );


        playerHealth.setEnabled(
            true
        );


        /* =================================================
           WEAPONS
        ================================================= */

        setLoading(

            75,

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

            82,

            "Desplegando objetos físicos..."

        );


        objectManager
            .createZoneAObjects(

                zoneA,

                playerSpawn

            );


        configureDynamicObjectLighting();


        weaponManager.refreshDynamicTargets();


        /* =================================================
           PICKUPS
        ================================================= */

        setLoading(

            86,

            "Distribuyendo armamento táctico..."

        );


        pickupManager.setEnvironment(
            zoneA
        );


        pickupManager
            .createZoneAWeaponPickups(
                playerSpawn
            );


        /* =================================================
           ENEMIES
        ================================================= */

        setLoading(

            89,

            "Cargando amenazas biológicas..."

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

            "Analizando zonas jugables para hostiles..."

        );


        const validSpawnCount =
            await waveManager
                .prepareSpawnPool();


        console.log(

            `[Nova] Spawns hostiles válidos: ${validSpawnCount}`

        );


        if (
            validSpawnCount ===
            0
        ) {

            throw new Error(

                "No se encontraron puntos válidos para enemigos."

            );

        }


        setLoading(

            98,

            "Inicializando protocolo de supervivencia..."

        );


        /* =================================================
           ENABLE PLAYER
        ================================================= */

        playerController.setEnabled(
            true
        );


        /* =================================================
           CAMERA
        ================================================= */

        cameraManager.setTarget(

            playerController
                .getObject(),

            true

        );


        cameraManager.enable();


        /* =================================================
           WEAPONS
        ================================================= */

        weaponManager.setEnabled(
            true
        );


        weaponManager.setPaused(
            false
        );


        weaponManager.setViewMode(
            "TPS"
        );


        /* =================================================
           PICKUPS
        ================================================= */

        pickupManager.setEnabled(
            true
        );


        /* =================================================
           CACHE
        ================================================= */

        cachedCameraMode =
            "TPS";


        cachedAiming =
            false;


        cachedFirstPerson =
            false;


        /* =================================================
           READY
        ================================================= */

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


                pauseMenu
                    .setCaptureHintVisible(
                        true
                    );


                waveManager.start();


                showNotification(

                    "PISTOLA EQUIPADA · BUSCA ARMAMENTO EN ZONA A"

                );

            },

            350

        );


        /* =================================================
           BOSS PRELOAD
        ================================================= */

        environmentManager
            .preloadEnvironment(
                ENVIRONMENTS.BOSS_ARENA
            );

    }

    catch (
        error
    ) {

        console.error(

            "❌ Error iniciando Zona A:",

            error

        );


        setLoading(

            100,

            "ERROR AL INICIAR ZONA A"

        );


        showNotification(
            "ERROR · REVISA F12"
        );

    }

}


/* =========================================================
   PLAYER SPAWN
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


    const spawnX =
        PLAYER_SPAWN_ZONE_A.x;


    const spawnZ =
        PLAYER_SPAWN_ZONE_A.z;


    const raycaster =
        new THREE.Raycaster(

            new THREE.Vector3(

                spawnX,

                box.max.y +
                10,

                spawnZ

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


    const intersections =
        raycaster.intersectObjects(

            meshes,

            false

        );


    if (
        intersections.length >
        0
    ) {

        return new THREE.Vector3(

            spawnX,

            intersections[0]
                .point
                .y

            +

            0.08

            +

            PLAYER_SPAWN_ZONE_A
                .heightOffset,

            spawnZ

        );

    }


    console.warn(
        "[Nova] Spawn fallback activo."
    );


    return new THREE.Vector3(

        spawnX,

        box.min.y

        +

        size.y *
        0.55,

        spawnZ

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

                notification
                    .classList
                    .remove(
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


    const currentFPS =
        fpsFrames /
        fpsTimer;


    displayedFPS =

        displayedFPS *
        0.60

        +

        currentFPS *
        0.40;


    const fps =
        Math.round(
            displayedFPS
        );


    fpsCounter.textContent =
        `FPS ${fps}`;


    if (
        fps >=
        55
    ) {

        fpsCounter.style.color =
            "#8effa8";

    }

    else if (
        fps >=
        40
    ) {

        fpsCounter.style.color =
            "#ffd75e";

    }

    else {

        fpsCounter.style.color =
            "#ff635e";

    }


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
                0.03

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
   RESIZE
========================================================= */

function handleResize() {

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


window.addEventListener(

    "resize",

    handleResize

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


    /* =====================================================
       PLAYING
    ====================================================== */

    if (
        currentState ===
        GAME_STATE.PLAYING
    ) {

        /* =================================================
           CAMERA DIRECTIONS
        ================================================= */

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
           PLAYER FPS
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


        /* =================================================
           WEAPON MODE
        ================================================= */

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


        /* =================================================
           AIM
        ================================================= */

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


        /* =================================================
           PLAYER PHYSICS REQUEST
        ================================================= */

        physicsManager
            .moveCharacter(

                playerController
                    .getDesiredMovement(),

                deltaTime

            );


        /* =================================================
           ENEMY PHYSICS REQUEST
        ================================================= */

        enemyManager
            .prePhysicsUpdate(
                deltaTime
            );


        /* =================================================
           ONE RAPIER STEP
        ================================================= */

        physicsManager.step(
            deltaTime
        );


        /* =================================================
           PLAYER SYNC
        ================================================= */

        physicsManager
            .syncCharacter(

                playerController
                    .getObject()

            );


        /* =================================================
           ENEMY SYNC
        ================================================= */

        enemyManager
            .postPhysicsUpdate(
                deltaTime
            );


        /* =================================================
           PHYSICAL OBJECTS
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
           ENEMY VISUALS
        ================================================= */

        enemyManager.updateVisuals();


        /* =================================================
           WEAPON
        ================================================= */

        weaponManager.update(
            deltaTime
        );


        /* =================================================
           PICKUPS
        ================================================= */

        pickupManager.update(
            deltaTime
        );


        /* =================================================
           WAVES
        ================================================= */

        waveManager.update(
            deltaTime
        );


        /* =================================================
           PLAYER LIGHT
        ================================================= */

        const playerPosition =
            playerController
                .getPosition();


        playerLight.position.set(

            playerPosition.x,

            playerPosition.y +
            1.8,

            playerPosition.z +
            0.65

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

                (
                    physicsManager
                        .isGrounded()

                        ?

                        " · GROUNDED"

                        :

                        " · AIRBORNE"
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


        enemyManager.updateVisuals();


        objectManager.update();

    }


    stars.rotation.y +=
        deltaTime *
        0.00030;


    emergencyLight.intensity =

        34

        +

        Math.sin(

            elapsedTime *
            1.35

        )

        *

        4;

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

    console.log(
        "[Nova] Retry detectado."
    );


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

animate();


console.log(

    "%cNOVA CATALYST",

    "color:#d72924;font-size:24px;font-weight:bold;"

);


console.log(

    "%cWeapon Pickup Build v0.13.0",

    "color:#8effa8;"

);


console.log(

    "%cPISTOL GLTF · ONLINE",

    "color:#55ff99;"

);


console.log(

    "%cSMG GLTF · ONLINE",

    "color:#55ff99;"

);


console.log(

    "%cSHOTGUN GLTF · ONLINE",

    "color:#55ff99;"

);
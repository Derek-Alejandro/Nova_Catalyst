/* =========================================================
   NOVA CATALYST
   Project Nova
   Pre-Alpha v.01

   PERFORMANCE BUILD v0.8.4

   - FPS Counter
   - Adaptive resolution
   - Static scene optimization
   - Real-time shadows disabled
   - Reduced lights
   - Cached camera collision
   - Cached enemy collision
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
    PauseMenu
} from "./pause.js";


/* =========================================================
   PERFORMANCE CONFIG
========================================================= */

const PERFORMANCE = {

    maxPixelRatio:
        1.0,

    minPixelRatio:
        0.65,

    adaptiveResolution:
        true,

    qualityCheckInterval:
        1.25,

    fpsCounterInterval:
        0.25,

    lowFPSThreshold:
        48,

    highFPSThreshold:
        58,

    debugInterval:
        0.20

};


let currentPixelRatio =

    Math.min(

        window.devicePixelRatio || 1,

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
        "paused"

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
            "rgba(0,0,0,.52)",

        border:
            "1px solid rgba(255,255,255,.12)",

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

   ANTIALIAS DESACTIVADO:
   mejor rendimiento.

   Resolución dinámica compensa la calidad.
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


/* =========================================================
   SHADOWS

   Deshabilitadas en Performance Build.

   Conservamos iluminación real, pero evitamos
   renderizar la escena varias veces por frame.
========================================================= */

renderer.shadowMap.enabled =
    false;


renderer.shadowMap.autoUpdate =
    false;


gameContainer.appendChild(
    renderer.domElement
);


/* =========================================================
   CLOCK
========================================================= */

const clock =
    new THREE.Clock();


/* =========================================================
   STARS
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
            count * 3
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        const index =
            i * 3;


        positions[index] =

            (
                Math.random() -
                0.5
            )
            *
            radius;


        positions[index + 1] =

            (
                Math.random() -
                0.5
            )
            *
            radius;


        positions[index + 2] =

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

    createStarField(

        650,

        300,

        0.12,

        0xdde9ef,

        0.55

    );


/* =========================================================
   MANAGERS
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


const enemyManager =

    new EnemyManager({

        scene,

        playerController,

        camera,

        physicsManager,

        objectManager

    });


cameraManager.setADSAnchorProvider(

    () =>
        weaponManager.getADSAnchor()

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

                window.location.reload();

            }

    });


/* =========================================================
   TEMP VECTORS
========================================================= */

const cameraForward =
    new THREE.Vector3();


const cameraRight =
    new THREE.Vector3();


const cameraAimDirection =
    new THREE.Vector3();


/* =========================================================
   CACHED STATES
========================================================= */

let cachedCameraMode =
    null;


let cachedAiming =
    null;


let cachedFirstPerson =
    null;


/* =========================================================
   LIGHTING

   Menos luces = muchos menos cálculos por píxel.
========================================================= */

const ambientLight =

    new THREE.AmbientLight(

        0xb8c7cf,

        1.10

    );


scene.add(
    ambientLight
);


const hemisphereLight =

    new THREE.HemisphereLight(

        0xd5edff,

        0x15181d,

        1.75

    );


scene.add(
    hemisphereLight
);


const mainLight =

    new THREE.DirectionalLight(

        0xe8f7ff,

        3.4

    );


mainLight.position.set(

    18,

    28,

    12

);


mainLight.castShadow =
    false;


scene.add(
    mainLight
);


/* =========================================================
   RED AMBIENT LIGHT
========================================================= */

const emergencyLight =

    new THREE.PointLight(

        0xff2922,

        42,

        28,

        1.9

    );


emergencyLight.position.set(

    0,

    9,

    0

);


emergencyLight.castShadow =
    false;


scene.add(
    emergencyLight
);


/* =========================================================
   PLAYER LIGHT
========================================================= */

const playerLight =

    new THREE.PointLight(

        0xbbeaff,

        3.8,

        5.5,

        2

    );


playerLight.castShadow =
    false;


scene.add(
    playerLight
);


/* =========================================================
   SCREEN HELPERS
========================================================= */

function hideMainScreens() {

    [

        mainMenu,

        briefingScreen,

        aboutScreen

    ].forEach(

        screen => {

            if (!screen) {
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


    loadingScreen?.classList.add(
        "hidden-screen"
    );


    inspectionUI?.classList.add(
        "hidden-interface"
    );


    if (!target) {
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

        pauseMenu.setCaptureHintVisible(

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
            GAME_STATE.PLAYING

            &&

            !cameraManager.isInputCaptured()
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


    cameraManager.requestPointerLock();

}


/* =========================================================
   STATIC ENVIRONMENT OPTIMIZATION
========================================================= */

function optimizeStaticEnvironment(
    environment
) {

    environment.updateMatrixWorld(
        true
    );


    let meshCount =
        0;


    environment.traverse(

        object => {

            /*
             * El escenario nunca se mueve.
             */
            object.matrixAutoUpdate =
                false;


            if (!object.isMesh) {
                return;
            }


            meshCount++;


            object.castShadow =
                false;


            object.receiveShadow =
                false;


            object.frustumCulled =
                true;


            if (
                object.geometry

                &&

                !object.geometry.boundingBox
            ) {

                object.geometry.computeBoundingBox();

            }


            if (
                object.geometry

                &&

                !object.geometry.boundingSphere
            ) {

                object.geometry.computeBoundingSphere();

            }


            const materials =

                Array.isArray(
                    object.material
                )

                    ?

                    object.material

                    :

                    [
                        object.material
                    ];


            for (
                const material
                of materials
            ) {

                if (!material) {
                    continue;
                }


                /*
                 * Reduce trabajo extra.
                 */
                material.dithering =
                    false;


                material.needsUpdate =
                    true;

            }

        }

    );


    environment.updateMatrixWorld(
        true
    );


    console.log(

        `[Performance] Static meshes optimized: ${meshCount}`

    );

}


/* =========================================================
   ZONE A
========================================================= */

async function enterZoneA() {

    currentState =
        GAME_STATE.LOADING;


    /*
     * Los efectos HTML/CSS del menú ya no son
     * necesarios durante gameplay.
     */
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


    loadingScreen?.classList.remove(
        "hidden-screen"
    );


    setLoading(

        0,

        "Estableciendo conexión con Nova Atlas..."

    );


    try {

        /* =================================================
           ENVIRONMENT
        ================================================= */

        const zoneA =

            await environmentManager.activateEnvironment(

                ENVIRONMENTS.ZONE_A,

                percent => {

                    const adjusted =

                        Math.round(

                            percent *
                            0.40

                        );


                    setLoading(

                        adjusted,

                        `Cargando Zona A · ${adjusted}%`

                    );

                }

            );


        /* =================================================
           FREEZE STATIC SCENE
        ================================================= */

        optimizeStaticEnvironment(
            zoneA
        );


        /* =================================================
           CAMERA COLLISION CACHE
        ================================================= */

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


        /* =================================================
           RAPIER ENVIRONMENT
        ================================================= */

        setLoading(

            56,

            "Generando colisiones..."

        );


        physicsManager.createEnvironmentColliders(
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


        /* =================================================
           PLAYER
        ================================================= */

        setLoading(

            69,

            "Cargando guardia..."

        );


        await playerController.load(
            playerSpawn
        );


        physicsManager.createCharacter(

            playerSpawn,

            playerController.getHeight()

        );


        /* =================================================
           WEAPON
        ================================================= */

        setLoading(

            77,

            "Equipando arma..."

        );


        await weaponManager.load();


        /* =================================================
           OBJECTS
        ================================================= */

        setLoading(

            84,

            "Desplegando objetos..."

        );


        objectManager.createZoneAObjects(

            zoneA,

            playerSpawn

        );


        weaponManager.setEnvironment(
            zoneA
        );


        /* =================================================
           ENEMY
        ================================================= */

        setLoading(

            90,

            "Analizando actividad biológica..."

        );


        await enemyManager.load();


        enemyManager.setEnvironment(
            zoneA
        );


        setLoading(

            95,

            "Actividad hostil detectada..."

        );


        enemyManager.spawnTestEnemy(
            playerSpawn.y
        );


        /* =================================================
           ENABLE
        ================================================= */

        playerController.setEnabled(
            true
        );


        cameraManager.setTarget(

            playerController.getObject(),

            true

        );


        cameraManager.enable();


        weaponManager.setEnabled(
            true
        );


        weaponManager.setViewMode(
            "TPS"
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

                loadingScreen?.classList.add(
                    "hidden-screen"
                );


                inspectionUI?.classList.remove(
                    "hidden-interface"
                );


                currentState =
                    GAME_STATE.PLAYING;


                pauseMenu.setCaptureHintVisible(
                    true
                );


                showNotification(

                    "ALERTA · ACTIVIDAD BIOLÓGICA DETECTADA"

                );

            },

            350

        );


        environmentManager.preloadEnvironment(

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


    /*
     * Este raycast se ejecuta UNA SOLA VEZ.
     */
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

            intersections[0].point.y

            +

            0.08

            +

            PLAYER_SPAWN_ZONE_A.heightOffset,

            spawnZ

        );

    }


    return new THREE.Vector3(

        spawnX,

        box.min.y +
        size.y * 0.55,

        spawnZ

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

    if (!notification) {
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


    const currentFPS =

        fpsFrames /
        fpsTimer;


    /*
     * Suavizado para que no parpadee:
     */
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
   ADAPTIVE RESOLUTION
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
                0.08

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
                0.04

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

    /* =====================================================
       PERFORMANCE MONITOR
    ====================================================== */

    updateFPSCounter(
        deltaTime
    );


    updateAdaptiveQuality(
        deltaTime
    );


    /* =====================================================
       GAMEPLAY
    ====================================================== */

    if (
        currentState ===
        GAME_STATE.PLAYING
    ) {

        cameraManager.getForwardDirection(
            cameraForward
        );


        cameraManager.getRightDirection(
            cameraRight
        );


        cameraManager.getAimDirection(
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
           ONLY UPDATE MODE WHEN IT CHANGES
        ================================================= */

        if (
            firstPerson !==
            cachedFirstPerson
        ) {

            playerController.setFirstPersonMode(
                firstPerson
            );


            cachedFirstPerson =
                firstPerson;

        }


        if (
            cameraMode !==
            cachedCameraMode
        ) {

            weaponManager.setViewMode(
                cameraMode
            );


            cachedCameraMode =
                cameraMode;

        }


        if (
            aiming !==
            cachedAiming
        ) {

            weaponManager.setAiming(
                aiming
            );


            cachedAiming =
                aiming;

        }


        /* =================================================
           PLAYER
        ================================================= */

        playerController.setAimState(

            firstPerson ||
            aiming,

            cameraAimDirection

        );


        playerController.update(

            deltaTime,

            cameraForward,

            cameraRight

        );


        /* =================================================
           PLAYER PHYSICS
        ================================================= */

        physicsManager.moveCharacter(

            playerController.getDesiredMovement(),

            deltaTime

        );


        physicsManager.step(
            deltaTime
        );


        physicsManager.syncCharacter(

            playerController.getObject()

        );


        /* =================================================
           DYNAMIC OBJECTS
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
           ENEMY
        ================================================= */

        enemyManager.update(
            deltaTime
        );


        /* =================================================
           WEAPON
        ================================================= */

        weaponManager.update(
            deltaTime
        );


        /* =================================================
           PLAYER LIGHT
        ================================================= */

        const playerPosition =

            playerController.getPosition();


        playerLight.position.set(

            playerPosition.x,

            playerPosition.y +
            1.8,

            playerPosition.z +
            0.7

        );


        /* =================================================
           DEBUG HUD - ONLY 5 TIMES / SEC
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
                        ? " · ADS"
                        : ""
                )

                +

                (
                    physicsManager.isGrounded()
                        ? " · GROUNDED"
                        : " · AIRBORNE"
                )

                +

                ` · HOSTILES ${enemyManager.getAliveCount()}`;

        }

    }


    /* =====================================================
       CHEAP BACKGROUND ANIMATION
    ====================================================== */

    stars.rotation.y +=

        deltaTime *
        0.00030;


    emergencyLight.intensity =

        40

        +

        Math.sin(

            elapsedTime *
            1.35

        ) *
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


animate();


console.log(
    "%cNOVA CATALYST",
    "color:#d72924;font-size:24px;font-weight:bold;"
);


console.log(
    "%cPerformance Build v0.8.4",
    "color:#8effa8;"
);
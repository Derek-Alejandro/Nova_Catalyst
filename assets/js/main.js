/* =========================================================
   NOVA CATALYST
   Project Nova
   Pre-Alpha v.01

   PERFORMANCE + LIGHTING BUILD v0.8.5

   - High performance renderer
   - FPS Counter
   - Adaptive resolution
   - Lightweight real shadows
   - Lightweight ambient lighting
   - Static environment optimization
   - Enemy system
   - Camera hard room limits
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


/* =========================================================
   LIGHTWEIGHT SHADOWS

   Solo una luz genera sombras.

   PCFShadowMap:
   buena relación calidad/rendimiento.

   768x768:
   mucho más ligero que 2048x2048.
========================================================= */

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


    const starField =

        new THREE.Points(

            geometry,

            material

        );


    starField.frustumCulled =
        false;


    scene.add(
        starField
    );


    return starField;

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


const enemyManager =

    new EnemyManager({

        scene,

        playerController,

        camera,

        physicsManager,

        objectManager

    });


cameraManager.setADSAnchorProvider(

    () => {

        return weaponManager
            .getADSAnchor();

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

   Combinación ligera:
   - Ambient
   - Hemisphere
   - 1 Directional con sombra
   - 1 Point rojo sin sombra
   - 1 pequeña luz del jugador
========================================================= */


/* =========================================================
   AMBIENT
========================================================= */

const ambientLight =

    new THREE.AmbientLight(

        0xb9c8d2,

        0.82

    );


scene.add(
    ambientLight
);


/* =========================================================
   HEMISPHERE
========================================================= */

const hemisphereLight =

    new THREE.HemisphereLight(

        0xd9efff,

        0x11151b,

        1.25

    );


scene.add(
    hemisphereLight
);


/* =========================================================
   MAIN DIRECTIONAL + SHADOW
========================================================= */

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


/*
 * Única sombra de la escena.
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


/* =========================================================
   EMERGENCY RED LIGHT

   No genera sombra.
========================================================= */

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


/* =========================================================
   PLAYER FILL
========================================================= */

const playerLight =

    new THREE.PointLight(

        0xc6ecff,

        3.5,

        5.0,

        2

    );


playerLight.castShadow =
    false;


scene.add(
    playerLight
);


/* =========================================================
   SHADOW HELPERS
========================================================= */

function configureDynamicShadowCaster(
    root
) {

    if (!root) {
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


            /*
             * El propio personaje no necesita
             * recibir su sombra.
             */
            object.receiveShadow =
                false;

        }

    );

}


/* =========================================================
   DYNAMIC OBJECT SHADOWS
========================================================= */

function configureDynamicObjectShadows() {

    if (
        !objectManager.getDynamicObjects
    ) {
        return;
    }


    const objects =

        objectManager.getDynamicObjects();


    for (
        const object
        of objects
    ) {

        const mesh =
            object.mesh;


        if (!mesh) {
            continue;
        }


        mesh.traverse(

            child => {

                if (
                    !child.isMesh
                ) {
                    return;
                }


                child.castShadow =
                    true;


                child.receiveShadow =
                    true;

            }

        );

    }

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


    let count =
        0;


    environment.traverse(

        object => {

            /*
             * El escenario es estático.
             */
            object.matrixAutoUpdate =
                false;


            if (
                !object.isMesh
            ) {
                return;
            }


            count++;


            /*
             * El escenario NO genera shadow map.
             *
             * Esto ahorra muchísimo.
             */
            object.castShadow =
                false;


            /*
             * Pero sí recibe sombras del personaje,
             * enemigos y props.
             */
            object.receiveShadow =
                true;


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

        }

    );


    environment.updateMatrixWorld(
        true
    );


    console.log(

        `[Performance] Static environment optimized: ${count} meshes`

    );

}


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

    currentState =
        GAME_STATE.LOADING;


    if (
        backgroundEffects
    ) {

        backgroundEffects.classList.add(
            "gameplay-mode"
        );


        /*
         * El fondo HTML ya no necesita seguir
         * renderizando durante gameplay.
         */
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


        /* =================================================
           STATIC OPTIMIZATION
        ================================================= */

        optimizeStaticEnvironment(
            zoneA
        );


        /* =================================================
           CAMERA COLLISION
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


        setLoading(

            56,

            "Generando colisiones..."

        );


        physicsManager.createEnvironmentColliders(
            zoneA
        );


        /* =================================================
           SPAWN
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


        /*
         * El jugador sí proyecta sombra.
         */
        configureDynamicShadowCaster(

            playerController.getObject()

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


        configureDynamicObjectShadows();


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


        const testEnemy =

            enemyManager.spawnTestEnemy(

                playerSpawn.y

            );


        /*
         * El enemigo también proyecta sombra.
         */
        if (
            testEnemy

            &&

            testEnemy.getModel
        ) {

            configureDynamicShadowCaster(

                testEnemy.getModel()

            );

        }


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


        /* =================================================
           BOSS PRELOAD
        ================================================= */

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
     * Solo se ejecuta una vez.
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
        size.y *
        0.55,

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


    if (
        currentState ===
        GAME_STATE.PLAYING
    ) {

        /* =================================================
           CAMERA DIRECTIONS
        ================================================= */

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
           VIEW MODE
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
           RAPIER
        ================================================= */

        physicsManager.moveCharacter(

            playerController.getDesiredMovement(),

            deltaTime

        );


        /*
         * Un solo step de Rapier por frame.
         */
        physicsManager.step(
            deltaTime
        );


        physicsManager.syncCharacter(

            playerController.getObject()

        );


        /* =================================================
           OBJECTS
        ================================================= */

        objectManager.update();


        /* =================================================
           PLAYER MATRIX
        ================================================= */

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
            0.65

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
       BACKGROUND
    ====================================================== */

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


animate();


/* =========================================================
   CONSOLE
========================================================= */

console.log(

    "%cNOVA CATALYST",

    "color:#d72924;font-size:24px;font-weight:bold;"

);


console.log(

    "%cPerformance + Lighting Build v0.8.5",

    "color:#8effa8;"

);
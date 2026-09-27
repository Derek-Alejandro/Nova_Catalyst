/* =========================================================
   NOVA CATALYST
   Project Nova

   Pre-Alpha v.01
   Build v0.6.7

   - Real Sci-fi Handgun
   - Strict RightHand
   - TPS Shoulder Aim
   - Full-body FPS
   - Physical weapon ADS
   - Rapier physics
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

    PauseMenu

} from "./pause.js";


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

        0.02,

        5000

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
            true,

        powerPreference:
            "high-performance"

    });


renderer.setPixelRatio(

    Math.min(

        window.devicePixelRatio,

        2

    )

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
    1.38;


renderer.shadowMap.enabled =
    true;


renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


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
                false,

            sizeAttenuation:
                true

        });


    const field =

        new THREE.Points(

            geometry,

            material

        );


    scene.add(

        field

    );


    return field;

}


const stars =

    createStarField(

        1800,

        350,

        0.14,

        0xdde9ef,

        0.72

    );


const distantStars =

    createStarField(

        900,

        500,

        0.07,

        0x82949d,

        0.38

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
   ADS LINK

   CameraManager puede consultar la posición real
   de las miras de la pistola.
========================================================= */

cameraManager
    .setADSAnchorProvider(

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
   TEMP
========================================================= */

const cameraForward =
    new THREE.Vector3();


const cameraRight =
    new THREE.Vector3();


const cameraAimDirection =
    new THREE.Vector3();


/* =========================================================
   LIGHTING
========================================================= */

const ambientLight =

    new THREE.AmbientLight(

        0xc9d8df,

        0.95

    );


scene.add(

    ambientLight

);


const hemisphereLight =

    new THREE.HemisphereLight(

        0xd8efff,

        0x111419,

        1.65

    );


scene.add(

    hemisphereLight

);


/* =========================================================
   MAIN DIRECTIONAL
========================================================= */

const directionalLight =

    new THREE.DirectionalLight(

        0xeef9ff,

        5

    );


directionalLight.position.set(

    22,

    38,

    18

);


directionalLight.castShadow =
    true;


directionalLight.shadow
    .mapSize
    .set(

        2048,

        2048

    );


directionalLight.shadow.camera.left =
    -50;


directionalLight.shadow.camera.right =
    50;


directionalLight.shadow.camera.top =
    50;


directionalLight.shadow.camera.bottom =
    -50;


directionalLight.shadow.camera.near =
    0.1;


directionalLight.shadow.camera.far =
    180;


directionalLight.shadow.bias =
    -0.00025;


directionalLight.shadow.normalBias =
    0.025;


directionalLight.shadow.radius =
    3;


scene.add(

    directionalLight

);


/* =========================================================
   SECONDARY LIGHT
========================================================= */

const secondaryDirectional =

    new THREE.DirectionalLight(

        0x7299ad,

        1.65

    );


secondaryDirectional.position.set(

    -24,

    24,

    -18

);


scene.add(

    secondaryDirectional

);


/* =========================================================
   EMERGENCY LIGHTS
========================================================= */

const emergencyLightA =

    new THREE.PointLight(

        0xff251d,

        85,

        38,

        1.7

    );


emergencyLightA.position.set(

    16,

    14,

    0

);


scene.add(

    emergencyLightA

);


const emergencyLightB =

    new THREE.PointLight(

        0xff3024,

        65,

        34,

        1.7

    );


emergencyLightB.position.set(

    -16,

    14,

    0

);


scene.add(

    emergencyLightB

);


/* =========================================================
   COLD LIGHTS
========================================================= */

const coldLightA =

    new THREE.PointLight(

        0xa8e6ff,

        78,

        40,

        1.8

    );


coldLightA.position.set(

    0,

    18,

    16

);


scene.add(

    coldLightA

);


const coldLightB =

    new THREE.PointLight(

        0x71b9db,

        68,

        38,

        1.8

    );


coldLightB.position.set(

    0,

    17,

    -16

);


scene.add(

    coldLightB

);


/* =========================================================
   PLAYER FILL
========================================================= */

const playerFillLight =

    new THREE.PointLight(

        0xcceeff,

        7,

        7,

        2

    );


playerFillLight.castShadow =
    false;


scene.add(

    playerFillLight

);


/* =========================================================
   PLAYER SHADOW
========================================================= */

const playerShadowLight =

    new THREE.SpotLight(

        0xf4fbff,

        95,

        10,

        Math.PI / 4,

        0.28,

        1.25

    );


playerShadowLight.castShadow =
    true;


playerShadowLight.visible =
    false;


playerShadowLight.shadow
    .mapSize
    .set(

        2048,

        2048

    );


playerShadowLight.shadow.camera.near =
    0.1;


playerShadowLight.shadow.camera.far =
    12;


playerShadowLight.shadow.bias =
    -0.00015;


playerShadowLight.shadow.normalBias =
    0.015;


playerShadowLight.shadow.radius =
    2;


scene.add(

    playerShadowLight

);


scene.add(

    playerShadowLight.target

);


/* =========================================================
   SCREEN MANAGEMENT
========================================================= */

function hideMainScreens() {

    [

        mainMenu,

        briefingScreen,

        aboutScreen

    ].forEach(

        screen => {

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


    loadingScreen.classList.add(

        "hidden-screen"

    );


    inspectionUI.classList.add(

        "hidden-interface"

    );


    target.classList.remove(

        "hidden-screen"

    );


    target.classList.add(

        "screen-visible"

    );

}


/* =========================================================
   MENU EVENTS
========================================================= */

btnEnter.addEventListener(

    "click",

    () => {

        currentState =
            GAME_STATE.BRIEFING;


        showScreen(

            briefingScreen

        );

    }

);


btnAbout.addEventListener(

    "click",

    () => {

        currentState =
            GAME_STATE.ABOUT;


        showScreen(

            aboutScreen

        );

    }

);


btnBackBriefing.addEventListener(

    "click",

    () => {

        currentState =
            GAME_STATE.MENU;


        showScreen(

            mainMenu

        );

    }

);


btnBackAbout.addEventListener(

    "click",

    () => {

        currentState =
            GAME_STATE.MENU;


        showScreen(

            mainMenu

        );

    }

);


btnSurvive.addEventListener(

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
   ESC FALLBACK
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


    playerController
        .setEnabled(
            false
        );


    cameraManager
        .setPaused(
            true
        );


    weaponManager
        .setPaused(
            true
        );


    pauseMenu
        .setCaptureHintVisible(
            false
        );


    pauseMenu
        .setVisible(
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


    playerController
        .setEnabled(
            true
        );


    cameraManager
        .setPaused(
            false
        );


    weaponManager
        .setPaused(
            false
        );


    cameraManager
        .requestPointerLock();

}


/* =========================================================
   ENTER ZONE A
========================================================= */

async function enterZoneA() {

    currentState =
        GAME_STATE.LOADING;


    backgroundEffects.classList.add(

        "gameplay-mode"

    );


    hideMainScreens();


    loadingScreen.classList.remove(

        "hidden-screen"

    );


    loadingProgress.style.width =
        "0%";


    loadingText.textContent =

        "Estableciendo conexión con Nova Atlas...";


    try {

        /* =================================================
           ENVIRONMENT
        ================================================= */

        const zoneA =

            await environmentManager
                .activateEnvironment(

                    ENVIRONMENTS.ZONE_A,

                    percent => {

                        const adjusted =

                            Math.round(

                                percent *
                                0.40

                            );


                        loadingProgress
                            .style
                            .width =

                            `${adjusted}%`;


                        loadingText.textContent =

                            `Cargando Zona A · ${adjusted}%`;

                    }

                );


        /* =================================================
           PHYSICS
        ================================================= */

        loadingProgress.style.width =
            "48%";


        loadingText.textContent =

            "Inicializando sistema físico...";


        await physicsManager.init();


        loadingProgress.style.width =
            "57%";


        loadingText.textContent =

            "Generando colisiones de Nova Atlas...";


        physicsManager
            .createEnvironmentColliders(

                zoneA

            );


        /* =================================================
           SPAWN
        ================================================= */

        loadingProgress.style.width =
            "64%";


        const playerSpawn =

            calculateZoneASpawn(

                zoneA

            );


        /* =================================================
           PLAYER
        ================================================= */

        loadingProgress.style.width =
            "70%";


        loadingText.textContent =

            "Cargando guardia de seguridad...";


        await playerController.load(

            playerSpawn

        );


        physicsManager
            .createCharacter(

                playerSpawn,

                playerController
                    .getHeight()

            );


        /* =================================================
           WEAPON
        ================================================= */

        loadingProgress.style.width =
            "79%";


        loadingText.textContent =

            "Equipando Sci-fi Handgun...";


        await weaponManager.load();


        /* =================================================
           OBJECTS
        ================================================= */

        loadingProgress.style.width =
            "87%";


        loadingText.textContent =

            "Desplegando utilería física...";


        objectManager
            .createZoneAObjects(

                zoneA,

                playerSpawn

            );


        weaponManager
            .setEnvironment(

                zoneA

            );


        /* =================================================
           ENABLE
        ================================================= */

        playerController
            .setEnabled(
                true
            );


        cameraManager
            .setTarget(

                playerController
                    .getObject(),

                true

            );


        cameraManager.enable();


        weaponManager
            .setEnabled(
                true
            );


        weaponManager
            .setViewMode(
                "TPS"
            );


        playerShadowLight.visible =
            true;


        /* =================================================
           READY
        ================================================= */

        loadingProgress.style.width =
            "100%";


        loadingText.textContent =
            "Nova Atlas preparada";


        setTimeout(

            () => {

                loadingScreen.classList.add(

                    "hidden-screen"

                );


                inspectionUI.classList.remove(

                    "hidden-interface"

                );


                currentState =
                    GAME_STATE.PLAYING;


                pauseMenu
                    .setCaptureHintVisible(
                        true
                    );


                showNotification(

                    "SCI-FI HANDGUN · ONLINE"

                );

            },

            450

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

            "❌ Error iniciando Zona A:",

            error

        );


        loadingText.textContent =
            "ERROR AL INICIAR ZONA A";


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


    const intersections =

        raycaster.intersectObjects(

            meshes,

            true

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

            3200

        );

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


        renderer.setSize(

            window.innerWidth,

            window.innerHeight

        );


        renderer.setPixelRatio(

            Math.min(

                window.devicePixelRatio,

                2

            )

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

            cameraManager
                .getMode();


        /* =================================================
           CHARACTER MODE
        ================================================= */

        playerController
            .setFirstPersonMode(

                cameraMode ===
                "FPS"

            );


        const combatAim =

            cameraMode ===
            "FPS"

            ||

            cameraManager
                .isAiming();


        playerController
            .setAimState(

                combatAim,

                cameraAimDirection

            );


        weaponManager
            .setViewMode(

                cameraMode

            );


        weaponManager
            .setAiming(

                cameraManager
                    .isAiming()

            );


        /* =================================================
           ANIMATION
        ================================================= */

        playerController.update(

            deltaTime,

            cameraForward,

            cameraRight

        );


        /* =================================================
           PHYSICS
        ================================================= */

        physicsManager
            .moveCharacter(

                playerController
                    .getDesiredMovement(),

                deltaTime

            );


        physicsManager.step(

            deltaTime

        );


        physicsManager
            .syncCharacter(

                playerController
                    .getObject()

            );


        objectManager.update();


        /* =================================================
           SKELETON MATRICES
        ================================================= */

        playerController
            .getObject()
            .updateMatrixWorld(

                true

            );


        /* =================================================
           WEAPON

           Primero sincronizamos el arma con RightHand.

           De este modo la cámara ADS tiene un punto
           de mira actualizado.
        ================================================= */

        weaponManager.update(

            deltaTime

        );


        /* =================================================
           CAMERA

           Después usamos el rear sight actualizado.
        ================================================= */

        cameraManager.update(

            deltaTime

        );


        /* =================================================
           LIGHTING
        ================================================= */

        const playerPosition =

            playerController
                .getPosition();


        playerFillLight.position.set(

            playerPosition.x,

            playerPosition.y +
            2.1,

            playerPosition.z +
            1.2

        );


        playerShadowLight.position.set(

            playerPosition.x +
            2.2,

            playerPosition.y +
            2.8,

            playerPosition.z +
            1.8

        );


        playerShadowLight
            .target
            .position
            .set(

                playerPosition.x,

                playerPosition.y +
                0.05,

                playerPosition.z

            );


        playerShadowLight
            .target
            .updateMatrixWorld(

                true

            );


        /* =================================================
           DEBUG
        ================================================= */

        spawnDebug.textContent =

            `${cameraMode}`

            +

            (
                cameraManager
                    .isAiming()

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
            );

    }


    /* =====================================================
       BACKGROUND
    ====================================================== */

    stars.rotation.y +=

        deltaTime *
        0.0007;


    distantStars.rotation.y -=

        deltaTime *
        0.00035;


    emergencyLightA.intensity =

        78

        +

        Math.sin(

            elapsedTime *
            1.65

        )

        *
        12;


    emergencyLightB.intensity =

        58

        +

        Math.sin(

            elapsedTime *
            1.2 +
            1

        )

        *
        10;

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

            0.1

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

    "%cPre-Alpha v.01 · Build v0.6.7",

    "color:#b8c0c2;"

);


console.log(

    "%cRightHand Weapon Mount · ONLINE",

    "color:#55ff99;"

);


console.log(

    "%cPhysical Iron Sight ADS · ONLINE",

    "color:#55ff99;"

);
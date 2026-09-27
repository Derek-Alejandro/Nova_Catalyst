/* =========================================================
   NOVA CATALYST
   Project Nova

   Pre-Alpha v.01
   Build v0.4

   PLAYER + PHYSICS + TPS + DYNAMIC SHADOWS
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



/* =========================================================
   ESTADOS DEL JUEGO
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
        "playing"

};


let currentState =
    GAME_STATE.MENU;



/* =========================================================
   SPAWN DEFINITIVO - ZONA A

   Calibrado manualmente sobre el piso real
   del anillo exterior de Nova Atlas.
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
   ELEMENTOS HTML
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
   ESCENA
========================================================= */

const scene =
    new THREE.Scene();


scene.background =

    new THREE.Color(
        0x010204
    );



/* =========================================================
   CÁMARA
========================================================= */

const camera =

    new THREE.PerspectiveCamera(

        60,

        window.innerWidth /
        window.innerHeight,

        0.05,

        5000

    );


camera.position.set(

    0,

    2,

    8

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


/*
 * Exposición suficientemente clara
 * para el escenario sin borrar las sombras.
 */

renderer.toneMappingExposure =
    1.38;


/* =========================================================
   SOMBRAS
========================================================= */

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
   RELOJ
========================================================= */

const clock =
    new THREE.Clock();



/* =========================================================
   CAMPO DE ESTRELLAS
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

            * radius;


        positions[index + 1] =

            (
                Math.random() -
                0.5
            )

            * radius;


        positions[index + 2] =

            (
                Math.random() -
                0.5
            )

            * radius;

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


    const starField =

        new THREE.Points(

            geometry,

            material

        );


    scene.add(
        starField
    );


    return starField;

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
   SISTEMAS
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



/* =========================================================
   VECTORES TEMPORALES
========================================================= */

const cameraForward =
    new THREE.Vector3();


const cameraRight =
    new THREE.Vector3();



/* =========================================================
   ILUMINACIÓN AMBIENTAL

   Reducida respecto a la versión anterior
   para que las sombras puedan apreciarse.
========================================================= */

const ambientLight =

    new THREE.AmbientLight(

        0xc9d8df,

        0.95

    );


scene.add(
    ambientLight
);



/* =========================================================
   LUZ HEMISFÉRICA

   También reducida ligeramente para mejorar
   el contraste general.
========================================================= */

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
   LUZ DIRECCIONAL PRINCIPAL
========================================================= */

const directionalLight =

    new THREE.DirectionalLight(

        0xeef9ff,

        5.0

    );


directionalLight.position.set(

    22,

    38,

    18

);


directionalLight.castShadow =
    true;


directionalLight.shadow.mapSize.set(

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
   LUZ DIRECCIONAL SECUNDARIA

   Aporta iluminación al lado opuesto
   sin generar sombras adicionales.
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
   LUCES ROJAS DE EMERGENCIA
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
   LUCES FRÍAS
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
   LUZ DE RELLENO DEL JUGADOR

   Solo ayuda a distinguir el personaje.

   No genera sombras para evitar duplicarlas.
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
   LUZ DE SOMBRA DEL JUGADOR

   Esta SpotLight se mantiene dentro del pasillo
   y sigue al personaje.

   Su objetivo principal es generar una sombra
   dinámica visible en el piso.
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


/* =========================================================
   CALIDAD DE SOMBRA
========================================================= */

playerShadowLight.shadow.mapSize.set(

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


playerShadowLight.penumbra =
    0.25;


scene.add(
    playerShadowLight
);


/*
 * El target de SpotLight debe pertenecer
 * a la escena para actualizar correctamente.
 */

scene.add(
    playerShadowLight.target
);



/* =========================================================
   GESTIÓN DE PANTALLAS
========================================================= */

function hideMainScreens() {

    [

        mainMenu,

        briefingScreen,

        aboutScreen

    ].forEach(

        screen => {

            screen
                .classList
                .remove(
                    "screen-visible"
                );


            screen
                .classList
                .add(
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
        .classList
        .add(
            "hidden-screen"
        );


    inspectionUI
        .classList
        .add(
            "hidden-interface"
        );


    target
        .classList
        .remove(
            "hidden-screen"
        );


    target
        .classList
        .add(
            "screen-visible"
        );

}



/* =========================================================
   BOTÓN ENTRAR
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



/* =========================================================
   BOTÓN ACERCA DE
========================================================= */

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



/* =========================================================
   VOLVER DESDE BRIEFING
========================================================= */

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



/* =========================================================
   VOLVER DESDE ABOUT
========================================================= */

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



/* =========================================================
   SOBREVIVIR
========================================================= */

btnSurvive.addEventListener(

    "click",

    async () => {

        await enterZoneA();

    }

);



/* =========================================================
   ENTRAR A ZONA A
========================================================= */

async function enterZoneA() {

    currentState =
        GAME_STATE.LOADING;


    backgroundEffects
        .classList
        .add(
            "gameplay-mode"
        );


    hideMainScreens();


    loadingScreen
        .classList
        .remove(
            "hidden-screen"
        );


    loadingProgress.style.width =
        "0%";


    loadingText.textContent =
        "Estableciendo conexión con Nova Atlas...";


    try {

        /* =================================================
           CARGAR ESCENARIO
        ================================================= */

        const zoneA =

            await environmentManager
                .activateEnvironment(

                    ENVIRONMENTS.ZONE_A,

                    percent => {

                        const adjusted =

                            Math.round(

                                percent *
                                0.55

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
           RAPIER
        ================================================= */

        loadingProgress.style.width =
            "62%";


        loadingText.textContent =
            "Inicializando sistema físico...";


        await physicsManager.init();



        /* =================================================
           COLLIDERS
        ================================================= */

        loadingProgress.style.width =
            "70%";


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
            "78%";


        loadingText.textContent =
            "Localizando punto de inserción...";


        const playerSpawn =

            calculateZoneASpawn(
                zoneA
            );


        console.log(

            "[Nova] Spawn del jugador:",

            playerSpawn

        );



        /* =================================================
           CARGAR JUGADOR
        ================================================= */

        loadingProgress.style.width =
            "84%";


        loadingText.textContent =
            "Cargando guardia de seguridad...";


        await playerController.load(

            playerSpawn

        );



        /* =================================================
           CÁPSULA RAPIER DEL JUGADOR
        ================================================= */

        physicsManager
            .createCharacter(

                playerSpawn,

                playerController
                    .getHeight()

            );


        playerController.setEnabled(
            true
        );



        /* =================================================
           CÁMARA TPS
        ================================================= */

        cameraManager.setTarget(

            playerController
                .getObject(),

            true

        );


        cameraManager.enable();



        /* =================================================
           ACTIVAR SOMBRA DEL JUGADOR
        ================================================= */

        playerShadowLight.visible =
            true;



        /* =================================================
           FINALIZAR CARGA
        ================================================= */

        spawnDebug.textContent =
            "JUGADOR · RAPIER ACTIVO";


        loadingProgress.style.width =
            "100%";


        loadingText.textContent =
            "Nova Atlas preparada";



        setTimeout(

            () => {

                loadingScreen
                    .classList
                    .add(
                        "hidden-screen"
                    );


                inspectionUI
                    .classList
                    .remove(
                        "hidden-interface"
                    );


                currentState =
                    GAME_STATE.PLAYING;


                showNotification(

                    "NOVA ATLAS · SISTEMAS ONLINE"

                );

            },

            450

        );



        /* =================================================
           PRECARGAR BOSS ARENA
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


        loadingText.textContent =
            "ERROR AL INICIAR ZONA A";


        showNotification(

            "ERROR · REVISA F12"

        );

    }

}



/* =========================================================
   CALCULAR SPAWN

   Conserva exactamente el sistema calibrado
   durante las versiones anteriores.
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



    /* =====================================================
       RAYCASTER
    ====================================================== */

    const raycaster =

        new THREE.Raycaster(

            new THREE.Vector3(

                spawnX,

                box.max.y + 10,

                spawnZ

            ),

            new THREE.Vector3(

                0,

                -1,

                0

            )

        );



    const environmentMeshes =
        [];


    environment.traverse(

        object => {

            if (

                object.isMesh &&

                object.visible

            ) {

                environmentMeshes.push(
                    object
                );

            }

        }

    );



    const intersections =

        raycaster.intersectObjects(

            environmentMeshes,

            true

        );



    /* =====================================================
       SUPERFICIE ENCONTRADA
    ====================================================== */

    if (
        intersections.length > 0
    ) {

        const hit =
            intersections[0];


        const spawnY =

            hit.point.y +

            0.08 +

            PLAYER_SPAWN_ZONE_A
                .heightOffset;


        return new THREE.Vector3(

            spawnX,

            spawnY,

            spawnZ

        );

    }



    /* =====================================================
       FALLBACK
    ====================================================== */

    console.warn(

        "[Nova] No se encontró superficie de spawn. Fallback activo."

    );


    return new THREE.Vector3(

        spawnX,

        box.min.y +

        size.y *
        0.55,

        spawnZ

    );

}



/* =========================================================
   NOTIFICACIONES
========================================================= */

let notificationTimeout =
    null;


function showNotification(
    text
) {

    notification.textContent =
        text;


    notification
        .classList
        .add(
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

            3200

        );

}



/* =========================================================
   RESPONSIVE
========================================================= */

function handleResize() {

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
       GAMEPLAY
    ====================================================== */

    if (

        currentState ===
        GAME_STATE.PLAYING

    ) {

        /* =================================================
           DIRECCIONES DE CÁMARA
        ================================================= */

        cameraManager
            .getForwardDirection(

                cameraForward

            );


        cameraManager
            .getRightDirection(

                cameraRight

            );



        /* =================================================
           JUGADOR

           Input + animaciones.
        ================================================= */

        playerController.update(

            deltaTime,

            cameraForward,

            cameraRight

        );



        /* =================================================
           FÍSICA RAPIER
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



        /* =================================================
           CÁMARA TPS
        ================================================= */

        cameraManager.update(
            deltaTime
        );



        /* =================================================
           POSICIÓN ACTUAL DEL JUGADOR
        ================================================= */

        const playerPosition =

            playerController
                .getPosition();



        /* =================================================
           PLAYER FILL LIGHT

           Luz pequeña que ayuda a leer el modelo.
        ================================================= */

        playerFillLight.position.set(

            playerPosition.x,

            playerPosition.y +
            2.1,

            playerPosition.z +
            1.2

        );



        /* =================================================
           PLAYER SHADOW LIGHT

           Está deliberadamente desplazada para
           que la sombra sea visible junto al jugador.

           La colocamos dentro del pasillo,
           no por encima de todo el escenario.
        ================================================= */

        playerShadowLight.position.set(

            playerPosition.x +
            2.2,

            playerPosition.y +
            2.8,

            playerPosition.z +
            1.8

        );



        /*
         * La luz apunta cerca de los pies.
         */

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
           DEBUG RAPIER
        ================================================= */

        spawnDebug.textContent =

            physicsManager.isGrounded()

                ?

                "JUGADOR · RAPIER · GROUNDED"

                :

                "JUGADOR · RAPIER · AIRBORNE";

    }



    /* =====================================================
       ESTRELLAS
    ====================================================== */

    stars.rotation.y +=

        deltaTime *
        0.0007;


    distantStars.rotation.y -=

        deltaTime *
        0.00035;



    /* =====================================================
       LUCES DE EMERGENCIA

       Mantienen una ligera variación dinámica.
    ====================================================== */

    emergencyLightA.intensity =

        78 +

        Math.sin(

            elapsedTime *
            1.65

        )

        * 12;


    emergencyLightB.intensity =

        58 +

        Math.sin(

            elapsedTime *
            1.2 +
            1

        )

        * 10;

}



/* =========================================================
   GAME LOOP
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


    const elapsedTime =
        clock.elapsedTime;


    update(

        deltaTime,

        elapsedTime

    );


    renderer.render(

        scene,

        camera

    );

}


animate();



/* =========================================================
   CONSOLA
========================================================= */

console.log(

    "%cNOVA CATALYST",

    "color:#d72924;font-size:24px;font-weight:bold;"

);


console.log(

    "%cPre-Alpha v.01 · Build v0.4",

    "color:#b8c0c2;"

);


console.log(

    "%cRapier Physics · ONLINE",

    "color:#55ff99;"

);


console.log(

    "%cDynamic Layered Animations · ONLINE",

    "color:#55ff99;"

);


console.log(

    "%cCharacter Shadow System · ONLINE",

    "color:#55ff99;"

);
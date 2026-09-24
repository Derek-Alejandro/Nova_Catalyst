/* =========================================================
   NOVA CATALYST
   Project Nova

   Pre-Alpha v.01
   Build v0.2

   Escenario y cámara
========================================================= */

import * as THREE from "three";


import {

    EnvironmentManager,

    ENVIRONMENTS

} from "./environment.js";


import {

    CameraManager

} from "./camera.js";


/* =========================================================
   ESTADO GENERAL
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

    INSPECTION:
        "inspection"

};


let currentState =
    GAME_STATE.MENU;


/* =========================================================
   HTML
========================================================= */

const gameContainer =
    document.getElementById(
        "game-container"
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


const notification =
    document.getElementById(
        "notification"
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

        0.1,

        5000

    );


camera.position.set(
    0,
    4,
    10
);


/* =========================================================
   RENDERER
========================================================= */

const renderer =
    new THREE.WebGLRenderer({

        antialias: true,

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
    1;


renderer.shadowMap.enabled =
    true;


renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


gameContainer.appendChild(
    renderer.domElement
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


/* =========================================================
   LUCES
========================================================= */

const hemisphereLight =
    new THREE.HemisphereLight(

        0x8ca9b5,

        0x08090c,

        1.2

    );


scene.add(
    hemisphereLight
);


const directionalLight =
    new THREE.DirectionalLight(

        0xffffff,

        2.5

    );


directionalLight.position.set(
    15,
    25,
    10
);


directionalLight.castShadow =
    true;


directionalLight.shadow.mapSize.set(
    2048,
    2048
);


scene.add(
    directionalLight
);


/* =========================================================
   LUCES DE EMERGENCIA
========================================================= */

const emergencyLightA =
    new THREE.PointLight(

        0xff241f,

        8,

        80,

        2

    );


emergencyLightA.position.set(
    15,
    10,
    0
);


scene.add(
    emergencyLightA
);


const emergencyLightB =
    new THREE.PointLight(

        0x245b7a,

        7,

        80,

        2

    );


emergencyLightB.position.set(
    -15,
    8,
    5
);


scene.add(
    emergencyLightB
);


/* =========================================================
   RELOJ
========================================================= */

const clock =
    new THREE.Clock();


/* =========================================================
   PANTALLAS
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
   EVENTOS MENÚ
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


    hideMainScreens();


    loadingScreen.classList.remove(
        "hidden-screen"
    );


    loadingProgress.style.width =
        "0%";


    loadingText.textContent =
        "Estableciendo conexión con Nova Atlas...";


    try {

        const zoneA =

            await environmentManager
                .activateEnvironment(

                    ENVIRONMENTS.ZONE_A,

                    (percent) => {

                        loadingProgress
                            .style
                            .width =
                            `${percent}%`;


                        loadingText.textContent =

                            `Cargando Zona A · ${percent}%`;

                    }

                );


        loadingProgress.style.width =
            "100%";


        loadingText.textContent =
            "Zona A preparada";


        /*
         * Ajustar la cámara automáticamente.
         */

        cameraManager.focusEnvironment(
            zoneA
        );


        cameraManager.enable();


        /*
         * Ocultar menú después
         * de un pequeño retraso.
         */

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
                    GAME_STATE.INSPECTION;

            },

            450

        );


        /*
         * Mientras inspeccionamos Zona A,
         * comenzamos a cargar en segundo plano
         * la arena del jefe.
         */

        environmentManager
            .preloadEnvironment(
                ENVIRONMENTS.BOSS_ARENA
            );

    }

    catch (
        error
    ) {

        console.error(

            "No se pudo cargar Nova Atlas Zona A:",

            error

        );


        loadingText.textContent =
            "ERROR AL CARGAR ZONA A";


        showNotification(

            "NO SE PUDO CARGAR EL ESCENARIO · REVISA F12"

        );

    }

}


/* =========================================================
   NOTIFICACIÓN
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
   RESIZE
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

    cameraManager.update();


    /*
     * Pulsación muy ligera
     * de iluminación de emergencia.
     */

    emergencyLightA.intensity =

        7.5 +

        Math.sin(
            elapsedTime * 1.6
        )

        * 1.2;

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

    "%cBuild v0.2 · Environment System",

    "color:#64d78f;"

);
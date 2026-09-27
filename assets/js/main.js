/* =========================================================
   NOVA CATALYST
   Project Nova

   Pre-Alpha v.01
   Build v0.2

   ESCENARIO Y CÁMARA
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

    INSPECTION:
        "inspection"

};


let currentState =
    GAME_STATE.MENU;



/* =========================================================
   SPAWN OFICIAL - ZONA A

   Punto de aparición calibrado manualmente
   sobre la zona jugable del anillo exterior.

   El eje Y continúa obteniéndose mediante
   Raycaster y posteriormente se aplica el
   ajuste vertical indicado.
========================================================= */

const PLAYER_SPAWN_ZONE_A = {

    x: 16.0,

    z: 0,

    heightOffset: -4.2

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
   ESCENA THREE.JS
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

    0,

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


renderer.toneMappingExposure =
    1.25;


renderer.shadowMap.enabled =
    true;


renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;


gameContainer.appendChild(

    renderer.domElement

);



/* =========================================================
   RELOJ
========================================================= */

const clock =
    new THREE.Clock();



/* =========================================================
   ESTRELLAS
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

        const i3 =
            i * 3;


        positions[i3] =

            (
                Math.random() -
                0.5
            )

            * radius;


        positions[i3 + 1] =

            (
                Math.random() -
                0.5
            )

            * radius;


        positions[i3 + 2] =

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


    const points =

        new THREE.Points(

            geometry,

            material

        );


    scene.add(
        points
    );


    return points;

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
   ILUMINACIÓN AMBIENTAL
========================================================= */

const ambientLight =

    new THREE.AmbientLight(

        0xb8c8d2,

        1.15

    );


scene.add(
    ambientLight
);



/* =========================================================
   LUZ HEMISFÉRICA
========================================================= */

const hemisphereLight =

    new THREE.HemisphereLight(

        0xcce5f2,

        0x101217,

        2.1

    );


scene.add(
    hemisphereLight
);



/* =========================================================
   LUZ PRINCIPAL
========================================================= */

const directionalLight =

    new THREE.DirectionalLight(

        0xe9f5ff,

        4.0

    );


directionalLight.position.set(

    20,

    35,

    15

);


directionalLight.castShadow =
    true;


directionalLight.shadow.mapSize.set(

    2048,

    2048

);


directionalLight.shadow.camera.left =
    -45;


directionalLight.shadow.camera.right =
    45;


directionalLight.shadow.camera.top =
    45;


directionalLight.shadow.camera.bottom =
    -45;


directionalLight.shadow.camera.near =
    0.1;


directionalLight.shadow.camera.far =
    150;


scene.add(
    directionalLight
);



/* =========================================================
   LUZ DE EMERGENCIA ROJA A
========================================================= */

const emergencyLightA =

    new THREE.PointLight(

        0xff251d,

        75,

        35,

        1.7

    );


emergencyLightA.position.set(

    16,

    12,

    0

);


scene.add(
    emergencyLightA
);



/* =========================================================
   LUZ DE EMERGENCIA ROJA B
========================================================= */

const emergencyLightB =

    new THREE.PointLight(

        0xff251d,

        55,

        30,

        1.7

    );


emergencyLightB.position.set(

    -16,

    12,

    0

);


scene.add(
    emergencyLightB
);



/* =========================================================
   LUZ FRÍA A
========================================================= */

const coldLightA =

    new THREE.PointLight(

        0x8fdcff,

        65,

        35,

        1.8

    );


coldLightA.position.set(

    0,

    15,

    16

);


scene.add(
    coldLightA
);



/* =========================================================
   LUZ FRÍA B
========================================================= */

const coldLightB =

    new THREE.PointLight(

        0x669dba,

        55,

        30,

        1.8

    );


coldLightB.position.set(

    0,

    14,

    -16

);


scene.add(
    coldLightB
);



/* =========================================================
   MARCADOR TEMPORAL DEL SPAWN

   Solamente se utiliza durante desarrollo.
   Cuando integremos el personaje real,
   este elemento desaparecerá.
========================================================= */

const spawnGroup =
    new THREE.Group();


spawnGroup.visible =
    false;



/* =========================================================
   DISCO VERDE
========================================================= */

const spawnDisc =

    new THREE.Mesh(

        new THREE.CylinderGeometry(

            0.75,

            0.75,

            0.08,

            32

        ),

        new THREE.MeshStandardMaterial({

            color:
                0x39ff88,

            emissive:
                0x087b3c,

            emissiveIntensity:
                3,

            roughness:
                0.35,

            metalness:
                0.15

        })

    );


spawnDisc.castShadow =
    true;


spawnGroup.add(
    spawnDisc
);



/* =========================================================
   BEACON VERTICAL
========================================================= */

const spawnBeacon =

    new THREE.Mesh(

        new THREE.CylinderGeometry(

            0.04,

            0.04,

            5,

            10

        ),

        new THREE.MeshBasicMaterial({

            color:
                0x55ff99,

            transparent:
                true,

            opacity:
                0.55

        })

    );


spawnBeacon.position.y =
    2.5;


spawnGroup.add(
    spawnBeacon
);


scene.add(
    spawnGroup
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
   VOLVER DESDE ACERCA DE
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
   ENTRAR A NOVA ATLAS - ZONA A
========================================================= */

async function enterZoneA() {

    currentState =
        GAME_STATE.LOADING;


    /*
     * Los filtros oscuros pertenecen
     * solamente al menú inicial.
     */

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
           CARGAR ZONA A
        ================================================= */

        const zoneA =

            await environmentManager
                .activateEnvironment(

                    ENVIRONMENTS.ZONE_A,

                    percent => {

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


        /* =================================================
           ENCUADRAR ESCENARIO
        ================================================= */

        cameraManager.focusEnvironment(
            zoneA
        );


        cameraManager.enable();


        /* =================================================
           SPAWN OFICIAL DE ZONA A
        ================================================= */

        placeZoneASpawnMarker(
            zoneA
        );


        /* =================================================
           MOSTRAR ESCENARIO
        ================================================= */

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

            "No se pudo cargar Nova Atlas · Zona A:",

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
   SPAWN OFICIAL DE ZONA A

   Utilizamos:

   X = 16.0
   Z = 0

   Raycaster determina la superficie vertical
   y después aplicamos un offset de -4.2.

========================================================= */

function placeZoneASpawnMarker(
    environment
) {

    /* =====================================================
       BOUNDING BOX
    ====================================================== */

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



    /* =====================================================
       COORDENADAS HORIZONTALES
    ====================================================== */

    const spawnX =
        PLAYER_SPAWN_ZONE_A.x;


    const spawnZ =
        PLAYER_SPAWN_ZONE_A.z;



    /* =====================================================
       RAYCASTER DESDE ARRIBA
    ====================================================== */

    const rayOrigin =

        new THREE.Vector3(

            spawnX,

            box.max.y + 10,

            spawnZ

        );


    const rayDirection =

        new THREE.Vector3(

            0,

            -1,

            0

        );


    const raycaster =

        new THREE.Raycaster(

            rayOrigin,

            rayDirection

        );



    /* =====================================================
       MESHES DEL ESCENARIO
    ====================================================== */

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



    /* =====================================================
       INTERSECCIONES
    ====================================================== */

    const intersections =

        raycaster.intersectObjects(

            environmentMeshes,

            true

        );



    console.log(

        "🔎 Superficies encontradas para spawn:",

        intersections.length

    );



    /* =====================================================
       SUPERFICIE ENCONTRADA
    ====================================================== */

    if (
        intersections.length > 0
    ) {

        const hit =
            intersections[0];


        /*
         * El -4.2 fue calibrado directamente
         * sobre el modelo real de Zona A.
         */

        const spawnY =

            hit.point.y +

            0.08 +

            PLAYER_SPAWN_ZONE_A
                .heightOffset;



        spawnGroup.position.set(

            spawnX,

            spawnY,

            spawnZ

        );


        spawnGroup.visible =
            true;



        spawnDebug.textContent =

            "SPAWN ZONA A · " +

            `X ${spawnX.toFixed(2)} · ` +

            `Y ${spawnY.toFixed(2)} · ` +

            `Z ${spawnZ.toFixed(2)}`;



        console.log(

            "🟢 PLAYER SPAWN ZONA A:",

            {

                x:
                    spawnX,

                y:
                    spawnY,

                z:
                    spawnZ,

                heightOffset:

                    PLAYER_SPAWN_ZONE_A
                        .heightOffset,

                mesh:

                    hit.object.name ||

                    "(mesh sin nombre)"

            }

        );


        return;

    }



    /* =====================================================
       FALLBACK
    ====================================================== */

    console.warn(

        "⚠️ No se encontró superficie para PLAYER_SPAWN_ZONE_A."

    );


    const fallbackY =

        box.min.y +
        size.y * 0.55;


    spawnGroup.position.set(

        spawnX,

        fallbackY,

        spawnZ

    );


    spawnGroup.visible =
        true;


    spawnDebug.textContent =

        "SPAWN FALLBACK · " +

        `X ${spawnX.toFixed(2)} · ` +

        `Y ${fallbackY.toFixed(2)} · ` +

        `Z ${spawnZ.toFixed(2)}`;

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
       CÁMARA
    ====================================================== */

    cameraManager.update();



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
    ====================================================== */

    emergencyLightA.intensity =

        68 +

        Math.sin(

            elapsedTime *
            1.65

        )

        * 10;


    emergencyLightB.intensity =

        50 +

        Math.sin(

            elapsedTime *
            1.2 +
            1

        )

        * 8;



    /* =====================================================
       ANIMACIÓN DEL MARCADOR
    ====================================================== */

    if (
        spawnGroup.visible
    ) {

        const scale =

            1 +

            Math.sin(

                elapsedTime *
                3

            )

            * 0.06;


        spawnDisc.scale.set(

            scale,

            1,

            scale

        );

    }

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

    [

        "color:#d72924",

        "font-size:24px",

        "font-weight:bold"

    ].join(";")

);


console.log(

    "%cPre-Alpha v.01 · Build v0.2",

    "color:#b8c0c2;"

);


console.log(

    "%cEnvironment System · ONLINE",

    "color:#64d78f;"

);


console.log(

    "%cPLAYER SPAWN ZONA A · CALIBRADO",

    "color:#55ff99;"

);
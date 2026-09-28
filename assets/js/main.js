/* =========================================================
   NOVA CATALYST
   Main Controller

   Build v0.17.3
   ---------------------------------------------------------
   - Waves 1-5
   - Boss transition
   - Boss Arena loading
   - Central Boss Arena spawn
   - Main floor detection
   - Wall clearance
   - F9 Boss Fight Debug
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

    shadowRefreshInterval:
        1 / 30,

    shadowFocusInterval:
        0.125
};


let currentPixelRatio =
    Math.min(
        window.devicePixelRatio || 1,
        PERFORMANCE.maxPixelRatio
    );


let qualityTimer = 0;
let qualityFrames = 0;

let fpsTimer = 0;
let fpsFrames = 0;
let displayedFPS = 60;

let debugTimer = 0;

let shadowRefreshTimer = 0;
let shadowFocusTimer = 0;


/* =========================================================
   GAME STATES
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
   ZONE A PLAYER SPAWN
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
   BOSS ARENA CENTRAL SPAWN CONFIG
========================================================= */

const BOSS_ARENA_SPAWN_CONFIG = {

    /*
     * Analizamos únicamente la región central.
     *
     * Ya NO utilizamos los extremos del mapa
     * como candidatos.
     */
    centerRegionRatio:
        0.27,

    /*
     * Escaneo 17 x 17.
     */
    gridSteps:
        17,

    /*
     * Agrupación de pisos según altura.
     */
    floorClusterTolerance:
        0.80,

    floorSelectionTolerance:
        0.75,

    /*
     * Evita pisos demasiado altos / techos.
     */
    maxFloorHeightRatio:
        0.58,

    /*
     * Espacio mínimo alrededor.
     */
    playerClearance:
        1.15,

    bossClearance:
        2.10,

    clearanceHeight:
        1.20,

    /*
     * Distancia inicial.
     */
    preferredDistance:
        14,

    minimumDistance:
        9,

    maximumDistance:
        21,

    pathHeight:
        1.35
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
   STAR FIELD
========================================================= */

function createStarField() {

    const count =
        500;


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
            )
            * 300;


        positions[
            i * 3 + 1
        ] =
            (
                Math.random() -
                0.5
            )
            * 300;


        positions[
            i * 3 + 2
        ] =
            (
                Math.random() -
                0.5
            )
            * 300;
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


/* =========================================================
   ENEMIES
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
   COMBAT CONNECTION
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


/* =========================================================
   PLAYER DEATH
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
   TEMP VECTORS
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
   ENVIRONMENT OPTIMIZATION
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
   DYNAMIC SHADOWS
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
   BOSS TRANSITION OVERLAY
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
   BOSS LOADING PANEL
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

        boxShadow:
            "0 0 45px rgba(255,30,20,.10)",

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


/* =========================================================
   TRANSITION ERROR BUTTONS
========================================================= */

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

            fontWeight:
                "700",

            letterSpacing:
                "1.4px",

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
   BOSS UI HELPERS
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


    bossLoadingPanel.style.transform =
        "translateY(8px)";


    await nextFrame();


    bossLoadingPanel.style.opacity =
        "1";


    bossLoadingPanel.style.transform =
        "translateY(0)";
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
   ASYNC HELPERS
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

        backdropFilter:
            "blur(8px)",

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
        box-shadow:0 0 45px rgba(255,30,20,.12);
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
                font:700 10px Orbitron,Consolas,monospace;
                letter-spacing:2px;
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
                font:700 10px Orbitron,Consolas,monospace;
                letter-spacing:2px;
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
   STATE HELPER
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
                duration * 1000 + 250
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
}


/* =========================================================
   RETRY / MENU
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
   NORMAL LOADING
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

function preloadBossEncounter() {

    const job =
        async () => {

            try {

                console.log(
                    "[Nova] Precargando Boss Encounter..."
                );


                await Promise.all([

                    environmentManager
                        .preloadEnvironment(
                            ENVIRONMENTS.BOSS_ARENA
                        ),

                    bossManager
                        .preload()
                ]);


                console.log(
                    "[Nova] Boss Encounter precargado."
                );
            }

            catch (
                error
            ) {

                console.warn(

                    "[Nova] Preload Boss incompleto:",

                    error
                );
            }
        };


    if (
        "requestIdleCallback"
        in window
    ) {

        window.requestIdleCallback(
            job,
            {
                timeout:
                    4000
            }
        );
    }

    else {

        setTimeout(
            job,
            1200
        );
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
            true
        );


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


                /*
                 * Precarga arena + Boss mientras
                 * jugamos las oleadas.
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

                box.max.y + 10,

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
   BOSS ARENA MESHES
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
   BOSS ARENA FLOOR HITS
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
                box.max.y + 5,
                z
            ),

            new THREE.Vector3(
                0,
                -1,
                0
            ),

            0,

            size.y + 15
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


    const result =
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


        /*
         * Únicamente suelo mirando hacia arriba.
         */
        if (
            normal.y <
            0.55
        ) {

            continue;
        }


        /*
         * Descartamos techo y niveles superiores
         * demasiado altos.
         */
        if (
            hit.point.y >
            maximumFloorY
        ) {

            continue;
        }


        result.push(
            hit.point.clone()
        );
    }


    return result;
}


/* =========================================================
   DETECT CENTRAL PLAYABLE FLOOR
========================================================= */

function detectCentralArenaFloor(

    meshes,

    box

) {

    const size =
        new THREE.Vector3();


    const geometricCenter =
        new THREE.Vector3();


    box.getSize(
        size
    );


    box.getCenter(
        geometricCenter
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


    /*
     * Escaneo EXCLUSIVAMENTE alrededor
     * del centro del escenario.
     */
    for (
        let ix = 0;
        ix < steps;
        ix++
    ) {

        const x =

            geometricCenter.x

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

                geometricCenter.z

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

        console.error(

            "[Boss Arena] No se encontró piso en la zona central."
        );


        return null;
    }


    /* =====================================================
       CLUSTER SURFACES BY HEIGHT
    ====================================================== */

    const clusters =
        [];


    const tolerance =
        BOSS_ARENA_SPAWN_CONFIG
            .floorClusterTolerance;


    const ordered =
        points
            .slice()
            .sort(
                (a, b) =>
                    a.y -
                    b.y
            );


    for (
        const point
        of ordered
    ) {

        let selectedCluster =
            null;


        for (
            const cluster
            of clusters
        ) {

            if (
                Math.abs(

                    point.y -
                    cluster.averageY

                )

                <=

                tolerance
            ) {

                selectedCluster =
                    cluster;

                break;
            }
        }


        if (
            !selectedCluster
        ) {

            selectedCluster = {

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
                selectedCluster
            );
        }


        selectedCluster.points.push(
            point
        );


        selectedCluster.sumX +=
            point.x;


        selectedCluster.sumY +=
            point.y;


        selectedCluster.sumZ +=
            point.z;


        selectedCluster.averageY =

            selectedCluster.sumY

            /

            selectedCluster.points.length;
    }


    /*
     * Queremos la superficie dominante de
     * la región central.
     */
    clusters.sort(
        (a, b) => {

            if (
                b.points.length !==
                a.points.length
            ) {

                return (

                    b.points.length -
                    a.points.length
                );
            }


            return (

                a.averageY -
                b.averageY
            );
        }
    );


    const selected =
        clusters[0];


    /*
     * IMPORTANTÍSIMO:
     *
     * En vez de utilizar únicamente el centro
     * del BoundingBox global, calculamos el
     * centro de la superficie jugable detectada.
     *
     * Esto evita que decoraciones externas
     * desplacen el centro.
     */
    const playableCenter =
        new THREE.Vector3(

            selected.sumX /
            selected.points.length,

            selected.averageY,

            selected.sumZ /
            selected.points.length
        );


    console.group(
        "🏟 BOSS ARENA · CENTRAL FLOOR"
    );


    console.log(

        "Centro geométrico GLTF:",

        geometricCenter
    );


    console.log(

        "Centro jugable detectado:",

        playableCenter
    );


    console.log(

        "Tamaño arena:",

        size
    );


    console.log(

        "Clusters:",

        clusters.map(
            cluster => ({

                y:
                    Number(
                        cluster.averageY
                            .toFixed(
                                2
                            )
                    ),

                points:
                    cluster.points.length
            })
        )
    );


    console.log(

        "Piso seleccionado Y:",

        selected.averageY
    );


    console.groupEnd();


    return {

        y:
            selected.averageY,

        points:
            selected.points,

        geometricCenter,

        playableCenter,

        regionX,

        regionZ
    };
}


/* =========================================================
   SAMPLE CENTRAL FLOOR
========================================================= */

function sampleCentralArenaFloor(

    meshes,

    box,

    x,

    z,

    targetFloorY

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


    let bestDifference =
        Infinity;


    for (
        const point
        of hits
    ) {

        const difference =

            Math.abs(

                point.y -
                targetFloorY
            );


        if (
            difference >
            BOSS_ARENA_SPAWN_CONFIG
                .floorSelectionTolerance
        ) {

            continue;
        }


        if (
            difference <
            bestDifference
        ) {

            bestDifference =
                difference;


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
   SPAWN CLEARANCE
========================================================= */

function hasArenaSpawnClearance(

    position,

    meshes,

    radius

) {

    const origin =
        new THREE.Vector3(

            position.x,

            position.y

            +

            BOSS_ARENA_SPAWN_CONFIG
                .clearanceHeight,

            position.z
        );


    const raycaster =
        new THREE.Raycaster();


    const direction =
        new THREE.Vector3();


    const checks =
        12;


    for (
        let i = 0;
        i < checks;
        i++
    ) {

        const angle =

            i /
            checks

            *

            Math.PI *
            2;


        direction.set(

            Math.cos(
                angle
            ),

            0,

            Math.sin(
                angle
            )
        );


        raycaster.set(
            origin,
            direction
        );


        raycaster.near =
            0.05;


        raycaster.far =
            radius;


        const hits =
            raycaster
                .intersectObjects(
                    meshes,
                    false
                );


        if (
            hits.length >
            0
        ) {

            return false;
        }
    }


    return true;
}


/* =========================================================
   DIRECT PATH PLAYER <-> BOSS
========================================================= */

function hasArenaDirectPath(

    player,

    boss,

    meshes

) {

    const origin =
        new THREE.Vector3(

            player.x,

            player.y

            +

            BOSS_ARENA_SPAWN_CONFIG
                .pathHeight,

            player.z
        );


    const target =
        new THREE.Vector3(

            boss.x,

            boss.y

            +

            BOSS_ARENA_SPAWN_CONFIG
                .pathHeight,

            boss.z
        );


    const direction =
        new THREE.Vector3()
            .subVectors(
                target,
                origin
            );


    const distance =
        direction.length();


    if (
        distance <=
        2
    ) {

        return true;
    }


    direction.normalize();


    const raycaster =
        new THREE.Raycaster(

            origin,

            direction,

            0.30,

            Math.max(
                0.30,
                distance - 1.5
            )
        );


    const hits =
        raycaster
            .intersectObjects(
                meshes,
                false
            );


    return hits.length ===
        0;
}


/* =========================================================
   BUILD CENTRAL CANDIDATES
========================================================= */

function buildCentralSpawnCandidates(

    meshes,

    box,

    floorInfo

) {

    const candidates =
        [];


    const steps =
        BOSS_ARENA_SPAWN_CONFIG
            .gridSteps;


    /*
     * Usamos el centro del PISO JUGABLE,
     * no necesariamente el centro global del GLTF.
     */
    const center =
        floorInfo.playableCenter;


    /*
     * Reducimos todavía un poco más el área
     * para evitar cualquier exterior.
     */
    const regionX =

        floorInfo.regionX *
        0.65;


    const regionZ =

        floorInfo.regionZ *
        0.65;


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


            const floor =
                sampleCentralArenaFloor(

                    meshes,

                    box,

                    x,

                    z,

                    floorInfo.y
                );


            if (
                !floor
            ) {

                continue;
            }


            if (
                !hasArenaSpawnClearance(

                    floor,

                    meshes,

                    BOSS_ARENA_SPAWN_CONFIG
                        .playerClearance
                )
            ) {

                continue;
            }


            candidates.push(
                floor
            );
        }
    }


    /*
     * Lo más central primero.
     */
    candidates.sort(
        (a, b) => {

            const distanceA =
                Math.hypot(

                    a.x -
                    center.x,

                    a.z -
                    center.z
                );


            const distanceB =
                Math.hypot(

                    b.x -
                    center.x,

                    b.z -
                    center.z
                );


            return (
                distanceA -
                distanceB
            );
        }
    );


    return candidates;
}


/* =========================================================
   SELECT CENTRAL PLAYER/BOSS PAIR
========================================================= */

function selectCenteredBossPair(

    candidates,

    meshes,

    center

) {

    let best =
        null;


    let bestScore =
        Infinity;


    const maximumCandidates =
        Math.min(
            candidates.length,
            120
        );


    for (
        let i = 0;
        i < maximumCandidates;
        i++
    ) {

        const player =
            candidates[i];


        for (
            let j = i + 1;
            j < maximumCandidates;
            j++
        ) {

            const boss =
                candidates[j];


            /*
             * Mismo nivel.
             */
            if (
                Math.abs(

                    player.y -
                    boss.y

                ) >
                0.55
            ) {

                continue;
            }


            const distance =
                Math.hypot(

                    player.x -
                    boss.x,

                    player.z -
                    boss.z
                );


            if (
                distance <
                BOSS_ARENA_SPAWN_CONFIG
                    .minimumDistance

                ||

                distance >
                BOSS_ARENA_SPAWN_CONFIG
                    .maximumDistance
            ) {

                continue;
            }


            /*
             * El Boss necesita más espacio.
             */
            if (
                !hasArenaSpawnClearance(

                    boss,

                    meshes,

                    BOSS_ARENA_SPAWN_CONFIG
                        .bossClearance
                )
            ) {

                continue;
            }


            /*
             * Sin pared entre ambos.
             */
            if (
                !hasArenaDirectPath(

                    player,

                    boss,

                    meshes
                )
            ) {

                continue;
            }


            const midpointX =

                (
                    player.x +
                    boss.x
                )
                / 2;


            const midpointZ =

                (
                    player.z +
                    boss.z
                )
                / 2;


            /*
             * Queremos que EL COMBATE esté centrado.
             */
            const midpointDistance =
                Math.hypot(

                    midpointX -
                    center.x,

                    midpointZ -
                    center.z
                );


            const distanceDifference =
                Math.abs(

                    distance

                    -

                    BOSS_ARENA_SPAWN_CONFIG
                        .preferredDistance
                );


            /*
             * Penalizamos mucho alejarnos del centro.
             */
            const score =

                midpointDistance *
                5

                +

                distanceDifference;


            if (
                score <
                bestScore
            ) {

                bestScore =
                    score;


                best = {

                    player:
                        player.clone(),

                    boss:
                        boss.clone(),

                    distance,

                    midpointDistance
                };
            }
        }
    }


    return best;
}


/* =========================================================
   CENTRAL FALLBACK
========================================================= */

function createCentralFallback(

    meshes,

    box,

    floorInfo

) {

    const center =
        floorInfo.playableCenter;


    const floorY =
        floorInfo.y;


    /*
     * Intentamos primero sobre Z.
     */
    const distances = [

        7,
        6,
        5,
        4,
        3
    ];


    for (
        const distance
        of distances
    ) {

        const player =
            sampleCentralArenaFloor(

                meshes,

                box,

                center.x,

                center.z -
                distance,

                floorY
            );


        const boss =
            sampleCentralArenaFloor(

                meshes,

                box,

                center.x,

                center.z +
                distance,

                floorY
            );


        if (
            !player

            ||

            !boss
        ) {

            continue;
        }


        if (
            !hasArenaSpawnClearance(

                player,

                meshes,

                BOSS_ARENA_SPAWN_CONFIG
                    .playerClearance
            )
        ) {

            continue;
        }


        if (
            !hasArenaSpawnClearance(

                boss,

                meshes,

                BOSS_ARENA_SPAWN_CONFIG
                    .bossClearance
            )
        ) {

            continue;
        }


        return {

            player:
                player.clone(),

            boss:
                boss.clone()
        };
    }


    /*
     * Segundo intento sobre X.
     */
    for (
        const distance
        of distances
    ) {

        const player =
            sampleCentralArenaFloor(

                meshes,

                box,

                center.x -
                distance,

                center.z,

                floorY
            );


        const boss =
            sampleCentralArenaFloor(

                meshes,

                box,

                center.x +
                distance,

                center.z,

                floorY
            );


        if (
            !player

            ||

            !boss
        ) {

            continue;
        }


        if (
            !hasArenaSpawnClearance(

                player,

                meshes,

                BOSS_ARENA_SPAWN_CONFIG
                    .playerClearance
            )
        ) {

            continue;
        }


        if (
            !hasArenaSpawnClearance(

                boss,

                meshes,

                BOSS_ARENA_SPAWN_CONFIG
                    .bossClearance
            )
        ) {

            continue;
        }


        return {

            player:
                player.clone(),

            boss:
                boss.clone()
        };
    }


    return null;
}


/* =========================================================
   CALCULATE BOSS ARENA SPAWNS
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


    const meshes =
        getEnvironmentFloorMeshes(
            environment
        );


    console.group(
        "🎯 BOSS ARENA CENTRAL SPAWN"
    );


    console.log(
        "Arena size:",
        size
    );


    console.log(
        "Centro BoundingBox:",
        center
    );


    /* =====================================================
       DETECT PLAYABLE CENTER
    ====================================================== */

    const floorInfo =
        detectCentralArenaFloor(

            meshes,

            box
        );


    if (
        !floorInfo
    ) {

        console.groupEnd();


        throw new Error(

            "No se pudo detectar el piso central del Boss Arena."
        );
    }


    console.log(

        "Centro jugable:",

        floorInfo.playableCenter
    );


    /* =====================================================
       CENTRAL CANDIDATES
    ====================================================== */

    const candidates =
        buildCentralSpawnCandidates(

            meshes,

            box,

            floorInfo
        );


    console.log(

        "Puntos centrales seguros:",

        candidates.length
    );


    /* =====================================================
       SELECT PAIR
    ====================================================== */

    let pair =
        selectCenteredBossPair(

            candidates,

            meshes,

            floorInfo.playableCenter
        );


    /*
     * Si la geometría es complicada,
     * usamos dos puntos manualmente alrededor
     * del centro jugable detectado.
     */
    if (
        !pair
    ) {

        console.warn(

            "[Boss Arena] Usando fallback central."
        );


        pair =
            createCentralFallback(

                meshes,

                box,

                floorInfo
            );
    }


    if (
        !pair
    ) {

        console.groupEnd();


        throw new Error(

            "No se encontraron posiciones seguras en la zona central de la Boss Arena."
        );
    }


    const player =
        pair.player.clone();


    const boss =
        pair.boss.clone();


    /*
     * Margen mínimo sobre suelo.
     */
    player.y +=
        0.08;


    boss.y +=
        0.04;


    console.log(
        "--------------------------------"
    );


    console.log(

        "PLAYER SPAWN:",

        player
    );


    console.log(

        "BOSS SPAWN:",

        boss
    );


    console.log(

        "CENTRO DE BATALLA:",

        new THREE.Vector3(

            (
                player.x +
                boss.x
            ) / 2,

            (
                player.y +
                boss.y
            ) / 2,

            (
                player.z +
                boss.z
            ) / 2
        )
    );


    console.log(

        "DISTANCIA:",

        player
            .distanceTo(
                boss
            )
            .toFixed(
                2
            )
    );


    console.groupEnd();


    return {

        player,

        boss
    };
}


/* =========================================================
   TELEPORT PLAYER + RAPIER
========================================================= */

function teleportPlayerTo(

    position,

    lookAtPosition =
        null

) {

    const playerRoot =
        playerController
            .getObject();


    playerRoot.position.copy(
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

            playerRoot.rotation.y =
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


    if (
        body
    ) {

        if (
            typeof body.setTranslation ===
            "function"
        ) {

            body.setTranslation(

                physicsPosition,

                true
            );
        }


        if (
            typeof body
                .setNextKinematicTranslation ===
            "function"
        ) {

            body.setNextKinematicTranslation(
                physicsPosition
            );
        }
    }


    if (
        "verticalVelocity"
        in physicsManager
    ) {

        physicsManager.verticalVelocity =
            0;
    }


    playerRoot.updateMatrixWorld(
        true
    );
}


/* =========================================================
   BOSS TRANSITION ERROR
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


    bossLoadingPanel.style.transform =
        "translateY(0)";


    bossLoadingEyebrow.textContent =
        "ERROR DE TRANSFERENCIA";


    bossLoadingTitle.textContent =
        "SECTOR CORE NO RESPONDE";


    setBossLoading(

        100,

        "No se pudo completar la transición. Revisa la consola."
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


    /* =====================================================
       ÉL VIENE POR TI
    ====================================================== */

    bossOverlay.style.pointerEvents =
        "none";


    bossErrorButtons.style.display =
        "none";


    bossLoadingFill.style.background =
        "#ef3930";


    showCinematicText(
        "ÉL VIENE POR TI"
    );


    await sleep(
        1650
    );


    hideCinematicText();


    await sleep(
        420
    );


    /* =====================================================
       LOADING SCREEN
    ====================================================== */

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


    await nextFrame();


    deactivateZoneAExtras();


    setBossLoading(

        14,

        "Conectando con Sector Core..."
    );


    await nextFrame();


    /* =====================================================
       LOAD ARENA
    ====================================================== */

    const bossArena =
        await environmentManager
            .activateEnvironment(

                ENVIRONMENTS.BOSS_ARENA,

                progress => {

                    setBossLoading(

                        14

                        +

                        progress *
                        0.20,

                        "Transfiriendo geometría..."
                    );
                }
            );


    setBossLoading(

        36,

        "Optimizando Sector Core..."
    );


    await nextFrame();


    optimizeStaticEnvironment(
        bossArena
    );


    /* =====================================================
       COLLIDERS
    ====================================================== */

    setBossLoading(

        45,

        "Reconstruyendo colisiones..."
    );


    await nextFrame();


    physicsManager
        .createEnvironmentColliders(
            bossArena
        );


    setBossLoading(

        57,

        "Calibrando sistemas de combate..."
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
       CENTRAL SPAWN
    ====================================================== */

    setBossLoading(

        65,

        "Localizando centro de la base..."
    );


    await nextFrame();


    const spawns =
        calculateBossArenaSpawns(
            bossArena
        );


    console.log(

        "[Boss Arena] Player spawn:",

        spawns.player
    );


    console.log(

        "[Boss Arena] Boss spawn:",

        spawns.boss
    );


    setBossLoading(

        71,

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
    ====================================================== */

    setBossLoading(

        77,

        "Inicializando anomalía..."
    );


    await nextFrame();


    await bossManager.load();


    setBossLoading(

        90,

        "Sincronizando patrón hostil..."
    );


    await nextFrame();


    await bossManager.spawn(
        spawns.boss
    );


    /* =====================================================
       WEAPON CONNECTION
    ====================================================== */

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


    renderer.shadowMap.needsUpdate =
        true;


    /* =====================================================
       READY
    ====================================================== */

    setBossLoading(

        100,

        "SECTOR CORE ONLINE"
    );


    await sleep(
        420
    );


    bossLoadingPanel.style.opacity =
        "0";


    await sleep(
        280
    );


    bossLoadingPanel.style.display =
        "none";


    /* =====================================================
       SOBREVIVE
    ====================================================== */

    showCinematicText(
        "SOBREVIVE"
    );


    await sleep(
        950
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

        "ANOMALÍA DETECTADA · SOBREVIVE"
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
        650
    );
}


/* =========================================================
   BOSS DEFEATED
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
   ADAPTIVE RESOLUTION
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
   SHADOW SYSTEM
========================================================= */

function updateShadowSystem(

    deltaTime,

    playerPosition

) {

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

            playerPosition.x + 14,

            playerPosition.y + 24,

            playerPosition.z + 10
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
            cameraManager
                .getMode();


        const aiming =
            cameraManager
                .isAiming();


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
           NORMAL ENEMIES PRE-PHYSICS
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
           ONE PHYSICS STEP
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
           BOSS ARENA
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


        const playerPosition =
            playerController
                .getPosition();


        playerLight.position.set(

            playerPosition.x,

            playerPosition.y + 1.65,

            playerPosition.z + 0.40
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


        bossManager.update(
            deltaTime
        );


        objectManager.update();
    }

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
   GAME LOOP
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
   DEBUG - BOSS FIGHT

   F9 = saltar las oleadas y entrar directamente
   a la transición del Boss.

   TEMPORAL PARA DESARROLLO.
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


        /*
         * Solo funciona cuando Zona A ya está
         * completamente cargada y estamos jugando.
         */
        if (
            currentState !==
            GAME_STATE.PLAYING
        ) {

            console.warn(

                "[DEBUG] Espera a que Zona A termine de cargar antes de presionar F9."
            );


            return;
        }


        console.warn(

            "[DEBUG] F9 → Saltando directamente a Boss Fight."
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
   ESC AFTER TRANSITION ERROR
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

playerHealth.setVisible(
    false
);


animate();


console.log(

    "%cNOVA CATALYST",

    "color:#d72924;font-size:24px;font-weight:bold;"
);


console.log(

    "%cBoss Arena Central Spawn Build v0.17.3",

    "color:#8effa8;"
);
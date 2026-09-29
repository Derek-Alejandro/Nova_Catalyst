/* =========================================================
   NOVA CATALYST
   Boss Manager

   Build v0.22.0 · PERFORMANCE + TACTICAL AI
   ---------------------------------------------------------
   - 3000 HP
   - Boss más lento que el jugador
   - Cannon a larga distancia
   - Persecución táctica
   - Navegación optimizada
   - Menos raycasts
   - IA de navegación ~8 Hz
   - Mejor evasión de paredes
   - Anti-stuck
   - Cannon/Melee no se interrumpen
   - Run no recibe stun
   - Cañón 3D
   - Animaciones GLB cargadas en paralelo
========================================================= */

import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   CONFIG
========================================================= */

const BOSS_CONFIG = {

    /* =====================================================
       GENERAL
    ====================================================== */

    targetHeight:
        3.25,

    maxHealth:
        3000,


    /* =====================================================
       MOVIMIENTO
    ====================================================== */

    walkSpeed:
        1.55,

    /*
     * Player Run = 5.2 aprox.
     *
     * Boss claramente más lento.
     */
    runSpeed:
        3.35,

    runDistance:
        5.20,

    rotationSpeed:
        7.4,

    runAnimationSpeed:
        1.08,

    modelRotationOffset:
        0,


    /* =====================================================
       MELEE
    ====================================================== */

    meleeDistance:
        2.40,

    meleeDamageDistance:
        2.90,

    meleeDamage:
        20,

    meleeCooldown:
        1.10,

    meleeImpactRatio:
        0.54,

    meleeAnimationSpeed:
        1.16,


    /* =====================================================
       CANNON
    ====================================================== */

    cannonMinDistance:
        9.0,

    cannonMaxDistance:
        55.0,

    cannonCooldown:
        4.10,

    cannonInitialDelay:
        1.85,

    cannonFireRatio:
        0.72,

    cannonAnimationSpeed:
        1.18,

    postCannonRushDuration:
        1.45,

    projectileSpeed:
        15.0,

    projectileLife:
        6.0,

    projectileRadius:
        0.22,

    directDamage:
        50,

    splashDamage:
        25,

    splashRadius:
        4.5,


    /* =====================================================
       NAVEGACIÓN

       La ruta ya NO se recalcula cada frame.
    ====================================================== */

    navigationUpdateInterval:
        0.12,

    cannonLOSUpdateInterval:
        0.18,

    bodyRadius:
        0.94,

    obstacleLookAhead:
        0.62,

    floorProbeAbove:
        3.2,

    floorProbeDistance:
        6.5,

    maxFloorStep:
        0.70,

    stuckTime:
        0.45,

    stuckDistance:
        0.008,

    avoidanceDuration:
        0.85,


    /* =====================================================
       HIT
    ====================================================== */

    hitAnimationCooldown:
        1.10,

    wakeDelay:
        0.65
};


/* =========================================================
   PATHS
========================================================= */

const BOSS_PATHS = {

    model:
        "./assets/models/boss_glb/boss.glb",

    animations: {

        Idle:
            "./assets/models/boss_glb/animations/Idle.glb",

        Walk:
            "./assets/models/boss_glb/animations/Walk.glb",

        Run:
            "./assets/models/boss_glb/animations/Run.glb",

        MeleeAttack:
            "./assets/models/boss_glb/animations/MeleeAttack.glb",

        CannonCharge:
            "./assets/models/boss_glb/animations/CannonCharge.glb",

        Hit:
            "./assets/models/boss_glb/animations/Hit.glb",

        Death:
            "./assets/models/boss_glb/animations/Death.glb"
    }
};


/* =========================================================
   STATES
========================================================= */

const BOSS_STATE = {

    IDLE:
        "idle",

    WALK:
        "walk",

    RUN:
        "run",

    MELEE:
        "melee",

    CANNON:
        "cannon",

    HIT:
        "hit",

    DEATH:
        "death"
};


/* =========================================================
   BOSS MANAGER
========================================================= */

export class BossManager {

    constructor({

        scene,

        playerController,

        playerHealth,

        onDeath = null

    }) {

        this.scene =
            scene;


        this.playerController =
            playerController;


        this.playerHealth =
            playerHealth;


        this.onDeath =
            onDeath;


        /* =================================================
           LOADER
        ================================================= */

        this.loader =
            new GLTFLoader();


        /* =================================================
           ROOT
        ================================================= */

        this.root =
            new THREE.Group();


        this.root.name =
            "NovaCatalyst_Boss";


        this.root.visible =
            false;


        this.scene.add(
            this.root
        );


        this.model =
            null;


        /* =================================================
           ANIMATION
        ================================================= */

        this.mixer =
            null;


        this.actions =
            new Map();


        this.currentAction =
            null;


        this.currentActionName =
            null;


        /* =================================================
           LOADING
        ================================================= */

        this.loaded =
            false;


        this.loadingPromise =
            null;


        /* =================================================
           ENVIRONMENT
        ================================================= */

        this.environment =
            null;


        this.environmentMeshes =
            [];


        /* =================================================
           HIT TARGETS
        ================================================= */

        this.hitMeshes =
            [];


        /* =================================================
           STATE
        ================================================= */

        this.enabled =
            false;


        this.spawned =
            false;


        this.dead =
            false;


        this.health =
            BOSS_CONFIG.maxHealth;


        this.state =
            BOSS_STATE.IDLE;


        this.wakeTimer =
            0;


        this.meleeCooldown =
            0;


        this.cannonCooldown =
            BOSS_CONFIG.cannonInitialDelay;


        this.rushTimer =
            0;


        this.hitAnimationCooldown =
            0;


        this.attackEventFired =
            false;


        this.deathCallbackFired =
            false;


        /* =================================================
           NAVIGATION
        ================================================= */

        this.navigationTimer =
            0;


        this.cannonLOSTimer =
            0;


        this.cachedCannonLOS =
            true;


        this.cachedMoveDirection =
            new THREE.Vector3();


        this.hasCachedMoveDirection =
            false;


        this.avoidanceSign =
            1;


        this.avoidanceTimer =
            0;


        this.stuckTimer =
            0;


        this.previousPosition =
            new THREE.Vector3();


        /* =================================================
           PROJECTILES
        ================================================= */

        this.projectiles =
            [];


        this.explosions =
            [];


        /*
         * MeshBasicMaterial:
         * el proyectil no necesita iluminación física.
         */
        this.projectileGeometry =
            new THREE.SphereGeometry(
                BOSS_CONFIG.projectileRadius,
                10,
                8
            );


        this.projectileMaterial =
            new THREE.MeshBasicMaterial({

                color:
                    0xff321f
            });


        /* =================================================
           TEMP VECTORS
        ================================================= */

        this.playerPosition =
            new THREE.Vector3();


        this.playerChest =
            new THREE.Vector3();


        this.moveDirection =
            new THREE.Vector3();


        this.tempDirection =
            new THREE.Vector3();


        this.tempDirection2 =
            new THREE.Vector3();


        this.tempRight =
            new THREE.Vector3();


        this.tempPosition =
            new THREE.Vector3();


        this.tempPosition2 =
            new THREE.Vector3();


        this.tempTarget =
            new THREE.Vector3();


        this.segmentClosest =
            new THREE.Vector3();


        this.floorOrigin =
            new THREE.Vector3();


        this.floorNormal =
            new THREE.Vector3();


        this.normalMatrix =
            new THREE.Matrix3();


        this.down =
            new THREE.Vector3(
                0,
                -1,
                0
            );


        this.worldUp =
            new THREE.Vector3(
                0,
                1,
                0
            );


        /* =================================================
           RAYCASTERS
        ================================================= */

        this.floorRaycaster =
            new THREE.Raycaster();


        this.navigationRaycaster =
            new THREE.Raycaster();


        this.losRaycaster =
            new THREE.Raycaster();


        this.projectileRaycaster =
            new THREE.Raycaster();


        /* =================================================
           CANNON
        ================================================= */

        this.rightHandBone =
            null;


        this.cannonRoot =
            null;


        this.cannonMuzzle =
            null;


        this.cannonChargeCore =
            null;


        this.cannonChargeLight =
            null;


        this.createCannonModel();


        /* =================================================
           HUD
        ================================================= */

        this.createHealthHUD();

    }


    /* =====================================================
       ATTACK LOCK
    ====================================================== */

    isAttackLocked() {

        return (

            this.state ===
            BOSS_STATE.MELEE

            ||

            this.state ===
            BOSS_STATE.CANNON

        );
    }


    /* =====================================================
       CREATE CANNON
    ====================================================== */

    createCannonModel() {

        this.cannonRoot =
            new THREE.Group();


        this.cannonRoot.name =
            "Boss_Cannon";


        this.cannonRoot.visible =
            false;


        this.scene.add(
            this.cannonRoot
        );


        const darkMetal =
            new THREE.MeshStandardMaterial({

                color:
                    0x11161b,

                roughness:
                    0.32,

                metalness:
                    0.85
            });


        const metal =
            new THREE.MeshStandardMaterial({

                color:
                    0x4d5861,

                roughness:
                    0.28,

                metalness:
                    0.88
            });


        const blackMetal =
            new THREE.MeshStandardMaterial({

                color:
                    0x050607,

                roughness:
                    0.25,

                metalness:
                    0.90
            });


        const redEnergy =
            new THREE.MeshBasicMaterial({

                color:
                    0xff2418
            });


        /* =================================================
           BARREL
        ================================================= */

        const barrel =
            new THREE.Mesh(

                new THREE.CylinderGeometry(
                    0.105,
                    0.135,
                    1.25,
                    14
                ),

                darkMetal
            );


        barrel.rotation.x =
            Math.PI / 2;


        barrel.position.z =
            0.40;


        barrel.castShadow =
            false;


        this.cannonRoot.add(
            barrel
        );


        const innerBarrel =
            new THREE.Mesh(

                new THREE.CylinderGeometry(
                    0.062,
                    0.062,
                    1.30,
                    12
                ),

                blackMetal
            );


        innerBarrel.rotation.x =
            Math.PI / 2;


        innerBarrel.position.z =
            0.44;


        this.cannonRoot.add(
            innerBarrel
        );


        /* =================================================
           BODY
        ================================================= */

        const body =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.38,
                    0.32,
                    0.58
                ),

                metal
            );


        body.position.z =
            -0.30;


        body.castShadow =
            false;


        this.cannonRoot.add(
            body
        );


        const rear =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.32,
                    0.26,
                    0.32
                ),

                darkMetal
            );


        rear.position.z =
            -0.66;


        this.cannonRoot.add(
            rear
        );


        /* =================================================
           ENERGY CELLS
        ================================================= */

        const cellGeometry =
            new THREE.CylinderGeometry(
                0.052,
                0.052,
                0.34,
                10
            );


        const leftCell =
            new THREE.Mesh(
                cellGeometry,
                redEnergy
            );


        leftCell.rotation.x =
            Math.PI / 2;


        leftCell.position.set(
            -0.22,
            0,
            -0.28
        );


        this.cannonRoot.add(
            leftCell
        );


        const rightCell =
            leftCell.clone();


        rightCell.position.x =
            0.22;


        this.cannonRoot.add(
            rightCell
        );


        /* =================================================
           MUZZLE
        ================================================= */

        this.cannonMuzzle =
            new THREE.Object3D();


        this.cannonMuzzle.position.set(
            0,
            0,
            1.13
        );


        this.cannonRoot.add(
            this.cannonMuzzle
        );


        /* =================================================
           CHARGE CORE
        ================================================= */

        this.cannonChargeCore =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    0.105,
                    10,
                    8
                ),

                new THREE.MeshBasicMaterial({

                    color:
                        0xff3a20,

                    transparent:
                        true,

                    opacity:
                        0.85,

                    blending:
                        THREE.AdditiveBlending,

                    depthWrite:
                        false
                })
            );


        this.cannonChargeCore.position.set(
            0,
            0,
            1.14
        );


        this.cannonChargeCore.visible =
            false;


        this.cannonRoot.add(
            this.cannonChargeCore
        );


        /* =================================================
           SMALL CANNON LIGHT

           Alcance reducido para rendimiento.
        ================================================= */

        this.cannonChargeLight =
            new THREE.PointLight(
                0xff321f,
                0,
                3.6,
                2
            );


        this.cannonChargeLight.castShadow =
            false;


        this.cannonChargeLight.position.set(
            0,
            0,
            1.10
        );


        this.cannonRoot.add(
            this.cannonChargeLight
        );

    }


    /* =====================================================
       FIND HAND
    ====================================================== */

    findRightHandBone() {

        if (
            !this.model
        ) {

            return null;
        }


        const expectedNames = [

            "mixamorigRightHand",

            "RightHand",

            "rightHand",

            "right_hand",

            "hand_r",

            "r_hand",

            "Bip01_R_Hand",

            "Right_Hand"
        ];


        let result =
            null;


        this.model.traverse(

            object => {

                if (
                    result

                    ||

                    !object.isBone
                ) {

                    return;
                }


                const objectName =
                    object.name.toLowerCase();


                for (
                    const expected
                    of expectedNames
                ) {

                    if (
                        objectName.includes(
                            expected.toLowerCase()
                        )
                    ) {

                        result =
                            object;

                        break;
                    }
                }

            }

        );


        if (
            result
        ) {

            console.log(

                "[Boss Cannon] Mano derecha:",

                result.name

            );
        }


        return result;
    }


    /* =====================================================
       UPDATE CANNON
    ====================================================== */

    updateCannonVisual() {

        if (
            !this.cannonRoot

            ||

            !this.spawned

            ||

            !this.root.visible
        ) {

            return;
        }


        this.cannonRoot.visible =
            !this.dead;


        if (
            this.dead
        ) {

            return;
        }


        if (
            this.rightHandBone
        ) {

            this.rightHandBone
                .getWorldPosition(
                    this.tempPosition
                );


            this.cannonRoot.position.copy(
                this.tempPosition
            );


            this.cannonRoot.position.y +=
                0.02;
        }

        else {

            this.tempRight
                .set(
                    1,
                    0,
                    0
                )
                .applyQuaternion(
                    this.root.quaternion
                );


            this.tempDirection2
                .set(
                    0,
                    0,
                    1
                )
                .applyQuaternion(
                    this.root.quaternion
                );


            this.cannonRoot.position
                .copy(
                    this.root.position
                )
                .addScaledVector(
                    this.tempRight,
                    0.72
                )
                .addScaledVector(
                    this.tempDirection2,
                    0.28
                );


            this.cannonRoot.position.y +=
                1.72;
        }


        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerChest
            );


        this.playerChest.y +=
            0.95;


        this.cannonRoot.lookAt(
            this.playerChest
        );


        /* =================================================
           CHARGE
        ================================================= */

        if (
            this.state ===
            BOSS_STATE.CANNON
        ) {

            const progress =
                this.getCurrentActionProgress();


            const charge =
                THREE.MathUtils.smoothstep(

                    progress,

                    0.06,

                    BOSS_CONFIG.cannonFireRatio
                );


            this.cannonChargeCore.visible =
                true;


            this.cannonChargeCore.scale.setScalar(

                0.40 +
                charge * 2.15

            );


            this.cannonChargeCore.material.opacity =
                0.45 +
                charge * 0.50;


            this.cannonChargeLight.intensity =
                charge * 5.5;
        }

        else {

            this.cannonChargeCore.visible =
                false;


            this.cannonChargeLight.intensity =
                0;
        }

    }


    /* =====================================================
       LOAD GLB
    ====================================================== */

    loadGLB(
        path
    ) {

        return new Promise(

            (
                resolve,
                reject
            ) => {

                this.loader.load(

                    path,

                    resolve,

                    undefined,

                    reject

                );
            }

        );
    }


    preload() {

        return this.load();
    }


    async load() {

        if (
            this.loaded
        ) {

            return this.root;
        }


        if (
            this.loadingPromise
        ) {

            return this.loadingPromise;
        }


        this.loadingPromise =
            this.performLoad();


        try {

            return await this.loadingPromise;
        }

        catch (
            error
        ) {

            this.loadingPromise =
                null;


            throw error;
        }

    }


    /* =====================================================
       LOAD MODEL + ANIMATIONS
    ====================================================== */

    async performLoad() {

        console.log(
            "[Boss] Cargando GLB..."
        );


        const bossGLTF =
            await this.loadGLB(
                BOSS_PATHS.model
            );


        if (
            !bossGLTF?.scene
        ) {

            throw new Error(
                "boss.glb no contiene escena válida."
            );
        }


        this.model =
            bossGLTF.scene;


        this.model.name =
            "Boss_Visual";


        this.hitMeshes.length =
            0;


        this.model.traverse(

            object => {

                if (
                    !object.isMesh

                    &&

                    !object.isSkinnedMesh
                ) {

                    return;
                }


                /*
                 * Boss Arena no usa shadow map dinámica.
                 */
                object.castShadow =
                    false;


                object.receiveShadow =
                    true;


                object.frustumCulled =
                    true;


                object.userData.enemy =
                    this;


                this.hitMeshes.push(
                    object
                );
            }

        );


        this.normalizeModel();


        this.root.userData.enemy =
            this;


        this.root.add(
            this.model
        );


        this.rightHandBone =
            this.findRightHandBone();


        this.mixer =
            new THREE.AnimationMixer(
                this.model
            );


        /* =================================================
           LOAD ALL ANIMATIONS IN PARALLEL

           Antes:
           Idle -> espera -> Walk -> espera -> Run...

           Ahora:
           todas se descargan en paralelo.
        ================================================= */

        const animationEntries =
            Object.entries(
                BOSS_PATHS.animations
            );


        await Promise.all(

            animationEntries.map(

                async (
                    [
                        name,
                        path
                    ]
                ) => {

                    try {

                        const gltf =
                            await this.loadGLB(
                                path
                            );


                        if (
                            !gltf.animations

                            ||

                            gltf.animations.length ===
                            0
                        ) {

                            console.warn(
                                `[Boss] Sin clip: ${name}`
                            );


                            return;
                        }


                        let clip =
                            gltf
                                .animations[0]
                                .clone();


                        clip.name =
                            `Boss_${name}`;


                        clip =
                            this.removeRootMotion(
                                clip
                            );


                        const action =
                            this.mixer
                                .clipAction(
                                    clip
                                );


                        if (
                            name === "Idle"

                            ||

                            name === "Walk"

                            ||

                            name === "Run"
                        ) {

                            action.setLoop(

                                THREE.LoopRepeat,

                                Infinity

                            );


                            action.clampWhenFinished =
                                false;
                        }

                        else {

                            action.setLoop(

                                THREE.LoopOnce,

                                1

                            );


                            action.clampWhenFinished =
                                true;
                        }


                        this.actions.set(
                            name,
                            action
                        );


                        console.log(

                            `[Boss] ${name} OK`

                        );
                    }

                    catch (
                        error
                    ) {

                        console.error(

                            `[Boss] Error ${name}:`,

                            error

                        );
                    }

                }

            )

        );


        /* =================================================
           FINISHED
        ================================================= */

        this.mixer.addEventListener(

            "finished",

            event => {

                if (
                    event.action !==
                    this.currentAction
                ) {

                    return;
                }


                const finished =
                    this.currentActionName;


                if (
                    finished ===
                    "Death"
                ) {

                    this.finishDeath();

                    return;
                }


                if (
                    finished ===
                    "CannonCharge"
                ) {

                    this.rushTimer =
                        BOSS_CONFIG
                            .postCannonRushDuration;
                }


                if (
                    finished === "MeleeAttack"

                    ||

                    finished === "CannonCharge"

                    ||

                    finished === "Hit"
                ) {

                    this.currentAction =
                        null;


                    this.currentActionName =
                        null;


                    this.attackEventFired =
                        false;


                    this.state =
                        BOSS_STATE.IDLE;


                    this.playLoop(
                        "Idle",
                        0.06
                    );
                }

            }

        );


        this.loaded =
            true;


        this.loadingPromise =
            null;


        console.log(
            "[Boss] PERFORMANCE AI ONLINE"
        );


        return this.root;
    }


    /* =====================================================
       REMOVE ROOT MOTION
    ====================================================== */

    removeRootMotion(
        clip
    ) {

        for (
            const track
            of clip.tracks
        ) {

            const name =
                track.name.toLowerCase();


            if (
                !name.endsWith(
                    ".position"
                )
            ) {

                continue;
            }


            if (
                !name.includes(
                    "hips"
                )

                &&

                !name.includes(
                    "root"
                )
            ) {

                continue;
            }


            const values =
                track.values;


            if (
                values.length < 3
            ) {

                continue;
            }


            const baseX =
                values[0];


            const baseZ =
                values[2];


            for (
                let i = 0;
                i < values.length;
                i += 3
            ) {

                values[i] =
                    baseX;


                values[
                    i + 2
                ] =
                    baseZ;
            }

        }


        clip.resetDuration();


        return clip;
    }


    /* =====================================================
       NORMALIZE
    ====================================================== */

    normalizeModel() {

        this.model.position.set(
            0,
            0,
            0
        );


        this.model.rotation.set(
            0,
            0,
            0
        );


        this.model.scale.set(
            1,
            1,
            1
        );


        this.model.updateMatrixWorld(
            true
        );


        let box =
            new THREE.Box3()
                .setFromObject(
                    this.model
                );


        const size =
            new THREE.Vector3();


        box.getSize(
            size
        );


        if (
            size.y <= 0
        ) {

            throw new Error(
                "Altura inválida del Boss."
            );
        }


        const scale =
            BOSS_CONFIG.targetHeight /
            size.y;


        this.model.scale.setScalar(
            scale
        );


        this.model.updateMatrixWorld(
            true
        );


        box =
            new THREE.Box3()
                .setFromObject(
                    this.model
                );


        this.model.position.y -=
            box.min.y;


        this.model.rotation.y =
            BOSS_CONFIG.modelRotationOffset;


        this.model.updateMatrixWorld(
            true
        );
    }


    /* =====================================================
       ENVIRONMENT
    ====================================================== */

    setEnvironment(
        environment
    ) {

        this.environment =
            environment;


        this.environmentMeshes.length =
            0;


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

                    this.environmentMeshes.push(
                        object
                    );
                }
            }

        );


        console.log(

            `[Boss] Environment meshes: ${this.environmentMeshes.length}`

        );
    }


    /* =====================================================
       HUD
    ====================================================== */

    createHealthHUD() {

        this.hud =
            document.createElement(
                "div"
            );


        Object.assign(

            this.hud.style,

            {

                position:
                    "fixed",

                left:
                    "50%",

                top:
                    "24px",

                transform:
                    "translateX(-50%)",

                width:
                    "min(620px,75vw)",

                padding:
                    "10px 14px 12px",

                zIndex:
                    "920",

                background:
                    "rgba(0,0,0,.76)",

                border:
                    "1px solid rgba(255,70,55,.50)",

                borderRadius:
                    "6px",

                boxShadow:
                    "0 0 24px rgba(255,35,25,.12)",

                fontFamily:
                    "Orbitron,Consolas,monospace",

                color:
                    "#fff",

                pointerEvents:
                    "none",

                display:
                    "none"
            }

        );


        this.hudTitle =
            document.createElement(
                "div"
            );


        Object.assign(

            this.hudTitle.style,

            {

                fontSize:
                    "10px",

                fontWeight:
                    "800",

                letterSpacing:
                    "2.4px",

                marginBottom:
                    "7px",

                textAlign:
                    "center"
            }

        );


        this.healthTrack =
            document.createElement(
                "div"
            );


        Object.assign(

            this.healthTrack.style,

            {

                height:
                    "9px",

                borderRadius:
                    "999px",

                overflow:
                    "hidden",

                background:
                    "rgba(255,255,255,.10)"
            }

        );


        this.healthFill =
            document.createElement(
                "div"
            );


        Object.assign(

            this.healthFill.style,

            {

                width:
                    "100%",

                height:
                    "100%",

                background:
                    "linear-gradient(90deg,#620606,#ff281f,#ff796b)",

                transformOrigin:
                    "left center",

                transform:
                    "scaleX(1)",

                transition:
                    "transform .08s linear"
            }

        );


        this.healthTrack.appendChild(
            this.healthFill
        );


        this.hud.append(

            this.hudTitle,

            this.healthTrack

        );


        document.body.appendChild(
            this.hud
        );
    }


    setHUDVisible(
        visible
    ) {

        this.hud.style.display =
            visible
                ?
                "block"
                :
                "none";
    }


    updateHealthHUD() {

        const ratio =
            THREE.MathUtils.clamp(

                this.health /
                BOSS_CONFIG.maxHealth,

                0,

                1

            );


        this.healthFill.style.transform =
            `scaleX(${ratio})`;


        this.hudTitle.textContent =
            `ANOMALÍA CORE · ${Math.ceil(this.health)} / ${BOSS_CONFIG.maxHealth}`;
    }


    /* =====================================================
       PLAY LOOP
    ====================================================== */

    playLoop(
        name,
        fade = 0.10
    ) {

        if (
            this.dead

            ||

            this.isAttackLocked()
        ) {

            return false;
        }


        const next =
            this.actions.get(
                name
            );


        if (
            !next
        ) {

            return false;
        }


        if (
            this.currentAction ===
            next

            &&

            this.currentActionName ===
            name
        ) {

            return true;
        }


        if (
            this.currentAction
        ) {

            this.currentAction.fadeOut(
                fade
            );
        }


        next.reset();


        next.enabled =
            true;


        next.setEffectiveWeight(
            1
        );


        if (
            name ===
            "Run"
        ) {

            next.setEffectiveTimeScale(
                BOSS_CONFIG.runAnimationSpeed
            );
        }

        else {

            next.setEffectiveTimeScale(
                1
            );
        }


        next.fadeIn(
            fade
        );


        next.play();


        this.currentAction =
            next;


        this.currentActionName =
            name;


        return true;
    }


    /* =====================================================
       ONE SHOT
    ====================================================== */

    playOneShot(
        name,
        state,
        fade = 0.05
    ) {

        if (
            this.dead

            &&

            name !==
            "Death"
        ) {

            return false;
        }


        if (
            this.isAttackLocked()

            &&

            name !==
            "Death"
        ) {

            return false;
        }


        const next =
            this.actions.get(
                name
            );


        if (
            !next
        ) {

            return false;
        }


        if (
            this.currentAction
        ) {

            this.currentAction.fadeOut(
                fade
            );
        }


        next.reset();


        next.enabled =
            true;


        next.setEffectiveWeight(
            1
        );


        if (
            name ===
            "MeleeAttack"
        ) {

            next.setEffectiveTimeScale(
                BOSS_CONFIG.meleeAnimationSpeed
            );
        }

        else if (
            name ===
            "CannonCharge"
        ) {

            next.setEffectiveTimeScale(
                BOSS_CONFIG.cannonAnimationSpeed
            );
        }

        else {

            next.setEffectiveTimeScale(
                1
            );
        }


        next.fadeIn(
            fade
        );


        next.play();


        this.currentAction =
            next;


        this.currentActionName =
            name;


        this.state =
            state;


        this.attackEventFired =
            false;


        return true;
    }


    /* =====================================================
       SPAWN
    ====================================================== */

    async spawn(
        position
    ) {

        await this.load();


        this.health =
            BOSS_CONFIG.maxHealth;


        this.dead =
            false;


        this.spawned =
            true;


        this.enabled =
            true;


        this.deathCallbackFired =
            false;


        this.state =
            BOSS_STATE.IDLE;


        this.wakeTimer =
            BOSS_CONFIG.wakeDelay;


        this.meleeCooldown =
            0;


        this.cannonCooldown =
            BOSS_CONFIG.cannonInitialDelay;


        this.rushTimer =
            0;


        this.hitAnimationCooldown =
            0;


        this.navigationTimer =
            0;


        this.cannonLOSTimer =
            0;


        this.cachedCannonLOS =
            true;


        this.hasCachedMoveDirection =
            false;


        this.avoidanceTimer =
            0;


        this.stuckTimer =
            0;


        this.root.position.copy(
            position
        );


        this.previousPosition.copy(
            position
        );


        this.root.rotation.set(
            0,
            Math.PI,
            0
        );


        this.root.visible =
            true;


        this.cannonRoot.visible =
            true;


        this.root.updateMatrixWorld(
            true
        );


        this.updateHealthHUD();


        this.setHUDVisible(
            true
        );


        this.playLoop(
            "Idle",
            0
        );


        return this;
    }


    /* =====================================================
       FLOOR
    ====================================================== */

    sampleFloorAt(
        x,
        z,
        referenceY
    ) {

        if (
            this.environmentMeshes.length ===
            0
        ) {

            return null;
        }


        this.floorOrigin.set(

            x,

            referenceY +
            BOSS_CONFIG.floorProbeAbove,

            z

        );


        this.floorRaycaster.set(
            this.floorOrigin,
            this.down
        );


        this.floorRaycaster.near =
            0;


        this.floorRaycaster.far =
            BOSS_CONFIG.floorProbeDistance;


        const hits =
            this.floorRaycaster
                .intersectObjects(

                    this.environmentMeshes,

                    false

                );


        let best =
            null;


        let bestDifference =
            Infinity;


        for (
            const hit
            of hits
        ) {

            if (
                hit.face
            ) {

                this.normalMatrix
                    .getNormalMatrix(
                        hit.object.matrixWorld
                    );


                this.floorNormal
                    .copy(
                        hit.face.normal
                    )
                    .applyMatrix3(
                        this.normalMatrix
                    )
                    .normalize();


                if (
                    this.floorNormal.y <
                    0.48
                ) {

                    continue;
                }
            }


            const difference =
                Math.abs(

                    hit.point.y -
                    referenceY

                );


            if (
                difference >
                BOSS_CONFIG.maxFloorStep
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
                    hit.point;
            }
        }


        return best
            ?
            best.clone()
            :
            null;
    }


    /* =====================================================
       OPTIMIZED OBSTACLE TEST

       SOLO:
       - 3 rayos laterales
       - 2 alturas

       Y únicamente durante actualización de navegación.
    ====================================================== */

    isDirectionSafe(
        direction,
        lookDistance
    ) {

        this.tempRight.set(

            -direction.z,

            0,

            direction.x

        );


        const lateral =
            BOSS_CONFIG.bodyRadius *
            0.58;


        const sideOffsets = [
            -lateral,
            0,
            lateral
        ];


        const heights = [
            0.85,
            1.80
        ];


        const distance =
            lookDistance

            +

            BOSS_CONFIG.bodyRadius

            +

            BOSS_CONFIG.obstacleLookAhead;


        for (
            const height
            of heights
        ) {

            for (
                const side
                of sideOffsets
            ) {

                this.tempPosition
                    .copy(
                        this.root.position
                    )
                    .addScaledVector(
                        this.tempRight,
                        side
                    );


                this.tempPosition.y +=
                    height;


                this.navigationRaycaster.set(

                    this.tempPosition,

                    direction

                );


                this.navigationRaycaster.near =
                    0.05;


                this.navigationRaycaster.far =
                    distance;


                const hit =
                    this.navigationRaycaster
                        .intersectObjects(

                            this.environmentMeshes,

                            false

                        )[0];


                if (
                    hit
                ) {

                    return false;
                }
            }
        }


        return true;
    }


    /* =====================================================
       RECALCULATE NAVIGATION

       ~8 veces por segundo.
    ====================================================== */

    recalculateNavigation(
        movementDistance
    ) {

        this.moveDirection.set(

            this.playerPosition.x -
            this.root.position.x,

            0,

            this.playerPosition.z -
            this.root.position.z

        );


        if (
            this.moveDirection.lengthSq() <
            0.0001
        ) {

            this.hasCachedMoveDirection =
                false;


            return;
        }


        this.moveDirection.normalize();


        let angles;


        if (
            this.avoidanceTimer >
            0
        ) {

            angles = [

                48 *
                this.avoidanceSign,

                72 *
                this.avoidanceSign,

                28 *
                this.avoidanceSign,

                0,

                -45 *
                this.avoidanceSign

            ];
        }

        else {

            angles = [
                0,
                32,
                -32,
                62,
                -62
            ];
        }


        let bestScore =
            -Infinity;


        let found =
            false;


        for (
            const angle
            of angles
        ) {

            this.tempDirection
                .copy(
                    this.moveDirection
                )
                .applyAxisAngle(

                    this.worldUp,

                    THREE.MathUtils
                        .degToRad(
                            angle
                        )

                )
                .normalize();


            if (
                !this.isDirectionSafe(

                    this.tempDirection,

                    movementDistance

                )
            ) {

                continue;
            }


            const score =
                this.tempDirection.dot(
                    this.moveDirection
                )

                -

                Math.abs(
                    angle
                ) *
                0.002;


            if (
                score >
                bestScore
            ) {

                bestScore =
                    score;


                this.cachedMoveDirection
                    .copy(
                        this.tempDirection
                    );


                found =
                    true;
            }
        }


        this.hasCachedMoveDirection =
            found;
    }


    /* =====================================================
       MOVE
    ====================================================== */

    moveTowardPlayer(
        speed,
        deltaTime
    ) {

        const movementDistance =
            speed *
            deltaTime;


        this.navigationTimer -=
            deltaTime;


        if (
            this.navigationTimer <=
            0
        ) {

            this.navigationTimer =
                BOSS_CONFIG
                    .navigationUpdateInterval;


            this.recalculateNavigation(

                speed *
                BOSS_CONFIG
                    .navigationUpdateInterval

            );
        }


        if (
            !this.hasCachedMoveDirection
        ) {

            this.stuckTimer +=
                deltaTime;


            if (
                this.stuckTimer >=
                BOSS_CONFIG.stuckTime
            ) {

                this.stuckTimer =
                    0;


                this.avoidanceSign *=
                    -1;


                this.avoidanceTimer =
                    BOSS_CONFIG
                        .avoidanceDuration;


                this.navigationTimer =
                    0;
            }


            return;
        }


        this.previousPosition.copy(
            this.root.position
        );


        this.tempTarget
            .copy(
                this.root.position
            )
            .addScaledVector(

                this.cachedMoveDirection,

                movementDistance

            );


        /*
         * Un único raycast de suelo por frame.
         */
        const floor =
            this.sampleFloorAt(

                this.tempTarget.x,

                this.tempTarget.z,

                this.root.position.y

            );


        if (
            !floor
        ) {

            this.navigationTimer =
                0;


            this.hasCachedMoveDirection =
                false;


            return;
        }


        this.root.position.set(

            this.tempTarget.x,

            floor.y,

            this.tempTarget.z

        );


        this.rotateToward(

            this.cachedMoveDirection,

            deltaTime

        );


        const moved =
            this.root.position.distanceTo(
                this.previousPosition
            );


        if (
            moved <
            BOSS_CONFIG.stuckDistance
        ) {

            this.stuckTimer +=
                deltaTime;
        }

        else {

            this.stuckTimer =
                0;
        }


        if (
            this.stuckTimer >=
            BOSS_CONFIG.stuckTime
        ) {

            this.stuckTimer =
                0;


            this.avoidanceSign *=
                -1;


            this.avoidanceTimer =
                BOSS_CONFIG
                    .avoidanceDuration;


            this.navigationTimer =
                0;
        }
    }


    /* =====================================================
       ROTATE
    ====================================================== */

    rotateToward(
        direction,
        deltaTime
    ) {

        const targetAngle =
            Math.atan2(
                direction.x,
                direction.z
            );


        const currentAngle =
            this.root.rotation.y;


        const difference =
            Math.atan2(

                Math.sin(
                    targetAngle -
                    currentAngle
                ),

                Math.cos(
                    targetAngle -
                    currentAngle
                )

            );


        const alpha =
            1

            -

            Math.exp(

                -BOSS_CONFIG.rotationSpeed *
                deltaTime

            );


        this.root.rotation.y =
            currentAngle +
            difference * alpha;
    }


    /* =====================================================
       LINE OF SIGHT
    ====================================================== */

    hasLineOfSightToPlayer() {

        if (
            this.cannonMuzzle
        ) {

            this.cannonMuzzle
                .getWorldPosition(
                    this.tempPosition
                );
        }

        else {

            this.tempPosition.set(

                this.root.position.x,

                this.root.position.y +
                1.8,

                this.root.position.z
            );
        }


        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerChest
            );


        this.playerChest.y +=
            0.95;


        this.tempDirection
            .subVectors(

                this.playerChest,

                this.tempPosition

            );


        const distance =
            this.tempDirection.length();


        if (
            distance <= 0.1
        ) {

            return true;
        }


        this.tempDirection.normalize();


        this.losRaycaster.set(

            this.tempPosition,

            this.tempDirection

        );


        this.losRaycaster.near =
            0.20;


        this.losRaycaster.far =
            Math.max(
                0.2,
                distance - 0.50
            );


        return (

            this.losRaycaster
                .intersectObjects(

                    this.environmentMeshes,

                    false

                )
                .length ===
            0

        );
    }


    /* =====================================================
       CACHED CANNON LOS
    ====================================================== */

    canFireCannon(
        deltaTime
    ) {

        this.cannonLOSTimer -=
            deltaTime;


        if (
            this.cannonLOSTimer <=
            0
        ) {

            this.cannonLOSTimer =
                BOSS_CONFIG
                    .cannonLOSUpdateInterval;


            this.cachedCannonLOS =
                this.hasLineOfSightToPlayer();
        }


        return this.cachedCannonLOS;
    }


    /* =====================================================
       ACTION PROGRESS
    ====================================================== */

    getCurrentActionProgress() {

        if (
            !this.currentAction
        ) {

            return 0;
        }


        const duration =
            this.currentAction
                .getClip()
                .duration;


        if (
            duration <= 0
        ) {

            return 0;
        }


        return THREE.MathUtils.clamp(

            this.currentAction.time /
            duration,

            0,

            1

        );
    }


    /* =====================================================
       FACE PLAYER
    ====================================================== */

    facePlayer(
        deltaTime
    ) {

        this.tempDirection.set(

            this.playerPosition.x -
            this.root.position.x,

            0,

            this.playerPosition.z -
            this.root.position.z

        );


        if (
            this.tempDirection.lengthSq() <=
            0.0001
        ) {

            return;
        }


        this.tempDirection.normalize();


        this.rotateToward(
            this.tempDirection,
            deltaTime
        );
    }


    /* =====================================================
       ATTACKS
    ====================================================== */

    beginMelee() {

        if (
            this.playOneShot(

                "MeleeAttack",

                BOSS_STATE.MELEE,

                0.045

            )
        ) {

            this.meleeCooldown =
                BOSS_CONFIG.meleeCooldown;
        }
    }


    beginCannon() {

        if (
            this.playOneShot(

                "CannonCharge",

                BOSS_STATE.CANNON,

                0.055

            )
        ) {

            this.cannonCooldown =
                BOSS_CONFIG.cannonCooldown;


            this.cannonLOSTimer =
                0;
        }
    }


    updateAttackState(
        deltaTime
    ) {

        this.facePlayer(
            deltaTime
        );


        const progress =
            this.getCurrentActionProgress();


        /* =================================================
           MELEE
        ================================================= */

        if (
            this.state ===
            BOSS_STATE.MELEE

            &&

            !this.attackEventFired

            &&

            progress >=
            BOSS_CONFIG.meleeImpactRatio
        ) {

            this.attackEventFired =
                true;


            const distance =
                Math.hypot(

                    this.playerPosition.x -
                    this.root.position.x,

                    this.playerPosition.z -
                    this.root.position.z

                );


            if (
                distance <=
                BOSS_CONFIG.meleeDamageDistance
            ) {

                this.playerHealth.takeDamage(

                    BOSS_CONFIG.meleeDamage,

                    {
                        source:
                            this
                    }

                );
            }
        }


        /* =================================================
           CANNON
        ================================================= */

        if (
            this.state ===
            BOSS_STATE.CANNON

            &&

            !this.attackEventFired

            &&

            progress >=
            BOSS_CONFIG.cannonFireRatio
        ) {

            this.attackEventFired =
                true;


            this.fireCannon();
        }
    }


    /* =====================================================
       CANNON FIRE
    ====================================================== */

    fireCannon() {

        this.updateCannonVisual();


        const origin =
            new THREE.Vector3();


        this.cannonMuzzle
            .getWorldPosition(
                origin
            );


        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerChest
            );


        this.playerChest.y +=
            0.95;


        const direction =
            new THREE.Vector3()
                .subVectors(

                    this.playerChest,

                    origin

                )
                .normalize();


        const projectile =
            new THREE.Mesh(

                this.projectileGeometry,

                this.projectileMaterial

            );


        projectile.position.copy(
            origin
        );


        projectile.scale.set(
            0.90,
            0.90,
            1.35
        );


        this.scene.add(
            projectile
        );


        this.projectiles.push({

            mesh:
                projectile,

            direction,

            life:
                BOSS_CONFIG.projectileLife
        });


        this.cannonChargeLight.intensity =
            8;
    }


    /* =====================================================
       POINT -> SEGMENT
    ====================================================== */

    distancePointToSegment(
        point,
        a,
        b
    ) {

        this.tempDirection
            .subVectors(
                b,
                a
            );


        const lengthSq =
            this.tempDirection.lengthSq();


        if (
            lengthSq <=
            0.000001
        ) {

            return point.distanceTo(
                a
            );
        }


        const t =
            THREE.MathUtils.clamp(

                this.tempTarget
                    .subVectors(
                        point,
                        a
                    )
                    .dot(
                        this.tempDirection
                    )

                /

                lengthSq,

                0,

                1

            );


        this.segmentClosest
            .copy(
                a
            )
            .addScaledVector(

                this.tempDirection,

                t

            );


        return point.distanceTo(
            this.segmentClosest
        );
    }


    /* =====================================================
       PROJECTILES
    ====================================================== */

    updateProjectiles(
        deltaTime
    ) {

        for (
            let i =
                this.projectiles.length - 1;

            i >= 0;

            i--
        ) {

            const projectile =
                this.projectiles[i];


            projectile.life -=
                deltaTime;


            const previous =
                projectile.mesh
                    .position
                    .clone();


            const travel =
                BOSS_CONFIG.projectileSpeed *
                deltaTime;


            const next =
                previous
                    .clone()
                    .addScaledVector(

                        projectile.direction,

                        travel

                    );


            this.playerController
                .getObject()
                .getWorldPosition(
                    this.playerChest
                );


            this.playerChest.y +=
                0.90;


            if (
                this.distancePointToSegment(

                    this.playerChest,

                    previous,

                    next

                ) <=
                0.72
            ) {

                this.explodeProjectile(

                    i,

                    next,

                    true

                );


                continue;
            }


            this.projectileRaycaster.set(

                previous,

                projectile.direction

            );


            this.projectileRaycaster.near =
                0;


            this.projectileRaycaster.far =
                travel +
                BOSS_CONFIG.projectileRadius;


            const hit =
                this.projectileRaycaster
                    .intersectObjects(

                        this.environmentMeshes,

                        false

                    )[0];


            if (
                hit
            ) {

                this.explodeProjectile(

                    i,

                    hit.point,

                    false

                );


                continue;
            }


            projectile.mesh.position.copy(
                next
            );


            if (
                projectile.life <=
                0
            ) {

                this.explodeProjectile(

                    i,

                    next,

                    false

                );
            }
        }
    }


    /* =====================================================
       EXPLOSION
    ====================================================== */

    explodeProjectile(
        index,
        position,
        directHit
    ) {

        const projectile =
            this.projectiles[
                index
            ];


        if (
            projectile
        ) {

            this.scene.remove(
                projectile.mesh
            );


            this.projectiles.splice(
                index,
                1
            );
        }


        this.createExplosionEffect(
            position
        );


        if (
            directHit
        ) {

            this.playerHealth.takeDamage(

                BOSS_CONFIG.directDamage,

                {
                    source:
                        this
                }

            );


            return;
        }


        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerChest
            );


        this.playerChest.y +=
            0.90;


        if (
            this.playerChest.distanceTo(
                position
            )
            <=
            BOSS_CONFIG.splashRadius
        ) {

            this.playerHealth.takeDamage(

                BOSS_CONFIG.splashDamage,

                {
                    source:
                        this
                }

            );
        }
    }


    createExplosionEffect(
        position
    ) {

        const mesh =
            new THREE.Mesh(

                new THREE.SphereGeometry(
                    0.22,
                    8,
                    6
                ),

                new THREE.MeshBasicMaterial({

                    color:
                        0xff3b24,

                    transparent:
                        true,

                    opacity:
                        0.70,

                    depthWrite:
                        false,

                    blending:
                        THREE.AdditiveBlending

                })

            );


        mesh.position.copy(
            position
        );


        this.scene.add(
            mesh
        );


        this.explosions.push({

            mesh,

            life:
                0.30,

            maxLife:
                0.30
        });
    }


    updateExplosions(
        deltaTime
    ) {

        for (
            let i =
                this.explosions.length - 1;

            i >= 0;

            i--
        ) {

            const effect =
                this.explosions[i];


            effect.life -=
                deltaTime;


            const progress =
                1 -
                effect.life /
                effect.maxLife;


            effect.mesh.scale.setScalar(

                1 +
                progress * 11

            );


            effect.mesh.material.opacity =
                Math.max(

                    0,

                    0.70 *
                    (
                        1 - progress
                    )

                );


            if (
                effect.life <=
                0
            ) {

                this.scene.remove(
                    effect.mesh
                );


                effect.mesh.geometry.dispose();


                effect.mesh.material.dispose();


                this.explosions.splice(
                    i,
                    1
                );
            }
        }
    }


    clearProjectiles() {

        for (
            const projectile
            of this.projectiles
        ) {

            this.scene.remove(
                projectile.mesh
            );
        }


        this.projectiles.length =
            0;
    }


    /* =====================================================
       DAMAGE
    ====================================================== */

    takeDamage(
        damage
    ) {

        if (
            this.dead

            ||

            !this.spawned
        ) {

            return false;
        }


        const amount =
            Math.max(

                0,

                Number(
                    damage
                ) || 0

            );


        if (
            amount <=
            0
        ) {

            return false;
        }


        this.health =
            Math.max(

                0,

                this.health -
                amount

            );


        this.updateHealthHUD();


        if (
            this.health <=
            0
        ) {

            this.die();


            return true;
        }


        /*
         * Nunca interrumpir:
         * - Cannon
         * - Melee
         * - Run
         */
        if (
            this.isAttackLocked()

            ||

            this.state ===
            BOSS_STATE.RUN
        ) {

            return false;
        }


        if (
            this.hitAnimationCooldown <=
            0
        ) {

            this.hitAnimationCooldown =
                BOSS_CONFIG
                    .hitAnimationCooldown;


            this.playOneShot(

                "Hit",

                BOSS_STATE.HIT,

                0.035

            );
        }


        return false;
    }


    /* =====================================================
       DEATH
    ====================================================== */

    die() {

        if (
            this.dead
        ) {

            return;
        }


        this.dead =
            true;


        this.enabled =
            false;


        this.state =
            BOSS_STATE.DEATH;


        this.clearProjectiles();


        this.cannonChargeCore.visible =
            false;


        this.cannonChargeLight.intensity =
            0;


        const started =
            this.playOneShot(

                "Death",

                BOSS_STATE.DEATH,

                0.08

            );


        if (
            !started
        ) {

            this.finishDeath();
        }
    }


    finishDeath() {

        if (
            this.deathCallbackFired
        ) {

            return;
        }


        this.deathCallbackFired =
            true;


        this.enabled =
            false;


        this.setHUDVisible(
            false
        );


        if (
            this.cannonRoot
        ) {

            this.cannonRoot.visible =
                false;
        }


        if (
            typeof this.onDeath ===
            "function"
        ) {

            this.onDeath();
        }
    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update(
        deltaTime
    ) {

        if (
            !this.loaded

            ||

            !this.spawned
        ) {

            return;
        }


        if (
            !this.enabled

            &&

            !this.dead
        ) {

            return;
        }


        const dt =
            Math.min(
                deltaTime,
                0.05
            );


        /* =================================================
           ANIMATION
        ================================================= */

        this.mixer?.update(
            dt
        );


        /* =================================================
           PROJECTILES
        ================================================= */

        if (
            this.projectiles.length >
            0
        ) {

            this.updateProjectiles(
                dt
            );
        }


        if (
            this.explosions.length >
            0
        ) {

            this.updateExplosions(
                dt
            );
        }


        this.updateCannonVisual();


        if (
            this.dead

            ||

            !this.enabled
        ) {

            return;
        }


        /* =================================================
           TIMERS
        ================================================= */

        this.meleeCooldown =
            Math.max(

                0,

                this.meleeCooldown -
                dt

            );


        this.cannonCooldown =
            Math.max(

                0,

                this.cannonCooldown -
                dt

            );


        this.rushTimer =
            Math.max(

                0,

                this.rushTimer -
                dt

            );


        this.avoidanceTimer =
            Math.max(

                0,

                this.avoidanceTimer -
                dt

            );


        this.hitAnimationCooldown =
            Math.max(

                0,

                this.hitAnimationCooldown -
                dt

            );


        /* =================================================
           PLAYER
        ================================================= */

        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerPosition
            );


        if (
            this.wakeTimer >
            0
        ) {

            this.wakeTimer -=
                dt;


            this.facePlayer(
                dt
            );


            return;
        }


        /* =================================================
           ACTIVE ATTACK
        ================================================= */

        if (
            this.state ===
            BOSS_STATE.MELEE

            ||

            this.state ===
            BOSS_STATE.CANNON
        ) {

            this.updateAttackState(
                dt
            );


            return;
        }


        /* =================================================
           HIT
        ================================================= */

        if (
            this.state ===
            BOSS_STATE.HIT
        ) {

            this.facePlayer(
                dt
            );


            return;
        }


        const distance =
            Math.hypot(

                this.playerPosition.x -
                this.root.position.x,

                this.playerPosition.z -
                this.root.position.z

            );


        /* =================================================
           1. MELEE
        ================================================= */

        if (
            distance <=
            BOSS_CONFIG.meleeDistance

            &&

            this.meleeCooldown <=
            0
        ) {

            this.facePlayer(
                dt
            );


            this.beginMelee();


            return;
        }


        /* =================================================
           2. POST CANNON RUSH
        ================================================= */

        if (
            this.rushTimer >
            0

            &&

            distance >
            BOSS_CONFIG.meleeDistance
        ) {

            this.state =
                BOSS_STATE.RUN;


            this.playLoop(
                "Run",
                0.08
            );


            this.moveTowardPlayer(

                BOSS_CONFIG.runSpeed,

                dt

            );


            return;
        }


        /* =================================================
           3. CANNON

           Línea de visión se comprueba a baja frecuencia.
        ================================================= */

        if (
            distance >=
            BOSS_CONFIG.cannonMinDistance

            &&

            distance <=
            BOSS_CONFIG.cannonMaxDistance

            &&

            this.cannonCooldown <=
            0

            &&

            this.canFireCannon(
                dt
            )
        ) {

            this.facePlayer(
                dt
            );


            this.beginCannon();


            return;
        }


        /* =================================================
           4. RUN
        ================================================= */

        if (
            distance >
            BOSS_CONFIG.runDistance
        ) {

            this.state =
                BOSS_STATE.RUN;


            this.playLoop(
                "Run",
                0.08
            );


            this.moveTowardPlayer(

                BOSS_CONFIG.runSpeed,

                dt

            );


            return;
        }


        /* =================================================
           5. WALK
        ================================================= */

        if (
            distance >
            BOSS_CONFIG.meleeDistance *
            0.92
        ) {

            this.state =
                BOSS_STATE.WALK;


            this.playLoop(
                "Walk",
                0.08
            );


            this.moveTowardPlayer(

                BOSS_CONFIG.walkSpeed,

                dt

            );


            return;
        }


        /* =================================================
           IDLE
        ================================================= */

        this.state =
            BOSS_STATE.IDLE;


        this.playLoop(
            "Idle",
            0.08
        );


        this.facePlayer(
            dt
        );
    }


    /* =====================================================
       WEAPON COMPATIBILITY
    ====================================================== */

    getHitMeshes() {

        if (
            !this.spawned

            ||

            this.dead

            ||

            !this.root.visible
        ) {

            return [];
        }


        return this.hitMeshes;
    }


    getAliveCount() {

        return (

            this.spawned

            &&

            !this.dead

        )
            ?
            1
            :
            0;
    }


    getObject() {

        return this.root;
    }


    getHealth() {

        return this.health;
    }


    getMaxHealth() {

        return BOSS_CONFIG.maxHealth;
    }


    isDead() {

        return this.dead;
    }


    isLoaded() {

        return this.loaded;
    }


    setEnabled(
        enabled
    ) {

        this.enabled =
            Boolean(
                enabled
            )

            &&

            this.spawned

            &&

            !this.dead;
    }


    setVisible(
        visible
    ) {

        this.root.visible =
            Boolean(
                visible
            );


        if (
            this.cannonRoot
        ) {

            this.cannonRoot.visible =

                Boolean(
                    visible
                )

                &&

                this.spawned

                &&

                !this.dead;
        }


        this.setHUDVisible(

            Boolean(
                visible
            )

            &&

            this.spawned

            &&

            !this.dead

        );
    }

}
/* =========================================================
   NOVA CATALYST
   Boss Manager

   Build v0.17.0 · GLB BOSS

   ---------------------------------------------------------
   - GLTFLoader
   - boss.glb
   - Animation GLB
   - Idle
   - Walk
   - Run
   - MeleeAttack
   - CannonCharge
   - Hit
   - Death
   - 1600 HP
   - Boss HUD
   - Cannon projectile
   - Direct damage: 50 HP
   - Splash damage: 25 HP
========================================================= */

import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   CONFIG
========================================================= */

const BOSS_CONFIG = {

    targetHeight:
        3.25,

    maxHealth:
        1600,

    walkSpeed:
        1.45,

    runSpeed:
        3.05,

    runDistance:
        8.5,

    rotationSpeed:
        6.5,

    /*
     * Si después vemos que camina de espaldas,
     * únicamente cambiamos esto a Math.PI.
     */
    modelRotationOffset:
        0,

    /* =====================================================
       MELEE
    ====================================================== */

    meleeDistance:
        2.25,

    meleeDamageDistance:
        2.65,

    meleeDamage:
        20,

    meleeCooldown:
        1.65,

    meleeImpactRatio:
        0.54,


    /* =====================================================
       CANNON
    ====================================================== */

    cannonMinDistance:
        7.0,

    cannonMaxDistance:
        28.0,

    cannonCooldown:
        5.6,

    cannonInitialDelay:
        2.5,

    cannonFireRatio:
        0.72,

    projectileSpeed:
        13.5,

    projectileLife:
        5.0,

    projectileRadius:
        0.22,

    directDamage:
        50,

    splashDamage:
        25,

    splashRadius:
        4.5,


    /* =====================================================
       MOVEMENT / COLLISION
    ====================================================== */

    bodyRadius:
        0.82,

    collisionProbeHeight:
        1.15,

    floorProbeAbove:
        3.5,

    floorProbeDistance:
        7.0,

    maxFloorStep:
        0.75,


    /* =====================================================
       ANIMATION
    ====================================================== */

    hitAnimationCooldown:
        0.40,

    wakeDelay:
        0.85

};


/* =========================================================
   GLB PATHS
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

        /* =================================================
           REFERENCES
        ================================================= */

        this.scene =
            scene;


        this.playerController =
            playerController;


        this.playerHealth =
            playerHealth;


        this.onDeath =
            onDeath;


        /* =================================================
           GLTF LOADER
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
           MIXER
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
           HIT TARGETS
        ================================================= */

        this.hitMeshes =
            [];


        /* =================================================
           ENVIRONMENT
        ================================================= */

        this.environment =
            null;


        this.environmentMeshes =
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


        this.hitAnimationCooldown =
            0;


        this.attackEventFired =
            false;


        this.deathCallbackFired =
            false;


        /* =================================================
           PROJECTILES
        ================================================= */

        this.projectiles =
            [];


        this.explosions =
            [];


        this.projectileGeometry =
            new THREE.SphereGeometry(

                BOSS_CONFIG.projectileRadius,

                10,

                8

            );


        this.projectileMaterial =
            new THREE.MeshBasicMaterial({

                color:
                    0xff4a30

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


        this.tempPosition =
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


        this.wallRaycaster =
            new THREE.Raycaster();


        this.projectileRaycaster =
            new THREE.Raycaster();


        /* =================================================
           HUD
        ================================================= */

        this.createHealthHUD();

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

                    gltf => {

                        resolve(
                            gltf
                        );

                    },

                    undefined,

                    error => {

                        console.error(

                            `[Boss] Error cargando GLB: ${path}`,

                            error

                        );


                        reject(
                            error
                        );

                    }

                );

            }

        );

    }


    /* =====================================================
       PRELOAD
    ====================================================== */

    preload() {

        return this.load();

    }


    /* =====================================================
       PROTECTED LOAD
    ====================================================== */

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

            /*
             * Si algo falla permitimos volver
             * a intentar la carga.
             */
            this.loadingPromise =
                null;


            throw error;

        }

    }


    /* =====================================================
       PERFORM LOAD
    ====================================================== */

    async performLoad() {

        console.log(
            "[Boss] Cargando modelo GLB..."
        );


        /* =================================================
           MAIN MODEL
        ================================================= */

        const bossGLTF =
            await this.loadGLB(
                BOSS_PATHS.model
            );


        if (
            !bossGLTF

            ||

            !bossGLTF.scene
        ) {

            throw new Error(

                "boss.glb no contiene una escena válida."

            );

        }


        this.model =
            bossGLTF.scene;


        this.model.name =
            "Boss_Visual";


        this.hitMeshes.length =
            0;


        /* =================================================
           MESH CONFIG
        ================================================= */

        this.model.traverse(

            object => {

                if (
                    !object.isMesh

                    &&

                    !object.isSkinnedMesh
                ) {

                    return;

                }


                object.castShadow =
                    true;


                object.receiveShadow =
                    true;


                object.frustumCulled =
                    true;


                /*
                 * WeaponManager encuentra enemigos
                 * mediante userData.enemy.
                 */
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


        /* =================================================
           MIXER
        ================================================= */

        this.mixer =
            new THREE.AnimationMixer(
                this.model
            );


        /* =================================================
           LOAD ANIMATION GLBs
        ================================================= */

        for (
            const [
                name,
                path
            ]
            of Object.entries(
                BOSS_PATHS.animations
            )
        ) {

            try {

                console.log(

                    `[Boss] Cargando animación: ${name}`

                );


                const animationGLTF =
                    await this.loadGLB(
                        path
                    );


                if (
                    !animationGLTF.animations

                    ||

                    animationGLTF.animations.length ===
                    0
                ) {

                    console.warn(

                        `[Boss] ${name} no contiene AnimationClip.`

                    );


                    continue;

                }


                let clip =
                    animationGLTF
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


                /* =========================================
                   LOOP ANIMATIONS
                ========================================= */

                if (
                    name ===
                    "Idle"

                    ||

                    name ===
                    "Walk"

                    ||

                    name ===
                    "Run"
                ) {

                    action.setLoop(

                        THREE.LoopRepeat,

                        Infinity

                    );


                    action.clampWhenFinished =
                        false;

                }


                /* =========================================
                   ONE SHOT
                ========================================= */

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

                    `[Boss] ${name} OK · ${clip.duration.toFixed(2)} s`

                );

            }

            catch (
                error
            ) {

                console.error(

                    `[Boss] Error cargando animación ${name}:`,

                    error

                );

            }

        }


        /* =================================================
           VALIDATE CRITICAL ANIMATIONS
        ================================================= */

        if (
            !this.actions.has(
                "Idle"
            )
        ) {

            console.warn(
                "[Boss] Idle no está disponible."
            );

        }


        if (
            !this.actions.has(
                "Death"
            )
        ) {

            console.warn(
                "[Boss] Death no está disponible."
            );

        }


        /* =================================================
           MIXER FINISHED
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


                /* =========================================
                   DEATH
                ========================================= */

                if (
                    finished ===
                    "Death"
                ) {

                    this.finishDeath();


                    return;

                }


                /* =========================================
                   ONE SHOTS FINISHED
                ========================================= */

                if (
                    finished ===
                    "MeleeAttack"

                    ||

                    finished ===
                    "CannonCharge"

                    ||

                    finished ===
                    "Hit"
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

                        0.08

                    );

                }

            }

        );


        this.loaded =
            true;


        this.loadingPromise =
            null;


        console.log(
            "[Boss] GLB ONLINE"
        );


        console.log(
            `[Boss] Hit meshes: ${this.hitMeshes.length}`
        );


        console.log(
            `[Boss] Animaciones disponibles: ${[...this.actions.keys()].join(", ")}`
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
                track.name
                    .toLowerCase();


            const isPosition =
                name.endsWith(
                    ".position"
                );


            const isRoot =

                name.includes(
                    "hips"
                )

                ||

                name.includes(
                    "root"
                );


            if (
                !isPosition

                ||

                !isRoot
            ) {

                continue;

            }


            if (
                track.values.length <
                3
            ) {

                continue;

            }


            const baseX =
                track.values[0];


            const baseZ =
                track.values[2];


            for (
                let i = 0;
                i < track.values.length;
                i += 3
            ) {

                track.values[i] =
                    baseX;


                track.values[
                    i + 2
                ] =
                    baseZ;

            }

        }


        clip.resetDuration();


        return clip;

    }


    /* =====================================================
       NORMALIZE MODEL
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


        console.log(

            "[Boss] Tamaño original:",

            size

        );


        if (
            size.y <=
            0
        ) {

            throw new Error(

                "El Boss tiene altura inválida."

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


        /*
         * Pies sobre Y = 0 del root.
         */
        this.model.position.y -=
            box.min.y;


        this.model.rotation.y =
            BOSS_CONFIG.modelRotationOffset;


        this.model.updateMatrixWorld(
            true
        );


        box =
            new THREE.Box3()
                .setFromObject(
                    this.model
                );


        const finalSize =
            new THREE.Vector3();


        box.getSize(
            finalSize
        );


        console.log(

            "[Boss] Tamaño normalizado:",

            finalSize

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
       HEALTH HUD
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
                    "min(560px,72vw)",

                padding:
                    "10px 14px 12px",

                zIndex:
                    "920",

                background:
                    "rgba(0,0,0,.72)",

                border:
                    "1px solid rgba(255,78,62,.45)",

                borderRadius:
                    "6px",

                boxShadow:
                    "0 0 28px rgba(255,35,25,.12)",

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
                    "8px",

                borderRadius:
                    "999px",

                overflow:
                    "hidden",

                background:
                    "rgba(255,255,255,.10)",

                border:
                    "1px solid rgba(255,255,255,.08)"

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
                    "linear-gradient(90deg,#7a0808,#ff392f,#ff7868)",

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
       LOOP ANIMATION
    ====================================================== */

    playLoop(
        name,
        fade = 0.12
    ) {

        if (
            this.dead
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
        fade = 0.06
    ) {

        if (
            this.dead

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

            console.warn(

                `[Boss] Animación no encontrada: ${name}`

            );


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


        this.hitAnimationCooldown =
            0;


        this.attackEventFired =
            false;


        this.root.position.copy(
            position
        );


        this.root.rotation.set(

            0,

            Math.PI,

            0

        );


        this.root.visible =
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


        console.log(

            "[Boss] SPAWN:",

            position

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
                    Math.abs(
                        this.floorNormal.y
                    ) <
                    0.55
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
       WALL CLEAR
    ====================================================== */

    isDirectionClear(

        direction,

        distance

    ) {

        this.tempPosition.set(

            this.root.position.x,

            this.root.position.y +
            BOSS_CONFIG.collisionProbeHeight,

            this.root.position.z

        );


        this.wallRaycaster.set(

            this.tempPosition,

            direction

        );


        this.wallRaycaster.near =
            0;


        this.wallRaycaster.far =

            distance

            +

            BOSS_CONFIG.bodyRadius;


        const hits =
            this.wallRaycaster
                .intersectObjects(

                    this.environmentMeshes,

                    false

                );


        return hits.length ===
            0;

    }


    /* =====================================================
       MOVE
    ====================================================== */

    moveTowardPlayer(

        speed,

        deltaTime

    ) {

        this.moveDirection.set(

            this.playerPosition.x -
            this.root.position.x,

            0,

            this.playerPosition.z -
            this.root.position.z

        );


        if (
            this.moveDirection
                .lengthSq() <
            0.0001
        ) {

            return;

        }


        this.moveDirection.normalize();


        const movementDistance =

            speed *
            deltaTime;


        let chosenDirection =
            this.moveDirection;


        /* =================================================
           WALL STEERING
        ================================================= */

        if (
            !this.isDirectionClear(

                chosenDirection,

                movementDistance

            )
        ) {

            const left =

                this.moveDirection
                    .clone()
                    .applyAxisAngle(

                        this.worldUp,

                        Math.PI /
                        3

                    );


            const right =

                this.moveDirection
                    .clone()
                    .applyAxisAngle(

                        this.worldUp,

                        -Math.PI /
                        3

                    );


            if (
                this.isDirectionClear(

                    left,

                    movementDistance

                )
            ) {

                chosenDirection =
                    left;

            }

            else if (
                this.isDirectionClear(

                    right,

                    movementDistance

                )
            ) {

                chosenDirection =
                    right;

            }

            else {

                return;

            }

        }


        /* =================================================
           TARGET POSITION
        ================================================= */

        this.tempTarget
            .copy(
                this.root.position
            )
            .addScaledVector(

                chosenDirection,

                movementDistance

            );


        const floor =
            this.sampleFloorAt(

                this.tempTarget.x,

                this.tempTarget.z,

                this.root.position.y

            );


        if (
            !floor
        ) {

            return;

        }


        this.root.position.set(

            this.tempTarget.x,

            floor.y,

            this.tempTarget.z

        );


        this.rotateToward(

            chosenDirection,

            deltaTime

        );

    }


    /* =====================================================
       ROTATION
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

            currentAngle

            +

            difference *
            alpha;

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
            duration <=
            0
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
            this.tempDirection
                .lengthSq() <=
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
       BEGIN MELEE
    ====================================================== */

    beginMelee() {

        if (
            this.playOneShot(

                "MeleeAttack",

                BOSS_STATE.MELEE,

                0.05

            )
        ) {

            this.meleeCooldown =
                BOSS_CONFIG.meleeCooldown;

        }

    }


    /* =====================================================
       BEGIN CANNON
    ====================================================== */

    beginCannon() {

        if (
            this.playOneShot(

                "CannonCharge",

                BOSS_STATE.CANNON,

                0.07

            )
        ) {

            this.cannonCooldown =
                BOSS_CONFIG.cannonCooldown;

        }

    }


    /* =====================================================
       ATTACK STATE
    ====================================================== */

    updateAttackState(
        deltaTime
    ) {

        this.facePlayer(
            deltaTime
        );


        const progress =
            this.getCurrentActionProgress();


        /* =================================================
           MELEE IMPACT
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
           CANNON FIRE
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
       FIRE CANNON
    ====================================================== */

    fireCannon() {

        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerChest
            );


        this.playerChest.y +=
            0.95;


        const origin =
            new THREE.Vector3(

                this.root.position.x,

                this.root.position.y +
                2.05,

                this.root.position.z

            );


        const forward =
            new THREE.Vector3(
                0,
                0,
                1
            )
                .applyQuaternion(
                    this.root.quaternion
                )
                .normalize();


        origin.addScaledVector(

            forward,

            1.05

        );


        const direction =
            new THREE.Vector3()
                .subVectors(

                    this.playerChest,

                    origin

                )
                .normalize();


        const mesh =
            new THREE.Mesh(

                this.projectileGeometry,

                this.projectileMaterial

            );


        mesh.position.copy(
            origin
        );


        this.scene.add(
            mesh
        );


        this.projectiles.push({

            mesh,

            direction,

            life:
                BOSS_CONFIG.projectileLife

        });


        console.log(
            "[Boss] CANNON FIRE"
        );

    }


    /* =====================================================
       POINT / SEGMENT
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
            this.tempDirection
                .lengthSq();


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
       UPDATE PROJECTILES
    ====================================================== */

    updateProjectiles(
        deltaTime
    ) {

        for (
            let i =
                this.projectiles.length -
                1;

            i >= 0;

            i--
        ) {

            const projectile =
                this.projectiles[i];


            projectile.life -=
                deltaTime;


            const previous =
                projectile.mesh.position
                    .clone();


            const travel =

                BOSS_CONFIG.projectileSpeed

                *

                deltaTime;


            const next =
                previous
                    .clone()
                    .addScaledVector(

                        projectile.direction,

                        travel

                    );


            /* =================================================
               PLAYER COLLISION
            ================================================= */

            this.playerController
                .getObject()
                .getWorldPosition(
                    this.playerChest
                );


            this.playerChest.y +=
                0.90;


            const playerDistance =
                this.distancePointToSegment(

                    this.playerChest,

                    previous,

                    next

                );


            if (
                playerDistance <=
                0.72
            ) {

                this.explodeProjectile(

                    i,

                    next,

                    true

                );


                continue;

            }


            /* =================================================
               ENVIRONMENT COLLISION
            ================================================= */

            this.projectileRaycaster.set(

                previous,

                projectile.direction

            );


            this.projectileRaycaster.near =
                0;


            this.projectileRaycaster.far =

                travel

                +

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


            /* =================================================
               LIFE END
            ================================================= */

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
       EXPLODE PROJECTILE
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


        /* =================================================
           DIRECT HIT
        ================================================= */

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


        /* =================================================
           SPLASH
        ================================================= */

        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerChest
            );


        this.playerChest.y +=
            0.9;


        if (
            this.playerChest
                .distanceTo(
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


    /* =====================================================
       EXPLOSION EFFECT
    ====================================================== */

    createExplosionEffect(
        position
    ) {

        const geometry =
            new THREE.SphereGeometry(

                0.25,

                10,

                8

            );


        const material =
            new THREE.MeshBasicMaterial({

                color:
                    0xff3b24,

                transparent:
                    true,

                opacity:
                    0.72,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending

            });


        const mesh =
            new THREE.Mesh(

                geometry,

                material

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
                0.36,

            maxLife:
                0.36

        });

    }


    /* =====================================================
       UPDATE EXPLOSIONS
    ====================================================== */

    updateExplosions(
        deltaTime
    ) {

        for (
            let i =
                this.explosions.length -
                1;

            i >= 0;

            i--
        ) {

            const effect =
                this.explosions[i];


            effect.life -=
                deltaTime;


            const progress =

                1

                -

                effect.life /
                effect.maxLife;


            effect.mesh.scale.setScalar(

                1

                +

                progress *
                13

            );


            effect.mesh.material.opacity =
                Math.max(

                    0,

                    0.72 *
                    (
                        1 -
                        progress
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


    /* =====================================================
       CLEAR PROJECTILES
    ====================================================== */

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
                )

                ||

                0

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


        console.log(

            `[Boss] HP ${this.health} / ${BOSS_CONFIG.maxHealth}`

        );


        /* =================================================
           DEATH
        ================================================= */

        if (
            this.health <=
            0
        ) {

            this.die();


            return true;

        }


        /* =================================================
           HIT
        ================================================= */

        if (
            this.hitAnimationCooldown <=
            0

            &&

            this.state !==
            BOSS_STATE.MELEE

            &&

            this.state !==
            BOSS_STATE.CANNON
        ) {

            this.hitAnimationCooldown =
                BOSS_CONFIG.hitAnimationCooldown;


            this.playOneShot(

                "Hit",

                BOSS_STATE.HIT,

                0.035

            );

        }


        return false;

    }


    /* =====================================================
       DIE
    ====================================================== */

    die() {

        if (
            this.dead
        ) {

            return;

        }


        console.log(
            "[Boss] DEATH"
        );


        this.dead =
            true;


        this.enabled =
            false;


        this.state =
            BOSS_STATE.DEATH;


        this.clearProjectiles();


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


    /* =====================================================
       FINISH DEATH
    ====================================================== */

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


        console.log(
            "[Boss] Boss derrotado."
        );


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


        /*
         * Cuando está muerto dejamos que mixer siga
         * avanzando hasta terminar Death.
         */
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
           MIXER
        ================================================= */

        if (
            this.mixer
        ) {

            this.mixer.update(
                dt
            );

        }


        /* =================================================
           PROJECTILES
        ================================================= */

        this.updateProjectiles(
            dt
        );


        this.updateExplosions(
            dt
        );


        if (
            this.dead

            ||

            !this.enabled
        ) {

            return;

        }


        /* =================================================
           COOLDOWNS
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


        /* =================================================
           WAKE
        ================================================= */

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
           ACTION LOCK
        ================================================= */

        if (
            this.state ===
            BOSS_STATE.MELEE

            ||

            this.state ===
            BOSS_STATE.CANNON

            ||

            this.state ===
            BOSS_STATE.HIT
        ) {

            this.updateAttackState(
                dt
            );


            return;

        }


        /* =================================================
           DISTANCE
        ================================================= */

        const distance =
            Math.hypot(

                this.playerPosition.x -
                this.root.position.x,

                this.playerPosition.z -
                this.root.position.z

            );


        /* =================================================
           MELEE
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
           CANNON
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
        ) {

            this.facePlayer(
                dt
            );


            this.beginCannon();


            return;

        }


        /* =================================================
           RUN
        ================================================= */

        if (
            distance >
            BOSS_CONFIG.runDistance
        ) {

            this.state =
                BOSS_STATE.RUN;


            this.playLoop(

                "Run",

                0.10

            );


            this.moveTowardPlayer(

                BOSS_CONFIG.runSpeed,

                dt

            );

        }


        /* =================================================
           WALK
        ================================================= */

        else if (
            distance >
            BOSS_CONFIG.meleeDistance *
            0.92
        ) {

            this.state =
                BOSS_STATE.WALK;


            this.playLoop(

                "Walk",

                0.10

            );


            this.moveTowardPlayer(

                BOSS_CONFIG.walkSpeed,

                dt

            );

        }


        /* =================================================
           IDLE
        ================================================= */

        else {

            this.state =
                BOSS_STATE.IDLE;


            this.playLoop(

                "Idle",

                0.10

            );


            this.facePlayer(
                dt
            );

        }


        this.root.updateMatrixWorld(
            true
        );

    }


    /* =====================================================
       WEAPON MANAGER COMPATIBILITY
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


    /* =====================================================
       GETTERS
    ====================================================== */

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


    /* =====================================================
       ENABLE
    ====================================================== */

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


    /* =====================================================
       VISIBLE
    ====================================================== */

    setVisible(
        visible
    ) {

        this.root.visible =
            Boolean(
                visible
            );


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
/* =========================================================
   NOVA CATALYST
   Player Controller
   Build v0.10.1

   - Full body locomotion
   - RightHand detection
   - Stable combat pose
   - Shoot / Reload while moving
   - Hit reaction
   - Death animation
   - TPS / FPS
========================================================= */

import * as THREE from "three";

import {
    FBXLoader
} from "three/addons/loaders/FBXLoader.js";


/* =========================================================
   CONFIG
========================================================= */

const PLAYER_CONFIG = {

    targetHeight: 1.8,

    walkSpeed: 2.6,

    runSpeed: 5.2,

    rotationSpeed: 14,

    modelRotationOffset: 0,

    combatPoseFraction: 0.18

};


/* =========================================================
   PATHS
========================================================= */

const PLAYER_PATHS = {

    model:
        "./assets/models/player/player.fbx",

    animations: {

        Idle:
            "./assets/models/player/animations/Idle.fbx",

        Walk:
            "./assets/models/player/animations/Walk.fbx",

        Run:
            "./assets/models/player/animations/Run.fbx",

        Shoot:
            "./assets/models/player/animations/Shoot.fbx",

        Reload:
            "./assets/models/player/animations/Reload.fbx",

        Hit:
            "./assets/models/player/animations/Hit.fbx",

        Death:
            "./assets/models/player/animations/Death.fbx"

    }

};


/* =========================================================
   PLAYER CONTROLLER
========================================================= */

export class PlayerController {

    constructor(scene) {

        this.scene =
            scene;


        this.loader =
            new FBXLoader();


        /* =================================================
           ROOT
        ================================================= */

        this.root =
            new THREE.Group();


        this.root.name =
            "NovaCatalyst_Player";


        this.scene.add(
            this.root
        );


        this.model =
            null;


        /* =================================================
           BONES
        ================================================= */

        this.rightHandBone =
            null;


        this.headBone =
            null;


        /* =================================================
           ANIMATION
        ================================================= */

        this.mixer =
            null;


        this.fullLocomotionActions =
            new Map();


        this.lowerLocomotionActions =
            new Map();


        this.upperActions =
            new Map();


        this.currentFullAction =
            null;


        this.currentLowerAction =
            null;


        this.currentUpperAction =
            null;


        this.currentUpperAnimation =
            null;


        this.currentLocomotion =
            "Idle";


        this.locomotionMode =
            "full";


        this.upperBusy =
            false;


        this.deathAction =
            null;


        this.deathFinishedHandler =
            null;


        /* =================================================
           COMBAT POSE
        ================================================= */

        this.combatPoseAction =
            null;


        this.combatPoseActive =
            false;


        /* =================================================
           STATE
        ================================================= */

        this.enabled =
            false;


        this.isLoaded =
            false;


        this.movementLocked =
            false;


        this.dead =
            false;


        this.firstPersonMode =
            false;


        this.aiming =
            false;


        this.aimDirection =
            new THREE.Vector3(
                0,
                0,
                -1
            );


        /* =================================================
           INPUT
        ================================================= */

        this.keys = {

            forward: false,

            backward: false,

            left: false,

            right: false,

            run: false

        };


        /* =================================================
           MOVEMENT
        ================================================= */

        this.moveDirection =
            new THREE.Vector3();


        this.desiredMovement =
            new THREE.Vector3();


        this.forwardVector =
            new THREE.Vector3();


        this.rightVector =
            new THREE.Vector3();


        this.targetQuaternion =
            new THREE.Quaternion();


        this.rotationEuler =
            new THREE.Euler(
                0,
                0,
                0,
                "YXZ"
            );


        this.setupInput();

    }


    /* =====================================================
       LOAD FBX
    ====================================================== */

    loadFBX(path) {

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


    /* =====================================================
       LOAD PLAYER
    ====================================================== */

    async load(
        spawnPosition
    ) {

        console.log(
            "[Player] Cargando jugador..."
        );


        this.dead =
            false;


        this.movementLocked =
            false;


        this.model =
            await this.loadFBX(

                PLAYER_PATHS.model

            );


        this.model.name =
            "Player_Visual";


        this.model.traverse(

            object => {

                if (
                    !object.isMesh
                ) {

                    return;

                }


                object.castShadow =
                    true;


                object.receiveShadow =
                    true;


                object.frustumCulled =
                    false;


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

                    if (
                        material
                    ) {

                        material.needsUpdate =
                            true;

                    }

                }

            }

        );


        this.normalizeModel();


        this.model.rotation.y =

            PLAYER_CONFIG
                .modelRotationOffset;


        this.root.add(
            this.model
        );


        this.root.position.copy(
            spawnPosition
        );


        this.findImportantBones();


        this.mixer =
            new THREE.AnimationMixer(
                this.model
            );


        await this.loadAnimations();


        this.playFullLocomotion(
            "Idle",
            0
        );


        this.isLoaded =
            true;


        console.log(
            "[Player] ONLINE"
        );


        return this.root;

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

            return;

        }


        this.model.scale.setScalar(

            PLAYER_CONFIG.targetHeight /
            size.y

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


        this.model.updateMatrixWorld(
            true
        );

    }


    /* =====================================================
       BONE NAME NORMALIZATION
    ====================================================== */

    normalizeBoneName(
        name
    ) {

        return name
            .toLowerCase()
            .replace(
                /[^a-z0-9]/g,
                ""
            );

    }


    /* =====================================================
       FIND IMPORTANT BONES
    ====================================================== */

    findImportantBones() {

        const rightHandCandidates =
            [];


        const headCandidates =
            [];


        this.model.traverse(

            object => {

                if (
                    !object.isBone
                ) {

                    return;

                }


                const name =

                    this.normalizeBoneName(
                        object.name
                    );


                /* =========================================
                   RIGHT HAND
                ========================================= */

                if (
                    !name.includes(
                        "left"
                    )
                    &&
                    (
                        name.endsWith(
                            "righthand"
                        )
                        ||
                        name.includes(
                            "righthand"
                        )
                        ||
                        name.endsWith(
                            "handr"
                        )
                    )
                ) {

                    rightHandCandidates.push(
                        object
                    );

                }


                /* =========================================
                   HEAD
                ========================================= */

                if (
                    name.endsWith(
                        "head"
                    )
                    ||
                    name.includes(
                        "head"
                    )
                ) {

                    headCandidates.push(
                        object
                    );

                }

            }

        );


        this.rightHandBone =

            rightHandCandidates.find(

                bone => {

                    const name =

                        this.normalizeBoneName(
                            bone.name
                        );


                    return (

                        name ===
                        "mixamorigrighthand"

                        ||

                        name.endsWith(
                            "righthand"
                        )

                    );

                }

            )

            ||

            rightHandCandidates[0]

            ||

            null;


        this.headBone =

            headCandidates.find(

                bone => {

                    const name =

                        this.normalizeBoneName(
                            bone.name
                        );


                    return (

                        name ===
                        "mixamorighead"

                        ||

                        name.endsWith(
                            "head"
                        )

                    );

                }

            )

            ||

            headCandidates[0]

            ||

            null;


        console.log(

            "[Player] RightHand:",

            this.rightHandBone
                ?.name
                ??
                "NO ENCONTRADA"

        );


        console.log(

            "[Player] Head:",

            this.headBone
                ?.name
                ??
                "NO ENCONTRADA"

        );

    }


    /* =====================================================
       ROOT MOTION
    ====================================================== */

    removeRootMotion(
        clip
    ) {

        clip.tracks.forEach(

            track => {

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

                    return;

                }


                const values =
                    track.values;


                if (
                    values.length <
                    3
                ) {

                    return;

                }


                const firstX =
                    values[0];


                const firstZ =
                    values[2];


                for (
                    let i = 0;
                    i < values.length;
                    i += 3
                ) {

                    values[i] =
                        firstX;


                    values[i + 2] =
                        firstZ;

                }

            }

        );


        clip.resetDuration();


        return clip;

    }


    /* =====================================================
       TRACK FILTERS
    ====================================================== */

    isUpperBodyTrack(
        trackName
    ) {

        const name =
            trackName
                .toLowerCase();


        return (

            name.includes(
                "spine"
            )

            ||

            name.includes(
                "neck"
            )

            ||

            name.includes(
                "head"
            )

            ||

            name.includes(
                "shoulder"
            )

            ||

            name.includes(
                "arm"
            )

            ||

            name.includes(
                "forearm"
            )

            ||

            name.includes(
                "hand"
            )

        );

    }


    isLowerBodyTrack(
        trackName
    ) {

        const name =
            trackName
                .toLowerCase();


        return (

            name.includes(
                "hips"
            )

            ||

            name.includes(
                "pelvis"
            )

            ||

            name.includes(
                "upleg"
            )

            ||

            name.includes(
                "leg"
            )

            ||

            name.includes(
                "foot"
            )

            ||

            name.includes(
                "toe"
            )

            ||

            name.includes(
                "root"
            )

        );

    }


    /* =====================================================
       FILTERED CLIP
    ====================================================== */

    createFilteredClip(

        sourceClip,

        filterFunction,

        clipName

    ) {

        const tracks =

            sourceClip.tracks

                .filter(

                    track =>

                        filterFunction.call(

                            this,

                            track.name

                        )

                )

                .map(

                    track =>
                        track.clone()

                );


        if (
            tracks.length ===
            0
        ) {

            return null;

        }


        const clip =
            new THREE.AnimationClip(

                clipName,

                sourceClip.duration,

                tracks

            );


        clip.resetDuration();


        return clip;

    }


    /* =====================================================
       STATIC COMBAT POSE
    ====================================================== */

    createStaticPoseClip(

        sourceClip,

        fraction,

        clipName

    ) {

        const sampleTime =

            THREE.MathUtils.clamp(

                sourceClip.duration *
                fraction,

                0,

                Math.max(

                    0,

                    sourceClip.duration -
                    0.001

                )

            );


        const tracks =
            [];


        for (
            const sourceTrack
            of sourceClip.tracks
        ) {

            if (
                !this.isUpperBodyTrack(
                    sourceTrack.name
                )
            ) {

                continue;

            }


            const valueSize =

                sourceTrack
                    .getValueSize();


            const result =

                new Float32Array(
                    valueSize
                );


            const interpolant =

                sourceTrack
                    .createInterpolant(
                        result
                    );


            interpolant.evaluate(
                sampleTime
            );


            const values =

                new Float32Array(
                    valueSize *
                    2
                );


            for (
                let i = 0;
                i < valueSize;
                i++
            ) {

                values[i] =
                    result[i];


                values[
                    i +
                    valueSize
                ] =
                    result[i];

            }


            const TrackClass =
                sourceTrack
                    .constructor;


            const staticTrack =

                new TrackClass(

                    sourceTrack.name,

                    [
                        0,
                        1
                    ],

                    values

                );


            tracks.push(
                staticTrack
            );

        }


        if (
            tracks.length ===
            0
        ) {

            return null;

        }


        return new THREE.AnimationClip(

            clipName,

            1,

            tracks

        );

    }


    /* =====================================================
       LOAD ANIMATIONS
    ====================================================== */

    async loadAnimations() {

        for (
            const [
                name,
                path
            ]
            of Object.entries(
                PLAYER_PATHS.animations
            )
        ) {

            try {

                const fbx =
                    await this.loadFBX(
                        path
                    );


                if (
                    !fbx.animations
                    ||
                    fbx.animations.length ===
                    0
                ) {

                    console.warn(
                        `[Player] ${name}: sin animación.`
                    );


                    continue;

                }


                let clip =

                    fbx.animations[0]
                        .clone();


                clip =
                    this.removeRootMotion(
                        clip
                    );


                /* =========================================
                   LOCOMOTION
                ========================================= */

                if (
                    name === "Idle"
                    ||
                    name === "Walk"
                    ||
                    name === "Run"
                ) {

                    const fullClip =
                        clip.clone();


                    fullClip.name =
                        `${name}_Full`;


                    const fullAction =

                        this.mixer
                            .clipAction(
                                fullClip
                            );


                    fullAction.setLoop(

                        THREE.LoopRepeat,

                        Infinity

                    );


                    this.fullLocomotionActions.set(

                        name,

                        fullAction

                    );


                    const lowerClip =

                        this.createFilteredClip(

                            clip,

                            this.isLowerBodyTrack,

                            `${name}_Lower`

                        );


                    if (
                        lowerClip
                    ) {

                        const lowerAction =

                            this.mixer
                                .clipAction(
                                    lowerClip
                                );


                        lowerAction.setLoop(

                            THREE.LoopRepeat,

                            Infinity

                        );


                        this.lowerLocomotionActions.set(

                            name,

                            lowerAction

                        );

                    }

                }


                /* =========================================
                   UPPER BODY
                ========================================= */

                else if (
                    name === "Shoot"
                    ||
                    name === "Reload"
                    ||
                    name === "Hit"
                ) {

                    const upperClip =

                        this.createFilteredClip(

                            clip,

                            this.isUpperBodyTrack,

                            `${name}_Upper`

                        );


                    if (
                        upperClip
                    ) {

                        const action =

                            this.mixer
                                .clipAction(
                                    upperClip
                                );


                        action.setLoop(

                            THREE.LoopOnce,

                            1

                        );


                        action.clampWhenFinished =
                            true;


                        this.upperActions.set(

                            name,

                            action

                        );

                    }


                    /* =====================================
                       STATIC AIM POSE
                    ===================================== */

                    if (
                        name ===
                        "Shoot"
                    ) {

                        const staticPose =

                            this.createStaticPoseClip(

                                clip,

                                PLAYER_CONFIG
                                    .combatPoseFraction,

                                "CombatPose_Static"

                            );


                        if (
                            staticPose
                        ) {

                            this.combatPoseAction =

                                this.mixer
                                    .clipAction(
                                        staticPose
                                    );


                            this.combatPoseAction
                                .setLoop(

                                    THREE.LoopRepeat,

                                    Infinity

                                );

                        }

                    }

                }


                /* =========================================
                   DEATH
                ========================================= */

                else if (
                    name ===
                    "Death"
                ) {

                    clip.name =
                        "Death_Full";


                    this.deathAction =

                        this.mixer
                            .clipAction(
                                clip
                            );


                    this.deathAction.setLoop(

                        THREE.LoopOnce,

                        1

                    );


                    this.deathAction
                        .clampWhenFinished =
                        true;

                }

            }

            catch (
                error
            ) {

                console.error(

                    `[Player] ${name}:`,

                    error

                );

            }

        }


        /* =================================================
           MIXER FINISHED EVENTS
        ================================================= */

        this.mixer.addEventListener(

            "finished",

            event => {

                /* =========================================
                   DEATH FINISHED
                ========================================= */

                if (
                    this.deathAction
                    &&
                    event.action ===
                    this.deathAction
                ) {

                    console.log(
                        "[Player] Death animation terminada."
                    );


                    if (
                        typeof this.deathFinishedHandler ===
                        "function"
                    ) {

                        this.deathFinishedHandler();

                    }


                    return;

                }


                /* =========================================
                   UPPER ACTION FINISHED
                ========================================= */

                if (
                    this.upperBusy
                    &&
                    event.action ===
                    this.currentUpperAction
                ) {

                    this.finishUpperAction();

                }

            }

        );

    }


    /* =====================================================
       COMBAT
    ====================================================== */

    isCombatPose() {

        return (

            this.firstPersonMode

            ||

            this.aiming

        );

    }


    playCombatPose() {

        if (
            !this.combatPoseAction
            ||
            this.combatPoseActive
            ||
            this.upperBusy
            ||
            this.dead
        ) {

            return;

        }


        this.combatPoseAction.reset();


        this.combatPoseAction.enabled =
            true;


        this.combatPoseAction
            .setEffectiveWeight(
                1
            );


        this.combatPoseAction
            .fadeIn(
                0.10
            );


        this.combatPoseAction.play();


        this.combatPoseActive =
            true;

    }


    stopCombatPose() {

        if (
            !this.combatPoseAction
            ||
            !this.combatPoseActive
        ) {

            return;

        }


        this.combatPoseAction
            .fadeOut(
                0.10
            );


        this.combatPoseActive =
            false;

    }


    /* =====================================================
       FULL LOCOMOTION
    ====================================================== */

    playFullLocomotion(

        name,

        fadeDuration = 0.15

    ) {

        if (
            this.dead
        ) {

            return;

        }


        const nextAction =

            this.fullLocomotionActions
                .get(
                    name
                );


        if (
            !nextAction
        ) {

            return;

        }


        if (
            this.locomotionMode ===
            "full"
            &&
            this.currentLocomotion ===
            name
            &&
            this.currentFullAction ===
            nextAction
        ) {

            return;

        }


        let previousTime =
            0;


        if (
            this.currentLowerAction
        ) {

            previousTime =
                this.currentLowerAction.time;

        }

        else if (
            this.currentFullAction
        ) {

            previousTime =
                this.currentFullAction.time;

        }


        if (
            this.currentLowerAction
        ) {

            this.currentLowerAction
                .fadeOut(
                    fadeDuration
                );

        }


        if (
            this.currentFullAction
            &&
            this.currentFullAction !==
            nextAction
        ) {

            this.currentFullAction
                .fadeOut(
                    fadeDuration
                );

        }


        nextAction.reset();


        const duration =

            nextAction
                .getClip()
                .duration;


        if (
            duration >
            0
        ) {

            nextAction.time =

                previousTime %
                duration;

        }


        nextAction.enabled =
            true;


        nextAction
            .setEffectiveWeight(
                1
            );


        nextAction
            .fadeIn(
                fadeDuration
            );


        nextAction.play();


        this.currentFullAction =
            nextAction;


        this.currentLowerAction =
            null;


        this.currentLocomotion =
            name;


        this.locomotionMode =
            "full";

    }


    /* =====================================================
       LOWER LOCOMOTION
    ====================================================== */

    playLowerLocomotion(

        name,

        fadeDuration = 0.10

    ) {

        if (
            this.dead
        ) {

            return;

        }


        const nextAction =

            this.lowerLocomotionActions
                .get(
                    name
                );


        if (
            !nextAction
        ) {

            return;

        }


        if (
            this.locomotionMode ===
            "lower"
            &&
            this.currentLocomotion ===
            name
            &&
            this.currentLowerAction ===
            nextAction
        ) {

            return;

        }


        let previousTime =
            0;


        if (
            this.currentFullAction
        ) {

            previousTime =
                this.currentFullAction.time;

        }

        else if (
            this.currentLowerAction
        ) {

            previousTime =
                this.currentLowerAction.time;

        }


        if (
            this.currentFullAction
        ) {

            this.currentFullAction
                .fadeOut(
                    fadeDuration
                );

        }


        if (
            this.currentLowerAction
            &&
            this.currentLowerAction !==
            nextAction
        ) {

            this.currentLowerAction
                .fadeOut(
                    fadeDuration
                );

        }


        nextAction.reset();


        const duration =

            nextAction
                .getClip()
                .duration;


        if (
            duration >
            0
        ) {

            nextAction.time =

                previousTime %
                duration;

        }


        nextAction.enabled =
            true;


        nextAction
            .setEffectiveWeight(
                1
            );


        nextAction
            .fadeIn(
                fadeDuration
            );


        nextAction.play();


        this.currentLowerAction =
            nextAction;


        this.currentFullAction =
            null;


        this.currentLocomotion =
            name;


        this.locomotionMode =
            "lower";

    }


    /* =====================================================
       LOCOMOTION
    ====================================================== */

    getLocomotionState() {

        if (
            !this.isMoving()
        ) {

            return "Idle";

        }


        return this.keys.run

            ?

            "Run"

            :

            "Walk";

    }


    updateLocomotionAnimation() {

        if (
            this.movementLocked
            ||
            this.dead
        ) {

            return;

        }


        const state =
            this.getLocomotionState();


        if (
            this.upperBusy
            ||
            this.isCombatPose()
        ) {

            this.playLowerLocomotion(
                state
            );


            if (
                !this.upperBusy
            ) {

                this.playCombatPose();

            }

        }

        else {

            this.stopCombatPose();


            this.playFullLocomotion(
                state
            );

        }

    }


    /* =====================================================
       UPPER BODY ACTION
    ====================================================== */

    playUpperOneShot(
        name
    ) {

        if (
            !this.enabled
            ||
            !this.isLoaded
            ||
            this.movementLocked
            ||
            this.dead
        ) {

            return;

        }


        const action =

            this.upperActions
                .get(
                    name
                );


        if (
            !action
        ) {

            console.warn(
                `[Player] Animación ${name} no disponible.`
            );


            return;

        }


        /* =================================================
           HIT PRIORITY

           Hit interrumpe Shoot o Reload.
        ================================================= */

        if (
            name ===
            "Hit"
            &&
            this.upperBusy
        ) {

            if (
                this.currentUpperAction
            ) {

                this.currentUpperAction
                    .fadeOut(
                        0.04
                    );

            }


            this.currentUpperAction =
                null;


            this.currentUpperAnimation =
                null;


            this.upperBusy =
                false;

        }


        /* =================================================
           NORMAL BUSY BEHAVIOUR
        ================================================= */

        if (
            this.upperBusy
        ) {

            if (
                name ===
                "Shoot"
                &&
                this.currentUpperAnimation ===
                "Shoot"
            ) {

                action.reset();

                action.play();

            }


            return;

        }


        this.stopCombatPose();


        this.upperBusy =
            true;


        this.playLowerLocomotion(

            this.getLocomotionState(),

            name ===
            "Hit"

                ?

                0.035

                :

                0.06

        );


        action.reset();


        action.enabled =
            true;


        action.setEffectiveWeight(
            1
        );


        action.fadeIn(

            name ===
            "Hit"

                ?

                0.035

                :

                0.06

        );


        action.play();


        this.currentUpperAction =
            action;


        this.currentUpperAnimation =
            name;


        if (
            name ===
            "Hit"
        ) {

            console.log(
                "[Player] HIT animation."
            );

        }

    }


    finishUpperAction() {

        if (
            this.dead
        ) {

            return;

        }


        if (
            this.currentUpperAction
        ) {

            this.currentUpperAction
                .fadeOut(
                    0.08
                );

        }


        this.upperBusy =
            false;


        this.currentUpperAction =
            null;


        this.currentUpperAnimation =
            null;


        if (
            this.isCombatPose()
        ) {

            this.playLowerLocomotion(

                this.getLocomotionState(),

                0.08

            );


            this.playCombatPose();

        }

        else {

            this.playFullLocomotion(

                this.getLocomotionState(),

                0.12

            );

        }

    }


    /* =====================================================
       ACTIONS
    ====================================================== */

    shoot() {

        this.playUpperOneShot(
            "Shoot"
        );

    }


    reload() {

        this.playUpperOneShot(
            "Reload"
        );

    }


    hit() {

        if (
            this.dead
            ||
            this.movementLocked
            ||
            !this.isLoaded
        ) {

            return;

        }


        this.playUpperOneShot(
            "Hit"
        );

    }


    /* =====================================================
       AIM
    ====================================================== */

    setAimState(

        aiming,

        direction

    ) {

        if (
            this.dead
        ) {

            return;

        }


        const changed =

            aiming !==
            this.aiming;


        this.aiming =
            aiming;


        if (
            direction
        ) {

            this.aimDirection.copy(
                direction
            );


            this.aimDirection.y =
                0;


            if (
                this.aimDirection
                    .lengthSq() >
                0.0001
            ) {

                this.aimDirection
                    .normalize();

            }

        }


        if (
            changed
        ) {

            this.refreshCombatState();

        }

    }


    /* =====================================================
       FIRST PERSON
    ====================================================== */

    setFirstPersonMode(
        enabled
    ) {

        /*
         * Si está muerto el modelo debe ser visible
         * para reproducir Death.
         */
        if (
            this.dead
        ) {

            this.firstPersonMode =
                false;


            if (
                this.model
            ) {

                this.model.visible =
                    true;

            }


            return;

        }


        this.firstPersonMode =
            enabled;


        if (
            this.model
        ) {

            /*
             * En FPS ocultamos el cuerpo.
             */
            this.model.visible =
                !enabled;

        }


        this.refreshCombatState();

    }


    refreshCombatState() {

        if (
            !this.isLoaded
            ||
            this.upperBusy
            ||
            this.dead
        ) {

            return;

        }


        const state =
            this.getLocomotionState();


        if (
            this.isCombatPose()
        ) {

            this.playLowerLocomotion(

                state,

                0.08

            );


            this.playCombatPose();

        }

        else {

            this.stopCombatPose();


            this.playFullLocomotion(

                state,

                0.12

            );

        }

    }


    /* =====================================================
       ROTATION
    ====================================================== */

    rotateTowardDirection(

        direction,

        deltaTime

    ) {

        if (
            !direction
            ||
            direction.lengthSq() <
            0.0001
        ) {

            return;

        }


        const angle =

            Math.atan2(

                direction.x,

                direction.z

            );


        this.rotationEuler.set(

            0,

            angle,

            0

        );


        this.targetQuaternion
            .setFromEuler(
                this.rotationEuler
            );


        const alpha =

            1 -

            Math.exp(

                -PLAYER_CONFIG.rotationSpeed *
                deltaTime

            );


        this.root.quaternion.slerp(

            this.targetQuaternion,

            alpha

        );

    }


    /* =====================================================
       INPUT
    ====================================================== */

    setupInput() {

        window.addEventListener(

            "keydown",

            event => {

                switch (
                    event.code
                ) {

                    case "KeyW":

                        this.keys.forward =
                            true;

                        break;


                    case "KeyS":

                        this.keys.backward =
                            true;

                        break;


                    case "KeyA":

                        this.keys.left =
                            true;

                        break;


                    case "KeyD":

                        this.keys.right =
                            true;

                        break;


                    case "ShiftLeft":

                    case "ShiftRight":

                        this.keys.run =
                            true;

                        break;

                }

            }

        );


        window.addEventListener(

            "keyup",

            event => {

                switch (
                    event.code
                ) {

                    case "KeyW":

                        this.keys.forward =
                            false;

                        break;


                    case "KeyS":

                        this.keys.backward =
                            false;

                        break;


                    case "KeyA":

                        this.keys.left =
                            false;

                        break;


                    case "KeyD":

                        this.keys.right =
                            false;

                        break;


                    case "ShiftLeft":

                    case "ShiftRight":

                        this.keys.run =
                            false;

                        break;

                }

            }

        );


        window.addEventListener(

            "blur",

            () => {

                this.resetKeys();

            }

        );

    }


    resetKeys() {

        this.keys.forward =
            false;


        this.keys.backward =
            false;


        this.keys.left =
            false;


        this.keys.right =
            false;


        this.keys.run =
            false;

    }


    setEnabled(
        enabled
    ) {

        this.enabled =

            enabled

            &&

            !this.dead;


        if (
            !this.enabled
        ) {

            this.resetKeys();

        }

    }


    isMoving() {

        return (

            this.keys.forward

            ||

            this.keys.backward

            ||

            this.keys.left

            ||

            this.keys.right

        );

    }


    /* =====================================================
       MOVEMENT
    ====================================================== */

    updateMovement(

        deltaTime,

        cameraForward,

        cameraRight

    ) {

        this.desiredMovement.set(
            0,
            0,
            0
        );


        if (
            !this.enabled
            ||
            !this.isLoaded
            ||
            this.movementLocked
            ||
            this.dead
        ) {

            return;

        }


        let forwardInput =
            0;


        let sideInput =
            0;


        if (
            this.keys.forward
        ) {

            forwardInput +=
                1;

        }


        if (
            this.keys.backward
        ) {

            forwardInput -=
                1;

        }


        if (
            this.keys.right
        ) {

            sideInput +=
                1;

        }


        if (
            this.keys.left
        ) {

            sideInput -=
                1;

        }


        const hasMovement =

            forwardInput !==
            0

            ||

            sideInput !==
            0;


        if (
            hasMovement
        ) {

            this.forwardVector.copy(
                cameraForward
            );


            this.rightVector.copy(
                cameraRight
            );


            this.forwardVector.y =
                0;


            this.rightVector.y =
                0;


            this.forwardVector
                .normalize();


            this.rightVector
                .normalize();


            this.moveDirection.set(
                0,
                0,
                0
            );


            this.moveDirection
                .addScaledVector(

                    this.forwardVector,

                    forwardInput

                );


            this.moveDirection
                .addScaledVector(

                    this.rightVector,

                    sideInput

                );


            this.moveDirection
                .normalize();


            const speed =

                this.keys.run

                    ?

                    PLAYER_CONFIG.runSpeed

                    :

                    PLAYER_CONFIG.walkSpeed;


            this.desiredMovement
                .copy(
                    this.moveDirection
                )
                .multiplyScalar(

                    speed *
                    deltaTime

                );

        }


        /* =================================================
           ROTATION
        ================================================= */

        if (
            this.isCombatPose()
        ) {

            this.rotateTowardDirection(

                this.aimDirection,

                deltaTime

            );

        }

        else if (
            hasMovement
        ) {

            this.rotateTowardDirection(

                this.moveDirection,

                deltaTime

            );

        }


        this.updateLocomotionAnimation();

    }


    /* =====================================================
       DEATH
    ====================================================== */

    die() {

        if (
            this.dead
        ) {

            return false;

        }


        if (
            !this.deathAction
        ) {

            console.warn(
                "[Player] Death animation no disponible."
            );


            return false;

        }


        console.log(
            "[Player] DEATH animation."
        );


        this.dead =
            true;


        this.movementLocked =
            true;


        this.enabled =
            false;


        this.desiredMovement.set(
            0,
            0,
            0
        );


        this.moveDirection.set(
            0,
            0,
            0
        );


        this.resetKeys();


        /* =================================================
           SI MUERE EN FPS, MOSTRAR CUERPO
        ================================================= */

        this.firstPersonMode =
            false;


        this.aiming =
            false;


        if (
            this.model
        ) {

            this.model.visible =
                true;

        }


        this.stopCombatPose();


        if (
            this.currentFullAction
        ) {

            this.currentFullAction
                .fadeOut(
                    0.10
                );

        }


        if (
            this.currentLowerAction
        ) {

            this.currentLowerAction
                .fadeOut(
                    0.10
                );

        }


        if (
            this.currentUpperAction
        ) {

            this.currentUpperAction
                .fadeOut(
                    0.06
                );

        }


        this.upperBusy =
            false;


        this.currentUpperAction =
            null;


        this.currentUpperAnimation =
            null;


        /* =================================================
           PLAY DEATH
        ================================================= */

        this.deathAction.reset();


        this.deathAction.enabled =
            true;


        this.deathAction
            .setEffectiveWeight(
                1
            );


        this.deathAction
            .fadeIn(
                0.10
            );


        this.deathAction.play();


        return true;

    }


    /* =====================================================
       DEATH CALLBACK
    ====================================================== */

    setDeathFinishedHandler(
        handler
    ) {

        this.deathFinishedHandler =
            handler;

    }


    getDeathDuration() {

        if (
            !this.deathAction
        ) {

            return 0;

        }


        return this.deathAction
            .getClip()
            .duration;

    }


    /* =====================================================
       ANIMATION ONLY

       Se usa mientras el estado es DYING.
    ====================================================== */

    updateAnimationOnly(
        deltaTime
    ) {

        if (
            !this.isLoaded
            ||
            !this.mixer
        ) {

            return;

        }


        this.mixer.update(
            deltaTime
        );

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update(

        deltaTime,

        cameraForward,

        cameraRight

    ) {

        if (
            !this.isLoaded
        ) {

            return;

        }


        if (
            this.mixer
        ) {

            this.mixer.update(
                deltaTime
            );

        }


        this.updateMovement(

            deltaTime,

            cameraForward,

            cameraRight

        );

    }


    /* =====================================================
       GETTERS
    ====================================================== */

    isDead() {

        return this.dead;

    }


    getDesiredMovement() {

        return this.desiredMovement;

    }


    getHeight() {

        return PLAYER_CONFIG.targetHeight;

    }


    getPosition() {

        return this.root.position;

    }


    getObject() {

        return this.root;

    }


    getModel() {

        return this.model;

    }


    getRightHandBone() {

        return this.rightHandBone;

    }


    getHeadBone() {

        return this.headBone;

    }


    getIsLoaded() {

        return this.isLoaded;

    }

}
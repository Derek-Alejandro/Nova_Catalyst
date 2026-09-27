/* =========================================================
   NOVA CATALYST
   Player Controller

   Build v0.4
   Dynamic Layered Animation System
========================================================= */


import * as THREE from "three";


import {

    FBXLoader

} from "three/addons/loaders/FBXLoader.js";



/* =========================================================
   CONFIGURACIÓN
========================================================= */

const PLAYER_CONFIG = {

    targetHeight:
        1.8,

    walkSpeed:
        2.6,

    runSpeed:
        5.2,

    rotationSpeed:
        10,

    modelRotationOffset:
        0

};



/* =========================================================
   RUTAS
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


    constructor(
        scene
    ) {

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



        /* =================================================
           MODELO
        ================================================= */

        this.model =
            null;



        /* =================================================
           MIXER
        ================================================= */

        this.mixer =
            null;



        /* =================================================
           LOCOMOCIÓN FULL BODY

           Se utiliza normalmente:

           Idle
           Walk
           Run
        ================================================= */

        this.fullLocomotionActions =
            new Map();


        this.currentFullAction =
            null;



        /* =================================================
           LOCOMOCIÓN LOWER BODY

           Solo se utiliza mientras Shoot,
           Reload o Hit están activos.
        ================================================= */

        this.lowerLocomotionActions =
            new Map();


        this.currentLowerAction =
            null;



        /* =================================================
           ACCIONES UPPER BODY
        ================================================= */

        this.upperActions =
            new Map();


        this.currentUpperAction =
            null;


        this.currentUpperAnimation =
            null;


        this.upperBusy =
            false;



        /* =================================================
           LOCOMOCIÓN ACTUAL
        ================================================= */

        this.currentLocomotion =
            "Idle";


        this.locomotionMode =
            "full";



        /* =================================================
           MUERTE
        ================================================= */

        this.deathAction =
            null;



        /* =================================================
           ESTADO
        ================================================= */

        this.enabled =
            false;


        this.isLoaded =
            false;


        this.movementLocked =
            false;



        /* =================================================
           INPUT
        ================================================= */

        this.keys = {

            forward:
                false,

            backward:
                false,

            left:
                false,

            right:
                false,

            run:
                false

        };



        /* =================================================
           MOVIMIENTO
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
       CARGADOR FBX
    ====================================================== */

    loadFBX(
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



    /* =====================================================
       CARGAR JUGADOR
    ====================================================== */

    async load(
        spawnPosition
    ) {

        console.log(
            "[Player] Cargando jugador..."
        );


        this.model =

            await this.loadFBX(

                PLAYER_PATHS.model

            );


        this.model.name =
            "Player_Visual";



        /* =================================================
           SOMBRAS

           También funciona con SkinnedMesh.
        ================================================= */

        this.model.traverse(

            object => {

                if (
                    object.isMesh
                ) {

                    object.castShadow =
                        true;


                    object.receiveShadow =
                        true;


                    /*
                     * Evita problemas ocasionales
                     * con bounds de modelos animados.
                     */

                    object.frustumCulled =
                        false;


                    if (
                        object.material
                    ) {

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

                            material.needsUpdate =
                                true;

                        }

                    }

                }

            }

        );



        /* =================================================
           ESCALA
        ================================================= */

        this.normalizeModel();



        this.model.rotation.y =

            PLAYER_CONFIG
                .modelRotationOffset;



        this.root.add(
            this.model
        );



        /* =================================================
           SPAWN
        ================================================= */

        this.root.position.copy(

            spawnPosition

        );



        /* =================================================
           MIXER
        ================================================= */

        this.mixer =

            new THREE.AnimationMixer(

                this.model

            );



        /* =================================================
           ANIMACIONES
        ================================================= */

        await this.loadAnimations();



        /* =================================================
           IDLE COMPLETO INICIAL
        ================================================= */

        this.playFullLocomotion(

            "Idle",

            0

        );



        this.isLoaded =
            true;



        console.log(
            "[Player] Jugador listo."
        );


        console.log(
            "[Player] Locomoción dinámica por capas ONLINE."
        );



        return this.root;

    }



    /* =====================================================
       NORMALIZAR MODELO
    ====================================================== */

    normalizeModel() {

        this.model.scale.set(
            1,
            1,
            1
        );


        this.model.updateMatrixWorld(
            true
        );


        const box =

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

            console.warn(
                "[Player] Altura inválida."
            );


            return;

        }


        const scaleFactor =

            PLAYER_CONFIG.targetHeight /
            size.y;


        this.model.scale.setScalar(

            scaleFactor

        );


        this.model.updateMatrixWorld(
            true
        );


        const scaledBox =

            new THREE.Box3()
                .setFromObject(
                    this.model
                );


        this.model.position.y -=

            scaledBox.min.y;


        this.model.updateMatrixWorld(
            true
        );


        console.log(

            "[Player] Altura normalizada:",

            PLAYER_CONFIG.targetHeight

        );

    }



    /* =====================================================
       ELIMINAR ROOT MOTION
    ====================================================== */

    removeRootMotion(
        clip
    ) {

        clip.tracks.forEach(

            track => {

                const trackName =

                    track.name
                        .toLowerCase();


                const isPositionTrack =

                    trackName.endsWith(
                        ".position"
                    );


                const isRootBone =

                    trackName.includes(
                        "hips"
                    )

                    ||

                    trackName.includes(
                        "root"
                    );


                if (

                    !isPositionTrack ||

                    !isRootBone

                ) {

                    return;

                }


                const values =
                    track.values;


                if (
                    values.length < 3
                ) {

                    return;

                }


                const initialX =
                    values[0];


                const initialZ =
                    values[2];


                for (

                    let i = 0;

                    i < values.length;

                    i += 3

                ) {

                    values[i] =
                        initialX;


                    /*
                     * Y permanece intacta.
                     */


                    values[i + 2] =
                        initialZ;

                }

            }

        );


        clip.resetDuration();


        return clip;

    }



    /* =====================================================
       HUESOS DEL TORSO
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



    /* =====================================================
       HUESOS INFERIORES
    ====================================================== */

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
       CREAR CLIP FILTRADO
    ====================================================== */

    createFilteredClip(

        sourceClip,

        filterFunction,

        newName

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
            tracks.length === 0
        ) {

            console.warn(

                `[Player] ${newName}: 0 tracks encontrados.`

            );


            return null;

        }


        const clip =

            new THREE.AnimationClip(

                newName,

                sourceClip.duration,

                tracks

            );


        clip.resetDuration();


        return clip;

    }



    /* =====================================================
       CARGAR ANIMACIONES
    ====================================================== */

    async loadAnimations() {

        const entries =

            Object.entries(

                PLAYER_PATHS.animations

            );


        for (

            const [
                name,
                path
            ]

            of entries

        ) {

            try {

                const animationFBX =

                    await this.loadFBX(
                        path
                    );


                if (

                    !animationFBX.animations ||

                    animationFBX.animations.length === 0

                ) {

                    console.warn(

                        `[Player] ${name} sin animación.`

                    );


                    continue;

                }


                let originalClip =

                    animationFBX
                        .animations[0];


                originalClip =

                    this.removeRootMotion(

                        originalClip

                    );


                /* =================================================
                   IDLE / WALK / RUN

                   Creamos DOS versiones:

                   1. Full Body
                   2. Lower Body
                ================================================= */

                if (

                    name === "Idle" ||

                    name === "Walk" ||

                    name === "Run"

                ) {

                    /* =============================================
                       FULL BODY
                    ============================================= */

                    const fullClip =

                        originalClip.clone();


                    fullClip.name =

                        `${name}_Full`;


                    const fullAction =

                        this.mixer.clipAction(

                            fullClip

                        );


                    fullAction.setLoop(

                        THREE.LoopRepeat,

                        Infinity

                    );


                    fullAction.clampWhenFinished =
                        false;


                    this.fullLocomotionActions.set(

                        name,

                        fullAction

                    );



                    /* =============================================
                       LOWER BODY
                    ============================================= */

                    const lowerClip =

                        this.createFilteredClip(

                            originalClip,

                            this.isLowerBodyTrack,

                            `${name}_Lower`

                        );


                    if (
                        lowerClip
                    ) {

                        const lowerAction =

                            this.mixer.clipAction(

                                lowerClip

                            );


                        lowerAction.setLoop(

                            THREE.LoopRepeat,

                            Infinity

                        );


                        lowerAction.clampWhenFinished =
                            false;


                        this.lowerLocomotionActions.set(

                            name,

                            lowerAction

                        );

                    }

                }



                /* =================================================
                   SHOOT / RELOAD / HIT

                   Solo torso.
                ================================================= */

                else if (

                    name === "Shoot" ||

                    name === "Reload" ||

                    name === "Hit"

                ) {

                    const upperClip =

                        this.createFilteredClip(

                            originalClip,

                            this.isUpperBodyTrack,

                            `${name}_Upper`

                        );


                    if (
                        !upperClip
                    ) {

                        continue;

                    }


                    const action =

                        this.mixer.clipAction(

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



                /* =================================================
                   DEATH = FULL BODY
                ================================================= */

                else if (
                    name === "Death"
                ) {

                    originalClip.name =
                        "Death_Full";


                    this.deathAction =

                        this.mixer.clipAction(

                            originalClip

                        );


                    this.deathAction.setLoop(

                        THREE.LoopOnce,

                        1

                    );


                    this.deathAction.clampWhenFinished =
                        true;

                }


                console.log(

                    `[Player] ${name} procesada.`

                );

            }

            catch (
                error
            ) {

                console.error(

                    `[Player] Error cargando ${name}:`,

                    error

                );

            }

        }



        /* =================================================
           FINALIZACIÓN DE SHOOT / RELOAD / HIT
        ================================================= */

        this.mixer.addEventListener(

            "finished",

            event => {

                if (

                    this.deathAction &&

                    event.action ===
                    this.deathAction

                ) {

                    return;

                }


                if (

                    this.upperBusy &&

                    event.action ===
                    this.currentUpperAction

                ) {

                    this.finishUpperAction();

                }

            }

        );

    }



    /* =====================================================
       FULL BODY LOCOMOTION

       Es el estado NORMAL del personaje.
    ====================================================== */

    playFullLocomotion(

        name,

        fadeDuration = 0.15

    ) {

        const nextAction =

            this.fullLocomotionActions.get(
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



        /* =================================================
           CONSERVAR FASE DE ANIMACIÓN

           Evita que las piernas "salten"
           al cambiar de modo.
        ================================================= */

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

            this.currentLowerAction.fadeOut(

                fadeDuration

            );

        }


        if (

            this.currentFullAction &&

            this.currentFullAction !==
                nextAction

        ) {

            this.currentFullAction.fadeOut(

                fadeDuration

            );

        }



        nextAction.reset();


        const duration =

            nextAction
                .getClip()
                .duration;


        if (
            duration > 0
        ) {

            nextAction.time =

                previousTime %
                duration;

        }


        nextAction.enabled =
            true;


        nextAction.setEffectiveWeight(
            1
        );


        nextAction.setEffectiveTimeScale(
            1
        );


        nextAction.fadeIn(
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
       LOWER BODY LOCOMOTION

       Se activa únicamente durante una
       acción de torso.
    ====================================================== */

    playLowerLocomotion(

        name,

        fadeDuration = 0.10

    ) {

        const nextAction =

            this.lowerLocomotionActions.get(
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

            this.currentFullAction.fadeOut(

                fadeDuration

            );

        }


        if (

            this.currentLowerAction &&

            this.currentLowerAction !==
                nextAction

        ) {

            this.currentLowerAction.fadeOut(

                fadeDuration

            );

        }



        nextAction.reset();


        const duration =

            nextAction
                .getClip()
                .duration;


        if (
            duration > 0
        ) {

            nextAction.time =

                previousTime %
                duration;

        }


        nextAction.enabled =
            true;


        nextAction.setEffectiveWeight(
            1
        );


        nextAction.setEffectiveTimeScale(
            1
        );


        nextAction.fadeIn(
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
       ESTADO DE LOCOMOCIÓN ACTUAL
    ====================================================== */

    getLocomotionState() {

        if (
            !this.isMoving()
        ) {

            return "Idle";

        }


        if (
            this.keys.run
        ) {

            return "Run";

        }


        return "Walk";

    }



    /* =====================================================
       ACTUALIZAR LOCOMOCIÓN
    ====================================================== */

    updateLocomotionAnimation() {

        if (
            this.movementLocked
        ) {

            return;

        }


        const state =

            this.getLocomotionState();



        /*
         * Si estamos disparando/recargando:
         * solo controlamos piernas.
         */

        if (
            this.upperBusy
        ) {

            this.playLowerLocomotion(

                state

            );

        }


        /*
         * Estado normal:
         * animación completa y natural.
         */

        else {

            this.playFullLocomotion(

                state

            );

        }

    }



    /* =====================================================
       UPPER BODY ONE-SHOT
    ====================================================== */

    playUpperOneShot(
        name
    ) {

        if (

            !this.enabled ||

            !this.isLoaded ||

            this.movementLocked

        ) {

            return;

        }


        const action =

            this.upperActions.get(
                name
            );


        if (
            !action
        ) {

            return;

        }


        if (
            this.upperBusy
        ) {

            return;

        }



        this.upperBusy =
            true;



        /* =================================================
           CAMBIAMOS DE FULL BODY A LOWER BODY
        ================================================= */

        this.playLowerLocomotion(

            this.getLocomotionState(),

            0.08

        );



        /* =================================================
           UPPER ACTION
        ================================================= */

        action.reset();


        action.enabled =
            true;


        action.setEffectiveWeight(
            1
        );


        action.setEffectiveTimeScale(
            1
        );


        action.fadeIn(
            0.08
        );


        action.play();



        this.currentUpperAction =
            action;


        this.currentUpperAnimation =
            name;

    }



    /* =====================================================
       TERMINAR UPPER ACTION
    ====================================================== */

    finishUpperAction() {

        if (
            this.currentUpperAction
        ) {

            this.currentUpperAction.fadeOut(
                0.10
            );

        }


        this.upperBusy =
            false;


        this.currentUpperAction =
            null;


        this.currentUpperAnimation =
            null;



        /*
         * Volvemos inmediatamente a
         * la animación FULL BODY normal.
         */

        this.playFullLocomotion(

            this.getLocomotionState(),

            0.12

        );

    }



    /* =====================================================
       SHOOT
    ====================================================== */

    shoot() {

        this.playUpperOneShot(
            "Shoot"
        );

    }



    /* =====================================================
       RELOAD
    ====================================================== */

    reload() {

        this.playUpperOneShot(
            "Reload"
        );

    }



    /* =====================================================
       HIT
    ====================================================== */

    hit() {

        this.playUpperOneShot(
            "Hit"
        );

    }



    /* =====================================================
       DEATH
    ====================================================== */

    die() {

        if (

            !this.isLoaded ||

            !this.deathAction

        ) {

            return;

        }


        this.movementLocked =
            true;


        this.enabled =
            false;


        this.resetKeys();



        if (
            this.currentFullAction
        ) {

            this.currentFullAction.fadeOut(
                0.15
            );

        }


        if (
            this.currentLowerAction
        ) {

            this.currentLowerAction.fadeOut(
                0.15
            );

        }


        if (
            this.currentUpperAction
        ) {

            this.currentUpperAction.fadeOut(
                0.15
            );

        }



        this.deathAction.reset();


        this.deathAction.enabled =
            true;


        this.deathAction.setEffectiveWeight(
            1
        );


        this.deathAction.fadeIn(
            0.15
        );


        this.deathAction.play();

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


                    case "KeyR":

                        if (
                            !event.repeat
                        ) {

                            this.reload();

                        }

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

            "mousedown",

            event => {

                if (
                    event.button === 0
                ) {

                    this.shoot();

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



    /* =====================================================
       INPUT RESET
    ====================================================== */

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



    /* =====================================================
       ENABLE
    ====================================================== */

    setEnabled(
        enabled
    ) {

        this.enabled =
            enabled;


        if (
            !enabled
        ) {

            this.resetKeys();

        }

    }



    /* =====================================================
       MOVIMIENTO ACTIVO
    ====================================================== */

    isMoving() {

        return (

            this.keys.forward ||

            this.keys.backward ||

            this.keys.left ||

            this.keys.right

        );

    }



    /* =====================================================
       MOVIMIENTO
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

            !this.enabled ||

            !this.isLoaded ||

            this.movementLocked

        ) {

            return;

        }



        let forwardInput =
            0;


        let rightInput =
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

            rightInput +=
                1;

        }


        if (
            this.keys.left
        ) {

            rightInput -=
                1;

        }



        /* =================================================
           SIN MOVIMIENTO
        ================================================= */

        if (

            forwardInput === 0 &&

            rightInput === 0

        ) {

            this.updateLocomotionAnimation();


            return;

        }



        /* =================================================
           DIRECCIONES DE CÁMARA
        ================================================= */

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


        this.forwardVector.normalize();


        this.rightVector.normalize();



        /* =================================================
           DIRECCIÓN
        ================================================= */

        this.moveDirection.set(

            0,

            0,

            0

        );


        this.moveDirection.addScaledVector(

            this.forwardVector,

            forwardInput

        );


        this.moveDirection.addScaledVector(

            this.rightVector,

            rightInput

        );


        this.moveDirection.normalize();



        /* =================================================
           VELOCIDAD
        ================================================= */

        const speed =

            this.keys.run

                ?

                PLAYER_CONFIG.runSpeed

                :

                PLAYER_CONFIG.walkSpeed;



        /* =================================================
           MOVIMIENTO PARA RAPIER
        ================================================= */

        this.desiredMovement

            .copy(
                this.moveDirection
            )

            .multiplyScalar(

                speed *
                deltaTime

            );



        /* =================================================
           ROTACIÓN
        ================================================= */

        const angle =

            Math.atan2(

                this.moveDirection.x,

                this.moveDirection.z

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


        const rotationAlpha =

            1 -

            Math.exp(

                -PLAYER_CONFIG.rotationSpeed *
                deltaTime

            );


        this.root.quaternion.slerp(

            this.targetQuaternion,

            rotationAlpha

        );



        /* =================================================
           ANIMACIÓN
        ================================================= */

        this.updateLocomotionAnimation();

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


    getCurrentAnimation() {

        return {

            locomotion:
                this.currentLocomotion,

            mode:
                this.locomotionMode,

            upper:
                this.currentUpperAnimation

        };

    }


    getIsLoaded() {

        return this.isLoaded;

    }


}
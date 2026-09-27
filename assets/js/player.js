/* =========================================================
   NOVA CATALYST
   Player Controller

   Build v0.4
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
           MODEL
        ================================================= */

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


        this.currentAnimation =
            null;


        this.lockedAction =
            false;



        /* =================================================
           STATE
        ================================================= */

        this.enabled =
            false;


        this.isLoaded =
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

                    object => {

                        resolve(
                            object
                        );

                    },

                    undefined,

                    error => {

                        reject(
                            error
                        );

                    }

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



        this.model =

            await this.loadFBX(

                PLAYER_PATHS.model

            );



        this.model.name =
            "Player_Visual";



        /* =================================================
           SHADOWS
        ================================================= */

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



                if (
                    object.material
                ) {

                    object.material.needsUpdate =
                        true;

                }

            }

        );



        /* =================================================
           SCALE
        ================================================= */

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



        /* =================================================
           MIXER
        ================================================= */

        this.mixer =

            new THREE.AnimationMixer(

                this.model

            );



        await this.loadAnimations();



        /* =================================================
           INITIAL IDLE
        ================================================= */

        this.playAnimation(

            "Idle",

            0

        );



        this.isLoaded =
            true;



        console.log(
            "[Player] Jugador listo."
        );

    }



    /* =====================================================
       NORMALIZE MODEL
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



        /* =================================================
           PIES EN Y = 0
        ================================================= */

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
       REMOVE ROOT MOTION
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


                    values[i + 2] =
                        initialZ;

                }

            }

        );



        clip.resetDuration();


        return clip;

    }



    /* =====================================================
       LOAD ANIMATIONS
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



                let clip =

                    animationFBX
                        .animations[0];



                clip =

                    this.removeRootMotion(

                        clip

                    );



                clip.name =
                    name;



                const action =

                    this.mixer.clipAction(

                        clip

                    );



                if (

                    name === "Shoot" ||

                    name === "Reload" ||

                    name === "Hit" ||

                    name === "Death"

                ) {

                    action.setLoop(

                        THREE.LoopOnce,

                        1

                    );


                    action.clampWhenFinished =
                        true;

                }

                else {

                    action.setLoop(

                        THREE.LoopRepeat,

                        Infinity

                    );


                    action.clampWhenFinished =
                        false;

                }



                this.actions.set(

                    name,

                    action

                );



                console.log(

                    `[Player] Animación ${name} cargada.`

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
           ONE SHOT FINISHED
        ================================================= */

        this.mixer.addEventListener(

            "finished",

            event => {

                if (

                    event.action ===
                    this.actions.get(
                        "Death"
                    )

                ) {

                    return;

                }



                this.lockedAction =
                    false;



                this.currentAnimation =
                    null;



                this.updateLocomotionAnimation();

            }

        );

    }



    /* =====================================================
       PLAY
    ====================================================== */

    playAnimation(

        name,

        fadeDuration = 0.18

    ) {

        const nextAction =

            this.actions.get(
                name
            );



        if (
            !nextAction
        ) {

            return;

        }



        if (

            this.currentAnimation ===
            name

        ) {

            return;

        }



        const previousAction =
            this.currentAction;



        nextAction.reset();


        nextAction.enabled =
            true;


        nextAction.setEffectiveWeight(
            1
        );


        nextAction.setEffectiveTimeScale(
            1
        );


        nextAction.play();



        if (

            previousAction &&

            previousAction !==
            nextAction

        ) {

            previousAction.fadeOut(
                fadeDuration
            );


            nextAction.fadeIn(
                fadeDuration
            );

        }



        this.currentAction =
            nextAction;


        this.currentAnimation =
            name;

    }



    /* =====================================================
       ONE SHOT
    ====================================================== */

    playOneShot(
        name
    ) {

        if (

            this.lockedAction ||

            !this.actions.has(
                name
            )

        ) {

            return;

        }



        this.lockedAction =
            true;


        this.currentAnimation =
            null;



        this.playAnimation(

            name,

            0.10

        );

    }



    /* =====================================================
       ACTIONS
    ====================================================== */

    shoot() {

        if (

            !this.enabled ||

            !this.isLoaded

        ) {

            return;

        }


        this.playOneShot(
            "Shoot"
        );

    }



    reload() {

        if (

            !this.enabled ||

            !this.isLoaded

        ) {

            return;

        }


        this.playOneShot(
            "Reload"
        );

    }



    hit() {

        if (

            !this.enabled ||

            !this.isLoaded

        ) {

            return;

        }


        this.playOneShot(
            "Hit"
        );

    }



    die() {

        if (
            !this.isLoaded
        ) {

            return;

        }



        this.lockedAction =
            true;


        this.currentAnimation =
            null;



        this.playAnimation(

            "Death",

            0.15

        );



        this.enabled =
            false;


        this.resetKeys();

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
       RESET INPUT
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
       MOVING?
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
       LOCOMOTION
    ====================================================== */

    updateLocomotionAnimation() {

        if (
            this.lockedAction
        ) {

            return;

        }



        if (
            !this.isMoving()
        ) {

            this.playAnimation(
                "Idle"
            );


            return;

        }



        if (
            this.keys.run
        ) {

            this.playAnimation(
                "Run"
            );

        }

        else {

            this.playAnimation(
                "Walk"
            );

        }

    }



    /* =====================================================
       CALCULAR MOVIMIENTO DESEADO

       Ya no modifica root.position.
       Rapier decidirá cuánto movimiento
       está permitido.
    ====================================================== */

    updateMovement(

        deltaTime,

        cameraForward,

        cameraRight

    ) {

        /*
         * Siempre reiniciamos la solicitud
         * de movimiento del frame.
         */

        this.desiredMovement.set(

            0,

            0,

            0

        );



        if (

            !this.enabled ||

            !this.isLoaded

        ) {

            return;

        }



        /*
         * Shoot / Reload / Hit todavía bloquean
         * locomoción en esta versión.
         *
         * Más adelante haremos animación por capas.
         */

        if (
            this.lockedAction
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



        if (

            forwardInput === 0 &&

            rightInput === 0

        ) {

            this.updateLocomotionAnimation();


            return;

        }



        /* =================================================
           CAMERA RELATIVE MOVEMENT
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

                rightInput

            );


        this.moveDirection.normalize();



        /* =================================================
           SPEED
        ================================================= */

        const speed =

            this.keys.run

                ?

                PLAYER_CONFIG.runSpeed

                :

                PLAYER_CONFIG.walkSpeed;



        /* =================================================
           MOVIMIENTO SOLICITADO
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
           ROTATION
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

        return this.currentAnimation;

    }



    getIsLoaded() {

        return this.isLoaded;

    }

}
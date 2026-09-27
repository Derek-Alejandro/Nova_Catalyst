/* =========================================================
   NOVA CATALYST
   Camera Manager

   Performance Build v0.8.4

   - TPS
   - FPS
   - ADS
   - Pitch limits
   - Box collision
   - No triangle raycasts
========================================================= */

import * as THREE from "three";


export class CameraManager {

    constructor(
        camera,
        renderer
    ) {

        this.camera =
            camera;


        this.renderer =
            renderer;


        this.domElement =
            renderer.domElement;


        this.target =
            null;


        this.enabled =
            false;


        this.paused =
            false;


        this.mode =
            "TPS";


        this.aiming =
            false;


        this.pointerLocked =
            false;


        this.pointerLockChangeHandler =
            null;


        this.adsAnchorProvider =
            null;


        /* =================================================
           ENVIRONMENT
        ================================================= */

        this.environment =
            null;


        this.environmentBounds =
            new THREE.Box3();


        this.wallBoxes =
            [];


        /*
         * Solo revisamos colisión unas 10 veces
         * por segundo.
         */
        this.collisionInterval =
            0.10;


        this.collisionTimer =
            0;


        this.lastAllowedDistance =
            Infinity;


        this.wallPadding =
            0.20;


        /* =================================================
           MOUSE
        ================================================= */

        this.yaw =
            0;


        this.pitch =

            THREE.MathUtils.degToRad(
                -4
            );


        this.mouseSensitivity =
            0.00175;


        this.minPitch =

            THREE.MathUtils.degToRad(
                -42
            );


        this.maxPitch =

            THREE.MathUtils.degToRad(
                52
            );


        /* =================================================
           TPS
        ================================================= */

        this.tpsDistance =
            4.4;


        this.tpsMinDistance =
            0.75;


        this.tpsMaxDistance =
            5.8;


        this.tpsHeight =
            1.38;


        this.tpsSideOffset =
            0.08;


        /* =================================================
           TPS AIM
        ================================================= */

        this.tpsAimDistance =
            2.20;


        this.tpsAimHeight =
            1.46;


        this.tpsAimSideOffset =
            0.65;


        /* =================================================
           FPS
        ================================================= */

        this.fpsHeight =
            1.60;


        this.fpsForwardOffset =
            0.58;


        this.fpsRightOffset =
            0.02;


        this.fpsAimHeight =
            1.60;


        this.fpsAimForwardOffset =
            0.58;


        this.fpsAimRightOffset =
            0;


        /* =================================================
           FOV
        ================================================= */

        this.tpsFov =
            60;


        this.tpsAimFov =
            50;


        this.fpsFov =
            68;


        this.fpsAimFov =
            51;


        this.fovResponse =
            13;


        /* =================================================
           RESPONSE
        ================================================= */

        this.tpsResponse =
            18;


        this.tpsAimResponse =
            20;


        this.fpsResponse =
            24;


        /* =================================================
           TEMP
        ================================================= */

        this.worldTarget =
            new THREE.Vector3();


        this.pivot =
            new THREE.Vector3();


        this.desiredPosition =
            new THREE.Vector3();


        this.correctedPosition =
            new THREE.Vector3();


        this.lookTarget =
            new THREE.Vector3();


        this.forward =
            new THREE.Vector3();


        this.horizontalForward =
            new THREE.Vector3();


        this.right =
            new THREE.Vector3();


        this.up =
            new THREE.Vector3(
                0,
                1,
                0
            );


        this.path =
            new THREE.Vector3();


        this.ray =
            new THREE.Ray();


        this.intersection =
            new THREE.Vector3();


        this.boxSize =
            new THREE.Vector3();


        this.setupInput();

    }


    /* =====================================================
       ENVIRONMENT
    ====================================================== */

    setEnvironment(
        environment
    ) {

        this.environment =
            environment;


        this.wallBoxes.length =
            0;


        environment.updateMatrixWorld(
            true
        );


        this.environmentBounds.setFromObject(
            environment
        );


        environment.traverse(

            object => {

                if (
                    !object.isMesh

                    ||

                    !object.geometry

                    ||

                    !object.visible
                ) {
                    return;
                }


                if (
                    !object.geometry.boundingBox
                ) {

                    object.geometry.computeBoundingBox();

                }


                if (
                    !object.geometry.boundingBox
                ) {
                    return;
                }


                const box =

                    object.geometry
                        .boundingBox
                        .clone();


                box.applyMatrix4(
                    object.matrixWorld
                );


                box.getSize(
                    this.boxSize
                );


                /*
                 * Ignoramos objetos extremadamente planos
                 * como pisos para la colisión horizontal
                 * de la cámara.
                 */
                if (
                    this.boxSize.y <
                    0.45
                ) {
                    return;
                }


                this.wallBoxes.push(
                    box
                );

            }

        );


        console.log(

            `[Camera] Fast collision boxes: ${this.wallBoxes.length}`

        );

    }


    /* =====================================================
       INPUT
    ====================================================== */

    setupInput() {

        this.domElement.addEventListener(

            "contextmenu",

            event =>
                event.preventDefault()

        );


        this.domElement.addEventListener(

            "mousedown",

            event => {

                if (
                    !this.enabled

                    ||

                    this.paused
                ) {
                    return;
                }


                if (
                    !this.pointerLocked
                ) {

                    event.preventDefault();


                    this.requestPointerLock();

                    return;

                }


                if (
                    event.button ===
                    2
                ) {

                    this.aiming =
                        true;

                }

            }

        );


        window.addEventListener(

            "mouseup",

            event => {

                if (
                    event.button ===
                    2
                ) {

                    this.aiming =
                        false;

                }

            }

        );


        window.addEventListener(

            "mousemove",

            event => {

                if (
                    !this.enabled

                    ||

                    this.paused

                    ||

                    !this.pointerLocked
                ) {
                    return;
                }


                this.yaw +=

                    event.movementX *
                    this.mouseSensitivity;


                this.pitch -=

                    event.movementY *
                    this.mouseSensitivity;


                this.pitch =

                    THREE.MathUtils.clamp(

                        this.pitch,

                        this.minPitch,

                        this.maxPitch

                    );

            }

        );


        this.domElement.addEventListener(

            "wheel",

            event => {

                if (
                    !this.enabled

                    ||

                    this.paused

                    ||

                    this.mode !==
                    "TPS"

                    ||

                    this.aiming
                ) {
                    return;
                }


                event.preventDefault();


                this.tpsDistance +=

                    event.deltaY *
                    0.002;


                this.tpsDistance =

                    THREE.MathUtils.clamp(

                        this.tpsDistance,

                        3.0,

                        this.tpsMaxDistance

                    );

            },

            {
                passive:
                    false
            }

        );


        window.addEventListener(

            "keydown",

            event => {

                if (
                    !this.enabled

                    ||

                    this.paused

                    ||

                    event.repeat
                ) {
                    return;
                }


                if (
                    event.code ===
                    "KeyC"
                ) {

                    this.toggleMode();

                }

            }

        );


        document.addEventListener(

            "pointerlockchange",

            () => {

                const previous =
                    this.pointerLocked;


                this.pointerLocked =

                    document.pointerLockElement ===
                    this.domElement;


                if (
                    !this.pointerLocked
                ) {

                    this.aiming =
                        false;

                }


                if (
                    typeof
                    this.pointerLockChangeHandler ===
                    "function"
                ) {

                    this.pointerLockChangeHandler(

                        this.pointerLocked,

                        previous

                    );

                }

            }

        );

    }


    setADSAnchorProvider(
        provider
    ) {

        this.adsAnchorProvider =
            provider;

    }


    cancelAim() {

        this.aiming =
            false;

    }


    setPointerLockChangeHandler(
        handler
    ) {

        this.pointerLockChangeHandler =
            handler;

    }


    requestPointerLock() {

        if (
            !this.enabled

            ||

            this.paused

            ||

            this.pointerLocked
        ) {
            return;
        }


        try {

            const result =

                this.domElement
                    .requestPointerLock();


            result?.catch?.(
                () => {}
            );

        }

        catch (
            error
        ) {

            console.warn(
                error
            );

        }

    }


    releasePointerLock() {

        if (
            document.pointerLockElement ===
            this.domElement
        ) {

            document.exitPointerLock();

        }

    }


    isInputCaptured() {

        return this.pointerLocked;

    }


    enable() {

        this.enabled =
            true;


        this.paused =
            false;

    }


    disable() {

        this.enabled =
            false;


        this.releasePointerLock();

    }


    setPaused(
        paused
    ) {

        this.paused =
            paused;


        this.aiming =
            false;


        if (
            paused
        ) {

            this.releasePointerLock();

        }

    }


    /* =====================================================
       TARGET
    ====================================================== */

    setTarget(
        target,
        snap = false
    ) {

        this.target =
            target;


        if (
            !target
        ) {
            return;
        }


        if (
            snap
        ) {

            this.updateDirectionVectors();


            target.getWorldPosition(
                this.worldTarget
            );


            this.pivot.copy(
                this.worldTarget
            );


            this.pivot.y +=
                this.tpsHeight;


            this.desiredPosition
                .copy(
                    this.pivot
                )
                .addScaledVector(

                    this.forward,

                    -this.tpsDistance

                );


            this.correctedPosition.copy(
                this.desiredPosition
            );


            this.clampVertical(
                this.correctedPosition
            );


            this.camera.position.copy(
                this.correctedPosition
            );

        }

    }


    /* =====================================================
       DIRECTIONS
    ====================================================== */

    updateDirectionVectors() {

        const cosPitch =

            Math.cos(
                this.pitch
            );


        this.forward.set(

            Math.sin(
                this.yaw
            ) *
            cosPitch,

            Math.sin(
                this.pitch
            ),

            -Math.cos(
                this.yaw
            ) *
            cosPitch

        );


        this.forward.normalize();


        this.horizontalForward.set(

            Math.sin(
                this.yaw
            ),

            0,

            -Math.cos(
                this.yaw
            )

        );


        this.horizontalForward.normalize();


        this.right
            .crossVectors(

                this.horizontalForward,

                this.up

            )
            .normalize();

    }


    /* =====================================================
       VERTICAL LIMITS
    ====================================================== */

    clampVertical(
        position
    ) {

        if (
            !this.environment
        ) {
            return;
        }


        position.y =

            THREE.MathUtils.clamp(

                position.y,

                this.environmentBounds.min.y +
                0.35,

                this.environmentBounds.max.y -
                0.45

            );

    }


    /* =====================================================
       FAST BOX COLLISION
    ====================================================== */

    calculateAllowedDistance(

        pivot,

        desired

    ) {

        this.path.subVectors(

            desired,

            pivot

        );


        const requestedDistance =
            this.path.length();


        if (
            requestedDistance <
            0.001
        ) {

            return requestedDistance;

        }


        this.path.normalize();


        this.ray.set(

            pivot,

            this.path

        );


        let nearestDistance =
            requestedDistance;


        for (
            const box
            of this.wallBoxes
        ) {

            /*
             * Si el pivot está dentro de una caja enorme
             * del modelo, la ignoramos.
             */
            if (
                box.containsPoint(
                    pivot
                )
            ) {
                continue;
            }


            const hit =

                this.ray.intersectBox(

                    box,

                    this.intersection

                );


            if (
                !hit
            ) {
                continue;
            }


            const distance =

                pivot.distanceTo(
                    hit
                );


            if (
                distance <=
                0

                ||

                distance >=
                nearestDistance
            ) {
                continue;
            }


            nearestDistance =
                distance;

        }


        if (
            nearestDistance <
            requestedDistance
        ) {

            nearestDistance =

                Math.max(

                    0.55,

                    nearestDistance -
                    this.wallPadding

                );

        }


        return nearestDistance;

    }


    /* =====================================================
       CORRECTION
    ====================================================== */

    correctPosition(

        pivot,

        desired,

        output,

        deltaTime

    ) {

        output.copy(
            desired
        );


        this.collisionTimer -=
            deltaTime;


        if (
            this.collisionTimer <=
            0
        ) {

            this.collisionTimer =
                this.collisionInterval;


            this.lastAllowedDistance =

                this.calculateAllowedDistance(

                    pivot,

                    desired

                );

        }


        this.path.subVectors(

            desired,

            pivot

        );


        const requestedDistance =
            this.path.length();


        if (
            requestedDistance >
            0.001

            &&

            Number.isFinite(
                this.lastAllowedDistance
            )

            &&

            this.lastAllowedDistance <
            requestedDistance
        ) {

            this.path.normalize();


            output.copy(
                pivot
            );


            output.addScaledVector(

                this.path,

                this.lastAllowedDistance

            );

        }


        this.clampVertical(
            output
        );

    }


    /* =====================================================
       FOV
    ====================================================== */

    updateFov(
        deltaTime
    ) {

        let target;


        if (
            this.mode ===
            "FPS"
        ) {

            target =

                this.aiming
                    ? this.fpsAimFov
                    : this.fpsFov;

        }

        else {

            target =

                this.aiming
                    ? this.tpsAimFov
                    : this.tpsFov;

        }


        const newFov =

            THREE.MathUtils.lerp(

                this.camera.fov,

                target,

                1 -

                Math.exp(

                    -this.fovResponse *
                    deltaTime

                )

            );


        if (
            Math.abs(

                newFov -
                this.camera.fov

            ) >
            0.03
        ) {

            this.camera.fov =
                newFov;


            this.camera.updateProjectionMatrix();

        }

    }


    /* =====================================================
       TPS
    ====================================================== */

    updateTPS(
        deltaTime
    ) {

        this.target.getWorldPosition(
            this.worldTarget
        );


        this.pivot.copy(
            this.worldTarget
        );


        this.pivot.y +=
            this.tpsHeight;


        this.desiredPosition
            .copy(
                this.pivot
            )
            .addScaledVector(

                this.forward,

                -this.tpsDistance

            )
            .addScaledVector(

                this.right,

                this.tpsSideOffset

            );


        this.correctPosition(

            this.pivot,

            this.desiredPosition,

            this.correctedPosition,

            deltaTime

        );


        this.camera.position.lerp(

            this.correctedPosition,

            1 -

            Math.exp(

                -this.tpsResponse *
                deltaTime

            )

        );


        this.clampVertical(
            this.camera.position
        );


        this.lookTarget
            .copy(
                this.pivot
            )
            .addScaledVector(

                this.forward,

                35

            );


        this.camera.lookAt(
            this.lookTarget
        );

    }


    /* =====================================================
       TPS AIM
    ====================================================== */

    updateTPSAim(
        deltaTime
    ) {

        this.target.getWorldPosition(
            this.worldTarget
        );


        this.pivot.copy(
            this.worldTarget
        );


        this.pivot.y +=
            this.tpsAimHeight;


        this.desiredPosition
            .copy(
                this.pivot
            )
            .addScaledVector(

                this.forward,

                -this.tpsAimDistance

            )
            .addScaledVector(

                this.right,

                this.tpsAimSideOffset

            );


        this.correctPosition(

            this.pivot,

            this.desiredPosition,

            this.correctedPosition,

            deltaTime

        );


        this.camera.position.lerp(

            this.correctedPosition,

            1 -

            Math.exp(

                -this.tpsAimResponse *
                deltaTime

            )

        );


        this.lookTarget
            .copy(
                this.pivot
            )
            .addScaledVector(

                this.forward,

                45

            );


        this.camera.lookAt(
            this.lookTarget
        );

    }


    /* =====================================================
       FPS
    ====================================================== */

    updateFPS(
        deltaTime
    ) {

        this.target.getWorldPosition(
            this.worldTarget
        );


        this.desiredPosition.copy(
            this.worldTarget
        );


        this.desiredPosition.y +=

            this.aiming

                ?

                this.fpsAimHeight

                :

                this.fpsHeight;


        this.desiredPosition
            .addScaledVector(

                this.horizontalForward,

                this.aiming

                    ?

                    this.fpsAimForwardOffset

                    :

                    this.fpsForwardOffset

            );


        this.desiredPosition
            .addScaledVector(

                this.right,

                this.aiming

                    ?

                    this.fpsAimRightOffset

                    :

                    this.fpsRightOffset

            );


        this.clampVertical(
            this.desiredPosition
        );


        this.camera.position.lerp(

            this.desiredPosition,

            1 -

            Math.exp(

                -this.fpsResponse *
                deltaTime

            )

        );


        this.lookTarget
            .copy(
                this.camera.position
            )
            .addScaledVector(

                this.forward,

                50

            );


        this.camera.lookAt(
            this.lookTarget
        );

    }


    /* =====================================================
       MODE
    ====================================================== */

    toggleMode() {

        this.mode =

            this.mode ===
            "TPS"

                ?

                "FPS"

                :

                "TPS";


        this.aiming =
            false;


        this.collisionTimer =
            0;


        this.lastAllowedDistance =
            Infinity;

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update(
        deltaTime
    ) {

        if (
            !this.enabled

            ||

            this.paused

            ||

            !this.target
        ) {
            return;
        }


        this.updateDirectionVectors();


        this.updateFov(
            deltaTime
        );


        if (
            this.mode ===
            "FPS"
        ) {

            this.updateFPS(
                deltaTime
            );

        }

        else if (
            this.aiming
        ) {

            this.updateTPSAim(
                deltaTime
            );

        }

        else {

            this.updateTPS(
                deltaTime
            );

        }

    }


    getForwardDirection(
        target
    ) {

        this.updateDirectionVectors();

        return target.copy(
            this.horizontalForward
        );

    }


    getRightDirection(
        target
    ) {

        this.updateDirectionVectors();

        return target.copy(
            this.right
        );

    }


    getAimDirection(
        target
    ) {

        this.updateDirectionVectors();

        return target.copy(
            this.forward
        );

    }


    getMode() {

        return this.mode;

    }


    isAiming() {

        return this.aiming;

    }

}
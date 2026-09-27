/* =========================================================
   NOVA CATALYST
   Camera Manager
   Build v0.7.3

   - Modern TPS
   - Shoulder aim
   - Full-body FPS
   - Stable FPS ADS
   - Camera never follows weapon animation
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


        /*
         * Se mantiene únicamente para compatibilidad
         * con main.js.
         */
        this.adsAnchorProvider =
            null;


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
                -62
            );


        this.maxPitch =
            THREE.MathUtils.degToRad(
                70
            );


        /* =================================================
           TPS
        ================================================= */

        this.tpsDistance =
            4.6;


        this.tpsMinDistance =
            3.1;


        this.tpsMaxDistance =
            6.2;


        this.tpsHeight =
            1.38;


        this.tpsSideOffset =
            0.08;


        /* =================================================
           TPS ADS
        ================================================= */

        this.tpsAimDistance =
            2.25;


        this.tpsAimHeight =
            1.46;


        this.tpsAimSideOffset =
            0.68;


        /* =================================================
           FPS

           Antes teníamos ~0.62.

           Eso dejaba la cámara demasiado adelantada
           respecto a los brazos.

           Ahora la dejamos suficientemente delante de
           la cabeza para no atravesarla, pero lo bastante
           atrás para ver manos + pistola.
        ================================================= */

        this.fpsHeight =
            1.57;


        this.fpsForwardOffset =
            0.38;


        this.fpsRightOffset =
            0.025;


        /* =================================================
           FPS ADS
        ================================================= */

        this.fpsAimHeight =
            1.57;


        this.fpsAimForwardOffset =
            0.40;


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
            15;


        /* =================================================
           RESPONSE
        ================================================= */

        this.tpsResponse =
            22;


        this.tpsAimResponse =
            24;


        this.fpsResponse =
            28;


        this.fpsAimResponse =
            26;


        /* =================================================
           TEMP
        ================================================= */

        this.worldTarget =
            new THREE.Vector3();


        this.pivot =
            new THREE.Vector3();


        this.desiredPosition =
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


        this.setupInput();

    }


    /* =====================================================
       INPUT
    ====================================================== */

    setupInput() {

        this.domElement.addEventListener(
            "contextmenu",
            event => {

                event.preventDefault();

            }
        );


        this.domElement.addEventListener(
            "mousedown",
            event => {

                if (
                    !this.enabled ||
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

                    event.preventDefault();


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
                    !this.enabled ||
                    this.paused ||
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
                    !this.enabled ||
                    this.paused ||
                    this.mode !==
                    "TPS" ||
                    this.aiming
                ) {

                    return;

                }


                event.preventDefault();


                this.tpsDistance +=
                    event.deltaY *
                    0.0023;


                this.tpsDistance =
                    THREE.MathUtils.clamp(

                        this.tpsDistance,

                        this.tpsMinDistance,

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
                    !this.enabled ||
                    this.paused ||
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


    /* =====================================================
       COMPATIBILITY
    ====================================================== */

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


    /* =====================================================
       POINTER LOCK
    ====================================================== */

    requestPointerLock() {

        if (
            !this.enabled ||
            this.paused ||
            this.pointerLocked
        ) {

            return;

        }


        try {

            const result =
                this.domElement
                    .requestPointerLock();


            if (
                result &&
                typeof result.catch ===
                "function"
            ) {

                result.catch(
                    () => {}
                );

            }

        }

        catch (error) {

            console.warn(
                "[Camera] Pointer Lock:",
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


    /* =====================================================
       STATE
    ====================================================== */

    enable() {

        this.enabled =
            true;


        this.paused =
            false;

    }


    disable() {

        this.enabled =
            false;


        this.aiming =
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


        if (paused) {

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


        if (!target) {
            return;
        }


        this.updateDirectionVectors();


        if (snap) {

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


            this.camera.position.copy(
                this.desiredPosition
            );


            this.lookTarget
                .copy(
                    this.pivot
                )
                .addScaledVector(

                    this.forward,

                    30

                );


            this.camera.lookAt(
                this.lookTarget
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
       FOV
    ====================================================== */

    updateFov(
        deltaTime
    ) {

        let targetFov;


        if (
            this.mode ===
            "FPS"
        ) {

            targetFov =
                this.aiming
                    ? this.fpsAimFov
                    : this.fpsFov;

        }

        else {

            targetFov =
                this.aiming
                    ? this.tpsAimFov
                    : this.tpsFov;

        }


        const alpha =
            1 -
            Math.exp(
                -this.fovResponse *
                deltaTime
            );


        this.camera.fov =
            THREE.MathUtils.lerp(

                this.camera.fov,

                targetFov,

                alpha

            );


        this.camera
            .updateProjectionMatrix();

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


        const alpha =
            1 -
            Math.exp(
                -this.tpsResponse *
                deltaTime
            );


        this.camera.position.lerp(

            this.desiredPosition,

            alpha

        );


        this.lookTarget
            .copy(
                this.pivot
            )
            .addScaledVector(

                this.forward,

                40

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


        const alpha =
            1 -
            Math.exp(
                -this.tpsAimResponse *
                deltaTime
            );


        this.camera.position.lerp(

            this.desiredPosition,

            alpha

        );


        this.lookTarget
            .copy(
                this.pivot
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
       FPS

       Camera never follows RightHand.

       RightHand follows animations.
       Weapon follows RightHand.
       Camera stays stable.
    ====================================================== */

    updateFPS(
        deltaTime
    ) {

        this.target.getWorldPosition(
            this.worldTarget
        );


        const height =
            this.aiming
                ? this.fpsAimHeight
                : this.fpsHeight;


        const forwardOffset =
            this.aiming
                ? this.fpsAimForwardOffset
                : this.fpsForwardOffset;


        const sideOffset =
            this.aiming
                ? this.fpsAimRightOffset
                : this.fpsRightOffset;


        this.desiredPosition.copy(
            this.worldTarget
        );


        this.desiredPosition.y +=
            height;


        this.desiredPosition
            .addScaledVector(

                this.horizontalForward,

                forwardOffset

            );


        this.desiredPosition
            .addScaledVector(

                this.right,

                sideOffset

            );


        const response =
            this.aiming
                ? this.fpsAimResponse
                : this.fpsResponse;


        const alpha =
            1 -
            Math.exp(
                -response *
                deltaTime
            );


        this.camera.position.lerp(

            this.desiredPosition,

            alpha

        );


        this.lookTarget
            .copy(
                this.camera.position
            )
            .addScaledVector(

                this.forward,

                60

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
                ? "FPS"
                : "TPS";


        this.aiming =
            false;


        console.log(
            `[Camera] ${this.mode}`
        );

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update(
        deltaTime
    ) {

        if (
            !this.enabled ||
            this.paused ||
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


    /* =====================================================
       GETTERS
    ====================================================== */

    getForwardDirection(
        target
    ) {

        this.updateDirectionVectors();


        target.copy(
            this.horizontalForward
        );


        return target;

    }


    getRightDirection(
        target
    ) {

        this.updateDirectionVectors();


        target.copy(
            this.right
        );


        return target;

    }


    getAimDirection(
        target
    ) {

        this.updateDirectionVectors();


        target.copy(
            this.forward
        );


        return target;

    }


    getMode() {

        return this.mode;

    }


    isAiming() {

        return this.aiming;

    }

}
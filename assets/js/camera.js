/* =========================================================
   NOVA CATALYST
   Third Person Camera

   Build v0.3
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



        /* =================================================
           ESTADO
        ================================================= */

        this.enabled =
            false;


        this.target =
            null;



        /* =================================================
           CONFIGURACIÓN TPS
        ================================================= */

        this.distance =
            4.5;


        this.minDistance =
            2.5;


        this.maxDistance =
            7.5;


        /*
         * Altura a la que la cámara mira
         * dentro del personaje.
        */

        this.lookHeight =
            1.15;


        /*
         * Giro horizontal inicial.
         *
         * 0 coloca la cámara detrás del
         * jugador mirando hacia -Z.
        */

        this.yaw =
            0;


        /*
         * Inclinación vertical.
        */

        this.pitch =
            0.20;


        this.minPitch =
            -0.05;


        this.maxPitch =
            0.75;



        /* =================================================
           SENSIBILIDAD
        ================================================= */

        this.mouseSensitivity =
            0.004;


        this.zoomSensitivity =
            0.005;


        this.followSmoothing =
            12;



        /* =================================================
           INPUT
        ================================================= */

        this.isRotating =
            false;



        /* =================================================
           VECTORES TEMPORALES
        ================================================= */

        this.targetPosition =
            new THREE.Vector3();


        this.desiredPosition =
            new THREE.Vector3();


        this.offset =
            new THREE.Vector3();


        this.forward =
            new THREE.Vector3();


        this.right =
            new THREE.Vector3();



        this.setupInput();

    }



    /* =====================================================
       INPUT DE CÁMARA
    ====================================================== */

    setupInput() {

        /*
         * Por ahora botón derecho mantiene
         * activado el movimiento de cámara.
         *
         * Más adelante este botón también
         * se integrará con el modo de apuntado.
        */

        this.domElement.addEventListener(

            "mousedown",

            event => {

                if (
                    !this.enabled
                ) {

                    return;

                }


                if (
                    event.button === 2
                ) {

                    this.isRotating =
                        true;

                }

            }

        );



        window.addEventListener(

            "mouseup",

            event => {

                if (
                    event.button === 2
                ) {

                    this.isRotating =
                        false;

                }

            }

        );



        window.addEventListener(

            "mousemove",

            event => {

                if (
                    !this.enabled ||
                    !this.isRotating
                ) {

                    return;

                }


                /* =========================================
                   ROTACIÓN HORIZONTAL
                ========================================= */

                this.yaw -=

                    event.movementX *
                    this.mouseSensitivity;



                /* =========================================
                   ROTACIÓN VERTICAL
                ========================================= */

                this.pitch +=

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



        /* =================================================
           ZOOM CON RUEDA
        ================================================= */

        this.domElement.addEventListener(

            "wheel",

            event => {

                if (
                    !this.enabled
                ) {

                    return;

                }


                this.distance +=

                    event.deltaY *
                    this.zoomSensitivity;


                this.distance =

                    THREE.MathUtils.clamp(

                        this.distance,

                        this.minDistance,

                        this.maxDistance

                    );

            },

            {
                passive:
                    true
            }

        );



        /* =================================================
           EVITAR MENÚ CONTEXTUAL
        ================================================= */

        this.domElement.addEventListener(

            "contextmenu",

            event => {

                if (
                    this.enabled
                ) {

                    event.preventDefault();

                }

            }

        );



        /* =================================================
           SI PIERDE FOCO, CANCELAR ROTACIÓN
        ================================================= */

        window.addEventListener(

            "blur",

            () => {

                this.isRotating =
                    false;

            }

        );

    }



    /* =====================================================
       ASIGNAR JUGADOR
    ====================================================== */

    setTarget(

        target,

        snap = true

    ) {

        this.target =
            target;


        if (
            snap
        ) {

            this.snapToTarget();

        }

    }



    /* =====================================================
       ACTIVAR
    ====================================================== */

    enable() {

        this.enabled =
            true;

    }



    /* =====================================================
       DESACTIVAR
    ====================================================== */

    disable() {

        this.enabled =
            false;


        this.isRotating =
            false;

    }



    /* =====================================================
       DIRECCIÓN HACIA ADELANTE

       Esta dirección será utilizada por
       PlayerController para que WASD sea
       relativo a la cámara.
    ====================================================== */

    getForwardDirection(
        target = this.forward
    ) {

        target.set(

            -Math.sin(
                this.yaw
            ),

            0,

            -Math.cos(
                this.yaw
            )

        );


        target.normalize();


        return target;

    }



    /* =====================================================
       DIRECCIÓN DERECHA
    ====================================================== */

    getRightDirection(
        target = this.right
    ) {

        const forward =

            this.getForwardDirection(
                this.forward
            );


        target.set(

            -forward.z,

            0,

            forward.x

        );


        target.normalize();


        return target;

    }



    /* =====================================================
       CALCULAR POSICIÓN DE CÁMARA
    ====================================================== */

    calculateDesiredPosition() {

        if (
            !this.target
        ) {

            return;

        }


        /* =================================================
           PUNTO AL QUE MIRA
        ================================================= */

        this.targetPosition
            .copy(
                this.target.position
            );


        this.targetPosition.y +=
            this.lookHeight;



        /* =================================================
           OFFSET ESFÉRICO
        ================================================= */

        const horizontalDistance =

            Math.cos(
                this.pitch
            )

            *

            this.distance;



        this.offset.set(

            Math.sin(
                this.yaw
            )

            *

            horizontalDistance,


            Math.sin(
                this.pitch
            )

            *

            this.distance,


            Math.cos(
                this.yaw
            )

            *

            horizontalDistance

        );



        /* =================================================
           POSICIÓN FINAL
        ================================================= */

        this.desiredPosition

            .copy(
                this.targetPosition
            )

            .add(
                this.offset
            );

    }



    /* =====================================================
       POSICIONAR INSTANTÁNEAMENTE
    ====================================================== */

    snapToTarget() {

        if (
            !this.target
        ) {

            return;

        }


        this.calculateDesiredPosition();


        this.camera.position.copy(

            this.desiredPosition

        );


        this.camera.lookAt(

            this.targetPosition

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
            !this.target
        ) {

            return;

        }


        this.calculateDesiredPosition();



        /* =================================================
           SEGUIMIENTO SUAVE
        ================================================= */

        const smoothing =

            1 -

            Math.exp(

                -this.followSmoothing *
                deltaTime

            );


        this.camera.position.lerp(

            this.desiredPosition,

            smoothing

        );


        this.camera.lookAt(

            this.targetPosition

        );

    }


}
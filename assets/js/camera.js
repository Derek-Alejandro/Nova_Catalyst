/* =========================================================
   NOVA CATALYST
   Camera Manager

   Build v0.8.5

   PERFORMANCE + HARD ROOM LIMITS

   - TPS
   - FPS
   - ADS
   - TPS pitch limits
   - FPS pitch limits
   - Fast Box3 wall collision
   - Nearby wall cache
   - Hard floor protection
   - Hard ceiling protection
   - Horizontal environment protection
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


        /*
         * Todas las cajas sólidas del escenario.
         */
        this.wallBoxes =
            [];


        /*
         * Solo las cajas cercanas al jugador.
         */
        this.nearbyWallBoxes =
            [];


        this.wallCacheTimer =
            0;


        this.wallCacheInterval =
            0.12;


        /*
         * Radio suficiente para cubrir la distancia
         * máxima de cámara.
         */
        this.wallCacheRadius =
            8.0;


        this.wallQueryBox =
            new THREE.Box3();


        this.boxSize =
            new THREE.Vector3();


        /* =================================================
           HARD PLAYABLE LIMITS
        ================================================= */

        /*
         * La cámara nunca podrá bajar más de
         * esta altura respecto a los pies del jugador.
         */
        this.minHeightAbovePlayer =
            0.48;


        /*
         * La cámara nunca podrá superar esta altura
         * respecto al jugador.

         * Esto evita salir por el techo aunque el
         * bounding box global del GLTF sea enorme.
         */
        this.maxHeightAbovePlayer =
            2.70;


        /*
         * Último margen de seguridad respecto al
         * bounding box del escenario.
         */
        this.environmentPadding =
            0.30;


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


        /*
         * TPS:
         *
         * Más limitado porque mover demasiado el pitch
         * hace que una cámara orbital quiera ir debajo
         * del piso o sobre el techo.
         */
        this.tpsMinPitch =

            THREE.MathUtils.degToRad(
                -32
            );


        this.tpsMaxPitch =

            THREE.MathUtils.degToRad(
                30
            );


        /*
         * FPS:
         *
         * Se puede mirar más arriba/abajo porque la
         * posición de la cámara permanece en la cabeza.
         */
        this.fpsMinPitch =

            THREE.MathUtils.degToRad(
                -72
            );


        this.fpsMaxPitch =

            THREE.MathUtils.degToRad(
                72
            );


        /* =================================================
           TPS
        ================================================= */

        this.tpsDistance =
            4.40;


        this.tpsMinDistance =
            0.65;


        this.tpsMaxDistance =
            5.80;


        this.tpsHeight =
            1.38;


        this.tpsSideOffset =
            0.08;


        /* =================================================
           TPS ADS
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
            19;


        this.tpsAimResponse =
            21;


        this.fpsResponse =
            24;


        /* =================================================
           WALL COLLISION
        ================================================= */

        this.wallPadding =
            0.22;


        this.lastAllowedDistance =
            Infinity;


        /* =================================================
           TEMP
        ================================================= */

        this.worldTarget =
            new THREE.Vector3();


        this.clampReference =
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


        this.nearbyWallBoxes.length =
            0;


        environment.updateMatrixWorld(
            true
        );


        this.environmentBounds
            .setFromObject(
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
                 * Para paredes solo nos interesan
                 * volúmenes con cierta altura.
                 *
                 * Piso y techo se controlan con el
                 * HARD LIMIT relativo al jugador.
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

            `[Camera] Fast wall boxes: ${this.wallBoxes.length}`

        );


        console.log(

            "[Camera] Hard floor/ceiling limits ONLINE"

        );

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


                /*
                 * Límite diferente según cámara.
                 */
                if (
                    this.mode ===
                    "FPS"
                ) {

                    this.pitch =

                        THREE.MathUtils.clamp(

                            this.pitch,

                            this.fpsMinPitch,

                            this.fpsMaxPitch

                        );

                }

                else {

                    this.pitch =

                        THREE.MathUtils.clamp(

                            this.pitch,

                            this.tpsMinPitch,

                            this.tpsMaxPitch

                        );

                }

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

                "[Camera] PointerLock:",

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


        if (!target) {
            return;
        }


        this.updateDirectionVectors();


        target.getWorldPosition(
            this.worldTarget
        );


        /*
         * Construimos cache inmediatamente.
         */
        this.refreshNearbyWalls();


        if (
            !snap
        ) {
            return;
        }


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


        this.correctCameraPosition(

            this.pivot,

            this.desiredPosition,

            this.correctedPosition

        );


        this.camera.position.copy(
            this.correctedPosition
        );


        this.applyHardLimits(
            this.camera.position
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


    /* =====================================================
       DIRECTION
    ====================================================== */

    updateDirectionVectors() {

        const cosPitch =

            Math.cos(
                this.pitch
            );


        this.forward.set(

            Math.sin(
                this.yaw
            )
            *
            cosPitch,

            Math.sin(
                this.pitch
            ),

            -Math.cos(
                this.yaw
            )
            *
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
       NEARBY WALL CACHE
    ====================================================== */

    refreshNearbyWalls() {

        if (
            !this.target

            ||

            !this.environment
        ) {
            return;
        }


        this.target.getWorldPosition(
            this.clampReference
        );


        const radius =
            this.wallCacheRadius;


        this.wallQueryBox.min.set(

            this.clampReference.x -
            radius,

            this.clampReference.y -
            4,

            this.clampReference.z -
            radius

        );


        this.wallQueryBox.max.set(

            this.clampReference.x +
            radius,

            this.clampReference.y +
            5,

            this.clampReference.z +
            radius

        );


        this.nearbyWallBoxes.length =
            0;


        for (
            const box
            of this.wallBoxes
        ) {

            if (
                box.intersectsBox(
                    this.wallQueryBox
                )
            ) {

                this.nearbyWallBoxes.push(
                    box
                );

            }

        }

    }


    /* =====================================================
       HARD LIMITS

       Esta es la protección definitiva.

       NO depende solamente del bounding box
       del escenario.

       Utiliza la altura real del jugador.
    ====================================================== */

    applyHardLimits(
        position
    ) {

        if (
            !this.target
        ) {
            return;
        }


        this.target.getWorldPosition(
            this.clampReference
        );


        /* =================================================
           PLAYER-RELATIVE FLOOR
        ================================================= */

        let minimumY =

            this.clampReference.y

            +

            this.minHeightAbovePlayer;


        /* =================================================
           PLAYER-RELATIVE CEILING
        ================================================= */

        let maximumY =

            this.clampReference.y

            +

            this.maxHeightAbovePlayer;


        /* =================================================
           GLOBAL FALLBACK
        ================================================= */

        if (
            this.environment
        ) {

            minimumY =

                Math.max(

                    minimumY,

                    this.environmentBounds.min.y

                    +

                    this.environmentPadding

                );


            maximumY =

                Math.min(

                    maximumY,

                    this.environmentBounds.max.y

                    -

                    this.environmentPadding

                );


            /*
             * Si el GLTF tiene un bounding box extraño,
             * nunca permitimos invertir límites.
             */
            if (
                maximumY <=
                minimumY
            ) {

                maximumY =

                    minimumY +
                    0.25;

            }


            /* =================================================
               ABSOLUTE X / Z SAFETY
            ================================================= */

            position.x =

                THREE.MathUtils.clamp(

                    position.x,

                    this.environmentBounds.min.x

                    +

                    this.environmentPadding,

                    this.environmentBounds.max.x

                    -

                    this.environmentPadding

                );


            position.z =

                THREE.MathUtils.clamp(

                    position.z,

                    this.environmentBounds.min.z

                    +

                    this.environmentPadding,

                    this.environmentBounds.max.z

                    -

                    this.environmentPadding

                );

        }


        position.y =

            THREE.MathUtils.clamp(

                position.y,

                minimumY,

                maximumY

            );

    }


    /* =====================================================
       FAST WALL COLLISION
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
            of this.nearbyWallBoxes
        ) {

            /*
             * Bounding boxes grandes que contienen
             * el pivot completo no funcionan como
             * pared concreta y se ignoran.
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


            if (!hit) {
                continue;
            }


            const distance =

                pivot.distanceTo(
                    hit
                );


            if (
                distance <=
                0.01

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

                    this.tpsMinDistance,

                    nearestDistance -
                    this.wallPadding

                );

        }


        return nearestDistance;

    }


    /* =====================================================
       POSITION CORRECTION

       Box collision se hace cada frame,
       pero solo contra cajas CERCANAS.
    ====================================================== */

    correctCameraPosition(

        pivot,

        desired,

        output

    ) {

        output.copy(
            desired
        );


        const allowedDistance =

            this.calculateAllowedDistance(

                pivot,

                desired

            );


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

            allowedDistance <
            requestedDistance
        ) {

            this.path.normalize();


            output.copy(
                pivot
            );


            output.addScaledVector(

                this.path,

                allowedDistance

            );

        }


        /*
         * Aplicar SIEMPRE al resultado.
         */
        this.applyHardLimits(
            output
        );

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

                    ?

                    this.fpsAimFov

                    :

                    this.fpsFov;

        }

        else {

            targetFov =

                this.aiming

                    ?

                    this.tpsAimFov

                    :

                    this.tpsFov;

        }


        const newFov =

            THREE.MathUtils.lerp(

                this.camera.fov,

                targetFov,

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


        this.correctCameraPosition(

            this.pivot,

            this.desiredPosition,

            this.correctedPosition

        );


        const alpha =

            1 -

            Math.exp(

                -this.tpsResponse *
                deltaTime

            );


        this.camera.position.lerp(

            this.correctedPosition,

            alpha

        );


        /*
         * Important:
         *
         * Lerp puede crear un frame intermedio fuera
         * del límite. Lo corregimos otra vez DESPUÉS.
         */
        this.applyHardLimits(
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


        this.correctCameraPosition(

            this.pivot,

            this.desiredPosition,

            this.correctedPosition

        );


        const alpha =

            1 -

            Math.exp(

                -this.tpsAimResponse *
                deltaTime

            );


        this.camera.position.lerp(

            this.correctedPosition,

            alpha

        );


        this.applyHardLimits(
            this.camera.position
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


        this.applyHardLimits(
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


        this.applyHardLimits(
            this.camera.position
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


        /*
         * Clamp inmediatamente al rango del
         * modo seleccionado.
         */
        if (
            this.mode ===
            "FPS"
        ) {

            this.pitch =

                THREE.MathUtils.clamp(

                    this.pitch,

                    this.fpsMinPitch,

                    this.fpsMaxPitch

                );

        }

        else {

            this.pitch =

                THREE.MathUtils.clamp(

                    this.pitch,

                    this.tpsMinPitch,

                    this.tpsMaxPitch

                );

        }


        this.refreshNearbyWalls();


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
            !this.enabled

            ||

            this.paused

            ||

            !this.target
        ) {
            return;
        }


        /* =================================================
           WALL CACHE

           Barato: solo cada 120 ms.
        ================================================= */

        this.wallCacheTimer -=
            deltaTime;


        if (
            this.wallCacheTimer <=
            0
        ) {

            this.wallCacheTimer =
                this.wallCacheInterval;


            this.refreshNearbyWalls();

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


        /*
         * Último seguro del frame.

         * Aunque cualquier cálculo anterior
         * intente sacar la cámara del volumen,
         * termina aquí dentro otra vez.
         */
        this.applyHardLimits(
            this.camera.position
        );

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
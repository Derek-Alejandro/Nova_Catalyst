/* =========================================================
   NOVA CATALYST
   Camera Manager
   Build v0.8.6

   - TPS / FPS
   - ADS
   - Fast Box3 environment collision
   - Hard floor / ceiling limits
   - Dynamic enemy separation in FPS
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


        this.nearbyWallBoxes =
            [];


        this.wallCacheTimer =
            0;


        this.wallCacheInterval =
            0.12;


        this.wallCacheRadius =
            8.0;


        this.wallQueryBox =
            new THREE.Box3();


        this.boxSize =
            new THREE.Vector3();


        /* =================================================
           ENEMY FPS BLOCKERS
        ================================================= */

        this.dynamicBlockersProvider =
            null;


        this.dynamicBlockerRadius =
            0.62;


        this.blockerPosition =
            new THREE.Vector3();


        this.blockerSeparation =
            new THREE.Vector3();


        /* =================================================
           HARD LIMITS
        ================================================= */

        this.minHeightAbovePlayer =
            0.48;


        this.maxHeightAbovePlayer =
            2.70;


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


        this.tpsMinPitch =

            THREE.MathUtils.degToRad(
                -32
            );


        this.tpsMaxPitch =

            THREE.MathUtils.degToRad(
                30
            );


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

           Antes el offset era 0.58.

           Ahora la cámara queda prácticamente dentro de la
           cápsula física del jugador.
        ================================================= */

        this.fpsHeight =
            1.60;


        this.fpsForwardOffset =
            0.06;


        this.fpsRightOffset =
            0;


        this.fpsAimHeight =
            1.60;


        this.fpsAimForwardOffset =
            0.06;


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
           COLLISION
        ================================================= */

        this.wallPadding =
            0.22;


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
                    !object.geometry
                        .boundingBox
                ) {

                    object.geometry
                        .computeBoundingBox();

                }


                if (
                    !object.geometry
                        .boundingBox
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
                 * Pisos planos no se usan para el
                 * ray/box horizontal.
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

            "[Camera] FPS enemy separation ONLINE"

        );

    }


    /* =====================================================
       DYNAMIC ENEMY PROVIDER
    ====================================================== */

    setDynamicBlockersProvider(
        provider
    ) {

        this.dynamicBlockersProvider =

            typeof provider ===
            "function"

                ?

                provider

                :

                null;

    }


    /* =====================================================
       ADS
    ====================================================== */

    setADSAnchorProvider(
        provider
    ) {

        this.adsAnchorProvider =
            provider;

    }


    setPointerLockChangeHandler(
        handler
    ) {

        this.pointerLockChangeHandler =
            handler;

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
                    typeof this.pointerLockChangeHandler ===
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
       POINTER LOCK
    ====================================================== */

    cancelAim() {

        this.aiming =
            false;

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


        if (
            !target
        ) {

            return;

        }


        this.updateDirectionVectors();


        target.getWorldPosition(
            this.worldTarget
        );


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
       HARD MAP LIMITS
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


        let minimumY =

            this.clampReference.y

            +

            this.minHeightAbovePlayer;


        let maximumY =

            this.clampReference.y

            +

            this.maxHeightAbovePlayer;


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


            if (
                maximumY <=
                minimumY
            ) {

                maximumY =

                    minimumY +
                    0.25;

            }


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
       ENVIRONMENT CAMERA COLLISION
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

                    0.28,

                    nearestDistance -
                    this.wallPadding

                );

        }


        return nearestDistance;

    }


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


        this.applyHardLimits(
            output
        );

    }


    /* =====================================================
       FPS ENEMY SEPARATION
    ====================================================== */

    applyDynamicBlockerSeparation(
        position
    ) {

        if (
            typeof this.dynamicBlockersProvider !==
            "function"
        ) {

            return;

        }


        const blockers =

            this.dynamicBlockersProvider();


        if (
            !Array.isArray(
                blockers
            )
            ||
            blockers.length ===
            0
        ) {

            return;

        }


        for (
            const blocker
            of blockers
        ) {

            if (
                !blocker
            ) {

                continue;

            }


            if (
                typeof blocker
                    .getWorldPosition ===
                "function"
            ) {

                blocker.getWorldPosition(
                    this.blockerPosition
                );

            }

            else if (
                blocker.position
            ) {

                this.blockerPosition.copy(
                    blocker.position
                );

            }

            else {

                continue;

            }


            /*
             * Si está en otro piso, no afecta.
             */
            const blockerCenterY =

                this.blockerPosition.y

                +

                1.05;


            if (
                Math.abs(

                    position.y -
                    blockerCenterY

                ) >
                1.25
            ) {

                continue;

            }


            this.blockerSeparation.set(

                position.x -
                this.blockerPosition.x,

                0,

                position.z -
                this.blockerPosition.z

            );


            const distance =

                this.blockerSeparation
                    .length();


            if (
                distance >=
                this.dynamicBlockerRadius
            ) {

                continue;

            }


            if (
                distance <
                0.0001
            ) {

                this.blockerSeparation
                    .copy(
                        this.horizontalForward
                    )
                    .multiplyScalar(
                        -1
                    );

            }

            else {

                this.blockerSeparation
                    .multiplyScalar(

                        1 /
                        distance

                    );

            }


            position.x =

                this.blockerPosition.x

                +

                this.blockerSeparation.x

                *

                this.dynamicBlockerRadius;


            position.z =

                this.blockerPosition.z

                +

                this.blockerSeparation.z

                *

                this.dynamicBlockerRadius;

        }


        this.applyHardLimits(
            position
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


            this.camera
                .updateProjectionMatrix();

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

            )
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


        /*
         * Primera corrección antes del lerp.
         */
        this.applyDynamicBlockerSeparation(
            this.desiredPosition
        );


        const alpha =

            1 -

            Math.exp(

                -this.fpsResponse *
                deltaTime

            );


        this.camera.position.lerp(

            this.desiredPosition,

            alpha

        );


        /*
         * Segunda corrección después del lerp.
         */
        this.applyDynamicBlockerSeparation(
            this.camera.position
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
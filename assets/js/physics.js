/* =========================================================
   NOVA CATALYST
   Physics Manager

   Build v0.6.1
   Rapier 3D
========================================================= */

import * as THREE from "three";

import RAPIER from
    "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs";


export class PhysicsManager {

    constructor() {

        this.RAPIER = RAPIER;

        this.world = null;

        this.ready = false;

        this.environmentColliders = [];

        this.dynamicBodies = [];

        /* =================================================
           CHARACTER
        ================================================= */

        this.characterBody = null;

        this.characterCollider = null;

        this.characterController = null;

        this.characterHeight = 1.8;

        this.characterRadius = 0.28;

        this.characterHalfHeight = 0.62;

        this.characterFootOffset =
            this.characterHalfHeight +
            this.characterRadius;

        this.verticalVelocity = 0;

        this.characterGravity = -18;

        this.maxFallSpeed = -30;

        this.grounded = false;

    }


    /* =====================================================
       INIT
    ====================================================== */

    async init() {

        if (this.ready) {
            return;
        }

        console.log(
            "[Physics] Inicializando Rapier..."
        );

        await this.RAPIER.init();

        this.world =
            new this.RAPIER.World({

                x: 0,
                y: -9.81,
                z: 0

            });


        /* =================================================
           CHARACTER CONTROLLER
        ================================================= */

        this.characterController =
            this.world.createCharacterController(
                0.03
            );


        this.characterController
            .setSlideEnabled(
                true
            );


        this.characterController
            .enableAutostep(

                0.30,
                0.15,
                false

            );


        this.characterController
            .enableSnapToGround(
                0.35
            );


        this.characterController
            .setMaxSlopeClimbAngle(

                THREE.MathUtils.degToRad(
                    45
                )

            );


        this.characterController
            .setMinSlopeSlideAngle(

                THREE.MathUtils.degToRad(
                    35
                )

            );


        /* =================================================
           EMPUJAR OBJETOS DINÁMICOS
        ================================================= */

        if (
            typeof this.characterController
                .setApplyImpulsesToDynamicBodies
            === "function"
        ) {

            this.characterController
                .setApplyImpulsesToDynamicBodies(
                    true
                );

        }


        if (
            typeof this.characterController
                .setCharacterMass
            === "function"
        ) {

            this.characterController
                .setCharacterMass(
                    75
                );

        }


        this.ready = true;


        console.log(
            "[Physics] Rapier ONLINE."
        );

    }


    /* =====================================================
       CLEAR ENVIRONMENT COLLIDERS
    ====================================================== */

    clearEnvironmentColliders() {

        if (!this.world) {
            return;
        }


        for (
            const collider
            of this.environmentColliders
        ) {

            try {

                this.world.removeCollider(

                    collider,
                    true

                );

            }

            catch (error) {

                console.warn(

                    "[Physics] Error eliminando collider:",

                    error

                );

            }

        }


        this.environmentColliders = [];

    }


    /* =====================================================
       GLTF ENVIRONMENT → RAPIER TRIMESH
    ====================================================== */

    createEnvironmentColliders(
        environment
    ) {

        if (!this.ready) {

            throw new Error(
                "Rapier todavía no está inicializado."
            );

        }


        this.clearEnvironmentColliders();


        environment.updateMatrixWorld(
            true
        );


        let colliderCount = 0;

        let triangleCount = 0;

        let skippedMeshes = 0;


        const vertex =
            new THREE.Vector3();


        environment.traverse(

            object => {

                if (
                    !object.isMesh ||
                    !object.visible ||
                    !object.geometry
                ) {

                    return;

                }


                const geometry =
                    object.geometry;


                const positionAttribute =
                    geometry.attributes?.position;


                if (!positionAttribute) {

                    skippedMeshes++;

                    return;

                }


                /* =========================================
                   WORLD VERTICES
                ========================================= */

                const vertices =
                    new Float32Array(

                        positionAttribute.count *
                        3

                    );


                for (
                    let i = 0;
                    i < positionAttribute.count;
                    i++
                ) {

                    vertex
                        .fromBufferAttribute(

                            positionAttribute,
                            i

                        )
                        .applyMatrix4(

                            object.matrixWorld

                        );


                    const index =
                        i * 3;


                    vertices[index] =
                        vertex.x;


                    vertices[index + 1] =
                        vertex.y;


                    vertices[index + 2] =
                        vertex.z;

                }


                /* =========================================
                   INDICES
                ========================================= */

                let indices;


                if (geometry.index) {

                    indices =
                        new Uint32Array(

                            geometry.index.count

                        );


                    for (
                        let i = 0;
                        i < geometry.index.count;
                        i++
                    ) {

                        indices[i] =
                            geometry.index.getX(
                                i
                            );

                    }

                }

                else {

                    const validCount =

                        Math.floor(

                            positionAttribute.count /
                            3

                        ) * 3;


                    indices =
                        new Uint32Array(

                            validCount

                        );


                    for (
                        let i = 0;
                        i < validCount;
                        i++
                    ) {

                        indices[i] =
                            i;

                    }

                }


                if (indices.length < 3) {

                    skippedMeshes++;

                    return;

                }


                try {

                    const colliderDesc =

                        this.RAPIER
                            .ColliderDesc
                            .trimesh(

                                vertices,
                                indices

                            );


                    colliderDesc
                        .setFriction(
                            0.85
                        )
                        .setRestitution(
                            0
                        );


                    const collider =

                        this.world.createCollider(

                            colliderDesc

                        );


                    this.environmentColliders.push(
                        collider
                    );


                    colliderCount++;


                    triangleCount +=

                        Math.floor(

                            indices.length /
                            3

                        );

                }

                catch (error) {

                    skippedMeshes++;


                    console.warn(

                        `[Physics] Mesh ignorado: ${object.name || "sin nombre"}`,

                        error

                    );

                }

            }

        );


        this.world.step();


        console.log(

            "[Physics] Escenario físico generado:",

            {
                colliders: colliderCount,
                triangles: triangleCount,
                skippedMeshes
            }

        );

    }


    /* =====================================================
       CREATE CHARACTER
    ====================================================== */

    createCharacter(

        spawnPosition,

        characterHeight = 1.8

    ) {

        if (!this.ready) {

            throw new Error(
                "Rapier todavía no está inicializado."
            );

        }


        this.characterHeight =
            characterHeight;


        this.characterRadius =
            0.28;


        this.characterHalfHeight =

            Math.max(

                0.1,

                (
                    characterHeight -
                    this.characterRadius * 2
                ) / 2

            );


        this.characterFootOffset =

            this.characterHalfHeight +
            this.characterRadius;


        const bodyDesc =

            this.RAPIER
                .RigidBodyDesc
                .kinematicPositionBased()
                .setTranslation(

                    spawnPosition.x,

                    spawnPosition.y +
                    this.characterFootOffset,

                    spawnPosition.z

                );


        this.characterBody =

            this.world.createRigidBody(

                bodyDesc

            );


        const colliderDesc =

            this.RAPIER
                .ColliderDesc
                .capsule(

                    this.characterHalfHeight,
                    this.characterRadius

                )
                .setFriction(
                    0
                )
                .setRestitution(
                    0
                );


        this.characterCollider =

            this.world.createCollider(

                colliderDesc,
                this.characterBody

            );


        this.verticalVelocity = 0;

        this.grounded = false;


        this.world.step();


        console.log(
            "[Physics] Character Controller creado."
        );

    }


    /* =====================================================
       ROTATION Y HELPER
    ====================================================== */

    applyBodyRotationY(

        body,

        rotationY = 0

    ) {

        if (rotationY === 0) {
            return;
        }


        const quaternion =

            new THREE.Quaternion()
                .setFromEuler(

                    new THREE.Euler(

                        0,
                        rotationY,
                        0

                    )

                );


        body.setRotation(

            {

                x: quaternion.x,
                y: quaternion.y,
                z: quaternion.z,
                w: quaternion.w

            },

            true

        );

    }


    /* =====================================================
       DYNAMIC BOX
    ====================================================== */

    createDynamicBox({

        position,

        size,

        rotationY = 0,

        density = 1,

        friction = 0.8,

        restitution = 0.05

    }) {

        const bodyDesc =

            this.RAPIER
                .RigidBodyDesc
                .dynamic()
                .setTranslation(

                    position.x,
                    position.y,
                    position.z

                )
                .setLinearDamping(
                    0.22
                )
                .setAngularDamping(
                    0.32
                );


        const body =

            this.world.createRigidBody(

                bodyDesc

            );


        this.applyBodyRotationY(

            body,
            rotationY

        );


        const colliderDesc =

            this.RAPIER
                .ColliderDesc
                .cuboid(

                    size.x / 2,
                    size.y / 2,
                    size.z / 2

                )
                .setDensity(
                    density
                )
                .setFriction(
                    friction
                )
                .setRestitution(
                    restitution
                );


        this.world.createCollider(

            colliderDesc,
            body

        );


        this.dynamicBodies.push(
            body
        );


        return body;

    }


    /* =====================================================
       DYNAMIC CYLINDER
    ====================================================== */

    createDynamicCylinder({

        position,

        radius,

        height,

        density = 1,

        friction = 0.75,

        restitution = 0.1

    }) {

        const bodyDesc =

            this.RAPIER
                .RigidBodyDesc
                .dynamic()
                .setTranslation(

                    position.x,
                    position.y,
                    position.z

                )
                .setLinearDamping(
                    0.18
                )
                .setAngularDamping(
                    0.26
                );


        const body =

            this.world.createRigidBody(

                bodyDesc

            );


        const colliderDesc =

            this.RAPIER
                .ColliderDesc
                .cylinder(

                    height / 2,
                    radius

                )
                .setDensity(
                    density
                )
                .setFriction(
                    friction
                )
                .setRestitution(
                    restitution
                );


        this.world.createCollider(

            colliderDesc,
            body

        );


        this.dynamicBodies.push(
            body
        );


        return body;

    }


    /* =====================================================
       DYNAMIC BALL
    ====================================================== */

    createDynamicBall({

        position,

        radius,

        density = 1,

        friction = 0.4,

        restitution = 0.5

    }) {

        const bodyDesc =

            this.RAPIER
                .RigidBodyDesc
                .dynamic()
                .setTranslation(

                    position.x,
                    position.y,
                    position.z

                )
                .setLinearDamping(
                    0.10
                )
                .setAngularDamping(
                    0.12
                );


        const body =

            this.world.createRigidBody(

                bodyDesc

            );


        const colliderDesc =

            this.RAPIER
                .ColliderDesc
                .ball(
                    radius
                )
                .setDensity(
                    density
                )
                .setFriction(
                    friction
                )
                .setRestitution(
                    restitution
                );


        this.world.createCollider(

            colliderDesc,
            body

        );


        this.dynamicBodies.push(
            body
        );


        return body;

    }


    /* =====================================================
       APPLY IMPULSE
    ====================================================== */

    applyImpulse(

        rigidBody,

        impulse

    ) {

        if (!rigidBody) {
            return;
        }


        try {

            rigidBody.applyImpulse(

                {

                    x: impulse.x,
                    y: impulse.y,
                    z: impulse.z

                },

                true

            );

        }

        catch (error) {

            console.warn(

                "[Physics] No se pudo aplicar impulso:",

                error

            );

        }

    }


    /* =====================================================
       REMOVE RIGID BODY

       Usado cuando un barril explota.
    ====================================================== */

    removeRigidBody(
        rigidBody
    ) {

        if (
            !this.world ||
            !rigidBody
        ) {

            return;

        }


        const index =

            this.dynamicBodies
                .indexOf(
                    rigidBody
                );


        if (index !== -1) {

            this.dynamicBodies.splice(

                index,
                1

            );

        }


        try {

            this.world.removeRigidBody(
                rigidBody
            );

        }

        catch (error) {

            console.warn(

                "[Physics] No se pudo eliminar RigidBody:",

                error

            );

        }

    }


    /* =====================================================
       MOVE CHARACTER
    ====================================================== */

    moveCharacter(

        desiredMovement,

        deltaTime

    ) {

        if (
            !this.characterBody ||
            !this.characterCollider ||
            !this.characterController
        ) {

            return;

        }


        this.verticalVelocity +=

            this.characterGravity *
            deltaTime;


        this.verticalVelocity =

            Math.max(

                this.verticalVelocity,
                this.maxFallSpeed

            );


        const requestedMovement = {

            x:
                desiredMovement.x,

            y:
                this.verticalVelocity *
                deltaTime,

            z:
                desiredMovement.z

        };


        this.characterController
            .computeColliderMovement(

                this.characterCollider,
                requestedMovement

            );


        const correctedMovement =

            this.characterController
                .computedMovement();


        this.grounded =

            this.characterController
                .computedGrounded();


        if (
            this.grounded &&
            this.verticalVelocity < 0
        ) {

            this.verticalVelocity = 0;

        }


        const currentPosition =

            this.characterBody
                .translation();


        this.characterBody
            .setNextKinematicTranslation({

                x:
                    currentPosition.x +
                    correctedMovement.x,

                y:
                    currentPosition.y +
                    correctedMovement.y,

                z:
                    currentPosition.z +
                    correctedMovement.z

            });

    }


    /* =====================================================
       STEP
    ====================================================== */

    step(
        deltaTime
    ) {

        if (!this.world) {
            return;
        }


        this.world.timestep =

            THREE.MathUtils.clamp(

                deltaTime,

                1 / 120,

                1 / 30

            );


        this.world.step();

    }


    /* =====================================================
       SYNC PLAYER
    ====================================================== */

    syncCharacter(
        playerRoot
    ) {

        if (!this.characterBody) {
            return;
        }


        const position =

            this.characterBody
                .translation();


        playerRoot.position.set(

            position.x,

            position.y -
            this.characterFootOffset,

            position.z

        );

    }


    /* =====================================================
       GETTERS
    ====================================================== */

    isGrounded() {

        return this.grounded;

    }


    isReady() {

        return this.ready;

    }


    getWorld() {

        return this.world;

    }

}
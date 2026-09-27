/* =========================================================
   NOVA CATALYST
   Physics Manager

   Build v0.4
   Rapier 3D
========================================================= */

import * as THREE from "three";


/*
 * IMPORTANTE:
 *
 * Ya NO usamos Skypack.
 *
 * Utilizamos directamente el módulo ESM oficial
 * distribuido mediante jsDelivr.
 */

import RAPIER from
    "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.21.0/dist/rapier.mjs";


export class PhysicsManager {


    constructor() {

        this.RAPIER =
            RAPIER;


        this.world =
            null;


        this.ready =
            false;


        /* =================================================
           COLLIDERS DEL ESCENARIO
        ================================================= */

        this.environmentColliders =
            [];


        /* =================================================
           PERSONAJE
        ================================================= */

        this.characterBody =
            null;


        this.characterCollider =
            null;


        this.characterController =
            null;


        /* =================================================
           DIMENSIONES DEL JUGADOR
        ================================================= */

        this.characterHeight =
            1.8;


        this.characterRadius =
            0.28;


        this.characterHalfHeight =
            0.62;


        this.characterFootOffset =

            this.characterHalfHeight +
            this.characterRadius;


        /* =================================================
           GRAVEDAD MANUAL DEL CHARACTER CONTROLLER
        ================================================= */

        this.verticalVelocity =
            0;


        this.characterGravity =
            -18;


        this.maxFallSpeed =
            -30;


        this.grounded =
            false;

    }



    /* =====================================================
       INICIALIZAR RAPIER
    ====================================================== */

    async init() {

        if (
            this.ready
        ) {

            return;

        }


        console.log(
            "[Physics] Inicializando Rapier..."
        );


        /*
         * El paquete compat necesita inicialización
         * asíncrona antes de crear World, colliders, etc.
         */

        await this.RAPIER.init();


        /* =================================================
           MUNDO FÍSICO
        ================================================= */

        this.world =

            new this.RAPIER.World({

                x:
                    0,

                y:
                    -9.81,

                z:
                    0

            });



        /* =================================================
           CHARACTER CONTROLLER
        ================================================= */

        this.characterController =

            this.world
                .createCharacterController(

                    0.03

                );



        /* =================================================
           DESLIZARSE CONTRA PAREDES
        ================================================= */

        this.characterController
            .setSlideEnabled(
                true
            );



        /* =================================================
           SUBIR PEQUEÑOS ESCALONES
        ================================================= */

        this.characterController
            .enableAutostep(

                0.30,

                0.15,

                false

            );



        /* =================================================
           ADHERENCIA AL PISO
        ================================================= */

        this.characterController
            .enableSnapToGround(

                0.35

            );



        /* =================================================
           PENDIENTES
        ================================================= */

        this.characterController
            .setMaxSlopeClimbAngle(

                THREE.MathUtils
                    .degToRad(
                        45
                    )

            );


        this.characterController
            .setMinSlopeSlideAngle(

                THREE.MathUtils
                    .degToRad(
                        35
                    )

            );



        this.ready =
            true;


        console.log(
            "[Physics] Rapier ONLINE."
        );

    }



    /* =====================================================
       ELIMINAR COLLIDERS DEL ESCENARIO

       Esto permitirá cambiar posteriormente
       de Zona A al Boss Arena.
    ====================================================== */

    clearEnvironmentColliders() {

        if (
            !this.world
        ) {

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

            catch (
                error
            ) {

                console.warn(

                    "[Physics] No fue posible eliminar collider:",

                    error

                );

            }

        }


        this.environmentColliders =
            [];

    }



    /* =====================================================
       CREAR FÍSICA DEL ESCENARIO

       Cada Mesh Three.js se convierte a un
       TriMesh estático de Rapier.

       Esto permite utilizar la geometría real
       de pisos, paredes y estructuras.
    ====================================================== */

    createEnvironmentColliders(
        environment
    ) {

        if (
            !this.ready
        ) {

            throw new Error(

                "PhysicsManager aún no está inicializado."

            );

        }


        this.clearEnvironmentColliders();


        environment.updateMatrixWorld(
            true
        );


        let colliderCount =
            0;


        let triangleCount =
            0;


        let skippedMeshes =
            0;


        const vertex =
            new THREE.Vector3();



        environment.traverse(

            object => {

                /* =========================================
                   SOLO MESHES
                ========================================= */

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

                    geometry.attributes
                        ?.position;



                if (
                    !positionAttribute
                ) {

                    skippedMeshes++;

                    return;

                }



                /* =========================================
                   VÉRTICES EN COORDENADAS GLOBALES
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
                   ÍNDICES
                ========================================= */

                let indices;



                if (
                    geometry.index
                ) {

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

                            geometry.index
                                .getX(
                                    i
                                );

                    }

                }

                else {

                    /*
                     * Geometría no indexada:
                     * cada grupo de tres vértices
                     * representa un triángulo.
                     */

                    const validCount =

                        Math.floor(

                            positionAttribute.count /
                            3

                        )

                        * 3;


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



                if (
                    indices.length < 3
                ) {

                    skippedMeshes++;

                    return;

                }



                /* =========================================
                   COLLIDER TRIMESH
                ========================================= */

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

                        this.world
                            .createCollider(

                                colliderDesc

                            );


                    this.environmentColliders
                        .push(
                            collider
                        );


                    colliderCount++;


                    triangleCount +=

                        Math.floor(

                            indices.length /
                            3

                        );

                }

                catch (
                    error
                ) {

                    skippedMeshes++;


                    console.warn(

                        `[Physics] Mesh ignorado: ${object.name || "sin nombre"}`,

                        error

                    );

                }

            }

        );



        /*
         * Primer step para actualizar las
         * estructuras internas de Rapier.
         */

        this.world.step();



        console.log(

            "[Physics] Escenario físico generado:",

            {

                colliders:
                    colliderCount,

                triangles:
                    triangleCount,

                skippedMeshes:
                    skippedMeshes

            }

        );

    }



    /* =====================================================
       CREAR PERSONAJE FÍSICO
    ====================================================== */

    createCharacter(

        spawnPosition,

        characterHeight = 1.8

    ) {

        if (
            !this.ready
        ) {

            throw new Error(

                "Rapier aún no está inicializado."

            );

        }



        this.characterHeight =
            characterHeight;


        this.characterRadius =
            0.28;



        /*
         * Rapier define capsule(halfHeight, radius).
         *
         * halfHeight corresponde únicamente a la
         * mitad de la parte cilíndrica.
         */

        this.characterHalfHeight =

            Math.max(

                0.1,

                (
                    characterHeight -

                    this.characterRadius *
                    2
                )

                / 2

            );



        this.characterFootOffset =

            this.characterHalfHeight +

            this.characterRadius;



        /* =================================================
           RIGID BODY CINEMÁTICO
        ================================================= */

        const rigidBodyDesc =

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

            this.world
                .createRigidBody(

                    rigidBodyDesc

                );



        /* =================================================
           COLLIDER CÁPSULA
        ================================================= */

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

            this.world
                .createCollider(

                    colliderDesc,

                    this.characterBody

                );



        this.verticalVelocity =
            0;


        this.grounded =
            false;



        /*
         * Actualizamos una vez antes de comenzar.
         */

        this.world.step();



        console.log(

            "[Physics] Character Controller creado:",

            {

                characterHeight:
                    this.characterHeight,

                radius:
                    this.characterRadius,

                halfHeight:
                    this.characterHalfHeight,

                footOffset:
                    this.characterFootOffset,

                spawn:
                    {

                        x:
                            spawnPosition.x,

                        y:
                            spawnPosition.y,

                        z:
                            spawnPosition.z

                    }

            }

        );

    }



    /* =====================================================
       MOVER PERSONAJE

       desiredMovement contiene el movimiento
       horizontal solicitado por PlayerController.
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



        /* =================================================
           GRAVEDAD
        ================================================= */

        this.verticalVelocity +=

            this.characterGravity *
            deltaTime;



        this.verticalVelocity =

            Math.max(

                this.verticalVelocity,

                this.maxFallSpeed

            );



        /* =================================================
           MOVIMIENTO DESEADO
        ================================================= */

        const requestedMovement = {

            x:
                desiredMovement.x,

            y:

                this.verticalVelocity *
                deltaTime,

            z:
                desiredMovement.z

        };



        /* =================================================
           RAPIER CALCULA COLISIONES
        ================================================= */

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

            this.verticalVelocity =
                0;

        }



        /* =================================================
           POSICIÓN ACTUAL DEL BODY
        ================================================= */

        const currentPosition =

            this.characterBody
                .translation();



        /* =================================================
           SIGUIENTE POSICIÓN CINEMÁTICA
        ================================================= */

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

        if (
            !this.world
        ) {

            return;

        }



        /*
         * Limitamos la simulación para evitar
         * saltos gigantes si cambia de pestaña.
         */

        this.world.timestep =

            THREE.MathUtils.clamp(

                deltaTime,

                1 / 120,

                1 / 30

            );



        this.world.step();

    }



    /* =====================================================
       SINCRONIZAR MODELO THREE.JS
    ====================================================== */

    syncCharacter(
        playerRoot
    ) {

        if (
            !this.characterBody
        ) {

            return;

        }



        const position =

            this.characterBody
                .translation();



        /*
         * Rapier usa el centro de la cápsula.
         *
         * Three.js usa los pies del jugador
         * como posición del root.
         */

        playerRoot.position.set(

            position.x,

            position.y -
            this.characterFootOffset,

            position.z

        );

    }



    /* =====================================================
       DEBUG
    ====================================================== */

    isGrounded() {

        return this.grounded;

    }



    isReady() {

        return this.ready;

    }

}
/* =========================================================
   NOVA CATALYST
   Enemy System

   Performance Build v0.8.4

   - FBX
   - AnimationMixer
   - Spawn anomaly
   - 30 Hz AI
   - Box wall collision
   - No triangle raycasting
   - Object avoidance
   - Player separation
========================================================= */

import * as THREE from "three";

import {
    FBXLoader
} from "three/addons/loaders/FBXLoader.js";

import * as SkeletonUtils
    from "three/addons/utils/SkeletonUtils.js";


/* =========================================================
   PATHS
========================================================= */

const ENEMY_PATHS = {

    model:
        "./assets/models/enemies/enemy.fbx",

    animations: {

        Idle:
            "./assets/models/enemies/animations/Idle.fbx",

        Walk:
            "./assets/models/enemies/animations/Walk.fbx",

        Run:
            "./assets/models/enemies/animations/Run.fbx",

        Attack_01:
            "./assets/models/enemies/animations/Attack_01.fbx",

        Attack_02:
            "./assets/models/enemies/animations/Attack_02.fbx",

        Hit:
            "./assets/models/enemies/animations/Hit.fbx",

        Death:
            "./assets/models/enemies/animations/Death.fbx"

    }

};


/* =========================================================
   CONFIG
========================================================= */

const ENEMY_CONFIG = {

    targetHeight:
        1.85,

    maxHealth:
        100,


    detectionDistance:
        45,

    runDistance:
        10,

    attackDistance:
        1.55,

    playerCollisionDistance:
        1.05,


    walkSpeed:
        1.35,

    runSpeed:
        3.15,

    rotationSpeed:
        9,


    radius:
        0.42,


    /* =====================================================
       30 Hz AI
    ====================================================== */

    aiStep:
        1 / 30,


    /* =====================================================
       STATIC COLLISION CACHE
    ====================================================== */

    wallCacheInterval:
        0.15,

    wallCacheRadius:
        2.2,

    wallProbeDistance:
        0.60,


    /* =====================================================
       DYNAMIC OBJECTS
    ====================================================== */

    objectCheckInterval:
        0.14,

    obstacleRadius:
        1.25,

    avoidanceStrength:
        2.2,

    pushRadius:
        0.85,

    pushForce:
        0.9,

    pushCooldown:
        0.18,


    /* =====================================================
       ATTACK
    ====================================================== */

    attackCooldown:
        1.30,


    /* =====================================================
       SPAWN
    ====================================================== */

    spawnDuration:
        1.15,

    spawnParticles:
        18,


    healthBarHeight:
        2.16

};


/* =========================================================
   SPAWN EFFECT
========================================================= */

class EnemySpawnEffect {

    constructor(
        scene,
        position
    ) {

        this.scene =
            scene;


        this.elapsed =
            0;


        this.finished =
            false;


        this.group =
            new THREE.Group();


        this.group.position.copy(
            position
        );


        scene.add(
            this.group
        );


        /* =================================================
           RING
        ================================================= */

        this.ring =

            new THREE.Mesh(

                new THREE.RingGeometry(

                    0.28,

                    0.38,

                    24

                ),

                new THREE.MeshBasicMaterial({

                    color:
                        0xff1b17,

                    transparent:
                        true,

                    opacity:
                        0.88,

                    side:
                        THREE.DoubleSide,

                    depthWrite:
                        false,

                    blending:
                        THREE.AdditiveBlending

                })

            );


        this.ring.rotation.x =
            -Math.PI / 2;


        this.ring.position.y =
            0.03;


        this.group.add(
            this.ring
        );


        /* =================================================
           COLUMN
        ================================================= */

        this.column =

            new THREE.Mesh(

                new THREE.CylinderGeometry(

                    0.38,

                    0.58,

                    1.9,

                    10,

                    1,

                    true

                ),

                new THREE.MeshBasicMaterial({

                    color:
                        0xff1717,

                    transparent:
                        true,

                    opacity:
                        0.10,

                    side:
                        THREE.DoubleSide,

                    depthWrite:
                        false,

                    blending:
                        THREE.AdditiveBlending

                })

            );


        this.column.position.y =
            0.9;


        this.group.add(
            this.column
        );


        /* =================================================
           PARTICLES
        ================================================= */

        const positions =

            new Float32Array(

                ENEMY_CONFIG.spawnParticles *
                3

            );


        this.data =
            [];


        for (
            let i = 0;
            i < ENEMY_CONFIG.spawnParticles;
            i++
        ) {

            const angle =

                Math.random() *
                Math.PI *
                2;


            const radius =

                0.12 +
                Math.random() *
                0.5;


            positions[i * 3] =

                Math.cos(angle) *
                radius;


            positions[i * 3 + 1] =

                Math.random() *
                1.5;


            positions[i * 3 + 2] =

                Math.sin(angle) *
                radius;


            this.data.push({

                angle,

                radius,

                speed:
                    1 +
                    Math.random() * 2,

                rise:
                    0.4 +
                    Math.random() * 0.7

            });

        }


        const geometry =
            new THREE.BufferGeometry();


        geometry.setAttribute(

            "position",

            new THREE.BufferAttribute(

                positions,

                3

            )

        );


        this.particles =

            new THREE.Points(

                geometry,

                new THREE.PointsMaterial({

                    color:
                        0xff2525,

                    size:
                        0.07,

                    transparent:
                        true,

                    opacity:
                        0.85,

                    depthWrite:
                        false,

                    blending:
                        THREE.AdditiveBlending

                })

            );


        this.group.add(
            this.particles
        );


        /* =================================================
           LIGHT
        ================================================= */

        this.light =

            new THREE.PointLight(

                0xff1818,

                16,

                4.5,

                2

            );


        this.light.position.y =
            0.9;


        this.light.castShadow =
            false;


        this.group.add(
            this.light
        );

    }


    update(
        deltaTime
    ) {

        if (
            this.finished
        ) {
            return;
        }


        this.elapsed +=
            deltaTime;


        const progress =

            THREE.MathUtils.clamp(

                this.elapsed /
                ENEMY_CONFIG.spawnDuration,

                0,

                1

            );


        this.ring.scale.setScalar(

            0.45 +
            progress * 2.1

        );


        this.ring.rotation.z +=

            deltaTime *
            1.8;


        const pulse =

            0.5 +

            Math.sin(

                this.elapsed *
                15

            ) *
            0.5;


        this.column.material.opacity =

            0.05 +
            pulse * 0.08;


        this.light.intensity =

            10 +
            pulse * 8;


        const attribute =

            this.particles
                .geometry
                .attributes
                .position;


        const array =
            attribute.array;


        for (
            let i = 0;
            i < this.data.length;
            i++
        ) {

            const data =
                this.data[i];


            data.angle +=

                data.speed *
                deltaTime;


            let y =
                array[i * 3 + 1];


            y +=

                data.rise *
                deltaTime;


            if (
                y >
                1.6
            ) {

                y =
                    0;

            }


            array[i * 3] =

                Math.cos(
                    data.angle
                ) *
                data.radius;


            array[i * 3 + 1] =
                y;


            array[i * 3 + 2] =

                Math.sin(
                    data.angle
                ) *
                data.radius;

        }


        attribute.needsUpdate =
            true;


        if (
            progress >
            0.72
        ) {

            const fade =

                1 -

                (
                    progress -
                    0.72
                ) /
                0.28;


            this.ring.material.opacity =

                0.88 *
                fade;


            this.column.material.opacity *=
                fade;


            this.particles.material.opacity =
                fade;


            this.light.intensity *=
                fade;

        }


        if (
            progress >=
            1
        ) {

            this.dispose();

        }

    }


    dispose() {

        if (
            this.finished
        ) {
            return;
        }


        this.finished =
            true;


        this.group.traverse(

            object => {

                object.geometry?.dispose?.();

                object.material?.dispose?.();

            }

        );


        this.scene.remove(
            this.group
        );

    }

}


/* =========================================================
   ENEMY
========================================================= */

export class Enemy {

    constructor({

        scene,

        modelSource,

        animationClips,

        spawnPosition,

        playerController,

        objectManager,

        physicsManager,

        wallBoxes

    }) {

        this.scene =
            scene;


        this.playerController =
            playerController;


        this.objectManager =
            objectManager;


        this.physicsManager =
            physicsManager;


        this.allWallBoxes =
            wallBoxes;


        /* =================================================
           ROOT
        ================================================= */

        this.root =
            new THREE.Group();


        this.root.position.copy(
            spawnPosition
        );


        this.baseY =
            spawnPosition.y;


        scene.add(
            this.root
        );


        /* =================================================
           MODEL
        ================================================= */

        this.model =

            SkeletonUtils.clone(
                modelSource
            );


        this.root.add(
            this.model
        );


        /* =================================================
           STATE
        ================================================= */

        this.health =
            ENEMY_CONFIG.maxHealth;


        this.maxHealth =
            ENEMY_CONFIG.maxHealth;


        this.dead =
            false;


        this.spawning =
            true;


        this.spawnTimer =
            ENEMY_CONFIG.spawnDuration;


        this.model.visible =
            false;


        this.spawnEffect =

            new EnemySpawnEffect(

                scene,

                spawnPosition

            );


        this.isHit =
            false;


        this.isAttacking =
            false;


        this.attackTimer =
            0;


        this.state =
            "Idle";


        /* =================================================
           TIMERS
        ================================================= */

        this.aiAccumulator =
            0;


        this.wallCacheTimer =
            0;


        this.objectTimer =
            0;


        this.pushTimer =
            0;


        /* =================================================
           ANIMATION
        ================================================= */

        this.mixer =

            new THREE.AnimationMixer(
                this.model
            );


        this.actions =
            new Map();


        this.currentAction =
            null;


        this.currentActionName =
            null;


        /* =================================================
           COLLISION
        ================================================= */

        this.nearbyWalls =
            [];


        this.queryBox =
            new THREE.Box3();


        this.collisionRay =
            new THREE.Ray();


        this.collisionPoint =
            new THREE.Vector3();


        this.wallNormal =
            new THREE.Vector3();


        /* =================================================
           TEMP
        ================================================= */

        this.playerPosition =
            new THREE.Vector3();


        this.moveDirection =
            new THREE.Vector3();


        this.finalDirection =
            new THREE.Vector3();


        this.avoidance =
            new THREE.Vector3();


        this.tempDirection =
            new THREE.Vector3();


        this.tempPosition =
            new THREE.Vector3();


        this.rightDirection =
            new THREE.Vector3();


        this.slideDirection =
            new THREE.Vector3();


        this.targetQuaternion =
            new THREE.Quaternion();


        this.tempEuler =
            new THREE.Euler();


        /* =================================================
           INIT
        ================================================= */

        this.configureModel();

        this.createActions(
            animationClips
        );

        this.createHealthBar();

        this.markMeshes();

        this.playAnimation(
            "Idle",
            0
        );

    }


    /* =====================================================
       MODEL
    ====================================================== */

    configureModel() {

        this.model.traverse(

            object => {

                if (
                    !object.isMesh
                ) {
                    return;
                }


                object.castShadow =
                    false;


                object.receiveShadow =
                    false;


                object.frustumCulled =
                    true;

            }

        );


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
            size.y >
            0
        ) {

            this.model.scale.setScalar(

                ENEMY_CONFIG.targetHeight /
                size.y

            );

        }


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

    }


    markMeshes() {

        this.model.traverse(

            object => {

                if (
                    !object.isMesh
                ) {
                    return;
                }


                object.userData.isEnemy =
                    true;


                object.userData.enemy =
                    this;

            }

        );

    }


    /* =====================================================
       ROOT MOTION
    ====================================================== */

    removeRootMotion(
        clip
    ) {

        for (
            const track
            of clip.tracks
        ) {

            const name =
                track.name.toLowerCase();


            if (
                !name.endsWith(
                    ".position"
                )
            ) {
                continue;
            }


            if (
                !name.includes("hips")

                &&

                !name.includes("root")
            ) {
                continue;
            }


            const values =
                track.values;


            if (
                values.length <
                3
            ) {
                continue;
            }


            const x =
                values[0];


            const z =
                values[2];


            for (
                let i = 0;
                i < values.length;
                i += 3
            ) {

                values[i] =
                    x;


                values[i + 2] =
                    z;

            }

        }


        clip.resetDuration();


        return clip;

    }


    /* =====================================================
       ANIMATIONS
    ====================================================== */

    createActions(
        clips
    ) {

        for (
            const [
                name,
                source
            ]
            of clips.entries()
        ) {

            const clip =

                this.removeRootMotion(

                    source.clone()

                );


            const action =

                this.mixer.clipAction(
                    clip
                );


            action._novaName =
                name;


            if (
                name === "Attack_01"

                ||

                name === "Attack_02"

                ||

                name === "Hit"

                ||

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

            }


            this.actions.set(
                name,
                action
            );

        }


        this.mixer.addEventListener(

            "finished",

            event => {

                const name =
                    event.action?._novaName;


                if (
                    name ===
                    "Hit"
                ) {

                    this.isHit =
                        false;


                    if (
                        !this.dead
                    ) {

                        this.changeState(
                            "Idle"
                        );

                    }


                    return;

                }


                if (
                    name === "Attack_01"

                    ||

                    name === "Attack_02"
                ) {

                    this.isAttacking =
                        false;


                    if (
                        !this.dead
                    ) {

                        this.changeState(
                            "Idle"
                        );

                    }

                }

            }

        );

    }


    playAnimation(
        name,
        fade = 0.12
    ) {

        const next =

            this.actions.get(
                name
            );


        if (
            !next

            ||

            next ===
            this.currentAction
        ) {
            return;
        }


        const previous =
            this.currentAction;


        next.reset();

        next.enabled =
            true;

        next.play();


        previous?.crossFadeTo(

            next,

            fade,

            true

        );


        this.currentAction =
            next;


        this.currentActionName =
            name;

    }


    changeState(
        state
    ) {

        if (
            this.dead

            ||

            this.state ===
            state
        ) {
            return;
        }


        this.state =
            state;


        this.playAnimation(
            state
        );

    }


    /* =====================================================
       HEALTH BAR
    ====================================================== */

    createHealthBar() {

        this.healthBar =
            new THREE.Group();


        this.healthBar.position.y =
            ENEMY_CONFIG.healthBarHeight;


        this.root.add(
            this.healthBar
        );


        this.healthBack =

            new THREE.Mesh(

                new THREE.PlaneGeometry(
                    1,
                    0.10
                ),

                new THREE.MeshBasicMaterial({

                    color:
                        0x111111,

                    depthTest:
                        false

                })

            );


        this.healthFill =

            new THREE.Mesh(

                new THREE.PlaneGeometry(
                    0.94,
                    0.065
                ),

                new THREE.MeshBasicMaterial({

                    color:
                        0xd82620,

                    depthTest:
                        false

                })

            );


        this.healthFill.position.z =
            0.002;


        this.healthBar.add(

            this.healthBack,

            this.healthFill

        );


        this.healthBar.visible =
            false;

    }


    updateHealthBar(
        camera
    ) {

        if (
            this.spawning

            ||

            this.dead
        ) {

            this.healthBar.visible =
                false;

            return;

        }


        this.healthBar.visible =
            true;


        this.healthBar.quaternion.copy(
            camera.quaternion
        );


        const percent =

            this.health /
            this.maxHealth;


        this.healthFill.scale.x =
            percent;


        this.healthFill.position.x =

            -0.47 *
            (
                1 -
                percent
            );

    }


    /* =====================================================
       LOCAL WALL CACHE
    ====================================================== */

    refreshWallCache() {

        this.nearbyWalls.length =
            0;


        const radius =
            ENEMY_CONFIG.wallCacheRadius;


        this.queryBox.min.set(

            this.root.position.x -
            radius,

            this.root.position.y,

            this.root.position.z -
            radius

        );


        this.queryBox.max.set(

            this.root.position.x +
            radius,

            this.root.position.y +
            2,

            this.root.position.z +
            radius

        );


        for (
            const box
            of this.allWallBoxes
        ) {

            if (
                box.intersectsBox(
                    this.queryBox
                )
            ) {

                this.nearbyWalls.push(
                    box
                );

            }

        }

    }


    /* =====================================================
       BOX NORMAL
    ====================================================== */

    getBoxNormal(

        box,

        point,

        output

    ) {

        let best =
            Infinity;


        output.set(
            0,
            0,
            0
        );


        let distance =

            Math.abs(

                point.x -
                box.min.x

            );


        if (
            distance <
            best
        ) {

            best =
                distance;

            output.set(
                -1,
                0,
                0
            );

        }


        distance =

            Math.abs(

                point.x -
                box.max.x

            );


        if (
            distance <
            best
        ) {

            best =
                distance;

            output.set(
                1,
                0,
                0
            );

        }


        distance =

            Math.abs(

                point.z -
                box.min.z

            );


        if (
            distance <
            best
        ) {

            best =
                distance;

            output.set(
                0,
                0,
                -1
            );

        }


        distance =

            Math.abs(

                point.z -
                box.max.z

            );


        if (
            distance <
            best
        ) {

            output.set(
                0,
                0,
                1
            );

        }


        return output;

    }


    /* =====================================================
       FAST WALL TEST
    ====================================================== */

    findWall(

        direction,

        distance

    ) {

        const originX =
            this.root.position.x;


        const originY =
            this.root.position.y +
            0.85;


        const originZ =
            this.root.position.z;


        this.collisionRay.origin.set(

            originX,

            originY,

            originZ

        );


        this.collisionRay.direction.copy(
            direction
        );


        let nearest =
            null;


        let nearestDistance =
            distance +
            ENEMY_CONFIG.radius;


        for (
            const box
            of this.nearbyWalls
        ) {

            /*
             * Evita cajas enormes que ya contengan
             * al enemigo.
             */
            if (
                box.containsPoint(
                    this.collisionRay.origin
                )
            ) {
                continue;
            }


            const point =

                this.collisionRay.intersectBox(

                    box,

                    this.collisionPoint

                );


            if (
                !point
            ) {
                continue;
            }


            const hitDistance =

                this.collisionRay.origin
                    .distanceTo(
                        point
                    );


            if (
                hitDistance >
                nearestDistance
            ) {
                continue;
            }


            nearestDistance =
                hitDistance;


            nearest = {

                box,

                pointX:
                    point.x,

                pointY:
                    point.y,

                pointZ:
                    point.z

            };

        }


        if (
            !nearest
        ) {
            return false;
        }


        this.collisionPoint.set(

            nearest.pointX,

            nearest.pointY,

            nearest.pointZ

        );


        this.getBoxNormal(

            nearest.box,

            this.collisionPoint,

            this.wallNormal

        );


        return true;

    }


    /* =====================================================
       OBJECT AVOIDANCE
    ====================================================== */

    refreshObjectAvoidance() {

        this.avoidance.set(
            0,
            0,
            0
        );


        if (
            !this.objectManager
        ) {
            return;
        }


        const objects =

            this.objectManager
                .getDynamicObjects();


        for (
            const object
            of objects
        ) {

            if (
                !object.mesh

                ||

                !object.rigidBody
            ) {
                continue;
            }


            object.mesh.getWorldPosition(
                this.tempPosition
            );


            this.tempDirection
                .subVectors(

                    this.root.position,

                    this.tempPosition

                );


            this.tempDirection.y =
                0;


            const distance =
                this.tempDirection.length();


            if (
                distance <
                0.001

                ||

                distance >
                ENEMY_CONFIG.obstacleRadius
            ) {
                continue;
            }


            this.tempDirection.normalize();


            this.avoidance.addScaledVector(

                this.tempDirection,

                (
                    1 -

                    distance /
                    ENEMY_CONFIG.obstacleRadius
                )

                *

                ENEMY_CONFIG.avoidanceStrength

            );


            if (
                distance <
                ENEMY_CONFIG.pushRadius

                &&

                this.pushTimer <=
                0
            ) {

                this.tempDirection
                    .copy(
                        this.moveDirection
                    )
                    .multiplyScalar(

                        ENEMY_CONFIG.pushForce

                    );


                this.tempDirection.y =
                    0.04;


                this.physicsManager.applyImpulse(

                    object.rigidBody,

                    this.tempDirection

                );


                this.pushTimer =
                    ENEMY_CONFIG.pushCooldown;

            }

        }

    }


    /* =====================================================
       PLAYER COLLISION
    ====================================================== */

    resolvePlayerCollision() {

        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerPosition
            );


        this.tempDirection
            .subVectors(

                this.root.position,

                this.playerPosition

            );


        this.tempDirection.y =
            0;


        const distance =
            this.tempDirection.length();


        if (
            distance <=
            0.001

            ||

            distance >=
            ENEMY_CONFIG.playerCollisionDistance
        ) {
            return;
        }


        this.tempDirection.normalize();


        this.root.position.addScaledVector(

            this.tempDirection,

            ENEMY_CONFIG.playerCollisionDistance -
            distance

        );

    }


    /* =====================================================
       MOVE
    ====================================================== */

    moveWithCollision(

        direction,

        speed,

        deltaTime

    ) {

        const distance =

            speed *
            deltaTime;


        if (
            !this.findWall(

                direction,

                distance

            )
        ) {

            this.root.position.addScaledVector(

                direction,

                distance

            );


            return;

        }


        /*
         * Slide along the wall.
         */

        const intoWall =

            direction.dot(
                this.wallNormal
            );


        this.slideDirection.copy(
            direction
        );


        if (
            intoWall <
            0
        ) {

            this.slideDirection.addScaledVector(

                this.wallNormal,

                -intoWall

            );

        }


        this.slideDirection.y =
            0;


        if (
            this.slideDirection.lengthSq() <
            0.001
        ) {
            return;
        }


        this.slideDirection.normalize();


        if (
            !this.findWall(

                this.slideDirection,

                distance *
                0.8

            )
        ) {

            this.root.position.addScaledVector(

                this.slideDirection,

                distance *
                0.8

            );

        }

    }


    /* =====================================================
       ROTATE
    ====================================================== */

    rotateTowardPlayer(
        deltaTime
    ) {

        this.tempDirection
            .subVectors(

                this.playerPosition,

                this.root.position

            );


        this.tempDirection.y =
            0;


        if (
            this.tempDirection.lengthSq() <
            0.001
        ) {
            return;
        }


        this.tempDirection.normalize();


        this.tempEuler.set(

            0,

            Math.atan2(

                this.tempDirection.x,

                this.tempDirection.z

            ),

            0

        );


        this.targetQuaternion.setFromEuler(
            this.tempEuler
        );


        this.root.quaternion.slerp(

            this.targetQuaternion,

            1 -

            Math.exp(

                -ENEMY_CONFIG.rotationSpeed *
                deltaTime

            )

        );

    }


    /* =====================================================
       MOVE TO PLAYER
    ====================================================== */

    moveTowardPlayer(

        speed,

        deltaTime

    ) {

        this.moveDirection
            .subVectors(

                this.playerPosition,

                this.root.position

            );


        this.moveDirection.y =
            0;


        if (
            this.moveDirection.length() <=
            ENEMY_CONFIG.attackDistance
        ) {
            return;
        }


        this.moveDirection.normalize();


        this.finalDirection
            .copy(
                this.moveDirection
            )
            .add(
                this.avoidance
            );


        this.finalDirection.y =
            0;


        if (
            this.finalDirection.lengthSq() <
            0.001
        ) {
            return;
        }


        this.finalDirection.normalize();


        this.moveWithCollision(

            this.finalDirection,

            speed,

            deltaTime

        );


        /*
         * Zona A es esencialmente plana.
         * Evitamos cualquier drift vertical.
         */
        this.root.position.y =
            this.baseY;


        this.resolvePlayerCollision();

    }


    /* =====================================================
       ATTACK
    ====================================================== */

    attackPlayer() {

        if (
            this.dead

            ||

            this.spawning

            ||

            this.isHit

            ||

            this.isAttacking

            ||

            this.attackTimer >
            0
        ) {
            return;
        }


        this.isAttacking =
            true;


        this.attackTimer =
            ENEMY_CONFIG.attackCooldown;


        const animation =

            Math.random() <
            0.5

                ?

                "Attack_01"

                :

                "Attack_02";


        this.state =
            animation;


        this.playAnimation(

            animation,

            0.08

        );

    }


    /* =====================================================
       DAMAGE
    ====================================================== */

    takeDamage(
        amount
    ) {

        if (
            this.dead

            ||

            this.spawning
        ) {
            return false;
        }


        this.health =

            Math.max(

                0,

                this.health -
                amount

            );


        if (
            this.health <=
            0
        ) {

            this.die();

            return true;

        }


        this.isHit =
            true;


        this.isAttacking =
            false;


        this.state =
            "Hit";


        this.playAnimation(
            "Hit",
            0.06
        );


        return false;

    }


    die() {

        if (
            this.dead
        ) {
            return;
        }


        this.dead =
            true;


        this.healthBar.visible =
            false;


        this.playAnimation(
            "Death",
            0.08
        );

    }


    /* =====================================================
       SPAWN
    ====================================================== */

    updateSpawn(
        deltaTime
    ) {

        if (
            !this.spawning
        ) {
            return false;
        }


        this.spawnEffect.update(
            deltaTime
        );


        this.spawnTimer -=
            deltaTime;


        if (
            this.spawnTimer <=
            0
        ) {

            this.spawning =
                false;


            this.model.visible =
                true;


            this.refreshWallCache();


            this.playAnimation(
                "Idle",
                0
            );

        }


        return true;

    }


    /* =====================================================
       AI STEP
    ====================================================== */

    updateAI(
        deltaTime
    ) {

        this.wallCacheTimer -=
            deltaTime;


        this.objectTimer -=
            deltaTime;


        this.pushTimer -=
            deltaTime;


        this.attackTimer -=
            deltaTime;


        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerPosition
            );


        if (
            this.wallCacheTimer <=
            0
        ) {

            this.wallCacheTimer =
                ENEMY_CONFIG.wallCacheInterval;


            this.refreshWallCache();

        }


        if (
            this.objectTimer <=
            0
        ) {

            this.objectTimer =
                ENEMY_CONFIG.objectCheckInterval;


            this.refreshObjectAvoidance();

        }


        this.resolvePlayerCollision();


        if (
            this.isHit

            ||

            this.isAttacking
        ) {

            this.rotateTowardPlayer(
                deltaTime
            );


            return;

        }


        const distance =

            this.root.position
                .distanceTo(
                    this.playerPosition
                );


        if (
            distance >
            ENEMY_CONFIG.detectionDistance
        ) {

            this.changeState(
                "Idle"
            );

            return;

        }


        if (
            distance <=
            ENEMY_CONFIG.attackDistance
        ) {

            this.changeState(
                "Idle"
            );


            this.rotateTowardPlayer(
                deltaTime
            );


            this.attackPlayer();

            return;

        }


        this.rotateTowardPlayer(
            deltaTime
        );


        if (
            distance <=
            ENEMY_CONFIG.runDistance
        ) {

            this.changeState(
                "Run"
            );


            this.moveTowardPlayer(

                ENEMY_CONFIG.runSpeed,

                deltaTime

            );

        }

        else {

            this.changeState(
                "Walk"
            );


            this.moveTowardPlayer(

                ENEMY_CONFIG.walkSpeed,

                deltaTime

            );

        }

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update(
        deltaTime,
        camera
    ) {

        /*
         * Animations remain at display refresh rate.
         */
        this.mixer.update(
            deltaTime
        );


        if (
            this.updateSpawn(
                deltaTime
            )
        ) {
            return;
        }


        if (
            this.dead
        ) {
            return;
        }


        this.updateHealthBar(
            camera
        );


        /* =================================================
           AI = 30 Hz
        ================================================= */

        this.aiAccumulator +=
            deltaTime;


        if (
            this.aiAccumulator <
            ENEMY_CONFIG.aiStep
        ) {
            return;
        }


        const aiDelta =

            Math.min(

                this.aiAccumulator,

                0.08

            );


        this.aiAccumulator =
            0;


        this.updateAI(
            aiDelta
        );

    }


    getModel() {

        return this.model;

    }


    isDead() {

        return this.dead;

    }


    isSpawning() {

        return this.spawning;

    }

}


/* =========================================================
   ENEMY MANAGER
========================================================= */

export class EnemyManager {

    constructor({

        scene,

        playerController,

        camera,

        physicsManager,

        objectManager

    }) {

        this.scene =
            scene;


        this.playerController =
            playerController;


        this.camera =
            camera;


        this.physicsManager =
            physicsManager;


        this.objectManager =
            objectManager;


        this.loader =
            new FBXLoader();


        this.baseModel =
            null;


        this.animationClips =
            new Map();


        this.enemies =
            [];


        this.loaded =
            false;


        this.wallBoxes =
            [];


        this.tempSize =
            new THREE.Vector3();


        this.tempPlayerPosition =
            new THREE.Vector3();


        this.spawnDirection =
            new THREE.Vector3();


        this.up =
            new THREE.Vector3(
                0,
                1,
                0
            );

    }


    /* =====================================================
       STATIC COLLISION BOXES
    ====================================================== */

    setEnvironment(
        environment
    ) {

        this.wallBoxes.length =
            0;


        environment.updateMatrixWorld(
            true
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
                    this.tempSize
                );


                /*
                 * Pisos planos no necesitan ser tratados
                 * como paredes.
                 */
                if (
                    this.tempSize.y <
                    0.55
                ) {
                    return;
                }


                this.wallBoxes.push(
                    box
                );

            }

        );


        console.log(

            `[EnemyManager] Fast wall boxes: ${this.wallBoxes.length}`

        );

    }


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
       LOAD
    ====================================================== */

    async load() {

        if (
            this.loaded
        ) {
            return;
        }


        this.baseModel =

            await this.loadFBX(

                ENEMY_PATHS.model

            );


        for (
            const [
                name,
                path
            ]
            of Object.entries(
                ENEMY_PATHS.animations
            )
        ) {

            try {

                const fbx =

                    await this.loadFBX(
                        path
                    );


                if (
                    fbx.animations?.length
                ) {

                    const clip =

                        fbx.animations[0]
                            .clone();


                    clip.name =
                        name;


                    this.animationClips.set(

                        name,

                        clip

                    );

                }

            }

            catch (
                error
            ) {

                console.error(

                    `[Enemy] ${name}:`,

                    error

                );

            }

        }


        this.loaded =
            true;

    }


    /* =====================================================
       SPAWN
    ====================================================== */

    spawnTestEnemy(
        floorY
    ) {

        if (
            !this.loaded
        ) {
            return null;
        }


        this.playerController
            .getObject()
            .getWorldPosition(

                this.tempPlayerPosition

            );


        this.spawnDirection.copy(
            this.tempPlayerPosition
        );


        this.spawnDirection.y =
            0;


        if (
            this.spawnDirection.lengthSq() <
            0.001
        ) {

            this.spawnDirection.set(
                1,
                0,
                0
            );

        }


        this.spawnDirection.normalize();


        this.spawnDirection.applyAxisAngle(

            this.up,

            1.30

        );


        let radius =

            Math.hypot(

                this.tempPlayerPosition.x,

                this.tempPlayerPosition.z

            );


        if (
            radius <
            8
        ) {

            radius =
                16;

        }


        this.spawnDirection.multiplyScalar(
            radius
        );


        this.spawnDirection.y =
            floorY;


        const enemy =

            new Enemy({

                scene:
                    this.scene,

                modelSource:
                    this.baseModel,

                animationClips:
                    this.animationClips,

                spawnPosition:
                    this.spawnDirection,

                playerController:
                    this.playerController,

                objectManager:
                    this.objectManager,

                physicsManager:
                    this.physicsManager,

                wallBoxes:
                    this.wallBoxes

            });


        this.enemies.push(
            enemy
        );


        return enemy;

    }


    update(
        deltaTime
    ) {

        for (
            const enemy
            of this.enemies
        ) {

            enemy.update(

                deltaTime,

                this.camera

            );

        }

    }


    getHitMeshes() {

        const meshes =
            [];


        for (
            const enemy
            of this.enemies
        ) {

            if (
                enemy.isDead()

                ||

                enemy.isSpawning()
            ) {
                continue;
            }


            enemy.getModel().traverse(

                object => {

                    if (
                        object.isMesh
                    ) {

                        meshes.push(
                            object
                        );

                    }

                }

            );

        }


        return meshes;

    }


    getAliveEnemies() {

        return this.enemies.filter(

            enemy =>
                !enemy.isDead()

        );

    }


    getAliveCount() {

        return this.getAliveEnemies()
            .length;

    }

}
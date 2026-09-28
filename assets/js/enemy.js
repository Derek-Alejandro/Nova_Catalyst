/* =========================================================
   NOVA CATALYST
   Enemy System
   Build v0.11.2

   - Multiple enemies
   - Rapier physics
   - Chase / Run / Walk
   - Attack 01 / Attack 02
   - Hit
   - Death
   - Health bars
   - Spawn FX
   - Optimized animations
   - No dynamic enemy shadows
   - Cached hit meshes
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

    damageDistance:
        1.82,


    walkSpeed:
        1.35,

    runSpeed:
        3.15,

    rotationSpeed:
        9,


    physicsRadius:
        0.31,

    physicsMass:
        68,


    attackDamage:
        10,

    attackCooldown:
        1.30,

    attackImpactRatio01:
        0.48,

    attackImpactRatio02:
        0.53,


    aiInterval:
        0.08,


    stuckTime:
        0.28,

    steerDuration:
        0.70,

    steerStrength:
        0.82,


    spawnDuration:
        1.15,


    /*
     * Antes: 18.
     *
     * Ahora: 10 para reducir costo en waves.
     */
    spawnParticles:
        10,


    healthBarHeight:
        2.16,


    /*
     * Enemigos cerca actualizan animación más rápido.
     */
    nearAnimationDistance:
        7

};


/* =========================================================
   SPAWN EFFECT

   Ya NO crea PointLight individual.
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

                    20

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
            -Math.PI /
            2;


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

                    8,

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


            positions[
                i *
                3
            ] =
                Math.cos(
                    angle
                ) *
                radius;


            positions[
                i *
                3 +
                1
            ] =
                Math.random() *
                1.5;


            positions[
                i *
                3 +
                2
            ] =
                Math.sin(
                    angle
                ) *
                radius;


            this.data.push({

                angle,

                radius,

                speed:
                    1 +
                    Math.random() *
                    2,

                rise:
                    0.4 +
                    Math.random() *
                    0.7

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
            progress *
            2.1

        );


        this.ring.rotation.z +=
            deltaTime *
            1.8;


        const pulse =
            0.5

            +

            Math.sin(

                this.elapsed *
                15

            )

            *

            0.5;


        this.column.material.opacity =
            0.05 +
            pulse *
            0.08;


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
                array[
                    i *
                    3 +
                    1
                ];


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


            array[
                i *
                3
            ] =
                Math.cos(
                    data.angle
                ) *
                data.radius;


            array[
                i *
                3 +
                1
            ] =
                y;


            array[
                i *
                3 +
                2
            ] =
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
                1

                -

                (
                    progress -
                    0.72
                )

                /

                0.28;


            this.ring.material.opacity =
                0.88 *
                fade;


            this.column.material.opacity *=
                fade;


            this.particles.material.opacity =
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

                object.geometry
                    ?.dispose
                    ?.();


                if (
                    Array.isArray(
                        object.material
                    )
                ) {

                    for (
                        const material
                        of object.material
                    ) {

                        material
                            ?.dispose
                            ?.();

                    }

                }

                else {

                    object.material
                        ?.dispose
                        ?.();

                }

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

        physicsManager,

        camera,

        playerHealth,

        options = {}

    }) {

        this.scene =
            scene;


        this.playerController =
            playerController;


        this.physicsManager =
            physicsManager;


        this.camera =
            camera;


        this.playerHealth =
            playerHealth;


        /* =================================================
           INSTANCE CONFIG
        ================================================= */

        this.maxHealth =
            options.maxHealth

            ??

            ENEMY_CONFIG.maxHealth;


        this.attackDamage =
            options.attackDamage

            ??

            ENEMY_CONFIG.attackDamage;


        this.walkSpeed =
            options.walkSpeed

            ??

            ENEMY_CONFIG.walkSpeed;


        this.runSpeed =
            options.runSpeed

            ??

            ENEMY_CONFIG.runSpeed;


        this.attackCooldownDuration =
            options.attackCooldown

            ??

            ENEMY_CONFIG.attackCooldown;


        this.label =
            options.label

            ??

            "Infected";


        /* =================================================
           ROOT
        ================================================= */

        this.root =
            new THREE.Group();


        this.root.name =
            `NovaCatalyst_Enemy_${this.label}`;


        this.root.position.copy(
            spawnPosition
        );


        this.scene.add(
            this.root
        );


        /* =================================================
           MODEL
        ================================================= */

        this.model =
            SkeletonUtils.clone(
                modelSource
            );


        this.model.name =
            "Enemy_Visual";


        this.root.add(
            this.model
        );


        /* =================================================
           STATE
        ================================================= */

        this.health =
            this.maxHealth;


        this.dead =
            false;


        this.deathAnimationFinished =
            false;


        this.spawning =
            true;


        this.spawnTimer =
            ENEMY_CONFIG.spawnDuration;


        this.isHit =
            false;


        this.isAttacking =
            false;


        this.attackHasDealtDamage =
            false;


        this.attackTimer =
            0;


        this.state =
            "Idle";


        this.model.visible =
            false;


        /* =================================================
           SPAWN FX
        ================================================= */

        this.spawnEffect =
            new EnemySpawnEffect(

                this.scene,

                spawnPosition

            );


        /* =================================================
           PHYSICS
        ================================================= */

        this.physicsHandle =
            null;


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


        this.animationAccumulator =
            0;


        /* =================================================
           HIT MESH CACHE
        ================================================= */

        this.hitMeshes =
            [];


        /* =================================================
           AI
        ================================================= */

        this.aiTimer =
            0;


        this.desiredSpeed =
            0;


        /* =================================================
           ANTI-STUCK
        ================================================= */

        this.stuckTimer =
            0;


        this.steerTimer =
            0;


        this.steerSign =

            Math.random() <
            0.5

                ?

                -1

                :

                1;


        /* =================================================
           TEMP
        ================================================= */

        this.playerPosition =
            new THREE.Vector3();


        this.moveDirection =
            new THREE.Vector3();


        this.directDirection =
            new THREE.Vector3();


        this.sideDirection =
            new THREE.Vector3();


        this.faceDirection =
            new THREE.Vector3();


        this.lastSyncedPosition =
            spawnPosition.clone();


        this.targetQuaternion =
            new THREE.Quaternion();


        this.tempEuler =
            new THREE.Euler(

                0,

                0,

                0,

                "YXZ"

            );


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


                /*
                 * IMPORTANTE:
                 *
                 * Los infectados ya NO proyectan sombras
                 * dinámicas.
                 *
                 * SkinnedMesh + shadows x9 era muy caro.
                 */
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


        this.model.updateMatrixWorld(
            true
        );

    }


    /* =====================================================
       HIT MESH CACHE
    ====================================================== */

    markMeshes() {

        this.hitMeshes.length =
            0;


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


                this.hitMeshes.push(
                    object
                );

            }

        );

    }


    getHitMeshes() {

        if (
            this.dead
            ||
            this.spawning
        ) {

            return [];

        }


        return this.hitMeshes;

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
                track.name
                    .toLowerCase();


            if (
                !name.endsWith(
                    ".position"
                )
            ) {

                continue;

            }


            if (
                !name.includes(
                    "hips"
                )

                &&

                !name.includes(
                    "root"
                )
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


                values[
                    i +
                    2
                ] =
                    z;

            }

        }


        clip.resetDuration();


        return clip;

    }


    /* =====================================================
       ACTIONS
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
                this.mixer
                    .clipAction(
                        clip
                    );


            action._novaName =
                name;


            if (
                name ===
                "Attack_01"

                ||

                name ===
                "Attack_02"

                ||

                name ===
                "Hit"

                ||

                name ===
                "Death"
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
                    event.action
                        ?._novaName;


                /* =========================================
                   DEATH TERMINÓ
                ========================================= */

                if (
                    name ===
                    "Death"
                ) {

                    this.deathAnimationFinished =
                        true;


                    return;

                }


                /* =========================================
                   HIT TERMINÓ
                ========================================= */

                if (
                    name ===
                    "Hit"
                ) {

                    this.isHit =
                        false;


                    if (
                        !this.dead
                    ) {

                        this.state =
                            "Idle";


                        this.playAnimation(
                            "Idle"
                        );

                    }


                    return;

                }


                /* =========================================
                   ATTACK TERMINÓ
                ========================================= */

                if (
                    name ===
                    "Attack_01"

                    ||

                    name ===
                    "Attack_02"
                ) {

                    this.isAttacking =
                        false;


                    this.attackHasDealtDamage =
                        false;


                    if (
                        !this.dead
                    ) {

                        this.state =
                            "Idle";


                        this.playAnimation(
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


        next.setEffectiveWeight(
            1
        );


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
        ) {

            return;

        }


        if (
            this.state ===
            state

            &&

            this.currentActionName ===
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


        const background =
            new THREE.Mesh(

                new THREE.PlaneGeometry(
                    1,
                    0.10
                ),

                new THREE.MeshBasicMaterial({

                    color:
                        0x111111,

                    transparent:
                        true,

                    opacity:
                        0.82,

                    depthTest:
                        false,

                    depthWrite:
                        false,

                    side:
                        THREE.DoubleSide

                })

            );


        background.renderOrder =
            1000;


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
                        false,

                    depthWrite:
                        false,

                    side:
                        THREE.DoubleSide

                })

            );


        this.healthFill.position.z =
            0.002;


        this.healthFill.renderOrder =
            1001;


        this.healthBar.add(

            background,

            this.healthFill

        );


        this.healthBar.visible =
            false;

    }


    updateVisuals(
        camera
    ) {

        if (
            this.dead
            ||
            this.spawning
        ) {

            this.healthBar.visible =
                false;


            return;

        }


        this.healthBar.visible =
            true;


        this.healthBar.lookAt(
            camera.position
        );


        const percent =
            THREE.MathUtils.clamp(

                this.health /
                this.maxHealth,

                0,

                1

            );


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
       PHYSICS
    ====================================================== */

    createPhysicsCharacter() {

        if (
            this.physicsHandle
        ) {

            return;

        }


        this.physicsHandle =
            this.physicsManager
                .createEnemyCharacter({

                    spawnPosition:
                        this.root.position,

                    height:
                        ENEMY_CONFIG.targetHeight,

                    radius:
                        ENEMY_CONFIG.physicsRadius,

                    mass:
                        ENEMY_CONFIG.physicsMass

                });


        this.lastSyncedPosition.copy(
            this.root.position
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


            this.createPhysicsCharacter();


            this.state =
                "Idle";


            this.playAnimation(

                "Idle",

                0

            );

        }


        return true;

    }


    /* =====================================================
       DISTANCE
    ====================================================== */

    getHorizontalDistanceToPlayer() {

        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerPosition
            );


        return Math.hypot(

            this.playerPosition.x -
            this.root.position.x,

            this.playerPosition.z -
            this.root.position.z

        );

    }


    /* =====================================================
       ATTACK DAMAGE
    ====================================================== */

    updateAttackDamage() {

        if (
            !this.isAttacking

            ||

            this.attackHasDealtDamage

            ||

            this.dead

            ||

            !this.currentAction

            ||

            !this.playerHealth

            ||

            this.playerHealth.isDead()
        ) {

            return;

        }


        const animationName =
            this.currentActionName;


        if (
            animationName !==
            "Attack_01"

            &&

            animationName !==
            "Attack_02"
        ) {

            return;

        }


        const clip =
            this.currentAction
                .getClip();


        if (
            !clip
            ||
            clip.duration <=
            0
        ) {

            return;

        }


        const ratio =

            animationName ===
            "Attack_01"

                ?

                ENEMY_CONFIG.attackImpactRatio01

                :

                ENEMY_CONFIG.attackImpactRatio02;


        const impactTime =
            clip.duration *
            ratio;


        if (
            this.currentAction.time <
            impactTime
        ) {

            return;

        }


        this.attackHasDealtDamage =
            true;


        const distance =
            this.getHorizontalDistanceToPlayer();


        const verticalDistance =
            Math.abs(

                this.playerPosition.y -
                this.root.position.y

            );


        if (
            distance >
            ENEMY_CONFIG.damageDistance

            ||

            verticalDistance >
            1.7
        ) {

            return;

        }


        this.playerHealth.takeDamage(

            this.attackDamage,

            {

                source:
                    this

            }

        );

    }


    /* =====================================================
       AI
    ====================================================== */

    updateAIState() {

        if (
            this.playerHealth

            &&

            this.playerHealth.isDead()
        ) {

            this.desiredSpeed =
                0;


            this.changeState(
                "Idle"
            );


            return;

        }


        const distance =
            this.getHorizontalDistanceToPlayer();


        if (
            this.isHit

            ||

            this.isAttacking
        ) {

            this.desiredSpeed =
                0;


            return;

        }


        if (
            distance >
            ENEMY_CONFIG.detectionDistance
        ) {

            this.desiredSpeed =
                0;


            this.changeState(
                "Idle"
            );


            return;

        }


        if (
            distance <=
            ENEMY_CONFIG.attackDistance
        ) {

            this.desiredSpeed =
                0;


            this.attackPlayer();


            return;

        }


        if (
            distance <=
            ENEMY_CONFIG.runDistance
        ) {

            this.desiredSpeed =
                this.runSpeed;


            this.changeState(
                "Run"
            );

        }

        else {

            this.desiredSpeed =
                this.walkSpeed;


            this.changeState(
                "Walk"
            );

        }

    }


    /* =====================================================
       MOVEMENT
    ====================================================== */

    buildMovementDirection() {

        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerPosition
            );


        this.directDirection
            .subVectors(

                this.playerPosition,

                this.root.position

            );


        this.directDirection.y =
            0;


        if (
            this.directDirection.lengthSq() <
            0.000001
        ) {

            this.moveDirection.set(
                0,
                0,
                0
            );


            return;

        }


        this.directDirection.normalize();


        this.moveDirection.copy(
            this.directDirection
        );


        if (
            this.steerTimer >
            0
        ) {

            this.sideDirection.set(

                -this.directDirection.z,

                0,

                this.directDirection.x

            );


            this.moveDirection
                .addScaledVector(

                    this.sideDirection,

                    ENEMY_CONFIG.steerStrength *
                    this.steerSign

                );


            this.moveDirection.normalize();

        }

    }


    /* =====================================================
       ROTATION
    ====================================================== */

    rotateTowardDirection(
        direction,
        deltaTime
    ) {

        if (
            !direction

            ||

            direction.lengthSq() <
            0.000001
        ) {

            return;

        }


        this.faceDirection.copy(
            direction
        );


        this.faceDirection.y =
            0;


        if (
            this.faceDirection.lengthSq() <
            0.000001
        ) {

            return;

        }


        this.faceDirection.normalize();


        const angle =
            Math.atan2(

                this.faceDirection.x,

                this.faceDirection.z

            );


        this.tempEuler.set(

            0,

            angle,

            0

        );


        this.targetQuaternion
            .setFromEuler(
                this.tempEuler
            );


        const alpha =
            1

            -

            Math.exp(

                -ENEMY_CONFIG.rotationSpeed *
                deltaTime

            );


        this.root.quaternion.slerp(

            this.targetQuaternion,

            alpha

        );

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

            ||

            (
                this.playerHealth

                &&

                this.playerHealth.isDead()
            )
        ) {

            return;

        }


        this.isAttacking =
            true;


        this.attackHasDealtDamage =
            false;


        this.attackTimer =
            this.attackCooldownDuration;


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
       DAMAGE RECEIVED
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


        this.attackHasDealtDamage =
            false;


        this.desiredSpeed =
            0;


        this.state =
            "Hit";


        this.playAnimation(

            "Hit",

            0.06

        );


        return false;

    }


    /* =====================================================
       DEATH
    ====================================================== */

    die() {

        if (
            this.dead
        ) {

            return;

        }


        this.dead =
            true;


        this.deathAnimationFinished =
            false;


        this.desiredSpeed =
            0;


        this.isAttacking =
            false;


        this.attackHasDealtDamage =
            false;


        this.healthBar.visible =
            false;


        if (
            this.physicsHandle
        ) {

            this.physicsManager
                .removeEnemyCharacter(

                    this.physicsHandle

                );


            this.physicsHandle =
                null;

        }


        this.state =
            "Death";


        this.playAnimation(

            "Death",

            0.08

        );

    }


    /* =====================================================
       PRE PHYSICS
    ====================================================== */

    prePhysicsUpdate(
        deltaTime
    ) {

        /* =================================================
           SPAWN

           Mientras no se ve el modelo no actualizamos
           AnimationMixer.
        ================================================= */

        if (
            this.updateSpawn(
                deltaTime
            )
        ) {

            return;

        }


        /* =================================================
           CADÁVER COMPLETAMENTE ANIMADO

           Una vez terminó Death no seguimos actualizando
           su skeleton.
        ================================================= */

        if (
            this.dead

            &&

            this.deathAnimationFinished
        ) {

            return;

        }


        /* =================================================
           ANIMATION THROTTLING
        ================================================= */

        this.animationAccumulator +=
            deltaTime;


        const distanceToPlayer =
            this.getHorizontalDistanceToPlayer();


        const animationStep =

            distanceToPlayer <
            ENEMY_CONFIG.nearAnimationDistance

                ?

                1 /
                60

                :

                1 /
                30;


        if (
            this.animationAccumulator >=
            animationStep
        ) {

            const animationDelta =
                Math.min(

                    this.animationAccumulator,

                    0.08

                );


            this.animationAccumulator =
                0;


            this.mixer.update(
                animationDelta
            );


            if (
                !this.dead
            ) {

                this.updateAttackDamage();

            }

        }


        if (
            this.dead
        ) {

            return;

        }


        /* =================================================
           TIMERS
        ================================================= */

        this.attackTimer =
            Math.max(

                0,

                this.attackTimer -
                deltaTime

            );


        this.steerTimer =
            Math.max(

                0,

                this.steerTimer -
                deltaTime

            );


        this.aiTimer -=
            deltaTime;


        if (
            this.aiTimer <=
            0
        ) {

            this.aiTimer =
                ENEMY_CONFIG.aiInterval;


            this.updateAIState();

        }


        /* =================================================
           TARGET DIRECTION
        ================================================= */

        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerPosition
            );


        this.directDirection
            .subVectors(

                this.playerPosition,

                this.root.position

            );


        this.directDirection.y =
            0;


        if (
            this.isHit

            ||

            this.isAttacking

            ||

            this.desiredSpeed <=
            0

            ||

            (
                this.playerHealth

                &&

                this.playerHealth.isDead()
            )
        ) {

            this.moveDirection.set(
                0,
                0,
                0
            );


            if (
                this.directDirection.lengthSq() >
                0.000001
            ) {

                this.directDirection.normalize();


                this.rotateTowardDirection(

                    this.directDirection,

                    deltaTime

                );

            }

        }

        else {

            this.buildMovementDirection();


            this.rotateTowardDirection(

                this.moveDirection,

                deltaTime

            );

        }


        /* =================================================
           RAPIER
        ================================================= */

        if (
            this.physicsHandle
        ) {

            this.physicsManager
                .moveEnemyCharacter(

                    this.physicsHandle,

                    this.moveDirection,

                    this.desiredSpeed,

                    deltaTime

                );

        }

    }


    /* =====================================================
       POST PHYSICS
    ====================================================== */

    postPhysicsUpdate(
        deltaTime
    ) {

        if (
            this.dead

            ||

            this.spawning

            ||

            !this.physicsHandle
        ) {

            return;

        }


        this.physicsManager
            .syncEnemyCharacter(

                this.physicsHandle,

                this.root

            );


        /* =================================================
           ANTI-STUCK
        ================================================= */

        const dx =
            this.root.position.x -
            this.lastSyncedPosition.x;


        const dz =
            this.root.position.z -
            this.lastSyncedPosition.z;


        const moved =
            Math.hypot(
                dx,
                dz
            );


        const wantsToMove =
            this.desiredSpeed >
            0

            &&

            !this.isHit

            &&

            !this.isAttacking;


        if (
            wantsToMove
        ) {

            const expected =
                this.desiredSpeed *
                deltaTime;


            if (
                moved <
                Math.max(

                    0.0015,

                    expected *
                    0.12

                )
            ) {

                this.stuckTimer +=
                    deltaTime;

            }

            else {

                this.stuckTimer =
                    0;

            }


            if (
                this.stuckTimer >=
                ENEMY_CONFIG.stuckTime
            ) {

                this.stuckTimer =
                    0;


                this.steerTimer =
                    ENEMY_CONFIG.steerDuration;


                this.steerSign *=
                    -1;

            }

        }

        else {

            this.stuckTimer =
                0;

        }


        this.lastSyncedPosition.copy(
            this.root.position
        );

    }


    /* =====================================================
       DESTROY VISUAL
    ====================================================== */

    destroyVisual() {

        if (
            this.spawnEffect

            &&

            !this.spawnEffect.finished
        ) {

            this.spawnEffect.dispose();

        }


        this.mixer.stopAllAction();


        if (
            this.model
        ) {

            this.mixer.uncacheRoot(
                this.model
            );

        }


        if (
            this.root.parent
        ) {

            this.root.parent.remove(
                this.root
            );

        }

    }


    /* =====================================================
       GETTERS
    ====================================================== */

    getObject() {

        return this.root;

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

        objectManager,

        playerHealth

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


        this.playerHealth =
            playerHealth;


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


        this.environment =
            null;


        this.enabled =
            true;


        /* =================================================
           LEGACY TEST SPAWN
        ================================================= */

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
       ENABLE
    ====================================================== */

    setEnabled(
        enabled
    ) {

        this.enabled =
            enabled;

    }


    /* =====================================================
       ENVIRONMENT
    ====================================================== */

    setEnvironment(
        environment
    ) {

        this.environment =
            environment;

    }


    /* =====================================================
       FBX
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
       LOAD
    ====================================================== */

    async load() {

        if (
            this.loaded
        ) {

            return;

        }


        console.log(
            "[EnemyManager] Cargando infectado..."
        );


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
                    !fbx.animations
                        ?.length
                ) {

                    continue;

                }


                const clip =
                    fbx.animations[0]
                        .clone();


                clip.name =
                    name;


                this.animationClips.set(

                    name,

                    clip

                );


                console.log(

                    `[EnemyManager] ${name} OK`

                );

            }

            catch (
                error
            ) {

                console.error(

                    `[EnemyManager] Error ${name}:`,

                    error

                );

            }

        }


        this.loaded =
            true;


        console.log(
            "[EnemyManager] MULTI-ENEMY ONLINE"
        );

    }


    /* =====================================================
       SPAWN
    ====================================================== */

    spawnEnemy(

        spawnPosition,

        options = {}

    ) {

        if (
            !this.loaded

            ||

            !spawnPosition
        ) {

            return null;

        }


        const enemy =
            new Enemy({

                scene:
                    this.scene,

                modelSource:
                    this.baseModel,

                animationClips:
                    this.animationClips,

                spawnPosition:
                    spawnPosition.clone(),

                playerController:
                    this.playerController,

                physicsManager:
                    this.physicsManager,

                camera:
                    this.camera,

                playerHealth:
                    this.playerHealth,

                options

            });


        this.enemies.push(
            enemy
        );


        return enemy;

    }


    /* =====================================================
       TEST SPAWN

       Se mantiene por compatibilidad.
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


        this.spawnDirection
            .applyAxisAngle(

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


        this.spawnDirection
            .multiplyScalar(
                radius
            );


        this.spawnDirection.y =
            floorY;


        return this.spawnEnemy(
            this.spawnDirection
        );

    }


    /* =====================================================
       PRE PHYSICS
    ====================================================== */

    prePhysicsUpdate(
        deltaTime
    ) {

        if (
            !this.enabled
        ) {

            return;

        }


        for (
            const enemy
            of this.enemies
        ) {

            enemy.prePhysicsUpdate(
                deltaTime
            );

        }

    }


    /* =====================================================
       POST PHYSICS
    ====================================================== */

    postPhysicsUpdate(
        deltaTime
    ) {

        if (
            !this.enabled
        ) {

            return;

        }


        for (
            const enemy
            of this.enemies
        ) {

            enemy.postPhysicsUpdate(
                deltaTime
            );

        }

    }


    /* =====================================================
       VISUALS
    ====================================================== */

    updateVisuals() {

        for (
            const enemy
            of this.enemies
        ) {

            enemy.updateVisuals(
                this.camera
            );

        }

    }


    /* =====================================================
       HIT MESHES
    ====================================================== */

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


            meshes.push(

                ...enemy.getHitMeshes()

            );

        }


        return meshes;

    }


    /* =====================================================
       CORPSE CLEANUP
    ====================================================== */

    pruneDeadEnemies(
        maximumCorpses = 4
    ) {

        const deadEnemies =
            this.enemies.filter(

                enemy =>
                    enemy.isDead()

            );


        const removeAmount =
            Math.max(

                0,

                deadEnemies.length -
                maximumCorpses

            );


        if (
            removeAmount <=
            0
        ) {

            return;

        }


        const toRemove =
            deadEnemies.slice(

                0,

                removeAmount

            );


        for (
            const enemy
            of toRemove
        ) {

            enemy.destroyVisual();


            const index =
                this.enemies.indexOf(
                    enemy
                );


            if (
                index !==
                -1
            ) {

                this.enemies.splice(

                    index,

                    1

                );

            }

        }


        console.log(

            `[EnemyManager] Cadáveres eliminados: ${removeAmount}`

        );

    }


    /* =====================================================
       GETTERS
    ====================================================== */

    getEnemies() {

        return this.enemies;

    }


    getAliveEnemies() {

        return this.enemies.filter(

            enemy =>
                !enemy.isDead()

        );

    }


    getAliveCount() {

        return this
            .getAliveEnemies()
            .length;

    }

}
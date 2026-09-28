/* =========================================================
   NOVA CATALYST
   Weapon Manager

   Build v0.15.0 Performance

   - Pistol
   - SMG
   - Shotgun
   - FPS / TPS
   - ADS
   - Mouse wheel
   - Real reload callback
   - Optimized shotgun
   - Static spatial raycast filtering
   - DOM-light ammo HUD
   - Sprite muzzle flash
   - Impact particle pool
========================================================= */

import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


const WEAPON_ORDER = [
    "pistol",
    "smg",
    "shotgun"
];


const WEAPON_CONFIG = {

    pistol: {

        key:
            "pistol",

        displayName:
            "SCI-FI HANDGUN",

        assetPaths: [
            "./assets/models/weapons/pistol/scene.gltf",
            "./assets/models/weapons/pistol/scene.glb",
            "./assets/models/weapons/pistol/pistol.glb",
            "./assets/models/weapons/scene.gltf",
            "./assets/models/weapons/pistol.glb"
        ],

        targetLength:
            0.28,

        magazineSize:
            12,

        initialReserve:
            Infinity,

        damage:
            20,

        fireRate:
            0.22,

        automatic:
            false,

        range:
            60,

        pellets:
            1,

        spread:
            0,

        objectImpulse:
            1.35,

        explosionRadius:
            5.5,

        explosionForce:
            11.5,

        recoil:
            0.012,

        /*
         * 0 = animación en cada disparo.
         */
        animationInterval:
            0,

        initiallyUnlocked:
            true,

        tps: {

            positionOffset:
                new THREE.Vector3(
                    0.00,
                    0.005,
                    0.015
                ),

            rotationOffset:
                new THREE.Euler(
                    0,
                    0,
                    -0.04
                )

        },

        fpsHip: {

            position:
                new THREE.Vector3(
                    0.17,
                    -0.16,
                    -0.34
                ),

            rotation:
                new THREE.Euler(
                    0,
                    Math.PI,
                    0
                ),

            response:
                22

        },

        fpsADS: {

            sightDistance:
                0.215,

            sightHeight:
                -0.012,

            sightSide:
                0,

            rotation:
                new THREE.Euler(
                    0,
                    Math.PI,
                    0
                ),

            response:
                26

        }

    },


    smg: {

        key:
            "smg",

        displayName:
            "NOVA SMG",

        assetPaths: [
            "./assets/models/weapons/smg/scene.gltf"
        ],

        targetLength:
            0.60,

        magazineSize:
            30,

        initialReserve:
            60,

        damage:
            11,

        fireRate:
            0.085,

        automatic:
            true,

        range:
            48,

        pellets:
            1,

        spread:
            0.010,

        objectImpulse:
            0.90,

        recoil:
            0.009,

        /*
         * La bala sigue saliendo cada 0.085 s.
         *
         * Solo evitamos reiniciar Shoot.fbx 12 veces/s.
         */
        animationInterval:
            0.13,

        initiallyUnlocked:
            false,

        tps: {

            positionOffset:
                new THREE.Vector3(
                    0.005,
                    -0.012,
                    0.055
                ),

            rotationOffset:
                new THREE.Euler(
                    0,
                    Math.PI,
                    -0.035
                )

        },

        fpsHip: {

            position:
                new THREE.Vector3(
                    0.19,
                    -0.19,
                    -0.43
                ),

            rotation:
                new THREE.Euler(
                    0,
                    0,
                    0
                ),

            response:
                24

        },

        fpsADS: {

            sightDistance:
                0.235,

            sightHeight:
                -0.015,

            sightSide:
                0,

            rotation:
                new THREE.Euler(
                    0,
                    0,
                    0
                ),

            response:
                28

        }

    },


    shotgun: {

        key:
            "shotgun",

        displayName:
            "NOVA SHOTGUN",

        assetPaths: [
            "./assets/models/weapons/shotgun/scene.gltf"
        ],

        targetLength:
            1.02,

        magazineSize:
            6,

        initialReserve:
            12,

        damage:
            16,

        fireRate:
            0.82,

        automatic:
            false,

        range:
            28,

        pellets:
            7,

        spread:
            0.045,

        objectImpulse:
            2.7,

        recoil:
            0.022,

        animationInterval:
            0,

        initiallyUnlocked:
            false,

        tps: {

            positionOffset:
                new THREE.Vector3(
                    0.00,
                    -0.020,
                    0.095
                ),

            rotationOffset:
                new THREE.Euler(
                    0,
                    0,
                    -0.025
                )

        },

        fpsHip: {

            position:
                new THREE.Vector3(
                    0.22,
                    -0.21,
                    -0.54
                ),

            rotation:
                new THREE.Euler(
                    0,
                    Math.PI,
                    0
                ),

            response:
                20

        },

        fpsADS: {

            sightDistance:
                0.255,

            sightHeight:
                -0.015,

            sightSide:
                0,

            rotation:
                new THREE.Euler(
                    0,
                    Math.PI,
                    0
                ),

            response:
                24

        }

    }

};


export class WeaponManager {

    constructor({

        scene,

        camera,

        cameraManager,

        playerController,

        physicsManager,

        objectManager

    }) {

        this.scene =
            scene;

        this.camera =
            camera;

        this.cameraManager =
            cameraManager;

        this.playerController =
            playerController;

        this.physicsManager =
            physicsManager;

        this.objectManager =
            objectManager;


        this.loader =
            new GLTFLoader();


        this.enabled =
            false;

        this.paused =
            false;

        this.loaded =
            false;

        this.viewMode =
            "TPS";

        this.aiming =
            false;


        /* =================================================
           TARGETS
        ================================================= */

        this.enemyManager =
            null;

        this.enemyTargets =
            [];

        this.dynamicTargets =
            [];

        this.environmentMeshes =
            [];


        /* =================================================
           STATIC SPATIAL INDEX
        ================================================= */

        this.staticSpatialEntries =
            [];

        this.staticCandidates =
            [];

        this.staticHitResults =
            [];

        this.combatHitResults =
            [];


        /* =================================================
           RAYCAST
        ================================================= */

        this.raycaster =
            new THREE.Raycaster();


        this.fireNDC =
            new THREE.Vector2();


        this.tempBoxHit =
            new THREE.Vector3();


        /* =================================================
           WEAPONS
        ================================================= */

        this.weaponEntries =
            new Map();


        this.weaponState =
            new Map();


        this.unlockedWeapons =
            new Set();


        for (
            const key
            of WEAPON_ORDER
        ) {

            const config =
                WEAPON_CONFIG[key];


            this.weaponState.set(

                key,

                {

                    magazine:
                        config.magazineSize,

                    reserve:
                        config.initialReserve

                }

            );


            if (
                config.initiallyUnlocked
            ) {

                this.unlockedWeapons.add(
                    key
                );

            }

        }


        this.activeWeaponKey =
            "pistol";


        this.activeEntry =
            null;


        /* =================================================
           RELOAD
        ================================================= */

        this.isReloading =
            false;


        this.reloadingWeaponKey =
            null;


        this.autoReloadDelay =
            0;


        /* =================================================
           FIRE
        ================================================= */

        this.lastShotTime =
            -Infinity;


        this.lastShootAnimationTime =
            -Infinity;


        this.triggerHeld =
            false;


        this.wheelCooldown =
            0;


        /* =================================================
           HAND
        ================================================= */

        this.rightHandBone =
            null;


        /* =================================================
           TEMP
        ================================================= */

        this.handPosition =
            new THREE.Vector3();


        this.playerQuaternion =
            new THREE.Quaternion();


        this.tpsOffset =
            new THREE.Vector3();


        this.fpsTargetPosition =
            new THREE.Vector3();


        this.fpsTargetQuaternion =
            new THREE.Quaternion();


        this.rotatedRearSight =
            new THREE.Vector3();


        this.desiredRearSight =
            new THREE.Vector3();


        this.tempWorldPosition =
            new THREE.Vector3();


        this.shotDirection =
            new THREE.Vector3();


        this.tempImpulse =
            new THREE.Vector3();


        /* =================================================
           ADS CACHE
        ================================================= */

        this.adsRearSight =
            new THREE.Vector3();


        this.adsFrontSight =
            new THREE.Vector3();


        this.adsMuzzle =
            new THREE.Vector3();


        this.adsAnchorResult = {

            rearSight:
                this.adsRearSight,

            frontSight:
                this.adsFrontSight,

            muzzle:
                this.adsMuzzle

        };


        /* =================================================
           ENEMY TARGET TIMER
        ================================================= */

        this.enemyTargetCheckTimer =
            0;


        this.enemyTargetCheckInterval =
            0.20;


        this.lastShootableEnemyCount =
            -1;


        /* =================================================
           EFFECTS
        ================================================= */

        this.effects =
            [];


        this.explodedBodies =
            new WeakSet();


        this.createEffectMaterials();


        this.createImpactPool();


        this.createMuzzleSprite();


        /* =================================================
           RECOIL
        ================================================= */

        this.recoilTimer =
            0;


        this.muzzleFlashTimer =
            0;


        /* =================================================
           HUD
        ================================================= */

        this.createHUD();


        this.setupInput();


        this.playerController
            .setReloadFinishedHandler?.(

                () => {

                    this.finishReload();

                }

            );

    }


    /* =====================================================
       EFFECT MATERIALS
    ====================================================== */

    createEffectMaterials() {

        this.impactMaterial =
            new THREE.PointsMaterial({

                color:
                    0xffd27a,

                size:
                    0.055,

                transparent:
                    true,

                opacity:
                    0.95,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending

            });


        this.wallImpactMaterial =
            new THREE.PointsMaterial({

                color:
                    0xa9e8ff,

                size:
                    0.05,

                transparent:
                    true,

                opacity:
                    0.90,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending

            });


        this.enemyImpactMaterial =
            new THREE.PointsMaterial({

                color:
                    0xff4438,

                size:
                    0.065,

                transparent:
                    true,

                opacity:
                    0.95,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending

            });


        this.explosionMaterial =
            new THREE.PointsMaterial({

                color:
                    0xff542d,

                size:
                    0.12,

                transparent:
                    true,

                opacity:
                    1,

                depthWrite:
                    false,

                blending:
                    THREE.AdditiveBlending

            });

    }


    /* =====================================================
       CONFIG
    ====================================================== */

    getActiveConfig() {

        return WEAPON_CONFIG[
            this.activeWeaponKey
        ];

    }


    getActiveState() {

        return this.weaponState.get(
            this.activeWeaponKey
        );

    }


    getCurrentWeapon() {

        return this.activeWeaponKey;

    }


    getWeaponDisplayName(
        key
    ) {

        return (
            WEAPON_CONFIG[key]
                ?.displayName
            ??
            key
        );

    }


    isWeaponUnlocked(
        key
    ) {

        return this.unlockedWeapons.has(
            key
        );

    }


    /* =====================================================
       AMMO
    ====================================================== */

    addReserveAmmo(

        key,

        amount

    ) {

        const state =
            this.weaponState.get(
                key
            );


        if (
            !state

            ||

            !Number.isFinite(
                state.reserve
            )
        ) {

            return false;

        }


        const value =
            Math.max(

                0,

                Math.floor(
                    amount
                )

            );


        if (
            value <=
            0
        ) {

            return false;

        }


        state.reserve +=
            value;


        this.updateHUD();


        return true;

    }


    /* =====================================================
       ACQUIRE WEAPON
    ====================================================== */

    acquireWeapon(

        key,

        equipAfterPickup =
            true

    ) {

        if (
            !WEAPON_CONFIG[key]

            ||

            !this.loaded

            ||

            this.unlockedWeapons.has(
                key
            )
        ) {

            return false;

        }


        this.unlockedWeapons.add(
            key
        );


        if (
            equipAfterPickup

            &&

            !this.isReloading
        ) {

            this.equipWeapon(
                key
            );

        }


        this.updateHUD();


        return true;

    }


    /* =====================================================
       LOAD GLTF
    ====================================================== */

    loadGLTF(
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


    async loadConfiguredAsset(
        config
    ) {

        let lastError =
            null;


        for (
            const path
            of config.assetPaths
        ) {

            try {

                const gltf =
                    await this.loadGLTF(
                        path
                    );


                return gltf.scene;

            }

            catch (
                error
            ) {

                lastError =
                    error;

            }

        }


        throw new Error(

            `No se pudo cargar ${config.displayName}: ${lastError?.message ?? ""}`

        );

    }


    /* =====================================================
       LOAD ALL WEAPONS
    ====================================================== */

    async load() {

        if (
            this.loaded
        ) {

            return;

        }


        this.rightHandBone =
            this.playerController
                .getRightHandBone();


        if (
            !this.rightHandBone
        ) {

            throw new Error(
                "No se encontró RightHand."
            );

        }


        for (
            const key
            of WEAPON_ORDER
        ) {

            const config =
                WEAPON_CONFIG[key];


            const template =
                await this
                    .loadConfiguredAsset(
                        config
                    );


            template.traverse(

                object => {

                    if (
                        !object.isMesh
                    ) {

                        return;

                    }


                    /*
                     * IMPORTANTE PARA RENDIMIENTO:
                     *
                     * Las armas ya no generan shadow map.
                     * La sombra principal viene del jugador.
                     */
                    object.castShadow =
                        false;


                    object.receiveShadow =
                        true;


                    object.frustumCulled =
                        false;


                    object.userData
                        .ignoreWeaponRaycast =
                        true;

                }

            );


            this.normalizeWeaponModel(

                template,

                config.targetLength

            );


            const entry =
                this.createWeaponEntry(

                    key,

                    template,

                    config

                );


            this.weaponEntries.set(

                key,

                entry

            );

        }


        this.loaded =
            true;


        this.equipWeapon(

            "pistol",

            true

        );


        this.refreshDynamicTargets();


        this.refreshEnemyTargets();


        this.updateVisibility();


        this.updateHUD();

    }


    /* =====================================================
       NORMALIZE
    ====================================================== */

    normalizeWeaponModel(

        model,

        targetLength

    ) {

        model.position.set(
            0,
            0,
            0
        );


        model.rotation.set(
            0,
            0,
            0
        );


        model.scale.set(
            1,
            1,
            1
        );


        model.updateMatrixWorld(
            true
        );


        let box =
            new THREE.Box3()
                .setFromObject(
                    model
                );


        const originalSize =
            new THREE.Vector3();


        box.getSize(
            originalSize
        );


        if (
            originalSize.x >=
            originalSize.y

            &&

            originalSize.x >=
            originalSize.z
        ) {

            model.rotation.y =
                -Math.PI /
                2;

        }

        else if (
            originalSize.y >=
            originalSize.x

            &&

            originalSize.y >=
            originalSize.z
        ) {

            model.rotation.x =
                Math.PI /
                2;

        }


        model.updateMatrixWorld(
            true
        );


        box =
            new THREE.Box3()
                .setFromObject(
                    model
                );


        const size =
            new THREE.Vector3();


        box.getSize(
            size
        );


        const length =
            Math.max(
                size.x,
                size.y,
                size.z
            );


        model.scale.multiplyScalar(

            targetLength /
            Math.max(
                0.0001,
                length
            )

        );


        model.updateMatrixWorld(
            true
        );


        box =
            new THREE.Box3()
                .setFromObject(
                    model
                );


        if (
            !this.isRearAtNegativeZ(

                model,

                box

            )
        ) {

            model.rotation.y +=
                Math.PI;


            model.updateMatrixWorld(
                true
            );


            box =
                new THREE.Box3()
                    .setFromObject(
                        model
                    );

        }


        const finalSize =
            new THREE.Vector3();


        const center =
            new THREE.Vector3();


        box.getSize(
            finalSize
        );


        box.getCenter(
            center
        );


        const grip =
            new THREE.Vector3(

                center.x,

                box.min.y +
                finalSize.y *
                0.53,

                box.min.z +
                finalSize.z *
                0.23

            );


        model.position.sub(
            grip
        );


        model.updateMatrixWorld(
            true
        );

    }


    isRearAtNegativeZ(

        model,

        box

    ) {

        const depth =
            box.max.z -
            box.min.z;


        if (
            depth <
            0.0001
        ) {

            return true;

        }


        const minLimit =
            box.min.z +
            depth *
            0.30;


        const maxLimit =
            box.max.z -
            depth *
            0.30;


        let negativeLowest =
            Infinity;


        let positiveLowest =
            Infinity;


        const point =
            new THREE.Vector3();


        model.updateMatrixWorld(
            true
        );


        model.traverse(

            object => {

                if (
                    !object.isMesh

                    ||

                    !object.geometry
                ) {

                    return;

                }


                const attribute =
                    object.geometry
                        .attributes
                        .position;


                if (
                    !attribute
                ) {

                    return;

                }


                const step =
                    Math.max(

                        1,

                        Math.floor(
                            attribute.count /
                            1500
                        )

                    );


                for (
                    let i = 0;
                    i <
                    attribute.count;
                    i += step
                ) {

                    point
                        .fromBufferAttribute(
                            attribute,
                            i
                        )
                        .applyMatrix4(
                            object.matrixWorld
                        );


                    if (
                        point.z <=
                        minLimit
                    ) {

                        negativeLowest =
                            Math.min(
                                negativeLowest,
                                point.y
                            );

                    }


                    if (
                        point.z >=
                        maxLimit
                    ) {

                        positiveLowest =
                            Math.min(
                                positiveLowest,
                                point.y
                            );

                    }

                }

            }

        );


        if (
            !Number.isFinite(
                negativeLowest
            )

            ||

            !Number.isFinite(
                positiveLowest
            )
        ) {

            return true;

        }


        return negativeLowest <
            positiveLowest;

    }


    /* =====================================================
       WEAPON ENTRY
    ====================================================== */

    createWeaponEntry(

        key,

        template,

        config

    ) {

        const tpsRoot =
            new THREE.Group();


        const fpsRoot =
            new THREE.Group();


        this.scene.add(
            tpsRoot
        );


        this.camera.add(
            fpsRoot
        );


        const tpsVisual =
            template.clone(
                true
            );


        const fpsVisual =
            template.clone(
                true
            );


        tpsRoot.add(
            tpsVisual
        );


        fpsRoot.add(
            fpsVisual
        );


        const anchors =
            this.calculateLocalAnchors(
                template
            );


        const tpsMuzzle =
            new THREE.Object3D();


        const tpsRearSight =
            new THREE.Object3D();


        const tpsFrontSight =
            new THREE.Object3D();


        const fpsMuzzle =
            new THREE.Object3D();


        const fpsRearSight =
            new THREE.Object3D();


        const fpsFrontSight =
            new THREE.Object3D();


        tpsMuzzle.position.copy(
            anchors.muzzle
        );

        tpsRearSight.position.copy(
            anchors.rearSight
        );

        tpsFrontSight.position.copy(
            anchors.frontSight
        );


        fpsMuzzle.position.copy(
            anchors.muzzle
        );

        fpsRearSight.position.copy(
            anchors.rearSight
        );

        fpsFrontSight.position.copy(
            anchors.frontSight
        );


        tpsRoot.add(

            tpsMuzzle,

            tpsRearSight,

            tpsFrontSight

        );


        fpsRoot.add(

            fpsMuzzle,

            fpsRearSight,

            fpsFrontSight

        );


        fpsRoot.position.copy(
            config.fpsHip.position
        );


        fpsRoot.quaternion
            .setFromEuler(
                config.fpsHip.rotation
            );


        tpsRoot.visible =
            false;


        fpsRoot.visible =
            false;


        return {

            key,

            template,

            tpsRoot,

            fpsRoot,

            tpsMuzzle,

            tpsRearSight,

            tpsFrontSight,

            fpsMuzzle,

            fpsRearSight,

            fpsFrontSight,

            anchors,

            tpsRotationOffset:
                new THREE.Quaternion()
                    .setFromEuler(
                        config.tps.rotationOffset
                    )

        };

    }


    calculateLocalAnchors(
        template
    ) {

        template.updateMatrixWorld(
            true
        );


        const box =
            new THREE.Box3()
                .setFromObject(
                    template
                );


        const size =
            new THREE.Vector3();


        const center =
            new THREE.Vector3();


        box.getSize(
            size
        );


        box.getCenter(
            center
        );


        return {

            muzzle:
                new THREE.Vector3(

                    center.x,

                    box.max.y -
                    size.y *
                    0.25,

                    box.max.z +
                    0.008

                ),

            rearSight:
                new THREE.Vector3(

                    center.x,

                    box.max.y -
                    size.y *
                    0.06,

                    box.min.z +
                    size.z *
                    0.20

                ),

            frontSight:
                new THREE.Vector3(

                    center.x,

                    box.max.y -
                    size.y *
                    0.06,

                    box.max.z -
                    size.z *
                    0.10

                )

        };

    }


    /* =====================================================
       PICKUP VISUAL
    ====================================================== */

    getPickupVisual(
        key
    ) {

        const entry =
            this.weaponEntries.get(
                key
            );


        if (
            !entry
        ) {

            return null;

        }


        const visual =
            entry.template.clone(
                true
            );


        visual.traverse(

            object => {

                if (
                    object.isMesh
                ) {

                    object.castShadow =
                        false;

                    object.receiveShadow =
                        true;

                    object.frustumCulled =
                        true;

                }

            }

        );


        return visual;

    }


    /* =====================================================
       EQUIP
    ====================================================== */

    equipWeapon(

        key,

        force =
            false

    ) {

        if (
            !WEAPON_CONFIG[key]

            ||

            !this.unlockedWeapons.has(
                key
            )
        ) {

            return false;

        }


        if (
            !this.loaded

            &&

            !force
        ) {

            return false;

        }


        if (
            this.isReloading

            &&

            !force
        ) {

            return false;

        }


        for (
            const entry
            of this.weaponEntries.values()
        ) {

            entry.tpsRoot.visible =
                false;

            entry.fpsRoot.visible =
                false;

        }


        this.triggerHeld =
            false;


        this.autoReloadDelay =
            0;


        this.lastShotTime =
            -Infinity;


        this.cameraManager
            .cancelAim?.();


        this.aiming =
            false;


        this.activeWeaponKey =
            key;


        this.activeEntry =
            this.weaponEntries.get(
                key
            );


        this.updateVisibility();


        this.updateHUD();


        return true;

    }


    /* =====================================================
       WHEEL
    ====================================================== */

    cycleWeapon(
        direction
    ) {

        if (
            !this.loaded

            ||

            !this.enabled

            ||

            this.paused

            ||

            this.isReloading

            ||

            this.wheelCooldown >
            0
        ) {

            return false;

        }


        const available =
            WEAPON_ORDER.filter(

                key =>
                    this.unlockedWeapons.has(
                        key
                    )

            );


        if (
            available.length <
            2
        ) {

            return false;

        }


        let index =
            available.indexOf(
                this.activeWeaponKey
            );


        index =
            (
                index +
                direction +
                available.length
            )
            %
            available.length;


        if (
            this.equipWeapon(
                available[index]
            )
        ) {

            this.wheelCooldown =
                0.12;


            return true;

        }


        return false;

    }


    /* =====================================================
       STATIC SPATIAL INDEX
    ====================================================== */

    setEnvironment(
        environment
    ) {

        this.environmentMeshes.length =
            0;


        this.staticSpatialEntries.length =
            0;


        environment.updateMatrixWorld(
            true
        );


        environment.traverse(

            object => {

                if (
                    !object.isMesh

                    ||

                    !object.visible

                    ||

                    !object.geometry
                ) {

                    return;

                }


                this.environmentMeshes.push(
                    object
                );


                /*
                 * Box calculada UNA SOLA VEZ.
                 */
                const box =
                    new THREE.Box3()
                        .setFromObject(
                            object
                        );


                this.staticSpatialEntries.push({

                    mesh:
                        object,

                    box

                });

            }

        );


        console.log(

            `[Weapon] Static spatial entries: ${this.staticSpatialEntries.length}`

        );

    }


    /* =====================================================
       STATIC CANDIDATE FILTER

       Antes:
       cada bala comprobaba TODOS los meshes.

       Ahora:
       primero usamos Box3 y solo después hacemos
       raycast triangular contra los meshes atravesados.
    ====================================================== */

    collectStaticCandidates(
        range
    ) {

        this.staticCandidates.length =
            0;


        const ray =
            this.raycaster.ray;


        const maxDistanceSq =
            range *
            range;


        for (
            const entry
            of this.staticSpatialEntries
        ) {

            const result =
                ray.intersectBox(

                    entry.box,

                    this.tempBoxHit

                );


            if (
                !result
            ) {

                continue;

            }


            if (
                ray.origin
                    .distanceToSquared(
                        result
                    ) >
                maxDistanceSq
            ) {

                continue;

            }


            this.staticCandidates.push(
                entry.mesh
            );

        }

    }


    /* =====================================================
       ENEMY MANAGER
    ====================================================== */

    setEnemyManager(
        enemyManager
    ) {

        this.enemyManager =
            enemyManager;


        this.refreshEnemyTargets();

    }


    refreshEnemyTargets() {

        if (
            !this.enemyManager

            ||

            typeof this.enemyManager
                .getHitMeshes !==
            "function"
        ) {

            this.enemyTargets.length =
                0;

            this.lastShootableEnemyCount =
                0;

            return;

        }


        this.enemyTargets =
            this.enemyManager
                .getHitMeshes();


        const enemies =
            this.enemyManager
                .getAliveEnemies?.()
            ??
            [];


        let count =
            0;


        for (
            const enemy
            of enemies
        ) {

            if (
                enemy.isDead?.()

                ||

                enemy.isSpawning?.()
            ) {

                continue;

            }


            count++;

        }


        this.lastShootableEnemyCount =
            count;

    }


    /* =====================================================
       DYNAMIC TARGETS
    ====================================================== */

    refreshDynamicTargets() {

        this.dynamicTargets.length =
            0;


        const objects =
            this.objectManager
                .getDynamicObjects();


        for (
            const object
            of objects
        ) {

            object.mesh?.traverse(

                child => {

                    if (
                        child.isMesh

                        &&

                        child.visible
                    ) {

                        this.dynamicTargets.push(
                            child
                        );

                    }

                }

            );

        }

    }


    /* =====================================================
       SET RAY
    ====================================================== */

    setupRay(

        ndcX,

        ndcY,

        range

    ) {

        this.fireNDC.set(
            ndcX,
            ndcY
        );


        this.raycaster
            .setFromCamera(

                this.fireNDC,

                this.camera

            );


        this.raycaster.near =
            0.02;


        this.raycaster.far =
            range;

    }


    /* =====================================================
       STATIC HIT
    ====================================================== */

    findStaticHit(
        range
    ) {

        this.collectStaticCandidates(
            range
        );


        if (
            this.staticCandidates.length ===
            0
        ) {

            return null;

        }


        this.staticHitResults.length =
            0;


        this.raycaster
            .intersectObjects(

                this.staticCandidates,

                false,

                this.staticHitResults

            );


        return this.staticHitResults[0]
            ??
            null;

    }


    /* =====================================================
       COMBAT HIT
    ====================================================== */

    findCombatHit(
        range
    ) {

        this.combatHitResults.length =
            0;


        /*
         * Dynamic targets
         */
        if (
            this.dynamicTargets.length >
            0
        ) {

            this.raycaster
                .intersectObjects(

                    this.dynamicTargets,

                    false,

                    this.combatHitResults

                );

        }


        let nearest =
            this.combatHitResults[0]
            ??
            null;


        /*
         * Enemy targets
         */
        if (
            this.enemyTargets.length >
            0
        ) {

            const enemyResults =
                [];


            this.raycaster
                .intersectObjects(

                    this.enemyTargets,

                    false,

                    enemyResults

                );


            if (
                enemyResults.length >
                0

                &&

                (
                    !nearest

                    ||

                    enemyResults[0]
                        .distance <
                    nearest.distance
                )
            ) {

                nearest =
                    enemyResults[0];

            }

        }


        return nearest;

    }


    /* =====================================================
       GENERAL HITSCAN
    ====================================================== */

    findNearestHit(

        ndcX,

        ndcY,

        range

    ) {

        this.setupRay(

            ndcX,

            ndcY,

            range

        );


        const staticHit =
            this.findStaticHit(
                range
            );


        const combatHit =
            this.findCombatHit(
                range
            );


        if (
            !staticHit
        ) {

            return combatHit;

        }


        if (
            !combatHit
        ) {

            return staticHit;

        }


        return combatHit.distance <
            staticHit.distance

            ?

            combatHit

            :

            staticHit;

    }


    /* =====================================================
       SHOTGUN STATIC
    ====================================================== */

    findStaticObstruction(

        ndcX,

        ndcY,

        range

    ) {

        this.setupRay(

            ndcX,

            ndcY,

            range

        );


        return this.findStaticHit(
            range
        );

    }


    /* =====================================================
       SHOTGUN COMBAT ONLY
    ====================================================== */

    findNearestCombatHit(

        ndcX,

        ndcY,

        range

    ) {

        this.setupRay(

            ndcX,

            ndcY,

            range

        );


        return this.findCombatHit(
            range
        );

    }


    /* =====================================================
       FIND ENEMY
    ====================================================== */

    findEnemy(
        object
    ) {

        let current =
            object;


        while (
            current
        ) {

            if (
                current.userData
                    ?.enemy
            ) {

                return current
                    .userData
                    .enemy;

            }


            current =
                current.parent;

        }


        return null;

    }


    /* =====================================================
       FIND PHYSICAL
    ====================================================== */

    findPhysicalObject(
        object
    ) {

        let current =
            object;


        while (
            current
        ) {

            if (
                current.userData
                    ?.rigidBody
            ) {

                return {

                    root:
                        current,

                    rigidBody:
                        current
                            .userData
                            .rigidBody,

                    type:
                        current
                            .userData
                            .objectType

                };

            }


            current =
                current.parent;

        }


        return null;

    }


    /* =====================================================
       FIRE
    ====================================================== */

    fire() {

        if (
            !this.enabled

            ||

            this.paused

            ||

            this.isReloading
        ) {

            return false;

        }


        const config =
            this.getActiveConfig();


        const state =
            this.getActiveState();


        const now =
            performance.now() /
            1000;


        if (
            now -
            this.lastShotTime <
            config.fireRate
        ) {

            return false;

        }


        if (
            state.magazine <=
            0
        ) {

            this.reload();

            return false;

        }


        this.lastShotTime =
            now;


        state.magazine--;


        /*
         * HUD update ya no reconstruye HTML.
         */
        this.updateHUD();


        /* =================================================
           ANIMATION THROTTLE

           Solo SMG usa intervalo distinto de 0.
        ================================================= */

        if (
            config.animationInterval <=
            0

            ||

            now -
            this.lastShootAnimationTime >=
            config.animationInterval
        ) {

            this.playerController
                .shoot();


            this.lastShootAnimationTime =
                now;

        }


        this.muzzleFlashTimer =
            0.045;


        this.recoilTimer =
            0.075;


        if (
            config.pellets >
            1
        ) {

            this.fireShotgun(
                config
            );

        }

        else {

            this.fireSingleProjectile(
                config
            );

        }


        if (
            state.magazine ===
            0
        ) {

            this.autoReloadDelay =
                0.14;

        }


        return true;

    }


    /* =====================================================
       SINGLE PROJECTILE
    ====================================================== */

    fireSingleProjectile(
        config
    ) {

        let x =
            0;


        let y =
            0;


        if (
            config.spread >
            0
        ) {

            const angle =
                Math.random() *
                Math.PI *
                2;


            const radius =
                Math.sqrt(
                    Math.random()
                )
                *
                config.spread;


            x =
                Math.cos(angle) *
                radius;


            y =
                Math.sin(angle) *
                radius;

        }


        const hit =
            this.findNearestHit(

                x,

                y,

                config.range

            );


        if (
            hit
        ) {

            this.processHit(

                hit,

                config.damage,

                config.objectImpulse

            );

        }

    }


    /* =====================================================
       SHOTGUN
    ====================================================== */

    fireShotgun(
        config
    ) {

        /*
         * SOLO UN raycast estático.
         */
        const wallHit =
            this.findStaticObstruction(

                0,

                0,

                config.range

            );


        const maxCombatDistance =

            wallHit

                ?

                Math.min(

                    config.range,

                    wallHit.distance +
                    0.05

                )

                :

                config.range;


        const enemyHits =
            new Map();


        const physicalHits =
            new Map();


        for (
            let i = 0;
            i <
            config.pellets;
            i++
        ) {

            const angle =
                Math.random() *
                Math.PI *
                2;


            const radius =
                Math.sqrt(
                    Math.random()
                )
                *
                config.spread;


            const x =
                Math.cos(angle) *
                radius;


            const y =
                Math.sin(angle) *
                radius;


            /*
             * Los perdigones NO vuelven a revisar
             * el escenario completo.
             */
            const hit =
                this.findNearestCombatHit(

                    x,

                    y,

                    maxCombatDistance

                );


            if (
                !hit
            ) {

                continue;

            }


            const enemy =
                this.findEnemy(
                    hit.object
                );


            if (
                enemy
            ) {

                let data =
                    enemyHits.get(
                        enemy
                    );


                if (
                    !data
                ) {

                    data = {

                        count:
                            0,

                        point:
                            hit.point.clone()

                    };


                    enemyHits.set(
                        enemy,
                        data
                    );

                }


                data.count++;


                continue;

            }


            const physical =
                this.findPhysicalObject(
                    hit.object
                );


            if (
                physical
            ) {

                let data =
                    physicalHits.get(
                        physical.rigidBody
                    );


                if (
                    !data
                ) {

                    data = {

                        physical,

                        count:
                            0,

                        point:
                            hit.point.clone()

                    };


                    physicalHits.set(

                        physical.rigidBody,

                        data

                    );

                }


                data.count++;

            }

        }


        let killed =
            false;


        /* =================================================
           ENEMIES
        ================================================= */

        for (
            const [
                enemy,
                data
            ]
            of enemyHits
        ) {

            this.createImpactEffect(

                data.point,

                false,

                true

            );


            if (
                enemy.takeDamage(

                    config.damage *
                    data.count

                )
            ) {

                killed =
                    true;

            }

        }


        if (
            killed
        ) {

            this.refreshEnemyTargets();

        }


        /* =================================================
           PHYSICAL OBJECTS
        ================================================= */

        for (
            const data
            of physicalHits.values()
        ) {

            const physical =
                data.physical;


            this.createImpactEffect(

                data.point,

                true,

                false

            );


            if (
                physical.type ===
                "industrial-barrel"
            ) {

                this.explodeBarrel(
                    physical
                );


                continue;

            }


            this.applyPhysicalImpulse(

                physical,

                (
                    config.objectImpulse /
                    config.pellets
                )
                *
                data.count

            );

        }


        /*
         * Máximo una chispa de pared por cartucho.
         */
        if (
            wallHit
        ) {

            this.createImpactEffect(

                wallHit.point,

                false,

                false

            );

        }

    }


    /* =====================================================
       PROCESS HIT
    ====================================================== */

    processHit(

        hit,

        damage,

        objectImpulse

    ) {

        const enemy =
            this.findEnemy(
                hit.object
            );


        if (
            enemy
        ) {

            this.createImpactEffect(

                hit.point,

                false,

                true

            );


            if (
                enemy.takeDamage(
                    damage
                )
            ) {

                this.refreshEnemyTargets();

            }


            return;

        }


        const physical =
            this.findPhysicalObject(
                hit.object
            );


        this.createImpactEffect(

            hit.point,

            Boolean(
                physical
            ),

            false

        );


        if (
            !physical
        ) {

            return;

        }


        if (
            physical.type ===
            "industrial-barrel"
        ) {

            this.explodeBarrel(
                physical
            );


            return;

        }


        this.applyPhysicalImpulse(

            physical,

            objectImpulse

        );

    }


    /* =====================================================
       PHYSICAL IMPULSE
    ====================================================== */

    applyPhysicalImpulse(

        physical,

        strength

    ) {

        this.camera
            .getWorldDirection(
                this.shotDirection
            );


        this.tempImpulse
            .copy(
                this.shotDirection
            )
            .normalize()
            .multiplyScalar(
                strength
            );


        this.tempImpulse.y +=
            0.08;


        this.physicsManager
            .applyImpulse(

                physical.rigidBody,

                this.tempImpulse

            );

    }


    /* =====================================================
       BARREL
    ====================================================== */

    explodeBarrel(
        barrel
    ) {

        if (
            this.explodedBodies.has(
                barrel.rigidBody
            )
        ) {

            return;

        }


        this.explodedBodies.add(
            barrel.rigidBody
        );


        const translation =
            barrel.rigidBody
                .translation();


        const center =
            new THREE.Vector3(

                translation.x,

                translation.y,

                translation.z

            );


        this.createExplosionEffect(
            center
        );


        const config =
            WEAPON_CONFIG.pistol;


        const objects =
            this.objectManager
                .getDynamicObjects();


        for (
            const object
            of objects
        ) {

            if (
                object.rigidBody ===
                barrel.rigidBody
            ) {

                continue;

            }


            const position =
                object.rigidBody
                    .translation();


            const direction =
                new THREE.Vector3(

                    position.x -
                    center.x,

                    position.y -
                    center.y,

                    position.z -
                    center.z

                );


            const distance =
                direction.length();


            if (
                distance <=
                0.001

                ||

                distance >
                config.explosionRadius
            ) {

                continue;

            }


            const strength =

                (
                    1 -
                    distance /
                    config.explosionRadius
                )

                *

                config.explosionForce;


            direction
                .normalize()
                .multiplyScalar(
                    strength
                );


            direction.y +=
                strength *
                0.30;


            this.physicsManager
                .applyImpulse(

                    object.rigidBody,

                    direction

                );

        }


        this.objectManager
            .removeDynamicObjectByBody(
                barrel.rigidBody
            );


        this.refreshDynamicTargets();

    }


    /* =====================================================
       RELOAD
    ====================================================== */

    canReload() {

        const config =
            this.getActiveConfig();


        const state =
            this.getActiveState();


        if (
            state.magazine >=
            config.magazineSize
        ) {

            return false;

        }


        if (
            Number.isFinite(
                state.reserve
            )

            &&

            state.reserve <=
            0
        ) {

            return false;

        }


        return true;

    }


    reload() {

        if (
            this.isReloading

            ||

            !this.canReload()
        ) {

            return false;

        }


        this.cameraManager
            .cancelAim();


        if (
            this.playerController
                .reload() ===
            false
        ) {

            return false;

        }


        this.isReloading =
            true;


        this.reloadingWeaponKey =
            this.activeWeaponKey;


        this.triggerHeld =
            false;


        this.autoReloadDelay =
            0;


        this.aiming =
            false;


        this.updateVisibility();


        this.updateHUD();


        return true;

    }


    finishReload() {

        if (
            !this.isReloading

            ||

            !this.reloadingWeaponKey
        ) {

            return;

        }


        const key =
            this.reloadingWeaponKey;


        const config =
            WEAPON_CONFIG[key];


        const state =
            this.weaponState.get(
                key
            );


        const required =
            config.magazineSize -
            state.magazine;


        if (
            Number.isFinite(
                state.reserve
            )
        ) {

            const transferred =
                Math.min(

                    required,

                    state.reserve

                );


            state.magazine +=
                transferred;


            state.reserve -=
                transferred;

        }

        else {

            state.magazine =
                config.magazineSize;

        }


        this.isReloading =
            false;


        this.reloadingWeaponKey =
            null;


        this.autoReloadDelay =
            0;


        this.updateHUD();


        this.updateVisibility();

    }


    /* =====================================================
       HUD

       IMPORTANTE:
       ya NO usamos innerHTML en cada disparo.
    ====================================================== */

    createHUD() {

        this.crosshair =
            document.createElement(
                "div"
            );


        Object.assign(

            this.crosshair.style,

            {

                position: "fixed",

                left: "50%",

                top: "50%",

                width: "12px",

                height: "12px",

                transform:
                    "translate(-50%, -50%)",

                border:
                    "1px solid rgba(255,255,255,.78)",

                borderRadius:
                    "50%",

                pointerEvents:
                    "none",

                zIndex:
                    "500",

                display:
                    "none"

            }

        );


        const dot =
            document.createElement(
                "div"
            );


        Object.assign(

            dot.style,

            {

                position:
                    "absolute",

                left:
                    "50%",

                top:
                    "50%",

                width:
                    "2px",

                height:
                    "2px",

                transform:
                    "translate(-50%, -50%)",

                borderRadius:
                    "50%",

                background:
                    "#fff"

            }

        );


        this.crosshair.appendChild(
            dot
        );


        document.body.appendChild(
            this.crosshair
        );


        /* =================================================
           ADS RETICLE
        ================================================= */

        this.adsReticle =
            document.createElement(
                "div"
            );


        Object.assign(

            this.adsReticle.style,

            {

                position: "fixed",

                left: "50%",

                top: "50%",

                width: "4px",

                height: "4px",

                transform:
                    "translate(-50%, -50%)",

                borderRadius:
                    "50%",

                background:
                    "#fff",

                boxShadow:
                    "0 0 7px #fff",

                pointerEvents:
                    "none",

                zIndex:
                    "502",

                display:
                    "none"

            }

        );


        document.body.appendChild(
            this.adsReticle
        );


        /* =================================================
           AMMO HUD
        ================================================= */

        this.ammoHUD =
            document.createElement(
                "div"
            );


        Object.assign(

            this.ammoHUD.style,

            {

                position:
                    "fixed",

                right:
                    "28px",

                bottom:
                    "26px",

                minWidth:
                    "190px",

                padding:
                    "10px 14px",

                border:
                    "1px solid rgba(255,255,255,.12)",

                background:
                    "rgba(0,0,0,.55)",

                color:
                    "#fff",

                fontFamily:
                    "Orbitron, monospace",

                textAlign:
                    "right",

                pointerEvents:
                    "none",

                zIndex:
                    "500",

                display:
                    "none"

            }

        );


        this.ammoHUD.innerHTML = `

            <div
                id="nova-weapon-name"
                style="
                    opacity:.58;
                    font-size:8px;
                    margin-bottom:5px;
                    letter-spacing:1.4px;
                "
            ></div>

            <span
                id="nova-magazine"
                style="
                    font-size:20px;
                    font-weight:700;
                "
            ></span>

            <span
                id="nova-reserve"
                style="
                    opacity:.55;
                    margin-left:4px;
                    font-size:11px;
                "
            ></span>

            <span
                id="nova-reloading"
                style="
                    color:#d7433b;
                    font-size:8px;
                    margin-left:7px;
                    display:none;
                "
            >
                RELOADING
            </span>

            <div
                id="nova-unlocked-weapons"
                style="
                    opacity:.38;
                    font-size:6px;
                    margin-top:6px;
                    letter-spacing:.7px;
                    white-space:nowrap;
                "
            ></div>

        `;


        document.body.appendChild(
            this.ammoHUD
        );


        this.hudWeaponName =
            this.ammoHUD.querySelector(
                "#nova-weapon-name"
            );


        this.hudMagazine =
            this.ammoHUD.querySelector(
                "#nova-magazine"
            );


        this.hudReserve =
            this.ammoHUD.querySelector(
                "#nova-reserve"
            );


        this.hudReloading =
            this.ammoHUD.querySelector(
                "#nova-reloading"
            );


        this.hudWeapons =
            this.ammoHUD.querySelector(
                "#nova-unlocked-weapons"
            );

    }


    updateHUD() {

        const config =
            this.getActiveConfig();


        const state =
            this.getActiveState();


        if (
            !config

            ||

            !state
        ) {

            return;

        }


        this.hudWeaponName.textContent =
            config.displayName;


        this.hudMagazine.textContent =
            `${state.magazine}`;


        this.hudReserve.textContent =

            Number.isFinite(
                state.reserve
            )

                ?

                `/ ${state.reserve}`

                :

                "/ ∞";


        this.hudReloading.style.display =

            this.isReloading

                ?

                "inline"

                :

                "none";


        this.hudWeapons.textContent =

            "RUEDA · "

            +

            WEAPON_ORDER

                .filter(
                    key =>
                        this.unlockedWeapons.has(
                            key
                        )
                )

                .map(

                    key =>

                        key ===
                        this.activeWeaponKey

                            ?

                            `[${WEAPON_CONFIG[key].displayName}]`

                            :

                            WEAPON_CONFIG[key].displayName

                )

                .join(
                    " · "
                );

    }


    /* =====================================================
       INPUT
    ====================================================== */

    setupInput() {

        window.addEventListener(

            "mousedown",

            event => {

                if (
                    event.button !==
                    0

                    ||

                    !this.enabled

                    ||

                    this.paused

                    ||

                    !this.cameraManager
                        .isInputCaptured()
                ) {

                    return;

                }


                this.triggerHeld =
                    true;


                this.fire();

            }

        );


        window.addEventListener(

            "mouseup",

            event => {

                if (
                    event.button ===
                    0
                ) {

                    this.triggerHeld =
                        false;

                }

            }

        );


        window.addEventListener(

            "keydown",

            event => {

                if (
                    event.code ===
                    "KeyR"

                    &&

                    !event.repeat

                    &&

                    this.enabled

                    &&

                    !this.paused

                    &&

                    this.cameraManager
                        .isInputCaptured()
                ) {

                    this.reload();

                }

            }

        );


        window.addEventListener(

            "wheel",

            event => {

                if (
                    !this.enabled

                    ||

                    this.paused

                    ||

                    !this.cameraManager
                        .isInputCaptured()
                ) {

                    return;

                }


                event.preventDefault();


                this.cycleWeapon(

                    event.deltaY >
                    0

                        ?

                        1

                        :

                        -1

                );

            },

            {
                passive:
                    false
            }

        );


        window.addEventListener(

            "blur",

            () => {

                this.triggerHeld =
                    false;

            }

        );

    }


    /* =====================================================
       VIEW
    ====================================================== */

    setEnabled(
        enabled
    ) {

        this.enabled =
            enabled;


        if (
            !enabled
        ) {

            this.triggerHeld =
                false;

        }

        else {

            this.refreshDynamicTargets();

            this.refreshEnemyTargets();

        }


        this.updateVisibility();

    }


    setPaused(
        paused
    ) {

        this.paused =
            paused;


        if (
            paused
        ) {

            this.triggerHeld =
                false;

        }


        this.updateVisibility();

    }


    setViewMode(
        mode
    ) {

        this.viewMode =
            mode;


        this.updateVisibility();

    }


    setAiming(
        aiming
    ) {

        this.aiming =

            Boolean(
                aiming
            )

            &&

            !this.isReloading;


        this.updateVisibility();

    }


    updateVisibility() {

        for (
            const entry
            of this.weaponEntries.values()
        ) {

            entry.tpsRoot.visible =
                false;

            entry.fpsRoot.visible =
                false;

        }


        const visible =

            this.enabled

            &&

            this.loaded

            &&

            !this.paused

            &&

            this.activeEntry;


        if (
            visible
        ) {

            if (
                this.viewMode ===
                "FPS"
            ) {

                this.activeEntry
                    .fpsRoot
                    .visible =
                    true;

            }

            else {

                this.activeEntry
                    .tpsRoot
                    .visible =
                    true;

            }

        }


        this.ammoHUD.style.display =

            this.enabled

                ?

                "block"

                :

                "none";


        const ads =

            visible

            &&

            this.viewMode ===
            "FPS"

            &&

            this.aiming

            &&

            !this.isReloading;


        this.crosshair.style.display =

            visible

            &&

            !ads

                ?

                "block"

                :

                "none";


        this.adsReticle.style.display =

            ads

                ?

                "block"

                :

                "none";

    }


    /* =====================================================
       TPS UPDATE
    ====================================================== */

    updateTPSWeapon() {

        if (
            !this.activeEntry

            ||

            !this.rightHandBone
        ) {

            return;

        }


        const config =
            this.getActiveConfig();


        this.rightHandBone
            .updateWorldMatrix(
                true,
                false
            );


        this.rightHandBone
            .getWorldPosition(
                this.handPosition
            );


        this.playerController
            .getObject()
            .getWorldQuaternion(
                this.playerQuaternion
            );


        this.tpsOffset
            .copy(
                config.tps.positionOffset
            )
            .applyQuaternion(
                this.playerQuaternion
            );


        this.activeEntry
            .tpsRoot
            .position
            .copy(
                this.handPosition
            )
            .add(
                this.tpsOffset
            );


        this.activeEntry
            .tpsRoot
            .quaternion
            .copy(
                this.playerQuaternion
            )
            .multiply(
                this.activeEntry
                    .tpsRotationOffset
            );

    }


    /* =====================================================
       FPS HIP
    ====================================================== */

    updateFPSHip(
        deltaTime
    ) {

        const config =
            this.getActiveConfig();


        this.fpsTargetPosition
            .copy(
                config.fpsHip.position
            );


        if (
            this.recoilTimer >
            0
        ) {

            this.fpsTargetPosition.z +=
                config.recoil;

        }


        this.fpsTargetQuaternion
            .setFromEuler(
                config.fpsHip.rotation
            );


        const alpha =

            1

            -

            Math.exp(

                -config.fpsHip.response *
                deltaTime

            );


        this.activeEntry
            .fpsRoot
            .position
            .lerp(

                this.fpsTargetPosition,

                alpha

            );


        this.activeEntry
            .fpsRoot
            .quaternion
            .slerp(

                this.fpsTargetQuaternion,

                alpha

            );

    }


    /* =====================================================
       FPS ADS
    ====================================================== */

    updateFPSADS(
        deltaTime
    ) {

        const config =
            this.getActiveConfig();


        this.fpsTargetQuaternion
            .setFromEuler(
                config.fpsADS.rotation
            );


        this.desiredRearSight.set(

            config.fpsADS.sightSide,

            config.fpsADS.sightHeight,

            -config.fpsADS.sightDistance

        );


        this.rotatedRearSight
            .copy(
                this.activeEntry
                    .anchors
                    .rearSight
            )
            .applyQuaternion(
                this.fpsTargetQuaternion
            );


        this.fpsTargetPosition
            .copy(
                this.desiredRearSight
            )
            .sub(
                this.rotatedRearSight
            );


        if (
            this.recoilTimer >
            0
        ) {

            this.fpsTargetPosition.z +=
                config.recoil;

        }


        const alpha =

            1

            -

            Math.exp(

                -config.fpsADS.response *
                deltaTime

            );


        this.activeEntry
            .fpsRoot
            .position
            .lerp(

                this.fpsTargetPosition,

                alpha

            );


        this.activeEntry
            .fpsRoot
            .quaternion
            .slerp(

                this.fpsTargetQuaternion,

                alpha

            );

    }


    /* =====================================================
       ADS ANCHOR · NO NEW VECTOR3 EACH FRAME
    ====================================================== */

    getADSAnchor() {

        if (
            !this.loaded

            ||

            !this.activeEntry
        ) {

            return null;

        }


        const prefix =

            this.viewMode ===
            "FPS"

                ?

                "fps"

                :

                "tps";


        this.activeEntry[
            `${prefix}RearSight`
        ].getWorldPosition(
            this.adsRearSight
        );


        this.activeEntry[
            `${prefix}FrontSight`
        ].getWorldPosition(
            this.adsFrontSight
        );


        this.activeEntry[
            `${prefix}Muzzle`
        ].getWorldPosition(
            this.adsMuzzle
        );


        return this.adsAnchorResult;

    }


    /* =====================================================
       MUZZLE SPRITE

       Sustituye PointLight por un efecto visual muchísimo
       más barato.
    ====================================================== */

    createMuzzleSprite() {

        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            64;

        canvas.height =
            64;


        const ctx =
            canvas.getContext(
                "2d"
            );


        const gradient =
            ctx.createRadialGradient(

                32,
                32,
                2,

                32,
                32,
                30

            );


        gradient.addColorStop(
            0,
            "rgba(255,255,230,1)"
        );


        gradient.addColorStop(
            0.18,
            "rgba(255,205,100,.95)"
        );


        gradient.addColorStop(
            0.48,
            "rgba(255,110,25,.55)"
        );


        gradient.addColorStop(
            1,
            "rgba(255,80,10,0)"
        );


        ctx.fillStyle =
            gradient;


        ctx.fillRect(
            0,
            0,
            64,
            64
        );


        this.muzzleTexture =
            new THREE.CanvasTexture(
                canvas
            );


        this.muzzleMaterial =
            new THREE.SpriteMaterial({

                map:
                    this.muzzleTexture,

                transparent:
                    true,

                blending:
                    THREE.AdditiveBlending,

                depthWrite:
                    false,

                depthTest:
                    true

            });


        this.muzzleSprite =
            new THREE.Sprite(
                this.muzzleMaterial
            );


        this.muzzleSprite.visible =
            false;


        this.scene.add(
            this.muzzleSprite
        );

    }


    updateMuzzle(
        deltaTime
    ) {

        if (
            !this.activeEntry

            ||

            !this.enabled

            ||

            this.paused
        ) {

            this.muzzleSprite.visible =
                false;

            return;

        }


        const muzzle =

            this.viewMode ===
            "FPS"

                ?

                this.activeEntry
                    .fpsMuzzle

                :

                this.activeEntry
                    .tpsMuzzle;


        muzzle.getWorldPosition(
            this.tempWorldPosition
        );


        this.muzzleSprite
            .position
            .copy(
                this.tempWorldPosition
            );


        if (
            this.muzzleFlashTimer >
            0
        ) {

            this.muzzleFlashTimer -=
                deltaTime;


            const ratio =
                Math.max(

                    0,

                    this.muzzleFlashTimer /
                    0.045

                );


            this.muzzleSprite.visible =
                true;


            const scale =

                0.20

                +

                ratio *
                0.18;


            this.muzzleSprite.scale.set(

                scale,

                scale,

                1

            );


            this.muzzleMaterial.opacity =
                ratio;

        }

        else {

            this.muzzleSprite.visible =
                false;

        }

    }


    /* =====================================================
       IMPACT POOL
    ====================================================== */

    createImpactPool() {

        this.impactPool =
            [];


        for (
            let i = 0;
            i < 14;
            i++
        ) {

            const positions =
                new Float32Array(
                    18
                );


            const velocities =
                new Float32Array(
                    18
                );


            const geometry =
                new THREE.BufferGeometry();


            geometry.setAttribute(

                "position",

                new THREE.BufferAttribute(

                    positions,

                    3

                )

            );


            const object =
                new THREE.Points(

                    geometry,

                    this.wallImpactMaterial

                );


            object.visible =
                false;


            object.frustumCulled =
                false;


            this.scene.add(
                object
            );


            this.impactPool.push({

                object,

                velocities,

                busy:
                    false,

                pooled:
                    true,

                life:
                    0,

                maxLife:
                    0.12

            });

        }

    }


    createImpactEffect(

        position,

        dynamic,

        enemy =
            false

    ) {

        let effect =
            null;


        for (
            const candidate
            of this.impactPool
        ) {

            if (
                !candidate.busy
            ) {

                effect =
                    candidate;

                break;

            }

        }


        if (
            !effect
        ) {

            return;

        }


        effect.busy =
            true;


        effect.life =
            0.12;


        effect.object.material =

            enemy

                ?

                this.enemyImpactMaterial

                :

                dynamic

                    ?

                    this.impactMaterial

                    :

                    this.wallImpactMaterial;


        const positions =
            effect.object
                .geometry
                .attributes
                .position
                .array;


        positions.fill(
            0
        );


        for (
            let i = 0;
            i <
            effect.velocities.length;
            i += 3
        ) {

            effect.velocities[i] =

                (
                    Math.random() -
                    0.5
                )
                *
                1.6;


            effect.velocities[
                i +
                1
            ] =

                0.3

                +

                Math.random() *
                1.1;


            effect.velocities[
                i +
                2
            ] =

                (
                    Math.random() -
                    0.5
                )
                *
                1.6;

        }


        effect.object
            .geometry
            .attributes
            .position
            .needsUpdate =
            true;


        effect.object.position.copy(
            position
        );


        effect.object.visible =
            true;


        this.effects.push(
            effect
        );

    }


    createExplosionEffect(
        position
    ) {

        const count =
            20;


        const positions =
            new Float32Array(
                count *
                3
            );


        const velocities =
            [];


        for (
            let i = 0;
            i < count;
            i++
        ) {

            velocities.push(

                new THREE.Vector3(

                    Math.random() -
                    0.5,

                    Math.random() *
                    0.9,

                    Math.random() -
                    0.5

                )
                .normalize()
                .multiplyScalar(

                    3.5

                    +

                    Math.random() *
                    4.5

                )

            );

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


        const object =
            new THREE.Points(

                geometry,

                this.explosionMaterial

            );


        object.position.copy(
            position
        );


        this.scene.add(
            object
        );


        this.effects.push({

            object,

            velocities,

            pooled:
                false,

            life:
                0.42,

            maxLife:
                0.42

        });

    }


    updateEffect(

        effect,

        deltaTime

    ) {

        const attribute =
            effect.object
                .geometry
                .attributes
                .position;


        const positions =
            attribute.array;


        if (
            effect.pooled
        ) {

            for (
                let i = 0;
                i <
                effect.velocities.length;
                i += 3
            ) {

                effect.velocities[
                    i +
                    1
                ] -=

                    4.2 *
                    deltaTime;


                positions[i] +=

                    effect.velocities[i] *
                    deltaTime;


                positions[
                    i +
                    1
                ] +=

                    effect.velocities[
                        i +
                        1
                    ]
                    *
                    deltaTime;


                positions[
                    i +
                    2
                ] +=

                    effect.velocities[
                        i +
                        2
                    ]
                    *
                    deltaTime;

            }

        }

        else {

            for (
                let i = 0;
                i <
                effect.velocities.length;
                i++
            ) {

                const velocity =
                    effect.velocities[i];


                velocity.y -=

                    4.2 *
                    deltaTime;


                const index =
                    i *
                    3;


                positions[index] +=

                    velocity.x *
                    deltaTime;


                positions[
                    index +
                    1
                ] +=

                    velocity.y *
                    deltaTime;


                positions[
                    index +
                    2
                ] +=

                    velocity.z *
                    deltaTime;

            }

        }


        attribute.needsUpdate =
            true;

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update(
        deltaTime
    ) {

        if (
            this.paused

            ||

            !this.loaded
        ) {

            return;

        }


        this.wheelCooldown =
            Math.max(

                0,

                this.wheelCooldown -
                deltaTime

            );


        this.recoilTimer =
            Math.max(

                0,

                this.recoilTimer -
                deltaTime

            );


        /* =================================================
           ENEMY TARGET CACHE
        ================================================= */

        this.enemyTargetCheckTimer -=
            deltaTime;


        if (
            this.enemyTargetCheckTimer <=
            0
        ) {

            this.enemyTargetCheckTimer =
                this.enemyTargetCheckInterval;


            const enemies =
                this.enemyManager
                    ?.getAliveEnemies?.()
                ??
                [];


            let count =
                0;


            for (
                const enemy
                of enemies
            ) {

                if (
                    !enemy.isDead?.()

                    &&

                    !enemy.isSpawning?.()
                ) {

                    count++;

                }

            }


            if (
                count !==
                this.lastShootableEnemyCount
            ) {

                this.refreshEnemyTargets();

            }

        }


        /* =================================================
           FULL AUTO
        ================================================= */

        const config =
            this.getActiveConfig();


        if (
            this.triggerHeld

            &&

            config?.automatic

            &&

            !this.isReloading

            &&

            this.cameraManager
                .isInputCaptured()
        ) {

            this.fire();

        }


        /* =================================================
           AUTO RELOAD
        ================================================= */

        if (
            this.autoReloadDelay >
            0

            &&

            !this.isReloading
        ) {

            this.autoReloadDelay -=
                deltaTime;


            if (
                this.autoReloadDelay <=
                0

                &&

                this.getActiveState()
                    .magazine ===
                0

                &&

                this.canReload()
            ) {

                this.reload();

            }

        }


        /* =================================================
           WEAPON TRANSFORMS
        ================================================= */

        this.updateTPSWeapon();


        if (
            this.viewMode ===
            "FPS"
        ) {

            if (
                this.aiming

                &&

                !this.isReloading
            ) {

                this.updateFPSADS(
                    deltaTime
                );

            }

            else {

                this.updateFPSHip(
                    deltaTime
                );

            }

        }


        this.updateMuzzle(
            deltaTime
        );


        /* =================================================
           EFFECTS
        ================================================= */

        for (
            let i =
                this.effects.length -
                1;

            i >=
            0;

            i--
        ) {

            const effect =
                this.effects[i];


            effect.life -=
                deltaTime;


            this.updateEffect(

                effect,

                deltaTime

            );


            if (
                effect.life >
                0
            ) {

                continue;

            }


            if (
                effect.pooled
            ) {

                effect.object.visible =
                    false;


                effect.busy =
                    false;

            }

            else {

                this.scene.remove(
                    effect.object
                );


                effect.object
                    .geometry
                    .dispose();

            }


            this.effects.splice(
                i,
                1
            );

        }

    }

}
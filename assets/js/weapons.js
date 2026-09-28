/* =========================================================
   NOVA CATALYST
   Weapon Manager

   Build v0.12.0

   - Pistol / SMG / Shotgun
   - Mouse wheel weapon switching
   - TPS / FPS visuals
   - ADS
   - Synchronized reload animation
   - Semi-auto / automatic / shotgun pellets
   - Independent magazines and reserves
   - Enemy damage
   - Physical objects / explosive barrels
========================================================= */

import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   WEAPON DEFINITIONS
========================================================= */

const WEAPON_ORDER = [

    "pistol",

    "smg",

    "shotgun"

];


const WEAPON_CONFIG = {


    /* =====================================================
       PISTOL
    ====================================================== */

    pistol: {

        key:
            "pistol",

        displayName:
            "SCI-FI HANDGUN",


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


        targetLength:
            0.28,


        assetPaths: [

            "./assets/models/weapons/pistol/scene.gltf",

            "./assets/models/weapons/pistol/scene.glb",

            "./assets/models/weapons/pistol/pistol.glb",

            "./assets/models/weapons/scene.gltf",

            "./assets/models/weapons/pistol.glb"

        ],


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

        },


        muzzleFlash:
            13,

        recoil:
            0.012,


        initiallyUnlocked:
            true

    },


    /* =====================================================
       SMG
    ====================================================== */

    smg: {

        key:
            "smg",

        displayName:
            "NOVA SMG",


        magazineSize:
            30,

        initialReserve:
            180,


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


        targetLength:
            0.46,


        /*
         * Todavía no tenemos modelo externo.
         *
         * El sistema utilizará temporalmente
         * un modelo procedural.
         */
        assetPaths: [],


        tps: {

            positionOffset:
                new THREE.Vector3(

                    0.005,

                    -0.015,

                    0.055

                ),

            rotationOffset:
                new THREE.Euler(

                    0,

                    0,

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

                    Math.PI,

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

                    Math.PI,

                    0

                ),

            response:
                28

        },


        muzzleFlash:
            10,

        recoil:
            0.008,


        initiallyUnlocked:
            true

    },


    /* =====================================================
       SHOTGUN
    ====================================================== */

    shotgun: {

        key:
            "shotgun",

        displayName:
            "NOVA SHOTGUN",


        magazineSize:
            6,

        initialReserve:
            36,


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


        targetLength:
            0.68,


        /*
         * También utilizamos provisionalmente
         * un modelo procedural.
         */
        assetPaths: [],


        tps: {

            positionOffset:
                new THREE.Vector3(

                    0.00,

                    -0.025,

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

        },


        muzzleFlash:
            18,

        recoil:
            0.020,


        initiallyUnlocked:
            true

    }

};


/* =========================================================
   WEAPON MANAGER
========================================================= */

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


        /* =================================================
           LOADER
        ================================================= */

        this.loader =
            new GLTFLoader();


        /* =================================================
           STATE
        ================================================= */

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
           ENEMIES
        ================================================= */

        this.enemyManager =
            null;


        this.enemyTargets =
            [];


        /* =================================================
           ENVIRONMENT
        ================================================= */

        this.environmentMeshes =
            [];


        this.dynamicTargets =
            [];


        /* =================================================
           WEAPON COLLECTION
        ================================================= */

        this.weaponEntries =
            new Map();


        this.weaponState =
            new Map();


        this.unlockedWeapons =
            new Set();


        /* =================================================
           INITIAL AMMO
        ================================================= */

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


        /* =================================================
           CURRENT WEAPON
        ================================================= */

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


        this.triggerHeld =
            false;


        /* =================================================
           WHEEL
        ================================================= */

        this.wheelCooldown =
            0;


        /* =================================================
           PLAYER
        ================================================= */

        this.rightHandBone =
            null;


        /* =================================================
           RAYCAST
        ================================================= */

        this.raycaster =
            new THREE.Raycaster();


        this.fireNDC =
            new THREE.Vector2();


        this.shotDirection =
            new THREE.Vector3();


        /* =================================================
           TEMP VECTORS
        ================================================= */

        this.handPosition =
            new THREE.Vector3();


        this.playerQuaternion =
            new THREE.Quaternion();


        this.tpsOffset =
            new THREE.Vector3();


        this.tempWorldPosition =
            new THREE.Vector3();


        this.fpsTargetPosition =
            new THREE.Vector3();


        this.rotatedRearSight =
            new THREE.Vector3();


        this.desiredRearSight =
            new THREE.Vector3();


        /* =================================================
           EFFECTS
        ================================================= */

        this.effects =
            [];


        this.explodedBodies =
            new WeakSet();


        /* =================================================
           IMPACT MATERIAL
        ================================================= */

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


        /* =================================================
           WALL IMPACT
        ================================================= */

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


        /* =================================================
           ENEMY IMPACT
        ================================================= */

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


        /* =================================================
           EXPLOSION MATERIAL
        ================================================= */

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


        /* =================================================
           MUZZLE LIGHT
        ================================================= */

        this.muzzleLight =
            new THREE.PointLight(

                0xffb75c,

                0,

                3.5,

                2

            );


        this.muzzleLight.visible =
            false;


        this.scene.add(
            this.muzzleLight
        );


        this.muzzleFlashTimer =
            0;


        /* =================================================
           RECOIL
        ================================================= */

        this.recoilTimer =
            0;


        /* =================================================
           HUD / INPUT
        ================================================= */

        this.createHUD();


        this.setupInput();


        /* =================================================
           REAL RELOAD CALLBACK

           La munición se actualiza cuando termina
           Reload.fbx.
        ================================================= */

        this.playerController
            .setReloadFinishedHandler?.(

                () => {

                    this.finishReload();

                }

            );

    }


    /* =====================================================
       CONFIG GETTERS
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


    /* =====================================================
       UNLOCK
    ====================================================== */

    isWeaponUnlocked(
        key
    ) {

        return this.unlockedWeapons.has(
            key
        );

    }


    setWeaponUnlocked(

        key,

        unlocked = true

    ) {

        if (
            !WEAPON_CONFIG[key]
        ) {

            return false;

        }


        if (
            unlocked
        ) {

            this.unlockedWeapons.add(
                key
            );

        }

        else if (
            key !==
            "pistol"
        ) {

            this.unlockedWeapons.delete(
                key
            );

        }


        this.updateHUD();


        return true;

    }


    /* =====================================================
       ADD AMMO

       La usaremos después para pickups.
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


        state.reserve +=
            Math.max(

                0,

                Math.floor(
                    amount
                )

            );


        this.updateHUD();


        return true;

    }


    /* =====================================================
       GLTF
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


    /* =====================================================
       LOAD CONFIGURED ASSET
    ====================================================== */

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


                console.log(

                    `[Weapon] ${config.displayName} cargada:`,

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


        if (
            config.assetPaths.length >
            0
        ) {

            console.warn(

                `[Weapon] No se encontró modelo para ${config.displayName}. Usando fallback.`,

                lastError ??
                ""

            );

        }


        return this.createFallbackWeapon(
            config.key
        );

    }


    /* =====================================================
       PROCEDURAL WEAPONS

       SMG y Shotgun provisionales.
    ====================================================== */

    createFallbackWeapon(
        key
    ) {

        const group =
            new THREE.Group();


        group.name =
            `Fallback_${key}`;


        const dark =
            new THREE.MeshStandardMaterial({

                color:
                    0x232a32,

                roughness:
                    0.48,

                metalness:
                    0.68

            });


        const accent =
            new THREE.MeshStandardMaterial({

                color:
                    0x9ba9b5,

                roughness:
                    0.38,

                metalness:
                    0.75

            });


        const grip =
            new THREE.MeshStandardMaterial({

                color:
                    0x111417,

                roughness:
                    0.8,

                metalness:
                    0.12

            });


        /* =================================================
           SMG
        ================================================= */

        if (
            key ===
            "smg"
        ) {

            const body =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        0.11,

                        0.11,

                        0.32

                    ),

                    dark

                );


            body.position.z =
                0.08;


            const barrel =
                new THREE.Mesh(

                    new THREE.CylinderGeometry(

                        0.018,

                        0.018,

                        0.22,

                        10

                    ),

                    accent

                );


            barrel.rotation.x =
                Math.PI /
                2;


            barrel.position.set(

                0,

                0.015,

                0.33

            );


            const handle =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        0.07,

                        0.18,

                        0.075

                    ),

                    grip

                );


            handle.rotation.x =
                -0.20;


            handle.position.set(

                0,

                -0.12,

                -0.01

            );


            const magazine =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        0.055,

                        0.19,

                        0.065

                    ),

                    dark

                );


            magazine.rotation.x =
                -0.10;


            magazine.position.set(

                0,

                -0.13,

                0.12

            );


            const stock =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        0.075,

                        0.075,

                        0.18

                    ),

                    dark

                );


            stock.position.set(

                0,

                0,

                -0.17

            );


            group.add(

                body,

                barrel,

                handle,

                magazine,

                stock

            );

        }


        /* =================================================
           SHOTGUN
        ================================================= */

        else if (
            key ===
            "shotgun"
        ) {

            const body =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        0.105,

                        0.12,

                        0.30

                    ),

                    dark

                );


            body.position.z =
                -0.02;


            const barrel =
                new THREE.Mesh(

                    new THREE.CylinderGeometry(

                        0.025,

                        0.025,

                        0.44,

                        12

                    ),

                    accent

                );


            barrel.rotation.x =
                Math.PI /
                2;


            barrel.position.set(

                0,

                0.02,

                0.32

            );


            const pump =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        0.095,

                        0.095,

                        0.15

                    ),

                    grip

                );


            pump.position.set(

                0,

                -0.025,

                0.22

            );


            const handle =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        0.07,

                        0.18,

                        0.075

                    ),

                    grip

                );


            handle.rotation.x =
                -0.22;


            handle.position.set(

                0,

                -0.13,

                -0.08

            );


            const stock =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        0.11,

                        0.13,

                        0.28

                    ),

                    dark

                );


            stock.position.set(

                0,

                -0.01,

                -0.29

            );


            group.add(

                body,

                barrel,

                pump,

                handle,

                stock

            );

        }


        /* =================================================
           GENERIC FALLBACK
        ================================================= */

        else {

            const body =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        0.09,

                        0.11,

                        0.24

                    ),

                    dark

                );


            const barrel =
                new THREE.Mesh(

                    new THREE.CylinderGeometry(

                        0.016,

                        0.016,

                        0.14,

                        10

                    ),

                    accent

                );


            barrel.rotation.x =
                Math.PI /
                2;


            barrel.position.z =
                0.18;


            const handle =
                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        0.065,

                        0.18,

                        0.07

                    ),

                    grip

                );


            handle.rotation.x =
                -0.18;


            handle.position.set(

                0,

                -0.13,

                -0.06

            );


            group.add(

                body,

                barrel,

                handle

            );

        }


        group.traverse(

            object => {

                if (
                    !object.isMesh
                ) {

                    return;

                }


                object.castShadow =
                    true;


                object.receiveShadow =
                    true;


                object.frustumCulled =
                    false;


                object.userData
                    .ignoreWeaponRaycast =
                    true;

            }

        );


        return group;

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

            "[Weapon] Cargando sistema multi-arma..."

        );


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


        /* =================================================
           LOAD EACH WEAPON
        ================================================= */

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


            template.name =
                `${config.displayName}_Template`;


            template.traverse(

                object => {

                    if (
                        !object.isMesh
                    ) {

                        return;

                    }


                    object.castShadow =
                        true;


                    object.receiveShadow =
                        true;


                    object.frustumCulled =
                        false;


                    object.userData
                        .ignoreWeaponRaycast =
                        true;


                    const materials =
                        Array.isArray(
                            object.material
                        )

                            ?

                            object.material

                            :

                            [
                                object.material
                            ];


                    for (
                        const material
                        of materials
                    ) {

                        if (
                            material
                        ) {

                            material.needsUpdate =
                                true;

                        }

                    }

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


        /* =================================================
           READY
        ================================================= */

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


        console.log(

            "[Weapon] PISTOL + SMG + SHOTGUN ONLINE"

        );

    }


    /* =====================================================
       NORMALIZE WEAPON
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


        /* =================================================
           LONGEST AXIS -> Z
        ================================================= */

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


        /* =================================================
           SCALE
        ================================================= */

        box =
            new THREE.Box3()
                .setFromObject(
                    model
                );


        const orientedSize =
            new THREE.Vector3();


        box.getSize(
            orientedSize
        );


        const length =
            Math.max(

                orientedSize.x,

                orientedSize.y,

                orientedSize.z

            );


        if (
            length <=
            0
        ) {

            throw new Error(

                "Modelo de arma inválido."

            );

        }


        model.scale.multiplyScalar(

            targetLength /
            length

        );


        model.updateMatrixWorld(
            true
        );


        /* =================================================
           GRIP ORIGIN
        ================================================= */

        box =
            new THREE.Box3()
                .setFromObject(
                    model
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


        const gripPoint =
            new THREE.Vector3(

                center.x,

                box.min.y +
                size.y *
                0.53,

                box.min.z +
                size.z *
                0.23

            );


        model.position.sub(
            gripPoint
        );


        model.updateMatrixWorld(
            true
        );

    }


    /* =====================================================
       CREATE WEAPON ENTRY
    ====================================================== */

    createWeaponEntry(

        key,

        template,

        config

    ) {

        /* =================================================
           ROOTS
        ================================================= */

        const tpsRoot =
            new THREE.Group();


        const fpsRoot =
            new THREE.Group();


        tpsRoot.name =
            `Nova_TPS_${key}`;


        fpsRoot.name =
            `Nova_FPS_${key}`;


        this.scene.add(
            tpsRoot
        );


        this.camera.add(
            fpsRoot
        );


        /* =================================================
           VISUAL COPIES
        ================================================= */

        const tpsVisual =
            template.clone(
                true
            );


        const fpsVisual =
            template.clone(
                true
            );


        tpsVisual.name =
            `TPS_${key}_Visual`;


        fpsVisual.name =
            `FPS_${key}_Visual`;


        tpsRoot.add(
            tpsVisual
        );


        fpsRoot.add(
            fpsVisual
        );


        /* =================================================
           ANCHORS
        ================================================= */

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


        /* =================================================
           FPS START TRANSFORM
        ================================================= */

        fpsRoot.position.copy(
            config.fpsHip.position
        );


        fpsRoot.quaternion
            .setFromEuler(
                config.fpsHip.rotation
            );


        /* =================================================
           TPS ROTATION OFFSET
        ================================================= */

        const tpsRotationOffset =
            new THREE.Quaternion()
                .setFromEuler(

                    config
                        .tps
                        .rotationOffset

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

            tpsVisual,

            fpsVisual,

            tpsMuzzle,

            tpsRearSight,

            tpsFrontSight,

            fpsMuzzle,

            fpsRearSight,

            fpsFrontSight,

            anchors,

            tpsRotationOffset

        };

    }


    /* =====================================================
       CALCULATE ANCHORS
    ====================================================== */

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
                    0.006

                ),


            rearSight:
                new THREE.Vector3(

                    center.x,

                    box.max.y -
                    size.y *
                    0.06,

                    box.min.z +
                    size.z *
                    0.18

                ),


            frontSight:
                new THREE.Vector3(

                    center.x,

                    box.max.y -
                    size.y *
                    0.06,

                    box.max.z -
                    size.z *
                    0.11

                )

        };

    }


    /* =====================================================
       EQUIP WEAPON
    ====================================================== */

    equipWeapon(

        key,

        force = false

    ) {

        if (
            !this.loaded

            &&

            !force
        ) {

            return false;

        }


        if (
            !WEAPON_CONFIG[key]
        ) {

            return false;

        }


        if (
            !this.isWeaponUnlocked(
                key
            )
        ) {

            return false;

        }


        /*
         * No permitimos cancelar Reload
         * cambiando de arma.
         */
        if (
            this.isReloading

            &&

            !force
        ) {

            return false;

        }


        if (
            this.activeWeaponKey ===
            key

            &&

            this.activeEntry

            &&

            !force
        ) {

            return true;

        }


        /* =================================================
           HIDE ALL
        ================================================= */

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
            )

            ??

            null;


        this.updateVisibility();


        this.updateHUD();


        console.log(

            `[Weapon] Equipada: ${WEAPON_CONFIG[key].displayName}`

        );


        return true;

    }


    /* =====================================================
       MOUSE WHEEL SWITCH
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
                    this.isWeaponUnlocked(
                        key
                    )

            );


        if (
            available.length <=
            1
        ) {

            return false;

        }


        let index =
            available.indexOf(
                this.activeWeaponKey
            );


        if (
            index <
            0
        ) {

            index =
                0;

        }


        index =
            (

                index

                +

                direction

                +

                available.length

            )

            %

            available.length;


        const changed =
            this.equipWeapon(

                available[index]

            );


        if (
            changed
        ) {

            /*
             * Evita saltarse varias armas con
             * una sola rueda sensible.
             */
            this.wheelCooldown =
                0.12;

        }


        return changed;

    }


    /* =====================================================
       TPS WEAPON
    ====================================================== */

    updateTPSWeapon() {

        if (
            !this.loaded

            ||

            !this.rightHandBone

            ||

            !this.activeEntry
        ) {

            return;

        }


        const config =
            this.getActiveConfig();


        const entry =
            this.activeEntry;


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


        entry.tpsRoot
            .position
            .copy(
                this.handPosition
            )
            .add(
                this.tpsOffset
            );


        entry.tpsRoot
            .quaternion
            .copy(
                this.playerQuaternion
            )
            .multiply(
                entry.tpsRotationOffset
            );


        entry.tpsRoot.scale.set(
            1,
            1,
            1
        );


        entry.tpsRoot.updateMatrixWorld(
            true
        );

    }


    /* =====================================================
       FPS HIP
    ====================================================== */

    updateFPSHip(
        deltaTime
    ) {

        if (
            !this.activeEntry
        ) {

            return;

        }


        const config =
            this.getActiveConfig();


        const entry =
            this.activeEntry;


        const targetPosition =
            config
                .fpsHip
                .position
                .clone();


        /* =================================================
           SMALL RECOIL
        ================================================= */

        if (
            this.recoilTimer >
            0
        ) {

            targetPosition.z +=
                config.recoil;

        }


        const targetQuaternion =
            new THREE.Quaternion()
                .setFromEuler(

                    config
                        .fpsHip
                        .rotation

                );


        const alpha =
            1

            -

            Math.exp(

                -config
                    .fpsHip
                    .response

                *

                deltaTime

            );


        entry.fpsRoot
            .position
            .lerp(

                targetPosition,

                alpha

            );


        entry.fpsRoot
            .quaternion
            .slerp(

                targetQuaternion,

                alpha

            );


        entry.fpsRoot
            .updateMatrixWorld(
                true
            );

    }


    /* =====================================================
       FPS ADS
    ====================================================== */

    updateFPSADS(
        deltaTime
    ) {

        if (
            !this.activeEntry
        ) {

            return;

        }


        const config =
            this.getActiveConfig();


        const entry =
            this.activeEntry;


        const targetQuaternion =
            new THREE.Quaternion()
                .setFromEuler(

                    config
                        .fpsADS
                        .rotation

                );


        this.desiredRearSight.set(

            config
                .fpsADS
                .sightSide,

            config
                .fpsADS
                .sightHeight,

            -config
                .fpsADS
                .sightDistance

        );


        this.rotatedRearSight
            .copy(
                entry
                    .anchors
                    .rearSight
            )
            .applyQuaternion(
                targetQuaternion
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

                -config
                    .fpsADS
                    .response

                *

                deltaTime

            );


        entry.fpsRoot
            .position
            .lerp(

                this.fpsTargetPosition,

                alpha

            );


        entry.fpsRoot
            .quaternion
            .slerp(

                targetQuaternion,

                alpha

            );


        entry.fpsRoot
            .updateMatrixWorld(
                true
            );

    }


    /* =====================================================
       VISIBILITY
    ====================================================== */

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


        const gameVisible =

            this.loaded

            &&

            this.enabled

            &&

            !this.paused

            &&

            this.activeEntry;


        if (
            gameVisible
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


        if (
            this.ammoHUD
        ) {

            this.ammoHUD.style.display =

                this.enabled

                    ?

                    "block"

                    :

                    "none";


            this.ammoHUD.style.opacity =

                this.paused

                    ?

                    "0.2"

                    :

                    "1";

        }


        const ads =

            gameVisible

            &&

            this.viewMode ===
            "FPS"

            &&

            this.aiming

            &&

            !this.isReloading;


        if (
            this.crosshair
        ) {

            this.crosshair.style.display =

                gameVisible

                &&

                !ads

                    ?

                    "block"

                    :

                    "none";

        }


        if (
            this.adsReticle
        ) {

            this.adsReticle.style.display =

                ads

                    ?

                    "block"

                    :

                    "none";

        }

    }


    /* =====================================================
       ENABLE
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


    /* =====================================================
       PAUSE
    ====================================================== */

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


    /* =====================================================
       VIEW MODE
    ====================================================== */

    setViewMode(
        mode
    ) {

        this.viewMode =
            mode;


        this.updateVisibility();

    }


    /* =====================================================
       AIMING
    ====================================================== */

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


    /* =====================================================
       ADS ANCHOR
    ====================================================== */

    getADSAnchor() {

        if (
            !this.loaded

            ||

            !this.activeEntry
        ) {

            return null;

        }


        const rearSight =
            new THREE.Vector3();


        const frontSight =
            new THREE.Vector3();


        const muzzle =
            new THREE.Vector3();


        if (
            this.viewMode ===
            "FPS"
        ) {

            this.activeEntry
                .fpsRearSight
                .getWorldPosition(
                    rearSight
                );


            this.activeEntry
                .fpsFrontSight
                .getWorldPosition(
                    frontSight
                );


            this.activeEntry
                .fpsMuzzle
                .getWorldPosition(
                    muzzle
                );

        }

        else {

            this.activeEntry
                .tpsRearSight
                .getWorldPosition(
                    rearSight
                );


            this.activeEntry
                .tpsFrontSight
                .getWorldPosition(
                    frontSight
                );


            this.activeEntry
                .tpsMuzzle
                .getWorldPosition(
                    muzzle
                );

        }


        return {

            rearSight,

            frontSight,

            muzzle

        };

    }


    /* =====================================================
       ENVIRONMENT
    ====================================================== */

    setEnvironment(
        environment
    ) {

        this.environmentMeshes =
            [];


        environment.traverse(

            object => {

                if (
                    object.isMesh

                    &&

                    object.visible
                ) {

                    this.environmentMeshes.push(
                        object
                    );

                }

            }

        );

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

            this.enemyTargets =
                [];


            return;

        }


        this.enemyTargets =
            this.enemyManager
                .getHitMeshes();

    }


    /* =====================================================
       DYNAMIC TARGETS
    ====================================================== */

    refreshDynamicTargets() {

        this.dynamicTargets =
            this.objectManager
                .getDynamicObjects()
                .map(

                    object =>
                        object.mesh

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

                &&

                current.userData.enemy
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
       FIND PHYSICAL OBJECT
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

                &&

                current.userData.rigidBody
            ) {

                return {

                    root:
                        current,

                    rigidBody:
                        current.userData
                            .rigidBody,

                    type:
                        current.userData
                            .objectType

                };

            }


            current =
                current.parent;

        }


        return null;

    }


    /* =====================================================
       HUD
    ====================================================== */

    createHUD() {

        /* =================================================
           CROSSHAIR
        ================================================= */

        this.crosshair =
            document.createElement(
                "div"
            );


        Object.assign(

            this.crosshair.style,

            {

                position:
                    "fixed",

                left:
                    "50%",

                top:
                    "50%",

                width:
                    "12px",

                height:
                    "12px",

                transform:
                    "translate(-50%, -50%)",

                border:
                    "1px solid rgba(255,255,255,.78)",

                borderRadius:
                    "50%",

                boxShadow:
                    "0 0 6px rgba(255,255,255,.28)",

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

                background:
                    "#ffffff",

                borderRadius:
                    "50%"

            }

        );


        this.crosshair.appendChild(
            dot
        );


        document.body.appendChild(
            this.crosshair
        );


        /* =================================================
           ADS DOT
        ================================================= */

        this.adsReticle =
            document.createElement(
                "div"
            );


        Object.assign(

            this.adsReticle.style,

            {

                position:
                    "fixed",

                left:
                    "50%",

                top:
                    "50%",

                width:
                    "4px",

                height:
                    "4px",

                transform:
                    "translate(-50%, -50%)",

                borderRadius:
                    "50%",

                background:
                    "#ffffff",

                boxShadow:
                    "0 0 7px rgba(255,255,255,.95)",

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

                backdropFilter:
                    "blur(6px)",

                color:
                    "#ffffff",

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


        document.body.appendChild(
            this.ammoHUD
        );


        this.updateHUD();

    }


    /* =====================================================
       UPDATE HUD
    ====================================================== */

    updateHUD() {

        if (
            !this.ammoHUD
        ) {

            return;

        }


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


        const reserveText =

            Number.isFinite(
                state.reserve
            )

                ?

                state.reserve

                :

                "∞";


        const availableNames =

            WEAPON_ORDER

                .filter(

                    key =>
                        this.isWeaponUnlocked(
                            key
                        )

                )

                .map(

                    key => {

                        const active =
                            key ===
                            this.activeWeaponKey;


                        return active

                            ?

                            `[${WEAPON_CONFIG[key].displayName}]`

                            :

                            WEAPON_CONFIG[key]
                                .displayName;

                    }

                )

                .join(
                    " · "
                );


        this.ammoHUD.innerHTML = `

            <div style="
                opacity:.58;
                font-size:8px;
                margin-bottom:5px;
                letter-spacing:1.4px;
            ">
                ${config.displayName}
            </div>


            <span style="
                font-size:20px;
                font-weight:700;
            ">
                ${state.magazine}
            </span>


            <span style="
                opacity:.55;
                margin-left:4px;
                font-size:11px;
            ">
                / ${reserveText}
            </span>


            ${
                this.isReloading

                    ?

                    `
                    <span style="
                        color:#d7433b;
                        font-size:8px;
                        margin-left:7px;
                    ">
                        RELOADING
                    </span>
                    `

                    :

                    ""
            }


            <div style="
                opacity:.36;
                font-size:6px;
                margin-top:6px;
                letter-spacing:.8px;
                white-space:nowrap;
            ">
                RUEDA · ${availableNames}
            </div>

        `;

    }


    /* =====================================================
       INPUT
    ====================================================== */

    setupInput() {

        /* =================================================
           LEFT CLICK
        ================================================= */

        window.addEventListener(

            "mousedown",

            event => {

                if (
                    !this.enabled

                    ||

                    this.paused

                    ||

                    event.button !==
                    0

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


        /* =================================================
           RELEASE LEFT CLICK
        ================================================= */

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


        /* =================================================
           R = RELOAD
        ================================================= */

        window.addEventListener(

            "keydown",

            event => {

                if (
                    !this.enabled

                    ||

                    this.paused

                    ||

                    event.repeat

                    ||

                    !this.cameraManager
                        .isInputCaptured()
                ) {

                    return;

                }


                if (
                    event.code ===
                    "KeyR"
                ) {

                    this.reload();

                }

            }

        );


        /* =================================================
           MOUSE WHEEL

           Down = next
           Up   = previous
        ================================================= */

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


                if (
                    event.deltaY >
                    0
                ) {

                    this.cycleWeapon(
                        1
                    );

                }

                else if (
                    event.deltaY <
                    0
                ) {

                    this.cycleWeapon(
                        -1
                    );

                }

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


        if (
            !config

            ||

            !state
        ) {

            return false;

        }


        const now =
            performance.now() /
            1000;


        /* =================================================
           FIRE RATE
        ================================================= */

        if (
            now -
            this.lastShotTime <
            config.fireRate
        ) {

            return false;

        }


        /* =================================================
           EMPTY MAGAZINE
        ================================================= */

        if (
            state.magazine <=
            0
        ) {

            this.reload();


            return false;

        }


        this.lastShotTime =
            now;


        /* =================================================
           CONSUME ROUND
        ================================================= */

        state.magazine--;


        this.updateHUD();


        /* =================================================
           PLAYER SHOOT ANIMATION
        ================================================= */

        this.playerController
            .shoot();


        /* =================================================
           EFFECTS
        ================================================= */

        this.muzzleFlashTimer =
            0.045;


        this.recoilTimer =
            0.075;


        /* =================================================
           TARGET CACHE
        ================================================= */

        this.refreshEnemyTargets();


        /* =================================================
           SHOTGUN
        ================================================= */

        if (
            config.pellets >
            1
        ) {

            this.fireShotgun(
                config
            );

        }


        /* =================================================
           PISTOL / SMG
        ================================================= */

        else {

            this.fireSingleProjectile(
                config
            );

        }


        /* =================================================
           EMPTY -> AUTO RELOAD
        ================================================= */

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

        const spread =
            config.spread;


        const x =

            spread >
            0

                ?

                (
                    Math.random() -
                    0.5
                )

                *

                spread

                :

                0;


        const y =

            spread >
            0

                ?

                (
                    Math.random() -
                    0.5
                )

                *

                spread

                :

                0;


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

       7 raycasts con dispersión.
    ====================================================== */

    fireShotgun(
        config
    ) {

        for (
            let i = 0;
            i < config.pellets;
            i++
        ) {

            /*
             * Distribución circular.
             */
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
                Math.cos(
                    angle
                )

                *

                radius;


            const y =
                Math.sin(
                    angle
                )

                *

                radius;


            const hit =
                this.findNearestHit(

                    x,

                    y,

                    config.range

                );


            if (
                !hit
            ) {

                continue;

            }


            this.processHit(

                hit,

                config.damage,

                config.objectImpulse /
                config.pellets

            );

        }

    }


    /* =====================================================
       FIND NEAREST HIT
    ====================================================== */

    findNearestHit(

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


        this.raycaster.far =
            range;


        /* =================================================
           ENVIRONMENT
        ================================================= */

        const environmentHits =
            this.raycaster
                .intersectObjects(

                    this.environmentMeshes,

                    false

                );


        /* =================================================
           PHYSICAL OBJECTS
        ================================================= */

        const dynamicHits =
            this.raycaster
                .intersectObjects(

                    this.dynamicTargets,

                    true

                );


        /* =================================================
           ENEMIES
        ================================================= */

        const enemyHits =

            this.enemyTargets.length >
            0

                ?

                this.raycaster
                    .intersectObjects(

                        this.enemyTargets,

                        false

                    )

                :

                [];


        let hit =
            null;


        if (
            environmentHits.length >
            0
        ) {

            hit =
                environmentHits[0];

        }


        if (
            dynamicHits.length >
            0

            &&

            (
                !hit

                ||

                dynamicHits[0]
                    .distance <
                hit.distance
            )
        ) {

            hit =
                dynamicHits[0];

        }


        if (
            enemyHits.length >
            0

            &&

            (
                !hit

                ||

                enemyHits[0]
                    .distance <
                hit.distance
            )
        ) {

            hit =
                enemyHits[0];

        }


        return hit;

    }


    /* =====================================================
       PROCESS HIT
    ====================================================== */

    processHit(

        hit,

        damage,

        objectImpulse

    ) {

        /* =================================================
           ENEMY
        ================================================= */

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


            const killed =
                enemy.takeDamage(
                    damage
                );


            if (
                killed
            ) {

                this.refreshEnemyTargets();

            }


            return;

        }


        /* =================================================
           PHYSICAL OBJECT
        ================================================= */

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


        /* =================================================
           BARREL
        ================================================= */

        if (
            physical.type ===
            "industrial-barrel"
        ) {

            this.explodeBarrel(
                physical
            );


            return;

        }


        /* =================================================
           NORMAL PHYSICAL IMPULSE
        ================================================= */

        this.camera
            .getWorldDirection(
                this.shotDirection
            );


        this.shotDirection
            .normalize();


        const impulse =
            this.shotDirection
                .clone()
                .multiplyScalar(
                    objectImpulse
                );


        impulse.y +=
            0.08;


        this.physicsManager
            .applyImpulse(

                physical.rigidBody,

                impulse

            );

    }


    /* =====================================================
       BARREL EXPLOSION

       barrelCombatBridge.js sigue envolviendo esta función
       para aplicar daño a los enemigos.
    ====================================================== */

    explodeBarrel(
        barrel
    ) {

        if (
            this.explodedBodies
                .has(
                    barrel.rigidBody
                )
        ) {

            return;

        }


        this.explodedBodies.add(
            barrel.rigidBody
        );


        const position =
            barrel.rigidBody
                .translation();


        const center =
            new THREE.Vector3(

                position.x,

                position.y,

                position.z

            );


        this.createExplosionEffect(
            center
        );


        /*
         * La fuerza de explosión del barril continúa
         * utilizando la configuración de la pistola.
         *
         * Es una propiedad del barril, no del arma
         * equipada.
         */
        const explosionConfig =
            WEAPON_CONFIG.pistol;


        const objects = [

            ...this.objectManager
                .getDynamicObjects()

        ];


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


            const p =
                object.rigidBody
                    .translation();


            const direction =
                new THREE.Vector3(

                    p.x -
                    center.x,

                    p.y -
                    center.y,

                    p.z -
                    center.z

                );


            const distance =
                direction.length();


            if (
                distance <=
                0.001

                ||

                distance >
                explosionConfig
                    .explosionRadius
            ) {

                continue;

            }


            direction.normalize();


            const strength =

                (
                    1

                    -

                    distance /
                    explosionConfig
                        .explosionRadius
                )

                *

                explosionConfig
                    .explosionForce;


            direction.multiplyScalar(
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
       CAN RELOAD
    ====================================================== */

    canReload() {

        const config =
            this.getActiveConfig();


        const state =
            this.getActiveState();


        if (
            !config

            ||

            !state
        ) {

            return false;

        }


        /* =================================================
           ALREADY FULL
        ================================================= */

        if (
            state.magazine >=
            config.magazineSize
        ) {

            return false;

        }


        /* =================================================
           NO RESERVE
        ================================================= */

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


    /* =====================================================
       RELOAD
    ====================================================== */

    reload() {

        if (
            this.isReloading

            ||

            !this.canReload()
        ) {

            return false;

        }


        /* =================================================
           CANCEL ADS
        ================================================= */

        this.cameraManager
            .cancelAim();


        /* =================================================
           PLAYER Reload.fbx

           Reload puede interrumpir Shoot gracias al
           PlayerController actual.
        ================================================= */

        const animationStarted =
            this.playerController
                .reload();


        if (
            animationStarted ===
            false
        ) {

            return false;

        }


        /* =================================================
           LOCK WEAPON
        ================================================= */

        this.isReloading =
            true;


        this.reloadingWeaponKey =
            this.activeWeaponKey;


        this.autoReloadDelay =
            0;


        this.triggerHeld =
            false;


        this.aiming =
            false;


        this.updateVisibility();


        this.updateHUD();


        console.log(

            `[Weapon] Reload ${this.getActiveConfig().displayName}`

        );


        return true;

    }


    /* =====================================================
       FINISH RELOAD

       SOLO se ejecuta cuando termina Reload.fbx.
    ====================================================== */

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


        if (
            !config

            ||

            !state
        ) {

            this.isReloading =
                false;


            this.reloadingWeaponKey =
                null;


            return;

        }


        const needed =

            config.magazineSize

            -

            state.magazine;


        if (
            needed >
            0
        ) {

            /* =================================================
               FINITE RESERVE
            ================================================= */

            if (
                Number.isFinite(
                    state.reserve
                )
            ) {

                const transferred =
                    Math.min(

                        needed,

                        state.reserve

                    );


                state.magazine +=
                    transferred;


                state.reserve -=
                    transferred;

            }


            /* =================================================
               INFINITE RESERVE
            ================================================= */

            else {

                state.magazine =
                    config.magazineSize;

            }

        }


        this.isReloading =
            false;


        this.reloadingWeaponKey =
            null;


        this.autoReloadDelay =
            0;


        this.updateHUD();


        this.updateVisibility();


        console.log(

            `[Weapon] Reload terminado · ${config.displayName}`

        );

    }


    /* =====================================================
       IMPACT EFFECT
    ====================================================== */

    createImpactEffect(

        position,

        dynamic,

        enemy = false

    ) {

        const count =
            6;


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

                    (
                        Math.random() -
                        0.5
                    )

                    *

                    2,


                    0.35

                    +

                    Math.random() *
                    1.25,


                    (
                        Math.random() -
                        0.5
                    )

                    *

                    2

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


        const material =

            enemy

                ?

                this.enemyImpactMaterial

                :

                (
                    dynamic

                        ?

                        this.impactMaterial

                        :

                        this.wallImpactMaterial
                );


        const particles =
            new THREE.Points(

                geometry,

                material

            );


        particles.position.copy(
            position
        );


        this.scene.add(
            particles
        );


        this.effects.push({

            object:
                particles,

            velocities,

            life:
                0.14,

            maxLife:
                0.14,

            flash:
                null

        });

    }


    /* =====================================================
       EXPLOSION EFFECT
    ====================================================== */

    createExplosionEffect(
        position
    ) {

        const count =
            24;


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
                    5

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


        const particles =
            new THREE.Points(

                geometry,

                this.explosionMaterial

            );


        particles.position.copy(
            position
        );


        this.scene.add(
            particles
        );


        const flash =
            new THREE.PointLight(

                0xff381f,

                32,

                7,

                2

            );


        flash.position.copy(
            position
        );


        this.scene.add(
            flash
        );


        this.effects.push({

            object:
                particles,

            velocities,

            life:
                0.48,

            maxLife:
                0.48,

            flash

        });

    }


    /* =====================================================
       UPDATE PARTICLE EFFECT
    ====================================================== */

    updateEffect(

        effect,

        deltaTime

    ) {

        const attribute =
            effect
                .object
                .geometry
                .attributes
                .position;


        const array =
            attribute.array;


        for (
            let i = 0;
            i < effect.velocities.length;
            i++
        ) {

            const velocity =
                effect.velocities[i];


            velocity.y -=

                4.5 *
                deltaTime;


            const index =
                i *
                3;


            array[index] +=

                velocity.x *
                deltaTime;


            array[index + 1] +=

                velocity.y *
                deltaTime;


            array[index + 2] +=

                velocity.z *
                deltaTime;

        }


        attribute.needsUpdate =
            true;


        if (
            effect.flash
        ) {

            effect.flash.intensity =

                32

                *

                Math.max(

                    0,

                    effect.life /
                    effect.maxLife

                );

        }

    }


    /* =====================================================
       MUZZLE
    ====================================================== */

    updateMuzzle(
        deltaTime
    ) {

        if (
            !this.loaded

            ||

            !this.enabled

            ||

            this.paused

            ||

            !this.activeEntry
        ) {

            this.muzzleLight.visible =
                false;


            return;

        }


        const activeMuzzle =

            this.viewMode ===
            "FPS"

                ?

                this.activeEntry
                    .fpsMuzzle

                :

                this.activeEntry
                    .tpsMuzzle;


        activeMuzzle
            .getWorldPosition(
                this.tempWorldPosition
            );


        this.muzzleLight
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


            this.muzzleLight.visible =
                true;


            this.muzzleLight.intensity =

                this.getActiveConfig()
                    .muzzleFlash

                *

                Math.max(

                    0,

                    this.muzzleFlashTimer /
                    0.045

                );

        }

        else {

            this.muzzleLight.visible =
                false;


            this.muzzleLight.intensity =
                0;

        }

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


        /* =================================================
           WHEEL COOLDOWN
        ================================================= */

        this.wheelCooldown =
            Math.max(

                0,

                this.wheelCooldown -
                deltaTime

            );


        /* =================================================
           RECOIL
        ================================================= */

        this.recoilTimer =
            Math.max(

                0,

                this.recoilTimer -
                deltaTime

            );


        const config =
            this.getActiveConfig();


        /* =================================================
           AUTOMATIC FIRE

           Solo SMG tiene automatic = true.
        ================================================= */

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

            this.autoReloadDelay =
                Math.max(

                    0,

                    this.autoReloadDelay -
                    deltaTime

                );


            if (
                this.autoReloadDelay <=
                0

                &&

                this.getActiveState()
                    ?.magazine ===
                0

                &&

                this.enabled

                &&

                this.canReload()
            ) {

                this.reload();

            }

        }


        /* =================================================
           TPS
        ================================================= */

        this.updateTPSWeapon();


        /* =================================================
           FPS
        ================================================= */

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


        /* =================================================
           MUZZLE
        ================================================= */

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
                effect.life <=
                0
            ) {

                this.scene.remove(
                    effect.object
                );


                effect.object
                    .geometry
                    .dispose();


                if (
                    effect.flash
                ) {

                    this.scene.remove(
                        effect.flash
                    );

                }


                this.effects.splice(

                    i,

                    1

                );

            }

        }

    }

}
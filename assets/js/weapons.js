/* =========================================================
   NOVA CATALYST
   Weapon Manager

   Build v0.13.1 Performance

   ---------------------------------------------------------
   - Pistol GLTF
   - SMG GLTF
   - Shotgun GLTF
   - Mouse wheel switching
   - Weapon unlocking
   - TPS / FPS
   - ADS
   - Synchronized Reload.fbx
   - Semi / Auto / Shotgun
   - Independent ammo
   - Enemy damage
   - Physical objects
   - Explosive barrels
   - Pickup integration
========================================================= */

import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   WEAPON ORDER
========================================================= */

const WEAPON_ORDER = [

    "pistol",

    "smg",

    "shotgun"

];


/* =========================================================
   WEAPON CONFIG
========================================================= */

const WEAPON_CONFIG = {


    /* =====================================================
       PISTOL
    ====================================================== */

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


        muzzleFlash:
            13,

        recoil:
            0.012,


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


    /* =====================================================
       SMG
    ====================================================== */

    smg: {

        key:
            "smg",

        displayName:
            "NOVA SMG",


        /*
         * MODELO REAL
         */
        assetPaths: [

            "./assets/models/weapons/smg/scene.gltf"

        ],


        targetLength:
            0.60,


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


        muzzleFlash:
            10,

        recoil:
            0.009,


        /*
         * IMPORTANTE:
         * comienza bloqueada.
         */
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


    /* =====================================================
       SHOTGUN
    ====================================================== */

    shotgun: {

        key:
            "shotgun",

        displayName:
            "NOVA SHOTGUN",


        /*
         * MODELO REAL
         */
        assetPaths: [

            "./assets/models/weapons/shotgun/scene.gltf"

        ],


        targetLength:
            1.02,


        magazineSize:
            6,

        initialReserve:
            36,


        /*
         * Daño POR PERDIGÓN.
         *
         * 7 perdigones × 16 máximo = 112
         * si todos impactan.
         */
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


        muzzleFlash:
            18,

        recoil:
            0.022,


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
           GLTF
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
           WORLD TARGETS
        ================================================= */

        this.environmentMeshes =
            [];


        this.dynamicTargets =
            [];


        /* =================================================
           WEAPONS
        ================================================= */

        this.weaponEntries =
            new Map();


        this.weaponState =
            new Map();


        this.unlockedWeapons =
            new Set();


        /* =================================================
           INITIAL STATES
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
           PLAYER HAND
        ================================================= */

        this.rightHandBone =
            null;


        /* =================================================
           RAYCAST
        ================================================= */

        this.raycaster =
            new THREE.Raycaster();


        this.fireNDC =
            new THREE.Vector2(
                0,
                0
            );


        this.shotDirection =
            new THREE.Vector3();


        /* =================================================
           PERFORMANCE · RAYCAST CACHE

           Unificamos escenario + físicos + enemigos
           en una sola lista para reducir el número de
           intersectObjects() por disparo.
        ================================================= */

        this.raycastTargets =
            [];


        this.raycastResults =
            [];


        /* =================================================
           ENEMY TARGET CACHE

           No reconstruimos la lista de enemigos en cada
           bala de la SMG. Solo comprobamos periódicamente
           si cambió la cantidad de enemigos disparables.
        ================================================= */

        this.enemyTargetCheckTimer =
            0;


        this.enemyTargetCheckInterval =
            0.20;


        this.lastShootableEnemyCount =
            -1;


        /* =================================================
           TEMP
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


        this.tempImpulse =
            new THREE.Vector3();


        this.fpsTargetQuaternion =
            new THREE.Quaternion();


        /* =================================================
           EFFECTS
        ================================================= */

        this.effects =
            [];


        this.explodedBodies =
            new WeakSet();


        /* =================================================
           MATERIALS
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


        /* =================================================
           IMPACT EFFECT POOL

           Reutilizamos geometrías para los impactos de
           Pistol / SMG / Shotgun y evitamos generar basura
           de memoria en cada disparo.
        ================================================= */

        this.impactPool =
            [];


        this.impactPoolSize =
            20;


        this.createImpactPool();


        /* =================================================
           MUZZLE
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
        ================================================= */

        this.playerController
            .setReloadFinishedHandler?.(

                () => {

                    this.finishReload();

                }

            );

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
       ACQUIRE WEAPON

       Utilizada por PickupManager.
    ====================================================== */

    acquireWeapon(

        key,

        equipAfterPickup = true

    ) {

        if (
            !WEAPON_CONFIG[key]

            ||

            !this.loaded
        ) {

            return false;

        }


        const alreadyUnlocked =
            this.isWeaponUnlocked(
                key
            );


        if (
            alreadyUnlocked
        ) {

            return false;

        }


        this.unlockedWeapons.add(
            key
        );


        console.log(

            `[Weapon] Arma adquirida: ${WEAPON_CONFIG[key].displayName}`

        );


        /*
         * Si no estamos recargando,
         * equipamos el arma inmediatamente.
         */
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
       AMMO PICKUP API
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
       GLTF LOADER
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
       LOAD WEAPON ASSET
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

                    `[Weapon] ${config.displayName} cargada desde ${path}`

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

            `No se pudo cargar ${config.displayName}. `

            +

            (
                lastError?.message

                ??

                ""
            )

        );

    }


    /* =====================================================
       LOAD ALL
    ====================================================== */

    async load() {

        if (
            this.loaded
        ) {

            return;

        }


        console.log(

            "[Weapon] Cargando Pistol + SMG + Shotgun..."

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


        for (
            const key
            of WEAPON_ORDER
        ) {

            const config =
                WEAPON_CONFIG[key];


            const template =
                await this.loadConfiguredAsset(
                    config
                );


            template.name =
                `${config.displayName}_Template`;


            /* =================================================
               MODEL SETTINGS
            ================================================= */

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


        this.loaded =
            true;


        /* =================================================
           START ONLY WITH PISTOL
        ================================================= */

        this.equipWeapon(

            "pistol",

            true

        );


        this.refreshDynamicTargets();


        this.refreshEnemyTargets();


        this.updateVisibility();


        this.updateHUD();


        console.log(
            "[Weapon] MULTI-WEAPON GLTF ONLINE"
        );

    }


    /* =====================================================
       MODEL NORMALIZATION
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
           DETECT BARREL / HANDLE DIRECTION
        ================================================= */

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


        /* =================================================
           MOVE GRIP TO ORIGIN
        ================================================= */

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


        const gripPoint =
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
            gripPoint
        );


        model.updateMatrixWorld(
            true
        );

    }


    /* =====================================================
       DETECT REAR OF WEAPON
    ====================================================== */

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
                    i < attribute.count;
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
       CREATE TPS/FPS ENTRY
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


        /* =================================================
           SIGHTS / MUZZLE
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


        fpsRoot.position.copy(
            config.fpsHip.position
        );


        fpsRoot.quaternion
            .setFromEuler(
                config.fpsHip.rotation
            );


        const tpsRotationOffset =
            new THREE.Quaternion()
                .setFromEuler(
                    config.tps.rotationOffset
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
       CALCULATE SIGHTS
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
       PICKUP VISUAL API

       PickupManager reutiliza exactamente el mismo
       modelo GLTF normalizado.
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


        visual.name =
            `Pickup_${key}`;


        visual.traverse(

            object => {

                if (
                    !object.isMesh
                ) {

                    return;

                }


                object.castShadow =
                    false;


                object.receiveShadow =
                    true;


                object.frustumCulled =
                    true;


                object.userData
                    .ignoreWeaponRaycast =
                    true;

            }

        );


        return visual;

    }


    /* =====================================================
       EQUIP
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
         * No podemos cancelar Reload
         * cambiando de arma.
         */
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
       MOUSE WHEEL
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

            this.wheelCooldown =
                0.12;

        }


        return changed;

    }


    /* =====================================================
       TPS UPDATE
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


        /* =================================================
           REUSE VECTOR / QUATERNION
        ================================================= */

        this.fpsTargetPosition.copy(
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


        entry.fpsRoot.position.lerp(

            this.fpsTargetPosition,

            alpha

        );


        entry.fpsRoot.quaternion.slerp(

            this.fpsTargetQuaternion,

            alpha

        );


        entry.fpsRoot.updateMatrixWorld(
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
                entry.anchors.rearSight
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


        entry.fpsRoot.position.lerp(

            this.fpsTargetPosition,

            alpha

        );


        entry.fpsRoot.quaternion.slerp(

            this.fpsTargetQuaternion,

            alpha

        );


        entry.fpsRoot.updateMatrixWorld(
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


        this.crosshair.style.display =

            gameVisible

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
       AIM
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
       REBUILD RAYCAST TARGETS

       Escenario + objetos físicos + enemigos en una sola
       lista ya aplanada. Así cada pellet usa un único
       intersectObjects().
    ====================================================== */

    rebuildRaycastTargets() {

        this.raycastTargets.length =
            0;


        const added =
            new Set();


        const addMesh =
            mesh => {

                if (
                    !mesh

                    ||

                    !mesh.isMesh

                    ||

                    added.has(
                        mesh
                    )
                ) {

                    return;

                }


                added.add(
                    mesh
                );


                this.raycastTargets.push(
                    mesh
                );

            };


        for (
            const mesh
            of this.environmentMeshes
        ) {

            addMesh(
                mesh
            );

        }


        for (
            const mesh
            of this.dynamicTargets
        ) {

            addMesh(
                mesh
            );

        }


        for (
            const mesh
            of this.enemyTargets
        ) {

            addMesh(
                mesh
            );

        }

    }


    /* =====================================================
       ENVIRONMENT
    ====================================================== */

    setEnvironment(
        environment
    ) {

        this.environmentMeshes.length =
            0;


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


        this.rebuildRaycastTargets();


        console.log(

            `[Weapon] Raycast environment: ${this.environmentMeshes.length} meshes`

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

            typeof this.enemyManager.getHitMeshes !==
            "function"
        ) {

            this.enemyTargets.length =
                0;


            this.lastShootableEnemyCount =
                0;


            this.rebuildRaycastTargets();


            return;

        }


        this.enemyTargets =
            this.enemyManager
                .getHitMeshes();


        const enemies =

            typeof this.enemyManager.getAliveEnemies ===
            "function"

                ?

                this.enemyManager
                    .getAliveEnemies()

                :

                [];


        this.lastShootableEnemyCount =

            enemies.filter(

                enemy =>
                    !enemy.isDead?.()

                    &&

                    !enemy.isSpawning?.()

            ).length;


        this.rebuildRaycastTargets();

    }


    /* =====================================================
       DYNAMIC OBJECTS
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

            const root =
                object.mesh;


            if (
                !root
            ) {

                continue;

            }


            root.traverse(

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


        this.rebuildRaycastTargets();

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

                return current.userData.enemy;

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

                &&

                current.userData.rigidBody
            ) {

                return {

                    root:
                        current,

                    rigidBody:
                        current.userData.rigidBody,

                    type:
                        current.userData.objectType

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
           ADS RETICLE
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
       HUD CONTENT
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


        const unlocked =
            WEAPON_ORDER

                .filter(

                    key =>
                        this.isWeaponUnlocked(
                            key
                        )

                )

                .map(

                    key => {

                        if (
                            key ===
                            this.activeWeaponKey
                        ) {

                            return `[${WEAPON_CONFIG[key].displayName}]`;

                        }


                        return WEAPON_CONFIG[key].displayName;

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
                opacity:.38;
                font-size:6px;
                margin-top:6px;
                letter-spacing:.7px;
                white-space:nowrap;
            ">
                RUEDA · ${unlocked}
            </div>

        `;

    }


    /* =====================================================
       INPUT
    ====================================================== */

    setupInput() {

        /* =================================================
           FIRE
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
           RELEASE FIRE
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
           RELOAD
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


        this.updateHUD();


        this.playerController
            .shoot();


        this.muzzleFlashTimer =
            0.045;


        this.recoilTimer =
            0.075;


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
       PISTOL / SMG
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
                Math.cos(
                    angle
                )

                *

                radius;


            y =
                Math.sin(
                    angle
                )

                *

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

        const enemyHits =
            new Map();


        const physicalHits =
            new Map();


        let firstWorldHit =
            null;


        /* =================================================
           RAYCAST PELLETS
        ================================================= */

        for (
            let i = 0;
            i < config.pellets;
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


            /* =============================================
               ENEMY
            ============================================= */

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

                        pelletCount:
                            0,

                        point:
                            hit.point.clone()

                    };


                    enemyHits.set(

                        enemy,

                        data

                    );

                }


                data.pelletCount++;


                continue;

            }


            /* =============================================
               PHYSICAL OBJECT
            ============================================= */

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

                        pelletCount:
                            0,

                        point:
                            hit.point.clone()

                    };


                    physicalHits.set(

                        physical.rigidBody,

                        data

                    );

                }


                data.pelletCount++;


                continue;

            }


            /* =============================================
               ENVIRONMENT

               Solo necesitamos un efecto visual de pared
               por disparo de escopeta.
            ============================================= */

            if (
                !firstWorldHit
            ) {

                firstWorldHit =
                    hit.point.clone();

            }

        }


        /* =================================================
           APPLY ENEMY DAMAGE
        ================================================= */

        let enemyKilled =
            false;


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


            const totalDamage =

                config.damage

                *

                data.pelletCount;


            const killed =
                enemy.takeDamage(
                    totalDamage
                );


            if (
                killed
            ) {

                enemyKilled =
                    true;

            }

        }


        if (
            enemyKilled
        ) {

            this.refreshEnemyTargets();

        }


        /* =================================================
           APPLY PHYSICAL IMPACTS
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


            const impulseStrength =

                (
                    config.objectImpulse /
                    config.pellets
                )

                *

                data.pelletCount;


            this.applyPhysicalImpulse(

                physical,

                impulseStrength

            );

        }


        /* =================================================
           WALL FX
        ================================================= */

        if (
            firstWorldHit
        ) {

            this.createImpactEffect(

                firstWorldHit,

                false,

                false

            );

        }

    }


    /* =====================================================
       HITSCAN
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
           ONE INTERSECTION PASS

           Reutilizamos el mismo array para evitar crear
           tres resultados distintos por pellet.
        ================================================= */

        this.raycastResults.length =
            0;


        this.raycaster
            .intersectObjects(

                this.raycastTargets,

                false,

                this.raycastResults

            );


        return (

            this.raycastResults[0]

            ??

            null

        );

    }


    /* =====================================================
       APPLY PHYSICAL IMPULSE

       Reutiliza un Vector3 temporal en lugar de clonar uno
       nuevo en cada impacto.
    ====================================================== */

    applyPhysicalImpulse(

        physical,

        strength

    ) {

        this.camera
            .getWorldDirection(
                this.shotDirection
            );


        this.shotDirection.normalize();


        this.tempImpulse
            .copy(
                this.shotDirection
            )
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
       HIT PROCESSING
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
           PHYSICAL
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
           IMPULSE
        ================================================= */

        this.applyPhysicalImpulse(

            physical,

            objectImpulse

        );

    }


    /* =====================================================
       BARREL
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
                explosionConfig.explosionRadius
            ) {

                continue;

            }


            direction.normalize();


            const strength =

                (
                    1

                    -

                    distance /
                    explosionConfig.explosionRadius
                )

                *

                explosionConfig.explosionForce;


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
       RELOAD CHECK
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


        this.cameraManager
            .cancelAim();


        const animationStarted =
            this.playerController
                .reload();


        if (
            animationStarted ===
            false
        ) {

            return false;

        }


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

            `[Weapon] Reload: ${this.getActiveConfig().displayName}`

        );


        return true;

    }


    /* =====================================================
       REAL RELOAD FINISH
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


        const required =

            config.magazineSize

            -

            state.magazine;


        /* =================================================
           INFINITE RESERVE
        ================================================= */

        if (
            !Number.isFinite(
                state.reserve
            )
        ) {

            state.magazine =
                config.magazineSize;

        }

        /* =================================================
           FINITE RESERVE
        ================================================= */

        else {

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


        this.isReloading =
            false;


        this.reloadingWeaponKey =
            null;


        this.autoReloadDelay =
            0;


        this.updateHUD();


        this.updateVisibility();


        console.log(

            `[Weapon] Reload terminado: ${config.displayName}`

        );

    }


    /* =====================================================
       IMPACT POOL

       Creamos las partículas una sola vez. Esto evita
       new BufferGeometry / Float32Array / Vector3 en cada
       bala, especialmente importante para la SMG.
    ====================================================== */

    createImpactPool() {

        const particleCount =
            6;


        for (
            let i = 0;
            i < this.impactPoolSize;
            i++
        ) {

            const positions =
                new Float32Array(

                    particleCount *
                    3

                );


            const velocities =
                new Float32Array(

                    particleCount *
                    3

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


            const particles =
                new THREE.Points(

                    geometry,

                    this.wallImpactMaterial

                );


            particles.visible =
                false;


            particles.frustumCulled =
                false;


            this.scene.add(
                particles
            );


            this.impactPool.push({

                object:
                    particles,

                velocities,

                life:
                    0,

                maxLife:
                    0.14,

                flash:
                    null,

                pooled:
                    true,

                busy:
                    false

            });

        }

    }


    /* =====================================================
       IMPACT FX
    ====================================================== */

    createImpactEffect(

        position,

        dynamic,

        enemy = false

    ) {

        let effect =
            null;


        /* =================================================
           FREE SLOT
        ================================================= */

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


        /* =================================================
           POOL EXHAUSTED

           Reutilizamos el efecto al que menos vida le queda.
        ================================================= */

        if (
            !effect
        ) {

            effect =
                this.impactPool[0];


            for (
                const candidate
                of this.impactPool
            ) {

                if (
                    candidate.life <
                    effect.life
                ) {

                    effect =
                        candidate;

                }

            }


            const activeIndex =
                this.effects.indexOf(
                    effect
                );


            if (
                activeIndex !==
                -1
            ) {

                this.effects.splice(

                    activeIndex,

                    1

                );

            }

        }


        effect.busy =
            true;


        effect.life =
            0.14;


        effect.maxLife =
            0.14;


        effect.object.material =

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


        const attribute =
            effect.object
                .geometry
                .attributes
                .position;


        const positions =
            attribute.array;


        positions.fill(
            0
        );


        const velocities =
            effect.velocities;


        for (
            let i = 0;
            i < velocities.length;
            i += 3
        ) {

            velocities[i] =

                (
                    Math.random() -
                    0.5
                )

                *

                2;


            velocities[
                i +
                1
            ] =

                0.35

                +

                Math.random() *
                1.25;


            velocities[
                i +
                2
            ] =

                (
                    Math.random() -
                    0.5
                )

                *

                2;

        }


        attribute.needsUpdate =
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


    /* =====================================================
       EXPLOSION FX
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
       EFFECT UPDATE
    ====================================================== */

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


        /* =================================================
           POOLED IMPACT
        ================================================= */

        if (
            effect.pooled
        ) {

            const velocities =
                effect.velocities;


            for (
                let i = 0;
                i < velocities.length;
                i += 3
            ) {

                velocities[
                    i +
                    1
                ] -=

                    4.5 *
                    deltaTime;


                positions[i] +=

                    velocities[i] *
                    deltaTime;


                positions[
                    i +
                    1
                ] +=

                    velocities[
                        i +
                        1
                    ]

                    *

                    deltaTime;


                positions[
                    i +
                    2
                ] +=

                    velocities[
                        i +
                        2
                    ]

                    *

                    deltaTime;

            }


            attribute.needsUpdate =
                true;


            return;

        }


        /* =================================================
           EXPLOSION EFFECT
        ================================================= */

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


            positions[index] +=
                velocity.x *
                deltaTime;


            positions[index + 1] +=
                velocity.y *
                deltaTime;


            positions[index + 2] +=
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

                this.activeEntry.fpsMuzzle

                :

                this.activeEntry.tpsMuzzle;


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


        const config =
            this.getActiveConfig();


        /* =================================================
           ENEMY TARGET CACHE

           Revisa cada 200 ms si cambió la cantidad de
           enemigos ya disponibles para recibir disparos.
        ================================================= */

        this.enemyTargetCheckTimer -=
            deltaTime;


        if (
            this.enemyTargetCheckTimer <=
            0
        ) {

            this.enemyTargetCheckTimer =
                this.enemyTargetCheckInterval;


            if (
                this.enemyManager

                &&

                typeof this.enemyManager.getAliveEnemies ===
                "function"
            ) {

                const shootableCount =

                    this.enemyManager
                        .getAliveEnemies()
                        .filter(

                            enemy =>
                                !enemy.isDead?.()

                                &&

                                !enemy.isSpawning?.()

                        )
                        .length;


                if (
                    shootableCount !==
                    this.lastShootableEnemyCount
                ) {

                    this.refreshEnemyTargets();

                }

            }

        }


        /* =================================================
           AUTOMATIC SMG
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

                /* =========================================
                   POOLED IMPACT
                ========================================= */

                if (
                    effect.pooled
                ) {

                    effect.object.visible =
                        false;


                    effect.busy =
                        false;


                    this.effects.splice(

                        i,

                        1

                    );


                    continue;

                }


                /* =========================================
                   EXPLOSION
                ========================================= */

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
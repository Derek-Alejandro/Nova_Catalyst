/* =========================================================
   NOVA CATALYST
   Weapon Manager

   Build v0.11.3

   - Sci-fi Handgun
   - TPS + FPS
   - ADS
   - Enemy damage
   - Physics objects
   - Explosive barrels
   - Synchronized Reload
========================================================= */

import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   ASSET
========================================================= */

const PISTOL_ASSET = {

    paths: [

        "./assets/models/weapons/pistol/scene.gltf",

        "./assets/models/weapons/pistol/scene.glb",

        "./assets/models/weapons/pistol/pistol.glb",

        "./assets/models/weapons/scene.gltf",

        "./assets/models/weapons/pistol.glb"

    ],

    targetLength:
        0.28

};


/* =========================================================
   TPS
========================================================= */

const TPS_CONFIG = {

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

};


/* =========================================================
   FPS HIP
========================================================= */

const FPS_HIP = {

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

};


/* =========================================================
   FPS ADS
========================================================= */

const FPS_ADS = {

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

};


/* =========================================================
   CONFIG
========================================================= */

const WEAPON_CONFIG = {

    pistol: {

        magazineSize:
            12,

        fireRate:
            0.22,

        reloadTime:
            1.65,

        range:
            60,

        damage:
            20,

        objectImpulse:
            1.35,

        explosionRadius:
            5.5,

        explosionForce:
            11.5

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
           ENEMIES
        ================================================= */

        this.enemyManager =
            null;


        this.enemyTargets =
            [];


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


        this.ammo =
            WEAPON_CONFIG
                .pistol
                .magazineSize;


        this.isReloading =
            false;


        this.lastShotTime =
            -Infinity;


        /* =================================================
           AUTO RELOAD DELAY
        ================================================= */

        this.autoReloadDelay =
            0;


        /* =================================================
           SYNCHRONIZE WITH Reload.fbx
        ================================================= */

        this.playerController
            .setReloadFinishedHandler?.(

                () => {

                    this.finishReload();

                }

            );


        /* =================================================
           PLAYER
        ================================================= */

        this.rightHandBone =
            null;


        /* =================================================
           TEMPLATE
        ================================================= */

        this.weaponTemplate =
            null;


        /* =================================================
           TPS ROOT
        ================================================= */

        this.tpsWeaponRoot =
            new THREE.Group();


        this.tpsWeaponRoot.name =
            "Nova_TPS_Handgun";


        this.scene.add(
            this.tpsWeaponRoot
        );


        this.tpsVisual =
            null;


        /* =================================================
           FPS ROOT
        ================================================= */

        this.fpsWeaponRoot =
            new THREE.Group();


        this.fpsWeaponRoot.name =
            "Nova_FPS_Handgun";


        this.camera.add(
            this.fpsWeaponRoot
        );


        this.fpsVisual =
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


        this.tpsRotationOffset =
            new THREE.Quaternion()
                .setFromEuler(
                    TPS_CONFIG.rotationOffset
                );


        /* =================================================
           BOUNDS
        ================================================= */

        this.weaponBox =
            new THREE.Box3();


        this.weaponSize =
            new THREE.Vector3();


        this.weaponCenter =
            new THREE.Vector3();


        /* =================================================
           LOCAL ANCHORS
        ================================================= */

        this.muzzleLocal =
            new THREE.Vector3();


        this.rearSightLocal =
            new THREE.Vector3();


        this.frontSightLocal =
            new THREE.Vector3();


        /* =================================================
           TPS ANCHORS
        ================================================= */

        this.tpsMuzzle =
            new THREE.Object3D();


        this.tpsRearSight =
            new THREE.Object3D();


        this.tpsFrontSight =
            new THREE.Object3D();


        this.tpsWeaponRoot.add(

            this.tpsMuzzle,

            this.tpsRearSight,

            this.tpsFrontSight

        );


        /* =================================================
           FPS ANCHORS
        ================================================= */

        this.fpsMuzzle =
            new THREE.Object3D();


        this.fpsRearSight =
            new THREE.Object3D();


        this.fpsFrontSight =
            new THREE.Object3D();


        this.fpsWeaponRoot.add(

            this.fpsMuzzle,

            this.fpsRearSight,

            this.fpsFrontSight

        );


        /* =================================================
           FPS TRANSFORMS
        ================================================= */

        this.fpsTargetPosition =
            new THREE.Vector3();


        this.fpsTargetQuaternion =
            new THREE.Quaternion();


        this.rotatedRearSight =
            new THREE.Vector3();


        this.desiredRearSight =
            new THREE.Vector3();


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


        this.environmentMeshes =
            [];


        this.dynamicTargets =
            [];


        this.shotDirection =
            new THREE.Vector3();


        /* =================================================
           EFFECTS
        ================================================= */

        this.effects =
            [];


        this.explodedBodies =
            new WeakSet();


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


        this.tempWorldPosition =
            new THREE.Vector3();


        /* =================================================
           HUD
        ================================================= */

        this.createHUD();


        this.setupInput();

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


    /* =====================================================
       LOAD ASSET
    ====================================================== */

    async loadWeaponAsset() {

        let lastError =
            null;


        for (
            const path
            of PISTOL_ASSET.paths
        ) {

            try {

                const gltf =
                    await this.loadGLTF(
                        path
                    );


                console.log(

                    "[Weapon] Modelo cargado:",

                    path

                );


                return gltf;

            }

            catch (
                error
            ) {

                lastError =
                    error;

            }

        }


        throw new Error(

            "No se encontró Sci-fi Handgun. "

            +

            (
                lastError?.message
                ??
                ""
            )

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
            "[Weapon] Cargando arma..."
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


        console.log(

            "[Weapon] RightHand:",

            this.rightHandBone.name

        );


        const gltf =
            await this.loadWeaponAsset();


        this.weaponTemplate =
            gltf.scene;


        this.weaponTemplate.name =
            "SciFi_Handgun_Template";


        this.weaponTemplate.traverse(

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
            this.weaponTemplate
        );


        this.tpsVisual =
            this.weaponTemplate
                .clone(
                    true
                );


        this.fpsVisual =
            this.weaponTemplate
                .clone(
                    true
                );


        this.tpsVisual.name =
            "TPS_SciFi_Handgun";


        this.fpsVisual.name =
            "FPS_SciFi_Handgun";


        this.tpsWeaponRoot.add(
            this.tpsVisual
        );


        this.fpsWeaponRoot.add(
            this.fpsVisual
        );


        this.calculateLocalAnchors();


        this.installAnchors();


        this.fpsWeaponRoot.position.copy(
            FPS_HIP.position
        );


        this.fpsWeaponRoot.quaternion
            .setFromEuler(
                FPS_HIP.rotation
            );


        this.loaded =
            true;


        this.updateTPSWeapon();


        this.updateVisibility();


        console.log(
            "[Weapon] TPS + FPS weapons ONLINE"
        );

    }


    /* =====================================================
       NORMALIZE
    ====================================================== */

    normalizeWeaponModel(
        model
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

            PISTOL_ASSET.targetLength /
            length

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
            !this.isHandleAtNegativeZ(

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


        console.log(
            "[Weapon] Modelo normalizado."
        );

    }


    /* =====================================================
       HANDLE DETECTION
    ====================================================== */

    isHandleAtNegativeZ(

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
                            2000

                        )

                    );


                for (
                    let i = 0;
                    i < attribute.count;
                    i += step
                ) {

                    point.fromBufferAttribute(

                        attribute,

                        i

                    );


                    point.applyMatrix4(
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


        return (

            negativeLowest <
            positiveLowest

        );

    }


    /* =====================================================
       ANCHORS
    ====================================================== */

    calculateLocalAnchors() {

        this.weaponTemplate
            .updateMatrixWorld(
                true
            );


        this.weaponBox
            .setFromObject(
                this.weaponTemplate
            );


        this.weaponBox.getSize(
            this.weaponSize
        );


        this.weaponBox.getCenter(
            this.weaponCenter
        );


        this.muzzleLocal.set(

            this.weaponCenter.x,

            this.weaponBox.max.y -
            this.weaponSize.y *
            0.25,

            this.weaponBox.max.z +
            0.006

        );


        this.rearSightLocal.set(

            this.weaponCenter.x,

            this.weaponBox.max.y -
            this.weaponSize.y *
            0.06,

            this.weaponBox.min.z +
            this.weaponSize.z *
            0.18

        );


        this.frontSightLocal.set(

            this.weaponCenter.x,

            this.weaponBox.max.y -
            this.weaponSize.y *
            0.06,

            this.weaponBox.max.z -
            this.weaponSize.z *
            0.11

        );

    }


    installAnchors() {

        this.tpsMuzzle.position.copy(
            this.muzzleLocal
        );


        this.tpsRearSight.position.copy(
            this.rearSightLocal
        );


        this.tpsFrontSight.position.copy(
            this.frontSightLocal
        );


        this.fpsMuzzle.position.copy(
            this.muzzleLocal
        );


        this.fpsRearSight.position.copy(
            this.rearSightLocal
        );


        this.fpsFrontSight.position.copy(
            this.frontSightLocal
        );

    }


    /* =====================================================
       TPS WEAPON
    ====================================================== */

    updateTPSWeapon() {

        if (
            !this.loaded

            ||

            !this.rightHandBone
        ) {

            return;

        }


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
                TPS_CONFIG.positionOffset
            )
            .applyQuaternion(
                this.playerQuaternion
            );


        this.tpsWeaponRoot
            .position
            .copy(
                this.handPosition
            )
            .add(
                this.tpsOffset
            );


        this.tpsWeaponRoot
            .quaternion
            .copy(
                this.playerQuaternion
            )
            .multiply(
                this.tpsRotationOffset
            );


        this.tpsWeaponRoot.scale.set(
            1,
            1,
            1
        );


        this.tpsWeaponRoot
            .updateMatrixWorld(
                true
            );

    }


    /* =====================================================
       FPS HIP
    ====================================================== */

    updateFPSHip(
        deltaTime
    ) {

        const targetQuaternion =
            new THREE.Quaternion()
                .setFromEuler(
                    FPS_HIP.rotation
                );


        const alpha =
            1

            -

            Math.exp(

                -FPS_HIP.response *
                deltaTime

            );


        this.fpsWeaponRoot
            .position
            .lerp(

                FPS_HIP.position,

                alpha

            );


        this.fpsWeaponRoot
            .quaternion
            .slerp(

                targetQuaternion,

                alpha

            );


        this.fpsWeaponRoot
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

        const targetQuaternion =
            new THREE.Quaternion()
                .setFromEuler(
                    FPS_ADS.rotation
                );


        this.desiredRearSight.set(

            FPS_ADS.sightSide,

            FPS_ADS.sightHeight,

            -FPS_ADS.sightDistance

        );


        this.rotatedRearSight
            .copy(
                this.rearSightLocal
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


        const alpha =
            1

            -

            Math.exp(

                -FPS_ADS.response *
                deltaTime

            );


        this.fpsWeaponRoot
            .position
            .lerp(

                this.fpsTargetPosition,

                alpha

            );


        this.fpsWeaponRoot
            .quaternion
            .slerp(

                targetQuaternion,

                alpha

            );


        this.fpsWeaponRoot
            .updateMatrixWorld(
                true
            );

    }


    /* =====================================================
       VISIBILITY
    ====================================================== */

    updateVisibility() {

        const gameVisible =

            this.loaded

            &&

            this.enabled

            &&

            !this.paused;


        const fps =
            this.viewMode ===
            "FPS";


        this.tpsWeaponRoot.visible =

            gameVisible

            &&

            !fps;


        this.fpsWeaponRoot.visible =

            gameVisible

            &&

            fps;


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


        const ads =

            gameVisible

            &&

            fps

            &&

            this.aiming;


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
            enabled
        ) {

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
            aiming;


        this.updateVisibility();

    }


    /* =====================================================
       ADS ANCHOR
    ====================================================== */

    getADSAnchor() {

        if (
            !this.loaded
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

            this.fpsRearSight
                .getWorldPosition(
                    rearSight
                );


            this.fpsFrontSight
                .getWorldPosition(
                    frontSight
                );


            this.fpsMuzzle
                .getWorldPosition(
                    muzzle
                );

        }

        else {

            this.tpsRearSight
                .getWorldPosition(
                    rearSight
                );


            this.tpsFrontSight
                .getWorldPosition(
                    frontSight
                );


            this.tpsMuzzle
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
       ENEMIES
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

                return current.userData.enemy;

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
           AMMO
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
                    "150px",

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

        this.ammoHUD.innerHTML = `

            <div style="
                opacity:.55;
                font-size:8px;
                margin-bottom:5px;
                letter-spacing:1.4px;
            ">
                SCI-FI HANDGUN
            </div>

            <span style="
                font-size:20px;
                font-weight:700;
            ">
                ${this.ammo}
            </span>

            <span style="
                opacity:.45;
                margin-left:4px;
                font-size:11px;
            ">
                / ∞
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

        `;

    }


    /* =====================================================
       INPUT
    ====================================================== */

    setupInput() {

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


                this.fire();

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

    }


    /* =====================================================
       FIRE
    ====================================================== */

    fire() {

        const config =
            WEAPON_CONFIG.pistol;


        /* =================================================
           BLOCK WHILE RELOADING
        ================================================= */

        if (
            this.isReloading
        ) {

            return;

        }


        const now =
            performance.now() /
            1000;


        if (
            now -
            this.lastShotTime <
            config.fireRate
        ) {

            return;

        }


        /* =================================================
           EMPTY MAGAZINE
        ================================================= */

        if (
            this.ammo <=
            0
        ) {

            this.reload();


            return;

        }


        this.lastShotTime =
            now;


        this.ammo--;


        this.updateHUD();


        this.playerController
            .shoot();


        this.muzzleFlashTimer =
            0.045;


        /* =================================================
           HITSCAN
        ================================================= */

        this.fireNDC.set(
            0,
            0
        );


        this.raycaster
            .setFromCamera(

                this.fireNDC,

                this.camera

            );


        this.raycaster.far =
            config.range;


        /*
         * Los enemigos cambian durante las waves.
         */
        this.refreshEnemyTargets();


        const environmentHits =
            this.raycaster
                .intersectObjects(

                    this.environmentMeshes,

                    false

                );


        const dynamicHits =
            this.raycaster
                .intersectObjects(

                    this.dynamicTargets,

                    true

                );


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


        if (
            hit
        ) {

            this.processHit(
                hit
            );

        }


        /* =================================================
           AUTO RELOAD

           La última bala todavía muestra su Shoot.
           0.14s después Reload toma prioridad.
        ================================================= */

        if (
            this.ammo ===
            0
        ) {

            this.autoReloadDelay =
                0.14;

        }

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

                current.userData
                    .rigidBody
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
       PROCESS HIT
    ====================================================== */

    processHit(
        hit
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


            const wasKilled =
                enemy.takeDamage(

                    WEAPON_CONFIG
                        .pistol
                        .damage

                );


            if (
                wasKilled
            ) {

                this.refreshEnemyTargets();


                console.log(
                    "[Weapon] Infectado neutralizado."
                );

            }


            return;

        }


        /* =================================================
           PHYSICAL / ENVIRONMENT
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


        if (
            physical.type ===
            "industrial-barrel"
        ) {

            this.explodeBarrel(
                physical
            );


            return;

        }


        this.camera.getWorldDirection(
            this.shotDirection
        );


        this.shotDirection.normalize();


        const impulse =
            this.shotDirection
                .clone()
                .multiplyScalar(

                    WEAPON_CONFIG
                        .pistol
                        .objectImpulse

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


        const config =
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
                config.explosionRadius
            ) {

                continue;

            }


            direction.normalize();


            const strength =

                (
                    1

                    -

                    distance /
                    config.explosionRadius
                )

                *

                config.explosionForce;


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
       RELOAD
    ====================================================== */

    reload() {

        const config =
            WEAPON_CONFIG.pistol;


        /* =================================================
           ALREADY RELOADING
        ================================================= */

        if (
            this.isReloading
        ) {

            return false;

        }


        /* =================================================
           FULL MAGAZINE
        ================================================= */

        if (
            this.ammo ===
            config.magazineSize
        ) {

            return false;

        }


        /* =================================================
           CANCEL ADS
        ================================================= */

        this.cameraManager
            .cancelAim();


        /* =================================================
           START REAL Reload.fbx
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


        /*
         * IMPORTANTE:
         *
         * isReloading se activa después de comprobar
         * que la animación realmente pudo iniciar.
         */
        this.isReloading =
            true;


        this.autoReloadDelay =
            0;


        this.aiming =
            false;


        this.updateVisibility();


        this.updateHUD();


        console.log(
            "[Weapon] Reload iniciado."
        );


        return true;

    }


    /* =====================================================
       FINISH RELOAD

       Esta función NO se ejecuta por timeout.
       PlayerController la llama cuando AnimationMixer
       termina Reload.fbx.
    ====================================================== */

    finishReload() {

        if (
            !this.isReloading
        ) {

            return;

        }


        const config =
            WEAPON_CONFIG.pistol;


        this.ammo =
            config.magazineSize;


        this.isReloading =
            false;


        this.autoReloadDelay =
            0;


        this.updateHUD();


        console.log(

            `[Weapon] Reload terminado · ${this.ammo} / ∞`

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
                    ) *
                    2,

                    0.35 +
                    Math.random() *
                    1.25,

                    (
                        Math.random() -
                        0.5
                    ) *
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


        const particles =
            new THREE.Points(

                geometry,

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
                    )

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
       UPDATE EFFECT
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
        ) {

            this.muzzleLight.visible =
                false;


            return;

        }


        const activeMuzzle =

            this.viewMode ===
            "FPS"

                ?

                this.fpsMuzzle

                :

                this.tpsMuzzle;


        activeMuzzle.getWorldPosition(
            this.tempWorldPosition
        );


        this.muzzleLight.position.copy(
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

                13

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
           AUTO RELOAD

           No usamos setTimeout.

           Al quedar en 0 esperamos ligeramente el final
           del último disparo y después forzamos Reload.
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

                this.ammo ===
                0

                &&

                this.enabled
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
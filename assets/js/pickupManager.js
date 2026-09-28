/* =========================================================
   NOVA CATALYST
   Pickup Manager

   Build v0.13.0

   ---------------------------------------------------------
   - Weapon pickups
   - SMG / Shotgun
   - Safe floor detection
   - Same-level validation
   - Wall clearance
   - Reachable spawn positions
   - E interaction
   - Uses real weapon GLTF
========================================================= */

import * as THREE from "three";


const PICKUP_CONFIG = {

    interactionDistance:
        1.85,


    minDistanceFromPlayerSpawn:
        4.5,


    maxFloorDifference:
        1.15,


    rayHeight:
        3.5,

    rayDistance:
        7,


    wallClearance:
        0.50,


    visualGroundOffset:
        0.025,


    ringRadius:
        0.55,


    searchRadii: [

        5,

        7,

        9,

        11,

        13

    ],


    searchSteps:
        24

};


/* =========================================================
   PICKUP MANAGER
========================================================= */

export class PickupManager {

    constructor({

        scene,

        playerController,

        weaponManager,

        onPickup = null

    }) {

        this.scene =
            scene;


        this.playerController =
            playerController;


        this.weaponManager =
            weaponManager;


        this.onPickup =
            onPickup;


        this.environment =
            null;


        this.environmentMeshes =
            [];


        this.enabled =
            false;


        this.pickups =
            [];


        this.closestPickup =
            null;


        /* =================================================
           RAYCAST
        ================================================= */

        this.floorRaycaster =
            new THREE.Raycaster();


        this.wallRaycaster =
            new THREE.Raycaster();


        this.pathRaycaster =
            new THREE.Raycaster();


        /* =================================================
           TEMP
        ================================================= */

        this.playerPosition =
            new THREE.Vector3();


        this.tempDirection =
            new THREE.Vector3();


        this.tempOrigin =
            new THREE.Vector3();


        this.floorNormal =
            new THREE.Vector3();


        this.normalMatrix =
            new THREE.Matrix3();


        /* =================================================
           PROMPT
        ================================================= */

        this.createPrompt();


        /* =================================================
           INPUT
        ================================================= */

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


        this.environmentMeshes =
            [];


        environment.updateMatrixWorld(
            true
        );


        environment.traverse(

            object => {

                if (
                    object.isMesh

                    &&

                    object.visible

                    &&

                    object.geometry
                ) {

                    this.environmentMeshes.push(
                        object
                    );

                }

            }

        );


        console.log(

            `[PickupManager] Environment: ${this.environmentMeshes.length} meshes`

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


        if (
            !enabled
        ) {

            this.closestPickup =
                null;


            this.hidePrompt();

        }

    }


    /* =====================================================
       PROMPT UI
    ====================================================== */

    createPrompt() {

        this.prompt =
            document.createElement(
                "div"
            );


        this.prompt.id =
            "nova-pickup-prompt";


        Object.assign(

            this.prompt.style,

            {

                position:
                    "fixed",

                left:
                    "50%",

                bottom:
                    "115px",

                transform:
                    "translateX(-50%)",

                padding:
                    "8px 14px",

                border:
                    "1px solid rgba(255,255,255,.18)",

                borderRadius:
                    "5px",

                background:
                    "rgba(0,0,0,.70)",

                backdropFilter:
                    "blur(5px)",

                color:
                    "#ffffff",

                fontFamily:
                    "Orbitron, Consolas, monospace",

                fontSize:
                    "9px",

                fontWeight:
                    "700",

                letterSpacing:
                    "1.2px",

                textAlign:
                    "center",

                pointerEvents:
                    "none",

                userSelect:
                    "none",

                zIndex:
                    "900",

                display:
                    "none"

            }

        );


        document.body.appendChild(
            this.prompt
        );

    }


    showPrompt(
        pickup
    ) {

        const name =
            this.weaponManager
                .getWeaponDisplayName(
                    pickup.weaponKey
                );


        this.prompt.innerHTML = `

            <span style="
                color:#ff5750;
                margin-right:7px;
            ">
                E
            </span>

            RECOGER ${name}

        `;


        this.prompt.style.display =
            "block";

    }


    hidePrompt() {

        this.prompt.style.display =
            "none";

    }


    /* =====================================================
       INPUT
    ====================================================== */

    setupInput() {

        window.addEventListener(

            "keydown",

            event => {

                if (
                    event.code !==
                    "KeyE"

                    ||

                    event.repeat

                    ||

                    !this.enabled

                    ||

                    !this.closestPickup
                ) {

                    return;

                }


                this.collectPickup(
                    this.closestPickup
                );

            }

        );

    }


    /* =====================================================
       FLOOR TEST
    ====================================================== */

    sampleFloorAt(

        x,

        z,

        referenceY

    ) {

        if (
            !this.environment
        ) {

            return null;

        }


        this.tempOrigin.set(

            x,

            referenceY +
            PICKUP_CONFIG.rayHeight,

            z

        );


        this.floorRaycaster.set(

            this.tempOrigin,

            new THREE.Vector3(
                0,
                -1,
                0
            )

        );


        this.floorRaycaster.near =
            0;


        this.floorRaycaster.far =
            PICKUP_CONFIG.rayDistance;


        const hits =
            this.floorRaycaster
                .intersectObjects(

                    this.environmentMeshes,

                    false

                );


        for (
            const hit
            of hits
        ) {

            if (
                Math.abs(

                    hit.point.y -
                    referenceY

                ) >
                PICKUP_CONFIG.maxFloorDifference
            ) {

                continue;

            }


            if (
                hit.face
            ) {

                this.normalMatrix
                    .getNormalMatrix(
                        hit.object.matrixWorld
                    );


                this.floorNormal
                    .copy(
                        hit.face.normal
                    )
                    .applyMatrix3(
                        this.normalMatrix
                    )
                    .normalize();


                if (
                    Math.abs(
                        this.floorNormal.y
                    ) <
                    0.55
                ) {

                    continue;

                }

            }


            return hit.point.clone();

        }


        return null;

    }


    /* =====================================================
       WALL CLEARANCE
    ====================================================== */

    hasWallClearance(
        position
    ) {

        const directions = [

            [1, 0],

            [-1, 0],

            [0, 1],

            [0, -1],

            [0.707, 0.707],

            [-0.707, 0.707],

            [0.707, -0.707],

            [-0.707, -0.707]

        ];


        this.tempOrigin.set(

            position.x,

            position.y +
            0.65,

            position.z

        );


        for (
            const [
                x,
                z
            ]
            of directions
        ) {

            this.tempDirection.set(
                x,
                0,
                z
            );


            this.wallRaycaster.set(

                this.tempOrigin,

                this.tempDirection

            );


            this.wallRaycaster.near =
                0;


            this.wallRaycaster.far =
                PICKUP_CONFIG.wallClearance;


            const hits =
                this.wallRaycaster
                    .intersectObjects(

                        this.environmentMeshes,

                        false

                    );


            if (
                hits.length >
                0
            ) {

                return false;

            }

        }


        return true;

    }


    /* =====================================================
       DIRECT ACCESS FROM SPAWN
    ====================================================== */

    hasDirectAccess(

        position,

        spawnPosition

    ) {

        this.tempOrigin.set(

            spawnPosition.x,

            spawnPosition.y +
            0.90,

            spawnPosition.z

        );


        const target =
            new THREE.Vector3(

                position.x,

                position.y +
                0.90,

                position.z

            );


        this.tempDirection
            .subVectors(

                target,

                this.tempOrigin

            );


        const distance =
            this.tempDirection
                .length();


        if (
            distance <
            1
        ) {

            return true;

        }


        this.tempDirection.normalize();


        this.pathRaycaster.set(

            this.tempOrigin,

            this.tempDirection

        );


        this.pathRaycaster.near =
            0.25;


        this.pathRaycaster.far =

            Math.max(

                0.1,

                distance -
                0.8

            );


        const hits =
            this.pathRaycaster
                .intersectObjects(

                    this.environmentMeshes,

                    false

                );


        return hits.length ===
            0;

    }


    /* =====================================================
       CHECK PICKUP SEPARATION
    ====================================================== */

    isSeparatedFromOtherPickups(
        position
    ) {

        for (
            const pickup
            of this.pickups
        ) {

            const distance =
                Math.hypot(

                    position.x -
                    pickup.root.position.x,

                    position.z -
                    pickup.root.position.z

                );


            if (
                distance <
                3.5
            ) {

                return false;

            }

        }


        return true;

    }


    /* =====================================================
       FIND SAFE POSITION

       Busca alrededor del spawn del jugador.

       Primero exige línea directa.

       Si no encuentra nada, hace fallback solamente
       con piso válido y espacio.
    ====================================================== */

    findSafePosition(

        spawnPosition,

        angleOffset = 0

    ) {

        /* =================================================
           STRICT SEARCH
        ================================================= */

        for (
            const radius
            of PICKUP_CONFIG.searchRadii
        ) {

            for (
                let i = 0;
                i < PICKUP_CONFIG.searchSteps;
                i++
            ) {

                const angle =

                    angleOffset

                    +

                    (
                        i /
                        PICKUP_CONFIG.searchSteps
                    )

                    *

                    Math.PI *
                    2;


                const x =

                    spawnPosition.x

                    +

                    Math.cos(
                        angle
                    )

                    *

                    radius;


                const z =

                    spawnPosition.z

                    +

                    Math.sin(
                        angle
                    )

                    *

                    radius;


                const floor =
                    this.sampleFloorAt(

                        x,

                        z,

                        spawnPosition.y

                    );


                if (
                    !floor
                ) {

                    continue;

                }


                if (
                    !this.hasWallClearance(
                        floor
                    )
                ) {

                    continue;

                }


                if (
                    !this.hasDirectAccess(

                        floor,

                        spawnPosition

                    )
                ) {

                    continue;

                }


                if (
                    !this.isSeparatedFromOtherPickups(
                        floor
                    )
                ) {

                    continue;

                }


                return floor;

            }

        }


        /* =================================================
           FALLBACK SEARCH

           Si el pasillo tiene mucha geometría,
           relajamos solamente la línea visual.
        ================================================= */

        for (
            const radius
            of PICKUP_CONFIG.searchRadii
        ) {

            for (
                let i = 0;
                i < PICKUP_CONFIG.searchSteps;
                i++
            ) {

                const angle =

                    angleOffset

                    +

                    (
                        i /
                        PICKUP_CONFIG.searchSteps
                    )

                    *

                    Math.PI *
                    2;


                const x =

                    spawnPosition.x

                    +

                    Math.cos(
                        angle
                    )

                    *

                    radius;


                const z =

                    spawnPosition.z

                    +

                    Math.sin(
                        angle
                    )

                    *

                    radius;


                const floor =
                    this.sampleFloorAt(

                        x,

                        z,

                        spawnPosition.y

                    );


                if (
                    !floor
                ) {

                    continue;

                }


                if (
                    !this.hasWallClearance(
                        floor
                    )
                ) {

                    continue;

                }


                if (
                    !this.isSeparatedFromOtherPickups(
                        floor
                    )
                ) {

                    continue;

                }


                return floor;

            }

        }


        console.warn(

            "[PickupManager] No se encontró posición segura."

        );


        return spawnPosition
            .clone()
            .add(

                new THREE.Vector3(
                    2.5,
                    0,
                    0
                )

            );

    }


    /* =====================================================
       CREATE WEAPON PICKUP
    ====================================================== */

    createWeaponPickup({

        weaponKey,

        position,

        rotationY = 0

    }) {

        const visual =
            this.weaponManager
                .getPickupVisual(
                    weaponKey
                );


        if (
            !visual
        ) {

            console.error(

                `[PickupManager] No hay visual para ${weaponKey}.`

            );


            return null;

        }


        const root =
            new THREE.Group();


        root.name =
            `WorldPickup_${weaponKey}`;


        root.position.copy(
            position
        );


        this.scene.add(
            root
        );


        /* =================================================
           WEAPON VISUAL
        ================================================= */

        const visualRoot =
            new THREE.Group();


        visualRoot.rotation.y =
            rotationY;


        visualRoot.add(
            visual
        );


        root.add(
            visualRoot
        );


        /*
         * Ajustamos el arma exactamente sobre el piso.
         */
        visualRoot.updateMatrixWorld(
            true
        );


        const box =
            new THREE.Box3()
                .setFromObject(
                    visualRoot
                );


        visualRoot.position.y +=

            -box.min.y

            +

            PICKUP_CONFIG.visualGroundOffset;


        /* =================================================
           PICKUP RING
        ================================================= */

        const ring =
            new THREE.Mesh(

                new THREE.RingGeometry(

                    PICKUP_CONFIG.ringRadius *
                    0.70,

                    PICKUP_CONFIG.ringRadius,

                    32

                ),

                new THREE.MeshBasicMaterial({

                    color:
                        weaponKey ===
                        "smg"

                            ?

                            0x50b9ff

                            :

                            0xff8b42,

                    transparent:
                        true,

                    opacity:
                        0.40,

                    side:
                        THREE.DoubleSide,

                    depthWrite:
                        false,

                    blending:
                        THREE.AdditiveBlending

                })

            );


        ring.rotation.x =
            -Math.PI /
            2;


        ring.position.y =
            0.015;


        root.add(
            ring
        );


        /* =================================================
           PICKUP
        ================================================= */

        const pickup = {

            weaponKey,

            root,

            visualRoot,

            visual,

            ring,

            collected:
                false,

            pulseTime:
                Math.random() *
                Math.PI *
                2

        };


        this.pickups.push(
            pickup
        );


        console.log(

            `[PickupManager] ${weaponKey}:`,

            position

        );


        return pickup;

    }


    /* =====================================================
       CREATE ZONE A PICKUPS
    ====================================================== */

    createZoneAWeaponPickups(
        playerSpawn
    ) {

        if (
            !this.environment
        ) {

            throw new Error(

                "PickupManager requiere environment."

            );

        }


        if (
            !this.weaponManager.loaded
        ) {

            throw new Error(

                "WeaponManager debe cargarse antes de crear pickups."

            );

        }


        /* =================================================
           SMG

           Aproximadamente hacia un lado del corredor.
        ================================================= */

        const smgPosition =
            this.findSafePosition(

                playerSpawn,

                Math.PI *
                0.20

            );


        this.createWeaponPickup({

            weaponKey:
                "smg",

            position:
                smgPosition,

            rotationY:
                Math.PI *
                0.35

        });


        /* =================================================
           SHOTGUN

           Buscamos en dirección diferente para que
           no aparezcan juntas.
        ================================================= */

        const shotgunPosition =
            this.findSafePosition(

                playerSpawn,

                Math.PI *
                1.10

            );


        this.createWeaponPickup({

            weaponKey:
                "shotgun",

            position:
                shotgunPosition,

            rotationY:
                -Math.PI *
                0.20

        });


        console.log(

            "[PickupManager] Zone A weapon pickups ONLINE"

        );

    }


    /* =====================================================
       COLLECT
    ====================================================== */

    collectPickup(
        pickup
    ) {

        if (
            !pickup

            ||

            pickup.collected
        ) {

            return false;

        }


        const acquired =
            this.weaponManager
                .acquireWeapon(

                    pickup.weaponKey,

                    true

                );


        if (
            !acquired
        ) {

            return false;

        }


        pickup.collected =
            true;


        this.scene.remove(
            pickup.root
        );


        this.closestPickup =
            null;


        this.hidePrompt();


        const name =
            this.weaponManager
                .getWeaponDisplayName(
                    pickup.weaponKey
                );


        if (
            typeof this.onPickup ===
            "function"
        ) {

            this.onPickup({

                weaponKey:
                    pickup.weaponKey,

                name

            });

        }


        console.log(

            `[PickupManager] Recogida: ${name}`

        );


        return true;

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update(
        deltaTime
    ) {

        if (
            !this.enabled
        ) {

            this.hidePrompt();


            return;

        }


        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerPosition
            );


        let nearest =
            null;


        let nearestDistance =
            Infinity;


        for (
            const pickup
            of this.pickups
        ) {

            if (
                pickup.collected
            ) {

                continue;

            }


            /* =================================================
               SUBTLE RING EFFECT

               El arma NO flota ni gira.
               Permanece tirada en el suelo.
            ================================================= */

            pickup.pulseTime +=
                deltaTime *
                2.1;


            const pulse =

                0.30

                +

                (
                    Math.sin(
                        pickup.pulseTime
                    )

                    *

                    0.5

                    +

                    0.5
                )

                *

                0.28;


            pickup.ring.material.opacity =
                pulse;


            pickup.ring.rotation.z +=
                deltaTime *
                0.15;


            /* =================================================
               DISTANCE
            ================================================= */

            const distance =
                Math.hypot(

                    this.playerPosition.x -
                    pickup.root.position.x,

                    this.playerPosition.y -
                    pickup.root.position.y,

                    this.playerPosition.z -
                    pickup.root.position.z

                );


            if (
                distance <
                nearestDistance
            ) {

                nearest =
                    pickup;


                nearestDistance =
                    distance;

            }

        }


        /* =================================================
           INTERACTION
        ================================================= */

        if (
            nearest

            &&

            nearestDistance <=
            PICKUP_CONFIG.interactionDistance
        ) {

            this.closestPickup =
                nearest;


            this.showPrompt(
                nearest
            );

        }

        else {

            this.closestPickup =
                null;


            this.hidePrompt();

        }

    }

}
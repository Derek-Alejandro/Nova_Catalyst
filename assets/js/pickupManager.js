/* =========================================================
   NOVA CATALYST
   Pickup Manager

   Build v0.15.0-B · AMMO BALANCE

   STABLE PRE-ALPHA ROLLBACK

   ---------------------------------------------------------
   - SMG pickup
   - Shotgun pickup
   - SMG ammo
   - Shotgun ammo
   - Rare medkits
   - E interaction
   - Safe local spawn positions
   - Wave rewards
   - Progressive ammo balance
   - No Boss Arena rewards

   IMPORTANTE
   ---------------------------------------------------------
   Esta versión NO intenta repartir objetos por todo
   el bounding box del escenario.

   Usa nuevamente el sistema estable alrededor de la
   zona jugable conocida del jugador.
========================================================= */

import * as THREE from "three";


/* =========================================================
   CONFIG
========================================================= */

const PICKUP_CONFIG = {

    interactionDistance:
        1.85,


    /* =====================================================
       FLOOR
    ====================================================== */

    maxFloorDifference:
        1.15,

    rayHeight:
        3.5,

    rayDistance:
        7,


    /* =====================================================
       CLEARANCE
    ====================================================== */

    wallClearance:
        0.50,


    /* =====================================================
       VISUALS
    ====================================================== */

    visualGroundOffset:
        0.025,

    ringRadius:
        0.55,


    /* =====================================================
       LOCAL SAFE SEARCH
    ====================================================== */

    searchRadii: [
        5,
        7,
        9,
        11,
        13
    ],

    searchSteps:
        24,


    /* =====================================================
       BASE AMMO
    ====================================================== */

    smgAmmo:
        50,

    shotgunAmmo:
        10,


    /* =====================================================
       WAVE BALANCE
    ====================================================== */

    /*
     * Wave 2:
     *
     * Shotgun garantizada +
     * posibilidad de una caja SMG pequeña.
     */
    wave2BonusChance:
        0.55,

    wave2BonusSmgAmmo:
        35,


    /*
     * Wave 3:
     *
     * Reabastecimiento intermedio de ambas armas.
     */
    wave3SmgAmmo:
        55,

    wave3ShotgunAmmo:
        10,


    /*
     * Wave 4:
     *
     * Último suministro antes de Wave 5 + Boss.
     */
    wave4SmgAmmo:
        70,

    wave4ShotgunAmmo:
        12,


    /* =====================================================
       HEALTH
    ====================================================== */

    medkitHealth:
        25,

    maxMedkits:
        2

};


/* =========================================================
   PICKUP MANAGER
========================================================= */

export class PickupManager {

    constructor({

        scene,

        playerController,

        weaponManager,

        playerHealth,

        onPickup = null

    }) {

        /* =================================================
           REFERENCES
        ================================================= */

        this.scene =
            scene;


        this.playerController =
            playerController;


        this.weaponManager =
            weaponManager;


        this.playerHealth =
            playerHealth;


        this.onPickup =
            onPickup;


        /* =================================================
           ENVIRONMENT
        ================================================= */

        this.environment =
            null;


        this.environmentMeshes =
            [];


        /* =================================================
           STATE
        ================================================= */

        this.enabled =
            false;


        this.pickups =
            [];


        this.closestPickup =
            null;


        this.zoneSpawn =
            new THREE.Vector3();


        /* =================================================
           REWARDS
        ================================================= */

        this.waveRewardsSpawned =
            new Set();


        this.medkitsSpawned =
            0;


        /* =================================================
           RAYCASTERS
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


        this.tempTarget =
            new THREE.Vector3();


        this.floorNormal =
            new THREE.Vector3();


        this.normalMatrix =
            new THREE.Matrix3();


        this.downDirection =
            new THREE.Vector3(
                0,
                -1,
                0
            );


        /* =================================================
           UI / INPUT
        ================================================= */

        this.createPrompt();


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


        this.environmentMeshes.length =
            0;


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

            `[Pickup] Environment · ${this.environmentMeshes.length} meshes`

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
       PROMPT
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
                    "rgba(0,0,0,.72)",

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


    hidePrompt() {

        this.prompt.style.display =
            "none";

    }


    showPrompt(
        pickup
    ) {

        let text =
            "";


        let enabled =
            true;


        /* =================================================
           WEAPON
        ================================================= */

        if (
            pickup.type ===
            "weapon"
        ) {

            text =
                `RECOGER ${this.weaponManager.getWeaponDisplayName(pickup.weaponKey)}`;

        }


        /* =================================================
           AMMO
        ================================================= */

        else if (
            pickup.type ===
            "ammo"
        ) {

            if (
                !this.weaponManager
                    .isWeaponUnlocked(
                        pickup.weaponKey
                    )
            ) {

                text =
                    `REQUIERE ${this.weaponManager.getWeaponDisplayName(pickup.weaponKey)}`;


                enabled =
                    false;

            }

            else if (
                pickup.weaponKey ===
                "smg"
            ) {

                text =
                    `RECOGER MUNICIÓN SMG +${pickup.amount}`;

            }

            else {

                text =
                    `RECOGER CARTUCHOS +${pickup.amount}`;

            }

        }


        /* =================================================
           MEDKIT
        ================================================= */

        else if (
            pickup.type ===
            "medkit"
        ) {

            if (
                !this.playerHealth
                    .canHeal()
            ) {

                text =
                    "SALUD COMPLETA";


                enabled =
                    false;

            }

            else {

                text =
                    `USAR BOTIQUÍN +${pickup.amount} HP`;

            }

        }


        this.prompt.innerHTML = `

            ${
                enabled

                    ?

                    `
                    <span style="
                        color:#ff5750;
                        margin-right:7px;
                    ">
                        E
                    </span>
                    `

                    :

                    ""
            }

            ${text}

        `;


        this.prompt.style.opacity =

            enabled

                ?

                "1"

                :

                "0.55";


        this.prompt.style.display =
            "block";

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
       FLOOR
    ====================================================== */

    sampleFloorAt(

        x,

        z,

        referenceY

    ) {

        this.tempOrigin.set(

            x,

            referenceY +
            PICKUP_CONFIG.rayHeight,

            z

        );


        this.floorRaycaster.set(

            this.tempOrigin,

            this.downDirection

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

            /* =================================================
               SAME FLOOR
            ================================================= */

            if (
                Math.abs(

                    hit.point.y -
                    referenceY

                ) >
                PICKUP_CONFIG.maxFloorDifference
            ) {

                continue;

            }


            /* =================================================
               FLOOR NORMAL
            ================================================= */

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
       DIRECT ACCESS

       Evita que los pickups aparezcan al otro lado
       de una pared grande.
    ====================================================== */

    hasDirectAccess(

        position,

        reference

    ) {

        this.tempOrigin.set(

            reference.x,

            reference.y +
            0.90,

            reference.z

        );


        this.tempTarget.set(

            position.x,

            position.y +
            0.90,

            position.z

        );


        this.tempDirection
            .subVectors(

                this.tempTarget,

                this.tempOrigin

            );


        const distance =
            this.tempDirection.length();


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
       PICKUP SEPARATION
    ====================================================== */

    isSeparatedFromOtherPickups(
        position
    ) {

        for (
            const pickup
            of this.pickups
        ) {

            if (
                pickup.collected
            ) {

                continue;

            }


            const distance =
                Math.hypot(

                    position.x -
                    pickup.root.position.x,

                    position.z -
                    pickup.root.position.z

                );


            if (
                distance <
                2.6
            ) {

                return false;

            }

        }


        return true;

    }


    /* =====================================================
       FIND SAFE POSITION
    ====================================================== */

    findSafePosition(

        reference,

        angleOffset =
            0

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
                i <
                PICKUP_CONFIG.searchSteps;
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

                    reference.x

                    +

                    Math.cos(
                        angle
                    )

                    *

                    radius;


                const z =

                    reference.z

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

                        reference.y

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

                        reference

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
           RELAXED SEARCH
        ================================================= */

        for (
            const radius
            of PICKUP_CONFIG.searchRadii
        ) {

            for (
                let i = 0;
                i <
                PICKUP_CONFIG.searchSteps;
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

                    reference.x

                    +

                    Math.cos(
                        angle
                    )

                    *

                    radius;


                const z =

                    reference.z

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

                        reference.y

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

            "[Pickup] Safe search fallback."

        );


        return reference.clone();

    }


    /* =====================================================
       RING
    ====================================================== */

    createRing(
        color
    ) {

        const ring =
            new THREE.Mesh(

                new THREE.RingGeometry(

                    PICKUP_CONFIG.ringRadius *
                    0.70,

                    PICKUP_CONFIG.ringRadius,

                    24

                ),

                new THREE.MeshBasicMaterial({

                    color,

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


        return ring;

    }


    /* =====================================================
       WEAPON PICKUP
    ====================================================== */

    createWeaponPickup({

        weaponKey,

        position,

        rotationY =
            0

    }) {

        const visual =
            this.weaponManager
                .getPickupVisual(
                    weaponKey
                );


        if (
            !visual
        ) {

            return null;

        }


        const root =
            new THREE.Group();


        root.position.copy(
            position
        );


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


        this.scene.add(
            root
        );


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


        const ring =
            this.createRing(

                weaponKey ===
                "smg"

                    ?

                    0x50b9ff

                    :

                    0xff8b42

            );


        root.add(
            ring
        );


        const pickup = {

            type:
                "weapon",

            weaponKey,

            root,

            visualRoot,

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


        return pickup;

    }


    /* =====================================================
       AMMO VISUAL
    ====================================================== */

    createAmmoVisual(
        weaponKey
    ) {

        const group =
            new THREE.Group();


        const primaryColor =

            weaponKey ===
            "smg"

                ?

                0x238bd9

                :

                0xd96725;


        const box =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.48,
                    0.22,
                    0.34
                ),

                new THREE.MeshStandardMaterial({

                    color:
                        primaryColor,

                    roughness:
                        0.62,

                    metalness:
                        0.25

                })

            );


        box.position.y =
            0.11;


        group.add(
            box
        );


        const lid =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.40,
                    0.035,
                    0.28
                ),

                new THREE.MeshStandardMaterial({

                    color:
                        0x20252b,

                    roughness:
                        0.50,

                    metalness:
                        0.60

                })

            );


        lid.position.y =
            0.235;


        group.add(
            lid
        );


        /* =================================================
           SHOTGUN SHELLS
        ================================================= */

        if (
            weaponKey ===
            "shotgun"
        ) {

            for (
                let i = -1;
                i <= 1;
                i++
            ) {

                const shell =
                    new THREE.Mesh(

                        new THREE.CylinderGeometry(

                            0.025,

                            0.025,

                            0.19,

                            8

                        ),

                        new THREE.MeshStandardMaterial({

                            color:
                                0xc82d28,

                            roughness:
                                0.60

                        })

                    );


                shell.rotation.z =
                    Math.PI /
                    2;


                shell.position.set(

                    i *
                    0.09,

                    0.28,

                    0

                );


                group.add(
                    shell
                );

            }

        }


        group.traverse(

            object => {

                if (
                    object.isMesh
                ) {

                    object.castShadow =
                        false;


                    object.receiveShadow =
                        true;

                }

            }

        );


        return group;

    }


    /* =====================================================
       AMMO PICKUP
    ====================================================== */

    createAmmoPickup({

        weaponKey,

        amount,

        position

    }) {

        const root =
            new THREE.Group();


        root.position.copy(
            position
        );


        const visualRoot =
            this.createAmmoVisual(
                weaponKey
            );


        root.add(
            visualRoot
        );


        const ring =
            this.createRing(

                weaponKey ===
                "smg"

                    ?

                    0x41b6ff

                    :

                    0xff8a40

            );


        root.add(
            ring
        );


        this.scene.add(
            root
        );


        const pickup = {

            type:
                "ammo",

            weaponKey,

            amount,

            root,

            visualRoot,

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


        return pickup;

    }


    /* =====================================================
       MEDKIT VISUAL
    ====================================================== */

    createMedkitVisual() {

        const group =
            new THREE.Group();


        const caseMesh =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.50,
                    0.20,
                    0.38
                ),

                new THREE.MeshStandardMaterial({

                    color:
                        0xf0f2f2,

                    roughness:
                        0.70,

                    metalness:
                        0.05

                })

            );


        caseMesh.position.y =
            0.10;


        group.add(
            caseMesh
        );


        const crossMaterial =
            new THREE.MeshBasicMaterial({

                color:
                    0xd72d2a

            });


        const vertical =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.09,
                    0.025,
                    0.25
                ),

                crossMaterial

            );


        vertical.position.y =
            0.212;


        group.add(
            vertical
        );


        const horizontal =
            new THREE.Mesh(

                new THREE.BoxGeometry(
                    0.24,
                    0.025,
                    0.09
                ),

                crossMaterial

            );


        horizontal.position.y =
            0.213;


        group.add(
            horizontal
        );


        return group;

    }


    /* =====================================================
       MEDKIT
    ====================================================== */

    createMedkitPickup({

        amount =
            PICKUP_CONFIG.medkitHealth,

        position

    }) {

        if (
            this.medkitsSpawned >=
            PICKUP_CONFIG.maxMedkits
        ) {

            return null;

        }


        const root =
            new THREE.Group();


        root.position.copy(
            position
        );


        const visualRoot =
            this.createMedkitVisual();


        root.add(
            visualRoot
        );


        const ring =
            this.createRing(
                0x55ff91
            );


        root.add(
            ring
        );


        this.scene.add(
            root
        );


        const pickup = {

            type:
                "medkit",

            amount,

            root,

            visualRoot,

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


        this.medkitsSpawned++;


        return pickup;

    }


    /* =====================================================
       INITIAL ZONE A PICKUPS
    ====================================================== */

    createZoneAPickups(
        playerSpawn
    ) {

        this.zoneSpawn.copy(
            playerSpawn
        );


        this.medkitsSpawned =
            0;


        this.waveRewardsSpawned.clear();


        /* =================================================
           SMG
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


        /* =================================================
           INITIAL SMG AMMO
        ================================================= */

        const smgAmmoPosition =
            this.findSafePosition(

                playerSpawn,

                Math.PI *
                0.60

            );


        this.createAmmoPickup({

            weaponKey:
                "smg",

            amount:
                PICKUP_CONFIG.smgAmmo,

            position:
                smgAmmoPosition

        });


        /* =================================================
           INITIAL SHOTGUN AMMO
        ================================================= */

        const shotgunAmmoPosition =
            this.findSafePosition(

                playerSpawn,

                Math.PI *
                1.55

            );


        this.createAmmoPickup({

            weaponKey:
                "shotgun",

            amount:
                PICKUP_CONFIG.shotgunAmmo,

            position:
                shotgunAmmoPosition

        });


        /* =================================================
           INITIAL MEDKIT

           Primer botiquín de los dos máximos.
        ================================================= */

        const medkitPosition =
            this.findSafePosition(

                playerSpawn,

                Math.PI *
                0.90

            );


        this.createMedkitPickup({

            amount:
                PICKUP_CONFIG.medkitHealth,

            position:
                medkitPosition

        });


        console.log(

            "[Pickup] Balanced Pre-Alpha layout ONLINE"

        );

    }


    /* =====================================================
       WAVE REWARDS · BALANCED PRE-ALPHA

       OBJETIVO
       -----------------------------------------------------
       - dar más margen con SMG y Shotgun
       - pistola sigue siendo respaldo infinito
       - no llenar el escenario de cajas
       - preparar al jugador para Wave 5 + Boss
       - NO dar suministros después de Wave 5

       Seguimos usando findSafePosition().
       No se modifica el sistema estable de spawns.
    ====================================================== */

    spawnWaveRewards(
        wave
    ) {

        /* =================================================
           PREVENT DUPLICATES
        ================================================= */

        if (
            this.waveRewardsSpawned.has(
                wave
            )
        ) {

            return;

        }


        this.waveRewardsSpawned.add(
            wave
        );


        /* =================================================
           WAVE 5

           SIN RECOMPENSA.

           La Wave 5 conecta directamente al Boss Arena.

           El jugador tendrá que conservar suministros de
           Wave 4 si quiere utilizarlos contra el Boss.
        ================================================= */

        if (
            wave >=
            5
        ) {

            console.log(

                "[Pickup] Wave 5 clear · sin suministros antes del Boss."

            );


            return;

        }


        /* =================================================
           CURRENT PLAYER POSITION
        ================================================= */

        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerPosition
            );


        const base =
            this.playerPosition.clone();


        /* =================================================
           WAVE 1

           Caja SMG garantizada.
        ================================================= */

        if (
            wave ===
            1
        ) {

            this.createAmmoPickup({

                weaponKey:
                    "smg",

                amount:
                    PICKUP_CONFIG.smgAmmo,

                position:
                    this.findSafePosition(

                        base,

                        0.35

                    )

            });


            this.emitMessage(

                `SUMINISTROS · MUNICIÓN SMG +${PICKUP_CONFIG.smgAmmo}`

            );


            return;

        }


        /* =================================================
           WAVE 2

           Shotgun garantizada.

           Además:
           55% de posibilidad de una caja SMG pequeña.

           La partida NO depende de RNG porque el pickup
           principal siempre aparece.
        ================================================= */

        if (
            wave ===
            2
        ) {

            this.createAmmoPickup({

                weaponKey:
                    "shotgun",

                amount:
                    PICKUP_CONFIG.shotgunAmmo,

                position:
                    this.findSafePosition(

                        base,

                        1.30

                    )

            });


            const bonusSMG =
                Math.random() <
                PICKUP_CONFIG.wave2BonusChance;


            if (
                bonusSMG
            ) {

                this.createAmmoPickup({

                    weaponKey:
                        "smg",

                    amount:
                        PICKUP_CONFIG.wave2BonusSmgAmmo,

                    position:
                        this.findSafePosition(

                            base,

                            3.25

                        )

                });


                this.emitMessage(

                    "SUMINISTROS · CARTUCHOS + APOYO SMG"

                );

            }

            else {

                this.emitMessage(

                    `SUMINISTROS · CARTUCHOS +${PICKUP_CONFIG.shotgunAmmo}`

                );

            }


            return;

        }


        /* =================================================
           WAVE 3

           Punto medio.

           Ambas armas reciben munición garantizada.
        ================================================= */

        if (
            wave ===
            3
        ) {

            this.createAmmoPickup({

                weaponKey:
                    "smg",

                amount:
                    PICKUP_CONFIG.wave3SmgAmmo,

                position:
                    this.findSafePosition(

                        base,

                        0.55

                    )

            });


            this.createAmmoPickup({

                weaponKey:
                    "shotgun",

                amount:
                    PICKUP_CONFIG.wave3ShotgunAmmo,

                position:
                    this.findSafePosition(

                        base,

                        2.50

                    )

            });


            this.emitMessage(

                "REABASTECIMIENTO · SMG + SHOTGUN"

            );


            return;

        }


        /* =================================================
           WAVE 4

           ÚLTIMO REABASTECIMIENTO.

           Aquí damos suficiente para:
           - Wave 5
           - conservar algo para Boss

           Segundo y último botiquín.
        ================================================= */

        if (
            wave ===
            4
        ) {

            /* =============================================
               SMG
            ============================================= */

            this.createAmmoPickup({

                weaponKey:
                    "smg",

                amount:
                    PICKUP_CONFIG.wave4SmgAmmo,

                position:
                    this.findSafePosition(

                        base,

                        0.20

                    )

            });


            /* =============================================
               SHOTGUN
            ============================================= */

            this.createAmmoPickup({

                weaponKey:
                    "shotgun",

                amount:
                    PICKUP_CONFIG.wave4ShotgunAmmo,

                position:
                    this.findSafePosition(

                        base,

                        2.30

                    )

            });


            /* =============================================
               FINAL MEDKIT
            ============================================= */

            this.createMedkitPickup({

                amount:
                    PICKUP_CONFIG.medkitHealth,

                position:
                    this.findSafePosition(

                        base,

                        4.25

                    )

            });


            this.emitMessage(

                "REABASTECIMIENTO FINAL · PREPÁRATE"

            );


            return;

        }

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


        /* =================================================
           WEAPON
        ================================================= */

        if (
            pickup.type ===
            "weapon"
        ) {

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


            const name =
                this.weaponManager
                    .getWeaponDisplayName(
                        pickup.weaponKey
                    );


            this.removePickup(
                pickup
            );


            this.emitMessage(

                `${name} ADQUIRIDA · RUEDA PARA CAMBIAR`

            );


            return true;

        }


        /* =================================================
           AMMO
        ================================================= */

        if (
            pickup.type ===
            "ammo"
        ) {

            /*
             * No se puede recoger munición de un arma
             * todavía bloqueada.
             */
            if (
                !this.weaponManager
                    .isWeaponUnlocked(
                        pickup.weaponKey
                    )
            ) {

                return false;

            }


            const success =
                this.weaponManager
                    .addReserveAmmo(

                        pickup.weaponKey,

                        pickup.amount

                    );


            if (
                !success
            ) {

                return false;

            }


            const text =

                pickup.weaponKey ===
                "smg"

                    ?

                    `MUNICIÓN SMG +${pickup.amount}`

                    :

                    `CARTUCHOS SHOTGUN +${pickup.amount}`;


            this.removePickup(
                pickup
            );


            this.emitMessage(
                text
            );


            return true;

        }


        /* =================================================
           MEDKIT
        ================================================= */

        if (
            pickup.type ===
            "medkit"
        ) {

            const healed =
                this.playerHealth
                    .heal(
                        pickup.amount
                    );


            if (
                healed <=
                0
            ) {

                return false;

            }


            this.removePickup(
                pickup
            );


            this.emitMessage(

                `SALUD +${Math.round(healed)} HP`

            );


            return true;

        }


        return false;

    }


    /* =====================================================
       REMOVE
    ====================================================== */

    removePickup(
        pickup
    ) {

        pickup.collected =
            true;


        this.scene.remove(
            pickup.root
        );


        this.closestPickup =
            null;


        this.hidePrompt();

    }


    /* =====================================================
       MESSAGE
    ====================================================== */

    emitMessage(
        message
    ) {

        if (
            typeof this.onPickup ===
            "function"
        ) {

            this.onPickup({

                message

            });

        }

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
               VISUAL PULSE
            ================================================= */

            pickup.pulseTime +=

                deltaTime *
                2.1;


            pickup.ring
                .material
                .opacity =

                0.28

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

                0.25;


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
/* =========================================================
   NOVA CATALYST
   Physical Objects Manager

   Build v0.6.1
========================================================= */

import * as THREE from "three";


const OBJECT_CONFIG = {

    metalCrate: {

        size:
            0.88,

        density:
            1.45

    },

    cardboardBox: {

        size:
            0.76,

        density:
            0.45

    },

    barrel: {

        radius:
            0.34,

        height:
            1.15,

        density:
            1.35

    },

    cylinder: {

        radius:
            0.40,

        height:
            1.10,

        density:
            1.65

    },

    energyCore: {

        radius:
            0.34,

        density:
            0.70

    },

    barricade: {

        boxSize:
            0.80,

        spacing:
            0.84

    }

};


export class ObjectManager {


    constructor(
        scene,
        physicsManager
    ) {

        this.scene =
            scene;


        this.physicsManager =
            physicsManager;


        this.dynamicObjects =
            [];


        this.zoneAObjectsCreated =
            false;


        this.environmentMeshes =
            [];


        this.environmentBox =
            new THREE.Box3();



        /* =================================================
           TEXTURES
        ================================================= */

        this.textures = {

            cardboard:
                this.createCardboardTexture(),

            metal:
                this.createMetalTexture(),

            darkMetal:
                this.createDarkMetalTexture(),

            industrialRed:
                this.createIndustrialRedTexture(),

            cardboardLabel:
                this.createCardboardLabelTexture()

        };



        /* =================================================
           MATERIALS
        ================================================= */

        this.materials = {

            metalCrate:

                new THREE.MeshStandardMaterial({

                    map:
                        this.textures.metal,

                    color:
                        0x6f777c,

                    roughness:
                        0.46,

                    metalness:
                        0.78

                }),


            metalFrame:

                new THREE.MeshStandardMaterial({

                    map:
                        this.textures.darkMetal,

                    color:
                        0x252a2e,

                    roughness:
                        0.32,

                    metalness:
                        0.92

                }),


            cardboard:

                new THREE.MeshStandardMaterial({

                    map:
                        this.textures.cardboard,

                    color:
                        0xc19a68,

                    roughness:
                        0.92,

                    metalness:
                        0

                }),


            cardboardTape:

                new THREE.MeshStandardMaterial({

                    color:
                        0xd7b77c,

                    roughness:
                        0.72,

                    metalness:
                        0

                }),


            label:

                new THREE.MeshBasicMaterial({

                    map:
                        this.textures.cardboardLabel,

                    transparent:
                        true,

                    side:
                        THREE.DoubleSide

                }),


            barrel:

                new THREE.MeshStandardMaterial({

                    map:
                        this.textures.industrialRed,

                    color:
                        0xb81616,

                    roughness:
                        0.38,

                    metalness:
                        0.72

                }),


            barrelBands:

                new THREE.MeshStandardMaterial({

                    map:
                        this.textures.darkMetal,

                    color:
                        0x16191b,

                    roughness:
                        0.28,

                    metalness:
                        0.94

                }),


            cylinder:

                new THREE.MeshStandardMaterial({

                    map:
                        this.textures.darkMetal,

                    color:
                        0x43525d,

                    roughness:
                        0.32,

                    metalness:
                        0.88

                }),


            cylinderAccent:

                new THREE.MeshStandardMaterial({

                    color:
                        0x768b98,

                    roughness:
                        0.28,

                    metalness:
                        0.92

                }),


            energyCore:

                new THREE.MeshStandardMaterial({

                    color:
                        0x75eaff,

                    emissive:
                        0x087a96,

                    emissiveIntensity:
                        4,

                    roughness:
                        0.18,

                    metalness:
                        0.32

                })

        };

    }


    /* =====================================================
       CANVAS TEXTURE
    ====================================================== */

    createCanvasTexture(

        width,

        height,

        drawFunction

    ) {

        const canvas =
            document.createElement(
                "canvas"
            );


        canvas.width =
            width;


        canvas.height =
            height;


        const context =
            canvas.getContext(
                "2d"
            );


        drawFunction(

            context,

            width,

            height

        );


        const texture =

            new THREE.CanvasTexture(
                canvas
            );


        texture.colorSpace =
            THREE.SRGBColorSpace;


        texture.wrapS =
            THREE.RepeatWrapping;


        texture.wrapT =
            THREE.RepeatWrapping;


        texture.anisotropy =
            4;


        return texture;

    }


    /* =====================================================
       CARDBOARD
    ====================================================== */

    createCardboardTexture() {

        return this.createCanvasTexture(

            512,

            512,

            (
                ctx,
                width,
                height
            ) => {

                ctx.fillStyle =
                    "#a77a49";


                ctx.fillRect(

                    0,
                    0,
                    width,
                    height

                );


                for (
                    let i = 0;
                    i < 900;
                    i++
                ) {

                    const value =

                        105 +
                        Math.random() *
                        45;


                    ctx.fillStyle =

                        `rgba(${value}, ${value * 0.77}, ${value * 0.48}, 0.12)`;


                    ctx.fillRect(

                        Math.random() *
                        width,

                        Math.random() *
                        height,

                        1 +
                        Math.random() *
                        4,

                        1

                    );

                }


                ctx.strokeStyle =
                    "rgba(80,45,20,0.08)";


                for (
                    let y = 0;
                    y < height;
                    y += 12
                ) {

                    ctx.beginPath();

                    ctx.moveTo(
                        0,
                        y
                    );

                    ctx.lineTo(

                        width,

                        y +
                        Math.sin(y) * 2

                    );

                    ctx.stroke();

                }

            }

        );

    }


    /* =====================================================
       METAL
    ====================================================== */

    createMetalTexture() {

        return this.createCanvasTexture(

            512,

            512,

            (
                ctx,
                width,
                height
            ) => {

                const gradient =

                    ctx.createLinearGradient(

                        0,
                        0,
                        width,
                        height

                    );


                gradient.addColorStop(
                    0,
                    "#7a8287"
                );


                gradient.addColorStop(
                    0.5,
                    "#4f585d"
                );


                gradient.addColorStop(
                    1,
                    "#737b80"
                );


                ctx.fillStyle =
                    gradient;


                ctx.fillRect(

                    0,
                    0,
                    width,
                    height

                );


                for (
                    let i = 0;
                    i < 180;
                    i++
                ) {

                    const x =
                        Math.random() *
                        width;


                    const y =
                        Math.random() *
                        height;


                    const length =

                        10 +
                        Math.random() *
                        90;


                    ctx.strokeStyle =

                        Math.random() > 0.5

                            ?

                            "rgba(255,255,255,0.08)"

                            :

                            "rgba(0,0,0,0.11)";


                    ctx.beginPath();

                    ctx.moveTo(
                        x,
                        y
                    );

                    ctx.lineTo(

                        x + length,

                        y +
                        Math.random() * 3

                    );

                    ctx.stroke();

                }


                ctx.strokeStyle =
                    "rgba(20,24,27,0.34)";


                ctx.lineWidth =
                    8;


                ctx.strokeRect(

                    25,
                    25,
                    width - 50,
                    height - 50

                );

            }

        );

    }


    /* =====================================================
       DARK METAL
    ====================================================== */

    createDarkMetalTexture() {

        return this.createCanvasTexture(

            256,

            256,

            (
                ctx,
                width,
                height
            ) => {

                ctx.fillStyle =
                    "#20272b";


                ctx.fillRect(

                    0,
                    0,
                    width,
                    height

                );


                for (
                    let i = 0;
                    i < 90;
                    i++
                ) {

                    const y =
                        Math.random() *
                        height;


                    ctx.strokeStyle =
                        "rgba(210,230,240,0.07)";


                    ctx.beginPath();

                    ctx.moveTo(

                        Math.random() *
                        width,

                        y

                    );

                    ctx.lineTo(

                        Math.random() *
                        width,

                        y

                    );

                    ctx.stroke();

                }

            }

        );

    }


    /* =====================================================
       INDUSTRIAL RED
    ====================================================== */

    createIndustrialRedTexture() {

        return this.createCanvasTexture(

            512,

            256,

            (
                ctx,
                width,
                height
            ) => {

                const gradient =

                    ctx.createLinearGradient(

                        0,
                        0,
                        width,
                        0

                    );


                gradient.addColorStop(
                    0,
                    "#771010"
                );


                gradient.addColorStop(
                    0.25,
                    "#ca2424"
                );


                gradient.addColorStop(
                    0.5,
                    "#e22b25"
                );


                gradient.addColorStop(
                    0.75,
                    "#a71616"
                );


                gradient.addColorStop(
                    1,
                    "#651010"
                );


                ctx.fillStyle =
                    gradient;


                ctx.fillRect(

                    0,
                    0,
                    width,
                    height

                );


                for (
                    let i = 0;
                    i < 150;
                    i++
                ) {

                    ctx.fillStyle =

                        Math.random() > 0.5

                            ?

                            "rgba(20,20,20,0.13)"

                            :

                            "rgba(255,190,150,0.07)";


                    ctx.fillRect(

                        Math.random() *
                        width,

                        Math.random() *
                        height,

                        1 +
                        Math.random() * 14,

                        1 +
                        Math.random() * 3

                    );

                }


                ctx.fillStyle =
                    "rgba(15,15,15,0.72)";


                ctx.fillRect(

                    185,
                    80,
                    145,
                    88

                );


                ctx.fillStyle =
                    "#efdb72";


                ctx.textAlign =
                    "center";


                ctx.font =
                    "bold 27px Arial";


                ctx.fillText(

                    "NOVA",

                    257,
                    115

                );


                ctx.font =
                    "bold 18px Arial";


                ctx.fillText(

                    "HAZARD",

                    257,
                    143

                );

            }

        );

    }


    /* =====================================================
       LABEL
    ====================================================== */

    createCardboardLabelTexture() {

        return this.createCanvasTexture(

            512,

            256,

            (
                ctx,
                width,
                height
            ) => {

                ctx.clearRect(

                    0,
                    0,
                    width,
                    height

                );


                ctx.fillStyle =
                    "rgba(230,222,194,0.96)";


                ctx.fillRect(

                    40,
                    35,
                    432,
                    186

                );


                ctx.strokeStyle =
                    "#393329";


                ctx.lineWidth =
                    7;


                ctx.strokeRect(

                    40,
                    35,
                    432,
                    186

                );


                ctx.fillStyle =
                    "#28231d";


                ctx.textAlign =
                    "center";


                ctx.font =
                    "bold 44px Arial";


                ctx.fillText(

                    "NOVA SUPPLY",

                    width / 2,
                    95

                );


                ctx.font =
                    "bold 25px Arial";


                ctx.fillText(

                    "ZONE A",

                    width / 2,
                    138

                );


                ctx.font =
                    "20px Arial";


                ctx.fillText(

                    "HANDLE WITH CARE",

                    width / 2,
                    183

                );

            }

        );

    }


    /* =====================================================
       SHADOW HELPER
    ====================================================== */

    setupMesh(
        mesh
    ) {

        mesh.castShadow =
            true;


        mesh.receiveShadow =
            true;


        return mesh;

    }


    /* =====================================================
       GROUND QUERY
    ====================================================== */

    prepareGroundQuery(
        environment
    ) {

        this.environmentMeshes = [];


        environment.updateMatrixWorld(
            true
        );


        environment.traverse(

            object => {

                if (
                    object.isMesh &&
                    object.visible
                ) {

                    this.environmentMeshes.push(
                        object
                    );

                }

            }

        );


        this.environmentBox
            .setFromObject(
                environment
            );

    }


    polarPoint(
        radius,
        angle
    ) {

        return {

            x:
                Math.cos(angle) *
                radius,

            z:
                Math.sin(angle) *
                radius

        };

    }


    findGroundY(

        x,

        z,

        referenceFloorY

    ) {

        const raycaster =

            new THREE.Raycaster(

                new THREE.Vector3(

                    x,

                    this.environmentBox.max.y +
                    15,

                    z

                ),

                new THREE.Vector3(

                    0,
                    -1,
                    0

                )

            );


        const intersections =

            raycaster.intersectObjects(

                this.environmentMeshes,

                true

            );


        if (
            intersections.length === 0
        ) {

            return referenceFloorY;

        }


        let bestY =
            referenceFloorY;


        let bestDistance =
            Infinity;


        for (
            const hit
            of intersections
        ) {

            const distance =

                Math.abs(

                    hit.point.y -
                    referenceFloorY

                );


            if (
                distance <
                bestDistance
            ) {

                bestDistance =
                    distance;


                bestY =
                    hit.point.y;

            }

        }


        return bestY;

    }


    /* =====================================================
       REGISTER
    ====================================================== */

    registerDynamicObject(

        mesh,

        rigidBody,

        type

    ) {

        mesh.userData.objectType =
            type;


        mesh.userData.rigidBody =
            rigidBody;


        this.dynamicObjects.push({

            mesh,
            rigidBody,
            type

        });

    }


    /* =====================================================
       METAL CRATE
    ====================================================== */

    createMetalCrate(

        position,

        size =
            OBJECT_CONFIG
                .metalCrate
                .size,

        rotationY = 0

    ) {

        const group =
            new THREE.Group();


        group.position.copy(
            position
        );


        group.rotation.y =
            rotationY;


        const bodyMesh =

            this.setupMesh(

                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        size * 0.91,
                        size * 0.91,
                        size * 0.91

                    ),

                    this.materials
                        .metalCrate

                )

            );


        group.add(
            bodyMesh
        );


        const frameThickness =
            size * 0.065;


        const frameDepth =
            size * 0.055;


        const frameHeight =
            size * 1.02;


        const cornerPositions = [

            [
                -size * 0.46,
                -size * 0.46
            ],

            [
                size * 0.46,
                -size * 0.46
            ],

            [
                -size * 0.46,
                size * 0.46
            ],

            [
                size * 0.46,
                size * 0.46
            ]

        ];


        for (
            const [
                x,
                z
            ]
            of cornerPositions
        ) {

            const bar =

                this.setupMesh(

                    new THREE.Mesh(

                        new THREE.BoxGeometry(

                            frameThickness,
                            frameHeight,
                            frameDepth

                        ),

                        this.materials
                            .metalFrame

                    )

                );


            bar.position.set(

                x,
                0,
                z

            );


            group.add(
                bar
            );

        }


        this.scene.add(
            group
        );


        const rigidBody =

            this.physicsManager
                .createDynamicBox({

                    position,

                    size: {

                        x: size,
                        y: size,
                        z: size

                    },

                    rotationY,

                    density:
                        OBJECT_CONFIG
                            .metalCrate
                            .density,

                    friction:
                        0.82,

                    restitution:
                        0.07

                });


        this.registerDynamicObject(

            group,

            rigidBody,

            "metal-crate"

        );


        return group;

    }


    /* =====================================================
       CARDBOARD BOX
    ====================================================== */

    createCardboardBox(

        position,

        size =
            OBJECT_CONFIG
                .cardboardBox
                .size,

        rotationY = 0

    ) {

        const group =
            new THREE.Group();


        group.position.copy(
            position
        );


        group.rotation.y =
            rotationY;


        const box =

            this.setupMesh(

                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        size,
                        size,
                        size

                    ),

                    this.materials
                        .cardboard

                )

            );


        group.add(
            box
        );


        const tape =

            this.setupMesh(

                new THREE.Mesh(

                    new THREE.BoxGeometry(

                        size * 0.19,
                        size * 1.015,
                        size * 1.015

                    ),

                    this.materials
                        .cardboardTape

                )

            );


        group.add(
            tape
        );


        const label =

            new THREE.Mesh(

                new THREE.PlaneGeometry(

                    size * 0.58,
                    size * 0.30

                ),

                this.materials
                    .label

            );


        label.position.set(

            0,

            -size * 0.08,

            size * 0.505

        );


        group.add(
            label
        );


        this.scene.add(
            group
        );


        const rigidBody =

            this.physicsManager
                .createDynamicBox({

                    position,

                    size: {

                        x: size,
                        y: size,
                        z: size

                    },

                    rotationY,

                    density:
                        OBJECT_CONFIG
                            .cardboardBox
                            .density,

                    friction:
                        0.72,

                    restitution:
                        0.16

                });


        this.registerDynamicObject(

            group,

            rigidBody,

            "cardboard-box"

        );


        return group;

    }


    /* =====================================================
       INDUSTRIAL BARREL
    ====================================================== */

    createBarrel(
        position
    ) {

        const radius =
            OBJECT_CONFIG
                .barrel
                .radius;


        const height =
            OBJECT_CONFIG
                .barrel
                .height;


        const group =
            new THREE.Group();


        group.position.copy(
            position
        );


        const bodyMesh =

            this.setupMesh(

                new THREE.Mesh(

                    new THREE.CylinderGeometry(

                        radius,
                        radius,
                        height,
                        28

                    ),

                    this.materials
                        .barrel

                )

            );


        group.add(
            bodyMesh
        );


        const bandGeometry =

            new THREE.TorusGeometry(

                radius * 1.015,

                0.035,

                8,

                28

            );


        for (
            const y
            of [
                height * 0.33,
                -height * 0.33
            ]
        ) {

            const band =

                this.setupMesh(

                    new THREE.Mesh(

                        bandGeometry,

                        this.materials
                            .barrelBands

                    )

                );


            band.rotation.x =
                Math.PI / 2;


            band.position.y =
                y;


            group.add(
                band
            );

        }


        this.scene.add(
            group
        );


        const rigidBody =

            this.physicsManager
                .createDynamicCylinder({

                    position,

                    radius,

                    height,

                    density:
                        OBJECT_CONFIG
                            .barrel
                            .density,

                    friction:
                        0.72,

                    restitution:
                        0.16

                });


        this.registerDynamicObject(

            group,

            rigidBody,

            "industrial-barrel"

        );


        return group;

    }


    /* =====================================================
       INDUSTRIAL CYLINDER
    ====================================================== */

    createCylinder(
        position
    ) {

        const radius =
            OBJECT_CONFIG
                .cylinder
                .radius;


        const height =
            OBJECT_CONFIG
                .cylinder
                .height;


        const group =
            new THREE.Group();


        group.position.copy(
            position
        );


        const bodyMesh =

            this.setupMesh(

                new THREE.Mesh(

                    new THREE.CylinderGeometry(

                        radius * 0.92,
                        radius,
                        height,
                        22

                    ),

                    this.materials
                        .cylinder

                )

            );


        group.add(
            bodyMesh
        );


        const ringGeometry =

            new THREE.TorusGeometry(

                radius,

                0.025,

                8,

                22

            );


        for (
            const y
            of [
                height * 0.38,
                -height * 0.38
            ]
        ) {

            const ring =

                this.setupMesh(

                    new THREE.Mesh(

                        ringGeometry,

                        this.materials
                            .cylinderAccent

                    )

                );


            ring.rotation.x =
                Math.PI / 2;


            ring.position.y =
                y;


            group.add(
                ring
            );

        }


        this.scene.add(
            group
        );


        const rigidBody =

            this.physicsManager
                .createDynamicCylinder({

                    position,

                    radius,

                    height,

                    density:
                        OBJECT_CONFIG
                            .cylinder
                            .density,

                    friction:
                        0.80,

                    restitution:
                        0.05

                });


        this.registerDynamicObject(

            group,

            rigidBody,

            "industrial-cylinder"

        );


        return group;

    }


    /* =====================================================
       ENERGY CORE
    ====================================================== */

    createEnergyCore(
        position
    ) {

        const radius =
            OBJECT_CONFIG
                .energyCore
                .radius;


        const group =
            new THREE.Group();


        group.position.copy(
            position
        );


        const sphere =

            this.setupMesh(

                new THREE.Mesh(

                    new THREE.SphereGeometry(

                        radius,
                        24,
                        18

                    ),

                    this.materials
                        .energyCore

                )

            );


        group.add(
            sphere
        );


        const outerRing =

            new THREE.Mesh(

                new THREE.TorusGeometry(

                    radius * 1.28,

                    0.028,

                    8,

                    26

                ),

                new THREE.MeshBasicMaterial({

                    color:
                        0xc6f9ff

                })

            );


        outerRing.rotation.x =
            Math.PI / 2;


        group.add(
            outerRing
        );


        const light =

            new THREE.PointLight(

                0x67e7ff,

                3.5,

                2.2,

                2

            );


        group.add(
            light
        );


        this.scene.add(
            group
        );


        const rigidBody =

            this.physicsManager
                .createDynamicBall({

                    position,

                    radius,

                    density:
                        OBJECT_CONFIG
                            .energyCore
                            .density,

                    friction:
                        0.32,

                    restitution:
                        0.58

                });


        this.registerDynamicObject(

            group,

            rigidBody,

            "energy-core"

        );


        return group;

    }


    /* =====================================================
       POLAR CREATION
    ====================================================== */

    createAtPolarPosition(

        type,

        radius,

        angle,

        floorReference

    ) {

        const point =

            this.polarPoint(

                radius,
                angle

            );


        const groundY =

            this.findGroundY(

                point.x,
                point.z,
                floorReference

            );


        switch (type) {

            case "metal": {

                const size =
                    OBJECT_CONFIG
                        .metalCrate
                        .size;


                return this.createMetalCrate(

                    new THREE.Vector3(

                        point.x,

                        groundY +
                        size / 2 +
                        0.035,

                        point.z

                    ),

                    size,

                    angle +
                    Math.PI / 2

                );

            }


            case "cardboard": {

                const size =
                    OBJECT_CONFIG
                        .cardboardBox
                        .size;


                return this.createCardboardBox(

                    new THREE.Vector3(

                        point.x,

                        groundY +
                        size / 2 +
                        0.035,

                        point.z

                    ),

                    size,

                    angle +
                    Math.PI / 2

                );

            }


            case "barrel":

                return this.createBarrel(

                    new THREE.Vector3(

                        point.x,

                        groundY +
                        OBJECT_CONFIG
                            .barrel
                            .height / 2 +
                        0.035,

                        point.z

                    )

                );


            case "cylinder":

                return this.createCylinder(

                    new THREE.Vector3(

                        point.x,

                        groundY +
                        OBJECT_CONFIG
                            .cylinder
                            .height / 2 +
                        0.035,

                        point.z

                    )

                );


            case "core":

                return this.createEnergyCore(

                    new THREE.Vector3(

                        point.x,

                        groundY +
                        OBJECT_CONFIG
                            .energyCore
                            .radius +
                        0.035,

                        point.z

                    )

                );

        }

    }


    /* =====================================================
       BARRICADE
    ====================================================== */

    createBarricade(

        floorReference,

        radius,

        angle

    ) {

        const size =
            OBJECT_CONFIG
                .barricade
                .boxSize;


        const spacing =
            OBJECT_CONFIG
                .barricade
                .spacing;


        const center =

            this.polarPoint(

                radius,
                angle

            );


        const groundY =

            this.findGroundY(

                center.x,
                center.z,
                floorReference

            );


        const tangent =

            new THREE.Vector3(

                -Math.sin(angle),

                0,

                Math.cos(angle)

            );


        for (
            let i = -1;
            i <= 1;
            i++
        ) {

            this.createMetalCrate(

                new THREE.Vector3(

                    center.x +
                    tangent.x *
                    i *
                    spacing,

                    groundY +
                    size / 2 +
                    0.03,

                    center.z +
                    tangent.z *
                    i *
                    spacing

                ),

                size,

                angle +
                Math.PI / 2

            );

        }


        for (
            let i = 0;
            i < 2;
            i++
        ) {

            const offset =

                (
                    i -
                    0.5
                ) *
                spacing;


            this.createMetalCrate(

                new THREE.Vector3(

                    center.x +
                    tangent.x *
                    offset,

                    groundY +
                    size * 1.5 +
                    0.06,

                    center.z +
                    tangent.z *
                    offset

                ),

                size,

                angle +
                Math.PI / 2

            );

        }


        this.createMetalCrate(

            new THREE.Vector3(

                center.x,

                groundY +
                size * 2.5 +
                0.09,

                center.z

            ),

            size,

            angle +
            Math.PI / 2

        );

    }


    /* =====================================================
       ZONE A POPULATION
    ====================================================== */

    createZoneAObjects(

        environment,

        playerSpawn

    ) {

        if (
            this.zoneAObjectsCreated
        ) {

            return;

        }


        this.prepareGroundQuery(
            environment
        );


        const floorY =
            playerSpawn.y;


        const placements = [

            { type: "cardboard", radius: 15.4, angle: 0.72 },
            { type: "barrel", radius: 17.0, angle: 0.94 },

            { type: "metal", radius: 16.4, angle: 1.30 },
            { type: "cylinder", radius: 15.2, angle: 1.55 },
            { type: "cardboard", radius: 17.1, angle: 1.86 },

            { type: "barrel", radius: 15.6, angle: 2.18 },
            { type: "metal", radius: 17.0, angle: 2.48 },
            { type: "core", radius: 15.5, angle: 2.78 },

            { type: "cardboard", radius: 16.8, angle: 3.10 },
            { type: "barrel", radius: 15.3, angle: 3.42 },
            { type: "cylinder", radius: 17.0, angle: 3.70 },

            { type: "metal", radius: 15.5, angle: 4.02 },
            { type: "barrel", radius: 17.1, angle: 4.34 },
            { type: "cardboard", radius: 16.0, angle: 4.62 },
            { type: "core", radius: 17.0, angle: 4.90 },

            { type: "cylinder", radius: 15.4, angle: 5.18 },
            { type: "metal", radius: 16.8, angle: 5.46 },
            { type: "barrel", radius: 15.5, angle: 5.72 }

        ];


        for (
            const placement
            of placements
        ) {

            this.createAtPolarPosition(

                placement.type,

                placement.radius,

                placement.angle,

                floorY

            );

        }


        this.createBarricade(

            floorY,

            16.0,

            3.92

        );


        this.zoneAObjectsCreated =
            true;


        console.log(

            "[Objects] Zona A poblada:",

            this.dynamicObjects.length

        );

    }


    /* =====================================================
       DESTROY OBJECT

       Elimina:
       - objeto Three.js
       - geometrías
       - rigid body Rapier
       - registro dinámico
    ====================================================== */

    removeDynamicObjectByBody(
        rigidBody
    ) {

        const index =

            this.dynamicObjects
                .findIndex(

                    object =>

                        object.rigidBody ===
                        rigidBody

                );


        if (
            index === -1
        ) {

            return false;

        }


        const object =

            this.dynamicObjects[
                index
            ];


        /* =================================================
           THREE.JS
        ================================================= */

        if (
            object.mesh.parent
        ) {

            object.mesh.parent.remove(
                object.mesh
            );

        }


        /*
         * No eliminamos materiales porque
         * son compartidos por otros props.
         *
         * Sí liberamos geometrías únicas.
         */

        const geometries =
            new Set();


        object.mesh.traverse(

            child => {

                if (
                    child.geometry
                ) {

                    geometries.add(
                        child.geometry
                    );

                }

            }

        );


        for (
            const geometry
            of geometries
        ) {

            geometry.dispose();

        }


        /* =================================================
           RAPIER
        ================================================= */

        this.physicsManager
            .removeRigidBody(

                rigidBody

            );


        /* =================================================
           ARRAY
        ================================================= */

        this.dynamicObjects.splice(

            index,
            1

        );


        console.log(

            `[Objects] ${object.type} eliminado.`

        );


        return true;

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update() {

        for (
            const object
            of this.dynamicObjects
        ) {

            const position =

                object.rigidBody
                    .translation();


            const rotation =

                object.rigidBody
                    .rotation();


            object.mesh.position.set(

                position.x,
                position.y,
                position.z

            );


            object.mesh.quaternion.set(

                rotation.x,
                rotation.y,
                rotation.z,
                rotation.w

            );

        }

    }


    /* =====================================================
       GETTERS
    ====================================================== */

    getDynamicObjects() {

        return this.dynamicObjects;

    }

}
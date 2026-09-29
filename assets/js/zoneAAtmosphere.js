/* =========================================================
   NOVA CATALYST
   Zone A Atmosphere

   Build v0.26.0 · AFTERMATH VISIBLE

   ---------------------------------------------------------
   - Sirena roja doble
   - Barrido rojo visible sobre el piso
   - Luz roja ambiental moderada
   - Sangre visible en piso
   - Salpicaduras de sangre en paredes
   - Rastros de arrastre
   - Marcas de explosión
   - Restos metálicos
   - Sin texturas externas
   - Sin luces con sombras
   - Bajo impacto de rendimiento
========================================================= */

import * as THREE from "three";


/* =========================================================
   CONFIG
========================================================= */

const CONFIG = {

    /* =====================================================
       SIREN
    ====================================================== */

    sirenUpdateInterval:
        0.075,

    sirenSpeed:
        1.15,

    sirenRadius:
        16,

    sirenHeight:
        6.2,

    sirenMinIntensity:
        70,

    sirenMaxIntensity:
        115,

    sirenDistance:
        58,

    sirenAngle:
        Math.PI / 5.8,


    /* =====================================================
       RED GLOW
    ====================================================== */

    glowMinIntensity:
        6.0,

    glowMaxIntensity:
        11.0,

    glowDistance:
        26,


    /* =====================================================
       SWEEP
    ====================================================== */

    sweepLength:
        13,

    sweepWidth:
        3.8,

    sweepOpacityMin:
        0.045,

    sweepOpacityMax:
        0.11,


    /* =====================================================
       FLOOR
    ====================================================== */

    floorProbeAbove:
        3.8,

    floorProbeDistance:
        8.0,

    maxFloorDifference:
        2.1,


    /* =====================================================
       WALLS
    ====================================================== */

    wallProbeHeight:
        1.15,

    wallProbeDistance:
        5.5,

    wallOffset:
        0.024,


    /* =====================================================
       BLOOD
    ====================================================== */

    bloodHeightOffset:
        0.028,

    scorchHeightOffset:
        0.018,

    debrisHeightOffset:
        0.07
};


/* =========================================================
   ZONE A ATMOSPHERE
========================================================= */

export class ZoneAAtmosphere {

    constructor(
        scene
    ) {

        this.scene =
            scene;


        this.environment =
            null;


        this.environmentMeshes =
            [];


        this.environmentBox =
            new THREE.Box3();


        this.active =
            false;


        this.initialized =
            false;


        /* =================================================
           ROOT
        ================================================= */

        this.root =
            new THREE.Group();


        this.root.name =
            "NovaCatalyst_ZoneA_Atmosphere";


        this.root.visible =
            false;


        this.scene.add(
            this.root
        );


        /* =================================================
           GROUPS
        ================================================= */

        this.bloodGroup =
            new THREE.Group();


        this.bloodGroup.name =
            "ZoneA_Blood";


        this.wallBloodGroup =
            new THREE.Group();


        this.wallBloodGroup.name =
            "ZoneA_WallBlood";


        this.scorchGroup =
            new THREE.Group();


        this.scorchGroup.name =
            "ZoneA_Scorch";


        this.debrisGroup =
            new THREE.Group();


        this.debrisGroup.name =
            "ZoneA_Debris";


        this.root.add(
            this.bloodGroup
        );


        this.root.add(
            this.wallBloodGroup
        );


        this.root.add(
            this.scorchGroup
        );


        this.root.add(
            this.debrisGroup
        );


        /* =================================================
           TEMP
        ================================================= */

        this.down =
            new THREE.Vector3(
                0,
                -1,
                0
            );


        this.localForward =
            new THREE.Vector3(
                0,
                0,
                1
            );


        this.floorOrigin =
            new THREE.Vector3();


        this.floorNormal =
            new THREE.Vector3();


        this.tempNormal =
            new THREE.Vector3();


        this.normalMatrix =
            new THREE.Matrix3();


        this.floorRaycaster =
            new THREE.Raycaster();


        this.wallRaycaster =
            new THREE.Raycaster();


        /* =================================================
           MATERIALS
        ================================================= */

        this.bloodMaterial =
            new THREE.MeshBasicMaterial({

                color:
                    0x8a0805,

                transparent:
                    true,

                opacity:
                    0.92,

                depthWrite:
                    false,

                depthTest:
                    true,

                side:
                    THREE.DoubleSide,

                polygonOffset:
                    true,

                polygonOffsetFactor:
                    -4,

                polygonOffsetUnits:
                    -4
            });


        this.bloodDarkMaterial =
            new THREE.MeshBasicMaterial({

                color:
                    0x3d0202,

                transparent:
                    true,

                opacity:
                    0.90,

                depthWrite:
                    false,

                depthTest:
                    true,

                side:
                    THREE.DoubleSide,

                polygonOffset:
                    true,

                polygonOffsetFactor:
                    -4,

                polygonOffsetUnits:
                    -4
            });


        this.bloodFreshMaterial =
            new THREE.MeshBasicMaterial({

                color:
                    0xb30b07,

                transparent:
                    true,

                opacity:
                    0.86,

                depthWrite:
                    false,

                depthTest:
                    true,

                side:
                    THREE.DoubleSide,

                polygonOffset:
                    true,

                polygonOffsetFactor:
                    -5,

                polygonOffsetUnits:
                    -5
            });


        this.scorchMaterial =
            new THREE.MeshBasicMaterial({

                color:
                    0x020202,

                transparent:
                    true,

                opacity:
                    0.60,

                depthWrite:
                    false,

                depthTest:
                    true,

                side:
                    THREE.DoubleSide,

                polygonOffset:
                    true,

                polygonOffsetFactor:
                    -2,

                polygonOffsetUnits:
                    -2
            });


        /* =================================================
           SIREN
        ================================================= */

        this.sirenAngle =
            0;


        this.sirenUpdateTimer =
            0;


        this.sirenCenter =
            new THREE.Vector3();


        this.sirenTargetA =
            new THREE.Object3D();


        this.sirenTargetB =
            new THREE.Object3D();


        this.sirenTargetA.name =
            "ZoneA_Siren_Target_A";


        this.sirenTargetB.name =
            "ZoneA_Siren_Target_B";


        this.root.add(
            this.sirenTargetA
        );


        this.root.add(
            this.sirenTargetB
        );


        /* =================================================
           TWO ROTATING SPOTLIGHTS

           Sin sombras.
        ================================================= */

        this.sirenLightA =
            new THREE.SpotLight(

                0xff1b10,

                0,

                CONFIG.sirenDistance,

                CONFIG.sirenAngle,

                0.34,

                1.25
            );


        this.sirenLightA.name =
            "ZoneA_Siren_A";


        this.sirenLightA.castShadow =
            false;


        this.sirenLightA.target =
            this.sirenTargetA;


        this.root.add(
            this.sirenLightA
        );


        this.sirenLightB =
            new THREE.SpotLight(

                0xff120b,

                0,

                CONFIG.sirenDistance,

                CONFIG.sirenAngle,

                0.34,

                1.25
            );


        this.sirenLightB.name =
            "ZoneA_Siren_B";


        this.sirenLightB.castShadow =
            false;


        this.sirenLightB.target =
            this.sirenTargetB;


        this.root.add(
            this.sirenLightB
        );


        /* =================================================
           RED GLOW
        ================================================= */

        this.redGlow =
            new THREE.PointLight(

                0xb5140b,

                0,

                CONFIG.glowDistance,

                1.65
            );


        this.redGlow.name =
            "ZoneA_Red_Glow";


        this.redGlow.castShadow =
            false;


        this.root.add(
            this.redGlow
        );


        /* =================================================
           BEACON
        ================================================= */

        const beaconBaseMaterial =
            new THREE.MeshStandardMaterial({

                color:
                    0x181818,

                roughness:
                    0.42,

                metalness:
                    0.72
            });


        const beaconLightMaterial =
            new THREE.MeshBasicMaterial({

                color:
                    0xff2418,

                transparent:
                    true,

                opacity:
                    0.95
            });


        this.beaconBase =
            new THREE.Mesh(

                new THREE.CylinderGeometry(
                    0.25,
                    0.30,
                    0.18,
                    12
                ),

                beaconBaseMaterial

            );


        this.beaconBase.castShadow =
            false;


        this.root.add(
            this.beaconBase
        );


        this.beacon =
            new THREE.Mesh(

                new THREE.CylinderGeometry(
                    0.17,
                    0.20,
                    0.30,
                    12
                ),

                beaconLightMaterial

            );


        this.beacon.castShadow =
            false;


        this.root.add(
            this.beacon
        );


        /* =================================================
           FLOOR SWEEPS

           Esto garantiza que el giro rojo se perciba
           aunque el material GLTF responda poco a luces.
        ================================================= */

        this.sweepGeometry =
            this.createSweepGeometry();


        this.sweepMaterialA =
            new THREE.MeshBasicMaterial({

                color:
                    0xff160d,

                transparent:
                    true,

                opacity:
                    CONFIG.sweepOpacityMin,

                depthWrite:
                    false,

                depthTest:
                    true,

                side:
                    THREE.DoubleSide,

                blending:
                    THREE.AdditiveBlending
            });


        this.sweepMaterialB =
            this.sweepMaterialA.clone();


        this.sweepA =
            new THREE.Mesh(

                this.sweepGeometry,

                this.sweepMaterialA

            );


        this.sweepB =
            new THREE.Mesh(

                this.sweepGeometry,

                this.sweepMaterialB

            );


        this.sweepA.renderOrder =
            3;


        this.sweepB.renderOrder =
            3;


        this.root.add(
            this.sweepA
        );


        this.root.add(
            this.sweepB
        );

    }


    /* =====================================================
       SETUP
    ====================================================== */

    setup(
        environment,
        playerSpawn
    ) {

        if (
            !environment

            ||

            !playerSpawn
        ) {

            return;
        }


        this.environment =
            environment;


        this.environment
            .updateMatrixWorld(
                true
            );


        this.environmentBox
            .setFromObject(
                this.environment
            );


        this.collectEnvironmentMeshes();


        this.clearEvidence();


        /*
         * AQUÍ usamos directamente el Y REAL
         * que utiliza el jugador.
         *
         * Ya NO aplicamos el viejo +4.4.
         */
        this.setupSiren(
            playerSpawn
        );


        const floorBlood =
            this.createBloodEvidence(
                playerSpawn
            );


        const wallBlood =
            this.createWallBloodEvidence(
                playerSpawn
            );


        const scorch =
            this.createScorchEvidence(
                playerSpawn
            );


        const debris =
            this.createDebris(
                playerSpawn
            );


        this.initialized =
            true;


        this.setActive(
            true
        );


        console.log(
            "[Zone A] AFTERMATH ONLINE"
        );


        console.log(
            `[Zone A] Sangre suelo: ${floorBlood}`
        );


        console.log(
            `[Zone A] Sangre paredes: ${wallBlood}`
        );


        console.log(
            `[Zone A] Marcas de explosión: ${scorch}`
        );


        console.log(
            `[Zone A] Restos: ${debris}`
        );

    }


    /* =====================================================
       ENVIRONMENT
    ====================================================== */

    collectEnvironmentMeshes() {

        this.environmentMeshes.length =
            0;


        this.environment.traverse(

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

    }


    /* =====================================================
       FLOOR
    ====================================================== */

    sampleFloor(
        x,
        z,
        referenceY
    ) {

        if (
            this.environmentMeshes.length ===
            0
        ) {

            return null;
        }


        /*
         * Ahora el raycast empieza cerca del jugador,
         * no desde el techo del edificio.
         */
        this.floorOrigin.set(

            x,

            referenceY +
            CONFIG.floorProbeAbove,

            z
        );


        this.floorRaycaster.set(
            this.floorOrigin,
            this.down
        );


        this.floorRaycaster.near =
            0;


        this.floorRaycaster.far =
            CONFIG.floorProbeDistance;


        const hits =
            this.floorRaycaster
                .intersectObjects(
                    this.environmentMeshes,
                    false
                );


        let best =
            null;


        let bestDifference =
            Infinity;


        for (
            const hit
            of hits
        ) {

            if (
                !hit.face
            ) {

                continue;
            }


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


            /*
             * Debe ser piso.
             */
            if (
                this.floorNormal.y <
                0.60
            ) {

                continue;
            }


            const difference =
                Math.abs(
                    hit.point.y -
                    referenceY
                );


            if (
                difference >
                CONFIG.maxFloorDifference
            ) {

                continue;
            }


            if (
                difference <
                bestDifference
            ) {

                bestDifference =
                    difference;


                best =
                    hit.point;
            }

        }


        return best
            ?
            best.clone()
            :
            null;

    }


    /* =====================================================
       SIREN
    ====================================================== */

    setupSiren(
        playerSpawn
    ) {

        /*
         * Bastante cerca para que realmente se vea.
         */
        const desiredX =
            playerSpawn.x -
            5.2;


        const desiredZ =
            playerSpawn.z +
            3.2;


        const floor =
            this.sampleFloor(

                desiredX,

                desiredZ,

                playerSpawn.y
            );


        const baseY =
            floor
                ?
                floor.y
                :
                playerSpawn.y;


        this.sirenCenter.set(
            desiredX,
            baseY,
            desiredZ
        );


        const lightY =
            baseY +
            CONFIG.sirenHeight;


        this.sirenLightA.position.set(
            desiredX,
            lightY,
            desiredZ
        );


        this.sirenLightB.position.set(
            desiredX,
            lightY,
            desiredZ
        );


        this.redGlow.position.set(
            desiredX,
            baseY +
            2.7,
            desiredZ
        );


        this.beaconBase.position.set(
            desiredX,
            lightY,
            desiredZ
        );


        this.beacon.position.set(
            desiredX,
            lightY +
            0.22,
            desiredZ
        );


        this.sweepA.position.set(
            desiredX,
            baseY +
            0.045,
            desiredZ
        );


        this.sweepB.position.set(
            desiredX,
            baseY +
            0.048,
            desiredZ
        );


        this.sirenAngle =
            0;


        this.sirenLightA.intensity =
            CONFIG.sirenMinIntensity;


        this.sirenLightB.intensity =
            CONFIG.sirenMinIntensity *
            0.88;


        this.redGlow.intensity =
            CONFIG.glowMinIntensity;


        this.updateSirenTargets();

    }


    /* =====================================================
       SWEEP GEOMETRY
    ====================================================== */

    createSweepGeometry() {

        const length =
            CONFIG.sweepLength;


        const width =
            CONFIG.sweepWidth;


        const positions =
            new Float32Array([

                0,
                0,
                0,

                length,
                0,
                width,

                length,
                0,
                -width
            ]);


        const geometry =
            new THREE.BufferGeometry();


        geometry.setAttribute(

            "position",

            new THREE.BufferAttribute(
                positions,
                3
            )
        );


        geometry.setIndex([
            0,
            1,
            2
        ]);


        geometry.computeVertexNormals();


        return geometry;

    }


    /* =====================================================
       BLOOD GEOMETRY
    ====================================================== */

    createBloodGeometry(
        variant = 0
    ) {

        const shape =
            new THREE.Shape();


        if (
            variant ===
            1
        ) {

            shape.moveTo(
                -0.90,
                0
            );


            shape.bezierCurveTo(
                -0.72,
                0.54,
                -0.28,
                0.71,
                0.10,
                0.43
            );


            shape.bezierCurveTo(
                0.44,
                0.71,
                0.92,
                0.39,
                0.72,
                0.04
            );


            shape.bezierCurveTo(
                0.95,
                -0.28,
                0.42,
                -0.64,
                0.06,
                -0.46
            );


            shape.bezierCurveTo(
                -0.28,
                -0.68,
                -0.72,
                -0.49,
                -0.90,
                0
            );

        }

        else {

            shape.moveTo(
                -0.78,
                -0.03
            );


            shape.bezierCurveTo(
                -0.68,
                0.42,
                -0.22,
                0.60,
                0.12,
                0.39
            );


            shape.bezierCurveTo(
                0.47,
                0.61,
                0.84,
                0.32,
                0.69,
                0.00
            );


            shape.bezierCurveTo(
                0.87,
                -0.29,
                0.41,
                -0.55,
                0.05,
                -0.40
            );


            shape.bezierCurveTo(
                -0.24,
                -0.57,
                -0.65,
                -0.42,
                -0.78,
                -0.03
            );

        }


        return new THREE.ShapeGeometry(
            shape,
            12
        );

    }


    /* =====================================================
       FLOOR BLOOD
    ====================================================== */

    createBloodPool(
        floor,
        scale,
        rotation = 0,
        material = this.bloodMaterial,
        variant = 0
    ) {

        const mesh =
            new THREE.Mesh(

                this.createBloodGeometry(
                    variant
                ),

                material
            );


        mesh.rotation.x =
            -Math.PI /
            2;


        mesh.rotation.z =
            rotation;


        mesh.scale.set(
            scale,
            scale * 0.72,
            1
        );


        mesh.position.set(
            floor.x,
            floor.y +
            CONFIG.bloodHeightOffset,
            floor.z
        );


        mesh.castShadow =
            false;


        mesh.receiveShadow =
            false;


        mesh.renderOrder =
            10;


        this.bloodGroup.add(
            mesh
        );


        return mesh;

    }


    createBloodDrop(
        floor,
        size,
        stretch = 1
    ) {

        const mesh =
            new THREE.Mesh(

                new THREE.CircleGeometry(
                    size,
                    12
                ),

                this.bloodDarkMaterial

            );


        mesh.rotation.x =
            -Math.PI /
            2;


        mesh.scale.y =
            stretch;


        mesh.position.set(
            floor.x,
            floor.y +
            CONFIG.bloodHeightOffset +
            0.003,
            floor.z
        );


        mesh.renderOrder =
            11;


        this.bloodGroup.add(
            mesh
        );

    }


    /* =====================================================
       FLOOR BLOOD EVIDENCE
    ====================================================== */

    createBloodEvidence(
        spawn
    ) {

        let created =
            0;


        /*
         * Más cerca del recorrido inicial.
         *
         * Ahora es difícil pasar por Zona A
         * sin ver al menos alguna.
         */
        const pools = [

            {
                x:
                    -2.2,

                z:
                    1.6,

                scale:
                    1.35,

                rotation:
                    0.30,

                material:
                    this.bloodFreshMaterial
            },

            {
                x:
                    -5.2,

                z:
                    -1.8,

                scale:
                    1.05,

                rotation:
                    -0.75,

                material:
                    this.bloodMaterial
            },

            {
                x:
                    2.8,

                z:
                    3.5,

                scale:
                    0.95,

                rotation:
                    1.18,

                material:
                    this.bloodDarkMaterial
            },

            {
                x:
                    -7.2,

                z:
                    4.1,

                scale:
                    1.18,

                rotation:
                    0.11,

                material:
                    this.bloodMaterial
            },

            {
                x:
                    4.0,

                z:
                    -2.2,

                scale:
                    0.80,

                rotation:
                    0.66,

                material:
                    this.bloodDarkMaterial
            },

            {
                x:
                    -1.0,

                z:
                    -5.0,

                scale:
                    1.00,

                rotation:
                    -0.35,

                material:
                    this.bloodMaterial
            }
        ];


        for (
            let i = 0;
            i < pools.length;
            i++
        ) {

            const data =
                pools[i];


            const floor =
                this.sampleFloor(

                    spawn.x +
                    data.x,

                    spawn.z +
                    data.z,

                    spawn.y
                );


            if (
                !floor
            ) {

                continue;
            }


            this.createBloodPool(

                floor,

                data.scale,

                data.rotation,

                data.material,

                i %
                2
            );


            created++;

        }


        /* =================================================
           DRAG TRAIL
        ====================================================== */

        const trailX =
            spawn.x -
            3.2;


        const trailZ =
            spawn.z +
            1.0;


        for (
            let i = 0;
            i < 10;
            i++
        ) {

            const floor =
                this.sampleFloor(

                    trailX -
                    i * 0.38,

                    trailZ +
                    i * 0.21,

                    spawn.y
                );


            if (
                !floor
            ) {

                continue;
            }


            this.createBloodDrop(

                floor,

                0.11 +
                (
                    i %
                    4
                ) *
                0.027,

                1.0 +
                (
                    i %
                    3
                ) *
                0.32
            );

        }


        return created;

    }


    /* =====================================================
       FIND WALL
    ====================================================== */

    findNearestWall(
        floorPosition
    ) {

        const origin =
            new THREE.Vector3(

                floorPosition.x,

                floorPosition.y +
                CONFIG.wallProbeHeight,

                floorPosition.z
            );


        const directions = [

            new THREE.Vector3(
                1,
                0,
                0
            ),

            new THREE.Vector3(
                -1,
                0,
                0
            ),

            new THREE.Vector3(
                0,
                0,
                1
            ),

            new THREE.Vector3(
                0,
                0,
                -1
            ),

            new THREE.Vector3(
                0.707,
                0,
                0.707
            ),

            new THREE.Vector3(
                -0.707,
                0,
                0.707
            ),

            new THREE.Vector3(
                0.707,
                0,
                -0.707
            ),

            new THREE.Vector3(
                -0.707,
                0,
                -0.707
            )
        ];


        let nearest =
            null;


        let nearestDistance =
            Infinity;


        for (
            const direction
            of directions
        ) {

            this.wallRaycaster.set(
                origin,
                direction
            );


            this.wallRaycaster.near =
                0.10;


            this.wallRaycaster.far =
                CONFIG.wallProbeDistance;


            const hits =
                this.wallRaycaster
                    .intersectObjects(
                        this.environmentMeshes,
                        false
                    );


            for (
                const hit
                of hits
            ) {

                if (
                    !hit.face
                ) {

                    continue;
                }


                this.normalMatrix
                    .getNormalMatrix(
                        hit.object.matrixWorld
                    );


                this.tempNormal
                    .copy(
                        hit.face.normal
                    )
                    .applyMatrix3(
                        this.normalMatrix
                    )
                    .normalize();


                /*
                 * Solo paredes.
                 */
                if (
                    Math.abs(
                        this.tempNormal.y
                    ) >
                    0.38
                ) {

                    continue;
                }


                if (
                    hit.distance <
                    nearestDistance
                ) {

                    nearestDistance =
                        hit.distance;


                    nearest = {

                        point:
                            hit.point.clone(),

                        normal:
                            this.tempNormal.clone()
                    };

                }


                break;

            }

        }


        return nearest;

    }


    /* =====================================================
       WALL SPLASH
    ====================================================== */

    createWallSplash(
        wall,
        scale = 1,
        rotation = 0
    ) {

        const group =
            new THREE.Group();


        group.position
            .copy(
                wall.point
            )
            .addScaledVector(
                wall.normal,
                CONFIG.wallOffset
            );


        /*
         * ShapeGeometry vive en XY mirando hacia +Z.
         * La orientamos según la normal real de la pared.
         */
        group.quaternion
            .setFromUnitVectors(
                this.localForward,
                wall.normal
            );


        group.rotateZ(
            rotation
        );


        const main =
            new THREE.Mesh(

                this.createBloodGeometry(
                    1
                ),

                this.bloodFreshMaterial

            );


        main.scale.set(
            scale,
            scale * 1.20,
            1
        );


        main.renderOrder =
            12;


        group.add(
            main
        );


        /* =================================================
           DRIPS
        ====================================================== */

        const dripGeometry =
            new THREE.CircleGeometry(
                0.11,
                10
            );


        for (
            let i = 0;
            i < 4;
            i++
        ) {

            const drip =
                new THREE.Mesh(

                    dripGeometry,

                    i %
                    2 ===
                    0

                        ?

                        this.bloodMaterial

                        :

                        this.bloodDarkMaterial
                );


            drip.position.set(

                -0.35 +
                i * 0.22,

                -0.52 -
                i * 0.15,

                0.003
            );


            drip.scale.set(

                0.70 +
                i * 0.10,

                1.5 +
                i * 0.30,

                1

            );


            drip.renderOrder =
                13;


            group.add(
                drip
            );

        }


        this.wallBloodGroup.add(
            group
        );

    }


    /* =====================================================
       WALL BLOOD
    ====================================================== */

    createWallBloodEvidence(
        spawn
    ) {

        let created =
            0;


        const candidates = [

            {
                x:
                    -3.5,

                z:
                    1.8,

                scale:
                    0.72
            },

            {
                x:
                    -6.5,

                z:
                    -1.8,

                scale:
                    0.95
            },

            {
                x:
                    2.8,

                z:
                    2.8,

                scale:
                    0.68
            },

            {
                x:
                    -7.2,

                z:
                    3.9,

                scale:
                    0.80
            },

            {
                x:
                    3.8,

                z:
                    -2.0,

                scale:
                    0.60
            }
        ];


        for (
            let i = 0;
            i < candidates.length;
            i++
        ) {

            const data =
                candidates[i];


            const floor =
                this.sampleFloor(

                    spawn.x +
                    data.x,

                    spawn.z +
                    data.z,

                    spawn.y
                );


            if (
                !floor
            ) {

                continue;
            }


            const wall =
                this.findNearestWall(
                    floor
                );


            if (
                !wall
            ) {

                continue;
            }


            this.createWallSplash(

                wall,

                data.scale,

                (
                    i %
                    2 ===
                    0
                )
                    ?
                    0.18
                    :
                    -0.22

            );


            created++;

        }


        return created;

    }


    /* =====================================================
       SCORCH
    ====================================================== */

    createScorchMark(
        floor,
        sizeX,
        sizeZ,
        rotation
    ) {

        const mesh =
            new THREE.Mesh(

                new THREE.CircleGeometry(
                    1,
                    20
                ),

                this.scorchMaterial

            );


        mesh.rotation.x =
            -Math.PI /
            2;


        mesh.rotation.z =
            rotation;


        mesh.scale.set(
            sizeX,
            sizeZ,
            1
        );


        mesh.position.set(
            floor.x,
            floor.y +
            CONFIG.scorchHeightOffset,
            floor.z
        );


        mesh.renderOrder =
            5;


        this.scorchGroup.add(
            mesh
        );

    }


    createScorchEvidence(
        spawn
    ) {

        let created =
            0;


        const marks = [

            {
                x:
                    -1.0,

                z:
                    -4.3,

                sx:
                    1.55,

                sz:
                    0.90,

                rotation:
                    0.42
            },

            {
                x:
                    -7.0,

                z:
                    2.9,

                sx:
                    1.30,

                sz:
                    1.45,

                rotation:
                    -0.28
            },

            {
                x:
                    3.5,

                z:
                    -2.7,

                sx:
                    1.10,

                sz:
                    1.36,

                rotation:
                    1.08
            }
        ];


        for (
            const mark
            of marks
        ) {

            const floor =
                this.sampleFloor(

                    spawn.x +
                    mark.x,

                    spawn.z +
                    mark.z,

                    spawn.y
                );


            if (
                !floor
            ) {

                continue;
            }


            this.createScorchMark(

                floor,

                mark.sx,

                mark.sz,

                mark.rotation

            );


            created++;

        }


        return created;

    }


    /* =====================================================
       DEBRIS
    ====================================================== */

    createDebris(
        spawn
    ) {

        const geometry =
            new THREE.BoxGeometry(
                0.32,
                0.09,
                0.65
            );


        const material =
            new THREE.MeshStandardMaterial({

                color:
                    0x30383e,

                roughness:
                    0.68,

                metalness:
                    0.58
            });


        const offsets = [

            [-1.7, -4.1],
            [-2.4, -4.5],
            [-0.8, -4.8],

            [-6.2, 2.6],
            [-7.0, 3.2],
            [-7.7, 2.2],

            [3.0, -2.1],
            [3.7, -2.8],

            [-3.8, 1.0],
            [-4.5, 1.5],

            [2.0, 3.8],
            [2.8, 4.2]
        ];


        const valid =
            [];


        for (
            const [
                x,
                z
            ]
            of offsets
        ) {

            const floor =
                this.sampleFloor(

                    spawn.x +
                    x,

                    spawn.z +
                    z,

                    spawn.y
                );


            if (
                floor
            ) {

                valid.push(
                    floor
                );

            }

        }


        if (
            valid.length ===
            0
        ) {

            geometry.dispose();


            material.dispose();


            return 0;
        }


        const debris =
            new THREE.InstancedMesh(

                geometry,

                material,

                valid.length

            );


        debris.name =
            "ZoneA_Destruction_Debris";


        debris.castShadow =
            false;


        debris.receiveShadow =
            true;


        const matrix =
            new THREE.Matrix4();


        const quaternion =
            new THREE.Quaternion();


        const scale =
            new THREE.Vector3();


        const position =
            new THREE.Vector3();


        const euler =
            new THREE.Euler();


        for (
            let i = 0;
            i < valid.length;
            i++
        ) {

            const floor =
                valid[i];


            position.set(

                floor.x,

                floor.y +
                CONFIG.debrisHeightOffset,

                floor.z
            );


            euler.set(

                (
                    i %
                    2
                ) *
                0.10,

                i *
                0.83,

                (
                    i %
                    3 -
                    1
                ) *
                0.11
            );


            quaternion
                .setFromEuler(
                    euler
                );


            scale.set(

                0.80 +
                (
                    i %
                    3
                ) *
                0.20,

                1,

                0.72 +
                (
                    i %
                    4
                ) *
                0.12
            );


            matrix.compose(
                position,
                quaternion,
                scale
            );


            debris.setMatrixAt(
                i,
                matrix
            );

        }


        debris.instanceMatrix.needsUpdate =
            true;


        this.debrisGroup.add(
            debris
        );


        return valid.length;

    }


    /* =====================================================
       CLEAR
    ====================================================== */

    clearEvidence() {

        const groups = [

            this.bloodGroup,

            this.wallBloodGroup,

            this.scorchGroup,

            this.debrisGroup
        ];


        for (
            const group
            of groups
        ) {

            while (
                group.children.length >
                0
            ) {

                const child =
                    group.children[
                        group.children.length -
                        1
                    ];


                group.remove(
                    child
                );

            }

        }

    }


    /* =====================================================
       ENABLE
    ====================================================== */

    setActive(
        active
    ) {

        this.active =
            Boolean(
                active
            );


        this.root.visible =
            this.active;


        if (
            !this.active
        ) {

            this.sirenLightA.intensity =
                0;


            this.sirenLightB.intensity =
                0;


            this.redGlow.intensity =
                0;

        }

    }


    /* =====================================================
       TARGETS
    ====================================================== */

    updateSirenTargets() {

        const angleA =
            this.sirenAngle;


        const angleB =
            this.sirenAngle +
            Math.PI;


        this.sirenTargetA.position.set(

            this.sirenCenter.x +
            Math.cos(
                angleA
            ) *
            CONFIG.sirenRadius,

            this.sirenCenter.y +
            0.65,

            this.sirenCenter.z +
            Math.sin(
                angleA
            ) *
            CONFIG.sirenRadius
        );


        this.sirenTargetB.position.set(

            this.sirenCenter.x +
            Math.cos(
                angleB
            ) *
            CONFIG.sirenRadius,

            this.sirenCenter.y +
            0.65,

            this.sirenCenter.z +
            Math.sin(
                angleB
            ) *
            CONFIG.sirenRadius
        );


        this.sirenTargetA
            .updateMatrixWorld();


        this.sirenTargetB
            .updateMatrixWorld();


        /*
         * Los triángulos están orientados originalmente
         * hacia +X.
         */
        this.sweepA.rotation.y =
            -angleA;


        this.sweepB.rotation.y =
            -angleB;

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update(
        deltaTime,
        elapsedTime
    ) {

        if (
            !this.active

            ||

            !this.initialized
        ) {

            return;
        }


        this.sirenUpdateTimer +=
            deltaTime;


        if (
            this.sirenUpdateTimer <
            CONFIG.sirenUpdateInterval
        ) {

            return;
        }


        const dt =
            this.sirenUpdateTimer;


        this.sirenUpdateTimer =
            0;


        /* =================================================
           ROTATION
        ====================================================== */

        this.sirenAngle +=
            dt *
            CONFIG.sirenSpeed;


        this.updateSirenTargets();


        /* =================================================
           PULSE
        ====================================================== */

        const wave =
            0.5
            +
            Math.sin(
                elapsedTime *
                4.6
            ) *
            0.5;


        const pulse =
            wave *
            wave;


        this.sirenLightA.intensity =
            THREE.MathUtils.lerp(

                CONFIG.sirenMinIntensity,

                CONFIG.sirenMaxIntensity,

                pulse
            );


        this.sirenLightB.intensity =
            THREE.MathUtils.lerp(

                CONFIG.sirenMinIntensity *
                0.78,

                CONFIG.sirenMaxIntensity *
                0.90,

                1 -
                pulse
            );


        this.redGlow.intensity =
            THREE.MathUtils.lerp(

                CONFIG.glowMinIntensity,

                CONFIG.glowMaxIntensity,

                pulse
            );


        /* =================================================
           FLOOR SWEEP
        ====================================================== */

        this.sweepMaterialA.opacity =
            THREE.MathUtils.lerp(

                CONFIG.sweepOpacityMin,

                CONFIG.sweepOpacityMax,

                pulse
            );


        this.sweepMaterialB.opacity =
            THREE.MathUtils.lerp(

                CONFIG.sweepOpacityMin,

                CONFIG.sweepOpacityMax,

                1 -
                pulse
            );


        /* =================================================
           BEACON
        ====================================================== */

        const beaconScale =
            0.94 +
            pulse *
            0.30;


        this.beacon.scale.setScalar(
            beaconScale
        );


        this.beacon.material.opacity =
            0.72 +
            pulse *
            0.26;

    }

}
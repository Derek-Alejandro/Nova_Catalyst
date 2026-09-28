/* =========================================================
   NOVA CATALYST
   Environment Manager

   Build v0.3
   - Zone A stable
   - Boss Arena enlarged
========================================================= */

import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   ENVIRONMENTS
========================================================= */

export const ENVIRONMENTS = {

    ZONE_A: {

        id:
            "zone-a",

        name:
            "NOVA ATLAS · ZONA A",

        path:
            "./assets/models/environment/zone-a/scene.gltf",

        targetSize:
            48

    },


    BOSS_ARENA: {

        id:
            "boss-arena",

        name:
            "NOVA ATLAS · SECTOR CORE",

        path:
            "./assets/models/environment/boss-arena/scene.gltf",

        /*
         * Antes:
         *
         * targetSize: 42
         *
         * Era demasiado pequeña respecto al jugador
         * de 1.8 m y al Boss de 3.25 m.
         *
         * Ahora la hacemos aproximadamente 2x.
         */
        targetSize:
            150

    }

};


/* =========================================================
   ENVIRONMENT MANAGER
========================================================= */

export class EnvironmentManager {

    constructor(
        scene
    ) {

        this.scene =
            scene;


        this.loader =
            new GLTFLoader();


        this.loaded =
            new Map();


        this.activeEnvironment =
            null;

    }


    /* =====================================================
       LOAD
    ====================================================== */

    async loadEnvironment(

        environmentData,

        onProgress = null

    ) {

        /*
         * Reutilizamos ambientes ya cargados.
         */
        if (
            this.loaded.has(
                environmentData.id
            )
        ) {

            return this.loaded.get(
                environmentData.id
            );

        }


        console.log(

            `[Environment] Cargando ${environmentData.name}...`

        );


        const gltf =
            await this.loader.loadAsync(

                environmentData.path,

                event => {

                    if (
                        !onProgress
                    ) {

                        return;

                    }


                    if (
                        event.total >
                        0
                    ) {

                        const percent =

                            (
                                event.loaded /
                                event.total
                            )

                            *

                            100;


                        onProgress(

                            Math.min(

                                100,

                                Math.round(
                                    percent
                                )

                            )

                        );

                    }

                }

            );


        const environment =
            gltf.scene;


        environment.name =
            environmentData.name;


        /* =================================================
           MESH CONFIG
        ================================================= */

        environment.traverse(

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
                    true;


                if (
                    object.material
                ) {

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

            }

        );


        /*
         * Inicia oculto.
         */
        environment.visible =
            false;


        this.scene.add(
            environment
        );


        this.loaded.set(

            environmentData.id,

            environment

        );


        this.printEnvironmentInfo(

            environmentData,

            environment,

            "ORIGINAL"

        );


        return environment;

    }


    /* =====================================================
       NORMALIZE
    ====================================================== */

    normalizeEnvironment(

        environment,

        targetSize

    ) {

        /*
         * Un modelo solo se normaliza una vez.
         */
        if (
            environment.userData
                .novaNormalized
        ) {

            return environment
                .userData
                .novaNormalization;

        }


        environment.updateMatrixWorld(
            true
        );


        /* =================================================
           ORIGINAL BOUNDS
        ================================================= */

        const originalBox =
            new THREE.Box3()
                .setFromObject(
                    environment
                );


        const originalSize =
            new THREE.Vector3();


        originalBox.getSize(
            originalSize
        );


        const horizontalSize =
            Math.max(

                originalSize.x,

                originalSize.z

            );


        if (
            horizontalSize <=
            0
        ) {

            console.warn(

                "[Environment] No se pudo normalizar el escenario."

            );


            return null;

        }


        /* =================================================
           UNIFORM SCALE
        ================================================= */

        const scaleFactor =

            targetSize /
            horizontalSize;


        environment.scale.setScalar(
            scaleFactor
        );


        environment.updateMatrixWorld(
            true
        );


        /* =================================================
           SCALED BOUNDS
        ================================================= */

        const scaledBox =
            new THREE.Box3()
                .setFromObject(
                    environment
                );


        const scaledCenter =
            new THREE.Vector3();


        scaledBox.getCenter(
            scaledCenter
        );


        /* =================================================
           CENTER X/Z + FLOOR Y=0
        ================================================= */

        environment.position.x -=
            scaledCenter.x;


        environment.position.z -=
            scaledCenter.z;


        environment.position.y -=
            scaledBox.min.y;


        environment.updateMatrixWorld(
            true
        );


        /* =================================================
           FINAL BOUNDS
        ================================================= */

        const finalBox =
            new THREE.Box3()
                .setFromObject(
                    environment
                );


        const finalSize =
            new THREE.Vector3();


        const finalCenter =
            new THREE.Vector3();


        finalBox.getSize(
            finalSize
        );


        finalBox.getCenter(
            finalCenter
        );


        const normalizationData = {

            scaleFactor,

            targetSize,

            box:
                finalBox,

            size:
                finalSize,

            center:
                finalCenter

        };


        environment.userData
            .novaNormalized =
            true;


        environment.userData
            .novaNormalization =
            normalizationData;


        console.group(

            `📐 NORMALIZACIÓN · ${environment.name}`

        );


        console.log(

            "Target Size:",

            targetSize

        );


        console.log(

            "Factor de escala:",

            scaleFactor

        );


        console.log(

            "Tamaño final:",

            {

                x:
                    finalSize.x,

                y:
                    finalSize.y,

                z:
                    finalSize.z

            }

        );


        console.log(

            "Centro final:",

            {

                x:
                    finalCenter.x,

                y:
                    finalCenter.y,

                z:
                    finalCenter.z

            }

        );


        console.groupEnd();


        return normalizationData;

    }


    /* =====================================================
       ACTIVATE
    ====================================================== */

    async activateEnvironment(

        environmentData,

        onProgress = null

    ) {

        const environment =
            await this.loadEnvironment(

                environmentData,

                onProgress

            );


        this.normalizeEnvironment(

            environment,

            environmentData.targetSize

        );


        /*
         * Ocultar escenario anterior.
         */
        if (
            this.activeEnvironment

            &&

            this.activeEnvironment !==
            environment
        ) {

            this.activeEnvironment.visible =
                false;

        }


        environment.visible =
            true;


        this.activeEnvironment =
            environment;


        return environment;

    }


    /* =====================================================
       PRELOAD
    ====================================================== */

    async preloadEnvironment(
        environmentData
    ) {

        try {

            await this.loadEnvironment(
                environmentData
            );


            console.log(

                `[Environment] ${environmentData.name} precargado.`

            );

        }

        catch (
            error
        ) {

            console.error(

                `[Environment] Error precargando ${environmentData.name}:`,

                error

            );

        }

    }


    /* =====================================================
       INFO
    ====================================================== */

    printEnvironmentInfo(

        environmentData,

        environment,

        label = "INFO"

    ) {

        environment.updateMatrixWorld(
            true
        );


        const box =
            new THREE.Box3()
                .setFromObject(
                    environment
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


        console.group(

            `🌌 ${environmentData.name} · ${label}`

        );


        console.log(
            "Tamaño:"
        );


        console.log({

            x:
                size.x,

            y:
                size.y,

            z:
                size.z

        });


        console.log(
            "Centro:"
        );


        console.log({

            x:
                center.x,

            y:
                center.y,

            z:
                center.z

        });


        console.log(

            "Bounding Box:",

            box

        );


        console.groupEnd();

    }


    /* =====================================================
       BOUNDING BOX
    ====================================================== */

    getBoundingBox(
        environment
    ) {

        environment.updateMatrixWorld(
            true
        );


        return new THREE.Box3()
            .setFromObject(
                environment
            );

    }


    /* =====================================================
       SIZE
    ====================================================== */

    getSize(
        environment
    ) {

        const box =
            this.getBoundingBox(
                environment
            );


        const size =
            new THREE.Vector3();


        box.getSize(
            size
        );


        return size;

    }

}
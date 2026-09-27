/* =========================================================
   NOVA CATALYST
   Environment Manager

   Build v0.2
========================================================= */


import * as THREE from "three";


import {

    GLTFLoader

} from "three/addons/loaders/GLTFLoader.js";



/* =========================================================
   ESCENARIOS
========================================================= */

export const ENVIRONMENTS = {


    ZONE_A: {

        id:
            "zone-a",

        name:
            "NOVA ATLAS · ZONA A",

        path:
            "./assets/models/environment/zone-a/scene.gltf",

        /*
         * Diámetro aproximado deseado
         * después de normalización.
         */

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

        targetSize:
            42

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
       CARGAR
    ====================================================== */

    async loadEnvironment(

        environmentData,

        onProgress = null

    ) {


        /*
         * Si ya está cargado,
         * reutilizamos el modelo.
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


                (event) => {


                    if (
                        !onProgress
                    ) {

                        return;

                    }


                    /*
                     * Algunos servidores no
                     * proporcionan event.total.
                     */

                    if (
                        event.total > 0
                    ) {

                        const percent =

                            (
                                event.loaded /
                                event.total
                            )

                            * 100;


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
           SOMBRAS / MATERIALES
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



                if (
                    object.material
                ) {


                    /*
                     * Algunos GLTF utilizan
                     * arrays de materiales.
                     */

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



                    materials.forEach(

                        material => {

                            material.needsUpdate =
                                true;

                        }

                    );

                }

            }

        );



        /*
         * Inicialmente oculto.
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



        /*
         * Información original.
         */

        this.printEnvironmentInfo(

            environmentData,

            environment,

            "ORIGINAL"

        );



        return environment;

    }



    /* =====================================================
       NORMALIZAR ESCALA Y POSICIÓN
    ====================================================== */

    normalizeEnvironment(

        environment,

        targetSize

    ) {


        /*
         * No volver a normalizar
         * el mismo modelo.
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
            horizontalSize <= 0
        ) {

            console.warn(

                "[Environment] No se pudo normalizar el escenario."

            );


            return null;

        }



        /*
         * Escala uniforme.
         */

        const scaleFactor =

            targetSize /
            horizontalSize;



        environment.scale.setScalar(
            scaleFactor
        );



        environment.updateMatrixWorld(
            true
        );



        /*
         * Caja después de escalar.
         */

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



        /*
         * Centramos X/Z.
         *
         * El punto más bajo del modelo
         * pasa a Y = 0.
         */

        environment.position.x -=
            scaledCenter.x;


        environment.position.z -=
            scaledCenter.z;


        environment.position.y -=
            scaledBox.min.y;



        environment.updateMatrixWorld(
            true
        );



        /*
         * Caja final.
         */

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
       ACTIVAR ESCENARIO
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



        /*
         * Normalización.
         */

        this.normalizeEnvironment(

            environment,

            environmentData.targetSize

        );



        /*
         * Ocultar escenario anterior.
         */

        if (

            this.activeEnvironment &&

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
       INFORMACIÓN
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
       TAMAÑO
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
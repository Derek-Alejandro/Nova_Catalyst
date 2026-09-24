/* =========================================================
   NOVA CATALYST
   Environment Manager

   Escenarios:
   - Nova Atlas: Zona A
   - Nova Atlas: Boss Arena
========================================================= */

import * as THREE from "three";

import {
    GLTFLoader
} from "three/addons/loaders/GLTFLoader.js";


/* =========================================================
   RUTAS
========================================================= */

export const ENVIRONMENTS = {

    ZONE_A: {
        id: "zone-a",
        name: "NOVA ATLAS · ZONA A",
        path: "./assets/models/environment/zone-a/scene.gltf"
    },

    BOSS_ARENA: {
        id: "boss-arena",
        name: "NOVA ATLAS · SECTOR CORE",
        path: "./assets/models/environment/boss-arena/scene.gltf"
    }

};


/* =========================================================
   MANAGER
========================================================= */

export class EnvironmentManager {

    constructor(scene) {

        this.scene = scene;

        this.loader =
            new GLTFLoader();

        this.loaded =
            new Map();

        this.activeEnvironment =
            null;

    }


    /* =====================================================
       CARGAR MODELO
    ====================================================== */

    async loadEnvironment(

        environmentData,

        onProgress = null

    ) {

        /*
         * Si ya se cargó anteriormente,
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
                            Math.round(percent)
                        );

                    }

                }

            );


        const environment =
            gltf.scene;


        environment.name =
            environmentData.name;


        /* ================================================
           SOMBRAS
        ================================================= */

        environment.traverse(

            (object) => {

                if (
                    object.isMesh
                ) {

                    object.castShadow =
                        true;

                    object.receiveShadow =
                        true;


                    /*
                     * Evita algunos problemas
                     * visuales con materiales glTF.
                     */

                    if (
                        object.material
                    ) {

                        object.material.needsUpdate =
                            true;

                    }

                }

            }

        );


        /*
         * El modelo permanece oculto
         * hasta que se active.
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

            environment

        );


        return environment;

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
         * Ocultar escenario anterior.
         */

        if (
            this.activeEnvironment
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

       Permite cargar Boss Arena
       en segundo plano.
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
       INFORMACIÓN DEL MODELO

       Nos ayudará a conocer las dimensiones
       reales de los modelos de Sketchfab.
    ====================================================== */

    printEnvironmentInfo(

        environmentData,

        environment

    ) {

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
            `🌌 ${environmentData.name}`
        );


        console.log(
            "Tamaño:"
        );


        console.log({

            x: size.x,

            y: size.y,

            z: size.z

        });


        console.log(
            "Centro:"
        );


        console.log({

            x: center.x,

            y: center.y,

            z: center.z

        });


        console.log(
            "Bounding Box:",
            box
        );


        console.groupEnd();

    }


    /* =====================================================
       OBTENER BOUNDING BOX
    ====================================================== */

    getBoundingBox(
        environment
    ) {

        return new THREE.Box3()
            .setFromObject(
                environment
            );

    }

}
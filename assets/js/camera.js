/* =========================================================
   NOVA CATALYST
   Camera Manager

   v0.2:
   Cámara de inspección del escenario.

   v0.3:
   Será sustituida/evolucionada a cámara TPS.
========================================================= */

import * as THREE from "three";

import {
    OrbitControls
} from "three/addons/controls/OrbitControls.js";


export class CameraManager {

    constructor(
        camera,
        renderer
    ) {

        this.camera =
            camera;


        this.renderer =
            renderer;


        this.controls =
            new OrbitControls(

                camera,

                renderer.domElement

            );


        this.controls.enabled =
            false;


        this.controls.enableDamping =
            true;


        this.controls.dampingFactor =
            0.07;


        this.controls.enablePan =
            true;


        this.controls.enableZoom =
            true;


        this.controls.rotateSpeed =
            0.55;


        this.controls.zoomSpeed =
            0.8;


        this.controls.panSpeed =
            0.7;


        this.controls.minDistance =
            1;


        this.controls.maxDistance =
            500;

    }


    /* =====================================================
       ACTIVAR
    ====================================================== */

    enable() {

        this.controls.enabled =
            true;

    }


    /* =====================================================
       DESACTIVAR
    ====================================================== */

    disable() {

        this.controls.enabled =
            false;

    }


    /* =====================================================
       ENCUADRAR MODELO AUTOMÁTICAMENTE
    ====================================================== */

    focusEnvironment(
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


        const maxDimension =
            Math.max(

                size.x,

                size.y,

                size.z

            );


        /*
         * Calculamos automáticamente
         * una distancia adecuada.
         */

        const fov =
            this.camera.fov
            *
            (
                Math.PI / 180
            );


        let distance =

            maxDimension /
            (
                2 *
                Math.tan(
                    fov / 2
                )
            );


        distance *=
            1.35;


        /*
         * Cámara ligeramente elevada.
         */

        this.camera.position.set(

            center.x +
            distance * 0.55,

            center.y +
            distance * 0.40,

            center.z +
            distance * 0.65

        );


        this.camera.near =

            Math.max(

                maxDimension /
                10000,

                0.01

            );


        this.camera.far =

            Math.max(

                maxDimension * 25,

                1000

            );


        this.camera.updateProjectionMatrix();


        /*
         * OrbitControls mira al centro
         * del escenario.
         */

        this.controls.target.copy(
            center
        );


        this.controls.minDistance =

            Math.max(

                maxDimension * 0.02,

                0.5

            );


        this.controls.maxDistance =

            maxDimension * 4;


        this.controls.update();

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update() {

        if (
            this.controls.enabled
        ) {

            this.controls.update();

        }

    }

}
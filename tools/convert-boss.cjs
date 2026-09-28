/* =========================================================
   NOVA CATALYST
   FBX -> GLB BOSS CONVERTER
========================================================= */

const fs = require("fs");
const path = require("path");
const convert = require("fbx2gltf");


/* =========================================================
   PROJECT PATHS
========================================================= */

const PROJECT_ROOT =
    path.resolve(
        __dirname,
        ".."
    );


const SOURCE_FOLDER =
    path.join(
        PROJECT_ROOT,
        "assets",
        "models",
        "boss"
    );


const OUTPUT_FOLDER =
    path.join(
        PROJECT_ROOT,
        "assets",
        "models",
        "boss_glb"
    );


const OUTPUT_ANIMATIONS =
    path.join(
        OUTPUT_FOLDER,
        "animations"
    );


/* =========================================================
   FILES TO CONVERT
========================================================= */

const FILES = [

    {
        name: "Boss",
        source: path.join(
            SOURCE_FOLDER,
            "boss.fbx"
        ),
        output: path.join(
            OUTPUT_FOLDER,
            "boss.glb"
        )
    },

    {
        name: "Idle",
        source: path.join(
            SOURCE_FOLDER,
            "animations",
            "Idle.fbx"
        ),
        output: path.join(
            OUTPUT_ANIMATIONS,
            "Idle.glb"
        )
    },

    {
        name: "Walk",
        source: path.join(
            SOURCE_FOLDER,
            "animations",
            "Walk.fbx"
        ),
        output: path.join(
            OUTPUT_ANIMATIONS,
            "Walk.glb"
        )
    },

    {
        name: "Run",
        source: path.join(
            SOURCE_FOLDER,
            "animations",
            "Run.fbx"
        ),
        output: path.join(
            OUTPUT_ANIMATIONS,
            "Run.glb"
        )
    },

    {
        name: "MeleeAttack",
        source: path.join(
            SOURCE_FOLDER,
            "animations",
            "MeleeAttack.fbx"
        ),
        output: path.join(
            OUTPUT_ANIMATIONS,
            "MeleeAttack.glb"
        )
    },

    {
        name: "CannonCharge",
        source: path.join(
            SOURCE_FOLDER,
            "animations",
            "CannonCharge.fbx"
        ),
        output: path.join(
            OUTPUT_ANIMATIONS,
            "CannonCharge.glb"
        )
    },

    {
        name: "Hit",
        source: path.join(
            SOURCE_FOLDER,
            "animations",
            "Hit.fbx"
        ),
        output: path.join(
            OUTPUT_ANIMATIONS,
            "Hit.glb"
        )
    },

    {
        name: "Death",
        source: path.join(
            SOURCE_FOLDER,
            "animations",
            "Death.fbx"
        ),
        output: path.join(
            OUTPUT_ANIMATIONS,
            "Death.glb"
        )
    }

];


/* =========================================================
   CREATE OUTPUT FOLDERS
========================================================= */

fs.mkdirSync(
    OUTPUT_FOLDER,
    {
        recursive: true
    }
);


fs.mkdirSync(
    OUTPUT_ANIMATIONS,
    {
        recursive: true
    }
);


/* =========================================================
   CONVERT ONE FILE
========================================================= */

async function convertFile(
    file
) {

    console.log();
    console.log(
        `Convirtiendo: ${file.name}`
    );

    console.log(
        `Origen : ${file.source}`
    );

    console.log(
        `Destino: ${file.output}`
    );


    if (
        !fs.existsSync(
            file.source
        )
    ) {

        throw new Error(
            `No existe el archivo: ${file.source}`
        );

    }


    if (
        fs.existsSync(
            file.output
        )
    ) {

        fs.unlinkSync(
            file.output
        );

    }


    await convert(

        file.source,

        file.output,

        [
            "--anim-framerate",
            "bake30",

            "--compute-normals",
            "missing"
        ]

    );


    if (
        !fs.existsSync(
            file.output
        )
    ) {

        throw new Error(
            `No se generó ${file.output}`
        );

    }


    const stats =
        fs.statSync(
            file.output
        );


    console.log(
        `OK · ${(stats.size / 1024 / 1024).toFixed(2)} MB`
    );

}


/* =========================================================
   MAIN
========================================================= */

async function main() {

    console.log();
    console.log(
        "=========================================="
    );

    console.log(
        "NOVA CATALYST"
    );

    console.log(
        "CONVERSIÓN FBX -> GLB"
    );

    console.log(
        "=========================================="
    );


    console.log();
    console.log(
        `Proyecto: ${PROJECT_ROOT}`
    );

    console.log(
        `Origen:   ${SOURCE_FOLDER}`
    );

    console.log(
        `Destino:  ${OUTPUT_FOLDER}`
    );


    let correctos = 0;
    let fallidos = 0;


    for (
        const file
        of FILES
    ) {

        try {

            await convertFile(
                file
            );

            correctos++;

        }

        catch (
            error
        ) {

            fallidos++;

            console.error();
            console.error(
                `ERROR EN ${file.name}`
            );

            console.error(
                error.message
            );

        }

    }


    console.log();
    console.log(
        "=========================================="
    );

    console.log(
        "RESULTADO"
    );

    console.log(
        "=========================================="
    );

    console.log(
        `Correctos: ${correctos}`
    );

    console.log(
        `Fallidos : ${fallidos}`
    );


    if (
        fallidos === 0
    ) {

        console.log();
        console.log(
            "BOSS CONVERTIDO CORRECTAMENTE."
        );

    }

}


/* =========================================================
   RUN
========================================================= */

main().catch(
    error => {

        console.error(
            "ERROR FATAL:"
        );

        console.error(
            error
        );

        process.exitCode = 1;

    }
);
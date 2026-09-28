/* =========================================================
   NOVA CATALYST
   Barrel Combat Bridge
   Build v0.11.2

   Conecta la explosión existente de WeaponManager
   con el sistema de vida de los infectados.

   weapons.js NO necesita modificarse.
========================================================= */

export function installBarrelEnemyDamage({

    weaponManager,

    enemyManager,

    radius = 5.5,

    maxDamage = 120,

    minDamage = 25

}) {

    if (
        !weaponManager
        ||
        !enemyManager
        ||
        typeof weaponManager.explodeBarrel !== "function"
    ) {

        console.warn(
            "[BarrelCombatBridge] No se pudo instalar."
        );

        return false;

    }


    /* =====================================================
       EVITAR INSTALACIÓN DOBLE
    ====================================================== */

    if (
        weaponManager.__novaBarrelEnemyDamageInstalled
    ) {

        return true;

    }


    const originalExplodeBarrel =
        weaponManager.explodeBarrel.bind(
            weaponManager
        );


    /* =====================================================
       WRAPPER
    ====================================================== */

    weaponManager.explodeBarrel =
        barrel => {

            if (
                !barrel?.rigidBody
            ) {

                return originalExplodeBarrel(
                    barrel
                );

            }


            /* =================================================
               EVITAR DAÑO DOBLE
            ================================================= */

            if (
                weaponManager.explodedBodies?.has(
                    barrel.rigidBody
                )
            ) {

                return originalExplodeBarrel(
                    barrel
                );

            }


            /* =================================================
               CENTRO DE EXPLOSIÓN
            ================================================= */

            const translation =
                barrel.rigidBody.translation();


            const centerX =
                translation.x;


            const centerY =
                translation.y;


            const centerZ =
                translation.z;


            /* =================================================
               ENEMIGOS
            ================================================= */

            const enemies =

                typeof enemyManager.getAliveEnemies === "function"

                    ?

                    enemyManager.getAliveEnemies()

                    :

                    [];


            for (
                const enemy
                of enemies
            ) {

                if (
                    enemy.isDead?.()
                    ||
                    enemy.isSpawning?.()
                ) {

                    continue;

                }


                const position =
                    enemy
                        .getObject()
                        .position;


                /*
                 * +0.9 para aproximarnos al centro
                 * del cuerpo y no medir desde los pies.
                 */
                const dx =
                    position.x -
                    centerX;


                const dy =
                    position.y +
                    0.9 -
                    centerY;


                const dz =
                    position.z -
                    centerZ;


                const distance =
                    Math.sqrt(

                        dx * dx
                        +
                        dy * dy
                        +
                        dz * dz

                    );


                if (
                    distance >
                    radius
                ) {

                    continue;

                }


                /* =================================================
                   FALLOFF

                   Cerca:
                   mucho daño.

                   Lejos:
                   menos daño.
                ================================================= */

                const falloff =
                    Math.max(

                        0,

                        Math.min(

                            1,

                            1 -
                            distance /
                            radius

                        )

                    );


                const damage =
                    Math.round(

                        minDamage

                        +

                        (
                            maxDamage -
                            minDamage
                        )

                        *

                        falloff

                    );


                enemy.takeDamage(
                    damage
                );


                console.log(

                    `[Explosion] Infectado: -${damage} HP · ${distance.toFixed(2)} m`

                );

            }


            /* =================================================
               EJECUTAR EXPLOSIÓN ORIGINAL

               Conserva:
               - partículas
               - fuerza
               - objetos volando
               - eliminación del barril
            ================================================= */

            const result =
                originalExplodeBarrel(
                    barrel
                );


            /*
             * Actualizamos blancos porque alguna
             * explosión pudo matar infectados.
             */
            weaponManager
                .refreshEnemyTargets
                ?.();


            return result;

        };


    weaponManager.__novaBarrelEnemyDamageInstalled =
        true;


    console.log(
        "[BarrelCombatBridge] BARRIL -> ENEMIGOS ONLINE"
    );


    return true;

}
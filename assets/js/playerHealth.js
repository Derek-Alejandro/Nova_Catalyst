/* =========================================================
   NOVA CATALYST
   Player Health Manager

   Build v0.14.1

   ---------------------------------------------------------
   - 100 HP
   - Damage
   - Invulnerability
   - Red damage vignette
   - Healing
   - Medkits
   - Game Over
   - Retry / Flee

   FIX v0.14.1:
   - Health HUD hidden while in main menu
   - HUD appears only after gameplay starts
========================================================= */

export class PlayerHealthManager {

    constructor({

        maxHealth = 100,

        invulnerabilityTime = 0.30,

        onDamage = null,

        onDeath = null,

        onRetry = null,

        onFlee = null

    } = {}) {

        this.maxHealth =
            maxHealth;


        this.health =
            maxHealth;


        this.invulnerabilityTime =
            invulnerabilityTime;


        this.invulnerabilityTimer =
            0;


        this.damageFlashTimer =
            0;


        this.healFlashTimer =
            0;


        this.enabled =
            true;


        /*
         * IMPORTANTE:
         *
         * Antes comenzaba en true.
         * Eso hacía visible el HUD desde el menú.
         */
        this.visible =
            false;


        this.dead =
            false;


        this.onDamage =
            onDamage;


        this.onDeath =
            onDeath;


        this.onRetry =
            onRetry;


        this.onFlee =
            onFlee;


        this.createHUD();


        this.createDamageOverlay();


        this.createHealOverlay();


        this.createGameOver();


        this.updateHUD();


        /*
         * Aseguramos que permanezca oculto
         * mientras estamos en el menú.
         */
        this.setVisible(
            false
        );

    }


    /* =====================================================
       HUD
    ====================================================== */

    createHUD() {

        this.hud =
            document.getElementById(
                "nova-health-hud"
            );


        if (
            !this.hud
        ) {

            this.hud =
                document.createElement(
                    "div"
                );


            this.hud.id =
                "nova-health-hud";


            Object.assign(

                this.hud.style,

                {

                    position:
                        "fixed",

                    left:
                        "26px",

                    bottom:
                        "26px",

                    width:
                        "215px",

                    padding:
                        "10px 13px",

                    background:
                        "rgba(0,0,0,.55)",

                    border:
                        "1px solid rgba(255,255,255,.12)",

                    backdropFilter:
                        "blur(6px)",

                    color:
                        "#fff",

                    fontFamily:
                        "Orbitron, Consolas, monospace",

                    zIndex:
                        "500",

                    pointerEvents:
                        "none",

                    /*
                     * Oculto desde su creación.
                     */
                    display:
                        "none"

                }

            );


            document.body.appendChild(
                this.hud
            );

        }


        this.hud.innerHTML = `

            <div style="
                display:flex;
                justify-content:space-between;
                align-items:center;
                margin-bottom:6px;
            ">

                <span style="
                    opacity:.60;
                    font-size:8px;
                    letter-spacing:1.3px;
                ">
                    INTEGRIDAD
                </span>

                <strong
                    id="nova-health-value"
                    style="
                        font-size:11px;
                    "
                >
                    100 HP
                </strong>

            </div>

            <div style="
                width:100%;
                height:7px;
                border-radius:4px;
                overflow:hidden;
                background:rgba(255,255,255,.10);
            ">

                <div
                    id="nova-health-bar"
                    style="
                        width:100%;
                        height:100%;
                        background:linear-gradient(
                            90deg,
                            #d82b27,
                            #ff6960
                        );
                        transition:width .15s ease-out;
                    "
                ></div>

            </div>

        `;


        this.healthValue =
            this.hud.querySelector(
                "#nova-health-value"
            );


        this.healthBar =
            this.hud.querySelector(
                "#nova-health-bar"
            );

    }


    /* =====================================================
       DAMAGE VIGNETTE
    ====================================================== */

    createDamageOverlay() {

        this.damageOverlay =
            document.getElementById(
                "nova-damage-overlay"
            );


        if (
            this.damageOverlay
        ) {

            this.damageOverlay.style.opacity =
                "0";


            return;

        }


        this.damageOverlay =
            document.createElement(
                "div"
            );


        this.damageOverlay.id =
            "nova-damage-overlay";


        Object.assign(

            this.damageOverlay.style,

            {

                position:
                    "fixed",

                inset:
                    "0",

                pointerEvents:
                    "none",

                zIndex:
                    "850",

                opacity:
                    "0",

                background:
                    "radial-gradient(circle at center, transparent 35%, rgba(190,0,0,.35) 75%, rgba(255,0,0,.58) 100%)",

                transition:
                    "opacity .05s linear"

            }

        );


        document.body.appendChild(
            this.damageOverlay
        );

    }


    /* =====================================================
       HEAL EFFECT
    ====================================================== */

    createHealOverlay() {

        this.healOverlay =
            document.getElementById(
                "nova-heal-overlay"
            );


        if (
            this.healOverlay
        ) {

            this.healOverlay.style.opacity =
                "0";


            return;

        }


        this.healOverlay =
            document.createElement(
                "div"
            );


        this.healOverlay.id =
            "nova-heal-overlay";


        Object.assign(

            this.healOverlay.style,

            {

                position:
                    "fixed",

                inset:
                    "0",

                pointerEvents:
                    "none",

                zIndex:
                    "849",

                opacity:
                    "0",

                background:
                    "radial-gradient(circle at center, rgba(40,255,125,.05), transparent 58%, rgba(40,255,125,.22) 100%)",

                transition:
                    "opacity .08s linear"

            }

        );


        document.body.appendChild(
            this.healOverlay
        );

    }


    /* =====================================================
       GAME OVER
    ====================================================== */

    createGameOver() {

        this.gameOver =
            document.getElementById(
                "nova-game-over"
            );


        if (
            this.gameOver
        ) {

            this.gameOver.style.display =
                "none";


            return;

        }


        this.gameOver =
            document.createElement(
                "div"
            );


        this.gameOver.id =
            "nova-game-over";


        Object.assign(

            this.gameOver.style,

            {

                position:
                    "fixed",

                inset:
                    "0",

                display:
                    "none",

                alignItems:
                    "center",

                justifyContent:
                    "center",

                background:
                    "rgba(0,0,0,.80)",

                backdropFilter:
                    "blur(7px)",

                zIndex:
                    "5000"

            }

        );


        const panel =
            document.createElement(
                "div"
            );


        Object.assign(

            panel.style,

            {

                width:
                    "min(420px, calc(100vw - 36px))",

                padding:
                    "30px",

                textAlign:
                    "center",

                background:
                    "rgba(7,10,14,.96)",

                border:
                    "1px solid rgba(255,70,60,.35)",

                boxShadow:
                    "0 0 45px rgba(200,0,0,.20)",

                color:
                    "#fff",

                fontFamily:
                    "Orbitron, Consolas, monospace"

            }

        );


        panel.innerHTML = `

            <div style="
                color:#e43b35;
                font-size:10px;
                letter-spacing:4px;
                margin-bottom:7px;
            ">
                NOVA CATALYST
            </div>

            <h1 style="
                margin:0 0 8px;
                font-size:30px;
            ">
                GAME OVER
            </h1>

            <p style="
                opacity:.55;
                font-size:10px;
                line-height:1.7;
                margin-bottom:22px;
            ">
                SIGNOS VITALES PERDIDOS
            </p>

            <div style="
                display:flex;
                gap:10px;
                justify-content:center;
            ">

                <button
                    id="nova-retry"
                    style="
                        cursor:pointer;
                        padding:10px 18px;
                        border:1px solid #d9342f;
                        background:#d9342f;
                        color:white;
                        font-family:inherit;
                        font-size:9px;
                    "
                >
                    RETRY
                </button>

                <button
                    id="nova-flee"
                    style="
                        cursor:pointer;
                        padding:10px 18px;
                        border:1px solid rgba(255,255,255,.20);
                        background:transparent;
                        color:white;
                        font-family:inherit;
                        font-size:9px;
                    "
                >
                    FLEE
                </button>

            </div>

        `;


        this.gameOver.appendChild(
            panel
        );


        document.body.appendChild(
            this.gameOver
        );


        panel
            .querySelector(
                "#nova-retry"
            )
            ?.addEventListener(

                "click",

                () => {

                    this.onRetry?.();

                }

            );


        panel
            .querySelector(
                "#nova-flee"
            )
            ?.addEventListener(

                "click",

                () => {

                    this.onFlee?.();

                }

            );

    }


    /* =====================================================
       DAMAGE
    ====================================================== */

    takeDamage(

        amount,

        context = null

    ) {

        if (
            !this.enabled

            ||

            this.dead

            ||

            this.invulnerabilityTimer >
            0
        ) {

            return false;

        }


        const damage =
            Math.max(

                0,

                Number(
                    amount
                )
                ||
                0

            );


        if (
            damage <=
            0
        ) {

            return false;

        }


        this.health =
            Math.max(

                0,

                this.health -
                damage

            );


        this.invulnerabilityTimer =
            this.invulnerabilityTime;


        this.damageFlashTimer =
            0.28;


        this.updateHUD();


        this.onDamage?.({

            amount:
                damage,

            health:
                this.health,

            source:
                context?.source

        });


        if (
            this.health <=
            0
        ) {

            this.dead =
                true;


            this.onDeath?.();

        }


        return true;

    }


    /* =====================================================
       HEAL
    ====================================================== */

    heal(
        amount
    ) {

        if (
            !this.enabled

            ||

            this.dead

            ||

            this.health >=
            this.maxHealth
        ) {

            return 0;

        }


        const requested =
            Math.max(

                0,

                Number(
                    amount
                )
                ||
                0

            );


        if (
            requested <=
            0
        ) {

            return 0;

        }


        const before =
            this.health;


        this.health =
            Math.min(

                this.maxHealth,

                this.health +
                requested

            );


        const restored =
            this.health -
            before;


        if (
            restored >
            0
        ) {

            this.healFlashTimer =
                0.40;


            this.updateHUD();

        }


        return restored;

    }


    canHeal() {

        return (

            this.enabled

            &&

            !this.dead

            &&

            this.health <
            this.maxHealth

        );

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update(
        deltaTime
    ) {

        this.invulnerabilityTimer =
            Math.max(

                0,

                this.invulnerabilityTimer -
                deltaTime

            );


        this.damageFlashTimer =
            Math.max(

                0,

                this.damageFlashTimer -
                deltaTime

            );


        this.healFlashTimer =
            Math.max(

                0,

                this.healFlashTimer -
                deltaTime

            );


        if (
            this.damageOverlay
        ) {

            const opacity =

                this.damageFlashTimer >
                0

                    ?

                    Math.min(

                        1,

                        this.damageFlashTimer /
                        0.20

                    )

                    :

                    0;


            this.damageOverlay.style.opacity =
                `${opacity}`;

        }


        if (
            this.healOverlay
        ) {

            const opacity =

                this.healFlashTimer >
                0

                    ?

                    Math.min(

                        0.7,

                        this.healFlashTimer /
                        0.40

                    )

                    :

                    0;


            this.healOverlay.style.opacity =
                `${opacity}`;

        }

    }


    /* =====================================================
       RESET
    ====================================================== */

    reset() {

        this.health =
            this.maxHealth;


        this.dead =
            false;


        this.enabled =
            true;


        this.invulnerabilityTimer =
            0;


        this.damageFlashTimer =
            0;


        this.healFlashTimer =
            0;


        if (
            this.damageOverlay
        ) {

            this.damageOverlay.style.opacity =
                "0";

        }


        if (
            this.healOverlay
        ) {

            this.healOverlay.style.opacity =
                "0";

        }


        this.hideGameOver();


        this.updateHUD();

    }


    /* =====================================================
       HUD UPDATE
    ====================================================== */

    updateHUD() {

        const percentage =

            this.maxHealth >
            0

                ?

                (
                    this.health /
                    this.maxHealth
                )
                *
                100

                :

                0;


        if (
            this.healthValue
        ) {

            this.healthValue.textContent =
                `${Math.ceil(this.health)} HP`;

        }


        if (
            this.healthBar
        ) {

            this.healthBar.style.width =
                `${percentage}%`;

        }

    }


    /* =====================================================
       VISIBILITY
    ====================================================== */

    setVisible(
        visible
    ) {

        this.visible =
            Boolean(
                visible
            );


        if (
            this.hud
        ) {

            this.hud.style.display =

                this.visible

                    ?

                    "block"

                    :

                    "none";

        }

    }


    setEnabled(
        enabled
    ) {

        this.enabled =
            enabled;

    }


    showGameOver() {

        if (
            this.gameOver
        ) {

            this.gameOver.style.display =
                "flex";

        }

    }


    hideGameOver() {

        if (
            this.gameOver
        ) {

            this.gameOver.style.display =
                "none";

        }

    }


    getHealth() {

        return this.health;

    }


    getMaxHealth() {

        return this.maxHealth;

    }


    isDead() {

        return this.dead;

    }

}
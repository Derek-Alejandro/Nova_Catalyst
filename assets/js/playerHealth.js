/* =========================================================
   NOVA CATALYST
   Player Health Manager
   Build v0.10.1

   - 100 HP
   - Damage feedback
   - Invulnerability window
   - Health HUD
   - Healing support
   - Hit callback
   - Death callback
   - Game Over
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


        this.enabled =
            true;


        this.dead =
            false;


        this.visible =
            false;


        /* =================================================
           CALLBACKS
        ================================================= */

        this.onDamage =
            onDamage;


        this.onDeath =
            onDeath;


        this.onRetry =
            onRetry;


        this.onFlee =
            onFlee;


        /* =================================================
           EFFECTS
        ================================================= */

        this.damageFlashTimer =
            0;


        this.damageFlashDuration =
            0.24;


        this.lowHealthPulse =
            0;


        /* =================================================
           UI
        ================================================= */

        this.createHUD();

        this.createDamageOverlay();

        this.createGameOverScreen();

        this.updateHUD();

        this.setVisible(
            false
        );

    }


    /* =====================================================
       HUD
    ====================================================== */

    createHUD() {

        this.hud =
            document.createElement(
                "div"
            );


        this.hud.id =
            "nova-player-health";


        Object.assign(

            this.hud.style,

            {

                position:
                    "fixed",

                left:
                    "24px",

                bottom:
                    "26px",

                width:
                    "220px",

                padding:
                    "11px 13px",

                zIndex:
                    "700",

                pointerEvents:
                    "none",

                userSelect:
                    "none",

                border:
                    "1px solid rgba(255,255,255,.13)",

                borderRadius:
                    "5px",

                background:
                    "rgba(0,0,0,.58)",

                backdropFilter:
                    "blur(7px)",

                boxShadow:
                    "0 4px 18px rgba(0,0,0,.28)",

                fontFamily:
                    "Orbitron, Consolas, monospace",

                color:
                    "#ffffff",

                transition:
                    "opacity .2s ease"

            }

        );


        this.header =
            document.createElement(
                "div"
            );


        Object.assign(

            this.header.style,

            {

                display:
                    "flex",

                justifyContent:
                    "space-between",

                alignItems:
                    "center",

                marginBottom:
                    "7px"

            }

        );


        this.title =
            document.createElement(
                "span"
            );


        this.title.textContent =
            "VITALS";


        Object.assign(

            this.title.style,

            {

                fontSize:
                    "8px",

                letterSpacing:
                    "1.6px",

                opacity:
                    "0.55"

            }

        );


        this.healthText =
            document.createElement(
                "span"
            );


        Object.assign(

            this.healthText.style,

            {

                fontSize:
                    "11px",

                fontWeight:
                    "700",

                letterSpacing:
                    "1px"

            }

        );


        this.header.append(

            this.title,

            this.healthText

        );


        this.barBackground =
            document.createElement(
                "div"
            );


        Object.assign(

            this.barBackground.style,

            {

                width:
                    "100%",

                height:
                    "9px",

                background:
                    "rgba(255,255,255,.09)",

                border:
                    "1px solid rgba(255,255,255,.10)",

                borderRadius:
                    "2px",

                overflow:
                    "hidden",

                boxShadow:
                    "inset 0 0 5px rgba(0,0,0,.5)"

            }

        );


        this.bar =
            document.createElement(
                "div"
            );


        Object.assign(

            this.bar.style,

            {

                width:
                    "100%",

                height:
                    "100%",

                transformOrigin:
                    "left center",

                background:
                    "linear-gradient(90deg,#31d17c,#73ff9e)",

                transition:
                    "width .18s ease, background .18s ease"

            }

        );


        this.barBackground.appendChild(
            this.bar
        );


        this.status =
            document.createElement(
                "div"
            );


        Object.assign(

            this.status.style,

            {

                marginTop:
                    "6px",

                fontSize:
                    "7px",

                letterSpacing:
                    "1.25px",

                opacity:
                    "0.45"

            }

        );


        this.status.textContent =
            "ESTADO · ESTABLE";


        this.hud.append(

            this.header,

            this.barBackground,

            this.status

        );


        document.body.appendChild(
            this.hud
        );

    }


    /* =====================================================
       DAMAGE OVERLAY
    ====================================================== */

    createDamageOverlay() {

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

                zIndex:
                    "650",

                pointerEvents:
                    "none",

                opacity:
                    "0",

                background:
                    "radial-gradient(circle at center, transparent 38%, rgba(160,0,0,.32) 70%, rgba(255,0,0,.62) 100%)",

                transition:
                    "opacity .06s linear"

            }

        );


        document.body.appendChild(
            this.damageOverlay
        );

    }


    /* =====================================================
       GAME OVER SCREEN
    ====================================================== */

    createGameOverScreen() {

        this.gameOverScreen =
            document.createElement(
                "div"
            );


        Object.assign(

            this.gameOverScreen.style,

            {

                position:
                    "fixed",

                inset:
                    "0",

                zIndex:
                    "100000",

                display:
                    "none",

                alignItems:
                    "center",

                justifyContent:
                    "center",

                background:
                    "radial-gradient(circle at center, rgba(25,0,0,.42), rgba(0,0,0,.93))",

                backdropFilter:
                    "blur(4px)",

                fontFamily:
                    "Orbitron, Consolas, monospace"

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
                    "min(440px, calc(100vw - 40px))",

                padding:
                    "34px 30px",

                textAlign:
                    "center",

                border:
                    "1px solid rgba(255,70,60,.30)",

                borderRadius:
                    "8px",

                background:
                    "rgba(8,8,10,.88)",

                boxShadow:
                    "0 0 60px rgba(180,0,0,.18)"

            }

        );


        const danger =
            document.createElement(
                "div"
            );


        danger.textContent =
            "NOVA ATLAS · SEÑAL VITAL PERDIDA";


        Object.assign(

            danger.style,

            {

                color:
                    "#ff5a50",

                fontSize:
                    "9px",

                letterSpacing:
                    "2px",

                marginBottom:
                    "12px",

                opacity:
                    "0.75"

            }

        );


        const title =
            document.createElement(
                "div"
            );


        title.textContent =
            "GAME OVER";


        Object.assign(

            title.style,

            {

                color:
                    "#ffffff",

                fontSize:
                    "38px",

                fontWeight:
                    "800",

                letterSpacing:
                    "3px",

                marginBottom:
                    "9px",

                textShadow:
                    "0 0 20px rgba(255,40,30,.4)"

            }

        );


        const subtitle =
            document.createElement(
                "div"
            );


        subtitle.textContent =
            "El personal de seguridad ha sido neutralizado.";


        Object.assign(

            subtitle.style,

            {

                color:
                    "rgba(255,255,255,.55)",

                fontSize:
                    "10px",

                marginBottom:
                    "26px",

                lineHeight:
                    "1.6"

            }

        );


        const buttonContainer =
            document.createElement(
                "div"
            );


        Object.assign(

            buttonContainer.style,

            {

                display:
                    "flex",

                gap:
                    "10px",

                justifyContent:
                    "center",

                flexWrap:
                    "wrap"

            }

        );


        this.retryButton =
            this.createButton(

                "REINTENTAR",

                true

            );


        this.fleeButton =
            this.createButton(

                "HUIR",

                false

            );


        this.retryButton.addEventListener(

            "click",

            () => {

                if (
                    typeof this.onRetry ===
                    "function"
                ) {

                    this.onRetry();

                }

            }

        );


        this.fleeButton.addEventListener(

            "click",

            () => {

                if (
                    typeof this.onFlee ===
                    "function"
                ) {

                    this.onFlee();

                }

            }

        );


        buttonContainer.append(

            this.retryButton,

            this.fleeButton

        );


        panel.append(

            danger,

            title,

            subtitle,

            buttonContainer

        );


        this.gameOverScreen.appendChild(
            panel
        );


        document.body.appendChild(
            this.gameOverScreen
        );

    }


    /* =====================================================
       BUTTON
    ====================================================== */

    createButton(
        text,
        primary
    ) {

        const button =
            document.createElement(
                "button"
            );


        button.textContent =
            text;


        Object.assign(

            button.style,

            {

                minWidth:
                    "145px",

                padding:
                    "12px 18px",

                cursor:
                    "pointer",

                borderRadius:
                    "4px",

                border:

                    primary

                        ?

                        "1px solid rgba(255,80,70,.75)"

                        :

                        "1px solid rgba(255,255,255,.18)",

                background:

                    primary

                        ?

                        "rgba(170,25,20,.85)"

                        :

                        "rgba(255,255,255,.05)",

                color:
                    "#ffffff",

                fontFamily:
                    "Orbitron, Consolas, monospace",

                fontSize:
                    "9px",

                fontWeight:
                    "700",

                letterSpacing:
                    "1.25px",

                transition:
                    "transform .12s ease, background .12s ease"

            }

        );


        button.addEventListener(

            "mouseenter",

            () => {

                button.style.transform =
                    "translateY(-1px)";

            }

        );


        button.addEventListener(

            "mouseleave",

            () => {

                button.style.transform =
                    "translateY(0)";

            }

        );


        return button;

    }


    /* =====================================================
       VISIBILITY
    ====================================================== */

    setVisible(
        visible
    ) {

        this.visible =
            visible;


        this.hud.style.display =

            visible

                ?

                "block"

                :

                "none";


        if (
            !visible
        ) {

            this.damageOverlay.style.opacity =
                "0";

        }

    }


    setEnabled(
        enabled
    ) {

        this.enabled =

            enabled

            &&

            !this.dead;

    }


    /* =====================================================
       DAMAGE
    ====================================================== */

    takeDamage(

        amount,

        {
            source = null
        } = {}

    ) {

        if (
            !this.enabled
            ||
            this.dead
            ||
            amount <=
            0
            ||
            this.invulnerabilityTimer >
            0
        ) {

            return false;

        }


        this.health =

            Math.max(

                0,

                this.health -
                amount

            );


        this.invulnerabilityTimer =
            this.invulnerabilityTime;


        this.damageFlashTimer =
            this.damageFlashDuration;


        this.damageOverlay.style.opacity =
            "1";


        this.updateHUD();


        console.log(

            `[PlayerHealth] -${amount} HP · ${this.health}/${this.maxHealth}`

        );


        /* =================================================
           NON-FATAL HIT
        ================================================= */

        if (
            this.health >
            0
        ) {

            if (
                typeof this.onDamage ===
                "function"
            ) {

                this.onDamage({

                    amount,

                    health:
                        this.health,

                    maxHealth:
                        this.maxHealth,

                    source

                });

            }


            return true;

        }


        /* =================================================
           FATAL HIT
        ================================================= */

        this.kill();


        return true;

    }


    /* =====================================================
       HEALING
    ====================================================== */

    heal(
        amount
    ) {

        if (
            this.dead
            ||
            amount <=
            0
        ) {

            return 0;

        }


        const previous =
            this.health;


        this.health =

            Math.min(

                this.maxHealth,

                this.health +
                amount

            );


        const healed =

            this.health -
            previous;


        this.updateHUD();


        return healed;

    }


    healPercent(
        percentage
    ) {

        return this.heal(

            this.maxHealth *
            percentage

        );

    }


    /* =====================================================
       KILL
    ====================================================== */

    kill() {

        if (
            this.dead
        ) {

            return;

        }


        this.dead =
            true;


        this.enabled =
            false;


        this.health =
            0;


        this.updateHUD();


        /*
         * Dejamos un rojo ligero mientras vemos
         * la animación Death.
         */
        this.damageOverlay.style.opacity =
            "0.30";


        /*
         * El Game Over no aparece todavía.
         * main.js espera a que Death termine.
         */
        if (
            typeof this.onDeath ===
            "function"
        ) {

            this.onDeath();

        }

        else {

            this.showGameOver();

        }

    }


    /* =====================================================
       GAME OVER
    ====================================================== */

    showGameOver() {

        this.gameOverScreen.style.display =
            "flex";

    }


    hideGameOver() {

        this.gameOverScreen.style.display =
            "none";

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


        this.lowHealthPulse =
            0;


        this.damageOverlay.style.opacity =
            "0";


        this.hud.style.opacity =
            "1";


        this.hideGameOver();


        this.updateHUD();

    }


    /* =====================================================
       UPDATE HUD
    ====================================================== */

    updateHUD() {

        const percentage =

            this.maxHealth >
            0

                ?

                this.health /
                this.maxHealth

                :

                0;


        const percentDisplay =

            Math.round(

                percentage *
                100

            );


        this.healthText.textContent =

            `${Math.ceil(this.health)} / ${this.maxHealth}`;


        this.bar.style.width =

            `${percentDisplay}%`;


        /* =================================================
           HEALTHY
        ================================================= */

        if (
            percentage >
            0.60
        ) {

            this.bar.style.background =
                "linear-gradient(90deg,#31d17c,#73ff9e)";


            this.healthText.style.color =
                "#ffffff";


            this.status.textContent =
                "ESTADO · ESTABLE";


            this.status.style.color =
                "rgba(255,255,255,.55)";

        }


        /* =================================================
           WOUNDED
        ================================================= */

        else if (
            percentage >
            0.30
        ) {

            this.bar.style.background =
                "linear-gradient(90deg,#d7a42c,#ffd85e)";


            this.healthText.style.color =
                "#ffe28c";


            this.status.textContent =
                "ESTADO · HERIDO";


            this.status.style.color =
                "#ffd85e";

        }


        /* =================================================
           CRITICAL
        ================================================= */

        else {

            this.bar.style.background =
                "linear-gradient(90deg,#a81818,#ff4a3d)";


            this.healthText.style.color =
                "#ff6258";


            this.status.textContent =

                this.dead

                    ?

                    "ESTADO · SIN SIGNOS VITALES"

                    :

                    "ESTADO · CRÍTICO";


            this.status.style.color =
                "#ff554b";

        }

    }


    /* =====================================================
       UPDATE
    ====================================================== */

    update(
        deltaTime
    ) {

        /* =================================================
           INVULNERABILITY
        ================================================= */

        if (
            this.invulnerabilityTimer >
            0
        ) {

            this.invulnerabilityTimer =

                Math.max(

                    0,

                    this.invulnerabilityTimer -
                    deltaTime

                );

        }


        /* =================================================
           DAMAGE FLASH
        ================================================= */

        if (
            this.damageFlashTimer >
            0
            &&
            !this.dead
        ) {

            this.damageFlashTimer -=
                deltaTime;


            const value =

                Math.max(

                    0,

                    this.damageFlashTimer /
                    this.damageFlashDuration

                );


            this.damageOverlay.style.opacity =

                String(

                    value *
                    0.82

                );

        }

        else if (
            !this.dead
        ) {

            this.damageOverlay.style.opacity =
                "0";

        }


        /* =================================================
           LOW HEALTH PULSE
        ================================================= */

        if (
            !this.dead
            &&
            this.health /
            this.maxHealth <=
            0.30
        ) {

            this.lowHealthPulse +=

                deltaTime *
                4.5;


            const pulse =

                0.72

                +

                Math.sin(
                    this.lowHealthPulse
                )

                *
                0.28;


            this.hud.style.opacity =
                String(
                    pulse
                );

        }

        else {

            this.hud.style.opacity =
                "1";

        }

    }


    /* =====================================================
       GETTERS
    ====================================================== */

    getHealth() {

        return this.health;

    }


    getMaxHealth() {

        return this.maxHealth;

    }


    getHealthPercent() {

        if (
            this.maxHealth <=
            0
        ) {

            return 0;

        }


        return this.health /
            this.maxHealth;

    }


    isDead() {

        return this.dead;

    }

}

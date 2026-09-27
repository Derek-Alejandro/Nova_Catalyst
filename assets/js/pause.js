/* =========================================================
   NOVA CATALYST
   Pause Menu

   Build v0.6.3

   - Pause overlay
   - Resume
   - Controls
   - Exit to menu
   - Mouse capture hint
========================================================= */


export class PauseMenu {


    constructor({

        onResume,

        onExit

    }) {

        this.onResume =
            onResume;


        this.onExit =
            onExit;


        this.visible =
            false;


        this.controlsVisible =
            false;


        this.injectStyles();


        this.createInterface();

    }



    /* =====================================================
       STYLES
    ====================================================== */

    injectStyles() {

        if (
            document.getElementById(
                "nova-pause-styles"
            )
        ) {

            return;

        }


        const style =
            document.createElement(
                "style"
            );


        style.id =
            "nova-pause-styles";


        style.textContent = `

            #nova-pause-overlay {

                position: fixed;

                inset: 0;

                z-index: 3000;

                display: flex;

                align-items: center;

                justify-content: center;

                opacity: 0;

                visibility: hidden;

                pointer-events: none;

                background:
                    radial-gradient(
                        circle at 50% 45%,
                        rgba(25, 35, 40, .25),
                        rgba(0, 0, 0, .88)
                    );

                backdrop-filter:
                    blur(8px);

                transition:
                    opacity .18s ease,
                    visibility .18s ease;

            }


            #nova-pause-overlay.nova-pause-visible {

                opacity: 1;

                visibility: visible;

                pointer-events: auto;

            }


            .nova-pause-panel {

                width:
                    min(92vw, 510px);

                padding:
                    34px 38px;

                border:
                    1px solid rgba(255,255,255,.12);

                background:
                    linear-gradient(
                        145deg,
                        rgba(8,12,15,.94),
                        rgba(3,5,7,.97)
                    );

                box-shadow:
                    0 25px 90px rgba(0,0,0,.7);

                position: relative;

                overflow: hidden;

            }


            .nova-pause-panel::before {

                content: "";

                position: absolute;

                left: 0;

                top: 0;

                width: 3px;

                height: 100%;

                background:
                    #d52d27;

            }


            .nova-pause-kicker {

                font-family:
                    Orbitron, sans-serif;

                font-size:
                    9px;

                letter-spacing:
                    4px;

                color:
                    rgba(255,255,255,.38);

                margin-bottom:
                    5px;

            }


            .nova-pause-title {

                margin:
                    0 0 25px;

                font-family:
                    Orbitron, sans-serif;

                font-size:
                    clamp(28px, 5vw, 43px);

                font-weight:
                    800;

                letter-spacing:
                    4px;

                color:
                    #f2f4f4;

            }


            .nova-pause-title span {

                color:
                    #d52d27;

            }


            .nova-pause-buttons {

                display:
                    grid;

                gap:
                    9px;

            }


            .nova-pause-button {

                width:
                    100%;

                padding:
                    13px 16px;

                text-align:
                    left;

                border:
                    1px solid rgba(255,255,255,.10);

                background:
                    rgba(255,255,255,.025);

                color:
                    rgba(255,255,255,.84);

                font-family:
                    Rajdhani, sans-serif;

                font-size:
                    15px;

                font-weight:
                    700;

                letter-spacing:
                    2px;

                cursor:
                    pointer;

                transition:
                    background .15s ease,
                    border-color .15s ease,
                    padding-left .15s ease,
                    color .15s ease;

            }


            .nova-pause-button:hover {

                background:
                    rgba(213,45,39,.11);

                border-color:
                    rgba(213,45,39,.45);

                color:
                    #fff;

                padding-left:
                    21px;

            }


            .nova-pause-button.danger {

                color:
                    rgba(255,120,110,.78);

            }


            .nova-controls {

                margin-top:
                    20px;

                padding-top:
                    18px;

                border-top:
                    1px solid rgba(255,255,255,.08);

                display:
                    none;

            }


            .nova-controls.visible {

                display:
                    block;

            }


            .nova-control-row {

                display:
                    flex;

                align-items:
                    center;

                justify-content:
                    space-between;

                gap:
                    20px;

                padding:
                    6px 0;

                color:
                    rgba(255,255,255,.57);

                font-family:
                    Rajdhani, sans-serif;

                font-size:
                    13px;

                letter-spacing:
                    .7px;

            }


            .nova-control-key {

                flex-shrink:
                    0;

                color:
                    #fff;

                font-family:
                    Orbitron, sans-serif;

                font-size:
                    9px;

                letter-spacing:
                    1px;

                border:
                    1px solid rgba(255,255,255,.15);

                padding:
                    5px 8px;

                background:
                    rgba(255,255,255,.04);

            }


            #nova-input-hint {

                position:
                    fixed;

                left:
                    50%;

                bottom:
                    80px;

                transform:
                    translateX(-50%);

                z-index:
                    2000;

                padding:
                    9px 14px;

                border:
                    1px solid rgba(255,255,255,.10);

                background:
                    rgba(0,0,0,.68);

                color:
                    rgba(255,255,255,.72);

                font-family:
                    Rajdhani, sans-serif;

                font-size:
                    11px;

                font-weight:
                    600;

                letter-spacing:
                    1.4px;

                pointer-events:
                    none;

                opacity:
                    0;

                visibility:
                    hidden;

                transition:
                    opacity .15s ease;

            }


            #nova-input-hint.visible {

                opacity: 1;

                visibility: visible;

            }


            @media (max-width: 600px) {

                .nova-pause-panel {

                    padding:
                        26px 24px;

                }

            }

        `;


        document.head.appendChild(
            style
        );

    }



    /* =====================================================
       UI
    ====================================================== */

    createInterface() {

        /* =================================================
           OVERLAY
        ================================================= */

        this.overlay =
            document.createElement(
                "div"
            );


        this.overlay.id =
            "nova-pause-overlay";


        this.overlay.innerHTML = `

            <div class="nova-pause-panel">

                <div class="nova-pause-kicker">
                    NOVA ATLAS · SISTEMA SUSPENDIDO
                </div>

                <h2 class="nova-pause-title">
                    PAU<span>SA</span>
                </h2>


                <div class="nova-pause-buttons">

                    <button
                        id="nova-btn-resume"
                        class="nova-pause-button"
                        type="button"
                    >
                        CONTINUAR
                    </button>


                    <button
                        id="nova-btn-controls"
                        class="nova-pause-button"
                        type="button"
                    >
                        CONTROLES
                    </button>


                    <button
                        id="nova-btn-exit"
                        class="nova-pause-button danger"
                        type="button"
                    >
                        SALIR AL MENÚ PRINCIPAL
                    </button>

                </div>


                <div
                    id="nova-controls-panel"
                    class="nova-controls"
                >

                    <div class="nova-control-row">
                        <span>Mover al personaje</span>
                        <span class="nova-control-key">W A S D</span>
                    </div>

                    <div class="nova-control-row">
                        <span>Correr</span>
                        <span class="nova-control-key">SHIFT</span>
                    </div>

                    <div class="nova-control-row">
                        <span>Mover cámara / mirar</span>
                        <span class="nova-control-key">MOUSE</span>
                    </div>

                    <div class="nova-control-row">
                        <span>Apuntar</span>
                        <span class="nova-control-key">CLIC DERECHO</span>
                    </div>

                    <div class="nova-control-row">
                        <span>Disparar</span>
                        <span class="nova-control-key">CLIC IZQUIERDO</span>
                    </div>

                    <div class="nova-control-row">
                        <span>Recargar</span>
                        <span class="nova-control-key">R</span>
                    </div>

                    <div class="nova-control-row">
                        <span>Cambiar TPS / FPS</span>
                        <span class="nova-control-key">C</span>
                    </div>

                    <div class="nova-control-row">
                        <span>Pausa / liberar cursor</span>
                        <span class="nova-control-key">ESC</span>
                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(
            this.overlay
        );



        /* =================================================
           CAPTURE HINT
        ================================================= */

        this.captureHint =
            document.createElement(
                "div"
            );


        this.captureHint.id =
            "nova-input-hint";


        this.captureHint.textContent =
            "HAZ CLIC EN EL JUEGO PARA CAPTURAR EL MOUSE";


        document.body.appendChild(
            this.captureHint
        );



        /* =================================================
           ELEMENTS
        ================================================= */

        this.resumeButton =

            this.overlay.querySelector(
                "#nova-btn-resume"
            );


        this.controlsButton =

            this.overlay.querySelector(
                "#nova-btn-controls"
            );


        this.exitButton =

            this.overlay.querySelector(
                "#nova-btn-exit"
            );


        this.controlsPanel =

            this.overlay.querySelector(
                "#nova-controls-panel"
            );



        /* =================================================
           EVENTS
        ================================================= */

        this.resumeButton
            .addEventListener(

                "click",

                () => {

                    if (
                        typeof this.onResume ===
                        "function"
                    ) {

                        this.onResume();

                    }

                }

            );


        this.controlsButton
            .addEventListener(

                "click",

                () => {

                    this.controlsVisible =
                        !this.controlsVisible;


                    this.controlsPanel
                        .classList
                        .toggle(

                            "visible",

                            this.controlsVisible

                        );


                    this.controlsButton.textContent =

                        this.controlsVisible

                            ?

                            "OCULTAR CONTROLES"

                            :

                            "CONTROLES";

                }

            );


        this.exitButton
            .addEventListener(

                "click",

                () => {

                    if (
                        typeof this.onExit ===
                        "function"
                    ) {

                        this.onExit();

                    }

                }

            );

    }



    /* =====================================================
       PAUSE VISIBILITY
    ====================================================== */

    setVisible(
        visible
    ) {

        this.visible =
            visible;


        this.overlay
            .classList
            .toggle(

                "nova-pause-visible",

                visible

            );


        if (
            !visible
        ) {

            this.controlsVisible =
                false;


            this.controlsPanel
                .classList
                .remove(
                    "visible"
                );


            this.controlsButton.textContent =
                "CONTROLES";

        }

    }



    /* =====================================================
       CAPTURE HINT
    ====================================================== */

    setCaptureHintVisible(
        visible
    ) {

        this.captureHint
            .classList
            .toggle(

                "visible",

                visible

            );

    }

}
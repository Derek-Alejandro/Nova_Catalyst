/* =========================================================
   NOVA CATALYST
   Project Nova
   Pre-Alpha v.01
   Build v0.1
========================================================= */

import * as THREE from "three";


/* =========================================================
   CONFIGURACIÓN
========================================================= */

const CONFIG = {
    backgroundColor: 0x010204,
    stars: 2400,
    distantStars: 1000
};


/* =========================================================
   HTML
========================================================= */

const gameContainer = document.getElementById("game-container");
const mainMenu = document.getElementById("main-menu");
const briefingScreen = document.getElementById("briefing-screen");
const aboutScreen = document.getElementById("about-screen");

const btnEnter = document.getElementById("btn-enter");
const btnAbout = document.getElementById("btn-about");
const btnBackBriefing = document.getElementById("btn-back-from-briefing");
const btnBackAbout = document.getElementById("btn-back-from-about");
const btnSurvive = document.getElementById("btn-survive");
const notification = document.getElementById("notification");


/* =========================================================
   ESCENA
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(CONFIG.backgroundColor);

scene.fog = new THREE.FogExp2(0x010204, 0.0042);


/* =========================================================
   CÁMARA
========================================================= */

const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    600
);

camera.position.set(0, 0, 8);


/* =========================================================
   RENDERER
========================================================= */

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance"
});

renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.92;

gameContainer.appendChild(renderer.domElement);


/* =========================================================
   RELOJ
========================================================= */

const clock = new THREE.Clock();


/* =========================================================
   GENERADOR DE CAMPOS DE ESTRELLAS
========================================================= */

function createStarField({
    count,
    radius,
    size,
    color,
    opacity
}) {
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
        const i3 = i * 3;

        positions[i3] = (Math.random() - 0.5) * radius;
        positions[i3 + 1] = (Math.random() - 0.5) * radius;
        positions[i3 + 2] = -Math.random() * radius;
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
    );

    const material = new THREE.PointsMaterial({
        color,
        size,
        transparent: true,
        opacity,
        sizeAttenuation: true,
        depthWrite: false
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    return points;
}


/* =========================================================
   CAPAS DE ESTRELLAS
========================================================= */

const stars = createStarField({
    count: CONFIG.stars,
    radius: 180,
    size: 0.12,
    color: 0xe4edf0,
    opacity: 0.82
});

const distantStars = createStarField({
    count: CONFIG.distantStars,
    radius: 260,
    size: 0.06,
    color: 0x7e8b92,
    opacity: 0.34
});

const ghostDust = createStarField({
    count: 280,
    radius: 120,
    size: 0.18,
    color: 0x6e1a16,
    opacity: 0.16
});


/* =========================================================
   LUCES
========================================================= */

const ambientLight = new THREE.AmbientLight(0x152126, 0.45);
scene.add(ambientLight);

const coldLight = new THREE.PointLight(0x6e8b94, 3.5, 60, 2);
coldLight.position.set(-8, 5, -14);
scene.add(coldLight);

const redLight = new THREE.PointLight(0x8b1b17, 2.8, 45, 2);
redLight.position.set(10, -2, -12);
scene.add(redLight);


/* =========================================================
   CONTROL DE PANTALLAS
========================================================= */

function showScreen(target) {
    const screens = [mainMenu, briefingScreen, aboutScreen];

    screens.forEach((screen) => {
        screen.classList.remove("screen-visible");
        screen.classList.add("hidden-screen");
    });

    target.classList.remove("hidden-screen");
    target.classList.add("screen-visible");
}


/* =========================================================
   EVENTOS
========================================================= */

btnEnter.addEventListener("click", () => {
    showScreen(briefingScreen);
});

btnAbout.addEventListener("click", () => {
    showScreen(aboutScreen);
});

btnBackBriefing.addEventListener("click", () => {
    showScreen(mainMenu);
});

btnBackAbout.addEventListener("click", () => {
    showScreen(mainMenu);
});

btnSurvive.addEventListener("click", () => {
    showNotification(
        "PROTOCOLO ACEPTADO · CONTROLES Y GAMEPLAY EN LA SIGUIENTE ETAPA"
    );
});


/* =========================================================
   NOTIFICACIÓN
========================================================= */

let notificationTimeout = null;

function showNotification(text) {
    notification.textContent = text;
    notification.classList.add("visible");

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    notificationTimeout = setTimeout(() => {
        notification.classList.remove("visible");
    }, 3200);
}


/* =========================================================
   MOUSE / PARALLAX
========================================================= */

let pointerX = 0;
let pointerY = 0;

window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX / window.innerWidth - 0.5;
    pointerY = event.clientY / window.innerHeight - 0.5;
});


/* =========================================================
   RESIZE
========================================================= */

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
}

window.addEventListener("resize", handleResize);


/* =========================================================
   UPDATE
========================================================= */

function update(deltaTime, elapsedTime) {
    stars.rotation.y += deltaTime * 0.0018;
    stars.rotation.x += deltaTime * 0.0005;

    distantStars.rotation.y -= deltaTime * 0.0008;
    ghostDust.rotation.z += deltaTime * 0.0012;

    camera.position.x += ((pointerX * 0.26) - camera.position.x) * deltaTime * 0.55;
    camera.position.y += ((-pointerY * 0.16) - camera.position.y) * deltaTime * 0.55;

    camera.lookAt(0, 0, -30);

    redLight.intensity =
        2.5 +
        Math.sin(elapsedTime * 0.7) * 0.25;
}


/* =========================================================
   LOOP
========================================================= */

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.1);
    const elapsedTime = clock.elapsedTime;

    update(deltaTime, elapsedTime);
    renderer.render(scene, camera);
}

animate();


/* =========================================================
   CONSOLA
========================================================= */

console.log(
    "%cNOVA CATALYST",
    "color:#d72924;font-size:24px;font-weight:bold;"
);

console.log(
    "%cProject Nova · Pre-Alpha v.01",
    "color:#b8c0c2;"
);

console.log(
    "%cBuild v0.1 · Menu inicial cargado correctamente",
    "color:#64d78f;"
);
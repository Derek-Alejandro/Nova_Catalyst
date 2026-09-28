/* =========================================================
   NOVA CATALYST
   Wave Manager
   Build v0.11.2

   - Wave 1: 3
   - Wave 2: 5
   - Wave 3: 7
   - Wave 4: 9
   - Wave 5: Boss prototype

   MEJORAS:
   - Spawn cache
   - Piso válido
   - Mismo nivel
   - Separación de paredes
   - Camino visual
   - Piso continuo
   - Spawn escalonado
   - Máximo 5 enemigos activos
========================================================= */

import * as THREE from "three";

const WAVE_CONFIG = {
    totalWaves: 5,

    normalWaves: {
        1: 6,
        2: 9,
        3: 12,
        4: 15,
        5: 20
    },

    initialPreparation: 20,
    intermission: 5,

    spawnInterval: 0.30,

    /*
     * Aunque las oleadas tengan muchos enemigos totales,
     * sólo existen 5 vivos simultáneamente.
     */
    maxConcurrentEnemies: 5,

    spawnPoolTarget: 18,
    maxPoolAttempts: 260,
    attemptsPerFrame: 2,

    minSpawnDistance: 6.5,
    maxSpawnDistance: 15,
    minEnemySeparation: 1.9,

    environmentPadding: 1.2,

    rayOriginAbovePlayer: 1.15,
    rayDistance: 3.8,
    maxFloorAbovePlayer: 0.55,
    maxFloorBelowPlayer: 1.10,

    wallClearance: 0.62,
    clearanceHeight: 0.95,

    directPathHeight: 1.05,
    targetPadding: 1.25,

    groundPathSamples: 6,
    maxGroundStep: 0.55,

    maxCorpses: 4
};

const WAVE_STATE = {
    IDLE: "idle",
    PREPARING: "preparing",
    ACTIVE: "active",
    INTERMISSION: "intermission",
    COMPLETE: "complete"
};

export class WaveManager {

    constructor({
        enemyManager,
        playerController,
        onNotification = null,
        onWaveStarted = null,
        onWaveCleared = null,
        onFinalWaveCleared = null
    }) {

        this.enemyManager = enemyManager;
        this.playerController = playerController;

        this.onNotification = onNotification;
        this.onWaveStarted = onWaveStarted;
        this.onWaveCleared = onWaveCleared;
        this.onFinalWaveCleared = onFinalWaveCleared;

        this.environment = null;
        this.environmentMeshes = [];
        this.environmentBounds = new THREE.Box3();

        this.enabled = false;
        this.started = false;

        this.currentWave = 0;
        this.state = WAVE_STATE.IDLE;
        this.timer = 0;

        this.spawnPool = [];
        this.spawnPoolReady = false;

        this.spawnQueue = [];
        this.spawnTimer = 0;

        this.spawnedThisWave = 0;
        this.expectedThisWave = 0;

        this.floorRaycaster = new THREE.Raycaster();
        this.clearanceRaycaster = new THREE.Raycaster();
        this.pathRaycaster = new THREE.Raycaster();

        this.playerPosition = new THREE.Vector3();
        this.rayOrigin = new THREE.Vector3();

        this.rayDirection = new THREE.Vector3(
            0,
            -1,
            0
        );

        this.pathOrigin = new THREE.Vector3();
        this.pathTarget = new THREE.Vector3();
        this.pathDirection = new THREE.Vector3();

        this.clearanceOrigin = new THREE.Vector3();

        this.floorNormal = new THREE.Vector3();
        this.normalMatrix = new THREE.Matrix3();

        this.lastHUDWave = "";
        this.lastHUDStatus = "";
        this.lastHUDHostiles = "";

        this.createHUD();
        this.updateHUD();
    }

    setEnvironment(environment) {

        this.environment = environment;

        this.environmentMeshes.length = 0;

        this.spawnPool.length = 0;
        this.spawnPoolReady = false;

        environment.updateMatrixWorld(true);

        this.environmentBounds.setFromObject(
            environment
        );

        environment.traverse(object => {

            if (
                !object.isMesh ||
                !object.visible ||
                !object.geometry
            ) {
                return;
            }

            this.environmentMeshes.push(
                object
            );
        });

        console.log(
            `[WaveManager] Environment: ${this.environmentMeshes.length} meshes`
        );
    }

    yieldFrame() {

        return new Promise(resolve => {
            requestAnimationFrame(resolve);
        });
    }

    getPlayerPosition() {

        this.playerController
            .getObject()
            .getWorldPosition(
                this.playerPosition
            );

        return this.playerPosition;
    }

    sampleFloorAt(x, z) {

        if (!this.environment) {
            return null;
        }

        const player =
            this.getPlayerPosition();

        this.rayOrigin.set(
            x,
            player.y +
                WAVE_CONFIG.rayOriginAbovePlayer,
            z
        );

        this.floorRaycaster.set(
            this.rayOrigin,
            this.rayDirection
        );

        this.floorRaycaster.near = 0;
        this.floorRaycaster.far =
            WAVE_CONFIG.rayDistance;

        const hits =
            this.floorRaycaster.intersectObjects(
                this.environmentMeshes,
                false
            );

        for (const hit of hits) {

            if (
                hit.point.y >
                player.y +
                    WAVE_CONFIG.maxFloorAbovePlayer
            ) {
                continue;
            }

            if (
                hit.point.y <
                player.y -
                    WAVE_CONFIG.maxFloorBelowPlayer
            ) {
                continue;
            }

            if (hit.face) {

                this.normalMatrix
                    .getNormalMatrix(
                        hit.object.matrixWorld
                    );

                this.floorNormal
                    .copy(
                        hit.face.normal
                    )
                    .applyMatrix3(
                        this.normalMatrix
                    )
                    .normalize();

                if (
                    Math.abs(
                        this.floorNormal.y
                    ) < 0.55
                ) {
                    continue;
                }
            }

            return new THREE.Vector3(
                hit.point.x,
                hit.point.y + 0.035,
                hit.point.z
            );
        }

        return null;
    }

    hasEnoughClearance(position) {

        const directions = [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],

            [0.707, 0.707],
            [-0.707, 0.707],
            [0.707, -0.707],
            [-0.707, -0.707]
        ];

        this.clearanceOrigin.set(
            position.x,
            position.y +
                WAVE_CONFIG.clearanceHeight,
            position.z
        );

        for (const [x, z] of directions) {

            this.pathDirection.set(
                x,
                0,
                z
            );

            this.clearanceRaycaster.set(
                this.clearanceOrigin,
                this.pathDirection
            );

            this.clearanceRaycaster.near = 0;

            this.clearanceRaycaster.far =
                WAVE_CONFIG.wallClearance;

            const hits =
                this.clearanceRaycaster
                    .intersectObjects(
                        this.environmentMeshes,
                        false
                    );

            if (hits.length > 0) {
                return false;
            }
        }

        return true;
    }

    hasDirectPathToPlayer(position) {

        const player =
            this.getPlayerPosition();

        this.pathOrigin.set(
            position.x,
            position.y +
                WAVE_CONFIG.directPathHeight,
            position.z
        );

        this.pathTarget.set(
            player.x,
            player.y +
                WAVE_CONFIG.directPathHeight,
            player.z
        );

        this.pathDirection
            .subVectors(
                this.pathTarget,
                this.pathOrigin
            );

        const distance =
            this.pathDirection.length();

        if (distance <= 2) {
            return true;
        }

        this.pathDirection.normalize();

        this.pathRaycaster.set(
            this.pathOrigin,
            this.pathDirection
        );

        this.pathRaycaster.near = 0.10;

        this.pathRaycaster.far =
            Math.max(
                0.1,
                distance -
                    WAVE_CONFIG.targetPadding
            );

        const hits =
            this.pathRaycaster
                .intersectObjects(
                    this.environmentMeshes,
                    false
                );

        return hits.length === 0;
    }

    hasContinuousGroundPath(position) {

        const player =
            this.getPlayerPosition()
                .clone();

        let previousY =
            player.y;

        for (
            let i = 1;
            i <= WAVE_CONFIG.groundPathSamples;
            i++
        ) {

            const t =
                i /
                (
                    WAVE_CONFIG.groundPathSamples +
                    1
                );

            const x =
                THREE.MathUtils.lerp(
                    player.x,
                    position.x,
                    t
                );

            const z =
                THREE.MathUtils.lerp(
                    player.z,
                    position.z,
                    t
                );

            const floor =
                this.sampleFloorAt(
                    x,
                    z
                );

            if (!floor) {
                return false;
            }

            if (
                Math.abs(
                    floor.y -
                    previousY
                ) >
                WAVE_CONFIG.maxGroundStep
            ) {
                return false;
            }

            previousY =
                floor.y;
        }

        return true;
    }

    isSeparatedFromPool(position) {

        for (
            const other
            of this.spawnPool
        ) {

            const distance =
                Math.hypot(
                    position.x -
                        other.x,
                    position.z -
                        other.z
                );

            if (
                distance <
                WAVE_CONFIG.minEnemySeparation
            ) {
                return false;
            }
        }

        return true;
    }

    createCandidate() {

        const player =
            this.getPlayerPosition();

        const angle =
            Math.random() *
            Math.PI *
            2;

        const distance =
            THREE.MathUtils.lerp(
                WAVE_CONFIG.minSpawnDistance,
                WAVE_CONFIG.maxSpawnDistance,
                Math.random()
            );

        let x =
            player.x +
            Math.cos(angle) *
            distance;

        let z =
            player.z +
            Math.sin(angle) *
            distance;

        x =
            THREE.MathUtils.clamp(
                x,
                this.environmentBounds.min.x +
                    WAVE_CONFIG.environmentPadding,
                this.environmentBounds.max.x -
                    WAVE_CONFIG.environmentPadding
            );

        z =
            THREE.MathUtils.clamp(
                z,
                this.environmentBounds.min.z +
                    WAVE_CONFIG.environmentPadding,
                this.environmentBounds.max.z -
                    WAVE_CONFIG.environmentPadding
            );

        return this.sampleFloorAt(
            x,
            z
        );
    }

    async prepareSpawnPool() {

        if (!this.environment) {

            throw new Error(
                "WaveManager requiere environment antes de prepareSpawnPool()."
            );
        }

        console.log(
            "[WaveManager] Analizando zona jugable..."
        );

        this.spawnPool.length = 0;
        this.spawnPoolReady = false;

        let attempts = 0;

        while (
            this.spawnPool.length <
                WAVE_CONFIG.spawnPoolTarget

            &&

            attempts <
                WAVE_CONFIG.maxPoolAttempts
        ) {

            for (
                let i = 0;
                i < WAVE_CONFIG.attemptsPerFrame;
                i++
            ) {

                if (
                    this.spawnPool.length >=
                        WAVE_CONFIG.spawnPoolTarget

                    ||

                    attempts >=
                        WAVE_CONFIG.maxPoolAttempts
                ) {
                    break;
                }

                attempts++;

                const candidate =
                    this.createCandidate();

                if (!candidate) {
                    continue;
                }

                const player =
                    this.getPlayerPosition();

                const distance =
                    Math.hypot(
                        candidate.x -
                            player.x,
                        candidate.z -
                            player.z
                    );

                if (
                    distance <
                    WAVE_CONFIG.minSpawnDistance
                ) {
                    continue;
                }

                if (
                    !this.hasEnoughClearance(
                        candidate
                    )
                ) {
                    continue;
                }

                if (
                    !this.hasDirectPathToPlayer(
                        candidate
                    )
                ) {
                    continue;
                }

                if (
                    !this.hasContinuousGroundPath(
                        candidate
                    )
                ) {
                    continue;
                }

                if (
                    !this.isSeparatedFromPool(
                        candidate
                    )
                ) {
                    continue;
                }

                this.spawnPool.push(
                    candidate
                );
            }

            await this.yieldFrame();
        }

        this.spawnPoolReady =
            this.spawnPool.length > 0;

        console.log(
            `[WaveManager] Spawn pool: ${this.spawnPool.length} puntos válidos / ${attempts} intentos`
        );

        if (
            this.spawnPool.length < 9
        ) {

            console.warn(
                "[WaveManager] Hay menos de 9 puntos únicos; se reutilizarán únicamente cuando estén libres."
            );
        }

        return this.spawnPool.length;
    }

    chooseSpawnPositions(amount) {

        if (
            !this.spawnPoolReady ||
            this.spawnPool.length === 0
        ) {
            return [];
        }

        const player =
            this.getPlayerPosition();

        let candidates =
            this.spawnPool
                .filter(point => {

                    const distance =
                        Math.hypot(
                            point.x -
                                player.x,
                            point.z -
                                player.z
                        );

                    return (
                        distance >=
                        WAVE_CONFIG
                            .minSpawnDistance *
                        0.70
                    );
                })
                .map(
                    point =>
                        point.clone()
                );

        if (
            candidates.length === 0
        ) {

            candidates =
                this.spawnPool.map(
                    point =>
                        point.clone()
                );
        }

        for (
            let i =
                candidates.length - 1;
            i > 0;
            i--
        ) {

            const j =
                Math.floor(
                    Math.random() *
                    (i + 1)
                );

            [
                candidates[i],
                candidates[j]
            ] = [
                candidates[j],
                candidates[i]
            ];
        }

        const result = [];

        for (
            let i = 0;
            i < amount;
            i++
        ) {

            result.push(
                candidates[
                    i %
                    candidates.length
                ].clone()
            );
        }

        return result;
    }

    isSpawnClearNow(position) {

        const alive =
            this.enemyManager
                .getAliveEnemies();

        for (const enemy of alive) {

            const enemyPosition =
                enemy
                    .getObject()
                    .position;

            const distance =
                Math.hypot(
                    position.x -
                        enemyPosition.x,
                    position.z -
                        enemyPosition.z
                );

            if (
                distance <
                WAVE_CONFIG.minEnemySeparation
            ) {
                return false;
            }
        }

        return true;
    }

    createHUD() {

        this.hud =
            document.createElement(
                "div"
            );

        this.hud.id =
            "nova-wave-hud";

        Object.assign(
            this.hud.style,
            {
                position: "fixed",
                top: "18px",
                left: "50%",
                transform: "translateX(-50%)",

                minWidth: "245px",
                padding: "10px 18px",

                zIndex: "800",

                pointerEvents: "none",
                userSelect: "none",

                textAlign: "center",
                color: "#ffffff",

                fontFamily:
                    "Orbitron, Consolas, monospace",

                border:
                    "1px solid rgba(255,255,255,.13)",

                borderRadius: "6px",

                background:
                    "rgba(0,0,0,.56)",

                backdropFilter:
                    "blur(7px)",

                display: "none"
            }
        );

        this.waveText =
            document.createElement("div");

        this.statusText =
            document.createElement("div");

        this.hostilesText =
            document.createElement("div");

        Object.assign(
            this.waveText.style,
            {
                fontSize: "12px",
                fontWeight: "800",
                letterSpacing: "2px",
                marginBottom: "5px"
            }
        );

        Object.assign(
            this.statusText.style,
            {
                fontSize: "8px",
                letterSpacing: "1.5px",

                color:
                    "rgba(255,255,255,.62)"
            }
        );

        Object.assign(
            this.hostilesText.style,
            {
                marginTop: "6px",
                fontSize: "9px",
                fontWeight: "700",

                letterSpacing:
                    "1.3px",

                color: "#ff695f"
            }
        );

        this.hud.append(
            this.waveText,
            this.statusText,
            this.hostilesText
        );

        document.body.appendChild(
            this.hud
        );
    }

    setVisible(visible) {

        this.hud.style.display =
            visible
                ? "block"
                : "none";
    }

    setElementText(
        element,
        propertyName,
        value
    ) {

        if (
            this[propertyName] ===
            value
        ) {
            return;
        }

        this[propertyName] =
            value;

        element.textContent =
            value;
    }

    formatTime(seconds) {

        const value =
            Math.max(
                0,
                Math.ceil(seconds)
            );

        const minutes =
            Math.floor(
                value / 60
            );

        const remaining =
            value % 60;

        return (
            `${String(minutes).padStart(2, "0")}`
            +
            ":"
            +
            `${String(remaining).padStart(2, "0")}`
        );
    }

    updateHUD() {

        const alive =
            this.enemyManager
                .getAliveCount();

        const hostiles =
            alive +
            this.spawnQueue.length;

        let waveText =
            "NOVA CATALYST";

        let statusText =
            "STANDBY";

        let hostilesText =
            "HOSTILES · 0";

        if (
            this.state ===
            WAVE_STATE.PREPARING
        ) {

            waveText =
                "SURVIVAL PROTOCOL";

            statusText =
                `PRIMERA OLEADA EN ${this.formatTime(this.timer)}`;
        }

        else if (
            this.state ===
            WAVE_STATE.ACTIVE
        ) {

            waveText =
                `WAVE ${this.currentWave} / ${WAVE_CONFIG.totalWaves}`;

            statusText =
                this.spawnQueue.length > 0
                    ? "DETECTANDO HOSTILES..."
                    : "OLEADA ACTIVA";

            hostilesText =
                `HOSTILES · ${hostiles}`;
        }

        else if (
            this.state ===
            WAVE_STATE.INTERMISSION
        ) {

            waveText =
                `WAVE ${this.currentWave} CLEAR`;

            statusText =
                `SIGUIENTE OLEADA · ${this.formatTime(this.timer)}`;
        }

        else if (
            this.state ===
            WAVE_STATE.COMPLETE
        ) {

            waveText =
                "WAVE 5 CLEAR";

            statusText =
                "FIRMA HOSTIL DESCONOCIDA DETECTADA";

            hostilesText =
                "ZONA A · SIN HOSTILES";
        }

        this.setElementText(
            this.waveText,
            "lastHUDWave",
            waveText
        );

        this.setElementText(
            this.statusText,
            "lastHUDStatus",
            statusText
        );

        this.setElementText(
            this.hostilesText,
            "lastHUDHostiles",
            hostilesText
        );
    }

    notify(message) {

        if (
            typeof this.onNotification ===
            "function"
        ) {

            this.onNotification(
                message
            );
        }
    }

    start() {

        if (
            !this.spawnPoolReady
        ) {

            console.warn(
                "[WaveManager] Spawn pool todavía no está preparado."
            );
        }

        this.enabled = true;
        this.started = true;

        this.currentWave = 0;

        this.state =
            WAVE_STATE.PREPARING;

        this.timer =
            WAVE_CONFIG.initialPreparation;

        this.spawnQueue.length = 0;

        this.spawnTimer = 0;
        this.spawnedThisWave = 0;

        this.setVisible(true);
        this.updateHUD();

        this.notify(
            "PROTOCOLO DE SUPERVIVENCIA · 20 SEGUNDOS"
        );
    }

    setEnabled(enabled) {

        this.enabled =
            enabled;
    }

    startNormalWave(
        waveNumber
    ) {

        const requestedAmount =
            WAVE_CONFIG
                .normalWaves[
                    waveNumber
                ];

        if (!requestedAmount) {
            return;
        }

        this.enemyManager
            .pruneDeadEnemies(
                WAVE_CONFIG.maxCorpses
            );

        this.currentWave =
            waveNumber;

        this.state =
            WAVE_STATE.ACTIVE;

        this.spawnedThisWave = 0;

        const positions =
            this.chooseSpawnPositions(
                requestedAmount
            );

        this.expectedThisWave =
            positions.length;

        this.spawnQueue =
            positions.map(
                position => ({
                    position:
                        position.clone()
                })
            );

        this.spawnTimer = 0;

        this.notify(
            `WAVE ${waveNumber} · ${positions.length} HOSTILES`
        );

        if (
            typeof this.onWaveStarted ===
            "function"
        ) {

            this.onWaveStarted({
                wave: waveNumber,
                amount: positions.length
            });
        }

        console.log(
            `[WaveManager] Wave ${waveNumber} · ${positions.length} enemigos totales`
        );

        this.updateHUD();
    }

    processSpawnQueue(
        deltaTime
    ) {

        if (
            this.spawnQueue.length === 0
        ) {
            return;
        }

        if (
            this.enemyManager
                .getAliveCount() >=
            WAVE_CONFIG.maxConcurrentEnemies
        ) {
            return;
        }

        this.spawnTimer -=
            deltaTime;

        if (
            this.spawnTimer > 0
        ) {
            return;
        }

        const item =
            this.spawnQueue[0];

        if (
            !this.isSpawnClearNow(
                item.position
            )
        ) {

            this.spawnQueue.push(
                this.spawnQueue.shift()
            );

            this.spawnTimer = 0.12;

            return;
        }

        this.spawnQueue.shift();

        const enemy =
            this.enemyManager
                .spawnEnemy(
                    item.position
                );

        if (enemy) {
            this.spawnedThisWave++;
        }

        this.spawnTimer =
            WAVE_CONFIG.spawnInterval;
    }

    completeNormalWave() {

        const cleared =
            this.currentWave;

        this.notify(
            `WAVE ${cleared} CLEAR`
        );

        if (
            typeof this.onWaveCleared ===
            "function"
        ) {

            this.onWaveCleared({
                wave: cleared
            });
        }

        /*
         * Después de la quinta oleada,
         * WaveManager termina.
         *
         * main.js se encarga del Boss Arena.
         */
        if (
            cleared >=
            WAVE_CONFIG.totalWaves
        ) {

            this.state =
                WAVE_STATE.COMPLETE;

            this.enabled = false;

            this.spawnQueue.length = 0;

            this.notify(
                "WAVE 5 CLEAR · FIRMA HOSTIL DESCONOCIDA"
            );

            this.updateHUD();

            if (
                typeof this.onFinalWaveCleared ===
                "function"
            ) {

                this.onFinalWaveCleared({
                    wave: cleared
                });
            }

            return;
        }

        this.state =
            WAVE_STATE.INTERMISSION;

        this.timer =
            WAVE_CONFIG.intermission;

        this.updateHUD();
    }

    update(deltaTime) {

        if (
            !this.enabled ||
            !this.started
        ) {
            return;
        }

        if (
            this.state ===
            WAVE_STATE.PREPARING
        ) {

            this.timer =
                Math.max(
                    0,
                    this.timer -
                        deltaTime
                );

            if (
                this.timer <= 0
            ) {

                this.startNormalWave(1);
            }
        }

        else if (
            this.state ===
            WAVE_STATE.ACTIVE
        ) {

            this.processSpawnQueue(
                deltaTime
            );

            if (
                this.spawnQueue.length === 0

                &&

                this.spawnedThisWave > 0

                &&

                this.enemyManager
                    .getAliveCount() === 0
            ) {

                this.completeNormalWave();
            }
        }

        else if (
            this.state ===
            WAVE_STATE.INTERMISSION
        ) {

            this.timer =
                Math.max(
                    0,
                    this.timer -
                        deltaTime
                );

            if (
                this.timer <= 0
            ) {

                this.startNormalWave(
                    this.currentWave + 1
                );
            }
        }

        this.updateHUD();
    }

    getWave() {
        return this.currentWave;
    }

    getState() {
        return this.state;
    }

    isComplete() {

        return (
            this.state ===
            WAVE_STATE.COMPLETE
        );
    }
}
# Nova Catalyst

# **Instituto Tecnológico de Pachuca**
## Ingeniería en Tecnologías de la Información y Comunicaciones
### Desarrollo de Soluciones en Ambientes Virtuales

### **Autor:** Derek Alejandro Vargas Meneses  
### **No. de control:** 22200792  
### **Versión:** Pre-Alpha v0.01

---

## Descripción del proyecto

**Nova Catalyst** es un videojuego web 3D de acción y supervivencia con ambientación de ciencia ficción.  
El jugador controla a un guardia de seguridad atrapado dentro de la estación espacial **Nova Atlas**, la cual ha sido tomada por criaturas hostiles surgidas a partir de una infección.

El objetivo principal es sobrevivir a distintas oleadas de enemigos dentro de la **Zona A**, administrar la munición y la salud, utilizar el entorno a favor del jugador y finalmente enfrentar a un **jefe final** en una arena especial.

---

## Historia / Contexto

La estación **Nova Atlas** ha colapsado tras un incidente biológico que convirtió a gran parte de la tripulación en criaturas violentas.  
El protagonista, uno de los últimos elementos de seguridad con vida, debe resistir el avance de los enemigos, abrirse paso entre el caos y tratar de escapar con vida.

Sin embargo, lo que enfrenta en la Zona A solo es el inicio.

---

## Objetivo del juego

Sobrevivir a **5 oleadas** de enemigos en la **Zona A** y, después de eso, derrotar al **Boss** en la **Boss Arena**.

---

## Reglas del juego

- El jugador inicia con una **pistola**.
- Durante la partida puede conseguir otras armas como:
  - **SMG**
  - **Shotgun**
- Existen **pickups** distribuidos en el escenario:
  - **munición**
  - **botiquines**
  - **armas**
- Los enemigos aparecen en oleadas y se vuelven un peligro constante.
- En la oleada final previa al jefe, se activa una transición hacia la batalla final.
- Si la salud del jugador llega a **0**, se muestra la pantalla de **Game Over**.
- El jugador puede:
  - **Reintentar**
  - **Huir** al menú principal
- Si el jugador derrota al jefe, se activa la secuencia de victoria y se muestra el cierre de esta versión del juego.

---

## Condiciones de victoria y derrota

### Victoria
- Superar las oleadas de la Zona A
- Derrotar al jefe final en la Boss Arena

### Derrota
- Perder toda la salud durante una oleada o durante la batalla contra el jefe

---

## Características principales

- Menú principal temático
- Pantalla de introducción con narrativa
- Juego en **tercera persona** y **primera persona**
- Sistema de **oleadas**
- **Jefe final** con comportamiento propio
- Sistema de **armas**
- Sistema de **munición y recarga**
- Sistema de **salud del jugador**
- Pickups de salud, armas y munición
- Objetos físicos y barriles explosivos
- Transiciones cinemáticas
- Música y efectos de sonido
- Pantalla de victoria y Game Over
- Sistema de pausa

---

## Controles

### Movimiento
- **W / A / S / D** → mover personaje
- **Shift** → correr

### Cámara / Vista
- **Mouse** → mover cámara
- **C** → cambiar entre tercera y primera persona
- **Click derecho** → apuntar

### Combate
- **Click izquierdo** → disparar
- **R** → recargar
- **Rueda del mouse** → cambiar arma

### Sistema
- **Esc** → pausar / abrir menú de pausa

### Debug
- **F9** → acceso rápido a la Boss Fight para pruebas

---

## Mecánica principal

La mecánica principal del juego es el **combate de supervivencia por oleadas**, donde el jugador debe:

- desplazarse por el escenario
- evitar o resistir enemigos
- disparar estratégicamente
- administrar salud y munición
- aprovechar objetos del entorno, como barriles explosivos
- superar la Zona A para llegar a la batalla final

---

## Física y colisiones

El proyecto utiliza un sistema de física para:

- gravedad del jugador
- colliders del escenario
- colisiones con muros, pisos y objetos
- interacción con objetos dinámicos
- barriles explosivos
- sincronización entre el modelo visual y el cuerpo físico del jugador y enemigos

---

## Tecnologías utilizadas

- **HTML5**
- **CSS3**
- **JavaScript**
- **Three.js**
- **Rapier 3D**
- **GLTF / GLB / FBX**
- **Git y GitHub**
- **GitHub Pages**

---

## Estructura general del proyecto

```text
proyecto_nova/
│
├── index.html
├── README.md
│
├── assets/
│   ├── css/
│   ├── icons/
│   ├── models/
│   │   ├── player/
│   │   ├── enemies/
│   │   ├── boss/
│   │   ├── weapons/
│   │   └── environments/
│   ├── sounds/
│   │   ├── music/
│   │   ├── weapons/
│   │   ├── enemies/
│   │   ├── player/
│   │   ├── pickups/
│   │   ├── boss/
│   │   ├── world/
│   │   └── ambient/
│   └── js/
│       ├── main.js
│       ├── environment.js
│       ├── player.js
│       ├── enemy.js
│       ├── boss.js
│       ├── weapons.js
│       ├── physics.js
│       ├── pickupManager.js
│       ├── waveManager.js
│       ├── playerHealth.js
│       ├── audioManager.js
│       ├── camera.js
│       ├── objects.js
│       ├── pause.js
│       └── zoneAAtmosphere.js
│
└── tools/
    └── convert-boss.cjs
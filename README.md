# SOL RUNNER

SOL RUNNER es un juego web tipo **arena roguelite** conectado con **Solana**, donde el jugador inicia sesión con su wallet **Phantom**, firma un mensaje para autenticarse, entra a runs de combate por pisos, obtiene recompensas, compra mejoras y administra una colección de skins/personajes dentro del juego.

El proyecto combina dos partes:

- una **experiencia de juego web** hecha con HTML, CSS y JavaScript
- una **integración blockchain con Solana** para autenticación y rewards

La idea central es que la wallet no sea solo un login decorativo, sino una identidad real del jugador dentro del sistema.

---

# Tabla de contenido

- [Visión general](#visión-general)
- [Objetivo del proyecto](#objetivo-del-proyecto)
- [Arquitectura general](#arquitectura-general)
- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Flujo funcional del sistema](#flujo-funcional-del-sistema)
- [Sistema de autenticación con Phantom](#sistema-de-autenticación-con-phantom)
- [Sistema de juego](#sistema-de-juego)
- [Sistema de tienda](#sistema-de-tienda)
- [Sistema de colección y skins](#sistema-de-colección-y-skins)
- [Parte NFT y alcance real](#parte-nft-y-alcance-real)
- [Sistema de oráculo y recompensas diarias](#sistema-de-oráculo-y-recompensas-diarias)
- [Sistema de rewards on-chain](#sistema-de-rewards-on-chain)
- [Wallet del backend vs wallet del jugador](#wallet-del-backend-vs-wallet-del-jugador)
- [Persistencia de datos](#persistencia-de-datos)
- [Cómo instalar y ejecutar el proyecto](#cómo-instalar-y-ejecutar-el-proyecto)
- [Cómo probar el proyecto paso a paso](#cómo-probar-el-proyecto-paso-a-paso)
- [Variables de entorno](#variables-de-entorno)
- [Endpoints del backend](#endpoints-del-backend)
- [Assets y archivos visuales](#assets-y-archivos-visuales)
- [Problemas comunes](#problemas-comunes)
- [Estado actual del proyecto](#estado-actual-del-proyecto)
- [Mejoras futuras](#mejoras-futuras)

---

# Visión general

SOL RUNNER está diseñado como un juego web con identidad propia, no como un dashboard técnico disfrazado de juego.

La experiencia se divide en tres estados principales:

1. **Pantalla de login / conexión**  
   El usuario conecta su wallet Phantom y firma autenticación.

2. **Menú principal**  
   Se muestran las acciones principales del juego: iniciar run, abrir tienda, abrir oráculo, reclamar rewards, revisar build y skin equipada.

3. **Gameplay**  
   Se entra a una pantalla de juego completa con canvas, HUD, enemigos, boss, progresión por piso y estadísticas del run.

Además, la tienda y el oráculo se muestran como **modales**, no como páginas independientes, para mantener continuidad visual durante la experiencia.

---

# Objetivo del proyecto

El objetivo de SOL RUNNER es demostrar una integración funcional entre:

- **experiencia de juego web**
- **autenticación basada en wallet**
- **recompensas conectadas a Solana**
- **colección de personajes / skins**
- **progresión del jugador**

No se busca únicamente mostrar una conexión básica a wallet, sino construir una base donde:

- la wallet sea la identidad del jugador
- las recompensas tengan sentido dentro del sistema
- la colección de skins pueda evolucionar a un modelo NFT real
- el juego tenga suficiente estructura para crecer

---

# Arquitectura general

El proyecto está dividido en dos capas:

## 1. Frontend
Se encarga de toda la experiencia visual y de juego.

Responsabilidades:
- pantallas del juego
- HUD
- canvas y render
- controles del jugador
- tienda y oráculo
- inventario local
- lógica de runs
- comunicación con backend
- lectura de sesión local

## 2. Backend
Se encarga de la autenticación, sesiones y conexión a Solana.

Responsabilidades:
- generar nonce
- verificar firma de Phantom
- crear sesión
- registrar runs
- calcular rewards
- enviar recompensas reales desde una wallet del backend
- conectarse al RPC de Solana

---

# Tecnologías utilizadas

## Frontend

### HTML5
Se usa para estructurar:
- pantalla de login
- menú principal
- pantalla de gameplay
- HUD
- modales de tienda y oráculo
- canvas del juego

### CSS3
Se usa para:
- diseño visual completo
- layout fijo sin scroll en gameplay
- responsive
- animaciones
- estilos del HUD
- estilos de tienda, badges y colección
- efectos visuales del menú y modales

### JavaScript Vanilla
Se usa para:
- conexión entre pantallas
- gameplay en canvas
- movimiento
- disparo
- spawn de enemigos
- boss
- tienda
- inventario
- progresión
- guardado local
- interacción con backend

## Backend

### Node.js
Runtime principal del servidor.

### Express
Framework HTTP para:
- crear endpoints
- recibir peticiones del frontend
- manejar autenticación y rewards

## Blockchain

### `@solana/web3.js`
Se usa para:
- conexión con Solana
- generación/carga de keypairs
- lectura de balances
- transferencias
- operaciones básicas con wallet

### Phantom Wallet
Se usa para:
- conectar la identidad del jugador
- firmar nonce de autenticación
- recibir recompensas

## Persistencia local

### localStorage
Se usa para guardar datos del jugador dentro del navegador:
- skin equipada
- skins compradas
- mejoras compradas
- progreso
- reward pendiente local
- estado de tienda/oráculo

---

# Estructura del proyecto

## Frontend

```text
frontend/
│
├── index.html
├── style.css
├── wallet.js
├── game.js
├── api.js
│
└── assets/
    ├── images/
    │   └── sol-runner-logo.png
    └── icons/
        └── solrun.ico
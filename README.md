# SOL RUNNER

SOL RUNNER es un juego web de acción tipo arena / roguelite conectado a Solana, donde el jugador inicia sesión con su wallet Phantom, firma autenticación, entra a combates por pisos y puede obtener recompensas, mejoras, skins y progresión.

La experiencia está dividida en tres partes claras:

- pantalla de conexión con wallet
- menú principal del juego
- gameplay en pantalla completa

Además, el juego incluye tienda, oráculo/ruleta diaria, recompensa diaria, progresión de personaje y sistema de recompensas conectado al backend.

---

# Objetivo del proyecto

El objetivo de SOL RUNNER es combinar una experiencia de juego sencilla pero atractiva con elementos del ecosistema Solana, incluyendo:

- autenticación por firma con wallet Phantom
- backend conectado a Solana
- sistema de recompensa on-chain
- inventario de skins y mejoras
- colección visual de personajes
- progresión y economía del juego

El proyecto busca que la parte blockchain no sea solo “decoración”, sino que tenga una función real dentro del flujo del juego.

---

# Qué hace el proyecto

Actualmente, SOL RUNNER permite:

- conectar una wallet Phantom
- autenticar sesión firmando un nonce
- entrar al menú principal del juego
- iniciar runs de combate
- avanzar por pisos
- derrotar enemigos y bosses
- obtener recompensas
- reclamar recompensas desde el backend
- abrir tienda y oráculo como modales
- comprar skins y mejoras
- equipar skins compradas
- guardar progreso local del jugador

---

# Flujo general del sistema

## 1. Conexión e inicio de sesión

El jugador entra a la pantalla inicial y conecta Phantom.  
Después de conectarse:

1. el frontend obtiene la dirección pública de la wallet
2. el frontend pide un nonce al backend
3. el usuario firma ese nonce con Phantom
4. el backend verifica la firma
5. si todo es válido, el backend devuelve una sesión autenticada

Con eso, el usuario ya puede usar el juego.

---

## 2. Menú principal

Una vez autenticado, el jugador entra al menú principal, donde puede:

- iniciar una run
- abrir la tienda
- abrir el oráculo
- revisar skin equipada
- revisar daño y velocidad actuales
- reclamar reward pendiente
- cerrar sesión

---

## 3. Gameplay

Cuando el jugador inicia una run:

- entra a una pantalla dedicada al juego
- aparece el HUD superior
- el canvas ocupa la pantalla útil
- puede moverse con WASD o flechas
- puede disparar con clic izquierdo
- aparecen enemigos gradualmente
- al cumplir el objetivo de kills, aparece el boss
- si derrota al boss, completa el piso y genera recompensa

---

## 4. Tienda

La tienda funciona como modal y contiene tres categorías:

- Personajes
- Armas
- Reliquias

La tienda permite:

- ver skins disponibles
- distinguir entre skin no comprada, comprada o equipada
- equipar skins ya compradas
- comprar mejoras permanentes
- ver colección actual del jugador

---

## 5. Oráculo

El oráculo funciona como modal y ofrece:

- consulta diaria / ruleta
- recompensa diaria
- mejora aleatoria o pequeña recompensa

Esto añade progresión ligera y rejugabilidad.

---

## 6. Recompensas

Cuando una run se completa correctamente:

1. el frontend registra la run contra el backend
2. el backend calcula la recompensa
3. la recompensa queda pendiente
4. el jugador la reclama manualmente
5. el backend envía la recompensa desde la wallet del servidor hacia la wallet del jugador

---

# Tecnologías utilizadas

## Frontend

El frontend está construido con tecnologías web simples para mantener control total sobre la interfaz:

- **HTML5**
- **CSS3**
- **JavaScript Vanilla**

### ¿Para qué se usó cada una?

- **HTML**: estructura de pantallas, modales, HUD, tienda, oráculo, botones y canvas
- **CSS**: diseño visual del juego, layout, efectos visuales, responsive, animaciones y estilo general
- **JavaScript**: lógica de navegación, gameplay, inventario, tienda, oráculo, animación del juego y conexión con backend

---

## Backend

El backend está construido para manejar autenticación, sesión y recompensas:

- **Node.js**
- **Express**

### ¿Para qué se usó?

- crear endpoints REST
- verificar firmas de Phantom
- generar y validar nonces
- administrar sesiones
- registrar runs
- calcular rewards
- enviar recompensas desde una wallet del backend

---

## Blockchain / Solana

La conexión con Solana se trabaja con:

- **@solana/web3.js**
- **Wallet Phantom**
- **Solana Devnet** (según configuración del backend)

### ¿Para qué se usó?

- generar o cargar keypairs
- conectarse al RPC de Solana
- leer balances
- firmar autenticación
- transferir recompensas

---

# Arquitectura del proyecto

La arquitectura actual separa el proyecto en dos partes:

## Frontend
Se encarga de:
- interfaz
- experiencia del jugador
- animación del juego
- gestión visual de tienda y oráculo
- lectura de sesión local
- conexión inicial con Phantom

## Backend
Se encarga de:
- autenticación por firma
- verificación criptográfica
- generación de sesiones
- lógica de reward
- conexión con Solana
- wallet del servidor para recompensas

---

# Estructura general de archivos

## Frontend

```text
frontend/
  index.html
  style.css
  wallet.js
  game.js
  api.js
  assets/
    images/
      sol-runner-logo.png
    icons/
      solrun.ico

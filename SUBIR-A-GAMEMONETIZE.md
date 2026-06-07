# 🎮 Cómo subir "Penales Mundial 2026" a GameMonetize y ganar plata

El juego ya tiene el **SDK de GameMonetize integrado** (muestra un anuncio cada 2
partidos, sin romper el juego). Solo falta registrarte, conseguir tu **Game ID**
y subirlo. Seguí estos pasos.

## 1. Crear cuenta (gratis)

1. Entrá a **https://gamemonetize.com** → **Sign Up** (registrate como desarrollador).
2. Confirmá tu mail.

## 2. Subir el juego

1. En el panel → **Add Game** / **Submit Game**.
2. Datos:
   - **Título:** Penales Mundial 2026
   - **Categoría:** Sports / Football
   - **Descripción:** "Elegí tu selección y ganá el Mundial a puro penal. Pateás, atajás y avanzás por la fase de grupos y las eliminatorias. Gratis, sin descargas."
   - **URL del juego:** `https://penales-mundial.vercel.app`
     *(o subí un ZIP con todo el contenido de la carpeta — ver abajo)*
   - **Orientación:** Landscape + Portrait (anda en las dos)
3. Te van a dar un **Game ID** (un código).

## 3. Pegar tu Game ID y redesplegar

1. Abrí el archivo `index.html`.
2. Buscá esta línea (arriba del `<script src="game.js">`):
   ```js
   window.GM_GAME_ID = ""; // ← PEGÁ ACÁ TU GAME ID
   ```
3. Pegá tu Game ID entre las comillas, por ejemplo:
   ```js
   window.GM_GAME_ID = "abc123def456";
   ```
4. Guardá, hacé `git push` (se redespliega solo en Vercel) **o** avisame y lo hago yo.

## 4. Esperar la aprobación

GameMonetize revisa el juego (suele tardar de horas a unos días). Cuando lo
aprueban, lo distribuyen a su red de webs y **empezás a cobrar** un % de los
anuncios por cada partida jugada.

## 5. Cobrar

En el panel de GameMonetize configurás tu método de pago (PayPal, etc.). Pagan
cuando superás el mínimo.

---

## 📦 Opción ZIP (si te piden subir archivos en vez de URL)

Comprimí en un .zip **el contenido** de esta carpeta (que el `index.html` quede en
la raíz del zip), incluyendo:
- `index.html`
- `game.js`
- `style.css`
- carpeta `sounds/`

Y subí ese zip en el formulario.

---

## 💡 Realista

- Los juegos HTML5 pagan **poco por partida**, pero es **pasivo**: lo subís una vez.
- Cuantas más webs lo levanten y más se juegue, más entra.
- Podés subir **el mismo juego a varios portales** (GameMonetize, GameDistribution,
  CrazyGames) para multiplicar el alcance. Cada uno con su SDK.

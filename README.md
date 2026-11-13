# Isla de Virtudes 🏝️💗

Minijuego romántico hecho con **Astro**: ella recorre una isla acogedora con una
perrita, sigue un camino de puntitos y en cada parada un vecino le cuenta una
virtud suya. Al completar las 5 paradas, Lola (la canguro) la espera en el
muelle al atardecer con una carta.

## Cómo jugar en tu PC

```bash
npm install      # solo la primera vez
npm run dev      # abre http://localhost:4321
```

Controles: flechas o WASD para caminar, Espacio/Enter para hablar, J para el
diario. En el móvil: tocar y arrastrar para caminar, botón **A** para hablar.

## Personalizar (lo importante)

Todo el texto está en **`src/config.ts`**:

- `nombre`: cómo la llaman los vecinos (se usa en `{nombre}`).
- `virtudes`: las paradas en orden. Cada una tiene el vecino, la `etiqueta` del
  letrero, el `titulo` y el `mensaje` de la tarjeta, y el `dialogo`.
- `carta` y `firma`: la carta final.
- `jugadora`: colores de la perrita, y `lentes: false` si no quieres lentes.

## Publicarlo para mandarle el enlace

```bash
npm run build    # genera la carpeta dist/
```

Sube `dist/` a Netlify Drop (arrastrar y soltar), Vercel o GitHub Pages.

## Estructura

| Archivo | Qué hace |
| --- | --- |
| `src/config.ts` | Textos, virtudes y colores |
| `src/pages/index.astro` | Página que monta todo |
| `src/components/*.astro` | Interfaz: portada, HUD, diálogo, tarjeta, diario, carta, controles táctiles |
| `src/game/world.ts` | Mapa de la isla: forma, paradas, camino, casa, faro y objetos |
| `src/game/terrain.ts` | Dibujo del terreno: mar, playa, acantilados, hierba, estanque, muelle |
| `src/game/props.ts` | Árboles, pinos, rocas e islotes con volumen |
| `src/game/sprites.ts` | Personajes en SVG (originales) |
| `src/game/main.ts` | Motor: movimiento, cámara, paradas, diálogos |
| `src/game/audio.ts` | Voces y música sintetizadas (sin archivos) |

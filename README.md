# Hitster — Edición Clásicos

Juego musical estilo Hitster donde los jugadores escuchan fragmentos de canciones y las ubican cronológicamente en su línea de tiempo.

## 🚀 Stack

- **Astro** + **Svelte** + **Tailwind CSS v4**
- **Firebase** (Firestore + Hosting)
- **Deezer** para audio previews y portadas (archivos locales pre-descargados + búsqueda en tiempo real para sugerencias)
- **iTunes** como fuente primaria de búsqueda en sugerencias (año, portada, metadata)
- **MusicBrainz** como fallback para obtener año original de canciones
- **corsproxy.io** como proxy CORS para búsquedas en Deezer desde el navegador

## 🧞 Comandos

| Comando                              | Acción                                                |
| :----------------------------------- | :---------------------------------------------------- |
| `npm install`                        | Instalar dependencias                                 |
| `npm run dev`                        | Servidor local en `localhost:4321`                    |
| `npm run build`                      | Build de producción en `./dist/`                      |
| `npm run deploy`                     | Build + deploy a Firebase + limpia dist               |
| `node scripts/descargar-previews.js` | Descargar MP3 y portadas de Deezer para clasicos.json |
| `node scripts/arreglar-faltantes.js` | Corregir y descargar canciones faltantes              |

## ⚙️ Configuración

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Activa Firestore y Hosting
3. Copia `.env.example` a `.env` y llena con tus credenciales de Firebase
4. Crea un `.firebaserc` con tu proyecto:

```json
{
  "projects": { "default": "tu-proyecto-id" }
}
```

5. Descarga las canciones: `node scripts/descargar-previews.js`
6. `npm run deploy`

## 🎮 Modos de juego

### Clásico (Local + Online)

- Coloca canciones en orden cronológico
- 3 skips gratuitos por jugador
- 10 puntos para ganar

### Original (Solo Online)

- Reglas oficiales con fichas HITSTER
- Cada jugador empieza con 2 fichas (máximo 5)
- Ganar fichas: adivinar artista + canción en tu turno = +1 ficha
- Saltar canción (1 ficha), Gritar HITSTER (1 ficha), Canjear 3 fichas por carta
- HITSTER: si el activo falla, el que gritó elige posición en su línea para robarse la carta
- Cola de múltiples jugadores que gritan HITSTER
- 10 cartas en la línea para ganar

### Bingo (Solo Online)

- Todos juegan simultáneamente, no hay turnos
- Cartón 5x5 con 5 categorías (5 casillas de cada una, distribuidas al azar)
- 5 categorías: Título, Año exacto, Artista, Década, Antes del 2000 (Sí/No)
- Se reproduce canción para todos al mismo tiempo (sincronizado)
- 25 segundos para responder, timer visible
- Los que aciertan marcan una casilla de esa categoría (a elección)
- Completar fila, columna o diagonal para ganar
- Desempate por muerte súbita si dos completan línea en la misma ronda
- Tutorial interactivo (2 slides)
- Ver cartón de otros jugadores al presionar su nombre

### Avanzado (Solo Online)

- Tutorial interactivo al inicio (3 slides, espera a que todos estén listos)
- Todos empiezan con 1⚡
- Adivina artista/canción para ganar ⚡ poderes
- Año + artista = 1⚡ | Año + canción = 1⚡ | Año + ambos = 3⚡
- Poderes:
  - ⏭️ **Saltar** (1⚡) — Salta la canción actual
  - 🔍 **Pista** (2⚡) — Muestra rango de 2 décadas
  - 🔀 **Intercambio** (2⚡) — Intercambia una carta tuya por una de otro jugador
  - 🔥 **Modo difícil** (2⚡) — Sorpresa: el rival no sabe hasta su turno
  - 🎵 **Doble o nada** (3⚡) — Acierta = 2 puntos, falla = pierde carta y 1 punto
  - 🎯 **Desafío** (1⚡) — Cola de múltip les desafiantes por orden de activación
- Límite: 1 uso por turno de cada tipo (excepto Saltar)

## 🔊 Audio

- 953 canciones (clásicos en español + clásicos en inglés + rock/pop en inglés)
- Previews MP3 (~30s) en `public/audio/`, portadas JPG en `public/images/covers/`
- Canciones originales: archivos locales, cero requests externos
- Canciones sugeridas: se busca audio en Deezer al momento de reproducir
- Sugerencias se guardan en Firestore (colección `sugerencias`)
- Historial de 700 canciones jugadas en localStorage para evitar repeticiones

## 📱 Responsividad

- **Móvil** (<768px): layout columna, grid 4 columnas, navbar compacto
- **Tablet vertical** (768-1023px): layout columna, grid 5 columnas
- **Tablet horizontal** (1024-1279px): layout fila, grid 6 columnas, carta 320px
- **Desktop** (1280px+): layout fila, grid 7 columnas, carta 420px
- Cards expandidas con escala reducida en pantallas pequeñas
- Sala se borra al terminar partida o cuando todos salen

## � Estructura

```
src/
├── components/
│   ├── avanzado/
│   │   ├── CartaActualAvanzada.svelte  # Carta modo avanzado con bonus
│   │   ├── PanelPoderes.svelte         # Barra de poderes
│   │   ├── ValidacionAvanzada.svelte   # Validación artista/canción
│   │   ├── NotificacionAlerta.svelte   # Alertas neon (modo difícil, salir, tutorial)
│   │   ├── TutorialAvanzado.svelte     # Tutorial interactivo (3 slides)
│   │   ├── SelectorJugador.svelte      # Popup elegir jugador
│   │   ├── SelectorCarta.svelte        # Popup intercambio de cartas
│   │   ├── PopupDesafio.svelte         # Popup desafío (con audio propio)
│   │   └── PopupBloqueo.svelte         # Popup bloqueo (no implementado)
│   ├── bingo/
│   │   ├── JuegoBingo.svelte            # Juego bingo online
│   │   ├── CartonBingo.svelte           # Cartón 5x5 con categorías
│   │   ├── TutorialBingo.svelte         # Tutorial bingo (2 slides)
│   │   └── PantallaFinBingo.svelte      # Pantalla fin modo bingo
│   ├── Juego.svelte                    # Orquestador principal
│   ├── JuegoOnline.svelte              # Juego online con Firestore
│   ├── CartaActual.svelte              # Carta modo clásico
│   ├── Coleccion.svelte                # Línea de tiempo
│   ├── Marcador.svelte                 # Scoreboard
│   ├── PantallaInicio.svelte           # Inicio con efecto neón
│   ├── PantallaSetup.svelte            # Config local
│   ├── PantallaOnline.svelte           # Crear/unir sala
│   ├── PantallaLobby.svelte            # Lobby con QR
│   ├── PantallaFin.svelte              # Rankings + confetti
│   └── FormularioSugerencia.svelte     # Sugerir canciones
├── lib/
│   ├── poderes.js      # Lógica de poderes + pista inteligente
│   ├── gameLogic.js    # Canciones (JSON local + sugerencias Firestore), mazo, validación
│   ├── salas.js        # Firestore rooms + reconexión
│   ├── firebase.js     # Lazy Firebase init
│   ├── firestore.js    # Operaciones Firestore (sugerencias + canciones)
│   ├── audio.js        # Deezer search (proxy CORS) + control audio
│   ├── sfx.js          # Efectos de sonido
│   ├── visualizer.js   # Visualizador circular
│   └── storage.js      # localStorage partida local
├── data/
│   └── clasicos.json   # 953 canciones con rutas locales de audio/portada
├── styles/
│   └── global.css      # Estilos custom + neon cards
└── pages/
    └── index.astro     # Página principal

public/
├── audio/              # 953+ MP3 previews (~30s cada uno)
└── images/covers/      # 953+ portadas JPG
```

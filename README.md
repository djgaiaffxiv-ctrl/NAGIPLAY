<div align="center">

<img src="build/icon.png" width="96" alt="NAGIPLAY" />

# NAGIPLAY

**Reproductor de vídeo de NAGI STUDIOS** — un clon de VLC con estética premium y herramientas modernas.

</div>

---

## ✨ Características

- 🎬 **Reproductor completo** estilo VLC: lista de reproducción, aleatorio y repetición (todos / uno).
- 💬 **Subtítulos** `.srt` / `.vtt` con desfase ajustable.
- ⏩ **Velocidad** 0.25× – 4×, relación de aspecto y **capturas** PNG.
- 🖥️ **Pantalla completa inmersiva** (doble clic) y modo **siempre visible**.
- 💾 **Recuerda tu configuración** (volumen, repetición, velocidad…).
- ✂️ **Recortar vídeo → MP4**: corta cualquier fragmento y expórtalo (Original · Vertical 9:16 · Cuadrado 1:1, con recorte o fondo difuminado). Usa **FFmpeg** incrustado.
- 🎵 **Mini-reproductor** acoplado a la barra de tareas al minimizar: carátula, controles, progreso, repetición y volumen.
- 🎛️ Interfaz con iconos propios y branding NAGI (turquesa + acento coral).

## ⌨️ Atajos

| Tecla | Acción | Tecla | Acción |
|---|---|---|---|
| Espacio | Reproducir / Pausa | `F` / doble clic | Pantalla completa |
| `←` / `→` | ±5 s (Shift = 1 min) | `↑` / `↓` | Volumen |
| `M` | Silenciar | `S` | Detener |
| `N` / `P` | Siguiente / Anterior | `+` / `-` | Velocidad |
| `L` | Repetir | `0`–`9` | Saltar al 0%–90% |
| `Ctrl`+`O` / `Ctrl`+`F` | Abrir archivo / carpeta | `Ctrl`+`S` | Captura |

## 🚀 Uso (desde el código)

```bash
npm install
npm start
```

## 📦 Crear instalador (Windows)

```bash
npm run dist
```

Genera `dist/NAGIPLAY Setup x.x.x.exe` (NSIS) con FFmpeg incluido.

## 🛠️ Tecnología

Electron · FFmpeg (`ffmpeg-static`) · HTML/CSS/JS.

---

<div align="center">

© 2026 **NAGI STUDIOS**

</div>

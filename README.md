# Group MBC · Landing

Sitio estático de una sola página (HTML + CSS + JS vanilla) para **Group MBC** — Muebles · Bienes · Construcción. Vende lotes en parcelación en **Venecia** y **Barbosa** (Antioquia, Colombia) y dirige toda conversión a WhatsApp.

Listo para desplegar en **Vercel** sin pasos de build.

---

## 🚀 Deploy

```bash
# Vercel (recomendado)
vercel deploy

# o subir la carpeta a cualquier hosting estático (Netlify, Cloudflare Pages, S3, etc.)
```

No hay backend, no hay build, no hay dependencias.

### Vista previa local

```bash
# Python (incluido en Mac/Linux)
python3 -m http.server 5173

# Node
npx serve .
```

Luego abrir `http://localhost:5173`.

---

## ✏️ Las 3 cosas que vas a querer editar

### 1) Número de WhatsApp — **una sola línea**

Archivo: `script.js`, línea ~10

```js
const WHATSAPP_NUMBER = '573000000000'; // ← cambiar acá. Formato internacional sin "+".
```

Reemplázalo por el número real (ej. `573001234567`). Todos los botones del sitio (header, hero, secciones, footer, FAB flotante) usan ese mismo valor.

Si querés ajustar los mensajes pre-llenados, están justo debajo en `WHATSAPP_MESSAGES`.

### 2) Precios y specs de Venecia

Archivo: `index.html`

- **Sección hero**: la línea "Desde $180.000.000" está en el bloque `.hero__meta` (~línea 110).
- **Card del selector**: bloque `<dl class="project-card__stats">` dentro de la card de Venecia (~línea 165).
- **Specs detalladas**: bloque `<ul class="specs">` dentro de `#venecia` (~línea 230). Aquí están área, precio, financiación, escritura, licencia, servicios, etc.

### 3) Specs de Barbosa (placeholders marcados como TODO)

Archivo: `index.html`, buscar el comentario:

```html
<!-- TODO: actualizar specs definitivos de Barbosa cuando estén confirmados (área, precio) -->
```

Justo debajo está la lista `<ul class="specs">` con valores placeholder ("Por definir", "A consultar"). Reemplazá los `<strong>` con los valores reales cuando estén confirmados.

---

## 🖼️ Dónde dejar las imágenes

Reemplazá cada archivo en `/assets/` manteniendo el mismo nombre. El layout ya está dimensionado y nunca se rompe — si una imagen no existe, se muestra un placeholder con fondo discreto y la etiqueta **"imagen pendiente"** (mantiene el aspect ratio correcto).

**Logo**: por defecto se renderiza un monograma SVG de respaldo (inline en `index.html`, header + footer). Cuando tengás el PNG real, busca el comentario `<!-- Logo: ... -->` en `index.html` y reemplazá el bloque `<svg>` por:

```html
<img class="brand__logo" src="/assets/logo.png" alt="Group MBC" width="160" height="48">
```

(y lo mismo en el footer con `class="footer__logo"`).

```
/assets/
├── logo.png                       ← logo de la marca (transparente preferido — opcional, ver arriba)
│
├── venecia/
│   ├── hero.jpg     (1920×1080)   ← imagen de fondo del hero
│   ├── card.jpg     (1200×900)    ← card del selector de proyectos
│   ├── g1.jpg       (1200×1500)   ← galería · imagen grande (portrait)
│   ├── g2.jpg       (1200×900)    ← galería
│   ├── g3.jpg       (1200×900)    ← galería
│   ├── g4.jpg       (1200×900)    ← galería
│   └── plano.jpg    (1600×1200)   ← plano maestro del proyecto
│
└── barbosa/
    ├── hero.jpg
    ├── card.jpg
    ├── g1.jpg       (portrait)
    ├── g2.jpg, g3.jpg, g4.jpg
    └── plano.jpg
```

**Recomendaciones:**

- Formato **JPG** (foto) o **WebP** (mejor compresión, soportado en todos los navegadores modernos).
- Comprimir antes de subir (TinyPNG, Squoosh) — apuntar a **< 250 KB** por imagen para el hero, **< 120 KB** para galerías.
- Para el `hero.jpg`, elegir una foto con buena densidad en la parte izquierda/inferior (donde van logo, titular y CTAs).
- Si usás otra extensión que `.jpg` (ej. `.webp`), actualizá las referencias en `index.html`.

---

## 🎨 Decisiones de diseño (tomadas por el agente)

Síntesis de patrones de Sotheby's International Realty, The Agency, Aman Residences, Six Senses, sitios premiados en Awwwards — pero hechos propios para Group MBC.

1. **Paleta dominante negro + oro**, con crema para el cuerpo y terracota usado solo en gradientes muy suaves del banner CTA. Coherente con el monograma angular del logo.
2. **Tipografía editorial**: Playfair Display (display, con itálicas doradas para palabras-acento) + Poppins (cuerpo). Los titulares grandes funcionan como portada de revista.
3. **Numeración de secciones** (`01 — Proyectos`, `02 — Venecia` ...) como guiño art-deco / editorial.
4. **Divisores con diamante dorado** centrado — eco del lenguaje geométrico del logo.
5. **Marco doble en el plano** maestro (figura "framed"), tratado como pieza de archivo, no como ilustración técnica.
6. **Galerías asimétricas** (1 imagen vertical grande + 3 horizontales) — patrón editorial mejor que cuadrículas uniformes.
7. **Card de proyecto con esquinas doradas que aparecen al hover** — detalle art-deco sutil sin saturar.
8. **Hero scroll-to-expand** (inspirado en el componente `ScrollExpandMedia` de 21st.dev, portado a vanilla JS): el hero arranca con un retrato enmarcado en oro al centro y el titular `Tu pedazo de · Antioquia te espera` partido en dos líneas que, al desplazarse, se separan hacia los costados mientras la foto crece a casi-pantalla-completa y el fondo se atenúa. Al terminar la expansión, lede + CTAs entran con fade y el scroll natural se libera. Soporta rueda, táctil y teclado (↓, Espacio, Re-Pág, Fin). Si el usuario vuelve al tope desplazándose hacia arriba, el efecto se re-bloquea (paridad con el componente original). Respeta `prefers-reduced-motion` mostrando el hero ya expandido sin lock.
9. **FAB flotante de WhatsApp** (botón circular dorado abajo a la derecha) — patrón de conversión estándar en real-estate de LATAM, especialmente en mobile.
10. **Grain overlay** muy sutil (6% opacidad, blend overlay) en toda la página para evitar la sensación "plana" típica de las webs AI-slop.
11. **Reveals al scroll** con `IntersectionObserver` — animación de fade + translate suave (no parallax, no flashy) en las secciones bajo el hero.
12. **Mobile-first**: menú lateral colapsado, FAB siempre visible, type-scale fluido con `clamp()`, gallery se apila en 2 columnas.
13. **Placeholders de imágenes con marca**: cuando una imagen falta, se muestra un fondo con líneas diagonales sutiles + label "Imagen pendiente" en oro. Así el cliente puede ver el layout terminado antes de tener fotos finales.
14. **Logo como SVG inline por defecto**: el monograma de respaldo está embebido directamente en el HTML (header + footer). Esto garantiza render correcto desde el primer paint y elimina dependencia de archivos faltantes. Reemplazable por `<img src="/assets/logo.png">` cuando se tenga el logo real (instrucción en este README).
15. **Accesibilidad**: skip-link, landmarks semánticos, focus visible dorado, `prefers-reduced-motion` respetado, contraste validado (cream/black AAA, gold/black AA+).

### Lo que **no** se hizo (deliberadamente)

- Sin azules/grises corporativos. Sin gradientes morados. Sin "shadcn beige".
- Sin parallax pesado, sin scroll-jacking, sin animaciones Lottie.
- Sin formulario de contacto — el brief pide WhatsApp como único canal de conversión.
- Sin biblioteca externa de JS (motion, gsap, etc.). Todo es vanilla.

---

## 📁 Estructura

```
.
├── index.html       ← markup completo
├── styles.css       ← sistema de diseño (~1 archivo, organizado por secciones)
├── script.js        ← WhatsApp + menú + reveals + logo fallback
├── vercel.json      ← deploy
├── README.md
└── assets/
    ├── logo.png
    ├── venecia/  (hero, card, g1-g4, plano)
    └── barbosa/  (hero, card, g1-g4, plano)
```

---

## 🔧 Pequeñas personalizaciones rápidas

- **Cambiar Instagram**: en `index.html` buscar `instagram.com/` y reemplazar por la URL real.
- **Ajustar paleta**: las variables CSS están al principio de `styles.css` (`:root { --gold: ... }`).
- **Cambiar tipografías**: el `<link>` de Google Fonts está en el `<head>` de `index.html` y las `--font-display` / `--font-body` en `styles.css`.

---

## 📜 Licencia

Código propietario de Group MBC. Uso interno.

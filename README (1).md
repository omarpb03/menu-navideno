# Tienda del Menú Navideño

Página web estática (sin servidor, sin claves, gratis). Los clientes arman su pedido y se les abre WhatsApp con el mensaje ya redactado.

## Archivos
| Archivo | Para qué sirve |
|---|---|
| `menu.js` | **El único que se edita**: platillos, precios, salsas, fechas de entrega y número de WhatsApp |
| `index.html` | Diseño de la página |
| `app.js` | Lógica (carrito, asistente, mensaje de WhatsApp) |

## Antes de publicar (en `menu.js`)
1. `whatsapp`: pon el número que recibirá los pedidos, con código de país y sin `+` ni espacios. Ej. `"5215512345678"`.
2. `fechaMin`, `fechaMax`, `fechasNoDisponibles`, `horarios`: ajusta las fechas reales de entrega.
3. Revisa precios y platillos.

## Probar en tu computadora
Haz doble clic en `index.html`. Se abre en el navegador.

## Publicar en GitHub Pages
1. Crea un repositorio nuevo en GitHub (público, p. ej. `menu-navideno`).
2. Sube los 3 archivos (`index.html`, `app.js`, `menu.js`) a la raíz del repositorio.
3. En el repositorio: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, rama `main`, carpeta `/ (root)` → Save.
4. En 1–2 minutos aparece el link: `https://TU-USUARIO.github.io/menu-navideno/`. Ese es el que se manda a los clientes.

Para cambiar algo después: edita `menu.js` en GitHub (ícono del lápiz) y guarda; la página se actualiza sola en un par de minutos.

## Cómo editar el menú
Cada platillo en `menu.js` es un bloque como este:

```js
{
  id: "pavo", cat: "fuertes", rol: "fuerte",
  nombre: "Pavo relleno",
  desc: "El clásico de la mesa navideña.",
  precio: 450, unidad: "kg",          // "kg", "lt" o "pza"
  tags: ["tradicional", "elegante"],  // para el asistente
  contiene: [],                       // "cerdo", "mariscos", "frutos_secos", "queso"
  opciones: [ { id: "salsa", titulo: "Salsa", requerida: true, multiple: false,
                elecciones: [{ nombre: "A la naranja" }, { nombre: "Adobado" }] } ],
}
```
- Para **quitar** un platillo, bórralo (o comenta el bloque).
- `contiene` / `posibleContiene` es lo que usa el asistente para evitar ingredientes. **Mantenlo al día** si cambian las recetas.
- Una opción con costo extra: `{ nombre: "12 personas", extra: 800 }`.

## Fotos de los platillos (opcional, recomendado)
El diseño está pensado para fotos grandes. Mientras no haya fotos propias de cada platillo, las tarjetas y la portada usan `fotos/fondo.jpg` (la imagen navideña), con otro encuadre en cada tarjeta. **Sube la carpeta `fotos/` junto con `index.html`**, o las imágenes no aparecerán.

Para cambiar el fondo, reemplaza `fotos/fondo.jpg` por otra imagen con el mismo nombre (mejor si mide al menos 1600 px de ancho).
1. Crea una carpeta `fotos/` junto a `index.html` y sube ahí las imágenes (mejor horizontales, ~1000 px de ancho, formato `.jpg`).
2. En `menu.js`, agrega `foto: "fotos/pavo.jpg",` al platillo correspondiente.

## Importante
- El asistente es una guía de preguntas por botones: solo recomienda platillos del menú.
- El filtro de "no comen X" se basa en `contiene`. Para alergias reales, confirmar siempre por WhatsApp.
- El total es estimado; el costo de envío y la disponibilidad se confirman por WhatsApp.

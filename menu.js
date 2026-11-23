/* =============================================================================
   MENU.JS — AQUÍ SE EDITA TODO LO QUE CAMBIA: menú, precios, fechas y WhatsApp.
   No hace falta tocar index.html ni app.js.
   ============================================================================= */

const CONFIG = {
  titulo: "Menú Navideño 2026",
  lema: "Elige, personaliza y envía tu pedido por WhatsApp. Todo se cocina bajo pedido.",

  // Número de WhatsApp que recibe los pedidos: código de país + número, sin + ni espacios.
  // Ejemplo México: "5215512345678"
  whatsapp: "525515882468",

  // Fechas de entrega disponibles (formato AAAA-MM-DD)
  fechasEntrega: ["2026-12-24", "2026-12-31"],
  avisoFechas: "Entregas el 24 y el 31 de diciembre, para recoger en casa. Recibimos pedidos hasta el 20 de diciembre.",
  notaRecoger: "Te enviamos la dirección por WhatsApp al confirmar tu pedido.",
  // Texto al final de la página. Déjalo vacío ("") para no mostrarlo.
  firma: "By Rosario y Josefina",     // ← CAMBIA ESTO por sus nombres

  pedidoMinimo: 0,                    // en pesos; 0 = sin mínimo
};

const CATEGORIAS = [
  { id: "fuertes",      nombre: "Platos fuertes", color: "#a6283a" },
  { id: "guarniciones", nombre: "Tradicionales y guarniciones", color: "#c99a3b" },
  { id: "pastas",       nombre: "Pastas", color: "#d97b29" },
  { id: "ensaladas",    nombre: "Ensaladas", color: "#4f8a5b" },
  { id: "cremas",       nombre: "Cremas", color: "#8a6a3f" },
  { id: "postres",      nombre: "Postres", color: "#b5546a" },
  { id: "horneado",     nombre: "Servicio de horneado", color: "#6b4f3a" },
];

/* -----------------------------------------------------------------------------
   PLATILLOS
   - foto (opcional): ruta de una imagen, ej. "fotos/pavo.jpg". Si no hay, se usa la imagen de fondo
   - oculto: true → el platillo NO aparece en la tienda (útil si se acabó o aún no tiene precio).
     Para mostrarlo otra vez, borra esa línea o pon false.
   - unidad: "kg" | "lt" | "pza"
   - rol (solo para el asistente): "fuerte" | "guarnicion" | "entrada"
   - tags (asistente): tradicional, mexicano, italiano, queso, ligero,
                       compartir (para amigos), elegante (para cena íntima)
   - contiene: ingredientes seguros → el asistente los evita si el cliente lo pide
     (cerdo, mariscos, frutos_secos, queso)
   - posibleContiene: ingredientes probables pero sin confirmar (se evitan por precaución)
   - opciones: grupos de elección (salsa, corte, tamaño…); "extra" suma al precio
   ----------------------------------------------------------------------------- */
const PLATILLOS = [
  /* ---------------- PLATOS FUERTES ---------------- */
  {
    id: "lomo-mechado", cat: "fuertes",
    foto: "fotos/lomo-mechada.png", rol: "fuerte", familia: "lomo",
    nombre: "Lomo o pierna de cerdo mechada",
    desc: "Mechada, con la salsa que elijas.",
    precio: 470, unidad: "kg",
    tags: ["tradicional", "compartir"], contiene: ["cerdo"],
    opciones: [
      { id: "corte", titulo: "Corte", requerida: true, multiple: false,
        elecciones: [{ nombre: "Lomo" }, { nombre: "Pierna" }] },
      { id: "salsa", titulo: "Salsa", requerida: true, multiple: false,
        elecciones: [{ nombre: "Adobo" }, { nombre: "Tamarindo" }, { nombre: "Braseado" }] },
    ],
  },
  {
    id: "lomo-relleno", cat: "fuertes", 
    foto: "fotos/lomo-rellena.jpg", rol: "fuerte", familia: "lomo",
    nombre: "Lomo o pierna de cerdo rellena",
    desc: "Rellena, con la salsa que elijas.",
    precio: 510, unidad: "kg",
    tags: ["tradicional", "elegante"], contiene: ["cerdo"],
    opciones: [
      { id: "corte", titulo: "Corte", requerida: true, multiple: false,
        elecciones: [{ nombre: "Lomo" }, { nombre: "Pierna" }] },
      { id: "salsa", titulo: "Salsa", requerida: true, multiple: false,
        elecciones: [{ nombre: "Adobo" }, { nombre: "Tamarindo" }, { nombre: "Braseado" }] },
    ],
  },
  {
    id: "pavo", cat: "fuertes", 
    foto: "fotos/pavo-relleno.jpg", rol: "fuerte",
    nombre: "Pavo relleno",
    desc: "El clásico de la mesa navideña, con la salsa que prefieras.",
    precio: 540, unidad: "kg",
    tags: ["tradicional", "elegante"], contiene: [],
    opciones: [
      { id: "salsa", titulo: "Salsa", requerida: true, multiple: false,
        elecciones: [{ nombre: "A la naranja" }, { nombre: "Adobado" }, { nombre: "A las hierbas finas" }] },
    ],
  },
  {
    id: "costillitas", cat: "fuertes", 
    foto: "fotos/costillas-cerdo.avif", rol: "fuerte",
    nombre: "Costillitas de cerdo",
    desc: "Costillitas en la salsa que elijas.",
    precio: 430, unidad: "kg",
    tags: ["compartir", "tradicional"], contiene: ["cerdo"],
    opciones: [
      { id: "salsa", titulo: "Salsa", requerida: true, multiple: false,
        elecciones: [{ nombre: "BBQ" }, { nombre: "Adobadas" }, { nombre: "Tamarindo" }] },
    ],
  },
  {
    id: "cochinita", cat: "fuertes", 
    foto: "fotos/cochinita-pibil.png", rol: "fuerte",
    nombre: "Cochinita pibil",
    desc: "Cochinita pibil por kilo.",
    precio: 430, unidad: "kg",
    tags: ["mexicano", "compartir"], contiene: ["cerdo"],
  },
  {
    id: "lasagna", cat: "fuertes", 
    foto: "fotos/lasagna.webp", rol: "fuerte",
    nombre: "Lasagna",
    desc: "Charola de lasagna para 6 o para 12 personas.",
    precio: 1200, unidad: "pza", unidadSing: "charola", unidadPlur: "charolas",
    precioEtiqueta: "Desde $1,200",
    tags: ["italiano", "queso", "compartir"], contiene: ["queso"],
    opciones: [
      { id: "tamano", titulo: "Tamaño", requerida: true, multiple: false,
        elecciones: [{ nombre: "6 personas", extra: 0 }, { nombre: "12 personas", extra: 800 }] },
    ],
  },
  {
    id: "bacalao", cat: "fuertes", rol: "fuerte",
    nombre: "Bacalao a la vizcaína",
    desc: "El plato de Nochebuena por excelencia.",
    precio: 700, unidad: "kg",          // POR CONFIRMAR: en la hoja está tachado 700 / 680
    tags: ["tradicional", "elegante"], contiene: ["mariscos"],
  },
  {
    id: "pollo-relleno", cat: "fuertes",    // sin "rol": el asistente no lo propone (faltan porciones)
    nombre: "Pollo relleno",
    desc: "Pollo relleno, listo para la mesa.",
    precio: 680, unidad: "pza", unidadSing: "pollo", unidadPlur: "pollos",   // POR CONFIRMAR: $900 por pollo
    precioEtiqueta: "$900 · por pollo",
    tags: ["tradicional"], contiene: [],
  },
  {
    id: "pechuga-nochebuena", cat: "fuertes",
    foto: "fotos/pechuga-nochebuena.jpg", 
    nombre: "Pechuga Nochebuena",
    desc: "Orden de 4 piezas.",
    precio: 430, unidad: "pza", unidadSing: "orden (4 piezas)", unidadPlur: "órdenes (4 piezas)",
    precioEtiqueta: "$430 · orden de 4 piezas",
    tags: ["tradicional"], contiene: [],
  },

  /* ---------------- TRADICIONALES Y GUARNICIONES ---------------- */
  {
    id: "romeritos", cat: "guarniciones", rol: "guarnicion",
    nombre: "Romeritos",
    desc: "Tradición de la cena navideña mexicana.",
    precio: 330, unidad: "kg",
    tags: ["tradicional", "mexicano"], contiene: [], posibleContiene: ["mariscos"],
  },

  {
    id: "papa-gratin", cat: "guarniciones", rol: "guarnicion",
    nombre: "Papa gratin",
    desc: "Papa, jamón, queso y crema.",
    precio: 320, unidad: "kg",
    tags: ["queso", "elegante"], contiene: ["queso"], posibleContiene: ["cerdo"],
  },

  /* ---------------- PASTAS ---------------- */
  {
    id: "bavette", cat: "pastas", rol: "entrada",
    nombre: "Bavette con camarones",
    desc: "Bavette con camarones.",
    precio: 380, unidad: "kg",
    tags: ["italiano", "elegante"], contiene: ["mariscos"],
  },
  {
    id: "fusilli", cat: "pastas", rol: "entrada",
    nombre: "Fusilli Mediterráneo",
    desc: "Fusilli estilo mediterráneo.",
    precio: 320, unidad: "kg",
    tags: ["italiano", "compartir", "ligero"], contiene: [],
  },
  {
    id: "espagueti", cat: "pastas", rol: "entrada",
    nombre: "Espagueti provenzal",
    desc: "Espagueti provenzal.",
    precio: 300, unidad: "kg",
    tags: ["italiano", "compartir"], contiene: [],
  },

  /* ---------------- ENSALADAS ---------------- */
  {
    id: "ens-manzana", cat: "ensaladas", rol: "entrada",
    nombre: "Ensalada de manzana",
    desc: "Clásica ensalada de manzana navideña.",
    precio: 380, unidad: "kg",
    tags: ["tradicional", "ligero"], contiene: [],
  },
  {
    id: "ens-waldorf", cat: "ensaladas", rol: "entrada",     // reemplaza a la Ensalada OMI
    nombre: "Ensalada Waldorf",
    desc: "Ensalada Waldorf con queso cottage.",
    precio: 380, unidad: "pza", unidadSing: "ensalada (4 personas)", unidadPlur: "ensaladas (4 personas)",
    personas: 4,
    precioEtiqueta: "$380 · 4 personas",
    tags: ["ligero", "queso", "elegante"], contiene: ["queso"], posibleContiene: ["frutos_secos"],
  },
  {
    id: "ens-fresosa", cat: "ensaladas", rol: "entrada",
    nombre: "Ensalada Fresosa",
    desc: "Lechuga, fresas, nueces, amaranto caramelizado y queso de cabra.",
    precio: 380, unidad: "pza", unidadSing: "ensalada (4 personas)", unidadPlur: "ensaladas (4 personas)",
    personas: 4,
    precioEtiqueta: "$380 · 4 personas",
    tags: ["ligero", "queso", "elegante"], contiene: ["frutos_secos", "queso"],
  },
  {
    id: "ens-manzana-verde", cat: "ensaladas", rol: "entrada",
    nombre: "Ensalada de manzana verde",
    desc: "Espinacas, manzana verde, nuez caramelizada y queso cottage.",
    precio: 380, unidad: "pza", unidadSing: "ensalada (4 personas)", unidadPlur: "ensaladas (4 personas)",
    personas: 4,
    precioEtiqueta: "$380 · 4 personas",
    tags: ["ligero", "queso"], contiene: ["frutos_secos", "queso"],
  },

  /* ---------------- CREMAS ---------------- */
  {
    id: "crema-champi", cat: "cremas", rol: "entrada",
    nombre: "Crema de champiñones",
    desc: "Se vende por litro.",
    precio: 280, unidad: "lt",
    tags: ["tradicional", "elegante"], contiene: [],
  },
  {
    id: "crema-brocoli-nuez", cat: "cremas", rol: "entrada",
    nombre: "Crema de brócoli con nuez",
    desc: "Se vende por litro.",
    precio: 280, unidad: "lt",
    tags: ["tradicional", "elegante"], contiene: ["frutos_secos"],
  },

  /* ---------------- POSTRES ---------------- */
  // POR CONFIRMAR: en la hoja hay dos precios (300 y 450) junto a la lista; supuse flan 300 y cheesecake 450.
  {
    id: "flan", cat: "postres",
    nombre: "Flan napolitano",
    desc: "Flan napolitano.",
    precio: 230, unidad: "pza", unidadSing: "flan", unidadPlur: "flanes",
    precioEtiqueta: "$230 · por flan",
    tags: ["tradicional"], contiene: [],
  },
  {
    id: "cheesecake", cat: "postres",
    nombre: "Cheesecake",
    desc: "Cheesecake con compota de frutos del bosque.",
    precio: 450, unidad: "pza", unidadSing: "cheesecake", unidadPlur: "cheesecakes",
    precioEtiqueta: "$450 · por cheesecake",
    tags: ["queso"], contiene: ["queso"],
  },
  // Los panqués no tienen precio en la hoja: quedan ocultos. Escribe el precio y quita "oculto".
  {
    id: "panque-zanahoria", cat: "postres",
    nombre: "Panqué de zanahoria",
    desc: "Panqué de zanahoria con frosty de queso crema.",
    precio: 250, unidad: "pza", unidadSing: "panqué", unidadPlur: "panqués",
    tags: ["tradicional"], contiene: [],
  },
  {
    id: "rosca-naranja",                 // nombre único, sin espacios ni acentos
    cat: "postres",                      // categoría donde aparece
    foto: "fotos/rosca-naranja.jpeg",     // opcional: borra esta línea si todavía no hay foto
    nombre: "Rosca de naranja confitada y almendra",
    desc: "Rosca con naranja confitada.",
    precio: 220,                         // PON AQUÍ EL PRECIO
    unidad: "pza", unidadSing: "rosca", unidadPlur: "roscas",
    precioEtiqueta: "$220 · por rosca",  // cambia el número igual que arriba
    tags: ["tradicional"], contiene: [],
  },
  {
    id: "panque-naranja", cat: "postres",
    nombre: "Panqué de naranja Confitada",
    foto:"fotos/panque-naranja.jpeg",
    desc: "Panqué de naranja.",
    precio: 140 , unidad: "pza", unidadSing: "panqué", unidadPlur: "panqués",
    tags: ["tradicional"], contiene: [],
  },
  {
    id: "panque-frutos-secos", cat: "postres",
    nombre: "Panqué de frutos secos",
    desc: "Nuevo.",
    precio: 140, unidad: "pza", unidadSing: "panqué", unidadPlur: "panqués",
    tags: ["tradicional"], contiene: ["frutos_secos"],
  },

  /* ---------------- SERVICIO DE HORNEADO ---------------- */
  // Se cobra por pieza. Oculto hasta definir el precio: pon el precio en "precio" y,
  // si cuesta distinto según la pieza, un "extra" en cada elección. Luego quita "oculto".
  {
    id: "horneado", cat: "horneado",
    nombre: "Horneado de tu pieza",
    desc: "Horneamos tu pavo, pierna, lomo u otra pieza. Se cobra por charola, independientemente del peso; indica en la nota qué traes y a qué hora lo necesitas.",
    precio: 330, unidad: "pza", unidadSing: "charola", unidadPlur: "charolas",
    precioEtiqueta: "Por charola",
    tags: [], contiene: [],
    opciones: [      // solo sirve para que sepamos qué llega; no cambia el precio
      { id: "pieza", titulo: "Pieza a hornear", requerida: true, multiple: false,
        elecciones: [{ nombre: "Pavo" }, { nombre: "Pierna de cerdo" }, { nombre: "Lomo de cerdo" },
                     { nombre: "Pollo" }, { nombre: "Otra pieza" }] },
    ],
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CONFIG, CATEGORIAS, PLATILLOS };
}

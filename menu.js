/* =============================================================================
   MENU.JS — AQUÍ SE EDITA TODO LO QUE CAMBIA: menú, precios, fechas y WhatsApp.
   No hace falta tocar index.html ni app.js.
   ============================================================================= */

const CONFIG = {
  titulo: "Menú Navideño 2026",
  lema: "Elige, personaliza y envía tu pedido por WhatsApp. Todo se cocina bajo pedido.",

  // Número de WhatsApp que recibe los pedidos: código de país + número, sin + ni espacios.
  // Ejemplo México: "5215512345678"
  whatsapp: "525538385080",

  // Fechas de entrega disponibles (formato AAAA-MM-DD)
  fechaMin: "2026-12-18",
  fechaMax: "2026-12-31",
  fechasNoDisponibles: [],            // ej. ["2026-12-25"]
  horarios: ["Mañana (9:00 – 13:00)", "Tarde (13:00 – 18:00)"],

  avisoFechas: "Entregas del 18 al 31 de diciembre. Pide con anticipación.",
  notaDomicilio: "El costo de envío se confirma por WhatsApp.",
  pedidoMinimo: 0,                    // en pesos; 0 = sin mínimo
};

const CATEGORIAS = [
  { id: "fuertes",      nombre: "Platos fuertes", color: "#a6283a" },
  { id: "guarniciones", nombre: "Tradicionales y guarniciones", color: "#c99a3b" },
  { id: "pastas",       nombre: "Pastas", color: "#d97b29" },
  { id: "ensaladas",    nombre: "Ensaladas", color: "#4f8a5b" },
  { id: "cremas",       nombre: "Cremas", color: "#8a6a3f" },
];

/* -----------------------------------------------------------------------------
   PLATILLOS
   - foto (opcional): ruta de una imagen, ej. "fotos/pavo.jpg". Si no hay, se muestra el emoji
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
    id: "lomo-mechado", cat: "fuertes", rol: "fuerte", familia: "lomo",
    nombre: "Lomo o pierna de cerdo mechada",
    desc: "Mechada, con la salsa que elijas.",
    precio: 420, unidad: "kg",
    tags: ["tradicional", "compartir"], contiene: ["cerdo"],
    opciones: [
      { id: "corte", titulo: "Corte", requerida: true, multiple: false,
        elecciones: [{ nombre: "Lomo" }, { nombre: "Pierna" }] },
      { id: "salsa", titulo: "Salsa", requerida: true, multiple: false,
        elecciones: [{ nombre: "Adobo" }, { nombre: "Tamarindo" }, { nombre: "Braseado" }] },
    ],
  },
  {
    id: "lomo-relleno", cat: "fuertes", rol: "fuerte", familia: "lomo",
    nombre: "Lomo o pierna de cerdo rellena",
    desc: "Rellena, con la salsa que elijas.",
    precio: 460, unidad: "kg",
    tags: ["tradicional", "elegante"], contiene: ["cerdo"],
    opciones: [
      { id: "corte", titulo: "Corte", requerida: true, multiple: false,
        elecciones: [{ nombre: "Lomo" }, { nombre: "Pierna" }] },
      { id: "salsa", titulo: "Salsa", requerida: true, multiple: false,
        elecciones: [{ nombre: "Adobo" }, { nombre: "Tamarindo" }, { nombre: "Braseado" }] },
    ],
  },
  {
    id: "pavo", cat: "fuertes", rol: "fuerte",
    nombre: "Pavo relleno",
    desc: "El clásico de la mesa navideña, con la salsa que prefieras.",
    precio: 450, unidad: "kg",
    tags: ["tradicional", "elegante"], contiene: [],
    opciones: [
      { id: "salsa", titulo: "Salsa", requerida: true, multiple: false,
        elecciones: [{ nombre: "A la naranja" }, { nombre: "Adobado" }, { nombre: "A las hierbas finas" }] },
    ],
  },
  {
    id: "costillitas", cat: "fuertes", rol: "fuerte",
    nombre: "Costillitas de cerdo",
    desc: "Costillitas en la salsa que elijas.",
    precio: 360, unidad: "kg",
    tags: ["compartir", "tradicional"], contiene: ["cerdo"],
    opciones: [
      { id: "salsa", titulo: "Salsa", requerida: true, multiple: false,
        elecciones: [{ nombre: "BBQ" }, { nombre: "Adobadas" }, { nombre: "Tamarindo" }] },
    ],
  },
  {
    id: "cochinita", cat: "fuertes", rol: "fuerte",
    nombre: "Cochinita pibil",
    desc: "Cochinita pibil por kilo.",
    precio: 370, unidad: "kg",
    tags: ["mexicano", "compartir"], contiene: ["cerdo"],
  },
  {
    id: "lasagna", cat: "fuertes", rol: "fuerte",
    nombre: "Lasagna",
    desc: "Charola de lasagna para 6 o para 12 personas.",
    precio: 1000, unidad: "pza", unidadSing: "charola", unidadPlur: "charolas",
    precioEtiqueta: "Desde $1,000",
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
    precio: 600, unidad: "kg",
    tags: ["tradicional", "elegante"], contiene: ["mariscos"],
  },

  /* ---------------- TRADICIONALES Y GUARNICIONES ---------------- */
  {
    id: "romeritos", cat: "guarniciones", rol: "guarnicion",
    nombre: "Romeritos",
    desc: "Tradición de la cena navideña mexicana.",
    precio: 280, unidad: "kg",
    tags: ["tradicional", "mexicano"], contiene: [], posibleContiene: ["mariscos"],
  },
  {
    id: "pure", cat: "guarniciones", rol: "guarnicion",
    nombre: "Puré de papa con gravy",
    desc: "Cremoso, con gravy.",
    precio: 230, unidad: "kg",
    tags: ["tradicional", "compartir"], contiene: [],
  },
  {
    id: "papa-gratin", cat: "guarniciones", rol: "guarnicion",
    nombre: "Papa gratin",
    desc: "Papa, jamón, queso y crema.",
    precio: 270, unidad: "kg",
    tags: ["queso", "elegante"], contiene: ["queso"], posibleContiene: ["cerdo"],
  },

  /* ---------------- PASTAS ---------------- */
  {
    id: "bavette", cat: "pastas", rol: "entrada",
    nombre: "Bavette con camarones",
    desc: "Bavette con camarones.",
    precio: 320, unidad: "kg",
    tags: ["italiano", "elegante"], contiene: ["mariscos"],
  },
  {
    id: "fusilli", cat: "pastas", rol: "entrada",
    nombre: "Fusilli Mediterráneo",
    desc: "Fusilli estilo mediterráneo.",
    precio: 270, unidad: "kg",
    tags: ["italiano", "compartir", "ligero"], contiene: [],
  },
  {
    id: "espagueti", cat: "pastas", rol: "entrada",
    nombre: "Espagueti al burro",
    desc: "Espagueti al burro.",
    precio: 250, unidad: "kg",
    tags: ["italiano", "compartir"], contiene: [],
  },

  /* ---------------- ENSALADAS ---------------- */
  {
    id: "ens-manzana", cat: "ensaladas", rol: "entrada",
    nombre: "Ensalada de manzana",
    desc: "Clásica ensalada de manzana navideña.",
    precio: 350, unidad: "kg",
    tags: ["tradicional", "ligero"], contiene: [],
  },
  {
    id: "ens-omi", cat: "ensaladas", rol: "entrada",
    nombre: "Ensalada OMI",
    desc: "Espinaca, uvas, durazno y aderezo de miel mostaza.",
    precio: 250, unidad: "pza", unidadSing: "ensalada (4 personas)", unidadPlur: "ensaladas (4 personas)",
    personas: 4,
    precioEtiqueta: "$250 · 4 personas",
    tags: ["ligero", "elegante"], contiene: [],
  },
  {
    id: "ens-fresosa", cat: "ensaladas", rol: "entrada",
    nombre: "Ensalada Fresosa",
    desc: "Lechuga, fresas, nueces, amaranto caramelizado y queso de cabra.",
    precio: 330, unidad: "pza", unidadSing: "ensalada (4 personas)", unidadPlur: "ensaladas (4 personas)",
    personas: 4,
    precioEtiqueta: "$330 · 4 personas",
    tags: ["ligero", "queso", "elegante"], contiene: ["frutos_secos", "queso"],
  },
  {
    id: "ens-manzana-verde", cat: "ensaladas", rol: "entrada",
    nombre: "Ensalada de manzana verde",
    desc: "Espinacas, manzana verde, nuez caramelizada y queso cottage.",
    precio: 330, unidad: "pza", unidadSing: "ensalada (4 personas)", unidadPlur: "ensaladas (4 personas)",
    personas: 4,
    precioEtiqueta: "$330 · 4 personas",
    tags: ["ligero", "queso"], contiene: ["frutos_secos", "queso"],
  },

  /* ---------------- CREMAS ---------------- */
  {
    id: "crema-champi", cat: "cremas", rol: "entrada",
    nombre: "Crema de champiñones",
    desc: "Se vende por litro.",
    precio: 230, unidad: "lt",
    tags: ["tradicional", "elegante"], contiene: [],
  },
  {
    id: "crema-poblano", cat: "cremas", rol: "entrada",
    nombre: "Crema de poblano",
    desc: "Se vende por litro.",
    precio: 230, unidad: "lt",
    tags: ["mexicano", "tradicional"], contiene: [],
  },
];

if (typeof module !== "undefined" && module.exports) {
  module.exports = { CONFIG, CATEGORIAS, PLATILLOS };
}

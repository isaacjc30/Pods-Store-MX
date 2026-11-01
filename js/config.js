// ===== CONFIGURACIÓN ÚNICA DE POD STORE MX =====
// Todos los datos comerciales se editan aquí. Precios, disponibilidad, mayoreo y ofertas
// se usan en catálogo, ficha, carrito, recomendador y mensajes de WhatsApp.

const CONFIG = {
  brand: "Pods Store MX",

  // WhatsApp comercial. Código de país + número, sin espacios ni signos.
  whatsapp: "525650620897",
  currency: "MXN",

  // Correo de contacto (atención, garantías y datos personales).
  email: "airpods.store.mx12@gmail.com",

  // Zonas de entrega (las entregas se acuerdan por WhatsApp; no se publica ninguna dirección privada).
  zones: ["CDMX", "Estaciones del Metro", "Jardines de Morelos", "Real del Valle", "Las Américas (Ecatepec)"],

  // Garantía comercial de la tienda, en días naturales. La tienda responde frente al comprador.
  // La garantía de nuestro proveedor es un asunto interno y no condiciona los derechos del comprador.
  warrantyDays: 30,

  // Pagos aceptados. Se coordinan por WhatsApp; no se procesan en la página.
  payments: ["Efectivo en la entrega", "Transferencia previamente acordada"],

  // Grupo de WhatsApp. Mientras diga REEMPLAZAR, el botón no aparece.
  whatsappGroup: "https://chat.whatsapp.com/CizWKCpZiPYI7hpf8w5yV5",

  // Mayoreo y menudeo.
  // enabled: false = la sección NO se muestra al público.
  // price: null = precio pendiente de confirmar (no se aplica ni se muestra).
  // EDITABLE: cuando confir

  // Ofertas. Solo muestra un precio anterior si referenceVerified es true.
  // Ejemplo: { productId: "pro2", label: "Oferta", price: 349, reference: 399, referenceVerified: true }
  offers: [{ productId: "pro2", label: "Oferta", price:399, reference: 599, referenceVerified: true }, { productId: "pro3", label: "Oferta", price:399, reference: 599, referenceVerified: true }, { productId: "gen4", label: "Oferta", price:399, reference: 599, referenceVerified: true }],

  // Datos legales para el aviso de privacidad. Completar antes de publicar.
  legal: {
    razonSocial: "[RAZÓN SOCIAL PENDIENTE]",
    rfc: "[RFC PENDIENTE]",
    domicilio: "[DOMICILIO PENDIENTE]",
  },

  // Modelos. Todos son réplicas OEM Premium de terceros, no productos originales de Apple.
  // available: false marca el producto como agotado.
  // fit y newest se usan por el recomendador.
  products: [
    {
      id: "pro3", fit: "almohadilla", newest: true, available: true,
      name: "AirPods Pro 3",
      tag: "OEM Premium",
      price: 399,
      // Precio de referencia (tachado). VERIFICAR antes de publicar: el $599 no está comprobado.
      referencePrice: 599,
      referenceVerified: true,
      desc: "Réplica OEM Premium",
      images: ["img/products/pro3-1.jpg", "img/products/pro3-2.jpg"],
    },
    {
      id: "pro2", fit: "almohadilla", available: true,
      name: "AirPods 2da Generación",
      tag: "OEM Premium",
      price: 399,
      // Precio de referencia (tachado). VERIFICAR antes de publicar: el $599 no está comprobado.
      referencePrice: 599,
      referenceVerified: true,
      desc: "Réplica OEM Premium ",
      images: ["img/products/pro2-1.jpg", "img/products/pro2-2.jpg"],
    },
    {
      id: "gen4", fit: "sin almohadilla", available: true,
      name: "AirPods 4ta Generación",
      tag: "OEM Premium",
      price: 399,
      // Precio de referencia (tachado). VERIFICAR antes de publicar: el $599 no está comprobado.
      referencePrice: 599,
      referenceVerified: true,
      desc: "Réplica OEM Premium",
      images: ["img/products/gen4-1.jpg", "img/products/gen4-2.jpg"],
    },
  ],

  // Mensajes de compradores (publicados con su permiso). rating: calificación que dio el cliente.
  reviews: [
    { src: "img/reviews/resena1.jpg", rating: 4.9 },
    { src: "img/reviews/resena2.jpg", rating: 4.8 },
    { src: "img/reviews/resena3.jpg", rating: 5 },
  ],

  // Redes sociales: URL completa. Vacío = no se muestra.
  social: {
    instagram: "https://www.instagram.com/pods_marked_0?cplk=dm1qYzQ1emxoc3J0",
    facebook: "https://www.facebook.com/profile.php?id=61595998046683",
    tiktok: "https://www.tiktok.com/@airpodsstoremx0?_r=1&_t=ZS-9ArrU5Ex3uH",
  },
};

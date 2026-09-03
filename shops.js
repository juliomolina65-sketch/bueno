/* =============================================================================
   BUENO — CLIENT CONFIG
   One entry per paying shop. Adding a client = adding an object here.
   The page reads it as b.html?s=<slug>  (Railway will serve /b/<slug>).

   Every field is optional except name. Leave a field out and the page
   quietly drops that piece — no broken layout.
   ============================================================================= */

window.SHOPS = {

  "marinos-auto": {
    name: "Marino & Sons Auto Care",
    trade: "Brakes · Diagnostics · Tires",
    accent: "#E8850C",
    phone: "+15550142418",
    // What the caller reads at the top. Keep it human — they just got missed.
    message:
      "Both of us are under a car right now — but you're not going to voicemail. " +
      "Pick what you need and we'll take it from here.",
    address: "2418 Fairview Ave",
    addressNote: "bay door on the left",
    hours: { weekday: [480, 1080], sat: [480, 840], sun: null },   // minutes from midnight
    actions: ["book", "callback", "quote", "text", "directions"],
    slots: ["9:00 AM", "11:30 AM", "2:00 PM", "4:30 PM"],
    quoteHint: "What's the car doing? Year, make and model helps — e.g. 2016 Civic, grinding when I brake.",
    photoUpload: true,
    guarantee: null,
  },

  "js-finest": {
    name: "JS Finest Barbershop",
    trade: "Fades · Beards · Line-ups",
    accent: "#1F6F5C",
    phone: "+15550177431",
    message:
      "Mid-cut right now — but you're not going to voicemail. " +
      "Grab a chair time and you're locked in.",
    address: "1140 Jefferson Blvd",
    addressNote: "next to the taquería",
    hours: { weekday: [600, 1200], sat: [540, 1080], sun: null },
    actions: ["book", "callback", "text", "directions"],
    slots: ["11:00 AM", "1:30 PM", "3:00 PM", "5:30 PM", "7:00 PM"],
    barbers: ["Any barber", "Jay", "Marco", "Dee"],
    guarantee: null,
  },

  // Spanish-first example — same software, different language.
  "taqueria-lupita": {
    name: "Taquería Lupita",
    trade: "Tacos · Tortas · Catering",
    accent: "#C0392B",
    phone: "+15550198877",
    lang: "es",
    message:
      "Estamos con la plancha llena — pero no te mandamos al buzón. " +
      "Dinos qué necesitas y te atendemos de inmediato.",
    address: "3310 W Davis St",
    addressNote: "estacionamiento atrás",
    hours: { weekday: [600, 1320], sat: [600, 1380], sun: [660, 1200] },
    actions: ["callback", "text", "directions"],
    guarantee: null,
  },

};

/* Wording per language. Add a language = add a block. */
window.LANG = {
  en: {
    stamp: "WE SAW YOUR CALL",
    openNow: "Open now · until ",
    closedNow: "Closed right now — book below and you're first in line",
    hoursTitle: "HOURS",
    weekday: "Mon–Fri", sat: "Saturday", sun: "Sunday", closed: "Closed",
    book: ["BOOK A TIME", "Grab a slot — we'll confirm by text"],
    callback: ["REQUEST A CALLBACK", "Tell us when — we'll ring you back"],
    quote: ["GET A QUOTE", "Tell us the problem, add a photo"],
    text: ["TEXT US NOW", "Fastest answer while we're working"],
    directions: ["DIRECTIONS", ""],
    pickDay: ["Today", "Tomorrow"],
    whoWith: "With",
    cbWhen: "When should we call?",
    cbOptions: ["Right away", "In an hour", "This afternoon", "Tomorrow morning"],
    cbNote: "Anything we should know? (optional)",
    sendBook: "REQUEST THIS SLOT",
    sendCb: "REQUEST CALLBACK",
    sendQuote: "SEND FOR QUOTE",
    addPhoto: "Add a photo of the problem",
    photoAdded: "Photo added ✓",
    okBookTitle: "REQUEST SENT",
    okBookBody: "We'll confirm your slot by text in a few minutes. If it's taken, we'll send the two closest openings.",
    okCbTitle: "WE'LL CALL YOU",
    okCbBody: "You're in the queue. We'll ring you back at the number you called from.",
    okQuoteTitle: "ON IT",
    okQuoteBody: "We'll look as soon as we're free — you'll get a ballpark by text, usually within the hour.",
    poweredBy: "powered by",
  },
  es: {
    stamp: "VIMOS TU LLAMADA",
    openNow: "Abierto · hasta ",
    closedNow: "Cerrado ahora — aparta abajo y eres el primero",
    hoursTitle: "HORARIO",
    weekday: "Lun–Vie", sat: "Sábado", sun: "Domingo", closed: "Cerrado",
    book: ["APARTAR HORA", "Elige un horario — te confirmamos por mensaje"],
    callback: ["QUE TE LLAMEMOS", "Dinos cuándo y te devolvemos la llamada"],
    quote: ["PEDIR COTIZACIÓN", "Cuéntanos qué necesitas, agrega una foto"],
    text: ["MÁNDANOS UN MENSAJE", "La forma más rápida mientras trabajamos"],
    directions: ["CÓMO LLEGAR", ""],
    pickDay: ["Hoy", "Mañana"],
    whoWith: "Con",
    cbWhen: "¿Cuándo te llamamos?",
    cbOptions: ["Ahora mismo", "En una hora", "Esta tarde", "Mañana temprano"],
    cbNote: "¿Algo que debamos saber? (opcional)",
    sendBook: "APARTAR ESTE HORARIO",
    sendCb: "PEDIR LLAMADA",
    sendQuote: "ENVIAR",
    addPhoto: "Agregar una foto",
    photoAdded: "Foto agregada ✓",
    okBookTitle: "ENVIADO",
    okBookBody: "Te confirmamos por mensaje en unos minutos. Si ya está tomado, te mandamos las dos horas más cercanas.",
    okCbTitle: "TE LLAMAMOS",
    okCbBody: "Ya estás en la lista. Te devolvemos la llamada al número desde el que llamaste.",
    okQuoteTitle: "RECIBIDO",
    okQuoteBody: "Lo revisamos en cuanto podamos — te mandamos un estimado por mensaje, normalmente dentro de una hora.",
    poweredBy: "con tecnología de",
  },
};

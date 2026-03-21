export type VoiceFaq = {
  question: string;
  answer: string;
  keywords: string[];
};

export type KnowledgeBase = {
  businessName: string;
  description:string;
  services: string;
  schedules: string;
  location: string;
  contact: string;
  purchasingProcess: string;
  promotions: string;
  faqs: VoiceFaq[];
};

export const knowledgeBase: KnowledgeBase = {
  businessName: "Force Extreme",
  description:
    "Force Extreme es un gimnasio de entrenamiento personalizado que combina sala de pesas, clases guiadas y seguimiento por objetivos.",
  services:
    "Nuestros servicios principales son planes de fuerza, HIIT, funcional e iniciación para personas que empiezan desde cero.",
  schedules:
    "Atendemos de lunes a sábado. Puedes agendar tu visita por WhatsApp para confirmar el horario disponible.",
  location:
    "Estamos en modalidad presencial. La dirección exacta se comparte al confirmar tu visita por WhatsApp.",
  contact:
    "Puedes contactarnos por WhatsApp al número 50660301104 desde el botón de contacto del sitio.",
  purchasingProcess:
    "Para inscribirte, completa el formulario de contacto o escribe por WhatsApp, te recomendamos un plan y confirmamos tu horario.",
  promotions:
    "Tenemos promoción de bienvenida: evaluación y rutina inicial sin costo para nuevos clientes, sujeto a cupos.",
  faqs: [
    {
      question: "¿Puedo empezar si nunca he ido al gimnasio?",
      answer:
        "Sí. Tenemos un programa de iniciación con acompañamiento para que empieces con técnica y seguridad.",
      keywords: ["nunca", "principiante", "empezar", "inicio", "novato"],
    },
    {
      question: "¿Cómo funciona la clase de prueba?",
      answer:
        "Nos escribes por WhatsApp, coordinamos horario y te guiamos en una primera visita para conocer el gimnasio.",
      keywords: ["prueba", "visita", "primera clase", "demo"],
    },
    {
      question: "¿Qué plan me conviene?",
      answer:
        "Depende de tu objetivo, tiempo y nivel actual. Te asesoramos por WhatsApp para elegir entre Básico, Pro o Premium.",
      keywords: ["plan", "conviene", "precio", "básico", "pro", "premium"],
    },
    {
      question: "¿Qué incluye la promoción de bienvenida?",
      answer:
        "Incluye evaluación inicial y rutina de arranque sin costo. Está sujeta a disponibilidad por horario.",
      keywords: ["promoción", "bienvenida", "oferta", "descuento"],
    },
    {
      question: "¿Puedo pagar y reservar por WhatsApp?",
      answer:
        "Sí. Puedes iniciar la reserva por WhatsApp y el equipo te indicará los pasos de confirmación e inscripción.",
      keywords: ["pagar", "reservar", "compra", "inscripción"],
    },
  ],
};

/**
 * Normalizes a string by converting it to lowercase and removing diacritics.
 * @param value The string to normalize.
 * @returns The normalized string.
 */
export const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
"use client";

import { useEffect, useRef, useState } from "react";

/* --------------------------------------------------------------------------
   Tipos y modelos de datos usados por el asistente de voz
-------------------------------------------------------------------------- */

type VoiceFaq = {
  question: string;
  answer: string;
  keywords: string[];
};

type KnowledgeBase = {
  businessName: string;
  description: string;
  services: string;
  schedules: string;
  location: string;
  contact: string;
  purchasingProcess: string;
  promotions: string;
  faqs: VoiceFaq[];
};

type RecognitionLike = SpeechRecognition & {
  continuous?: boolean;
};

type RecognitionConstructorLike = new () => RecognitionLike;

type WebkitSpeechWindow = Window & {
  webkitSpeechRecognition?: RecognitionConstructorLike;
};

interface SpeechRecognitionEventExtended extends SpeechRecognitionEvent {
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

/* --------------------------------------------------------------------------
   Base de conocimiento: respuestas, datos del negocio y preguntas frecuentes
-------------------------------------------------------------------------- */

const knowledgeBase: KnowledgeBase = {
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

/* --------------------------------------------------------------------------
   Función para normalizar texto: minúsculas y sin acentos
-------------------------------------------------------------------------- */

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/* --------------------------------------------------------------------------
   Lógica para elegir la respuesta adecuada según la pregunta del usuario
-------------------------------------------------------------------------- */

const getReply = (question: string) => {
  const normalized = normalizeText(question);

  // Nombre del negocio
  if (normalized.includes("nombre") || normalized.includes("empresa")) {
    return `Nuestro emprendimiento se llama ${knowledgeBase.businessName}.`;
  }

  // Descripción general
  if (
    normalized.includes("quienes son") ||
    normalized.includes("que es") ||
    normalized.includes("descripcion")
  ) {
    return knowledgeBase.description;
  }

  // Servicios
  if (
    normalized.includes("servicio") ||
    normalized.includes("producto") ||
    normalized.includes("programa")
  ) {
    return knowledgeBase.services;
  }

  // Horarios
  if (normalized.includes("horario") || normalized.includes("abren")) {
    return knowledgeBase.schedules;
  }

  // Ubicación
  if (
    normalized.includes("ubicacion") ||
    normalized.includes("direccion") ||
    normalized.includes("donde")
  ) {
    return knowledgeBase.location;
  }

  // Contacto
  if (
    normalized.includes("contacto") ||
    normalized.includes("whatsapp") ||
    normalized.includes("telefono")
  ) {
    return knowledgeBase.contact;
  }

  // Proceso de compra
  if (
    normalized.includes("comprar") ||
    normalized.includes("reservar") ||
    normalized.includes("inscrib")
  ) {
    return knowledgeBase.purchasingProcess;
  }

  // Promociones o precios
  if (
    normalized.includes("precio") ||
    normalized.includes("promocion") ||
    normalized.includes("promo")
  ) {
    return `${knowledgeBase.promotions} Los planes actuales van desde 10 mil hasta 40 mil colones al mes.`;
  }

  // Buscar en las FAQ
  const faq = knowledgeBase.faqs.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (faq) {
    return faq.answer;
  }

  // No coincide ninguna intención
  return "Puedo ayudarte con servicios, horarios, ubicación, promociones, contacto, compras y preguntas frecuentes. Intenta con otra pregunta.";
};

/* --------------------------------------------------------------------------
   Función para obtener el constructor correcto de SpeechRecognition
-------------------------------------------------------------------------- */

function getRecognitionConstructor(): RecognitionConstructorLike | null {
  if (typeof window === "undefined") return null;

  const standardCtor = (
    window as Window & {
      SpeechRecognition?: RecognitionConstructorLike;
    }
  ).SpeechRecognition;

  const webkitCtor = (window as WebkitSpeechWindow).webkitSpeechRecognition;

  return standardCtor ?? webkitCtor ?? null;
}

/* --------------------------------------------------------------------------
   Componente principal del Asistente de Voz
-------------------------------------------------------------------------- */

export default function VoiceAssistant() {
  /* ----------------------------------------------------------------------
     Estados del asistente: si escucha, texto capturado, respuesta, etc.
  ---------------------------------------------------------------------- */

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const [supported, setSupported] = useState(false);

  const recognitionRef = useRef<RecognitionLike | null>(null);

  /* ----------------------------------------------------------------------
     Efecto inicial: verificar compatibilidad y limpiar al desmontar
  ---------------------------------------------------------------------- */

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSpeechSynthesis = "speechSynthesis" in window;
    const hasSpeechRecognition = !!getRecognitionConstructor();

    setSupported(hasSpeechSynthesis && hasSpeechRecognition);

    return () => {
      recognitionRef.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  /* ----------------------------------------------------------------------
     Función para reproducir texto en voz (Text-to-Speech)
  ---------------------------------------------------------------------- */

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1;
    utterance.pitch = 1;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  /* ----------------------------------------------------------------------
     Detener reconocimiento de voz
  ---------------------------------------------------------------------- */

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  /* ----------------------------------------------------------------------
     Iniciar escucha por micrófono y procesar lo que dice el usuario
  ---------------------------------------------------------------------- */

  const startListening = () => {
    if (typeof window === "undefined" || isListening) return;

    setError("");
    setTranscript("");
    setResponse("");

    const SpeechRecognitionClass = getRecognitionConstructor();

    if (!SpeechRecognitionClass) {
      setError(
        "Tu navegador no soporta reconocimiento de voz. Usa Chrome en computadora o las preguntas rápidas."
      );
      return;
    }

    recognitionRef.current?.stop();

    const recognition = new SpeechRecognitionClass();

    recognition.lang = "es-ES";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    let finalTranscript = "";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";

      const ev = event as SpeechRecognitionEventExtended;

      // Procesar resultados del reconocimiento
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const text = ev.results[i][0].transcript;

        if (ev.results[i].isFinal) {
          finalTranscript += ` ${text}`;
        } else {
          interimTranscript += ` ${text}`;
        }
      }

      const fullText = `${finalTranscript} ${interimTranscript}`.trim();
      setTranscript(fullText);

      // Si ya se capturó texto final, se procesa la intención
      if (finalTranscript.trim()) {
        const cleanQuestion = finalTranscript.trim();
        const agentResponse = getReply(cleanQuestion);

        setTranscript(cleanQuestion);
        setResponse(agentResponse);
        speak(agentResponse);

        recognition.stop();
      }
    };

    // Manejo de errores del sistema de voz
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "no-speech") {
        setError("No detecté voz. Habla apenas presiones el botón.");
      } else if (event.error === "not-allowed") {
        setError("El navegador no tiene permiso para usar el micrófono.");
      } else if (event.error === "audio-capture") {
        setError("No se pudo acceder al micrófono.");
      } else {
        setError("No pude escuchar con claridad. Intenta nuevamente.");
      }

      setIsListening(false);
    };

    // Cuando el reconocimiento se detiene
    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  /* ----------------------------------------------------------------------
     Preguntas rápidas: simulan una pregunta predefinida sin usar micrófono
  ---------------------------------------------------------------------- */

  const handleQuickQuestion = (question: string) => {
    setError("");
    setTranscript(question);

    const agentResponse = getReply(question);
    setResponse(agentResponse);

    speak(agentResponse);
  };

  /* ----------------------------------------------------------------------
     Render del componente y su interfaz
  ---------------------------------------------------------------------- */

  return (
    <section className="section pt-0 anchor" id="agente-voz">
      <div className="container">
        <div className="fx-surface p-4 p-md-5 voice-assistant">
          {/* Encabezado: botones principales y descripción */}
          <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 mb-4">
            <div>
              <h2 className="fw-bold mb-2">
                <i className="bi bi-mic-fill me-2"></i>
                Asistente de voz IA
              </h2>
              <p className="mb-0 fx-muted">
                Demo gratuita con Web Speech API: escucha tus preguntas y responde
                por voz sobre Force Extreme.
              </p>
            </div>

            {/* Botones de control */}
            <div className="d-flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-fx-outline"
                onClick={() =>
                  handleQuickQuestion(
                    "Hola, dame una bienvenida y cuéntame qué servicios ofrecen"
                  )
                }
              >
                <i className="bi bi-volume-up me-1"></i>
                Escuchar bienvenida
              </button>

              <button
                type="button"
                className="btn btn-fx"
                onClick={startListening}
                disabled={!supported || isListening}
              >
                <i className="bi bi-mic me-1"></i>
                {isListening ? "Escuchando..." : "Hablar con el asistente"}
              </button>

              <button
                type="button"
                className="btn btn-fx-outline"
                onClick={stopListening}
                disabled={!isListening}
              >
                <i className="bi bi-stop-circle me-1"></i>
                Detener
              </button>
            </div>
          </div>

          {/* Paneles informativos */}
          <div className="row g-4">
            <div className="col-lg-6">
              <div className="voice-panel p-3 h-100">
                <h3 className="h5 fw-bold">Flujo de interacción</h3>
                <ol className="mb-0 fx-muted">
                  <li>El usuario pulsa "Hablar con el asistente".</li>
                  <li>El sistema captura la pregunta por voz.</li>
                  <li>El agente identifica la intención.</li>
                  <li>Responde con texto y voz automáticamente.</li>
                </ol>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="voice-panel p-3 h-100">
                <h3 className="h5 fw-bold">Estado de la conversación</h3>
                <p className="mb-2">
                  <strong>Tu pregunta:</strong> {transcript || "Sin entrada aún"}
                </p>
                <p className="mb-0">
                  <strong>Respuesta:</strong> {response || "Esperando interacción"}
                </p>
                {error && <p className="text-warning mt-2 mb-0">{error}</p>}
              </div>
            </div>
          </div>

          {/* Preguntas rápidas FAQ */}
          <div className="mt-4">
            <h3 className="h5 fw-bold mb-3">Preguntas rápidas (FAQ de voz)</h3>
            <div className="d-flex flex-wrap gap-2">
              {knowledgeBase.faqs.map((faq) => (
                <button
                  key={faq.question}
                  type="button"
                  className="btn btn-sm btn-fx-outline"
                  onClick={() => handleQuickQuestion(faq.question)}
                >
                  {faq.question}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
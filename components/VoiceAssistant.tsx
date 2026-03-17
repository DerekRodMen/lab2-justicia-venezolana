"use client";

import { useMemo, useRef, useState } from "react";

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

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const getReply = (question: string) => {
  const normalized = normalizeText(question);

  if (normalized.includes("nombre") || normalized.includes("empresa")) {
    return `Nuestro emprendimiento se llama ${knowledgeBase.businessName}.`;
  }

  if (
    normalized.includes("quienes son") ||
    normalized.includes("que es") ||
    normalized.includes("descripcion")
  ) {
    return knowledgeBase.description;
  }

  if (
    normalized.includes("servicio") ||
    normalized.includes("producto") ||
    normalized.includes("programa")
  ) {
    return knowledgeBase.services;
  }

  if (normalized.includes("horario") || normalized.includes("abren")) {
    return knowledgeBase.schedules;
  }

  if (
    normalized.includes("ubicacion") ||
    normalized.includes("direccion") ||
    normalized.includes("donde")
  ) {
    return knowledgeBase.location;
  }

  if (
    normalized.includes("contacto") ||
    normalized.includes("whatsapp") ||
    normalized.includes("telefono")
  ) {
    return knowledgeBase.contact;
  }

  if (
    normalized.includes("comprar") ||
    normalized.includes("reservar") ||
    normalized.includes("inscrib")
  ) {
    return knowledgeBase.purchasingProcess;
  }

  if (
    normalized.includes("precio") ||
    normalized.includes("promocion") ||
    normalized.includes("promo")
  ) {
    return `${knowledgeBase.promotions} Los planes actuales van desde 10 mil hasta 40 mil colones al mes.`;
  }

  const faq = knowledgeBase.faqs.find((item) =>
    item.keywords.some((keyword) => normalized.includes(keyword))
  );

  if (faq) {
    return faq.answer;
  }

  return "Puedo ayudarte con servicios, horarios, ubicación, promociones, contacto, compras y preguntas frecuentes. Intenta con otra pregunta.";
};

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [error, setError] = useState("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const supported = useMemo(
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    []
  );

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "es-ES";
    utterance.rate = 1;
    utterance.pitch = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const startListening = () => {
    setError("");

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setError(
        "Tu navegador no soporta reconocimiento de voz. Puedes usar los botones de preguntas rápidas."
      );
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognition.lang = "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript;
      setTranscript(spokenText);
      const agentResponse = getReply(spokenText);
      setResponse(agentResponse);
      speak(agentResponse);
    };

    recognition.onerror = () => {
      setError("No pude escuchar con claridad. Intenta nuevamente.");
      setIsListening(false);
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleQuickQuestion = (question: string) => {
    setTranscript(question);
    const agentResponse = getReply(question);
    setResponse(agentResponse);
    speak(agentResponse);
  };

  return (
    <section className="section pt-0 anchor" id="agente-voz">
      <div className="container">
        <div className="fx-surface p-4 p-md-5 voice-assistant">
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

          <div className="row g-4">
            <div className="col-lg-6">
              <div className="voice-panel p-3 h-100">
                <h3 className="h5 fw-bold">Flujo de interacción</h3>
                <ol className="mb-0 fx-muted">
                  <li>El usuario pulsa “Hablar con el asistente”.</li>
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

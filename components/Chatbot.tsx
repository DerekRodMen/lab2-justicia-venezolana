"use client";

import { useState, useRef, useEffect } from "react";

type Message = {
  from: "bot" | "user";
  text: string;
};

type FAQ = {
  question: string;
  answer: string;
  keywords: string[];
};

const knowledgeBase = {
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
      keywords: ["nunca", "principiante", "empezar", "inicio", "novato", "primera vez", "sin experiencia"],
    },
    {
      question: "¿Cómo funciona la clase de prueba?",
      answer:
        "Nos escribes por WhatsApp, coordinamos horario y te guiamos en una primera visita para conocer el gimnasio.",
      keywords: ["prueba", "visita", "primera clase", "demo", "probar", "conocer"],
    },
    {
      question: "¿Qué plan me conviene?",
      answer:
        "Depende de tu objetivo, tiempo y nivel actual. Te asesoramos por WhatsApp para elegir entre Básico, Pro o Premium.",
      keywords: ["plan", "conviene", "precio", "básico", "pro", "premium", "costo", "cuanto cuesta", "membresía"],
    },
    {
      question: "¿Qué incluye la promoción de bienvenida?",
      answer:
        "Incluye evaluación inicial y rutina de arranque sin costo. Está sujeta a disponibilidad por horario.",
      keywords: ["promoción", "bienvenida", "oferta", "descuento", "gratis", "evaluación"],
    },
    {
      question: "¿Puedo pagar y reservar por WhatsApp?",
      answer:
        "Sí. Puedes iniciar la reserva por WhatsApp y el equipo te indicará los pasos de confirmación e inscripción.",
      keywords: ["pagar", "reservar", "compra", "inscripción", "registro", "apuntarme", "unirme"],
    },
  ] as FAQ[],
};

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "bot",
      text: `¡Hola! Soy el asistente virtual de **${knowledgeBase.businessName}** 💪🤖. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre nuestros servicios, horarios, promociones o planes de entrenamiento.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll al último mensaje
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const findBestResponse = (userInput: string): string => {
    const normalizedInput = userInput.toLowerCase().trim();
    const words = normalizedInput.split(/\s+/);

    // 1. Buscar coincidencias exactas en keywords de FAQs
    for (const faq of knowledgeBase.faqs) {
      for (const keyword of faq.keywords) {
        if (normalizedInput.includes(keyword.toLowerCase())) {
          return faq.answer;
        }
      }
    }

    // 2. Buscar coincidencias en el texto de las preguntas frecuentes
    for (const faq of knowledgeBase.faqs) {
      const questionWords = faq.question.toLowerCase().split(/\s+/);
      const matches = words.filter((word) =>
        questionWords.some((qWord) => qWord.includes(word) || word.includes(qWord))
      );
      if (matches.length >= 2) {
        return faq.answer;
      }
    }

    // 3. Respuestas generales basadas en temas
    const topicMatchers: { keywords: string[]; response: string }[] = [
      {
        keywords: ["horario", "hora", "cuándo", "cuando", "abierto", "atención", "sábado", "lunes"],
        response: knowledgeBase.schedules,
      },
      {
        keywords: ["ubicación", "dirección", "donde", "dónde", "lugar", "ubicados", "sede"],
        response: knowledgeBase.location,
      },
      {
        keywords: ["contacto", "whatsapp", "teléfono", "llamar", "escribir", "comunicar", "50660301104"],
        response: knowledgeBase.contact,
      },
      {
        keywords: ["servicio", "entrenamiento", "clase", "actividad", "hacen", "ofrecen", "hiit", "fuerza", "funcional"],
        response: knowledgeBase.services,
      },
      {
        keywords: ["inscribir", "inscripción", "proceso", "pasos", "comenzar", "empezar", "unirme"],
        response: knowledgeBase.purchasingProcess,
      },
      {
        keywords: ["promoción", "oferta", "descuento", "bienvenida", "gratis", "evaluación", "costo"],
        response: knowledgeBase.promotions,
      },
      {
        keywords: ["quienes", "son", "gimnasio", "información", "describan", "cuenten"],
        response: knowledgeBase.description,
      },
    ];

    for (const matcher of topicMatchers) {
      if (matcher.keywords.some((keyword) => normalizedInput.includes(keyword))) {
        return matcher.response;
      }
    }

    // 4. Respuesta por defecto con sugerencias
    return `Lo siento, no entendí bien tu pregunta 😅. Puedo ayudarte con:
• Información sobre planes y precios
• Horarios de atención
• Promoción de bienvenida
• Cómo inscribirte
• Clases de prueba

¿O prefieres escribirnos directamente al WhatsApp **50660301104**?`;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    setInput("");

    // Agregar mensaje del usuario
    setMessages((prev) => [...prev, { from: "user", text: userText }]);

    // Simular "escribiendo..."
    setIsTyping(true);

    // Pequeña demora para simular procesamiento natural
    setTimeout(() => {
      const reply = findBestResponse(userText);
      setIsTyping(false);
      setMessages((prev) => [...prev, { from: "bot", text: reply }]);
    }, 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Sugerencias rápidas
  const quickSuggestions = [
    "¿Qué planes tienen?",
    "Horarios de atención",
    "Promoción de bienvenida",
    "¿Cómo me inscribo?",
  ];

  return (
    <div className="chat-container">
      <div className="chat-header">
        <i className="bi bi-robot fs-5" />
        <h3>Force Extreme — Asistente Virtual</h3>
      </div>

      <div className="chat-window">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`message ${msg.from === "user" ? "msg-user" : "msg-bot"}`}
          >
            <div className="message-content">{msg.text}</div>
          </div>
        ))}

        {isTyping && (
          <div className="message msg-bot typing">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />

        {/* Sugerencias rápidas (solo al inicio) */}
        {messages.length === 1 && (
          <div className="quick-suggestions">
            {quickSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className="suggestion-btn"
                onClick={() => {
                  setInput(suggestion);
                  // Opcional: enviar inmediatamente
                  setTimeout(() => handleSend(), 100);
                }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="chat-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu pregunta..."
          disabled={isTyping}
        />
        <button onClick={handleSend} disabled={isTyping || !input.trim()}>
          Enviar
        </button>
      </div>

      <style jsx>{`
        .chat-container {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 18px;
          overflow: hidden;
          background: rgba(255, 255, 255, 0.05);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .chat-header {
          background: linear-gradient(135deg, #ff3b30 0%, #b90000 100%);
          color: white;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
        }

        .chat-window {
          height: 340px;
          overflow-y: auto;
          padding: 16px;
          background: rgba(0, 0, 0, 0.25);
          display: flex;
          flex-direction: column;
          gap: 10px;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.15) transparent;
        }

        .message {
          max-width: 82%;
          padding: 10px 14px;
          border-radius: 16px;
          font-size: 13.5px;
          line-height: 1.5;
          word-wrap: break-word;
        }

        .msg-user {
          align-self: flex-end;
          background: #ff3b30;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .msg-bot {
          align-self: flex-start;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.92);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-bottom-left-radius: 4px;
        }

        .typing-indicator {
          display: flex;
          gap: 5px;
          padding: 6px 8px;
          align-items: center;
        }

        .typing-indicator span {
          width: 7px;
          height: 7px;
          background: rgba(255, 255, 255, 0.5);
          border-radius: 50%;
          animation: chatBounce 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

        @keyframes chatBounce {
          0%, 80%, 100% { transform: scale(0); opacity: 0.4; }
          40% { transform: scale(1); opacity: 1; }
        }

        .quick-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
          margin-top: 4px;
          justify-content: flex-start;
        }

        .suggestion-btn {
          background: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.35);
          color: rgba(255, 255, 255, 0.85);
          padding: 5px 12px;
          border-radius: 999px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.18s;
        }

        .suggestion-btn:hover {
          background: rgba(255, 59, 48, 0.25);
          color: #fff;
          border-color: rgba(255, 59, 48, 0.6);
        }

        .chat-input {
          display: flex;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          gap: 8px;
          align-items: center;
        }

        .chat-input input {
          flex: 1;
          padding: 9px 14px;
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 999px;
          outline: none;
          font-size: 13.5px;
          background: rgba(255, 255, 255, 0.07);
          color: rgba(255, 255, 255, 0.92);
          transition: border-color 0.15s;
        }

        .chat-input input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        .chat-input input:focus {
          border-color: rgba(255, 59, 48, 0.6);
          background: rgba(255, 255, 255, 0.09);
        }

        .chat-input button {
          padding: 9px 18px;
          background: #ff3b30;
          color: white;
          border: none;
          border-radius: 999px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: background 0.18s, transform 0.12s;
          white-space: nowrap;
        }

        .chat-input button:hover:not(:disabled) {
          background: #ff1f14;
          transform: scale(1.03);
        }

        .chat-input button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
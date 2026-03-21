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
        <h3>💪 Force Extreme - Asistente Virtual</h3>
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
          max-width: 400px;
          margin: 0 auto;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
            sans-serif;
        }

        .chat-header {
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          color: white;
          padding: 16px;
          text-align: center;
        }

        .chat-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
        }

        .chat-window {
          height: 400px;
          overflow-y: auto;
          padding: 16px;
          background: #f8f9fa;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .message {
          max-width: 80%;
          padding: 12px 16px;
          border-radius: 18px;
          font-size: 14px;
          line-height: 1.4;
          word-wrap: break-word;
        }

        .msg-user {
          align-self: flex-end;
          background: #007bff;
          color: white;
          border-bottom-right-radius: 4px;
        }

        .msg-bot {
          align-self: flex-start;
          background: white;
          color: #333;
          border: 1px solid #e0e0e0;
          border-bottom-left-radius: 4px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 4px 8px;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #999;
          border-radius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }

        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }
        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }

        @keyframes bounce {
          0%,
          80%,
          100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        .quick-suggestions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 8px;
          justify-content: center;
        }

        .suggestion-btn {
          background: white;
          border: 1px solid #007bff;
          color: #007bff;
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .suggestion-btn:hover {
          background: #007bff;
          color: white;
        }

        .chat-input {
          display: flex;
          padding: 12px;
          background: white;
          border-top: 1px solid #e0e0e0;
          gap: 8px;
        }

        .chat-input input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #ddd;
          border-radius: 20px;
          outline: none;
          font-size: 14px;
        }

        .chat-input input:focus {
          border-color: #007bff;
        }

        .chat-input button {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 500;
          transition: background 0.2s;
        }

        .chat-input button:hover:not(:disabled) {
          background: #0056b3;
        }

        .chat-input button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
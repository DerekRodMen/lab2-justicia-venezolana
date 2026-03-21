import Chatbot from "@/components/Chatbot";
import VoiceAssistant from "@/components/VoiceAssistant";
import LeadForm from "@/components/LeadForm";

const beneficios = [
  {
    icon: "bi-person-check",
    title: "Plan personalizado",
    text: "Ajustado a tu objetivo. Sin adivinar.",
  },
  {
    icon: "bi-tools",
    title: "Equipo moderno",
    text: "Zona libre + máquinas para avanzar seguro.",
  },
  {
    icon: "bi-activity",
    title: "Clases guiadas",
    text: "Funcional, HIIT y más. Técnica primero.",
  },
  {
    icon: "bi-heart-pulse",
    title: "Recuperación & hábitos",
    text: "Tips de recuperación y nutrición básica.",
  },
];

const programas = [
  {
    icon: "bi-barbell",
    title: "Fuerza",
    items: ["Progresión semanal", "Técnica y seguridad", "Metas medibles"],
  },
  {
    icon: "bi-lightning",
    title: "HIIT",
    items: ["Alta intensidad", "Resistencia", "Sesiones cortas"],
  },
  {
    icon: "bi-bounding-box-circles",
    title: "Funcional",
    items: ["Movilidad + fuerza", "Trabajo completo", "Progreso real"],
  },
  {
    icon: "bi-emoji-smile",
    title: "Iniciación",
    items: ["Aprende desde cero", "Acompañamiento", "Rutina sencilla"],
  },
];

const testimonios = [
  {
    name: "María G.",
    subtitle: "3 meses entrenando",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=70",
    quote:
      "Me ordenaron el entrenamiento y por fin vi progreso. Los entrenadores corrigen técnica y eso cambia todo.",
  },
  {
    name: "Kevin R.",
    subtitle: "Objetivo: fuerza",
    image:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=70",
    quote:
      "Ambiente motivador. Rutina clara y seguimiento. Cero pérdida de tiempo.",
  },
  {
    name: "Andrea S.",
    subtitle: "Objetivo: acondicionamiento",
    image:
      "https://images.unsplash.com/photo-1525134479668-1bee5c7c6845?auto=format&fit=crop&w=200&q=70",
    quote:
      "Clases intensas pero bien guiadas. Me siento más fuerte y con más energía.",
  },
];

const planes = [
  {
    title: "Básico",
    description: "Para empezar con estructura.",
    price: "₡10.000",
    popular: false,
    buttonClass: "btn btn-fx-outline w-100",
    items: [
      "Acceso a sala de pesas",
      "Rutina inicial",
      "Asesoría básica",
    ],
  },
  {
    title: "Pro",
    description: "El balance ideal para progresar.",
    price: "₡25.000",
    popular: true,
    buttonClass: "btn btn-fx w-100 fw-semibold",
    items: [
      "Pesas + clases guiadas",
      "Seguimiento mensual",
      "Plan por objetivo",
    ],
  },
  {
    title: "Premium",
    description: "Acompañamiento más cercano.",
    price: "₡40.000",
    popular: false,
    buttonClass: "btn btn-fx-outline w-100",
    items: [
      "Todo lo de Pro",
      "Evaluación más completa",
      "Prioridad en horarios/clases",
    ],
  },
];

const faqs = [
  {
    id: "faqOne",
    question: "¿Puedo empezar si nunca he ido al gimnasio?",
    answer:
      "Sí. Justamente uno de los programas está pensado para iniciación, con acompañamiento y una rutina sencilla para que empieces bien.",
  },
  {
    id: "faqTwo",
    question: "¿Cómo funciona la clase de prueba?",
    answer:
      "Nos escribes por WhatsApp, coordinamos horario y te guiamos en una primera visita para que conozcas el ambiente y el enfoque de entrenamiento.",
  },
  {
    id: "faqThree",
    question: "¿Qué plan me conviene?",
    answer:
      "Eso depende de tu objetivo, tiempo disponible y nivel actual. Escríbenos y te ayudamos a elegir el plan más adecuado.",
  },
  {
    id: "faqFour",
    question: "¿Qué incluye la promoción de bienvenida?",
    answer:
      "Incluye evaluación inicial y rutina de arranque sin costo para nuevos clientes, sujeta a cupos por horario.",
  },
  {
    id: "faqFive",
    question: "¿Cómo me inscribo o reservo?",
    answer:
      "Puedes completar el formulario de contacto o escribir por WhatsApp para confirmar plan, horario y proceso de inscripción.",
  },
];

export default function Home() {
  const currentYear = new Date().getFullYear();
  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "50660301104";

  const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    "Hola Force Extreme, quiero agendar una visita."
  )}`;

  return (
    <>
      <a
        className="whatsapp-float"
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
      >
        <i className="bi bi-whatsapp fs-4"></i>
        <span className="d-none d-sm-inline">Hablar por WhatsApp</span>
      </a>

      <nav className="navbar navbar-expand-lg navbar-dark fx-nav fixed-top">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-2" href="#inicio">
            <span className="brand-badge" aria-hidden="true">
              <i className="bi bi-lightning-charge-fill"></i>
            </span>
            <span className="fw-bold">
              Force <span className="fx-accent">Extreme</span>
            </span>
          </a>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#fxNav"
            aria-controls="fxNav"
            aria-expanded="false"
            aria-label="Abrir menú"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="fxNav">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0 gap-lg-2">
              <li className="nav-item">
                <a className="nav-link" href="#beneficios">
                  Beneficios
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#programas">
                  Programas
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#resultados">
                  Resultados
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#promos">
                  Planes
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#asistentes-ia">
                  Asistentes IA
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#contacto">
                  Contacto
                </a>
              </li>
            </ul>

            <div className="d-flex ms-lg-3 mt-3 mt-lg-0">
              <a className="btn btn-fx fw-semibold" href="#contacto">
                <i className="bi bi-calendar-check me-1"></i>
                Agendar visita
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <header id="inicio" className="hero anchor">
          <div className="container">
            <div className="row g-4 align-items-stretch hero-card">
              <div className="col-lg-6 p-4 p-md-5">
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <span className="fx-pill">
                    <i className="bi bi-star-fill text-warning"></i>
                    4.8⭐ reseñas
                  </span>
                  <span className="fx-pill">
                    <i className="bi bi-people-fill"></i>
                    +300 miembros
                  </span>
                  <span className="fx-pill">
                    <i className="bi bi-exclamation-triangle-fill fx-accent-2"></i>
                    Cupos limitados
                  </span>
                </div>

                <h1 className="display-5 fw-black mb-3 fx-black">
                  Entrena fuerte, progresa de verdad.
                </h1>

                <p className="lead mb-4 fx-muted">
                  En <strong>Force Extreme</strong> no vienes a improvisar:
                  entrenas con <strong>plan</strong>, <strong>técnica</strong> y{" "}
                  <strong>acompañamiento</strong>. Elige tu objetivo y te guiamos
                  paso a paso.
                </p>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-4">
                    <div className="fx-kpi">
                      <div className="label">Entrenadores</div>
                      <div className="value">
                        <i className="bi bi-shield-check me-1"></i>
                        Presentes
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="fx-kpi">
                      <div className="label">Plan real</div>
                      <div className="value">
                        <i className="bi bi-graph-up-arrow me-1"></i>
                        Por objetivo
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="fx-kpi">
                      <div className="label">Horarios</div>
                      <div className="value">
                        <i className="bi bi-clock-history me-1"></i>
                        Flexibles
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <a className="btn btn-fx btn-lg fw-semibold" href="#contacto">
                    <i className="bi bi-lightning-charge-fill me-1"></i>
                    Quiero mi clase de prueba
                  </a>
                  <a className="btn btn-fx-outline btn-lg" href="#promos">
                    Ver planes
                    <i className="bi bi-arrow-right ms-1"></i>
                  </a>
                </div>

                <p className="mt-3 mb-0 small fx-muted-2">
                  <i className="bi bi-chat-dots me-1"></i>
                  Te respondemos rápido. Sin spam.
                </p>
              </div>

              <div className="col-lg-6 hero-visual"></div>
            </div>
          </div>
        </header>

        <section className="section pt-0 anchor" id="galeria">
          <div className="container">
            <div className="d-flex align-items-end justify-content-between gap-3 mb-3">
              <div>
                <h2 className="fw-bold mb-1">Ambiente Force Extreme</h2>
                <p className="mb-0 fx-muted">
                  Energía real. Equipos listos. Enfoque total.
                </p>
              </div>
              <span className="fx-pill d-none d-md-inline">
                <i className="bi bi-camera-reels"></i>
                Video opcional
              </span>
            </div>

            <div
              id="fxCarousel"
              className="carousel slide fx-carousel"
              data-bs-ride="carousel"
              aria-label="Carrusel de imágenes del gimnasio"
            >
              <div className="carousel-indicators">
                <button
                  type="button"
                  data-bs-target="#fxCarousel"
                  data-bs-slide-to={0}
                  className="active"
                  aria-current="true"
                  aria-label="Imagen 1"
                ></button>
                <button
                  type="button"
                  data-bs-target="#fxCarousel"
                  data-bs-slide-to={1}
                  aria-label="Imagen 2"
                ></button>
                <button
                  type="button"
                  data-bs-target="#fxCarousel"
                  data-bs-slide-to={2}
                  aria-label="Imagen 3"
                ></button>
              </div>

              <div className="carousel-inner fx-surface">
                <div className="carousel-item active">
                  <div
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1600&q=70')",
                    }}
                  >
                    <div className="overlay"></div>
                    <div className="caption">
                      <h5 className="mb-1 fw-bold">
                        Equipamiento listo para progresar
                      </h5>
                      <p className="mb-0 fx-muted-3">
                        Fuerza, cardio y funcional en un solo lugar.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="carousel-item">
                  <div
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=1600&q=70')",
                    }}
                  >
                    <div className="overlay"></div>
                    <div className="caption">
                      <h5 className="mb-1 fw-bold">Clases guiadas + técnica</h5>
                      <p className="mb-0 fx-muted-3">
                        Entrenas con estructura, no a lo loco.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="carousel-item">
                  <div
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1518459031867-a89b944bffe4?auto=format&fit=crop&w=1600&q=70')",
                    }}
                  >
                    <div className="overlay"></div>
                    <div className="caption">
                      <h5 className="mb-1 fw-bold">Ambiente que te empuja</h5>
                      <p className="mb-0 fx-muted-3">
                        Disciplina, apoyo y progreso constante.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <button
                className="carousel-control-prev"
                type="button"
                data-bs-target="#fxCarousel"
                data-bs-slide="prev"
                aria-label="Anterior"
              >
                <span
                  className="carousel-control-prev-icon"
                  aria-hidden="true"
                ></span>
              </button>

              <button
                className="carousel-control-next"
                type="button"
                data-bs-target="#fxCarousel"
                data-bs-slide="next"
                aria-label="Siguiente"
              >
                <span
                  className="carousel-control-next-icon"
                  aria-hidden="true"
                ></span>
              </button>
            </div>
          </div>
        </section>

        <section className="section anchor" id="beneficios">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold">Beneficios que sí se sienten</h2>
              <p className="mb-0 fx-muted">
                Menos dudas, más progreso. Todo con acompañamiento.
              </p>
            </div>

            <div className="row g-3 g-md-4">
              {beneficios.map((item) => (
                <div className="col-md-6 col-lg-3" key={item.title}>
                  <div className="fx-surface p-4 h-100">
                    <div className="icon-bubble mb-3">
                      <i className={`bi ${item.icon}`}></i>
                    </div>
                    <h5 className="fw-bold">{item.title}</h5>
                    <p className="mb-0 fx-muted">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section anchor" id="programas">
          <div className="container">
            <div className="row align-items-end mb-4">
              <div className="col-lg-7">
                <h2 className="fw-bold mb-1">Programas</h2>
                <p className="mb-0 fx-muted">
                  Elige tu enfoque y te guiamos para que avances.
                </p>
              </div>
              <div className="col-lg-5 text-lg-end mt-3 mt-lg-0">
                <a className="btn btn-fx-outline" href="#contacto">
                  <i className="bi bi-chat-left-text me-1"></i>
                  Quiero asesoría
                </a>
              </div>
            </div>

            <div className="row g-3 g-md-4">
              {programas.map((programa) => (
                <div className="col-md-6 col-lg-3" key={programa.title}>
                  <div className="fx-surface p-4 h-100">
                    <h5 className="fw-bold">
                      <i className={`bi ${programa.icon} me-2`}></i>
                      {programa.title}
                    </h5>
                    <ul className="mb-0 fx-muted">
                      {programa.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section anchor" id="resultados">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold">Testimonios & reseñas</h2>
              <p className="mb-0 fx-muted">Personas reales (placeholders).</p>
            </div>

            <div
              id="fxTestimonials"
              className="carousel slide"
              data-bs-ride="carousel"
              aria-label="Carrusel de testimonios"
            >
              <div className="carousel-inner">
                {testimonios.map((item, index) => (
                  <div
                    key={item.name}
                    className={`carousel-item ${index === 0 ? "active" : ""}`}
                  >
                    <div className="fx-surface p-4 p-md-5">
                      <div className="d-flex align-items-center gap-3 mb-3">
                        <img
                          className="avatar"
                          src={item.image}
                          alt={`Foto de ${item.name}`}
                        />
                        <div>
                          <div className="fw-bold">{item.name}</div>
                          <div className="small fx-muted">{item.subtitle}</div>
                        </div>
                        <div className="ms-auto text-warning">
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                          <i className="bi bi-star-fill"></i>
                        </div>
                      </div>

                      <p className="quote mb-0">"{item.quote}"</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="d-flex justify-content-center gap-2 mt-3">
                <button
                  className="btn btn-fx-outline"
                  type="button"
                  data-bs-target="#fxTestimonials"
                  data-bs-slide="prev"
                  aria-label="Anterior"
                >
                  <i className="bi bi-arrow-left"></i>
                </button>
                <button
                  className="btn btn-fx-outline"
                  type="button"
                  data-bs-target="#fxTestimonials"
                  data-bs-slide="next"
                  aria-label="Siguiente"
                >
                  <i className="bi bi-arrow-right"></i>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="section anchor" id="promos">
          <div className="container">
            <div className="promo p-4 p-md-5 mb-4">
              <div className="row align-items-center g-3">
                <div className="col-lg-8">
                  <h2 className="fw-bold mb-2">Promoción de bienvenida</h2>
                  <p className="mb-0 fx-muted-3">
                    Inscríbete hoy y recibe una{" "}
                    <strong>evaluación + rutina inicial</strong> sin costo.
                  </p>
                </div>
                <div className="col-lg-4 text-lg-end">
                  <a className="btn btn-fx btn-lg fw-semibold" href="#contacto">
                    <i className="bi bi-ticket-perforated me-1"></i>
                    Obtener mi beneficio
                  </a>
                  <div className="small mt-2 fx-muted-3">
                    *Cupos limitados por horario
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center mb-4">
              <h2 className="fw-bold">Planes simples</h2>
              <p className="mb-0 fx-muted">
                Máximo 3 opciones para decidir rápido.
              </p>
            </div>

            <div className="row g-3 g-md-4">
              {planes.map((plan) => (
                <div className="col-md-6 col-lg-4" key={plan.title}>
                  <div
                    className={`fx-surface p-4 h-100 ${
                      plan.popular ? "position-relative fx-popular" : ""
                    }`}
                  >
                    {plan.popular && (
                      <span className="fx-pill position-absolute top-0 start-50 translate-middle fx-pill-hot">
                        <i className="bi bi-fire"></i>
                        Más popular
                      </span>
                    )}

                    <h5 className={`fw-bold mb-1 ${plan.popular ? "mt-2" : ""}`}>
                      {plan.title}
                    </h5>
                    <p className="mb-3 fx-muted">{plan.description}</p>
                    <div className="display-6 fw-bold mb-3">{plan.price}</div>
                    <ul className="mb-4 fx-muted">
                      {plan.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <a className={plan.buttonClass} href="#contacto">
                      Elegir plan
                    </a>

                    {plan.popular && (
                      <div className="small mt-2 fx-muted-3">
                        Garantía (placeholder): si no te gusta en 7 días, lo
                        conversamos.
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section anchor" id="asistentes-ia">
          <div className="container">
            <div className="text-center mb-5">
              <h2 className="fw-bold">Asistentes Inteligentes</h2>
              <p className="mb-0 fx-muted">
                Contáctanos de la forma que prefieras: voz o chat
              </p>
            </div>

            <div className="row g-4">
              <div className="col-lg-6">
                <div className="fx-surface p-4 h-100">
                  <h3 className="fw-bold h4 mb-3">
                    <i className="bi bi-mic-fill me-2 text-primary"></i>
                    Asistente de Voz
                  </h3>
                  <p className="fx-muted mb-4">
                    Habla con nuestro asistente virtual. Ideal para consultas rápidas mientras entrenas.
                  </p>
                  <VoiceAssistant />
                </div>
              </div>

              <div className="col-lg-6">
                <div className="fx-surface p-4 h-100">
                  <h3 className="fw-bold h4 mb-3">
                    <i className="bi bi-chat-dots-fill me-2 text-success"></i>
                    Chatbot de Atención
                  </h3>
                  <p className="fx-muted mb-4">
                    Chatea con nuestro bot para resolver dudas sobre planes, horarios y más.
                  </p>
                  <Chatbot />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section anchor" id="contacto">
          <div className="container">
            <div className="row g-4">
              <div className="col-lg-6">
                <h2 className="fw-bold mb-2">Agenda tu visita</h2>
                <p className="fx-muted">
                  Completa este formulario. Al enviar, se abrirá WhatsApp con tu
                  mensaje listo.
                </p>

                <div className="fx-surface p-4">
                  <LeadForm />
                </div>
              </div>

              <div className="col-lg-6">
                <div className="fx-surface p-4 h-100">
                  <h3 className="fw-bold h4 mb-3">Contacto directo</h3>
                  <p className="fx-muted mb-4">
                    También puedes escribirnos de una vez o revisar estas dudas
                    rápidas.
                  </p>

                  <div className="d-grid gap-3 mb-4">
                    <a
                      className="contact-line"
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span className="contact-line-icon">
                        <i className="bi bi-whatsapp"></i>
                      </span>
                      <span>
                        <small>WhatsApp</small>
                        <strong>{whatsappNumber}</strong>
                      </span>
                    </a>

                    <div className="contact-line">
                      <span className="contact-line-icon">
                        <i className="bi bi-clock"></i>
                      </span>
                      <span>
                        <small>Horario</small>
                        <strong>Lunes a sábado</strong>
                      </span>
                    </div>

                    <div className="contact-line">
                      <span className="contact-line-icon">
                        <i className="bi bi-geo-alt"></i>
                      </span>
                      <span>
                        <small>Ubicación</small>
                        <strong>Agrega aquí tu dirección</strong>
                      </span>
                    </div>
                  </div>

                  <h4 className="fw-bold h5 mb-3">Preguntas frecuentes</h4>

                  <div className="accordion" id="fxFaq">
                    {faqs.map((faq, index) => (
                      <div className="accordion-item mb-3" key={faq.id}>
                        <h2 className="accordion-header">
                          <button
                            className={`accordion-button ${
                              index !== 0 ? "collapsed" : ""
                            }`}
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#${faq.id}`}
                            aria-expanded={index === 0 ? "true" : "false"}
                            aria-controls={faq.id}
                          >
                            {faq.question}
                          </button>
                        </h2>
                        <div
                          id={faq.id}
                          className={`accordion-collapse collapse ${
                            index === 0 ? "show" : ""
                          }`}
                          data-bs-parent="#fxFaq"
                        >
                          <div className="accordion-body">{faq.answer}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-4">
        <div className="container">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-start align-items-lg-center gap-3">
            <div>
              <div className="fw-bold fs-5">
                Force <span className="fx-accent">Extreme</span>
              </div>
              <div className="small fx-muted">
                Entrena con estructura, técnica y acompañamiento.
              </div>
            </div>

            <div className="d-flex flex-wrap gap-3 footer-links">
              <a href="#beneficios">Beneficios</a>
              <a href="#programas">Programas</a>
              <a href="#promos">Planes</a>
              <a href="#contacto">Contacto</a>
            </div>

            <div className="small fx-muted">
              © {currentYear} Force Extreme. Todos los derechos reservados.
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
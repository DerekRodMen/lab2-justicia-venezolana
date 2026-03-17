"use client";

import { FormEvent, useState } from "react";

type LeadFormState = {
  nombre: string;
  telefono: string;
  objetivo: string;
  mensaje: string;
};

type LeadFormErrors = {
  nombre?: boolean;
  telefono?: boolean;
  objetivo?: boolean;
};

export default function LeadForm() {
  const [form, setForm] = useState<LeadFormState>({
    nombre: "",
    telefono: "",
    objetivo: "",
    mensaje: "",
  });

  const [errors, setErrors] = useState<LeadFormErrors>({});

  const whatsappNumber =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "50660301104";

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: false,
    }));
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nextErrors: LeadFormErrors = {
      nombre: !form.nombre.trim(),
      telefono: !form.telefono.trim(),
      objetivo: !form.objetivo.trim(),
    };

    setErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) return;

    const text = [
      "Hola Force Extreme, quiero agendar una visita.",
      "",
      `Nombre: ${form.nombre.trim()}`,
      `Tel/WhatsApp: ${form.telefono.trim()}`,
      `Objetivo: ${form.objetivo}`,
      form.mensaje.trim() ? `Mensaje: ${form.mensaje.trim()}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <form id="leadForm" noValidate onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label" htmlFor="nombre">
            Nombre
          </label>
          <input
            className={`form-control ${errors.nombre ? "is-invalid" : ""}`}
            id="nombre"
            name="nombre"
            type="text"
            placeholder="Tu nombre"
            autoComplete="name"
            value={form.nombre}
            onChange={handleChange}
          />
          <div className="invalid-feedback">Escribe tu nombre.</div>
        </div>

        <div className="col-md-6">
          <label className="form-label" htmlFor="telefono">
            WhatsApp / Teléfono
          </label>
          <input
            className={`form-control ${errors.telefono ? "is-invalid" : ""}`}
            id="telefono"
            name="telefono"
            type="tel"
            placeholder="6030-1104"
            autoComplete="tel"
            value={form.telefono}
            onChange={handleChange}
          />
          <div className="form-text">
            Tip: usa tu WhatsApp para coordinar más rápido.
          </div>
          <div className="invalid-feedback">Escribe tu número.</div>
        </div>

        <div className="col-12">
          <label className="form-label" htmlFor="objetivo">
            Objetivo
          </label>
          <select
            className={`form-select ${errors.objetivo ? "is-invalid" : ""}`}
            id="objetivo"
            name="objetivo"
            value={form.objetivo}
            onChange={handleChange}
          >
            <option value="">Selecciona una opción</option>
            <option value="Bajar grasa">Bajar grasa</option>
            <option value="Ganar músculo">Ganar músculo</option>
            <option value="Mejorar condición física">
              Mejorar condición física
            </option>
            <option value="Empezar desde cero">Empezar desde cero</option>
          </select>
          <div className="invalid-feedback">Selecciona tu objetivo.</div>
        </div>

        <div className="col-12">
          <label className="form-label" htmlFor="mensaje">
            Mensaje
          </label>
          <textarea
            className="form-control"
            id="mensaje"
            name="mensaje"
            rows={4}
            placeholder="Cuéntanos un poco más"
            value={form.mensaje}
            onChange={handleChange}
          />
        </div>

        <div className="col-12">
          <button type="submit" className="btn btn-fx w-100 fw-semibold">
            <i className="bi bi-whatsapp me-2"></i>
            Enviar por WhatsApp
          </button>
        </div>
      </div>
    </form>
  );
}
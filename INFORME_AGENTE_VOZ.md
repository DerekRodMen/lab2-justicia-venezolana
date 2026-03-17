# Informe breve: Integración de agente de voz IA

## 1) Nombre del emprendimiento
**Force Extreme**

## 2) Objetivo del sitio web
Presentar los servicios del gimnasio, mostrar beneficios, planes y testimonios, y facilitar la conversión de visitantes a clientes mediante formulario y contacto por WhatsApp.

## 3) Herramienta de voz utilizada
Se implementó una **demo de agente de voz con Web Speech API (SpeechRecognition + SpeechSynthesis)** en el navegador.

## 4) Justificación de la elección
- Es gratuita para fines académicos (no requiere plan pago).
- Permite reconocimiento de voz y respuestas habladas.
- Se integra de forma directa en una aplicación web Next.js.
- Aporta una experiencia accesible e interactiva para potenciales clientes.

## 5) Descripción del funcionamiento
- El usuario pulsa **“Hablar con el asistente”**.
- El sistema escucha la consulta por voz en español.
- Se detecta intención con una base de conocimiento orientada al negocio.
- El asistente responde con texto y voz.
- Incluye botones de **preguntas rápidas** para pruebas sin micrófono.

## 6) Información cargada en el agente
El asistente responde sobre:
- nombre del emprendimiento
- descripción breve del negocio
- productos/servicios principales
- horarios de atención
- ubicación/cobertura
- medios de contacto
- promociones y precios
- proceso de compra/inscripción

## 7) Preguntas frecuentes cargadas (mínimo 5)
1. ¿Puedo empezar si nunca he ido al gimnasio?
2. ¿Cómo funciona la clase de prueba?
3. ¿Qué plan me conviene?
4. ¿Qué incluye la promoción de bienvenida?
5. ¿Puedo pagar y reservar por WhatsApp?

## 8) Dificultades encontradas
- Compatibilidad parcial de reconocimiento de voz según navegador.
- Variaciones de precisión por ruido ambiente o pronunciación.
- En algunos navegadores móviles la activación puede requerir interacción estricta del usuario.

## 9) Conclusiones
La integración cumple el objetivo académico de prototipo funcional: agrega interacción por voz útil, mejora la experiencia del cliente y demuestra cómo un asistente virtual puede apoyar la atención de un emprendimiento sin depender de herramientas pagas.

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método no permitido"
        });
    }

    try {

        const { messages, pregunta } = req.body || {};

        let historial = messages;

        // Compatibilidad con tu versión anterior
        if (!Array.isArray(historial)) {
            historial = [
                {
                    role: "user",
                    content: String(pregunta || "")
                }
            ];
        }

        if (
            historial.length === 0 ||
            !historial.some(m => m.role === "user")
        ) {
            return res.status(400).json({
                error: "No se recibió ninguna pregunta."
            });
        }

        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "Falta GROQ_API_KEY en las variables de entorno."
            });
        }

        const mensajes = [
            {
                role: "system",
                content:
                    "Tu nombre es Emmet. Eres un asistente de voz personal. " +
                    "Habla de forma natural, cercana y clara. " +
                    "Responde en el mismo idioma que use la persona. " +
                    "Si te hablan en español, responde en español. " +
                    "Si te hablan en catalán, responde en catalán. " +
                    "Sé natural y breve porque tus respuestas serán habladas. " +
                    "No uses listas enormes ni explicaciones innecesariamente largas."
            },
            ...historial.slice(-20)
        ];

        const respuesta = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`
                },

                body: JSON.stringify({
                    model: "openai/gpt-oss-120b",
                    messages: mensajes,
                    temperature: 0.7,
                    max_completion_tokens: 1000
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {

            console.error("ERROR GROQ:", datos);

            return res.status(respuesta.status).json({
                error:
                    datos?.error?.message ||
                    "Error de Groq"
            });
        }

        const texto =
            datos?.choices?.[0]?.message?.content
                ?.trim();

        if (!texto) {
            return res.status(502).json({
                error: "Groq no devolvió una respuesta."
            });
        }

        return res.status(200).json({
            respuesta: texto
        });

    } catch (error) {

        console.error("ERROR API:", error);

        return res.status(500).json({
            error: "Error interno de Emmet."
        });
    }
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método no permitido"
        });
    }

    try {
        const { messages, pregunta } = req.body || {};

        let historial = messages;

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

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "Falta GEMINI_API_KEY en las variables de entorno."
            });
        }

        const systemPrompt =
            "Tu nombre es Emmet. Eres un asistente de voz personal. " +
            "Habla de forma natural, cercana y clara. " +
            "Responde en el mismo idioma que use la persona. " +
            "Si te hablan en español, responde en español. " +
            "Si te hablan en catalán, responde en catalán. " +
            "Sé natural y breve porque tus respuestas serán habladas.";

        const contents = historial.slice(-20).map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [
                {
                    text: String(m.content || "")
                }
            ]
        }));

        const respuesta = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": apiKey
                },

                body: JSON.stringify({
                    systemInstruction: {
                        parts: [
                            {
                                text: systemPrompt
                            }
                        ]
                    },
                    contents
                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
            console.error("ERROR GEMINI:", datos);

            return res.status(respuesta.status).json({
                error:
                    datos?.error?.message ||
                    "Error de Gemini"
            });
        }

        const texto =
            datos?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!texto) {
            return res.status(502).json({
                error: "Gemini no devolvió una respuesta."
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

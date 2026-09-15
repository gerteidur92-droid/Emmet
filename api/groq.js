export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Método no permitido."
        });
    }

    try {

        const { pregunta } = req.body;

        if (!pregunta) {

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

        const respuesta = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=" +
            encodeURIComponent(apiKey),
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    system_instruction: {
                        parts: [
                            {
                                text:
                                "Tu nombre es Emmet. Eres un asistente de voz pequeño, simpático y rápido. Responde en español salvo que el usuario hable en catalán. Sé natural y breve porque tus respuestas serán leídas en voz alta. No uses listas enormes ni explicaciones innecesariamente largas."
                            }
                        ]
                    },

                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: pregunta
                                }
                            ]
                        }
                    ]

                })
            }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {

            console.error(datos);

            return res.status(respuesta.status).json({
                error: "Gemini devolvió un error."
            });

        }

        const texto =
            datos?.candidates?.[0]?.content?.parts
                ?.map(parte => parte.text || "")
                .join("")
                .trim();

        if (!texto) {

            return res.status(500).json({
                error: "Gemini no devolvió texto."
            });

        }

        return res.status(200).json({
            respuesta: texto
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            error: "Error interno del servidor."
        });

    }
}

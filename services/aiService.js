// ============================================================
// CLOUDLIFE - AI SERVICE
// Gemini AI Integration
// ============================================================

const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});


// ============================================================
// WAIT FUNCTION
// ============================================================

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


// ============================================================
// ASK CLOUDLIFE AI
// ============================================================

async function askCloudLifeAI(userMessage, context = {}) {

    const prompt = `
You are CloudLife AI, the intelligent personal assistant
inside the CloudLife personal life management system.

Your job is to help the user manage and understand their
tasks, expenses, events, notes and personal information.

RULES:
1. Be helpful and friendly.
2. Give concise but useful answers.
3. Use the CloudLife data provided below.
4. Never invent personal data.
5. If the required information is not available, say so clearly.
6. When useful, organize information using bullet points.
7. For recommendations, explain the reasoning briefly.

USER QUESTION:
${userMessage}

CLOUDLIFE DATA:
${JSON.stringify(context, null, 2)}

Now answer the user's question.
`;


    // ========================================================
    // TRY 1 - GEMINI 3.8 FLASH
    // ========================================================

    try {

        console.log("Trying Gemini 3.8 Flash...");

        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt
        });

        console.log("Gemini 3.8 Flash response received.");

        return response.text;

    } catch (error) {

        console.error(
            "Gemini 3.8 Flash failed:",
            error.message
        );


        // ====================================================
        // RETRY IF TEMPORARY 503 ERROR
        // ====================================================

        if (error.status === 503) {

            console.log(
                "Gemini service temporarily unavailable."
            );

            console.log(
                "Waiting 2 seconds before retry..."
            );

            await wait(2000);


            // =================================================
            // RETRY SAME MODEL
            // =================================================

            try {

                console.log(
                    "Retrying Gemini 3.8 Flash..."
                );

                const retryResponse =
                    await ai.models.generateContent({
                        model: "gemini-3.8-flash",
                        contents: prompt
                    });

                console.log(
                    "Retry successful."
                );

                return retryResponse.text;

            } catch (retryError) {

                console.error(
                    "Retry failed:",
                    retryError.message
                );


                // =============================================
                // FALLBACK MODEL
                // =============================================

                console.log(
                    "Trying fallback model: Gemini 2.5 Flash..."
                );

                try {

                    const fallbackResponse =
                        await ai.models.generateContent({
                            model: "gemini-2.5-flash",
                            contents: prompt
                        });

                    console.log(
                        "Fallback model response received."
                    );

                    return fallbackResponse.text;

                } catch (fallbackError) {

                    console.error(
                        "Fallback model failed:",
                        fallbackError.message
                    );

                    throw fallbackError;
                }
            }
        }


        // ====================================================
        // OTHER ERRORS
        // ====================================================

        throw error;
    }
}


module.exports = {
    askCloudLifeAI
};
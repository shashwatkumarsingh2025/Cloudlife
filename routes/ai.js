// ============================================================
// CLOUDLIFE - AI ROUTES
// ============================================================

const express = require("express");

const router = express.Router();


// ============================================================
// SERVICES
// ============================================================

const {
    askCloudLifeAI
} = require("../services/aiService");

const {
    getCloudLifeData
} = require("../services/cloudlifeData");


// ============================================================
// POST /api/ai/chat
// ============================================================

router.post("/chat", async (req, res) => {

    try {

        const { message } = req.body;


        // ====================================================
        // VALIDATE MESSAGE
        // ====================================================

        if (!message || message.trim() === "") {

            return res.status(400).json({
                success: false,
                error: "Message is required"
            });

        }


        console.log(
            "CloudLife AI Question:",
            message
        );


        // ====================================================
        // GET DATA FROM SUPABASE
        // ====================================================

        console.log(
            "Fetching CloudLife data..."
        );

        const cloudLifeData =
            await getCloudLifeData();

        console.log(
            "CloudLife data fetched successfully."
        );


        // ====================================================
        // SEND QUESTION + DATA TO GEMINI
        // ====================================================

        const reply = await askCloudLifeAI(
            message,
            cloudLifeData
        );


        // ====================================================
        // SEND RESPONSE
        // ====================================================

        res.json({
            success: true,
            reply: reply
        });


    } catch (error) {

        console.error(
            "AI Route Error:",
            error
        );

        res.status(500).json({
            success: false,
            error: "CloudLife AI failed to process the request"
        });

    }

});


module.exports = router;
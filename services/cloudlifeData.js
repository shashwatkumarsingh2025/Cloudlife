// ============================================================
// CLOUDLIFE - DATA SERVICE
// Fetches CloudLife data from Supabase for AI
// ============================================================

const supabase = require("../database/supabase");

// ============================================================
// GET ALL CLOUDLIFE DATA
// ============================================================

async function getCloudLifeData() {

    try {

        // Fetch Tasks, Expenses, Notes and Events
        // at the same time

        const [
            tasksResult,
            expensesResult,
            notesResult,
            eventsResult
        ] = await Promise.all([

            supabase
                .from("tasks")
                .select("*")
                .order("created_at", { ascending: false }),

            supabase
                .from("expenses")
                .select("*")
                .order("created_at", { ascending: false }),

            supabase
                .from("notes")
                .select("*")
                .order("created_at", { ascending: false }),

            supabase
                .from("events")
                .select("*")
                .order("event_date", { ascending: true })

        ]);


        // ====================================================
        // CHECK FOR DATABASE ERRORS
        // ====================================================

        if (tasksResult.error) {
            throw tasksResult.error;
        }

        if (expensesResult.error) {
            throw expensesResult.error;
        }

        if (notesResult.error) {
            throw notesResult.error;
        }

        if (eventsResult.error) {
            throw eventsResult.error;
        }


        // ====================================================
        // RETURN DATA
        // ====================================================

        return {

            tasks: tasksResult.data || [],

            expenses: expensesResult.data || [],

            notes: notesResult.data || [],

            events: eventsResult.data || []

        };

    } catch (error) {

        console.error(
            "CloudLife Data Service Error:",
            error.message
        );

        throw error;
    }
}


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    getCloudLifeData
};
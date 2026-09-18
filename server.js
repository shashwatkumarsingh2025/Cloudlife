const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const app = express();


// ========================================
// MIDDLEWARE
// ========================================

app.use(cors());
app.use(express.json());

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ========================================
// SWAGGER API DOCUMENTATION
// ========================================

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);


// ========================================
// SUPABASE CONNECTION
// ========================================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);


// ========================================
// HOME / FRONTEND
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ========================================
// BACKEND HEALTH CHECK
// ========================================

app.get("/api/health", async (req, res) => {

    try {

        const {
            data: tasks,
            error: taskError
        } = await supabase
            .from("tasks")
            .select("*");


        const {
            data: expenses,
            error: expenseError
        } = await supabase
            .from("expenses")
            .select("*");


        const {
            data: notes,
            error: noteError
        } = await supabase
            .from("notes")
            .select("*");


        const {
            data: events,
            error: eventError
        } = await supabase
            .from("events")
            .select("*");


        const errors = [];


        if (taskError) {

            errors.push({
                module: "Tasks",
                error: taskError.message
            });

        }


        if (expenseError) {

            errors.push({
                module: "Expenses",
                error: expenseError.message
            });

        }


        if (noteError) {

            errors.push({
                module: "Notes",
                error: noteError.message
            });

        }


        if (eventError) {

            errors.push({
                module: "Events",
                error: eventError.message
            });

        }


        if (errors.length > 0) {

            return res.status(500).json({

                success: false,

                message:
                    "CloudLife backend has errors",

                backend: {

                    status: "ONLINE",

                    framework:
                        "Node.js + Express"

                },

                database: {

                    status: "ERROR",

                    provider:
                        "Supabase PostgreSQL"

                },

                modules: {

                    tasks:
                        !taskError,

                    expenses:
                        !expenseError,

                    notes:
                        !noteError,

                    events:
                        !eventError

                },

                errors

            });

        }


        res.json({

            success: true,

            message:
                "CloudLife Backend & Supabase are working perfectly!",


            backend: {

                status: "ONLINE",

                framework:
                    "Node.js + Express",

                api:
                    "REST API"

            },


            database: {

                status: "CONNECTED",

                provider:
                    "Supabase PostgreSQL"

            },


            modules: {

                tasks: {

                    status: "WORKING",

                    records:
                        tasks.length

                },

                expenses: {

                    status: "WORKING",

                    records:
                        expenses.length

                },

                notes: {

                    status: "WORKING",

                    records:
                        notes.length

                },

                events: {

                    status: "WORKING",

                    records:
                        events.length

                }

            },


            timestamp:
                new Date().toISOString()

        });

    }

    catch (error) {

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Backend health check failed",

            error:
                error.message

        });

    }

});


// ========================================
// SUPABASE CONNECTION TEST
// ========================================

app.get("/api/test", async (req, res) => {

    const {
        data,
        error
    } = await supabase
        .from("tasks")
        .select("*")
        .limit(1);


    if (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            error:
                error.message

        });

    }


    res.json({

        success: true,

        message:
            "CloudLife connected to Supabase!",

        data

    });

});


// ========================================
// TASKS - GET ALL
// ========================================

app.get("/api/tasks", async (req, res) => {

    const {
        data,
        error
    } = await supabase
        .from("tasks")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        return res.status(500).json({

            error:
                error.message

        });

    }


    res.json(data);

});


// ========================================
// TASKS - CREATE
// ========================================

app.post("/api/tasks", async (req, res) => {

    const {
        title,
        description,
        priority,
        due_date
    } = req.body;


    if (!title) {

        return res.status(400).json({

            error:
                "Task title is required"

        });

    }


    const {
        data,
        error
    } = await supabase
        .from("tasks")
        .insert([{

            title,

            description,

            priority,

            due_date:
                due_date || null

        }])
        .select();


    if (error) {

        return res.status(500).json({

            error:
                error.message

        });

    }


    res.json(data[0]);

});


// ========================================
// TASKS - UPDATE STATUS
// ========================================

app.put("/api/tasks/:id", async (req, res) => {

    const {
        id
    } = req.params;


    const {
        status
    } = req.body;


    const {
        data,
        error
    } = await supabase
        .from("tasks")
        .update({

            status

        })
        .eq("id", id)
        .select();


    if (error) {

        return res.status(500).json({

            error:
                error.message

        });

    }


    res.json(data[0]);

});


// ========================================
// TASKS - DELETE
// ========================================

app.delete("/api/tasks/:id", async (req, res) => {

    const {
        id
    } = req.params;


    const {
        error
    } = await supabase
        .from("tasks")
        .delete()
        .eq("id", id);


    if (error) {

        return res.status(500).json({

            error:
                error.message

        });

    }


    res.json({

        message:
            "Task deleted successfully"

    });

});


// ========================================
// EXPENSES - GET ALL
// ========================================

app.get("/api/expenses", async (req, res) => {

    const {
        data,
        error
    } = await supabase
        .from("expenses")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        return res.status(500).json({

            error:
                error.message

        });

    }


    res.json(data);

});


// ========================================
// EXPENSES - CREATE
// ========================================

app.post("/api/expenses", async (req, res) => {

    const {
        title,
        amount,
        category
    } = req.body;


    if (!title || !amount) {

        return res.status(400).json({

            error:
                "Title and amount are required"

        });

    }


    const {
        data,
        error
    } = await supabase
        .from("expenses")
        .insert([{

            title,

            amount,

            category

        }])
        .select();


    if (error) {

        return res.status(500).json({

            error:
                error.message

        });

    }


    res.json(data[0]);

});


// ========================================
// EXPENSES - DELETE
// ========================================

app.delete(
    "/api/expenses/:id",
    async (req, res) => {

        const {
            id
        } = req.params;


        const {
            error
        } = await supabase
            .from("expenses")
            .delete()
            .eq("id", id);


        if (error) {

            return res.status(500).json({

                error:
                    error.message

            });

        }


        res.json({

            message:
                "Expense deleted successfully"

        });

    }
);


// ========================================
// NOTES - GET ALL
// ========================================

app.get("/api/notes", async (req, res) => {

    const {
        data,
        error
    } = await supabase
        .from("notes")
        .select("*")
        .order(
            "created_at",
            {
                ascending: false
            }
        );


    if (error) {

        return res.status(500).json({

            error:
                error.message

        });

    }


    res.json(data);

});


// ========================================
// NOTES - CREATE
// ========================================

app.post("/api/notes", async (req, res) => {

    const {
        title,
        content
    } = req.body;


    if (!title) {

        return res.status(400).json({

            error:
                "Note title is required"

        });

    }


    const {
        data,
        error
    } = await supabase
        .from("notes")
        .insert([{

            title,

            content

        }])
        .select();


    if (error) {

        return res.status(500).json({

            error:
                error.message

        });

    }


    res.json(data[0]);

});


// ========================================
// NOTES - DELETE
// ========================================

app.delete(
    "/api/notes/:id",
    async (req, res) => {

        const {
            id
        } = req.params;


        const {
            error
        } = await supabase
            .from("notes")
            .delete()
            .eq("id", id);


        if (error) {

            return res.status(500).json({

                error:
                    error.message

            });

        }


        res.json({

            message:
                "Note deleted successfully"

        });

    }
);


// ========================================
// EVENTS - GET ALL
// ========================================

app.get("/api/events", async (req, res) => {

    const {
        data,
        error
    } = await supabase
        .from("events")
        .select("*")
        .order(
            "event_date",
            {
                ascending: true
            }
        );


    if (error) {

        return res.status(500).json({

            error:
                error.message

        });

    }


    res.json(data);

});


// ========================================
// EVENTS - CREATE
// ========================================

app.post("/api/events", async (req, res) => {

    const {
        title,
        event_date,
        event_time,
        description
    } = req.body;


    if (!title || !event_date) {

        return res.status(400).json({

            error:
                "Title and date are required"

        });

    }


    const {
        data,
        error
    } = await supabase
        .from("events")
        .insert([{

            title,

            event_date,

            event_time:
                event_time || null,

            description

        }])
        .select();


    if (error) {

        return res.status(500).json({

            error:
                error.message

        });

    }


    res.json(data[0]);

});


// ========================================
// EVENTS - DELETE
// ========================================

app.delete(
    "/api/events/:id",
    async (req, res) => {

        const {
            id
        } = req.params;


        const {
            error
        } = await supabase
            .from("events")
            .delete()
            .eq("id", id);


        if (error) {

            return res.status(500).json({

                error:
                    error.message

            });

        }


        res.json({

            message:
                "Event deleted successfully"

        });

    }
);


// ========================================
// DASHBOARD STATISTICS
// ========================================

app.get("/api/stats", async (req, res) => {

    try {

        const {
            data: tasks
        } = await supabase
            .from("tasks")
            .select("*");


        const {
            data: expenses
        } = await supabase
            .from("expenses")
            .select("*");


        const {
            data: notes
        } = await supabase
            .from("notes")
            .select("*");


        const {
            data: events
        } = await supabase
            .from("events")
            .select("*");


        const taskData =
            tasks || [];


        const expenseData =
            expenses || [];


        const noteData =
            notes || [];


        const eventData =
            events || [];


        const completedTasks =
            taskData.filter(
                task =>
                    task.status === "Completed"
            ).length;


        const totalExpenses =
            expenseData.reduce(

                (sum, expense) =>
                    sum +
                    Number(
                        expense.amount
                    ),

                0

            );


        res.json({

            tasks:
                taskData.length,

            completedTasks,

            expenses:
                totalExpenses,

            notes:
                noteData.length,

            events:
                eventData.length

        });

    }

    catch (error) {

        res.status(500).json({

            error:
                error.message

        });

    }

});


// ========================================
// 404 API HANDLER
// ========================================

app.use("/api", (req, res) => {

    res.status(404).json({

        success: false,

        message:
            "API endpoint not found",

        path:
            req.originalUrl

    });

});


// ========================================
// SERVER START
// ========================================

const PORT =
    process.env.PORT || 3000;


app.listen(PORT, () => {

    console.log(
        `CloudLife running on port ${PORT}`
    );

    console.log(
        `Frontend: http://localhost:${PORT}`
    );

    console.log(
        `Swagger: http://localhost:${PORT}/api-docs`
    );

    console.log(
        `Health: http://localhost:${PORT}/api/health`
    );

});

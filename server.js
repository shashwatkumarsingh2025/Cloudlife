const express = require("express");
const cors = require("cors");
const path = require("path");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

const app = express();

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// SWAGGER API DOCUMENTATION
// ===============================

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);

// ===============================
// SUPABASE CONNECTION
// ===============================

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// ===============================
// FRONTEND
// ===============================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===============================
// HEALTH CHECK
// ===============================

app.get("/api/health", async (req, res) => {
    try {
        const tables = ["tasks", "expenses", "notes", "events"];
        const results = {};

        for (const table of tables) {
            const { count, error } = await supabase
                .from(table)
                .select("*", { count: "exact", head: true });

            if (error) {
                throw error;
            }

            results[table] = {
                status: "WORKING",
                records: count || 0
            };
        }

        res.json({
            success: true,
            message: "CloudLife Backend & Supabase are working perfectly!",
            backend: {
                status: "ONLINE",
                framework: "Node.js + Express",
                api: "REST API"
            },
            database: {
                status: "CONNECTED",
                provider: "Supabase PostgreSQL"
            },
            modules: {
                tasks: results.tasks,
                expenses: results.expenses,
                notes: results.notes,
                events: results.events
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Health check failed",
            error: error.message
        });
    }
});

// ===============================
// TEST API
// ===============================

app.get("/api/test", (req, res) => {
    res.json({
        success: true,
        message: "CloudLife API is working!"
    });
});

// =====================================================
// TASKS
// =====================================================

// GET ALL TASKS
app.get("/api/tasks", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("tasks")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ADD TASK
app.post("/api/tasks", async (req, res) => {
    try {
        const { title, description, status, due_date } = req.body;

        const { data, error } = await supabase
            .from("tasks")
            .insert([
                {
                    title,
                    description,
                    status: status || "Pending",
                    due_date
                }
            ])
            .select();

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Task added successfully",
            data: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// UPDATE TASK STATUS
app.put("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const { data, error } = await supabase
            .from("tasks")
            .update({ status })
            .eq("id", id)
            .select();

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: "Task updated successfully",
            data: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE TASK
app.delete("/api/tasks/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("tasks")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: "Task deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =====================================================
// EXPENSES
// =====================================================

// GET ALL EXPENSES
app.get("/api/expenses", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("expenses")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ADD EXPENSE
app.post("/api/expenses", async (req, res) => {
    try {
        const { title, amount, category, expense_date } = req.body;

        const { data, error } = await supabase
            .from("expenses")
            .insert([
                {
                    title,
                    amount,
                    category,
                    expense_date
                }
            ])
            .select();

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Expense added successfully",
            data: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE EXPENSE
app.delete("/api/expenses/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("expenses")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: "Expense deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =====================================================
// NOTES
// =====================================================

// GET ALL NOTES
app.get("/api/notes", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("notes")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ADD NOTE
app.post("/api/notes", async (req, res) => {
    try {
        const { title, content } = req.body;

        const { data, error } = await supabase
            .from("notes")
            .insert([
                {
                    title,
                    content
                }
            ])
            .select();

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Note added successfully",
            data: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE NOTE
app.delete("/api/notes/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("notes")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: "Note deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =====================================================
// EVENTS
// =====================================================

// GET ALL EVENTS
app.get("/api/events", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("events")
            .select("*")
            .order("id", { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            data: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ADD EVENT
app.post("/api/events", async (req, res) => {
    try {
        const { title, description, event_date, event_time } = req.body;

        const { data, error } = await supabase
            .from("events")
            .insert([
                {
                    title,
                    description,
                    event_date,
                    event_time
                }
            ])
            .select();

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: "Event added successfully",
            data: data
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE EVENT
app.delete("/api/events/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from("events")
            .delete()
            .eq("id", id);

        if (error) {
            return res.status(500).json({
                success: false,
                error: error.message
            });
        }

        res.json({
            success: true,
            message: "Event deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =====================================================
// DASHBOARD STATISTICS
// =====================================================

app.get("/api/stats", async (req, res) => {
    try {
        const [tasks, expenses, notes, events] = await Promise.all([
            supabase.from("tasks").select("*", { count: "exact", head: true }),
            supabase.from("expenses").select("*", { count: "exact", head: true }),
            supabase.from("notes").select("*", { count: "exact", head: true }),
            supabase.from("events").select("*", { count: "exact", head: true })
        ]);

        res.json({
            success: true,
            statistics: {
                tasks: tasks.count || 0,
                expenses: expenses.count || 0,
                notes: notes.count || 0,
                events: events.count || 0
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// =====================================================
// API 404 HANDLER
// =====================================================

app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: "API endpoint not found"
    });
});

// =====================================================
// START SERVER
// =====================================================

const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`CloudLife running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`Swagger: http://localhost:${PORT}/api-docs`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
});

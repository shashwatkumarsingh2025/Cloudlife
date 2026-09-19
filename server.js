// ============================================================
// CLOUDLIFE - SERVER.JS
// Cloud-Based Personal Life Management System
// ============================================================

// ============================================================
// IMPORT PACKAGES
// ============================================================

const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const swaggerUi = require("swagger-ui-express");
const multer = require("multer");


// ============================================================
// LOAD ENVIRONMENT VARIABLES
// ============================================================

dotenv.config();


// ============================================================
// SUPABASE
// ============================================================

const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;


if (!SUPABASE_URL || !SUPABASE_KEY) {

    console.error(
        "ERROR: SUPABASE_URL or SUPABASE_KEY is missing in .env"
    );

    process.exit(1);
}


const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


console.log(
    "Supabase connection initialized successfully!"
);


// ============================================================
// EXPRESS APP
// ============================================================

const app = express();


// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);


// ============================================================
// STATIC FRONTEND
// IMPORTANT: THIS MUST COME BEFORE THE 404 ROUTE
// ============================================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);


// ============================================================
// MULTER
// Used for CloudLife Memories / File Upload
// ============================================================

const upload = multer({
    storage: multer.memoryStorage()
});


// ============================================================
// SWAGGER
// ============================================================

const swaggerDocument = require("./swagger.json");

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument)
);


// ============================================================
// HOME PAGE
// ============================================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


// ============================================================
// API TEST
// ============================================================

app.get("/api/test", (req, res) => {

    res.json({

        success: true,

        message:
            "CloudLife API is working perfectly!",

        timestamp:
            new Date().toISOString()

    });

});


// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", async (req, res) => {

    try {

        const tasks =
            await supabase
                .from("tasks")
                .select("*", {
                    count: "exact",
                    head: true
                });


        const expenses =
            await supabase
                .from("expenses")
                .select("*", {
                    count: "exact",
                    head: true
                });


        const notes =
            await supabase
                .from("notes")
                .select("*", {
                    count: "exact",
                    head: true
                });


        const events =
            await supabase
                .from("events")
                .select("*", {
                    count: "exact",
                    head: true
                });


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

                    status:
                        tasks.error
                            ? "ERROR"
                            : "WORKING",

                    records:
                        tasks.count || 0

                },

                expenses: {

                    status:
                        expenses.error
                            ? "ERROR"
                            : "WORKING",

                    records:
                        expenses.count || 0

                },

                notes: {

                    status:
                        notes.error
                            ? "ERROR"
                            : "WORKING",

                    records:
                        notes.count || 0

                },

                events: {

                    status:
                        events.error
                            ? "ERROR"
                            : "WORKING",

                    records:
                        events.count || 0

                }

            },

            timestamp:
                new Date().toISOString()

        });

    } catch (error) {

        console.error(
            "Health check error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// ============================================================
// TASKS
// ============================================================


// GET ALL TASKS

app.get("/api/tasks", async (req, res) => {

    try {

        const {
            data,
            error
        } =
        await supabase
            .from("tasks")
            .select("*")
            .order("id", {
                ascending: false
            });


        if (error) {

            return res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }


        res.json({

            success: true,

            data: data

        });

    } catch (error) {

        console.error(
            "GET tasks error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// ADD TASK

app.post("/api/tasks", async (req, res) => {

    try {

        const {
            title,
            description,
            priority,
            due_date
        } = req.body;


        if (!title) {

            return res.status(400).json({

                success: false,

                error:
                    "Task title is required"

            });

        }


        const {
            data,
            error
        } =
        await supabase
            .from("tasks")
            .insert([

                {

                    title:
                        title,

                    description:
                        description || "",

                    priority:
                        priority || "Medium",

                    status:
                        "Pending",

                    due_date:
                        due_date || null

                }

            ])
            .select()
            .single();


        if (error) {

            console.error(
                "Add task error:",
                error
            );


            return res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }


        res.status(201).json({

            success: true,

            message:
                "Task added successfully",

            data:
                data

        });

    } catch (error) {

        console.error(
            "POST task error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// UPDATE TASK STATUS

app.put(
    "/api/tasks/:id/status",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                status
            } = req.body;


            if (!status) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Status is required"

                });

            }


            const {
                data,
                error
            } =
            await supabase
                .from("tasks")
                .update({

                    status:
                        status

                })
                .eq("id", id)
                .select()
                .single();


            if (error) {

                return res.status(500).json({

                    success: false,

                    error:
                        error.message

                });

            }


            res.json({

                success: true,

                message:
                    "Task status updated successfully",

                data:
                    data

            });

        } catch (error) {

            console.error(
                "Update task status error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// DELETE TASK

app.delete(
    "/api/tasks/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                error
            } =
            await supabase
                .from("tasks")
                .delete()
                .eq("id", id);


            if (error) {

                return res.status(500).json({

                    success: false,

                    error:
                        error.message

                });

            }


            res.json({

                success: true,

                message:
                    "Task deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete task error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// EXPENSES
// ============================================================


// GET EXPENSES

app.get("/api/expenses", async (req, res) => {

    try {

        const {
            data,
            error
        } =
        await supabase
            .from("expenses")
            .select("*")
            .order("id", {
                ascending: false
            });


        if (error) {

            return res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }


        res.json({

            success: true,

            data:
                data

        });

    } catch (error) {

        console.error(
            "GET expenses error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// ADD EXPENSE

app.post("/api/expenses", async (req, res) => {

    try {

        const {
            title,
            amount,
            category
        } = req.body;


        if (!title) {

            return res.status(400).json({

                success: false,

                error:
                    "Expense title is required"

            });

        }


        if (
            amount === undefined ||
            amount === null ||
            amount === ""
        ) {

            return res.status(400).json({

                success: false,

                error:
                    "Expense amount is required"

            });

        }


        const {
            data,
            error
        } =
        await supabase
            .from("expenses")
            .insert([

                {

                    title:
                        title,

                    amount:
                        Number(amount),

                    category:
                        category || "Other"

                }

            ])
            .select()
            .single();


        if (error) {

            return res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }


        res.status(201).json({

            success: true,

            message:
                "Expense added successfully",

            data:
                data

        });

    } catch (error) {

        console.error(
            "POST expense error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// DELETE EXPENSE

app.delete(
    "/api/expenses/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                error
            } =
            await supabase
                .from("expenses")
                .delete()
                .eq("id", id);


            if (error) {

                return res.status(500).json({

                    success: false,

                    error:
                        error.message

                });

            }


            res.json({

                success: true,

                message:
                    "Expense deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete expense error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// NOTES
// ============================================================


// GET NOTES

app.get("/api/notes", async (req, res) => {

    try {

        const {
            data,
            error
        } =
        await supabase
            .from("notes")
            .select("*")
            .order("id", {
                ascending: false
            });


        if (error) {

            return res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }


        res.json({

            success: true,

            data:
                data

        });

    } catch (error) {

        console.error(
            "GET notes error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// ADD NOTE

app.post("/api/notes", async (req, res) => {

    try {

        const {
            title,
            content
        } = req.body;


        if (!title) {

            return res.status(400).json({

                success: false,

                error:
                    "Note title is required"

            });

        }


        const {
            data,
            error
        } =
        await supabase
            .from("notes")
            .insert([

                {

                    title:
                        title,

                    content:
                        content || ""

                }

            ])
            .select()
            .single();


        if (error) {

            return res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }


        res.status(201).json({

            success: true,

            message:
                "Note added successfully",

            data:
                data

        });

    } catch (error) {

        console.error(
            "POST note error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// DELETE NOTE

app.delete(
    "/api/notes/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                error
            } =
            await supabase
                .from("notes")
                .delete()
                .eq("id", id);


            if (error) {

                return res.status(500).json({

                    success: false,

                    error:
                        error.message

                });

            }


            res.json({

                success: true,

                message:
                    "Note deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete note error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// EVENTS
// ============================================================


// GET EVENTS

app.get("/api/events", async (req, res) => {

    try {

        const {
            data,
            error
        } =
        await supabase
            .from("events")
            .select("*")
            .order("id", {
                ascending: false
            });


        if (error) {

            return res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }


        res.json({

            success: true,

            data:
                data

        });

    } catch (error) {

        console.error(
            "GET events error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// ADD EVENT

app.post("/api/events", async (req, res) => {

    try {

        const {
            title,
            date,
            time,
            description
        } = req.body;


        if (!title) {

            return res.status(400).json({

                success: false,

                error:
                    "Event title is required"

            });

        }


        const {
            data,
            error
        } =
        await supabase
            .from("events")
            .insert([

                {

                    title:
                        title,

                    date:
                        date || null,

                    time:
                        time || null,

                    description:
                        description || ""

                }

            ])
            .select()
            .single();


        if (error) {

            return res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }


        res.status(201).json({

            success: true,

            message:
                "Event added successfully",

            data:
                data

        });

    } catch (error) {

        console.error(
            "POST event error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// DELETE EVENT

app.delete(
    "/api/events/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            const {
                error
            } =
            await supabase
                .from("events")
                .delete()
                .eq("id", id);


            if (error) {

                return res.status(500).json({

                    success: false,

                    error:
                        error.message

                });

            }


            res.json({

                success: true,

                message:
                    "Event deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete event error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// STATISTICS
// ============================================================

app.get("/api/stats", async (req, res) => {

    try {

        const tasks =
            await supabase
                .from("tasks")
                .select("*", {
                    count: "exact",
                    head: true
                });


        const expenses =
            await supabase
                .from("expenses")
                .select("*", {
                    count: "exact",
                    head: true
                });


        const notes =
            await supabase
                .from("notes")
                .select("*", {
                    count: "exact",
                    head: true
                });


        const events =
            await supabase
                .from("events")
                .select("*", {
                    count: "exact",
                    head: true
                });


        res.json({

            success: true,

            statistics: {

                tasks:
                    tasks.count || 0,

                expenses:
                    expenses.count || 0,

                notes:
                    notes.count || 0,

                events:
                    events.count || 0

            }

        });

    } catch (error) {

        console.error(
            "Stats error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                error.message

        });

    }

});


// ============================================================
// CLOUD STORAGE - MEMORIES
// ============================================================


// UPLOAD MEMORY / PHOTO

app.post(
    "/api/memories",
    upload.single("file"),
    async (req, res) => {

        try {

            const {
                title,
                description
            } = req.body;


            if (!title) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Memory title is required"

                });

            }


            if (!req.file) {

                return res.status(400).json({

                    success: false,

                    error:
                        "Please upload a file"

                });

            }


            // Create unique file name

            const safeOriginalName =
                req.file.originalname
                    .replace(
                        /[^a-zA-Z0-9._-]/g,
                        "-"
                    );


            const fileName =
                `${Date.now()}-${safeOriginalName}`;


            const filePath =
                `memories/${fileName}`;


            // Upload to Supabase Storage

            const {
                error: uploadError
            } =
            await supabase.storage
                .from("cloudlife-files")
                .upload(
                    filePath,
                    req.file.buffer,
                    {

                        contentType:
                            req.file.mimetype,

                        upsert:
                            false

                    }
                );


            if (uploadError) {

                console.error(
                    "Storage upload error:",
                    uploadError
                );


                return res.status(500).json({

                    success: false,

                    error:
                        uploadError.message

                });

            }


            // Get public URL

            const {
                data: publicUrlData
            } =
            supabase.storage
                .from("cloudlife-files")
                .getPublicUrl(filePath);


            const fileUrl =
                publicUrlData.publicUrl;


            // Store information in database

            const {
                data,
                error
            } =
            await supabase
                .from("memories")
                .insert([

                    {

                        title:
                            title,

                        description:
                            description || "",

                        file_url:
                            fileUrl

                    }

                ])
                .select()
                .single();


            if (error) {

                console.error(
                    "Memory database error:",
                    error
                );


                return res.status(500).json({

                    success: false,

                    error:
                        error.message

                });

            }


            res.status(201).json({

                success: true,

                message:
                    "Memory uploaded successfully",

                data:
                    data

            });

        } catch (error) {

            console.error(
                "Memory upload error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// GET MEMORIES

app.get(
    "/api/memories",
    async (req, res) => {

        try {

            const {
                data,
                error
            } =
            await supabase
                .from("memories")
                .select("*")
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


            if (error) {

                return res.status(500).json({

                    success: false,

                    error:
                        error.message

                });

            }


            res.json({

                success: true,

                data:
                    data

            });

        } catch (error) {

            console.error(
                "GET memories error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// DELETE MEMORY

app.delete(
    "/api/memories/:id",
    async (req, res) => {

        try {

            const {
                id
            } = req.params;


            // First get the memory record

            const {
                data: memory,
                error: memoryError
            } =
            await supabase
                .from("memories")
                .select("*")
                .eq("id", id)
                .single();


            if (memoryError) {

                return res.status(404).json({

                    success: false,

                    error:
                        "Memory not found"

                });

            }


            // Delete database record

            const {
                error: deleteError
            } =
            await supabase
                .from("memories")
                .delete()
                .eq("id", id);


            if (deleteError) {

                return res.status(500).json({

                    success: false,

                    error:
                        deleteError.message

                });

            }


            // Try to remove file from Storage

            if (memory.file_url) {

                try {

                    const fileName =
                        memory.file_url
                            .split("/")
                            .pop();


                    const filePath =
                        `memories/${fileName}`;


                    await supabase.storage
                        .from("cloudlife-files")
                        .remove([
                            filePath
                        ]);

                } catch (storageError) {

                    console.error(
                        "Storage delete warning:",
                        storageError
                    );

                }

            }


            res.json({

                success: true,

                message:
                    "Memory deleted successfully"

            });

        } catch (error) {

            console.error(
                "Delete memory error:",
                error
            );


            res.status(500).json({

                success: false,

                error:
                    error.message

            });

        }

    }
);


// ============================================================
// 404 ROUTE
// IMPORTANT: THIS MUST BE THE LAST ROUTE
// ============================================================

app.use((req, res) => {

    res.status(404).json({

        success: false,

        error:
            "Route not found"

    });

});


// ============================================================
// ERROR HANDLER
// ============================================================

app.use(
    (error, req, res, next) => {

        console.error(
            "Unhandled server error:",
            error
        );


        res.status(500).json({

            success: false,

            error:
                "Internal server error"

        });

    }
);


// ============================================================
// START SERVER
// ============================================================

const PORT =
    process.env.PORT || 3000;


app.listen(
    PORT,
    "0.0.0.0",
    () => {

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

    }
);

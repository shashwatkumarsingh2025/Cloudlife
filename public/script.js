
 // Normalize API responses: supports both [] and { success: true, data: [] }.
function extractArray(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    return [];
}

async function readApiArray(response) {
    const payload = await response.json();
    if (!response.ok) {
        throw new Error(payload.error || `Request failed (${response.status})`);
    }
    return extractArray(payload);
}


// ========================================
// PAGE INITIALIZATION
// ========================================


document.addEventListener("DOMContentLoaded", () => {
    // Load existing dashboard data
    updateDate();
    loadStats();
    loadTasks();
    loadExpenses();
    loadNotes();
    loadEvents();

    // Add Task form
    const taskForm = document.getElementById("taskForm");
    if (taskForm) {
        taskForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            await addTask();
        });
    }

    // Add Expense form
    const expenseForm = document.getElementById("expenseForm");
    if (expenseForm) {
        expenseForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            await addExpense();
        });
    }

    // Add Note form
    const noteForm = document.getElementById("noteForm");
    if (noteForm) {
        noteForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            await addNote();
        });
    }

    // Add Event form
    const eventForm = document.getElementById("eventForm");
    if (eventForm) {
        eventForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            await addEvent();
        });
    }

    console.log("CloudLife forms connected successfully.");
});




// ========================================
// DATE
// ========================================

function updateDate() {
    const dateElement = document.getElementById("date");
    if (!dateElement) return;

    const today = new Date();

    dateElement.textContent = today.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


// ========================================
// SECTION NAVIGATION
// ========================================

function showSection(sectionName) {
    document.querySelectorAll(".section").forEach(section => {
        section.classList.add("hidden");
    });

    const selectedSection = document.getElementById(sectionName);
    if (selectedSection) selectedSection.classList.remove("hidden");

    document.querySelectorAll(".menu-btn").forEach(button => {
        button.classList.remove("active");
    });
}


// ========================================
// DASHBOARD STATS
// ========================================

async function loadStats() {
    try {
        const [tasksResponse, expensesResponse, notesResponse] =
            await Promise.all([
                fetch("/api/tasks"),
                fetch("/api/expenses"),
                fetch("/api/notes")
            ]);

        if (!tasksResponse.ok ||
            !expensesResponse.ok ||
            !notesResponse.ok) {
            throw new Error("Unable to load dashboard data.");
        }

        const [tasksPayload, expensesPayload, notesPayload] =
            await Promise.all([
                tasksResponse.json(),
                expensesResponse.json(),
                notesResponse.json()
            ]);

        const tasks = extractArray(tasksPayload);
        const expenses = extractArray(expensesPayload);
        const notes = extractArray(notesPayload);

        const taskCount = document.getElementById("taskCount");
        const completedCount = document.getElementById("completedCount");
        const expenseTotal = document.getElementById("expenseTotal");
        const noteCount = document.getElementById("noteCount");

        if (taskCount) taskCount.textContent = tasks.length;

        const completedTasks = tasks.filter(task =>
            String(task.status || "").toLowerCase() === "completed"
        ).length;

        if (completedCount) {
            completedCount.textContent = completedTasks;
        }

        const totalExpenses = expenses.reduce((total, expense) => {
            const amount = Number(expense.amount);
            return total + (Number.isFinite(amount) ? amount : 0);
        }, 0);

        if (expenseTotal) {
            expenseTotal.textContent = "₹" + totalExpenses.toFixed(2);
        }

        if (noteCount) noteCount.textContent = notes.length;

    } catch (error) {
        console.error("Stats error:", error);
    }
}


// ========================================
// TASKS
// ========================================

async function loadTasks() {
    try {
        const response = await fetch("/api/tasks");
        const tasks = await readApiArray(response);

        const container = document.getElementById("taskList");
        if (!container) return;

        if (!tasks.length) {
            container.innerHTML = `
                <div class="empty">
                    No tasks yet. Add your first task!
                </div>`;
            return;
        }

        container.innerHTML = "";

        tasks.forEach(task => {
            const item = document.createElement("div");
            item.className = "item";

            const priority = task.priority
                ? String(task.priority).toLowerCase()
                : "medium";

            const status = String(task.status || "Pending");

            item.innerHTML = `
                <div>
                    <h3>${escapeHTML(task.title)}</h3>
                    <p>${escapeHTML(task.description || "")}</p>
                    <p>
                        Priority:
                        <span class="badge ${escapeHTML(priority)}">
                            ${escapeHTML(task.priority || "Medium")}
                        </span>
                    </p>
                    <p>Status: ${escapeHTML(status)}</p>
                </div>

                <div class="item-actions">
                    ${
                        status.toLowerCase() !== "completed"
                            ? `<button
                                class="complete-btn"
                                onclick="completeTask('${String(task.id).replace(/'/g, "\\'")}')">
                                ✓
                            </button>`
                            : ""
                    }

                    <button
                        class="delete-btn"
                        onclick="deleteTask('${String(task.id).replace(/'/g, "\\'")}')">
                        🗑
                    </button>
                </div>
            `;

            container.appendChild(item);
        });

    } catch (error) {
        console.error("Task loading error:", error);
    }
}


// ========================================
// ADD TASK
// ========================================

async function addTask() {
    const titleElement = document.getElementById("taskTitle");
    const descriptionElement = document.getElementById("taskDescription");
    const priorityElement = document.getElementById("taskPriority");
    const dateElement = document.getElementById("taskDueDate");

    if (!titleElement || !descriptionElement || !priorityElement) {
        alert("Task form fields could not be found.");
        return;
    }

    const title = titleElement.value.trim();
    const description = descriptionElement.value.trim();
    const priority = priorityElement.value;
    const due_date = dateElement ? dateElement.value || null : null;

    if (!title) {
        alert("Please enter a task title.");
        return;
    }

    try {
        const response = await fetch("/api/tasks", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                description,
                priority,
                due_date
            })
        });

        console.log("Add task HTTP status:", response.status);
        const result = await response.json().catch(() => ({}));
        console.log("Add task response:", result);

        if (!response.ok || result.success === false) {
            throw new Error(
                result.error || `Unable to save task (${response.status})`
            );
        }

        alert("Task added successfully!");

        titleElement.value = "";
        descriptionElement.value = "";
        if (dateElement) dateElement.value = "";

        await loadTasks();
        await loadStats();

    } catch (error) {
        console.error("Add task error:", error);
        alert(error.message || "Unable to add task.");
    }
}


// ========================================
// COMPLETE TASK
// ========================================

async function completeTask(id) {
    try {
        const response = await fetch(
            `/api/tasks/${encodeURIComponent(id)}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: "Completed"
                })
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.error || `Could not complete task (${response.status})`
            );
        }

        await loadTasks();
        await loadStats();

    } catch (error) {
        console.error("Complete task error:", error);
        alert(error.message || "Unable to complete task.");
    }
}


// ========================================
// DELETE TASK
// ========================================

async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;

    try {
        const response = await fetch(
            `/api/tasks/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.error || `Could not delete task (${response.status})`
            );
        }

        await loadTasks();
        await loadStats();

    } catch (error) {
        console.error("Delete task error:", error);
        alert(error.message || "Unable to delete task.");
    }
}


// ========================================
// EXPENSES
// ========================================

async function loadExpenses() {
    try {
        const response = await fetch("/api/expenses");
        const expenses = await readApiArray(response);

        const container = document.getElementById("expenseList");
        if (!container) return;

        if (!expenses.length) {
            container.innerHTML = `
                <div class="empty">
                    No expenses recorded.
                </div>`;
            return;
        }

        container.innerHTML = "";

        expenses.forEach(expense => {
            const item = document.createElement("div");
            item.className = "item";

            item.innerHTML = `
                <div>
                    <h3>${escapeHTML(expense.title)}</h3>
                    <p>Category: ${escapeHTML(expense.category || "")}</p>
                </div>

                <div>
                    <strong>₹${Number(expense.amount || 0).toFixed(2)}</strong>
                    <button
                        class="delete-btn"
                        onclick="deleteExpense('${String(expense.id).replace(/'/g, "\\'")}')">
                        🗑
                    </button>
                </div>
            `;

            container.appendChild(item);
        });

    } catch (error) {
        console.error("Expense loading error:", error);
    }
}


// ========================================
// ADD EXPENSE
// ========================================

async function addExpense() {
    const titleElement = document.getElementById("expenseTitle");
    const amountElement = document.getElementById("expenseAmount");
    const categoryElement = document.getElementById("expenseCategory");

    if (!titleElement || !amountElement || !categoryElement) {
        alert("Expense form fields could not be found.");
        return;
    }

    const title = titleElement.value.trim();
    const amount = amountElement.value;
    const category = categoryElement.value;

    if (!title || !amount) {
        alert("Enter expense name and amount.");
        return;
    }

    try {
        const response = await fetch("/api/expenses", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                amount,
                category
            })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.error || `Unable to add expense (${response.status})`
            );
        }

        alert("Expense added!");

        titleElement.value = "";
        amountElement.value = "";

        await loadExpenses();
        await loadStats();

    } catch (error) {
        console.error("Add expense error:", error);
        alert(error.message || "Unable to add expense.");
    }
}


// ========================================
// DELETE EXPENSE
// ========================================

async function deleteExpense(id) {
    if (!confirm("Delete this expense?")) return;

    try {
        const response = await fetch(
            `/api/expenses/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.error || `Could not delete expense (${response.status})`
            );
        }

        await loadExpenses();
        await loadStats();

    } catch (error) {
        console.error("Delete expense error:", error);
        alert(error.message || "Unable to delete expense.");
    }
}


// ========================================
// NOTES
// ========================================

async function loadNotes() {
    try {
        const response = await fetch("/api/notes");
        const notes = await readApiArray(response);

        const container = document.getElementById("noteList");
        if (!container) return;

        if (!notes.length) {
            container.innerHTML = `
                <div class="empty">
                    No notes saved.
                </div>`;
            return;
        }

        container.innerHTML = "";

        notes.forEach(note => {
            const item = document.createElement("div");
            item.className = "item";

            item.innerHTML = `
                <div>
                    <h3>${escapeHTML(note.title)}</h3>
                    <p>${escapeHTML(note.content || "")}</p>
                </div>

                <button
                    class="delete-btn"
                    onclick="deleteNote('${String(note.id).replace(/'/g, "\\'")}')">
                    🗑
                </button>
            `;

            container.appendChild(item);
        });

    } catch (error) {
        console.error("Note loading error:", error);
    }
}


// ========================================
// ADD NOTE
// ========================================

async function addNote() {
    const titleElement = document.getElementById("noteTitle");
    const contentElement = document.getElementById("noteContent");

    if (!titleElement || !contentElement) {
        alert("Note form fields could not be found.");
        return;
    }

    const title = titleElement.value.trim();
    const content = contentElement.value.trim();

    if (!title) {
        alert("Enter a note title.");
        return;
    }

    try {
        const response = await fetch("/api/notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                content
            })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.error || `Unable to save note (${response.status})`
            );
        }

        alert("Note saved!");

        titleElement.value = "";
        contentElement.value = "";

        await loadNotes();
        await loadStats();

    } catch (error) {
        console.error("Add note error:", error);
        alert(error.message || "Unable to save note.");
    }
}


// ========================================
// DELETE NOTE
// ========================================

async function deleteNote(id) {
    if (!confirm("Delete this note?")) return;

    try {
        const response = await fetch(
            `/api/notes/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.error || `Could not delete note (${response.status})`
            );
        }

        await loadNotes();
        await loadStats();

    } catch (error) {
        console.error("Delete note error:", error);
        alert(error.message || "Unable to delete note.");
    }
}


// ========================================
// EVENTS
// ========================================

async function loadEvents() {
    try {
        const response = await fetch("/api/events");
        const events = await readApiArray(response);

        const container = document.getElementById("eventList");
        if (!container) return;

        if (!events.length) {
            container.innerHTML = `
                <div class="empty">
                    No upcoming events.
                </div>`;
            return;
        }

        container.innerHTML = "";

        events.forEach(event => {
            const item = document.createElement("div");
            item.className = "item";

            item.innerHTML = `
                <div>
                    <h3>${escapeHTML(event.title)}</h3>
                    <p>📅 ${escapeHTML(event.event_date || "")}</p>
                    <p>⏰ ${escapeHTML(event.event_time || "No time")}</p>
                    <p>${escapeHTML(event.description || "")}</p>
                </div>

                <button
                    class="delete-btn"
                    onclick="deleteEvent('${String(event.id).replace(/'/g, "\\'")}')">
                    🗑
                </button>
            `;

            container.appendChild(item);
        });

    } catch (error) {
        console.error("Event loading error:", error);
    }
}


// ========================================
// ADD EVENT
// ========================================

async function addEvent() {
    const titleElement = document.getElementById("eventTitle");
    const dateElement = document.getElementById("eventDate");
    const timeElement = document.getElementById("eventTime");
    const descriptionElement = document.getElementById("eventDescription");

    if (!titleElement || !dateElement) {
        alert("Event form fields could not be found.");
        return;
    }

    const title = titleElement.value.trim();
    const event_date = dateElement.value;
    const event_time = timeElement ? timeElement.value : "";
    const description = descriptionElement
        ? descriptionElement.value.trim()
        : "";

    if (!title || !event_date) {
        alert("Enter event title and date.");
        return;
    }

    try {
        const response = await fetch("/api/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                title,
                event_date,
                event_time,
                description
            })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.error || `Unable to add event (${response.status})`
            );
        }

        alert("Event added!");

        titleElement.value = "";
        dateElement.value = "";
        if (timeElement) timeElement.value = "";
        if (descriptionElement) descriptionElement.value = "";

        await loadEvents();
        await loadStats();

    } catch (error) {
        console.error("Add event error:", error);
        alert(error.message || "Unable to add event.");
    }
}


// ========================================
// DELETE EVENT
// ========================================

async function deleteEvent(id) {
    if (!confirm("Delete this event?")) return;

    try {
        const response = await fetch(
            `/api/events/${encodeURIComponent(id)}`,
            {
                method: "DELETE"
            }
        );

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(
                result.error || `Could not delete event (${response.status})`
            );
        }

        await loadEvents();
        await loadStats();

    } catch (error) {
        console.error("Delete event error:", error);
        alert(error.message || "Unable to delete event.");
    }
}


// ========================================
// SECURITY
// Prevent HTML injection when displaying data
// ========================================

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

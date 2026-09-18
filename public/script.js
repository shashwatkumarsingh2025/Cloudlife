// ========================================
// PAGE INITIALIZATION
// ========================================

document.addEventListener("DOMContentLoaded", () => {

    updateDate();

    loadStats();

    loadTasks();

    loadExpenses();

    loadNotes();

    loadEvents();

});


// ========================================
// DATE
// ========================================

function updateDate() {

    const dateElement = document.getElementById("date");

    const today = new Date();

    dateElement.textContent =
        today.toLocaleDateString("en-IN", {
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

    const sections =
        document.querySelectorAll(".section");

    sections.forEach(section => {

        section.classList.add("hidden");

    });


    document
        .getElementById(sectionName)
        .classList.remove("hidden");


    const buttons =
        document.querySelectorAll(".menu-btn");

    buttons.forEach(button => {

        button.classList.remove("active");

    });

}


// ========================================
// DASHBOARD STATS
// ========================================

async function loadStats() {

    try {

        // Get actual data from the backend
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


        const tasks =
            await tasksResponse.json();

        const expenses =
            await expensesResponse.json();

        const notes =
            await notesResponse.json();


        // ========================================
        // TOTAL TASKS
        // ========================================

        document.getElementById("taskCount")
            .textContent = tasks.length;


        // ========================================
        // COMPLETED TASKS
        // ========================================

        const completedTasks =
            tasks.filter(task =>
                String(task.status || "").toLowerCase() === "completed"
            ).length;


        document.getElementById("completedCount")
            .textContent = completedTasks;


        // ========================================
        // TOTAL EXPENSES
        // ========================================

        const totalExpenses =
            expenses.reduce((total, expense) => {

                const amount =
                    Number(expense.amount);

                return total +
                    (Number.isFinite(amount) ? amount : 0);

            }, 0);


        document.getElementById("expenseTotal")
            .textContent =
            "₹" + totalExpenses.toFixed(2);


        // ========================================
        // TOTAL NOTES
        // ========================================

        document.getElementById("noteCount")
            .textContent = notes.length;


    } catch (error) {

        console.error(
            "Stats error:",
            error
        );

    }

}


// ========================================
// TASKS
// ========================================

async function loadTasks() {

    try {

        const response =
            await fetch("/api/tasks");

        const tasks =
            await response.json();


        const container =
            document.getElementById("taskList");


        if (!tasks.length) {

            container.innerHTML =
                `<div class="empty">
                    No tasks yet. Add your first task!
                 </div>`;

            return;

        }


        container.innerHTML = "";


        tasks.forEach(task => {

            const item =
                document.createElement("div");

            item.className = "item";


            const priority =
                task.priority
                    ? task.priority.toLowerCase()
                    : "medium";


            item.innerHTML = `

                <div>

                    <h3>
                        ${escapeHTML(task.title)}
                    </h3>

                    <p>
                        ${escapeHTML(task.description || "")}
                    </p>

                    <p>

                        Priority:

                        <span class="badge ${priority}">
                            ${escapeHTML(task.priority || "Medium")}
                        </span>

                    </p>

                    <p>
                        Status: ${escapeHTML(task.status || "Pending")}
                    </p>

                </div>


                <div class="item-actions">

                    ${
                        task.status !== "Completed"
                        ?
                        `<button
                            class="complete-btn"
                            onclick="completeTask(${task.id})">
                            ✓
                        </button>`
                        :
                        ""
                    }


                    <button
                        class="delete-btn"
                        onclick="deleteTask(${task.id})">

                        🗑

                    </button>

                </div>

            `;


            container.appendChild(item);

        });


    } catch (error) {

        console.error(
            "Task loading error:",
            error
        );

    }

}


// ========================================
// ADD TASK
// ========================================

async function addTask() {

    const title =
        document.getElementById("taskTitle").value.trim();

    const description =
        document.getElementById("taskDescription").value.trim();

    const priority =
        document.getElementById("taskPriority").value;

    const due_date =
        document.getElementById("taskDate").value;


    if (!title) {

        alert("Please enter a task title.");

        return;

    }


    try {

        const response =
            await fetch("/api/tasks", {

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


        const result =
            await response.json();


        if (!response.ok) {

            alert(result.error);

            return;

        }


        alert("Task added successfully!");


        document.getElementById("taskTitle").value = "";

        document.getElementById("taskDescription").value = "";

        document.getElementById("taskDate").value = "";


        loadTasks();

        loadStats();


    } catch (error) {

        console.error(error);

        alert("Unable to add task.");

    }

}


// ========================================
// COMPLETE TASK
// ========================================

async function completeTask(id) {

    try {

        await fetch(
            `/api/tasks/${id}`,
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


        loadTasks();

        loadStats();


    } catch (error) {

        console.error(error);

    }

}


// ========================================
// DELETE TASK
// ========================================

async function deleteTask(id) {

    if (!confirm("Delete this task?")) {

        return;

    }


    await fetch(
        `/api/tasks/${id}`,
        {
            method: "DELETE"
        }
    );


    loadTasks();

    loadStats();

}


// ========================================
// EXPENSES
// ========================================

async function loadExpenses() {

    try {

        const response =
            await fetch("/api/expenses");

        const expenses =
            await response.json();


        const container =
            document.getElementById("expenseList");


        if (!expenses.length) {

            container.innerHTML =
                `<div class="empty">
                    No expenses recorded.
                 </div>`;

            return;

        }


        container.innerHTML = "";


        expenses.forEach(expense => {

            const item =
                document.createElement("div");

            item.className = "item";


            item.innerHTML = `

                <div>

                    <h3>
                        ${escapeHTML(expense.title)}
                    </h3>

                    <p>
                        Category:
                        ${escapeHTML(expense.category || "")}
                    </p>

                </div>


                <div>

                    <strong>
                        ₹${Number(expense.amount || 0).toFixed(2)}
                    </strong>


                    <button
                        class="delete-btn"
                        onclick="deleteExpense(${expense.id})">

                        🗑

                    </button>

                </div>

            `;


            container.appendChild(item);

        });


    } catch (error) {

        console.error(error);

    }

}


// ========================================
// ADD EXPENSE
// ========================================

async function addExpense() {

    const title =
        document.getElementById("expenseTitle")
            .value.trim();


    const amount =
        document.getElementById("expenseAmount")
            .value;


    const category =
        document.getElementById("expenseCategory")
            .value;


    if (!title || !amount) {

        alert("Enter expense name and amount.");

        return;

    }


    try {

        const response =
            await fetch("/api/expenses", {

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


        const result =
            await response.json();


        if (!response.ok) {

            alert(result.error || "Unable to add expense.");

            return;

        }


        alert("Expense added!");


        document.getElementById("expenseTitle")
            .value = "";

        document.getElementById("expenseAmount")
            .value = "";


        loadExpenses();

        loadStats();


    } catch (error) {

        console.error(error);

        alert("Unable to add expense.");

    }

}


// ========================================
// DELETE EXPENSE
// ========================================

async function deleteExpense(id) {

    if (!confirm("Delete this expense?")) {

        return;

    }


    await fetch(
        `/api/expenses/${id}`,
        {
            method: "DELETE"
        }
    );


    loadExpenses();

    loadStats();

}


// ========================================
// NOTES
// ========================================

async function loadNotes() {

    try {

        const response =
            await fetch("/api/notes");

        const notes =
            await response.json();


        const container =
            document.getElementById("noteList");


        if (!notes.length) {

            container.innerHTML =
                `<div class="empty">
                    No notes saved.
                 </div>`;

            return;

        }


        container.innerHTML = "";


        notes.forEach(note => {

            const item =
                document.createElement("div");

            item.className = "item";


            item.innerHTML = `

                <div>

                    <h3>
                        ${escapeHTML(note.title)}
                    </h3>

                    <p>
                        ${escapeHTML(note.content || "")}
                    </p>

                </div>


                <button
                    class="delete-btn"
                    onclick="deleteNote(${note.id})">

                    🗑

                </button>

            `;


            container.appendChild(item);

        });


    } catch (error) {

        console.error(error);

    }

}


// ========================================
// ADD NOTE
// ========================================

async function addNote() {

    const title =
        document.getElementById("noteTitle")
            .value.trim();


    const content =
        document.getElementById("noteContent")
            .value.trim();


    if (!title) {

        alert("Enter a note title.");

        return;

    }


    try {

        const response =
            await fetch("/api/notes", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    title,

                    content

                })

            });


        const result =
            await response.json();


        if (!response.ok) {

            alert(result.error || "Unable to save note.");

            return;

        }


        alert("Note saved!");


        document.getElementById("noteTitle")
            .value = "";

        document.getElementById("noteContent")
            .value = "";


        loadNotes();

        loadStats();


    } catch (error) {

        console.error(error);

        alert("Unable to save note.");

    }

}


// ========================================
// DELETE NOTE
// ========================================

async function deleteNote(id) {

    if (!confirm("Delete this note?")) {

        return;

    }


    await fetch(
        `/api/notes/${id}`,
        {
            method: "DELETE"
        }
    );


    loadNotes();

    loadStats();

}


// ========================================
// EVENTS
// ========================================

async function loadEvents() {

    try {

        const response =
            await fetch("/api/events");

        const events =
            await response.json();


        const container =
            document.getElementById("eventList");


        if (!events.length) {

            container.innerHTML =
                `<div class="empty">
                    No upcoming events.
                 </div>`;

            return;

        }


        container.innerHTML = "";


        events.forEach(event => {

            const item =
                document.createElement("div");

            item.className = "item";


            item.innerHTML = `

                <div>

                    <h3>
                        ${escapeHTML(event.title)}
                    </h3>

                    <p>
                        📅 ${escapeHTML(event.event_date || "")}
                    </p>

                    <p>
                        ⏰ ${escapeHTML(event.event_time || "No time")}
                    </p>

                    <p>
                        ${escapeHTML(event.description || "")}
                    </p>

                </div>


                <button
                    class="delete-btn"
                    onclick="deleteEvent(${event.id})">

                    🗑

                </button>

            `;


            container.appendChild(item);

        });


    } catch (error) {

        console.error(error);

    }

}


// ========================================
// ADD EVENT
// ========================================

async function addEvent() {

    const title =
        document.getElementById("eventTitle")
            .value.trim();


    const event_date =
        document.getElementById("eventDate")
            .value;


    const event_time =
        document.getElementById("eventTime")
            .value;


    const description =
        document.getElementById("eventDescription")
            .value.trim();


    if (!title || !event_date) {

        alert("Enter event title and date.");

        return;

    }


    try {

        const response =
            await fetch("/api/events", {

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


        const result =
            await response.json();


        if (!response.ok) {

            alert(result.error || "Unable to add event.");

            return;

        }


        alert("Event added!");


        document.getElementById("eventTitle")
            .value = "";

        document.getElementById("eventDate")
            .value = "";

        document.getElementById("eventTime")
            .value = "";

        document.getElementById("eventDescription")
            .value = "";


        loadEvents();

        loadStats();


    } catch (error) {

        console.error(error);

        alert("Unable to add event.");

    }

}


// ========================================
// DELETE EVENT
// ========================================

async function deleteEvent(id) {

    if (!confirm("Delete this event?")) {

        return;

    }


    await fetch(
        `/api/events/${id}`,
        {
            method: "DELETE"
        }
    );


    loadEvents();

    loadStats();

}


// ========================================
// SECURITY
// Prevent HTML injection when displaying data
// ========================================

function escapeHTML(value) {

    const div =
        document.createElement("div");


    div.textContent =
        value ?? "";


    return div.innerHTML;

}

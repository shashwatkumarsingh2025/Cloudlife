// ========================================
// CLOUDLIFE - FRONTEND SCRIPT
// ========================================


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

    const dateElement =
        document.getElementById("date");

    if (!dateElement) {
        return;
    }

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


    const selectedSection =
        document.getElementById(sectionName);

    if (selectedSection) {

        selectedSection.classList.remove("hidden");

    }


    const buttons =
        document.querySelectorAll(".menu-btn");

    buttons.forEach(button => {

        button.classList.remove("active");

    });

}


// ========================================
// API HELPER
// ========================================
// Backend returns:
// {
//     success: true,
//     data: [...]
// }
//
// This function extracts the actual array.
// ========================================

async function getAPIData(url) {

    const response =
        await fetch(url);

    const result =
        await response.json();

    if (!response.ok) {

        throw new Error(
            result.error ||
            `Request failed with status ${response.status}`
        );

    }


    // If backend directly returns an array
    if (Array.isArray(result)) {

        return result;

    }


    // Current backend format:
    // { success: true, data: [...] }

    if (Array.isArray(result.data)) {

        return result.data;

    }


    return [];

}


// ========================================
// DASHBOARD STATS
// ========================================

async function loadStats() {

    try {

        // Fetch actual records from backend

        const [
            tasks,
            expenses,
            notes
        ] = await Promise.all([

            getAPIData("/api/tasks"),

            getAPIData("/api/expenses"),

            getAPIData("/api/notes")

        ]);


        // ========================================
        // TOTAL TASKS
        // ========================================

        const totalTasks =
            tasks.length;


        const taskCount =
            document.getElementById("taskCount");

        if (taskCount) {

            taskCount.textContent =
                totalTasks;

        }


        // ========================================
        // COMPLETED TASKS
        // ========================================

        const completedTasks =
            tasks.filter(task => {

                return String(task.status || "")
                    .toLowerCase() === "completed";

            }).length;


        const completedCount =
            document.getElementById("completedCount");

        if (completedCount) {

            completedCount.textContent =
                completedTasks;

        }


        // ========================================
        // TOTAL EXPENSES
        // ========================================

        const totalExpenses =
            expenses.reduce(
                (total, expense) => {

                    const amount =
                        Number(expense.amount);

                    if (Number.isFinite(amount)) {

                        return total + amount;

                    }

                    return total;

                },
                0
            );


        const expenseTotal =
            document.getElementById("expenseTotal");

        if (expenseTotal) {

            expenseTotal.textContent =
                "₹" +
                totalExpenses.toFixed(2);

        }


        // ========================================
        // TOTAL NOTES
        // ========================================

        const noteCount =
            document.getElementById("noteCount");

        if (noteCount) {

            noteCount.textContent =
                notes.length;

        }


        console.log(
            "CloudLife Dashboard Updated:",
            {
                tasks: totalTasks,
                completed: completedTasks,
                expenses: totalExpenses,
                notes: notes.length
            }
        );


    } catch (error) {

        console.error(
            "Dashboard statistics error:",
            error
        );

    }

}


// ========================================
// TASKS
// ========================================

async function loadTasks() {

    try {

        const tasks =
            await getAPIData("/api/tasks");


        const container =
            document.getElementById("taskList");


        if (!container) {

            return;

        }


        // No tasks

        if (!tasks.length) {

            container.innerHTML =
                `
                <div class="empty">
                    No tasks yet. Add your first task!
                </div>
                `;

            return;

        }


        container.innerHTML = "";


        tasks.forEach(task => {

            const item =
                document.createElement("div");

            item.className =
                "item";


            const priority =
                task.priority
                    ? String(task.priority).toLowerCase()
                    : "medium";


            const status =
                task.status || "Pending";


            item.innerHTML =
                `

                <div>

                    <h3>
                        ${escapeHTML(task.title)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            task.description || ""
                        )}
                    </p>

                    <p>

                        Priority:

                        <span class="badge ${priority}">
                            ${escapeHTML(
                                task.priority || "Medium"
                            )}
                        </span>

                    </p>

                    <p>
                        Status:
                        ${escapeHTML(status)}
                    </p>

                    ${
                        task.due_date
                        ?
                        `
                        <p>
                            📅 Due:
                            ${escapeHTML(task.due_date)}
                        </p>
                        `
                        :
                        ""
                    }

                </div>


                <div class="item-actions">

                    ${
                        String(status).toLowerCase()
                        !== "completed"

                        ?

                        `
                        <button
                            class="complete-btn"
                            onclick="completeTask(${task.id})">

                            ✓

                        </button>
                        `

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
        document
            .getElementById("taskTitle")
            .value
            .trim();


    const description =
        document
            .getElementById("taskDescription")
            .value
            .trim();


    const priority =
        document
            .getElementById("taskPriority")
            .value;


    const due_date =
        document
            .getElementById("taskDate")
            .value;


    if (!title) {

        alert(
            "Please enter a task title."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/tasks",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        title,

                        description,

                        priority,

                        due_date

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.error ||
                "Failed to add task."
            );

            return;

        }


        alert(
            "Task added successfully!"
        );


        document
            .getElementById("taskTitle")
            .value = "";


        document
            .getElementById("taskDescription")
            .value = "";


        document
            .getElementById("taskDate")
            .value = "";


        await loadTasks();

        await loadStats();


    } catch (error) {

        console.error(
            "Add task error:",
            error
        );

        alert(
            "Unable to add task."
        );

    }

}


// ========================================
// COMPLETE TASK
// ========================================

async function completeTask(id) {

    try {

        const response =
            await fetch(
                `/api/tasks/${id}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        status: "Completed"

                    })

                }
            );


        if (!response.ok) {

            const result =
                await response.json();

            throw new Error(
                result.error ||
                "Failed to complete task."
            );

        }


        await loadTasks();

        await loadStats();


    } catch (error) {

        console.error(
            "Complete task error:",
            error
        );

        alert(
            "Unable to complete task."
        );

    }

}


// ========================================
// DELETE TASK
// ========================================

async function deleteTask(id) {

    if (
        !confirm(
            "Delete this task?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/tasks/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to delete task."
            );

        }


        await loadTasks();

        await loadStats();


    } catch (error) {

        console.error(
            "Delete task error:",
            error
        );

        alert(
            "Unable to delete task."
        );

    }

}


// ========================================
// EXPENSES
// ========================================

async function loadExpenses() {

    try {

        const expenses =
            await getAPIData(
                "/api/expenses"
            );


        const container =
            document.getElementById(
                "expenseList"
            );


        if (!container) {

            return;

        }


        if (!expenses.length) {

            container.innerHTML =
                `
                <div class="empty">
                    No expenses recorded.
                </div>
                `;

            return;

        }


        container.innerHTML = "";


        expenses.forEach(expense => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "item";


            const amount =
                Number(expense.amount);


            const formattedAmount =
                Number.isFinite(amount)
                    ? amount.toFixed(2)
                    : "0.00";


            item.innerHTML =
                `

                <div>

                    <h3>
                        ${escapeHTML(
                            expense.title
                        )}
                    </h3>

                    <p>

                        Category:

                        ${escapeHTML(
                            expense.category ||
                            "General"
                        )}

                    </p>

                </div>


                <div>

                    <strong>

                        ₹${formattedAmount}

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

        console.error(
            "Expense loading error:",
            error
        );

    }

}


// ========================================
// ADD EXPENSE
// ========================================

async function addExpense() {

    const title =
        document
            .getElementById("expenseTitle")
            .value
            .trim();


    const amount =
        document
            .getElementById("expenseAmount")
            .value;


    const category =
        document
            .getElementById("expenseCategory")
            .value;


    if (!title || !amount) {

        alert(
            "Enter expense name and amount."
        );

        return;

    }


    const numericAmount =
        Number(amount);


    if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
    ) {

        alert(
            "Enter a valid expense amount."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/expenses",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        title,

                        amount: numericAmount,

                        category

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.error ||
                "Failed to add expense."
            );

            return;

        }


        alert(
            "Expense added!"
        );


        document
            .getElementById("expenseTitle")
            .value = "";


        document
            .getElementById("expenseAmount")
            .value = "";


        await loadExpenses();

        await loadStats();


    } catch (error) {

        console.error(
            "Add expense error:",
            error
        );

        alert(
            "Unable to add expense."
        );

    }

}


// ========================================
// DELETE EXPENSE
// ========================================

async function deleteExpense(id) {

    if (
        !confirm(
            "Delete this expense?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/expenses/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to delete expense."
            );

        }


        await loadExpenses();

        await loadStats();


    } catch (error) {

        console.error(
            "Delete expense error:",
            error
        );

        alert(
            "Unable to delete expense."
        );

    }

}


// ========================================
// NOTES
// ========================================

async function loadNotes() {

    try {

        const notes =
            await getAPIData(
                "/api/notes"
            );


        const container =
            document.getElementById(
                "noteList"
            );


        if (!container) {

            return;

        }


        if (!notes.length) {

            container.innerHTML =
                `
                <div class="empty">
                    No notes saved.
                </div>
                `;

            return;

        }


        container.innerHTML = "";


        notes.forEach(note => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "item";


            item.innerHTML =
                `

                <div>

                    <h3>
                        ${escapeHTML(
                            note.title
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            note.content || ""
                        )}
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

        console.error(
            "Note loading error:",
            error
        );

    }

}


// ========================================
// ADD NOTE
// ========================================

async function addNote() {

    const title =
        document
            .getElementById("noteTitle")
            .value
            .trim();


    const content =
        document
            .getElementById("noteContent")
            .value
            .trim();


    if (!title) {

        alert(
            "Enter a note title."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/notes",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        title,

                        content

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.error ||
                "Failed to save note."
            );

            return;

        }


        alert(
            "Note saved!"
        );


        document
            .getElementById("noteTitle")
            .value = "";


        document
            .getElementById("noteContent")
            .value = "";


        await loadNotes();

        await loadStats();


    } catch (error) {

        console.error(
            "Add note error:",
            error
        );

        alert(
            "Unable to save note."
        );

    }

}


// ========================================
// DELETE NOTE
// ========================================

async function deleteNote(id) {

    if (
        !confirm(
            "Delete this note?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/notes/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to delete note."
            );

        }


        await loadNotes();

        await loadStats();


    } catch (error) {

        console.error(
            "Delete note error:",
            error
        );

        alert(
            "Unable to delete note."
        );

    }

}


// ========================================
// EVENTS
// ========================================

async function loadEvents() {

    try {

        const events =
            await getAPIData(
                "/api/events"
            );


        const container =
            document.getElementById(
                "eventList"
            );


        if (!container) {

            return;

        }


        if (!events.length) {

            container.innerHTML =
                `
                <div class="empty">
                    No upcoming events.
                </div>
                `;

            return;

        }


        container.innerHTML = "";


        events.forEach(event => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "item";


            item.innerHTML =
                `

                <div>

                    <h3>
                        ${escapeHTML(
                            event.title
                        )}
                    </h3>

                    <p>

                        📅
                        ${escapeHTML(
                            event.event_date || ""
                        )}

                    </p>

                    <p>

                        ⏰
                        ${escapeHTML(
                            event.event_time ||
                            "No time"
                        )}

                    </p>

                    <p>

                        ${escapeHTML(
                            event.description ||
                            ""
                        )}

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

        console.error(
            "Event loading error:",
            error
        );

    }

}


// ========================================
// ADD EVENT
// ========================================

async function addEvent() {

    const title =
        document
            .getElementById("eventTitle")
            .value
            .trim();


    const event_date =
        document
            .getElementById("eventDate")
            .value;


    const event_time =
        document
            .getElementById("eventTime")
            .value;


    const description =
        document
            .getElementById("eventDescription")
            .value
            .trim();


    if (!title || !event_date) {

        alert(
            "Enter event title and date."
        );

        return;

    }


    try {

        const response =
            await fetch(
                "/api/events",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        title,

                        event_date,

                        event_time,

                        description

                    })

                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            alert(
                result.error ||
                "Failed to add event."
            );

            return;

        }


        alert(
            "Event added!"
        );


        document
            .getElementById("eventTitle")
            .value = "";


        document
            .getElementById("eventDate")
            .value = "";


        document
            .getElementById("eventTime")
            .value = "";


        document
            .getElementById("eventDescription")
            .value = "";


        await loadEvents();

        await loadStats();


    } catch (error) {

        console.error(
            "Add event error:",
            error
        );

        alert(
            "Unable to add event."
        );

    }

}


// ========================================
// DELETE EVENT
// ========================================

async function deleteEvent(id) {

    if (
        !confirm(
            "Delete this event?"
        )
    ) {

        return;

    }


    try {

        const response =
            await fetch(
                `/api/events/${id}`,
                {
                    method: "DELETE"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Failed to delete event."
            );

        }


        await loadEvents();

        await loadStats();


    } catch (error) {

        console.error(
            "Delete event error:",
            error
        );

        alert(
            "Unable to delete event."
        );

    }

}


// ========================================
// SECURITY
// Prevent HTML injection
// ========================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value ?? "";


    return div.innerHTML;

}

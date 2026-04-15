const currentPage = window.location.pathname.split("/").pop();
const publicPages = ["", "Home.html", "login", "login.html", "register", "register.html", "/"];

async function handleUnauthorized(response) {
    if (response.status === 401) {
        alert("Please log in first.");
        window.location.href = "/login";
        return true;
    }
    return false;
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData(loginForm);
        const response = await fetch("/login", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            window.location.href = result.redirect || "/dashboard";
        } else {
            alert(result.message || "Login failed");
        }
    });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData(registerForm);
        const response = await fetch("/register", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (response.ok && result.success) {
            alert(result.message);
            window.location.href = "/login";
        } else {
            alert("Registration failed: " + result.message);
        }
    });
}

async function logout() {
    await fetch("/logout");
    window.location.href = "/home";
}

async function renderElectricians() {
    const tbody = document.querySelector("#electriciansTable tbody");
    if (!tbody) return;

    const response = await fetch("/api/electricians");
    if (await handleUnauthorized(response)) return;

    const data = await response.json();

    tbody.innerHTML = "";
    data.forEach(e => {
        tbody.innerHTML += `
            <tr>
                <td>${e.id}</td>
                <td>${e.name}</td>
                <td>${e.phone ?? ""}</td>
                <td>
                    <span class="status ${e.status}">
                        ${e.status}
                    </span>
                </td>
                <td>
                    <button class="btn" onclick="editElectrician(${e.id})">Edit</button>
                    <button class="btn danger" onclick="deleteElectrician(${e.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}
renderElectricians();

async function addElectrician() {
    const name = prompt("Electrician Name:");
    const phone = prompt("Phone:");
    const status = prompt("Status (Available/Busy):", "Available");
    if (!name) return;

    const response = await fetch("/api/electricians", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, status })
    });

    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderElectricians();
    else alert(result.message);
}

async function editElectrician(id) {
    const newName = prompt("Edit Name:");
    const newPhone = prompt("Edit Phone:");
    const newStatus = prompt("Edit Status:");

    const response = await fetch(`/api/electricians/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, phone: newPhone, status: newStatus })
    });

    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderElectricians();
    else alert(result.message);
}

async function deleteElectrician(id) {
    if (!confirm("Delete this electrician?")) return;

    const response = await fetch(`/api/electricians/${id}`, { method: "DELETE" });
    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderElectricians();
    else alert(result.message);
}

async function renderMaterials() {
    const tbody = document.querySelector("#materialsTable tbody");
    if (!tbody) return;

    const response = await fetch("/api/materials");
    if (await handleUnauthorized(response)) return;

    const data = await response.json();

    tbody.innerHTML = "";
    data.forEach(m => {
        tbody.innerHTML += `
            <tr>
                <td>${m.id}</td>
                <td>${m.name}</td>
                <td>${m.quantity}</td>
                <td>${m.status}</td>
                <td>
                    <button class="btn" onclick="editMaterial(${m.id})">Edit</button>
                    <button class="btn danger" onclick="deleteMaterial(${m.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}
renderMaterials();

async function addMaterial() {
    const name = prompt("Material Name:");
    const quantity = prompt("Quantity:");
    const status = prompt("Status:", "Available");
    const usage = prompt("Usage:", "");
    if (!name) return;

    const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity, status, usage })
    });

    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderMaterials();
    else alert(result.message);
}

async function editMaterial(id) {
    const newName = prompt("Edit Name:");
    const newQuantity = prompt("Edit Quantity:");
    const newStatus = prompt("Edit Status:");
    const newUsage = prompt("Edit Usage:");

    const response = await fetch(`/api/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, quantity: newQuantity, status: newStatus, usage: newUsage })
    });

    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderMaterials();
    else alert(result.message);
}

async function deleteMaterial(id) {
    if (!confirm("Delete this material?")) return;

    const response = await fetch(`/api/materials/${id}`, { method: "DELETE" });
    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderMaterials();
    else alert(result.message);
}

async function createJob() {
    const title = prompt("Job Title:");
    const location = prompt("Location:");
    const electrician_id = prompt("Electrician ID:");
    const deadline = prompt("Deadline:");
    const status = prompt("Status:", "Pending");

    if (!title || !location) return;

    const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, location, deadline, status, electrician_id })
    });

    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderJobs();
    else alert(result.message);
}

async function editJob(id) {
    const newTitle = prompt("Edit Title:");
    const newLocation = prompt("Edit Location:");
    const newDeadline = prompt("Edit Deadline:");
    const newStatus = prompt("Edit Status:");
    const newElectricianId = prompt("Edit Electrician ID:");

    const response = await fetch(`/api/jobs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            title: newTitle,
            location: newLocation,
            deadline: newDeadline,
            status: newStatus,
            electrician_id: newElectricianId
        })
    });

    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderJobs();
    else alert(result.message);
}

async function deleteJob(id) {
    if (!confirm("Delete this job?")) return;

    const response = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderJobs();
    else alert(result.message);
}

async function renderJobs() {
    const tbody = document.querySelector("#jobsTable tbody");
    if (!tbody) return;

    const response = await fetch("/api/jobs");
    if (await handleUnauthorized(response)) return;

    const data = await response.json();

    tbody.innerHTML = "";
    data.forEach(job => {
        tbody.innerHTML += `
            <tr>
                <td>${job.id}</td>
                <td>${job.title}</td>
                <td>${job.location}</td>
                <td>${job.electrician_id ?? ""}</td>
                <td>${job.deadline ?? ""}</td>
                <td><span class="status">${job.status}</span></td>
                <td>
                    <button class="btn" onclick="editJob(${job.id})">Edit</button>
                    <button class="btn danger" onclick="deleteJob(${job.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}
renderJobs();

function getTaskStatus(progress) {
    const value = parseInt(progress);
    if (value === 100) return "Completed";
    if (value === 0) return "Pending";
    return "In Progress";
}

async function renderTasks(statusFilter = "") {
    const tbody = document.querySelector("#tasksTable tbody");
    if (!tbody) return;

    const url = statusFilter ? `/api/tasks?status=${encodeURIComponent(statusFilter)}` : "/api/tasks";
    const response = await fetch(url);
    if (await handleUnauthorized(response)) return;

    const data = await response.json();

    tbody.innerHTML = "";
    data.forEach(task => {
        const status = task.status || getTaskStatus(task.progress);
        tbody.innerHTML += `
            <tr>
                <td>${task.id}</td>
                <td>${task.task}</td>
                <td>${task.name ?? ""}</td>
                <td>${task.job_id ?? ""}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${task.progress || "0%"};"></div>
                    </div>
                </td>
                <td><span class="status">${status}</span></td>
                <td>
                    <button class="btn" onclick="editTask(${task.id})">Edit</button>
                    <button class="btn danger" onclick="deleteTask(${task.id})">Delete</button>
                </td>
            </tr>
        `;
    });
}
renderTasks();

async function addTask() {
    const task = prompt("Task Name:");
    const name = prompt("Assign Electrician Name:");
    const job_id = prompt("Job ID:");
    const progress = prompt("Progress (e.g. 50%):", "0%");
    const status = prompt("Status:", "Pending");
    const electrician_id = prompt("Electrician ID:");

    if (!task || !job_id) return;

    const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, name, progress, status, electrician_id, job_id })
    });

    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderTasks();
    else alert(result.message);
}

async function editTask(id) {
    const newTask = prompt("Edit Task:");
    const newName = prompt("Edit Electrician Name:");
    const newJobId = prompt("Edit Job ID:");
    const newProgress = prompt("Edit Progress (e.g. 50%):");
    const newStatus = prompt("Edit Status:");
    const newElectricianId = prompt("Edit Electrician ID:");

    const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            task: newTask,
            name: newName,
            progress: newProgress,
            status: newStatus,
            electrician_id: newElectricianId,
            job_id: newJobId
        })
    });

    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderTasks();
    else alert(result.message);
}

async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;

    const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    if (await handleUnauthorized(response)) return;

    const result = await response.json();
    if (result.success) renderTasks();
    else alert(result.message);
}

async function updateDashboard() {
    const element = document.querySelector(".total-electricians");
    if (!element) return;

    const response = await fetch("/api/electricians");
    if (await handleUnauthorized(response)) return;

    const data = await response.json();
    element.innerText = data.length;
}
updateDashboard();

async function loadNotifications() {
    try {
        const res = await fetch("/api/notifications");
        const data = await res.json();

        const container = document.getElementById("notificationContainer");
        if (!container) return;

        container.innerHTML = "";

        if (!data.length) {
            container.innerHTML = "<p>No new notifications</p>";
            return;
        }

        data.forEach(notification => {
            const div = document.createElement("div");
            div.classList.add("notification");

            if (notification.type === "task") {
                div.classList.add("task");
            } else if (notification.type === "complete") {
                div.classList.add("complete");
            } else if (notification.type === "deadline") {
                div.classList.add("deadline");
            }

            div.textContent = notification.message;
            container.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading notifications:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadNotifications);

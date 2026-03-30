const currentPage = window.location.pathname.split("/").pop();
const publicPages = [
    "Home.html",
    "login.html",
    "register.html"
];

if (!publicPages.includes(currentPage)) {
    if (localStorage.getItem("loggedIn") !== "true") {
        window.location.href = "login.html";
    }
}

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const formData = new FormData(loginForm);
        const response = await fetch("/login", { method: "POST", body: formData });
        if (response.redirected) {
            localStorage.setItem("loggedIn", "true");
            window.location.href = response.url;
        } else {
            const result = await response.json();
            alert(result.message);
        }
    });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();
        const formData = new FormData(registerForm);
        const response = await fetch("/register", { method: "POST", body: formData });
        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            window.location.href = "/login";
        } else {
            alert("Registration failed: " + result.message);
        }
    });
}

function logout() {
    localStorage.removeItem("loggedIn");
    fetch("/logout"); // clear server session too
    window.location.href = "Home.html";
}

async function renderElectricians() {
    const tbody = document.querySelector("#electriciansTable tbody");
    if (!tbody) return;

    const response = await fetch("/api/electricians");
    const data = await response.json();

    tbody.innerHTML = "";
    data.forEach(e => {
        tbody.innerHTML += `
            <tr>
                <td>${e.id}</td>
                <td>${e.name}</td>
                <td>${e.phone}</td>
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
    const result = await response.json();
    if (result.success) renderElectricians();
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
    const result = await response.json();
    if (result.success) renderElectricians();
}

async function deleteElectrician(id) {
    if (!confirm("Delete this electrician?")) return;
    const response = await fetch(`/api/electricians/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (result.success) renderElectricians();
}

async function renderMaterials() {
    const tbody = document.querySelector("#materialsTable tbody");
    if (!tbody) return;

    const response = await fetch("/api/materials");
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
    if (!name) return;

    const response = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, quantity, status })
    });
    const result = await response.json();
    if (result.success) renderMaterials();
}

async function editMaterial(id) {
    const newName = prompt("Edit Name:");
    const newQuantity = prompt("Edit Quantity:");
    const newStatus = prompt("Edit Status:");

    const response = await fetch(`/api/materials/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, quantity: newQuantity, status: newStatus })
    });
    const result = await response.json();
    if (result.success) renderMaterials();
}

async function deleteMaterial(id) {
    if (!confirm("Delete this material?")) return;
    const response = await fetch(`/api/materials/${id}`, { method: "DELETE" });
    const result = await response.json();
    if (result.success) renderMaterials();
}

async function createJob() {
    const title = prompt("Job Title:");
    const location = prompt("Location:");
    const electrician_id = prompt("Electrician ID:"); // backend expects ID, not name
    const deadline = prompt("Deadline:");
    const status = prompt("Status:", "Pending");

    if (!title) return;

    await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, location, deadline, status, electrician_id })
    });
    renderJobs();
}

async function editJob(id) {
    const newTitle = prompt("Edit Title:");
    const newLocation = prompt("Edit Location:");
    const newDeadline = prompt("Edit Deadline:");
    const newStatus = prompt("Edit Status:");
    const newElectricianId = prompt("Edit Electrician ID:");

    await fetch(`/api/jobs/${id}`, {
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
    renderJobs();
}

async function deleteJob(id) {
    if (!confirm("Delete this job?")) return;
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    renderJobs();
}

async function renderJobs() {
    const tbody = document.querySelector("#jobsTable tbody");
    if (!tbody) return;

    const response = await fetch("/api/jobs");
    const data = await response.json();

    tbody.innerHTML = "";
    data.forEach(job => {
        tbody.innerHTML += `
            <tr>
                <td>${job.id}</td>
                <td>${job.title}</td>
                <td>${job.location}</td>
                <td>${job.electrician_id}</td>
                <td>${job.deadline}</td>
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
    if (progress === 100) return "Completed";
    if (progress === 0) return "Pending";
    return "In Progress";
}

async function renderTasks() {
    const tbody = document.querySelector("#tasksTable tbody");
    if (!tbody) return;

    const response = await fetch("/api/tasks");
    const data = await response.json();

    tbody.innerHTML = "";
    data.forEach(task => {
        const status = getTaskStatus(parseInt(task.progress));
        tbody.innerHTML += `
            <tr>
                <td>${task.id}</td>
                <td>${task.task}</td>
                <td>${task.name}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress" style="width: ${task.progress};"></div>
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
    const progress = prompt("Progress (e.g. 50%):", "0%");
    const status = prompt("Status:", "Pending");
    const electrician_id = prompt("Electrician ID:");

    if (!task) return;

    await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task, name, progress, status, electrician_id })
    });
    renderTasks();
}

async function editTask(id) {
    const newTask = prompt("Edit Task:");
    const newName = prompt("Edit Electrician Name:");
    const newProgress = prompt("Edit Progress (e.g. 50%):");
    const newStatus = prompt("Edit Status:");
    const newElectricianId = prompt("Edit Electrician ID:");

    await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            task: newTask,
            name: newName,
            progress: newProgress,
            status: newStatus,
            electrician_id: newElectricianId
        })
    });
    renderTasks();
}

async function deleteTask(id) {
    if (!confirm("Delete this task?")) return;
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    renderTasks();
}

async function updateDashboard() {
    const element = document.querySelector(".total-electricians");
    if (!element) return;

    const response = await fetch("/api/electricians");
    const data = await response.json();
    element.innerText = data.length;
}
updateDashboard();
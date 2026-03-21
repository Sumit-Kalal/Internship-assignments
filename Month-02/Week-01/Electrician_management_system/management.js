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
    loginForm.addEventListener("submit", function (e) {
        e.preventDefault();

        localStorage.setItem("loggedIn", "true");

        window.location.href = "dashboard.html";
    });
}

const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", function (e) {
        e.preventDefault();

        alert("Registration successful!");

        window.location.href = "login.html";
    });
}

function logout() {
    localStorage.removeItem("loggedIn");
    window.location.href = "Home.html";
}

if (!localStorage.getItem("electricians")) {

    const electricians = [
        {
            id: 1,
            name: "Raj Kumar",
            phone: "9876543210",
            status: "available"
        },
        {
            id: 2,
            name: "Amit Sharma",
            phone: "9123456780",
            status: "busy"
        },
        {
            id: 3,
            name: "Rajesh Nandan",
            phone: "9988776655",
            status: "available"
        }
    ];

    localStorage.setItem(
        "electricians",
        JSON.stringify(electricians)
    );
}


function renderElectricians() {

    const tbody =
        document.querySelector(
            "#electriciansTable tbody"
        );

    if (!tbody) return;

    const data =
        JSON.parse(
            localStorage.getItem("electricians")
        );

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
                    <button class="btn"
                        onclick="editElectrician(${e.id})">
                        Edit
                    </button>

                    <button class="btn danger"
                        onclick="deleteElectrician(${e.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;

    });
}

renderElectricians();


function addElectrician() {

    let data =
        JSON.parse(
            localStorage.getItem("electricians")
        );

    const name =
        prompt("Electrician Name:");

    const phone =
        prompt("Phone:");

    const status =
        prompt(
            "Status (available/busy):",
            "available"
        );

    if (!name) return;

    const newItem = {

        id: Date.now(),
        name: name,
        phone: phone,
        status: status

    };

    data.push(newItem);

    localStorage.setItem(
        "electricians",
        JSON.stringify(data)
    );

    renderElectricians();
}


function editElectrician(id) {

    let data =
        JSON.parse(
            localStorage.getItem("electricians")
        );

    const electrician =
        data.find(
            e => e.id === id
        );

    if (!electrician) return;

    const newName =
        prompt(
            "Edit Name:",
            electrician.name
        );

    const newPhone =
        prompt(
            "Edit Phone:",
            electrician.phone
        );

    const newStatus =
        prompt(
            "Edit Status:",
            electrician.status
        );

    if (newName !== null)
        electrician.name = newName;

    if (newPhone !== null)
        electrician.phone = newPhone;

    if (newStatus !== null)
        electrician.status = newStatus;

    localStorage.setItem(
        "electricians",
        JSON.stringify(data)
    );

    renderElectricians();
}


function deleteElectrician(id) {

    const confirmDelete =
        confirm(
            "Delete this electrician?"
        );

    if (!confirmDelete)
        return;

    let data =
        JSON.parse(
            localStorage.getItem("electricians")
        );

    data =
        data.filter(
            e => e.id !== id
        );

    localStorage.setItem(
        "electricians",
        JSON.stringify(data)
    );

    renderElectricians();
}


if (!localStorage.getItem("materials")) {

    const materials = [

        {
            id: 1,
            name: "Copper Wire",
            quantity: 50,
            usage: "Wiring"
        },

        {
            id: 2,
            name: "Switch",
            quantity: 20,
            usage: "Installation"
        }

    ];
    localStorage.setItem(
        "materials",
        JSON.stringify(materials)
    );
}

function renderMaterials() {

    const tbody =
        document.querySelector(
            "#materialsTable tbody"
        );
    if (!tbody) return;
    const data =
        JSON.parse(
            localStorage.getItem("materials")
        );

    tbody.innerHTML = "";

    data.forEach(m => {

        tbody.innerHTML += `
            <tr>
                <td>${m.id}</td>
                <td>${m.name}</td>
                <td>${m.quantity}</td>
                <td>${m.usage}</td>
                <td>
                    <button class="btn"
                        onclick="editMaterial(${m.id})">
                        Edit
                    </button>

                    <button class="btn danger"
                        onclick="deleteMaterial(${m.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;
    });
}

renderMaterials();

function addMaterial() {

    let data =
        JSON.parse(
            localStorage.getItem("materials")
        );

    const name =
        prompt("Material Name:");
    const quantity =
        prompt("Quantity:");
    const usage =
        prompt("Usage:");
    if (!name) return;
    const newMaterial = {

        id: Date.now(),
        name: name,
        quantity: quantity,
        usage: usage

    };

    data.push(newMaterial);
    localStorage.setItem(
        "materials",
        JSON.stringify(data)
    );
    renderMaterials();
}

function editMaterial(id) {

    let data =
        JSON.parse(
            localStorage.getItem("materials")
        );
    const material =
        data.find(
            m => m.id === id
        );

    if (!material) return;
    const newName =
        prompt(
            "Edit Name:",
            material.name
        );
    const newQuantity =
        prompt(
            "Edit Quantity:",
            material.quantity
        );
    const newUsage =
        prompt(
            "Edit Usage:",
            material.usage
        );

    if (newName !== null)
        material.name = newName;
    if (newQuantity !== null)
        material.quantity = newQuantity;
    if (newUsage !== null)
        material.usage = newUsage;
    localStorage.setItem(
        "materials",
        JSON.stringify(data)
    );
    renderMaterials();
}


function deleteMaterial(id) {

    const confirmDelete =
        confirm(
            "Delete this material?"
        );
    if (!confirmDelete)
        return;
    let data =
        JSON.parse(
            localStorage.getItem("materials")
        );

    data =
        data.filter(
            m => m.id !== id
        );
        localStorage.setItem(
        "materials",
        JSON.stringify(data)
    );
    renderMaterials();
}


if (!localStorage.getItem("jobs")) {

    const jobs = [
        {
            id: 1,
            title: "House Wiring",
            location: "Bangalore",
            electrician: "Raj Kumar",
            deadline: "25 Mar 2026",
            status: "Active"
        },
        {
            id: 2,
            title: "Fan Installation",
            location: "Whitefield",
            electrician: "Amit Sharma",
            deadline: "22 Mar 2026",
            status: "Pending"
        }
    ];

    localStorage.setItem(
        "jobs",
        JSON.stringify(jobs)
    );
}


function renderJobs() {

    const tbody =
        document.querySelector(
            "#jobsTable tbody"
        );

    if (!tbody) return;

    const data =
        JSON.parse(
            localStorage.getItem("jobs")
        );

    tbody.innerHTML = "";

    data.forEach(job => {

        tbody.innerHTML += `
            <tr>
                <td>${job.id}</td>
                <td>${job.title}</td>
                <td>${job.location}</td>
                <td>${job.electrician}</td>
                <td>${job.deadline}</td>
                <td>
                    <span class="status">
                        ${job.status}
                    </span>
                </td>
                <td>
                    <button class="btn"
                        onclick="editJob(${job.id})">
                        Edit
                    </button>

                    <button class="btn danger"
                        onclick="deleteJob(${job.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;

    });
}

renderJobs();


function createJob() {

    let data =
        JSON.parse(
            localStorage.getItem("jobs")
        );

    const title =
        prompt("Job Title:");

    const location =
        prompt("Location:");

    const electrician =
        prompt("Electrician:");

    const deadline =
        prompt("Deadline:");

    const status =
        prompt(
            "Status:",
            "Active"
        );

    if (!title) return;

    const newJob = {

        id: Date.now(),
        title: title,
        location: location,
        electrician: electrician,
        deadline: deadline,
        status: status

    };

    data.push(newJob);

    localStorage.setItem(
        "jobs",
        JSON.stringify(data)
    );

    renderJobs();
}

function editJob(id) {

    let data =
        JSON.parse(
            localStorage.getItem("jobs")
        );

    const job =
        data.find(
            j => j.id === id
        );

    if (!job) return;

    const newTitle =
        prompt(
            "Edit Title:",
            job.title
        );

    const newLocation =
        prompt(
            "Edit Location:",
            job.location
        );

    const newElectrician =
        prompt(
            "Edit Electrician:",
            job.electrician
        );

    const newDeadline =
        prompt(
            "Edit Deadline:",
            job.deadline
        );

    const newStatus =
        prompt(
            "Edit Status:",
            job.status
        );

    if (newTitle !== null)
        job.title = newTitle;

    if (newLocation !== null)
        job.location = newLocation;

    if (newElectrician !== null)
        job.electrician = newElectrician;

    if (newDeadline !== null)
        job.deadline = newDeadline;

    if (newStatus !== null)
        job.status = newStatus;

    localStorage.setItem(
        "jobs",
        JSON.stringify(data)
    );

    renderJobs();
}


function deleteJob(id) {

    if (!confirm("Delete this job?"))
        return;

    let data =
        JSON.parse(
            localStorage.getItem("jobs")
        );

    data =
        data.filter(
            j => j.id !== id
        );

    localStorage.setItem(
        "jobs",
        JSON.stringify(data)
    );

    renderJobs();
}

if (!localStorage.getItem("tasks")) {

    const tasks = [
        {
            id: 1,
            name: "Install wiring",
            electrician: "Raj Kumar",
            progress: 70
        },
        {
            id: 2,
            name: "Fix switchboard",
            electrician: "Amit Sharma",
            progress: 30
        },
        {
            id: 3,
            name: "Office inspection",
            electrician: "Rajesh Nandan",
            progress: 100
        }
    ];

    localStorage.setItem(
        "tasks",
        JSON.stringify(tasks)
    );
}


function getTaskStatus(progress) {

    if (progress === 100)
        return "Completed";

    if (progress === 0)
        return "Pending";

    return "In Progress";
}


function renderTasks() {

    const tbody =
        document.querySelector(
            "#tasksTable tbody"
        );

    if (!tbody) return;

    const data =
        JSON.parse(
            localStorage.getItem("tasks")
        );

    tbody.innerHTML = "";

    data.forEach(task => {

        const status =
            getTaskStatus(task.progress);

        tbody.innerHTML += `
            <tr>
                <td>${task.id}</td>
                <td>${task.name}</td>
                <td>${task.electrician}</td>
                <td>
                    <div class="progress-bar">
                        <div class="progress"
                            style="width: ${task.progress}%;">
                        </div>
                    </div>
                </td>
                <td>
                    <span class="status">
                        ${status}
                    </span>
                </td>
                <td>
                    <button class="btn"
                        onclick="editTask(${task.id})">
                        Edit
                    </button>

                    <button class="btn danger"
                        onclick="deleteTask(${task.id})">
                        Delete
                    </button>
                </td>
            </tr>
        `;

    });
}

renderTasks();

function addTask() {

    let data =
        JSON.parse(
            localStorage.getItem("tasks")
        );

    const name =
        prompt("Task Name:");

    const electrician =
        prompt("Assign Electrician:");

    const progress =
        parseInt(
            prompt(
                "Progress (0-100):",
                "0"
            )
        );

    if (!name) return;

    const newTask = {

        id: Date.now(),
        name: name,
        electrician: electrician,
        progress: progress

    };

    data.push(newTask);

    localStorage.setItem(
        "tasks",
        JSON.stringify(data)
    );

    renderTasks();
}


function editTask(id) {

    let data =
        JSON.parse(
            localStorage.getItem("tasks")
        );

    const task =
        data.find(
            t => t.id === id
        );

    if (!task) return;

    const newName =
        prompt(
            "Edit Task:",
            task.name
        );

    const newElectrician =
        prompt(
            "Edit Electrician:",
            task.electrician
        );

    const newProgress =
        parseInt(
            prompt(
                "Edit Progress (0-100):",
                task.progress
            )
        );

    if (newName !== null)
        task.name = newName;

    if (newElectrician !== null)
        task.electrician = newElectrician;

    if (!isNaN(newProgress))
        task.progress = newProgress;

    localStorage.setItem(
        "tasks",
        JSON.stringify(data)
    );

    renderTasks();
}

function deleteTask(id) {

    if (!confirm("Delete this task?"))
        return;

    let data =
        JSON.parse(
            localStorage.getItem("tasks")
        );

    data =
        data.filter(
            t => t.id !== id
        );

    localStorage.setItem(
        "tasks",
        JSON.stringify(data)
    );

    renderTasks();
}
function updateDashboard() {
    const element =
        document.querySelector(
            ".total-electricians"
        );

    if (!element) return;

    const data =
        JSON.parse(
            localStorage.getItem("electricians")
        );

    element.innerText =
        data.length;
}
updateDashboard();
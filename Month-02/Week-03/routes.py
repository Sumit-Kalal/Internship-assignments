from functools import wraps
from flask import Blueprint, render_template, request, redirect, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import User, Electrician, Job, Task, Material, db

main = Blueprint("main", __name__)


def login_required_page(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


def login_required_api(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if "user_id" not in session:
            return jsonify({"success": False, "message": "Unauthorized"}), 401
        return f(*args, **kwargs)
    return decorated_function


@main.route("/")
def index():
    return render_template("index.html")


@main.route("/Home.html")
def home():
    return render_template("Home.html")


@main.route("/login.html", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        try:
            email = request.form.get("email")
            password = request.form.get("password")

            if not email or not password:
                return jsonify({"success": False, "message": "Email and password are required"}), 400

            user = User.query.filter_by(email=email).first()

            if user and check_password_hash(user.password, password):
                session["user_id"] = user.id
                session["role"] = user.role
                return jsonify({
                    "success": True,
                    "message": "Login successful",
                    "redirect": "/dashboard"
                }), 200

            return jsonify({"success": False, "message": "Invalid email or password"}), 401

        except Exception as e:
            return jsonify({"success": False, "message": str(e)}), 500

    return render_template("login.html")


@main.route("/register.html", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")

    try:
        name = request.form.get("name")
        phone = request.form.get("phone")
        email = request.form.get("email")
        role = request.form.get("role")
        raw_password = request.form.get("password")

        if not name or not email or not raw_password:
            return jsonify({"success": False, "message": "Name, email and password are required"}), 400

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            return jsonify({"success": False, "message": "Email already registered"}), 409

        password = generate_password_hash(raw_password)

        new_user = User(
            name=name,
            phone=phone,
            email=email,
            role=role,
            password=password
        )
        db.session.add(new_user)
        db.session.commit()

        return jsonify({"success": True, "message": "User registered successfully"}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@main.route("/logout")
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out"})


@main.route("/dashboard.html")
@login_required_page
def dashboard():
    return render_template("dashboard.html")


@main.route("/api/users", methods=["GET"])
@login_required_api
def get_users():
    users = User.query.all()
    return jsonify([{
        "id": u.id,
        "name": u.name,
        "phone": u.phone,
        "email": u.email,
        "role": u.role
    } for u in users])


@main.route("/api/users/<int:id>", methods=["PUT"])
@login_required_api
def update_user(id):
    user = db.session.get(User, id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    user.name = data.get("name", user.name)
    user.phone = data.get("phone", user.phone)
    user.email = data.get("email", user.email)
    user.role = data.get("role", user.role)

    db.session.commit()
    return jsonify({"success": True, "message": "User updated successfully"}), 200


@main.route("/api/users/<int:id>", methods=["DELETE"])
@login_required_api
def delete_user(id):
    user = db.session.get(User, id)
    if not user:
        return jsonify({"success": False, "message": "User not found"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True, "message": "User deleted successfully"}), 200


@main.route("/api/electricians", methods=["GET"])
@login_required_api
def get_electricians():
    electricians = Electrician.query.all()
    return jsonify([{
        "id": e.id,
        "name": e.name,
        "phone": e.phone,
        "status": e.status
    } for e in electricians])


@main.route("/api/electricians", methods=["POST"])
@login_required_api
def add_electrician():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        if not data.get("name"):
            return jsonify({"success": False, "message": "Name is required"}), 400

        new_electrician = Electrician(
            name=data.get("name"),
            phone=data.get("phone"),
            status=data.get("status", "Available")
        )

        db.session.add(new_electrician)
        db.session.commit()
        return jsonify({"success": True, "message": "Electrician added successfully", "id": new_electrician.id}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@main.route("/api/electricians/<int:id>", methods=["PUT"])
@login_required_api
def update_electrician(id):
    electrician = db.session.get(Electrician, id)
    if not electrician:
        return jsonify({"success": False, "message": "Electrician not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    electrician.name = data.get("name", electrician.name)
    electrician.phone = data.get("phone", electrician.phone)
    electrician.status = data.get("status", electrician.status)

    db.session.commit()
    return jsonify({"success": True, "message": "Electrician updated successfully"}), 200


@main.route("/api/electricians/<int:id>", methods=["DELETE"])
@login_required_api
def delete_electrician(id):
    electrician = db.session.get(Electrician, id)
    if not electrician:
        return jsonify({"success": False, "message": "Electrician not found"}), 404

    db.session.delete(electrician)
    db.session.commit()
    return jsonify({"success": True, "message": "Electrician deleted successfully"}), 200


@main.route("/api/jobs", methods=["GET"])
@login_required_api
def get_jobs():
    jobs = Job.query.all()
    return jsonify([{
        "id": j.id,
        "title": j.title,
        "location": j.location,
        "deadline": j.deadline,
        "status": j.status,
        "electrician_id": j.electrician_id
    } for j in jobs])


@main.route("/api/jobs", methods=["POST"])
@login_required_api
def add_job():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        if not data.get("title") or not data.get("location"):
            return jsonify({"success": False, "message": "Title and location are required"}), 400

        new_job = Job(
            title=data.get("title"),
            location=data.get("location"),
            deadline=data.get("deadline"),
            status=data.get("status", "Pending"),
            electrician_id=data.get("electrician_id")
        )

        db.session.add(new_job)
        db.session.commit()
        return jsonify({"success": True, "message": "Job added successfully", "id": new_job.id}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@main.route("/api/jobs/<int:id>", methods=["PUT"])
@login_required_api
def update_job(id):
    job = db.session.get(Job, id)
    if not job:
        return jsonify({"success": False, "message": "Job not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    job.title = data.get("title", job.title)
    job.location = data.get("location", job.location)
    job.deadline = data.get("deadline", job.deadline)
    job.status = data.get("status", job.status)
    job.electrician_id = data.get("electrician_id", job.electrician_id)

    db.session.commit()
    return jsonify({"success": True, "message": "Job updated successfully"}), 200


@main.route("/api/jobs/<int:id>", methods=["DELETE"])
@login_required_api
def delete_job(id):
    job = db.session.get(Job, id)
    if not job:
        return jsonify({"success": False, "message": "Job not found"}), 404

    db.session.delete(job)
    db.session.commit()
    return jsonify({"success": True, "message": "Job deleted successfully"}), 200


@main.route("/api/tasks", methods=["GET"])
@login_required_api
def get_tasks():
    status = request.args.get("status")
    query = Task.query

    if status:
        query = query.filter_by(status=status)

    tasks = query.all()
    return jsonify([{
        "id": t.id,
        "task": t.task,
        "name": t.name,
        "progress": t.progress,
        "status": t.status,
        "electrician_id": t.electrician_id,
        "job_id": t.job_id
    } for t in tasks])


@main.route("/api/tasks", methods=["POST"])
@login_required_api
def add_task():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        if not data.get("task") or not data.get("job_id"):
            return jsonify({"success": False, "message": "Task and job_id are required"}), 400

        new_task = Task(
            task=data.get("task"),
            name=data.get("name"),
            progress=data.get("progress", "0%"),
            status=data.get("status", "Pending"),
            electrician_id=data.get("electrician_id"),
            job_id=data.get("job_id")
        )

        db.session.add(new_task)
        db.session.commit()
        return jsonify({"success": True, "message": "Task added successfully", "id": new_task.id}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@main.route("/api/tasks/<int:id>", methods=["PUT"])
@login_required_api
def update_task(id):
    task = db.session.get(Task, id)
    if not task:
        return jsonify({"success": False, "message": "Task not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    task.task = data.get("task", task.task)
    task.name = data.get("name", task.name)
    task.progress = data.get("progress", task.progress)
    task.status = data.get("status", task.status)
    task.electrician_id = data.get("electrician_id", task.electrician_id)
    task.job_id = data.get("job_id", task.job_id)

    db.session.commit()
    return jsonify({"success": True, "message": "Task updated successfully"}), 200


@main.route("/api/tasks/<int:id>", methods=["DELETE"])
@login_required_api
def delete_task(id):
    task = db.session.get(Task, id)
    if not task:
        return jsonify({"success": False, "message": "Task not found"}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({"success": True, "message": "Task deleted successfully"}), 200


@main.route("/api/materials", methods=["GET"])
@login_required_api
def get_materials():
    materials = Material.query.all()
    return jsonify([{
        "id": m.id,
        "name": m.name,
        "quantity": m.quantity,
        "status": m.status,
        "usage": m.usage
    } for m in materials])


@main.route("/api/materials", methods=["POST"])
@login_required_api
def add_material():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"}), 400

        if not data.get("name") or data.get("quantity") is None:
            return jsonify({"success": False, "message": "Name and quantity are required"}), 400

        new_material = Material(
            name=data.get("name"),
            quantity=data.get("quantity"),
            usage=data.get("usage"),
            status=data.get("status", "Available")
        )

        db.session.add(new_material)
        db.session.commit()
        return jsonify({"success": True, "message": "Material added successfully", "id": new_material.id}), 201

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@main.route("/api/materials/<int:id>", methods=["PUT"])
@login_required_api
def update_material(id):
    material = db.session.get(Material, id)
    if not material:
        return jsonify({"success": False, "message": "Material not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"success": False, "message": "No data provided"}), 400

    material.name = data.get("name", material.name)
    material.quantity = data.get("quantity", material.quantity)
    material.usage = data.get("usage", material.usage)
    material.status = data.get("status", material.status)

    db.session.commit()
    return jsonify({"success": True, "message": "Material updated successfully"}), 200


@main.route("/api/materials/<int:id>", methods=["DELETE"])
@login_required_api
def delete_material(id):
    material = db.session.get(Material, id)
    if not material:
        return jsonify({"success": False, "message": "Material not found"}), 404

    db.session.delete(material)
    db.session.commit()
    return jsonify({"success": True, "message": "Material deleted successfully"}), 200

@main.route("/electricians")
@login_required_page
def electrician_management():
    return render_template("Electrician management.html")


@main.route("/Job management.html")
@login_required_page
def job_management():
    return render_template("Job management.html")


@main.route("/materials.html")
@login_required_page
def materials():
    return render_template("materials.html")


@main.route("/Task Tracking.html")
@login_required_page
def task_tracking():
    return render_template("Task Tracking.html")


@main.route("/profile.html")
@login_required_page
def profile():
    return render_template("profile.html")


@main.route("/reports.html")
@login_required_page
def reports():
    return render_template("reports.html")
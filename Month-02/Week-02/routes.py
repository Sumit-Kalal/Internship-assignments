from flask import Blueprint, render_template, request, redirect, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import User, Electrician, Job, Task, Material, db

main = Blueprint("main", __name__)

@main.route("/")
def index():
    return render_template("index.html")

@main.route("/home")
def home():
    return render_template("Home.html")

@main.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        try:
            email = request.form.get("email")
            password = request.form.get("password")

            print("Login attempt:", email)
            user = User.query.filter_by(email=email).first()

            if user and check_password_hash(user.password, password):
                session["user_id"] = user.id
                session["role"] = user.role
                print("Login successful")
                return redirect("/dashboard")
            else:
                print("Invalid credentials")
                return jsonify({"success": False, "message": "Invalid email or password"}), 401

        except Exception as e:
            print("Login error:", e)
            return jsonify({"success": False, "message": str(e)}), 500

    return render_template("login.html")

@main.route("/register", methods=["GET", "POST"])
def register():
    try:
        name = request.form.get("name")
        phone = request.form.get("phone")
        email = request.form.get("email")
        role = request.form.get("role")
        password = generate_password_hash(request.form.get("password"))

        new_user = User(
            name=name,
            phone=phone,
            email=email,
            role=role,
            password=password
        )
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"success": True, "message": "User registered"})
    except Exception as e:
        print("Registration failed:", e)
        return jsonify({"success": False, "message": str(e)}), 500

@main.route("/logout")
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Logged out"})

@main.route("/api/electricians", methods=["GET"])
def get_electricians():
    electricians = Electrician.query.all()
    return jsonify([{
        "id": e.id,
        "name": e.name,
        "phone": e.phone,
        "status": e.status
    } for e in electricians])

@main.route("/api/electricians", methods=["POST"])
def add_electrician():
    try:
        data = request.get_json()
        new_electrician = Electrician(
            name=data.get("name"),
            phone=data.get("phone"),
            status=data.get("status", "Available")
        )
        db.session.add(new_electrician)
        db.session.commit()
        return jsonify({"success": True, "id": new_electrician.id})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@main.route("/api/electricians/<int:id>", methods=["PUT"])
def update_electrician(id):
    electrician = Electrician.query.get(id)
    if not electrician:
        return jsonify({"success": False}), 404
    data = request.get_json()
    electrician.name = data.get("name", electrician.name)
    electrician.phone = data.get("phone", electrician.phone)
    electrician.status = data.get("status", electrician.status)
    db.session.commit()
    return jsonify({"success": True})

@main.route("/api/electricians/<int:id>", methods=["DELETE"])
def delete_electrician(id):
    electrician = Electrician.query.get(id)
    if not electrician:
        return jsonify({"success": False}), 404
    db.session.delete(electrician)
    db.session.commit()
    return jsonify({"success": True})


@main.route("/api/jobs", methods=["GET"])
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
def add_job():
    try:
        data = request.get_json()
        new_job = Job(
            title=data.get("title"),
            location=data.get("location"),
            deadline=data.get("deadline"),
            status=data.get("status", "Pending"),
            electrician_id=data.get("electrician_id")
        )
        db.session.add(new_job)
        db.session.commit()
        return jsonify({"success": True, "id": new_job.id})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@main.route("/api/jobs/<int:id>", methods=["PUT"])
def update_job(id):
    job = Job.query.get(id)
    if not job:
        return jsonify({"success": False}), 404
    data = request.get_json()
    job.title = data.get("title", job.title)
    job.location = data.get("location", job.location)
    job.deadline = data.get("deadline", job.deadline)
    job.status = data.get("status", job.status)
    job.electrician_id = data.get("electrician_id", job.electrician_id)
    db.session.commit()
    return jsonify({"success": True})

@main.route("/api/jobs/<int:id>", methods=["DELETE"])
def delete_job(id):
    job = Job.query.get(id)
    if not job:
        return jsonify({"success": False}), 404
    db.session.delete(job)
    db.session.commit()
    return jsonify({"success": True})

@main.route("/api/tasks", methods=["GET"])
def get_tasks():
    tasks = Task.query.all()
    return jsonify([{
        "id": t.id,
        "task": t.task,
        "name": t.name,
        "progress": t.progress,
        "status": t.status,
        "electrician_id": t.electrician_id
    } for t in tasks])

@main.route("/api/tasks", methods=["POST"])
def add_task():
    try:
        data = request.get_json()
        new_task = Task(
            task=data.get("task"),
            name=data.get("name"),
            progress=data.get("progress", "0%"),
            status=data.get("status", "Pending"),
            electrician_id=data.get("electrician_id")
        )
        db.session.add(new_task)
        db.session.commit()
        return jsonify({"success": True, "id": new_task.id})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@main.route("/api/tasks/<int:id>", methods=["PUT"])
def update_task(id):
    task = Task.query.get(id)
    if not task:
        return jsonify({"success": False}), 404
    data = request.get_json()
    task.task = data.get("task", task.task)
    task.name = data.get("name", task.name)
    task.progress = data.get("progress", task.progress)
    task.status = data.get("status", task.status)
    task.electrician_id = data.get("electrician_id", task.electrician_id)
    db.session.commit()
    return jsonify({"success": True})

@main.route("/api/tasks/<int:id>", methods=["DELETE"])
def delete_task(id):
    task = Task.query.get(id)
    if not task:
        return jsonify({"success": False}), 404
    db.session.delete(task)
    db.session.commit()
    return jsonify({"success": True})

@main.route("/api/materials", methods=["GET"])
def get_materials():
    materials = Material.query.all()
    return jsonify([{
        "id": m.id,
        "name": m.name,
        "quantity": m.quantity,
        "status": m.status
    } for m in materials])

@main.route("/api/materials", methods=["POST"])
def add_material():
    try:
        data = request.get_json()
        new_material = Material(
            name=data.get("name"),
            quantity=data.get("quantity"),
            status=data.get("status", "Available")
        )
        db.session.add(new_material)
        db.session.commit()
        return jsonify({"success": True, "id": new_material.id})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

@main.route("/api/materials/<int:id>", methods=["PUT"])
def update_material(id):
    material = Material.query.get(id)
    if not material:
        return jsonify({"success": False}), 404
    data = request.get_json()
    material.name = data.get("name", material.name)
    material.quantity = data.get("quantity", material.quantity)
    material.status = data.get("status", material.status)
    db.session.commit()
    return jsonify({"success": True})

@main.route("/api/materials/<int:id>", methods=["DELETE"])
def delete_material(id):
    material = Material.query.get(id)
    if not material:
        return jsonify({"success": False}), 404
    db.session.delete(material)
    db.session.commit()
    return jsonify({"success": True})

@main.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@main.route("/api/users", methods=["GET"])
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
def update_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({"success": False}), 404
    data = request.get_json()
    user.name = data.get("name", user.name)
    user.phone = data.get("phone", user.phone)
    user.email = data.get("email", user.email)
    user.role = data.get("role", user.role)
    db.session.commit()
    return jsonify({"success": True})

@main.route("/api/users/<int:id>", methods=["DELETE"])
def delete_user(id):
    user = User.query.get(id)
    if not user:
        return jsonify({"success": False}), 404
    db.session.delete(user)
    db.session.commit()
    return jsonify({"success": True})
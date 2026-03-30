from flask_sqlalchemy import SQLAlchemy
db = SQLAlchemy()

# USERS TABLE
class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    phone= db.Column(db.String(20))
    email = db.Column(db.String(100), unique=True)
    role = db.Column(db.String(50))
    password = db.Column(db.String(100))

def __repr__(self):
    return f"<User {self.email}>"


# ELECTRICIANS TABLE
class Electrician(db.Model):
    __tablename__ = "electricians"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    status = db.Column(db.String(100))
    electrician_id = db.Column(db.Integer, db.ForeignKey("electricians.id"))
    tasks = db.relationship(
        "Task",
        backref="assigned_electrician",
        lazy=True
    )

    def __repr__(self):
        return f"<Electrician {self.name}>"

# JOBS TABLE
class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100))
    deadline = db.Column(db.String(50))
    status = db.Column(db.String(50))
    electrician_id = db.Column(db.Integer, db.ForeignKey("electricians.id"))

    def __repr__(self):
        return f"<Job {self.title}>"


# TASKS TABLE
class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    task = db.Column(db.String(200))
    name = db.Column(db.String(100))
    progress = db.Column(db.String(50))
    status = db.Column(db.String(50))
    electrician_id = db.Column(db.Integer, db.ForeignKey("electricians.id"))

    def __repr__(self):
        return f"<Task {self.task}>"

class Material(db.Model):
    __tablename__ = "materials"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    usage = db.Column(db.String(200))
    status = db.Column(db.String(50), default="Available")

    def __repr__(self):
        return f"<Material {self.name}>"
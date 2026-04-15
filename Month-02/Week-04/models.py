from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(50))
    password = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        return f"<User {self.email}>"


class Electrician(db.Model):
    __tablename__ = "electricians"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    status = db.Column(db.String(100), default="Available")

    jobs = db.relationship("Job", backref="electrician", lazy=True)
    tasks = db.relationship("Task", backref="assigned_electrician", lazy=True)

    def __repr__(self):
        return f"<Electrician {self.name}>"


class Job(db.Model):
    __tablename__ = "jobs"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    location = db.Column(db.String(100), nullable=False)
    deadline = db.Column(db.String(50))
    status = db.Column(db.String(50), default="Pending")
    electrician_id = db.Column(db.Integer, db.ForeignKey("electricians.id"))

    tasks = db.relationship("Task", backref="job", lazy=True, cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Job {self.title}>"


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(db.Integer, primary_key=True)
    task = db.Column(db.String(200), nullable=False)
    name = db.Column(db.String(100))
    progress = db.Column(db.String(50), default="0%")
    status = db.Column(db.String(50), default="Pending")
    electrician_id = db.Column(db.Integer, db.ForeignKey("electricians.id"))
    job_id = db.Column(db.Integer, db.ForeignKey("jobs.id"), nullable=False)

    def __repr__(self):
        return f"<Task {self.task}>"


class Material(db.Model):
    __tablename__ = "materials"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    usage = db.Column(db.String(200))
    status = db.Column(db.String(50), default="Available")

    def __repr__(self):
        return f"<Material {self.name}>"
from django.shortcuts import render, redirect
from .models import Student

def add_student(request):
    if request.method == "POST":
        name = request.POST.get("name")
        age = request.POST.get("age")
        marks = request.POST.get("marks")
        Student.objects.create(name=name, age=age, marks=marks)
        return redirect("list_students")   # after saving, go to list page
    return render(request, "myapp/add_students.html")

def list_students(request):
    students = Student.objects.all()
    return render(request, "myapp/list_students.html", {"students": students})
from django.shortcuts import render, redirect, get_object_or_404
from .models import Student

def add_record(request):
    if request.method =="POST":
        name=request.POST['name']
        email=request.POST['email']
        age=request.POST['age']
        course=request.POST['course']
        Student.objects.create(name=name, email=email, age=age, course=course)
        return redirect('view_entries')
    return render(request, 'myapp/add.html')

def list_records(request):
    students = Student.objects.all()
    return render(request, 'myapp/view_entries.html', {'students': students})

def edit_record(request, id):
    student = get_object_or_404(Student, id=id)
    if request.method =="POST":
        if 'delete' in request.GET:
            student.delete()
            return redirect('view_entries')
        student.name=request.POST['name']
        student.email=request.POST['email']
        student.age=request.POST['age']
        student.course= request.POST['course']
        student.save()
        return redirect('view_entries')
    return render(request, 'myapp/edit.html', {'student': student})

def delete_record(request, id):
    student = get_object_or_404(Student, id=id)
    student.delete()
    return redirect('view_entries')

def home(request):
    return render(request, 'myapp/home.html')
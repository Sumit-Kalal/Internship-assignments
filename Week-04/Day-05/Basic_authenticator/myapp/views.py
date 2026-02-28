from django.shortcuts import render, redirect
from .models import User

def register_view(request):
    if request.method =="POST":
        username=request.POST.get("username")
        password=request.POST.get("password")


        if User.objects.filter(username=username).exists():
            return render(request, "myapp/Registration_form.html", {"error": "User already exists"})
        
        User.objects.create(username=username, password=password)
        return redirect("login_form") 
    
    return render(request, "myapp/Registration_form.html")


def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        try:
            user =User.objects.get(username=username, password=password)
            return redirect("home") 
        except User.DoesNotExist:
            return render(request, "myapp/login_form.html", {"error": "Invalid credentials. Please register or check your username and password."})
    
    return render(request, "myapp/login_form.html")


def home_view(request):
    return render(request, "myapp/home.html")

def user_list_view(request):
    users = User.objects.all().order_by("-created_at") 
    return render(request, "myapp/user_list.html", {"users": users})

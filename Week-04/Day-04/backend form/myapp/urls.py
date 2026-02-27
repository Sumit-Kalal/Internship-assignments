from django.urls import path
from . import views

urlpatterns = [
    path("", views.add_student, name="add_students"),
    path("add_students", views.add_student, name="add_students"),
    path("list_students", views.list_students, name="list_students"),
]
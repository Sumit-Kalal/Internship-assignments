from django.urls import path
from .views import register_view, login_view, home_view, user_list_view

urlpatterns = [
    path("register/", register_view, name="Registration_form"),
    path("login/", login_view, name="login_form"),
    path("home/", home_view, name="home"),
    path("users/", user_list_view, name="user_list"),
    path("", register_view, name="Registration_form"),
]
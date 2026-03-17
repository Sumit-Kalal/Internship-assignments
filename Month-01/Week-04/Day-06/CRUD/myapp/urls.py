from django.contrib import admin
from django.urls import path
from myapp import views
urlpatterns = [
path('', views.home, name='home'),
path('add/', views.add_record, name='add'),
path('view/', views.list_records, name='view_entries'),
path('edit/<int:id>/', views.edit_record, name='edit'),
]
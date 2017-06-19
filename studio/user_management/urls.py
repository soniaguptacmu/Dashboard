from django.conf.urls import url

from user_management import views

urlpatterns = [
  url(r'^login', views.login, name='login'),
  url(r'^logout', views.logout, name='logout'),
]


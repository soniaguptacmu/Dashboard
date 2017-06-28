from django.conf.urls import include, url
from nalanda import views

urlpatterns = [
	url(r'^login', views.login_view, name='login'),
	url(r'^logout', views.logout_view, name='logout'),
	url(r'^register', views.register_view, name='register'),
	url(r'^api/user/approve', views.admin_approve_pending_users_view, name='admin_approve_pending_users'),
	url(r'^api/user/disapprove', views.admin_disapprove_pending_users_view, name='admin_disapprove_pending_users'),
	url(r'^api/user/unblock', views.admin_unblock_users_view, name='admin_unblock_users'),
]

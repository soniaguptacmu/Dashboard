from django.conf.urls import include, url
import nalanda.views

urlpatterns = [
	 url(r'^$', nalanda.views.index, name = 'index'), # just an emample
]

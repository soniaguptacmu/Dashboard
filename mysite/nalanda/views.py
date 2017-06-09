from django.shortcuts import render

# Create your views here.
def index(request):
	context = {"num":1}
	return render(request,"nalanda/index.html",context)
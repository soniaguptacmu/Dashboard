from django.shortcuts import render, HttpResponse, redirect
from django.template import Context, loader
from django.core.exceptions import ObjectDoesNotExist
from user_management.models import Users
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from time import gmtime, strftime




myapp = "user_management"
baseURL = "http://127.0.0.1:8000/user_management/"


def construct_response(code, title, message, data):
    response_object = {}
    response_object["code"] = code
    response_object["info"] = {'title': title,'message': message}
    response_object['data'] = data
    return response_object            

# Create your views here.
@csrf_exempt
def login(request):
    username = "";
    if request.method == 'GET':

        #template = loader.get_template(myapp + '/login.html')
        #return HttpResponse(template.render(data, request))  
        #return HttpResponse(template.render()) 
        return HttpResponse("no") 
        	
    elif request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()

        if username and password:
            try:
            	result = Users.objects.filter(username=username).get(password=password)
            except ObjectDoesNotExist:
                code = 201
                title = 'The username/password combination used was not found on the system'
                message = 'The username/password combination is incorrect'
                data = {'username': username} 
                response_object = construct_response(code, title, message, data)
                try:
                    user = Users.objects.get(username=username)
                    except ObjectDoesNotExist:
                        print("Username not exist");
                    user.number_of_failed_attempts += 1
                    if user.number_of_failed_attempts >= 4:
                        user.is_active = False;
                    user.save()
                    return redirect(baseURL + 'login', response_object)
            result.last_login_time = strftime("%Y-%m-%d %H:%M:%S", gmtime())
            code = 0
            response_object = construct_response(code, '', '', {})
            response = redirect(baseURL, response_object)
            return response
        else:
            code = 101
            title = 'The username/password are required'
            message = 'The username/password are required'
            data = {'username': username}
            response_object = construct_response(code, title, message, data)
            return redirect(baseURL + 'login', response_object)




@csrf_exempt
def logout(request):
    if request.method == 'GET':
        response = redirect(baseURL)
        #response.delete_cookie('session_id')
        return response

@csrf_exempt
def register(request):
    if request.method == 'GET':
        #template = loader.get_template(myapp + '/register.html')
        #return HttpResponse(template.render(data, request))  
        #return HttpResponse(template.render()) 

    if request.method == 'POST':
        not_complete = False
        username_exists = False
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        first_name = request.POST.get('firstName', '').strip()
        last_name = request.POST.get('lastName', '').strip()
        email = request.POST.get('email', '').strip()
        role = request.POST.get('role', '').strip()

        # is this equal?
        institute_id = request.POST.get('instituteId', [])
        classes = request.POST.get('classes', [])


        if (not username) or (not password) or (not email) or (not role) or role == "0" or (not first_name) or (not last_name):
            not_complete = True
        
        elif role != "1" and institute_id.length == 0:
            not_complete = True
        
        elif role != "1" and role != "2" and classes.length == 0:
            not_complete = True
        

        if not not_complete:
            user = Users.objects.get(username=username)
            except ObjectDoesNotExist:
                        #print("Username not exist");
            username_exists = True

            #Code for username already exists
            
            

        number_of_failed_attempts = 0;
        create_date = strftime("%Y-%m-%d %H:%M:%S", gmtime())

        if not_complete:
            #registration info not complete
            code = 

            title = 'The registration info '
            message = 'The username/password are required'
            data = {'username': username} 
            response_object["autoComplete"] = {'username': username,'email': email, 'role': role, 'institute': institute_id, 'classes': classes}
        elif username_exists:
            code = 
            title = 'The username already exists'
            message = 'The username already exists'
            data = {'username': username}
            response_object = construct_response(code, title, message, data)
        else:
            #role in user table?
            new_user = Users(username=username, password=password, first_name=first_name, last_name=last_name, email = email, number_of_failed_attempts = number_of_failed_attempts, create_date=create_date)
            new_user.save()
            code = 0
            response_object = construct_response(code, '', '', {})
            response = redirect(baseURL, response_object)
            return response













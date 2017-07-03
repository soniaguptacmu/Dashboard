from django.shortcuts import render, HttpResponse, redirect, get_object_or_404
from django.template import Context, loader
from django.core.exceptions import ObjectDoesNotExist
from nalanda.models import Users,UserInfoSchool, UserInfoClass, UserRoleCollectionMapping
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.contrib.auth import logout
from django.utils import timezone
from django.db.utils import DatabaseError, Error, OperationalError
import simplejson as json
import codecs






myapp = "nalanda"
baseURL = "http://127.0.0.1:8000/nalanda/"


def construct_response(code, title, message, data):
    response_object = {}
    response_object["code"] = code
    response_object["info"] = {'title': title,'message': message}
    response_object['data'] = data
    return response_object            


def login_post(username, password):
    try:
        is_success = False
        code = 0
        title = ""
        message = ""
        data = {}
        if username and password:
            result = Users.objects.filter(username=username).filter(password=password)
            if not result:
                code = 1001
                title = 'The username/password combination used was not found on the system'
                message = 'The username/password combination is incorrect'
                data = {'username': username} 
                user = Users.objects.filter(username=username)
                if user:
                    user[0].number_of_failed_attempts += 1
                    if user[0].number_of_failed_attempts >= 4:
                        user[0].is_active = False
                    user[0].save()
            else:
                if result[0].number_of_failed_attempts >= 4:
                    print("failed attempts:", result[0].number_of_failed_attempts)
                    code = 1002
                    title = 'Sorry, you have been blocked'
                    message = 'The user has been blocked'
                    data = {'username': username} 
                else:
                    result[0].last_login_time = timezone.now()
                    result[0].save()
                    is_success = True
            
        else:
            code = 1003
            title = 'The username/password are required'
            message = 'The username/password are required'
            data = {'username': username}
        response_object = construct_response(code, title, message, data)
        return response_object, is_success
    except DatabaseError:
        code = 2001
        title = 'Sorry, error occurred in database operations'
        message = 'Sorry, error occurred in database operations'
        data = {} 
        is_success = False
        response_object = construct_response(code, title, message, data)
        return response_object, is_success
    except OperationalError:
        print("Operation Error")
    except Error:
        print("Error")
    except:
        print("Error occurred")
    

# Create your views here.
@csrf_exempt
def login_view(request):
    username = ""
    if request.method == 'GET':

        #template = loader.get_template(myapp + '/login.html')
        #return HttpResponse(template.render(data, request))  
        #return HttpResponse(template.render()) 
        return HttpResponse("X")
    elif request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()

        response_object, is_success = login_post(username, password)
        
        print(response_object)
        print(is_success)
        #if is_success:
            #response = redirect(baseURL, response_object)

        #else:
            #response = redirect(baseURL + 'login', response_object)
        return response_object


@csrf_exempt
def logout_view(request):
    if request.method == 'GET':
        logout(request)
        response = redirect(baseURL)
        #response.delete_cookie('session_id')
        return response

def get_school_and_classes():
    try:
        institutes = []
        school_info = {}
        school_id = ""
        school_name = ""
        school = UserInfoSchool.objects.all()
        if not school:
            print("No school exists")
        else:
            for i in range(0, len(school)):

                school_id = school[i].school_id
                school_name = school[i].school_name
                classes_array = []

                classes_in_school = UserInfoClass.objects.filter(parent=school_id)
                if not classes_in_school:
                    print("For school_id ", school_id, ", no classes exist")
                else:
                    for i in range(0, len(classes_in_school)):
                        current_class = {'name': classes_in_school[i].class_name, 'id': classes_in_school[i].class_id}
                        classes_array.append(current_class)
                school_info = {'name': school_name, 'id': school_id, 'classes': classes_array}
                institutes.append(school_info)
        return institutes
    except DatabaseError:
        code = 2001
        title = 'Sorry, error occurred in database operations'
        message = 'Sorry, error occurred in database operations'
        data = {} 
        is_success = False
        response_object = construct_response(code, title, message, data)
        return response_object, is_success
    except OperationalError:
        print("Operation Error")
    except Error:
       print("Error")
    except:
        print("Error occurred")

        

def register_post(username, password, first_name, last_name, email, role_id, institute_id, classes):
    
    try:
        not_complete = False
        username_exists = False
        is_success = False
        if (not username) or (not password) or (not email) or (not role_id) or role_id == "0" or (not first_name) or (not last_name):
            not_complete = True
        
        if role_id != "1" and (not institute_id):
            not_complete = True
        
        if role_id != "1" and role_id != "2" and (not classes):
            not_complete = True

        if not not_complete:
            user = Users.objects.filter(username=username)
            if user:
                username_exists = True

        if not_complete:
            code = 1004
            title = 'The registration info provided is not complete'
            message = 'The registration info provided is not complete'           

        elif username_exists:
            code = 1005
            title = 'The username already exists'
            message = 'The username already exists'
        
        role_id = int(role_id)  
        if not institute_id:
            institute_id = ""
        else:
            institute_id = int(institute_id)

        if not_complete or username_exists:
            autoComplete = {'username': username, 'firstName': first_name, 'lastName': last_name, 'email': email, 'role': role_id, 'instituteId': institute_id, 'classes': classes}
            institutes = get_school_and_classes()
            data = {'autoComplete': autoComplete, 'institutes': institutes}   
            is_success = False

        else:
            number_of_failed_attempts = 0
            create_date = timezone.now()
            new_user = Users(username=username, password=password, first_name=first_name, last_name=last_name, email=email, number_of_failed_attempts=number_of_failed_attempts, create_date=create_date, role_id=role_id)
            new_user.save()
            if role_id == '1':
                user_role_collection_mapping = UserRoleCollectionMapping(user_id=new_user)
                user_role_collection_mapping.save()
            elif role_id == '2':
                school = UserInfoSchool.objects.filter(school_id=int(institute_id))
                if not school:
                    print("institute_id", institute_id, " school not exists")
                else:
                    user_role_collection_mapping = UserRoleCollectionMapping(user_id=new_user, institute_id=school[0])
                    user_role_collection_mapping.save()
            elif role_id == "3":
                school = UserInfoSchool.objects.filter(school_id=int(institute_id))
                if not school:
                    print("institute_id", institute_id, " school not exists")
                else:
                    for i in range(0, len(classes)):
                        current_class = UserInfoClass.objects.filter(class_id=classes[i])
                        if not current_class:
                            print("class_id", classes[i], " class not exists")
                        else:
                            user_role_collection_mapping = UserRoleCollectionMapping(user_id=new_user, institute_id=school[0], class_id = current_class[0])
                            user_role_collection_mapping.save()         
            code = 0
            title = ''
            message = ''
            data = {}
            is_success = True
        response_object = construct_response(code, title, message, data)
        return response_object, is_success

    except DatabaseError:
        code = 2001
        title = 'Sorry, error occurred in database operations'
        message = 'Sorry, error occurred in database operations'
        data = {} 
        is_success = False
        response_object = construct_response(code, title, message, data)
        return response_object, is_success
    except OperationalError:
        print("Operation Error")
   
    except Error:
       print("Error")
    except:
        print("Error occurred")


@csrf_exempt
def register_view(request):
    if request.method == 'GET':
        #template = loader.get_template(myapp + '/register.html')
        #return HttpResponse(template.render(data, request))  
        #return HttpResponse(template.render()) 
        institutes = get_school_and_classes()
        data = {'institutes': institutes}   
        code = 0
        title = ''
        message = ''
        response_object = construct_response(code, title, message, data)
        print(response_object)

        return HttpResponse("No") 

    elif request.method == 'POST':
        username = request.POST.get('username', '').strip()
        password = request.POST.get('password', '').strip()
        first_name = request.POST.get('firstName', '').strip()
        last_name = request.POST.get('lastName', '').strip()
        email = request.POST.get('email', '').strip()
        role_id = request.POST.get('role', '').strip()
        institute_id = request.POST.get('instituteId', '').strip()
        classes = request.POST.get('classes', [])

        response_object, is_success = register_post(username, password, first_name, last_name, email, role_id, institute_id, classes)

        print(response_object)
        print(is_success)
        return response_object
       
        #if is_success:
            #response = redirect(baseURL, response_object)
        #else:
            #response = redirect(baseURL + 'register', response_object)
        #return response
 

def admin_approve_pending_users_post(users):
  
    #users = []
    #user1 = {"username": "larry","classes": [1,2]}
    #user2 = {"username": "vivek","classes":[]}
    #user3 = {"username": "peter","classes": []}
    #users.append(user1)
    #users.append(user2)
    #users.append(user3)

    #try:
        code = 0
        title = ''
        message = ''
        data = {}
        


        if len(users) == 0:
            print("No users to approve")
        else:
            for i in users:
                username = users[i]["username"]
                #print(users[i])
                result = Users.objects.filter(username=username)
                if not result:
                    #print("Username", username, "doesn't exist, cannot approve")
                    print("")
                else:
                    result[0].is_active = True
                    result[0].update_date = timezone.now()
                    result[0].save()
                    # If the user is a board memeber, no institute or class will be specified 
                    if result[0].role_id == 1 or result[0].role_id == 2:
                        mapping = UserRoleCollectionMapping.objects.filter(user_id=result[0])
                        if not mapping:
                            print("mapping with user ", result[0].user_id, "and class ", approve_class[0].class_id, "does not exist")
                        else:
                            mapping[0].is_approved = True
                            #######################################
                            #@TODO
                            mapping[0].approver_id = 1
                            mapping[0].save()
                    elif result[0].role_id == 3:
                        classes = users[i]["classes"]
                        for j in range(len(classes)):
                            approve_class = UserInfoClass.objects.filter(class_id = classes[j])
                            if not approve_class:
                                print("For user", username, ",classes_id ", classes[j], "does not exist, connot approve")
                            else:
                                mapping = UserRoleCollectionMapping.objects.filter(user_id=result[0]).filter(class_id=approve_class[0])
                                if not mapping:
                                    print("mapping with user ", result[0].user_id, "and class ", approve_class[0].class_id, "does not exist")
                                else:
                                    mapping[0].is_approved = True
                                    #######################################
                                    #@TODO
                                    mapping[0].approver_id = 1
                                    mapping[0].save()
        response_object = construct_response(code, title, message, data) 
       
        return response_object
'''
    except DatabaseError:
        code = 2001
        title = 'Sorry, error occurred in database operations'
        message = 'Sorry, error occurred in database operations'
        data = {} 
        is_success = False
        response_object = construct_response(code, title, message, data)
        return response_object
    except OperationalError:
        print("Operation Error")
    except Error:
       print("Error")
    except:
        print("Error occurred")
'''
   


@csrf_exempt
def admin_approve_pending_users_view(request):
    if request.method == 'POST':
        users_json_obj = json.loads(request.POST.get('users', []))
        
        #users_json_obj = get_object_or_404(request.users)
   
        response_object = admin_approve_pending_users_post(users_json_obj)

        print(response_object)
        return response_object
        #return HttpResponse("Yes")

def admin_disapprove_pending_users_post(users): 

    #users = []
    #user1 = {"username": "larry","classes": [1,2]}
    #user2 = {"username": "vivek","classes":[]}
    #user3 = {"username": "peter","classes": []}
    #users.append(user1)
    #users.append(user2)
    #users.append(user3)

    code = 0
    title = ''
    message = ''
    data = {}
    try:
        if not users:
            print("No users to approve")
        else:
            for i in range(len(users)):
                username = users[i]["username"]
                result = Users.objects.filter(username=username)
                if not result:
                    #print("Username", username, "doesn't exist, cannot disapprove")
                    print("")
                else:
                    result[0].update_date = timezone.now()
                    result[0].save()
                    # If the user is a board memeber, no institute or class will be specified 
                    if result[0].role_id == 1 or result[0].role_id == 2:
                        mapping = UserRoleCollectionMapping.objects.filter(user_id=result[0])
                        if not mapping:
                            print("mapping with user ", result[0].user_id, "and class ", approve_class[0].class_id, "does not exist")
                        else:
                            mapping[0].delete()
                            
                    elif result[0].role_id == 3:
                        classes = users[i]["classes"]
                        for j in range(len(classes)):
                            approve_class = UserInfoClass.objects.filter(class_id = classes[j])
                            if not approve_class:
                                print("For user", username, ",classes_id ", classes[j], "does not exist, connot approve")
                            else:
                                mapping = UserRoleCollectionMapping.objects.filter(user_id=result[0]).filter(class_id=approve_class[0])
                                if not mapping:
                                    print("mapping with user", result[0].user_id, "and class", approve_class[0].class_id, "does not exist")
                                else:
                                    mapping[0].delete()               
        response_object = construct_response(code, title, message, data) 
        return response_object
    except DatabaseError:
        code = 2001
        title = 'Sorry, error occurred in database operations'
        message = 'Sorry, error occurred in database operations'
        data = {} 
        is_success = False
        response_object = construct_response(code, title, message, data)
        return response_object, is_success
    except OperationalError:
        print("Operation Error")
    except Error:
       print("Error")
    except:
        print("Error occurred")

@csrf_exempt
def admin_disapprove_pending_users_view(request):
    if request.method == 'POST':

        users = request.POST.get('users', [])
        print(request.POST.get('users', []))
        response_object = admin_disapprove_pending_users_post(users)

        print(response_object)
        return HttpResponse("Yes")

def admin_unblock_users_post(usernames):
    usernames = ['larry', 'bob', 'vivek']
    code = 0
    title = ''
    message = ''
    data = {}
    try:
        if not usernames:
            print("No users to unblock")
        else:
            for i in range(len(usernames)):
                username = usernames[i]
                result = Users.objects.filter(username=username)
                if not result:
                    print("Username", username, "doesn't exist, cannot unblock")
                else:
                    result[0].is_active = True;
                    result[0].number_of_failed_attempts = 0;
                    result[0].update_date = timezone.now()
                    print(timezone.now())
                    result[0].save()
        response_object = construct_response(code, title, message, data) 
        return response_object
    except DatabaseError:
        code = 2001
        title = 'Sorry, error occurred in database operations'
        message = 'Sorry, error occurred in database operations'
        data = {} 
        is_success = False
        response_object = construct_response(code, title, message, data)
        return response_object, is_success
    except OperationalError:
        print("Operation Error")
    except Error:
       print("Error")
    except:
        print("Error occurred")



    

@csrf_exempt
def admin_unblock_users_view(request):
    if request.method == 'POST':
        usernames = request.POST.get('usernames', [])
        response_object = admin_unblock_users_post(usernames)

        print(response_object)
        return HttpResponse("Yes")














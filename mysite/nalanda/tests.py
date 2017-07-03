from django.test import TestCase, RequestFactory
from nalanda.models import Users,UserInfoSchool, UserInfoClass, UserRoleCollectionMapping
from nalanda import views
from unittest import TestCase

TestCase.maxDiff = None
class LoginTestCase(TestCase):
	def setUp(self):
		self.user = Users.objects.create(username="bob", password="123", first_name="Bob", last_name="Dylan", email="ge@gmail.com", number_of_failed_attempts = 0,create_date = '1000-01-01',role_id = 1)
		self.user = Users.objects.create(username="alice", password="123", first_name="Alice", last_name="Day", email="ge@gmail.com", number_of_failed_attempts = 0,create_date = '1000-01-01',role_id = 1)
		self.factory = RequestFactory()
	def test_login_with_correct_combination(self):
		request = self.factory.post('login', {'username':'alice', 'password':'123'}, format='json')
		response = views.login_view(request)
		self.assertEqual(response, {'code': 0, 'info': {'title': '', 'message': ''}, 'data': {}})
	def test_login_with_missing_username(self):
		request = self.factory.post('login', {'password':'123'}, format='json')
		response = views.login_view(request)
		self.assertEqual(response, {'code': 1003, 'info': {'title': 'The username/password are required', 'message': 'The username/password are required'}, 'data': {'username': ''}})
	def test_login_with_missing_password(self):
		request = self.factory.post('login', {'username':'bob'}, format='json')
		response = views.login_view(request)
		self.assertEqual(response, {'code': 1003, 'info': {'title': 'The username/password are required', 'message': 'The username/password are required'}, 'data': {'username': 'bob'}})
	def test_login_with_wrong_password(self):
		request = self.factory.post('login', {'username':'bob', 'password':'1234'}, format='json')
		response = views.login_view(request)
		self.assertEqual(response, {'code': 1001, 'info': {'title': 'The username/password combination used was not found on the system', 'message': 'The username/password combination is incorrect'}, 'data': {'username': 'bob'}})
	def test_login_blocked_user(self):
		request = self.factory.post('login', {'username':'bob', 'password':'1234'}, format='json')
		response = views.login_view(request)
		self.assertEqual(response, {'code': 1001, 'info': {'title': 'The username/password combination used was not found on the system', 'message': 'The username/password combination is incorrect'}, 'data': {'username': 'bob'}})
		request = self.factory.post('login', {'username':'bob', 'password':'1234'}, format='json')
		response = views.login_view(request)
		self.assertEqual(response, {'code': 1001, 'info': {'title': 'The username/password combination used was not found on the system', 'message': 'The username/password combination is incorrect'}, 'data': {'username': 'bob'}})
		request = self.factory.post('login', {'username':'bob', 'password':'1234'}, format='json')
		response = views.login_view(request)
		self.assertEqual(response, {'code': 1001, 'info': {'title': 'The username/password combination used was not found on the system', 'message': 'The username/password combination is incorrect'}, 'data': {'username': 'bob'}})
		request = self.factory.post('login', {'username':'bob', 'password':'1234'}, format='json')
		response = views.login_view(request)
		self.assertEqual(response, {'code': 1001, 'info': {'title': 'The username/password combination used was not found on the system', 'message': 'The username/password combination is incorrect'}, 'data': {'username': 'bob'}})
		request = self.factory.post('login', {'username':'bob', 'password':'123'}, format='json')
		response = views.login_view(request)
		self.assertEqual(response, {'code': 1002, 'info': {'title': 'Sorry, you have been blocked', 'message': 'The user has been blocked'}, 'data': {'username': 'bob'}})
	def test_login_with_non_exist_username(self):
		request = self.factory.post('login', {'username':'henry', 'password':'1234'}, format='json')
		response = views.login_view(request)
		self.assertEqual(response, {'code': 1001, 'info': {'title': 'The username/password combination used was not found on the system', 'message': 'The username/password combination is incorrect'}, 'data': {'username': 'henry'}})


class RegisterTestCase(TestCase):
	def setUp(self):
		#self.school = UserInfoSchool.objects.create(school_id = 1, school_name = "CMU", total_students = 0)
		#self.class1 = UserInfoClass.objects.create(class_id = 1, class_name = "class1", parent = self.school, total_students = 0)
		#self.class2 = UserInfoClass.objects.create(class_id = 2, class_name = "class2", parent = self.school, total_students = 0)
		self.factory = RequestFactory()
	def test_register_with_incomplete_info(self):
		
		request = self.factory.post('regist', {'username':'larry', 'password':'123', 'firstName': 'Larry', 'lastName': 'Lee', 'email': 'ge@gmail.com', 'role': 3, 'instituteId': 1}, format='json')
		response = views.register_view(request)
		self.assertEqual(response, {'code': 1004, 'info': {'title': 'The registration info provided is not complete', 'message': 'The registration info provided is not complete'}, 'data': {'autoComplete': {'username':'larry', 'firstName': 'Larry', 'lastName': 'Lee', 'email': 'ge@gmail.com', 'role': 3, 'instituteId': 1, 'classes': []}, 'institutes': [{'name': 'CMU', 'id': 1, 'classes': [{'name': 'class1', 'id': 1}, {'name': 'class2', 'id': 2}]}]}})
		request = self.factory.post('register', {'username':'larry', 'password':'123', 'lastName': 'Lee', 'email': 'ge@gmail.com', 'role': 3, 'instituteId': 1}, format='json')
		response = views.register_view(request)
		self.assertEqual(response, {'code': 1004, 'info': {'title': 'The registration info provided is not complete', 'message': 'The registration info provided is not complete'}, 'data': {'autoComplete': {'username':'larry', 'firstName': '', 'lastName': 'Lee', 'email': 'ge@gmail.com', 'role': 3, 'instituteId': 1, 'classes': []}, 'institutes': [{'name': 'CMU', 'id': 1, 'classes': [{'name': 'class1', 'id': 1}, {'name': 'class2', 'id': 2}]}]}})
		request = self.factory.post('register', {'username':'larry', 'password':'123', 'firstName': 'Larry', 'lastName': 'Lee', 'email': 'ge@gmail.com', 'role': 3, 'instituteId': 1}, format='json')
		response = views.register_view(request)
		self.assertEqual(response, {'code': 1004, 'info': {'title': 'The registration info provided is not complete', 'message': 'The registration info provided is not complete'}, 'data': {'autoComplete': {'username':'larry', 'firstName': 'Larry', 'lastName': 'Lee', 'email': 'ge@gmail.com', 'role': 3, 'instituteId': 1, 'classes': []}, 'institutes': [{'name': 'CMU', 'id': 1, 'classes': [{'name': 'class1', 'id': 1}, {'name': 'class2', 'id': 2}]}]}})
	def test_register_with_exists_username(self):
		self.school = UserInfoSchool.objects.create(school_id = 1, school_name = "CMU", total_students = 0)
		self.class1 = UserInfoClass.objects.create(class_id = 1, class_name = "class1", parent = self.school, total_students = 0)
		self.class2 = UserInfoClass.objects.create(class_id = 2, class_name = "class2", parent = self.school, total_students = 0)
		request = self.factory.post('register', {'username':'bob', 'password':'123', 'firstName': 'Larry', 'lastName': 'Lee', 'email': 'larry@gmail.com', 'role': 1}, format='json')
		response = views.register_view(request)
		self.assertEqual(response, {'code': 1005, 'info': {'title': 'The username already exists', 'message': 'The username already exists'}, 'data': {'autoComplete': {'username':'bob', 'firstName': 'Larry', 'lastName': 'Lee', 'email': 'larry@gmail.com', 'role': 1, 'instituteId': '', 'classes': []}, 'institutes': [{'name': 'CMU', 'id': 1, 'classes': [{'name': 'class1', 'id': 1}, {'name': 'class2', 'id': 2}]}]}})
	def test_board_member_register_successfully(self):
		request = self.factory.post('register', {'username':'vivek', 'password':'123', 'firstName': 'Vivek', 'lastName': 'Lee', 'email': 'vivek@gmail.com', 'role': 1}, format='json')
		response = views.register_view(request)
		self.assertEqual(response, {'code':0, 'info': {'title': '', 'message': ''}, 'data': {}})
	def test_teacher_register_successfully(self):
		request = self.factory.post('register', {'username':'larry', 'password':'123', 'firstName': 'Larry', 'lastName': 'Lee', 'email': 'larry@gmail.com', 'role': 3, 'instituteId': 1, 'classes': [1,2]}, format='json')
		response = views.register_view(request)
		self.assertEqual(response, {'code':0, 'info': {'title': '', 'message': ''}, 'data': {}})
	def test_school_leader_register_successfully(self):
		request = self.factory.post('register', {'username':'peter', 'password':'123', 'firstName': 'Peter', 'lastName': 'Lee', 'email': 'peter@gmail.com', 'role': 2, 'instituteId': 1}, format='json')
		response = views.register_view(request)
		self.assertEqual(response, {'code':0, 'info': {'title': '', 'message': ''}, 'data': {}})

class ApprovePendingUserTestCase(TestCase):
	def setUp(self):
		self.factory = RequestFactory()
	def test_approve_empty_set_of_users(self):
		request = self.factory.post('api/user/approve', {'users': []}, format = 'json')
		response = views.admin_approve_pending_users_view(request)
		self.assertEqual(response, {'code':0, 'info': {'title': '', 'message': ''}, 'data': {}})

	def test_approve_teacher(self):
		request = self.factory.post("api/user/approve", {"users": [{"username": "larry","classes": [1,2]}]})
		response = views.admin_approve_pending_users_view(request)
		self.assertEqual(response, {"code":0, "info": {"title": '', "message": ''}, "data": {}})

	def test_approve_set_of_users(self):
		request = self.factory.post('api/user/approve', {'users': [{"username": "vivek","classes": []},{"username": "peter","classes": []}]})
		response = views.admin_approve_pending_users_view(request)
		self.assertEqual(response, {'code':0, 'info': {'title': '', 'message': ''}, 'data': {}})













       




from __future__ import unicode_literals

from django.db import models

# Create your models here.


class Users(models.Model):
    user_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=60)
    last_name = models.CharField(max_length=60)
    username = models.CharField(max_length=60)
    password = models.CharField(max_length=60)
    email = models.CharField(max_length=60)
    is_active = models.BooleanField(default=False)
    number_of_failed_attempts = models.IntegerField()
    last_login_time = models.DateTimeField(null=True)
    create_date = models.DateTimeField()
    update_date = models.DateTimeField(null=True)
    role_id = models.IntegerField()


class Roles(models.Model):
    role_id = models.IntegerField(primary_key=True)
    role_name = models.CharField(max_length=60)


    
class UserInfoSchool(models.Model):
    school_id = models.BigIntegerField(primary_key=True)
    school_name = models.CharField(max_length=60)
    total_students = models.IntegerField()

class UserInfoClass(models.Model):
    class_id = models.BigIntegerField(primary_key=True)
    class_name = models.CharField(max_length=60)
    parent = models.ForeignKey(UserInfoSchool, on_delete=models.CASCADE)
    total_students = models.IntegerField()

class UserRoleCollectionMapping(models.Model):
    user_id = models.ForeignKey(Users, on_delete=models.CASCADE)
    institute_id = models.ForeignKey(UserInfoSchool, on_delete=models.CASCADE, null=True)
    class_id = models.ForeignKey(UserInfoClass, on_delete=models.CASCADE, null=True)
    is_approved = models.BooleanField(default=False)
    approver_id = models.IntegerField(null=True)



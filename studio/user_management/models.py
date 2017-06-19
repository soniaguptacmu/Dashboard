from django.db import models


# Create your models here.
class Users(models.Model):
    user_id = models.IntegerField(primary_key=True)
    first_name = models.CharField(max_length=60)
    last_name = models.CharField(max_length=60)
    username = models.CharField(max_length=60)
    password = models.CharField(max_length=60)
    email = models.CharField(max_length=60)
    is_approved = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    number_of_failed_attempts = models.IntegerField()
    facility_id = models.IntegerField()
    approver_id = models.IntegerField()
    last_login_time = models.DateField()
    create_date = models.DateField()
    update_date = models.DateField()

class Roles(models.Model):
    role_id = models.IntegerField(primary_key=True)
    role_name = models.CharField(max_length=60)

class UserRoleCollectionMapping(models.Model):
    user_id = models.ForeignKey(Users, on_delete=models.CASCADE)
    role_id = models.ForeignKey(Roles, on_delete=models.CASCADE)
    collection_id = models.IntegerField()
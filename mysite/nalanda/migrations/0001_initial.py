# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-06-27 13:23
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Roles',
            fields=[
                ('role_id', models.IntegerField(primary_key=True, serialize=False)),
                ('role_name', models.CharField(max_length=60)),
            ],
        ),
        migrations.CreateModel(
            name='UserInfoClass',
            fields=[
                ('class_id', models.BigIntegerField(primary_key=True, serialize=False)),
                ('class_name', models.CharField(max_length=60)),
                ('total_students', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='UserInfoSchool',
            fields=[
                ('school_id', models.BigIntegerField(primary_key=True, serialize=False)),
                ('school_name', models.CharField(max_length=60)),
                ('total_students', models.IntegerField()),
            ],
        ),
        migrations.CreateModel(
            name='UserRoleCollectionMapping',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('is_approved', models.BooleanField(default=False)),
                ('approver_id', models.IntegerField(null=True)),
                ('class_id', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='nalanda.UserInfoClass')),
                ('institute_id', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to='nalanda.UserInfoSchool')),
            ],
        ),
        migrations.CreateModel(
            name='Users',
            fields=[
                ('user_id', models.AutoField(primary_key=True, serialize=False)),
                ('first_name', models.CharField(max_length=60)),
                ('last_name', models.CharField(max_length=60)),
                ('username', models.CharField(max_length=60)),
                ('password', models.CharField(max_length=60)),
                ('email', models.CharField(max_length=60)),
                ('is_active', models.BooleanField(default=False)),
                ('number_of_failed_attempts', models.IntegerField()),
                ('last_login_time', models.DateTimeField(null=True)),
                ('create_date', models.DateTimeField()),
                ('update_date', models.DateTimeField(null=True)),
                ('role_id', models.IntegerField()),
            ],
        ),
        migrations.AddField(
            model_name='userrolecollectionmapping',
            name='user_id',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='nalanda.Users'),
        ),
        migrations.AddField(
            model_name='userinfoclass',
            name='parent',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='nalanda.UserInfoSchool'),
        ),
    ]

# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-07-11 02:16
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nalanda', '0006_auto_20170710_2214'),
    ]

    operations = [
        migrations.AlterField(
            model_name='masterylevelclass',
            name='attempt_questions',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='masterylevelclass',
            name='completed_questions',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='masterylevelclass',
            name='correct_questions',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='masterylevelclass',
            name='students_completed',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='masterylevelschool',
            name='attempt_questions',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='masterylevelschool',
            name='completed_questions',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='masterylevelschool',
            name='correct_questions',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='masterylevelschool',
            name='students_completed',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='masterylevelstudent',
            name='attempt_questions',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='masterylevelstudent',
            name='completed',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='masterylevelstudent',
            name='completed_questions',
            field=models.IntegerField(blank=True, default=0),
        ),
        migrations.AlterField(
            model_name='masterylevelstudent',
            name='correct_questions',
            field=models.IntegerField(blank=True, default=0),
        ),
    ]
# -*- coding: utf-8 -*-
# Generated by Django 1.11.2 on 2017-07-11 02:20
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('nalanda', '0008_auto_20170710_2219'),
    ]

    operations = [
        migrations.AlterField(
            model_name='masterylevelstudent',
            name='completed',
            field=models.NullBooleanField(default=False),
        ),
    ]
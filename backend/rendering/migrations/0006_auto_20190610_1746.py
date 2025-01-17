# Generated by Django 2.1.5 on 2019-06-11 00:46

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('rendering', '0005_project_is_shared'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='project',
            unique_together={('owner', 'name', 'is_shared')},
        ),
    ]

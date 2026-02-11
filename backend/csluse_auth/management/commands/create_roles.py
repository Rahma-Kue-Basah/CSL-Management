"""
Management command to create role groups.
Run with: python manage.py create_roles
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group
from csluse_auth.permissions import ALL_ROLES


class Command(BaseCommand):
    help = 'Create role groups (Guest, Student, Lecturer, Staff, Administrator, SuperAdministrator)'

    def handle(self, *args, **options):
        created_count = 0
        existing_count = 0
        
        for role in ALL_ROLES:
            group, created = Group.objects.get_or_create(name=role)
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created role group: {role}')
                )
                created_count += 1
            else:
                self.stdout.write(
                    self.style.WARNING(f'→ Role group already exists: {role}')
                )
                existing_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\nCompleted! Created {created_count} role(s), {existing_count} already existed.'
            )
        )

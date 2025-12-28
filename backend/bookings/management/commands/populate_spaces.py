from django.core.management.base import BaseCommand
from bookings.models import Space

class Command(BaseCommand):
    help = 'Populates the database with initial office spaces'

    def handle(self, *args, **options):
        self.stdout.write('Populating spaces...')
        
        # Clear existing spaces (optional, but good for reset)
        # Space.objects.all().delete() 
        # self.stdout.write('Deleted existing spaces.')

        spaces_to_create = []

        # 1. Dedicated Zone (D-1 to D-12)
        for i in range(1, 13):
            spaces_to_create.append(Space(
                name=f"D-{i}",
                type='dedicated_desk',
                capacity=1,
                hourly_rate=50.00,
                description=f"Dedicated Desk {i} in Quiet Zone"
            ))

        # 2. Cluster Tables (T1 to T6, 4 seats each)
        # Assuming each Seat is a bookable space.
        for t in range(1, 7): # T1 to T6
            for s in range(1, 5): # Seat 1 to 4
                spaces_to_create.append(Space(
                    name=f"T{t}-{s}",
                    type='hot_desk',
                    capacity=1,
                    hourly_rate=30.00,
                    description=f"Cluster Table {t}, Seat {s}"
                ))

        # 3. Collab Hub (12 seats)
        # CH-L-1 to 6, CH-R-1 to 6
        for side in ['L', 'R']:
            for s in range(1, 7):
                spaces_to_create.append(Space(
                    name=f"CH-{side}-{s}",
                    type='hot_desk',
                    capacity=1,
                    hourly_rate=40.00,
                    description=f"Collab Hub {side} Side, Seat {s}"
                ))

        # 4. Private Suites (Suite 1 to 4)
        for i in range(1, 5):
            spaces_to_create.append(Space(
                name=f"Private Suite {i}",
                type='private_office',
                capacity=2,
                hourly_rate=150.00,
                description=f"Private Suite {i} (2 Pax)"
            ))

        # 5. Large Private Suite
        spaces_to_create.append(Space(
            name="Large Private Suite",
            type='private_office',
            capacity=4,
            hourly_rate=250.00,
            description="Large Private Suite (+20% Area)"
        ))

        # 6. Boardroom
        spaces_to_create.append(Space(
            name="Boardroom",
            type='meeting_room',
            capacity=10,
            hourly_rate=500.00,
            description="Main Boardroom with Conference Table"
        ))

        # Bulk create if they don't exist
        created_count = 0
        updated_count = 0
        for space in spaces_to_create:
            obj, created = Space.objects.update_or_create(
                name=space.name,
                defaults={
                    'type': space.type,
                    'capacity': space.capacity,
                    'hourly_rate': space.hourly_rate,
                    'description': space.description
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} spaces, updated {updated_count} spaces.'))

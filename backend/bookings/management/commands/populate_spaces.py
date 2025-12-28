from django.core.management.base import BaseCommand
from bookings.models import Space

class Command(BaseCommand):
    help = 'Populates the database with the specific office layout'

    def handle(self, *args, **kwargs):
        self.stdout.write("Deleting existing spaces...")
        Space.objects.all().delete()

        spaces_data = []

        # 1. Dedicated Seats (12 units) - Top Area
        # Rate assumption: 50,000/hr
        for i in range(1, 13):
            spaces_data.append(Space(
                name=f"Dedicated Desk #{i}",
                type='dedicated_desk',
                capacity=1,
                hourly_rate=50000,
                description=f"Located in Top Area. Dedicated workstation {i}.",
                is_active=True
            ))

        # 2. Joint Table (1 unit, 16 seats) - Middle Area
        # Rate assumption: 25,000/hr (Hot desk rate)
        spaces_data.append(Space(
            name="The Long Joint Table",
            type='hot_desk',
            capacity=16,
            hourly_rate=25000,
            description="Located in Middle Area. Shared community table.",
            is_active=True
        ))

        # 3. Surrounding Tables (6 units, 4 seats each) - Around Middle
        for i in range(1, 7):
            spaces_data.append(Space(
                name=f"Team Table #{i}",
                type='hot_desk',
                capacity=4,
                hourly_rate=30000, # Slightly more for a smaller cluster?
                description="Located around the middle area. Good for small groups.",
                is_active=True
            ))

        # 4. Private Rooms (4 units) - Left Area (Behind Sliding Door)
        # Rate assumption: 100,000/hr
        for i in range(1, 5):
            spaces_data.append(Space(
                name=f"Private Office #{i}",
                type='private_office',
                capacity=1,
                hourly_rate=100000,
                description="Located in Left Area, behind sliding door.",
                is_active=True
            ))

        # 5. Meeting Room (1 unit) - Right Area
        # Rate assumption: 200,000/hr
        spaces_data.append(Space(
            name="Grand Meeting Room",
            type='meeting_room',
            capacity=13, # 10 table + 3 sofa
            hourly_rate=200000,
            description="Located in Right Area. Includes 10-person table and 3-person sofa area.",
            is_active=True
        ))

        # 6. Additional Room (1 unit) - South of Meeting Room
        spaces_data.append(Space(
            name="Executive Office (South)",
            type='private_office',
            capacity=1,
            hourly_rate=120000,
            description="Located south of the meeting room.",
            is_active=True
        ))

        Space.objects.bulk_create(spaces_data)
        self.stdout.write(self.style.SUCCESS(f"Successfully created {len(spaces_data)} spaces."))
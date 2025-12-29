from django.core.management.base import BaseCommand
from bookings.models import Space, Seat

class Command(BaseCommand):
    help = 'Populates the database with the specific office layout using Seat model'

    def handle(self, *args, **kwargs):
        self.stdout.write("Deleting existing spaces and seats...")
        Seat.objects.all().delete()
        Space.objects.all().delete()

        # 1. Main Floor (Hot Desks & Dedicated)
        main_floor = Space.objects.create(
            name="Main Coworking Floor",
            type='hot_desk',
            capacity=100,
            hourly_rate=50000,
            daily_rate=400000,
            description="Open area with dedicated desks and hot desks.",
            allow_hourly=True
        )

        seats = []

        # Dedicated Zone (D-1 to D-12)
        for i in range(1, 13):
            seats.append(Seat(
                space=main_floor,
                visual_id=f"D-{i}",
                name=f"Dedicated Desk {i}",
                hourly_rate=60000 # Premium for dedicated
            ))

        # Cluster Tables (T1 to T6, 4 seats each)
        for t in range(1, 7):
            for s in range(1, 5):
                seats.append(Seat(
                    space=main_floor,
                    visual_id=f"T{t}-{s}",
                    name=f"Table {t} Seat {s}"
                ))

        # Collab Hub (CH-L-1..6, CH-R-1..6)
        for i in range(1, 7):
            seats.append(Seat(
                space=main_floor,
                visual_id=f"CH-L-{i}",
                name=f"Collab Hub Left {i}"
            ))
            seats.append(Seat(
                space=main_floor,
                visual_id=f"CH-R-{i}",
                name=f"Collab Hub Right {i}"
            ))

        # 2. Private Rooms (PR-1 to PR-4)
        # Each has 2 seats A/B?
        for i in range(1, 5):
            pr_space = Space.objects.create(
                name=f"Private Suite {i}",
                type='private_office',
                capacity=2,
                hourly_rate=150000,
                description=f"Private office suite #{i}",
                allow_hourly=True
            )
            seats.append(Seat(space=pr_space, visual_id=f"PR-{i}-A", name=f"Suite {i} Seat A"))
            seats.append(Seat(space=pr_space, visual_id=f"PR-{i}-B", name=f"Suite {i} Seat B"))

        # 3. Large Suite (LPR)
        lpr_space = Space.objects.create(
            name="Large Suite",
            type='meeting_room',
            capacity=3,
            hourly_rate=200000,
            description="Large executive suite",
            allow_hourly=True
        )
        seats.append(Seat(space=lpr_space, visual_id="LPR-1", name="Large Suite Seat 1"))
        seats.append(Seat(space=lpr_space, visual_id="LPR-2", name="Large Suite Seat 2"))
        seats.append(Seat(space=lpr_space, visual_id="LPR-3", name="Large Suite Seat 3"))

        Seat.objects.bulk_create(seats)
        self.stdout.write(self.style.SUCCESS(f"Successfully created {Space.objects.count()} spaces and {len(seats)} seats."))

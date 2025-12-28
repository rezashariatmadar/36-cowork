import re
from django.core.exceptions import ValidationError

def validate_national_id(value: str) -> None:
    """
    Validates an Iranian National ID (Code Melli).
    Rules:
    - Must be exactly 10 digits.
    - Uses a checksum algorithm (Luhn-like).
    - Cannot be all same digits (e.g. 1111111111).
    """
    if not re.match(r'^\d{10}$', value):
        raise ValidationError(
            "National ID must be exactly 10 digits.",
            code='invalid_national_id'
        )

    # Check for repetitive patterns
    if len(set(value)) == 1:
         raise ValidationError(
            "Invalid National ID (repetitive digits).",
            code='invalid_national_id_repetitive'
        )

    # Checksum Algorithm
    # Formula:
    # 1. Multiply each of the first 9 digits by (10 - index)
    # 2. Sum these products
    # 3. Calculate remainder of sum divided by 11
    # 4. If remainder < 2, check digit (10th digit) must equal remainder
    # 5. If remainder >= 2, check digit must equal (11 - remainder)
    
    check = int(value[9])
    s = sum(int(value[x]) * (10 - x) for x in range(9))
    remainder = s % 11
    
    valid = False
    if remainder < 2:
        valid = (check == remainder)
    else:
        valid = (check == (11 - remainder))
        
    if not valid:
        raise ValidationError(
            "Invalid National ID checksum.",
            code='invalid_national_id_checksum'
        )


def validate_mobile_number(value: str) -> None:
    """
    Validates an Iranian mobile number.
    Rules:
    - Must start with '09'.
    - Must be exactly 11 digits.
    """
    if not re.match(r'^09\d{9}$', value):
        raise ValidationError(
            "Mobile number must start with '09' and contain exactly 11 digits.",
            code='invalid_mobile'
        )

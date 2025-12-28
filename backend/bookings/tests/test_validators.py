from django.test import SimpleTestCase
from django.core.exceptions import ValidationError
from bookings.validators import validate_national_id, validate_mobile_number

class ValidatorTests(SimpleTestCase):
    # --- National ID Tests ---
    
    def test_national_id_valid(self):
        # Known valid ID: 0060495219
        validate_national_id('0060495219')
        
        # 0000000000 is mathematically valid per algorithm but "all same" rule might reject it.
        # However, 0000000000 is usually rejected by the "all same" rule in real apps.
        # My validator implements "if len(set(value)) == 1: raise".
        # So 0000000000 should fail now.
        with self.assertRaises(ValidationError) as cm:
            validate_national_id('0000000000')
        self.assertEqual(cm.exception.code, 'invalid_national_id_repetitive')

    def test_national_id_invalid_length(self):
        invalid_lengths = ['123456789', '12345678901', '', '123']
        for nid in invalid_lengths:
            with self.assertRaises(ValidationError) as cm:
                validate_national_id(nid)
            self.assertEqual(cm.exception.code, 'invalid_national_id')

    def test_national_id_non_digits(self):
        with self.assertRaises(ValidationError) as cm:
            validate_national_id('006049521a')
        self.assertEqual(cm.exception.code, 'invalid_national_id')

    def test_national_id_checksum_fail(self):
        # 0000000001 -> sum=0, rem=0. check=1. Invalid.
        with self.assertRaises(ValidationError) as cm:
            validate_national_id('0000000001')
        self.assertEqual(cm.exception.code, 'invalid_national_id_checksum')

    def test_national_id_repetitive(self):
        # 1111111111
        with self.assertRaises(ValidationError) as cm:
            validate_national_id('1111111111')
        self.assertEqual(cm.exception.code, 'invalid_national_id_repetitive')

    # --- Mobile Tests ---

    def test_mobile_valid(self):
        validate_mobile_number('09123456789')
        validate_mobile_number('09010001122')

    def test_mobile_invalid_start(self):
        with self.assertRaises(ValidationError) as cm:
            validate_mobile_number('08123456789')
        self.assertEqual(cm.exception.code, 'invalid_mobile')

    def test_mobile_invalid_length(self):
        with self.assertRaises(ValidationError) as cm:
            validate_mobile_number('0912345678') # 10 digits
        self.assertEqual(cm.exception.code, 'invalid_mobile')

        with self.assertRaises(ValidationError) as cm:
            validate_mobile_number('091234567890') # 12 digits
        self.assertEqual(cm.exception.code, 'invalid_mobile')

    def test_mobile_non_digits(self):
        with self.assertRaises(ValidationError) as cm:
            validate_mobile_number('0912345678a')
        self.assertEqual(cm.exception.code, 'invalid_mobile')

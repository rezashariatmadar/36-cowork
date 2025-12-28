import { z } from 'zod';

// National ID validation (simplified regex for client-side, strict checksum on backend)
const nationalIdRegex = /^\d{10}$/;
const mobileRegex = /^09\d{9}$/;

export const bookingSchema = z.object({
  full_name: z.string().min(3, "Full name is required"),
  national_id: z.string().regex(nationalIdRegex, "National ID must be 10 digits"),
  mobile: z.string().regex(mobileRegex, "Mobile must be 11 digits and start with 09"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other']).optional(),
  space: z.string().min(1, "Please select a space"),
  booking_date_jalali: z.string().min(1, "Date is required"), 
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  terms_accepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions" }),
  }),
  privacy_accepted: z.literal(true, {
    errorMap: () => ({ message: "You must accept the privacy policy" }),
  }),
});

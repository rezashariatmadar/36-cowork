import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-multi-date-picker';
import jalali from 'react-date-object/calendars/jalali';
import persian_fa from 'react-date-object/locales/persian_fa';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingSchema } from '../../utils/validation';
import { createBooking } from '../../services/api';

// Components
import BookingStepper from './BookingStepper';
import OfficeLayout from '../OfficeLayout';
import FormField from './FormField';
import SpaceSelector from './SpaceSelector';
import TimeSlotSelector from './TimeSlotSelector';
import AgreementCheckbox from './AgreementCheckbox';

const BookingForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSeat, setSelectedSeat] = useState(null);

  // We split validation triggers per step manually if needed, 
  // or just let user navigate but validate final submission.
  // Ideally, we validate step 1 before moving to step 2.
  
  const {
    register,
    handleSubmit,
    control,
    watch,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      booking_date_jalali: '',
      terms_accepted: false,
      privacy_accepted: false,
    }
  });

  const selectedSpace = watch('space');
  const selectedDate = watch('booking_date_jalali');
  const startTime = watch('start_time');
  const endTime = watch('end_time');

  const handleNextStep = async () => {
    let valid = false;
    if (currentStep === 1) {
      // Validate Step 1 fields
      valid = await trigger(['space', 'booking_date_jalali', 'start_time', 'end_time']);
    } else if (currentStep === 2) {
      // Validate Step 2 (Seat Selection)
      if (selectedSeat) {
          valid = true;
          // In a real app we might store seat ID in a hidden form field
          // For now we just track it in state and merge it on submit if backend supported distinct seats
          // The current backend Booking model doesn't strictly have a "seat_id" field, only "Space".
          // We assume "Space" == "Room" or generic Area. 
          // If we want specific seat booking, backend needs update. 
          // For this UI demo, we'll proceed as if Space ID covers it or we map it.
          // Let's assume the "Space" dropdown selects the ROOM/ZONE, and OfficeLayout picks the SEAT.
          // We will persist seat selection but backend might ignore it until we add `seat_number` field.
      } else {
          toast.error("Please select a seat.");
      }
    }
    
    if (valid) {
        setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const onSubmit = async (data) => {
    try {
        const payload = {
            ...data,
            booking_date_jalali: data.booking_date_jalali.replace(/\//g, '-'),
            duration_hours: calculateDuration(data.start_time, data.end_time),
            // seat_number: selectedSeat // Add this if backend supports it
        };
        
        const booking = await createBooking(payload);
        navigate('/success', { state: { booking } });

    } catch (error) {
        console.error("Booking failed", error);
        if (error.response && error.response.data) {
            const apiErrors = error.response.data;
            if (apiErrors.non_field_errors) {
                toast.error(apiErrors.non_field_errors[0]);
            } else {
                 toast.error("Booking failed. Please check the form.");
            }
        } else {
            navigate('/error');
        }
    }
  };
  
  const calculateDuration = (start, end) => {
      if(!start || !end) return 0;
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      return (eh + em/60) - (sh + sm/60);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-xl rounded-2xl border border-gray-100" dir="rtl">
      
      <BookingStepper currentStep={currentStep} />

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
        <AnimatePresence mode="wait">
            
            {/* STEP 1: Date & Time */}
            {currentStep === 1 && (
                <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 max-w-xl mx-auto"
                >
                    <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">Select Date & Time</h3>
                    
                    <SpaceSelector register={register} error={errors.space} />

                    <FormField label="Date" error={errors.booking_date_jalali}>
                    <Controller
                        control={control}
                        name="booking_date_jalali"
                        render={({ field }) => (
                        <DatePicker
                            calendar={jalali}
                            locale={persian_fa}
                            calendarPosition="bottom-right"
                            value={field.value}
                            onChange={(date) => {
                                field.onChange(date ? date.format("YYYY-MM-DD") : "");
                            }}
                            inputClass="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                            id="booking_date_jalali"
                        />
                        )}
                    />
                    </FormField>

                    <TimeSlotSelector 
                        spaceId={selectedSpace} 
                        date={selectedDate} 
                        register={register} 
                        errors={errors} 
                    />
                </motion.div>
            )}

            {/* STEP 2: Seat Selection */}
            {currentStep === 2 && (
                <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                >
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-xl font-semibold text-gray-800">Select Your Seat</h3>
                        <div className="text-sm text-gray-500">
                            {selectedDate} | {startTime} - {endTime}
                        </div>
                    </div>

                    <OfficeLayout 
                        onSeatSelect={setSelectedSeat} 
                        selectedSeat={selectedSeat}
                        // In real app, pass bookedSeats prop here based on availability
                    />

                    {selectedSeat && (
                        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white p-4 rounded-xl shadow-2xl border border-indigo-100 flex items-center gap-6 animate-slide-up w-11/12 max-w-md">
                            <div className="flex-1">
                                <span className="block text-xs text-gray-400 uppercase tracking-wider">Selected Seat</span>
                                <span className="text-xl font-bold text-indigo-600">{selectedSeat}</span>
                            </div>
                            <button 
                                type="button"
                                onClick={() => setSelectedSeat(null)}
                                className="text-sm text-gray-500 hover:text-red-500 underline"
                            >
                                Change
                            </button>
                        </div>
                    )}
                </motion.div>
            )}

            {/* STEP 3: Confirm */}
            {currentStep === 3 && (
                <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6 max-w-xl mx-auto"
                >
                    <h3 className="text-xl font-semibold text-gray-800 text-center mb-6">Confirm Details</h3>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-sm space-y-2 mb-6">
                        <div className="flex justify-between"><span className="text-gray-500">Space:</span> <span className="font-medium">Space ID {selectedSpace}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Seat:</span> <span className="font-medium text-indigo-600">{selectedSeat}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Date:</span> <span className="font-medium">{selectedDate}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Time:</span> <span className="font-medium">{startTime} - {endTime}</span></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Full Name" error={errors.full_name} htmlFor="full_name">
                        <input id="full_name" type="text" {...register('full_name')} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                        </FormField>
                        
                        <FormField label="National ID" error={errors.national_id} htmlFor="national_id">
                        <input id="national_id" type="text" {...register('national_id')} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                        </FormField>
                        
                        <FormField label="Mobile" error={errors.mobile} htmlFor="mobile">
                        <input id="mobile" type="text" {...register('mobile')} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                        </FormField>
                        
                        <FormField label="Email (Optional)" error={errors.email} htmlFor="email">
                        <input id="email" type="email" {...register('email')} className="block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                        </FormField>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <AgreementCheckbox label="I accept the terms and conditions" register={register} name="terms_accepted" error={errors.terms_accepted} />
                        <AgreementCheckbox label="I accept the privacy policy" register={register} name="privacy_accepted" error={errors.privacy_accepted} />
                    </div>
                </motion.div>
            )}

        </AnimatePresence>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
            {currentStep > 1 ? (
                <button
                    type="button"
                    onClick={handlePrevStep}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                    Back
                </button>
            ) : (
                <div></div> // Spacer
            )}

            {currentStep < 3 ? (
                <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-md hover:shadow-lg transition-all"
                >
                    Next Step
                </button>
            ) : (
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="px-8 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium shadow-md hover:shadow-lg transition-all disabled:bg-gray-400"
                >
                    {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                </button>
            )}
        </div>

      </form>
    </div>
  );
};

export default BookingForm;
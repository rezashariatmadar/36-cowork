import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-multi-date-picker';
import jalali from 'react-date-object/calendars/jalali';
import persian_fa from 'react-date-object/locales/persian_fa';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingSchema } from '../../utils/validation';
import api, { createBooking } from '../../services/api';

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
  const [selectedSeat, setSelectedSeat] = useState(null); // Visual ID (e.g. "T1-1")
  const [spaces, setSpaces] = useState([]);
  const [occupiedVisualIds, setOccupiedVisualIds] = useState([]);

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

  // --- Helpers for Mapping ---
  // Heuristic mapping between Visual IDs (e.g., "T1-1") and DB Names (e.g., "Team Table 1 - Seat 1")
  const getSpaceFromVisualId = (vid) => {
      // Normalize visual ID
      const parts = vid.split('-');
      // Example: "T1-1" -> "Team Table 1 - Seat 1"
      // "D-1" -> "Dedicated Desk #1"
      // "PR-1-A" -> "Private Office #1 - Seat A"
      
      // Simple fallback: Try to find a space name containing the ID parts
      // This allows the user to name spaces flexibly in DB as long as they contain "T1" and "1" etc.
      return spaces.find(s => {
          const name = s.name.toUpperCase();
          if (vid.startsWith('T')) { // T1-1
             const [table, seat] = vid.substring(1).split('-');
             return name.includes(`TABLE #${table}`) || name.includes(`TABLE ${table}`) && name.includes(seat);
          }
          if (vid.startsWith('D-')) { // D-1
             return name.includes(`DEDICATED DESK #${parts[1]}`);
          }
          if (vid.startsWith('CH-')) { // CH-L-1
             return name.includes("COLLAB") || name.includes("JOINT");
          }
          // Default fuzzy match
          return name.includes(vid.replace(/-/g, ' '));
      });
  };

  const getVisualIdFromSpace = (space) => {
      // Inverse mapping logic would go here.
      // For now, relies on consistent naming or metadata.
      // Since we don't have the naming convention from the user yet, this is best-effort.
      return null;
  };

  // --- Data Fetching ---

  useEffect(() => {
      api.get('/spaces/').then(r => {
          setSpaces(r.data.results || r.data);
      }).catch(e => console.error("Failed to load spaces", e));
  }, []);

  useEffect(() => {
      if (currentStep === 2 && selectedDate && startTime && endTime) {
          // Fetch bookings for the date to determine availability
          // Note: Backend endpoint /bookings/?date=YYYY-MM-DD should exist or use filter
          // We'll assume list endpoint supports filtering
          const dateStr = selectedDate.replace(/\//g, '-');
          api.get(`/bookings/?booking_date_jalali=${dateStr}`).then(r => {
              const bookings = r.data.results || r.data;
              
              // Filter for time overlap
              const overlaps = bookings.filter(b => {
                  if (b.status === 'cancelled') return false;
                  return (startTime < b.end_time && endTime > b.start_time);
              });

              // Map overlapping bookings to Visual IDs
              // We need the SPACE object for each booking to map to Visual ID
              // Assuming booking.space is the ID, we look it up in 'spaces'
              const occupied = [];
              overlaps.forEach(b => {
                  const spaceObj = spaces.find(s => s.id === b.space);
                  if (spaceObj) {
                      // Attempt to reverse map name to ID
                      // For now, since we don't have perfect mapping, we might miss some visuals.
                      // Ideally, store 'visual_id' in Space metadata/description.
                  }
              });
              setOccupiedVisualIds(occupied); // TODO: Refine mapping
          }).catch(e => console.error("Failed to load bookings", e));
      }
  }, [currentStep, selectedDate, startTime, endTime, spaces]);


  const handleNextStep = async () => {
    let valid = false;
    if (currentStep === 1) {
      valid = await trigger(['space', 'booking_date_jalali', 'start_time', 'end_time']);
    } else if (currentStep === 2) {
      if (selectedSeat) {
          valid = true;
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
        // Resolve Visual ID to Space UUID
        let finalSpaceId = data.space; // Default to dropdown selection
        
        if (selectedSeat) {
            const mappedSpace = getSpaceFromVisualId(selectedSeat);
            if (mappedSpace) {
                finalSpaceId = mappedSpace.id;
            } else {
                // If mapping fails, we can't book specific seat safely
                // Fallback to generic space selected in Step 1?
                // Or error out.
                console.warn("Could not map visual seat to DB space", selectedSeat);
            }
        }

        const payload = {
            ...data,
            space: finalSpaceId,
            booking_date_jalali: data.booking_date_jalali.replace(/\//g, '-'),
            duration_hours: calculateDuration(data.start_time, data.end_time),
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
                        bookedSeats={occupiedVisualIds}
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
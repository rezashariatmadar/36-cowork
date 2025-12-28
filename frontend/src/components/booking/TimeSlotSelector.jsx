import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import FormField from './FormField';
import { getAvailability } from '../../services/api';

const TimeSlotSelector = ({ spaceId, date, register, errors }) => {
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (spaceId && date) {
      const fetchAvailability = async () => {
        setLoading(true);
        try {
            const formattedDate = date.replace(/\//g, '-');
            const slots = await getAvailability(spaceId, formattedDate);
            setAvailableSlots(slots);
        } catch (error) {
            console.error("Failed to load availability", error);
            toast.error("Failed to check availability.");
            setAvailableSlots([]);
        } finally {
            setLoading(false);
        }
      };
      fetchAvailability();
    } else {
        setAvailableSlots([]);
    }
  }, [spaceId, date]);

  if (!spaceId || !date) return null;

  return (
    <div className="border p-4 rounded-md bg-gray-50 mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Availability</h3>
        
        {loading ? (
             <p className="text-sm text-gray-500">Loading availability...</p>
        ) : availableSlots.length > 0 ? (
             <div className="space-y-4">
                <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    <strong>Open times:</strong> {availableSlots.map(s => `${s.start_time.slice(0,5)} - ${s.end_time.slice(0,5)}`).join(', ')}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <FormField label="Start Time (HH:MM)" error={errors.start_time} htmlFor="start_time">
                         <input 
                            id="start_time"
                            type="time" 
                            {...register('start_time')}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                         />
                    </FormField>
                    <FormField label="End Time (HH:MM)" error={errors.end_time} htmlFor="end_time">
                         <input 
                            id="end_time"
                            type="time" 
                            {...register('end_time')}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border"
                         />
                    </FormField>
                </div>
             </div>
        ) : (
             <p className="text-red-500 text-sm">No availability for this date.</p>
        )}
    </div>
  );
};

export default TimeSlotSelector;
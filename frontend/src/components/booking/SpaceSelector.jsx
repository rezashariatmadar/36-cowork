import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import FormField from './FormField';
import { getSpaces } from '../../services/api';

const SpaceSelector = ({ register, error }) => {
  const [spaces, setSpaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpaces = async () => {
      try {
        const data = await getSpaces();
        setSpaces(data);
      } catch (error) {
        console.error("Failed to load spaces", error);
        toast.error("Failed to load spaces.");
      } finally {
        setLoading(false);
      }
    };
    fetchSpaces();
  }, []);

  return (
    <FormField label="Select Space" error={error} htmlFor="space">
      <select 
        id="space"
        {...register('space')} 
        disabled={loading}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border disabled:bg-gray-100"
      >
        <option value="">{loading ? 'Loading spaces...' : 'Choose a space...'}</option>
        {spaces.map(space => (
          <option key={space.id} value={space.id}>
            {space.name} ({space.type}) - ${space.hourly_rate}/hr
          </option>
        ))}
      </select>
    </FormField>
  );
};

export default SpaceSelector;
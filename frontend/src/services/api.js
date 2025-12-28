import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getSpaces = async () => {
  const response = await api.get('/spaces/');
  return response.data;
};

export const getAvailability = async (spaceId, date) => {
  // date should be in YYYY-MM-DD Jalali format
  const response = await api.get('/availability/', {
    params: { space_id: spaceId, date },
  });
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings/', bookingData);
  return response.data;
};

export default api;

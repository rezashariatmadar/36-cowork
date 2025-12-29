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

export const getSeats = async (date) => {
  // date: YYYY-MM-DD (Jalali)
  const params = {};
  if (date) params.date = date;
  
  const response = await api.get('/seats/', { params });
  return response.data;
};

export const createBooking = async (bookingData) => {
  const response = await api.post('/bookings/', bookingData);
  return response.data;
};

export default api;
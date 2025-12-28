import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const SuccessPage = () => {
  const location = useLocation();
  const booking = location.state?.booking;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-green-100">
        <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Booking Confirmed!</h2>
            <p className="mt-2 text-sm text-gray-600">
                Thank you for your reservation. A confirmation email has been sent to you.
            </p>
        </div>

        {booking && (
            <div className="mt-8 bg-gray-50 p-4 rounded-md text-right">
                <h3 className="text-lg font-medium text-gray-900 mb-2 border-b pb-2">Booking Details</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                    <dt className="text-gray-500">Booking ID:</dt>
                    <dd className="text-gray-900 font-semibold">{booking.id}</dd>
                    
                    <dt className="text-gray-500">Full Name:</dt>
                    <dd className="text-gray-900">{booking.full_name}</dd>
                    
                    <dt className="text-gray-500">Date:</dt>
                    <dd className="text-gray-900">{booking.booking_date_jalali}</dd>
                    
                    <dt className="text-gray-500">Time:</dt>
                    <dd className="text-gray-900">{booking.start_time} - {booking.end_time}</dd>
                </dl>
            </div>
        )}

        <div className="mt-6">
            <Link 
                to="/"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                Book Another Space
            </Link>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;

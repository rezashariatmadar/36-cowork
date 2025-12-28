import React, { useState } from 'react';
import OfficeLayout from '../components/OfficeLayout';
import { toast } from 'react-toastify';

const BookingPage = () => {
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [bookedSeats] = useState([]); // This would come from API

  const handleSeatSelect = (seatId) => {
    setSelectedSeat(seatId === selectedSeat ? null : seatId);
  };

  const handleBooking = async () => {
    if (!selectedSeat) {
        toast.error("Please select a seat first.");
        return;
    }
    // In a real implementation, we would map 'seatId' (e.g. D-1) to a backend Space UUID
    // or pass it as 'special_requests' or 'seat_number' if the backend supported it.
    // For now, we'll just show a success message or redirect to a confirmation step.
    
    toast.info(`Proceeding to book seat ${selectedSeat}...`);
    // navigate('/confirmation', { state: { seat: selectedSeat } });
    
    // Simulate API call or redirect to wizard
    // For this demo, let's assume we redirect back to the form wizard but with the seat pre-selected
    // or just show a success modal.
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
       <header className="bg-white shadow-sm py-4 px-6 flex justify-between items-center z-10">
          <h1 className="text-xl font-bold text-gray-800">Select Your Desk</h1>
          <div className="flex gap-4 items-center">
            {selectedSeat && (
                <div className="text-sm font-medium text-indigo-600">
                    Selected: {selectedSeat}
                </div>
            )}
            <button 
                onClick={handleBooking}
                disabled={!selectedSeat}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
                Confirm Selection
            </button>
          </div>
       </header>

       <div className="flex-1 overflow-hidden relative">
          <OfficeLayout 
            onSeatSelect={handleSeatSelect} 
            selectedSeat={selectedSeat} 
            bookedSeats={bookedSeats}
          />
       </div>
    </div>
  );
};

export default BookingPage;

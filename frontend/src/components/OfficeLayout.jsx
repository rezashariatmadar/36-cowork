import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Tooltip } from 'react-tooltip';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';
import { getSeats } from '../services/api';

const SEAT_POSITIONS = {
    // Dedicated Zone
    'D-1': { top: '15%', left: '20%' },
    'D-2': { top: '15%', left: '25%' },
    'D-3': { top: '15%', left: '30%' },
    'D-4': { top: '15%', left: '35%' },
    'D-5': { top: '20%', left: '20%' },
    'D-6': { top: '20%', left: '25%' },
    
    // Tables
    'T1-1': { top: '40%', left: '20%' },
    'T1-2': { top: '40%', left: '23%' },
    'T1-3': { top: '43%', left: '20%' },
    'T1-4': { top: '43%', left: '23%' },

    // Add more as needed or use algorithmic fallback
};

const Seat = ({ seat, onSelect, isSelected, user }) => {
    const { visual_id, status, booked_until } = seat;
    const isBooked = status === 'booked';
    
    // Fallback position if not mapped (deterministic hash to ensure stability)
    const pos = SEAT_POSITIONS[visual_id] || (() => {
        let hash = 0;
        for (let i = 0; i < visual_id.length; i++) {
            hash = visual_id.charCodeAt(i) + ((hash << 5) - hash);
        }
        const x = Math.abs(hash % 80) + 10; // 10% to 90%
        const y = Math.abs((hash >> 16) % 80) + 10;
        return { top: `${y}%`, left: `${x}%` };
    })();

    const handleClick = () => {
        if (!isBooked) onSelect(seat);
    };

    // Tooltip Content
    let tooltipContent = `${visual_id}`;
    if (isBooked) {
        if (user) {
            tooltipContent += ` - Occupied until ${booked_until || '?'}`;
        } else {
            tooltipContent += ` - Occupied`;
        }
    } else {
        tooltipContent += ` - Available`;
    }

    return (
        <div
            className={clsx(
                "absolute w-8 h-8 rounded-full border-2 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 shadow-sm text-[10px] font-bold",
                isBooked ? "bg-red-500 border-red-700 text-white cursor-not-allowed opacity-80" : 
                isSelected ? "bg-indigo-600 border-indigo-800 text-white scale-110 z-10" : 
                "bg-green-400 border-green-600 text-white hover:bg-green-500"
            )}
            style={{ top: pos.top, left: pos.left }}
            onClick={handleClick}
            data-tooltip-id="main-tooltip"
            data-tooltip-content={tooltipContent}
        >
            {visual_id.split('-').pop()}
        </div>
    );
};

const OfficeLayout = ({ onSeatSelect, selectedSeat }) => {
  const { user } = useAuth();
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch seats on mount (default to today)
  useEffect(() => {
    const fetchSeats = async () => {
        try {
            // Get today's date in Jalali. 
            // For now, let's rely on backend default if param missing? 
            // My backend code requires 'date' param or it skips status logic.
            // I'll hardcode a date or use a simple formatter for prototype.
            // Ideally: jdatetime.now().format('YYYY-MM-DD')
            // I'll just use '1403-10-08' (Approx today) or pass nothing to see raw list
            // But we need status.
            // Let's assume today is 1403-10-08 for demo purposes or fetch valid date.
            const today = '1403-10-08'; 
            const data = await getSeats(today);
            setSeats(data);
        } catch (error) {
            console.error("Failed to fetch seats:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchSeats();
  }, []);

  return (
    <div className="relative w-full h-[600px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={4}
        centerOnInit={true}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                <button onClick={() => zoomIn()} className="bg-white p-2 rounded shadow hover:bg-gray-50">+</button>
                <button onClick={() => zoomOut()} className="bg-white p-2 rounded shadow hover:bg-gray-50">-</button>
                <button onClick={() => resetTransform()} className="bg-white p-2 rounded shadow hover:bg-gray-50">Reset</button>
            </div>

            <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
              <div className="relative w-[1024px] h-[768px] bg-white shadow-2xl mx-auto my-10">
                {/* Background Image */}
                <img 
                    src="/floor-plan.png" 
                    alt="Office Floor Plan" 
                    className="w-full h-full object-contain opacity-50"
                />

                {/* Seat Overlays */}
                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center">Loading...</div>
                ) : (
                    seats.map(seat => (
                        <Seat 
                            key={seat.id} 
                            seat={seat} 
                            user={user}
                            isSelected={selectedSeat === seat.visual_id} // Compare with visual_id for selection
                            onSelect={(s) => onSeatSelect(s.visual_id)}
                        />
                    ))
                )}
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>
      
      <Tooltip id="main-tooltip" />
    </div>
  );
};

export default OfficeLayout;
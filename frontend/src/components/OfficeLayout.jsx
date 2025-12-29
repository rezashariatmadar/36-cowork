import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Tooltip } from 'react-tooltip';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { User, Lock } from 'lucide-react';
import DateObject from "react-date-object";
import persian from "react-date-object/calendars/persian";
import persian_en from "react-date-object/locales/persian_en";
import { useAuth } from '../context/AuthContext';
import { getSeats } from '../services/api';

// --- Configuration: Seat Coordinates (Percentages) ---
const SEAT_CONFIG = [
  // --- Top Private Rooms (PR-1 to PR-4) ---
  { id: 'PR-1-A', x: 15, y: 10, type: 'rect', label: 'Suite 1-A' },
  { id: 'PR-1-B', x: 20, y: 10, type: 'rect', label: 'Suite 1-B' },
  { id: 'PR-2-A', x: 35, y: 10, type: 'rect', label: 'Suite 2-A' },
  { id: 'PR-2-B', x: 40, y: 10, type: 'rect', label: 'Suite 2-B' },
  { id: 'PR-3-A', x: 55, y: 10, type: 'rect', label: 'Suite 3-A' },
  { id: 'PR-3-B', x: 60, y: 10, type: 'rect', label: 'Suite 3-B' },
  { id: 'PR-4-A', x: 75, y: 10, type: 'rect', label: 'Suite 4-A' },
  { id: 'PR-4-B', x: 80, y: 10, type: 'rect', label: 'Suite 4-B' },

  // --- Large Suite (LPR-1 to LPR-3) ---
  { id: 'LPR-1', x: 90, y: 30, type: 'rect', label: 'LPR-1', w: 4, h: 4 },
  { id: 'LPR-2', x: 90, y: 35, type: 'rect', label: 'LPR-2', w: 4, h: 4 },
  { id: 'LPR-3', x: 90, y: 40, type: 'rect', label: 'LPR-3', w: 4, h: 4 },

  // --- Long Table (CH-L and CH-R) ---
  ...Array.from({ length: 6 }, (_, i) => ({ id: `CH-L-${i + 1}`, x: 40 + i * 4, y: 45, type: 'circle' })),
  ...Array.from({ length: 6 }, (_, i) => ({ id: `CH-R-${i + 1}`, x: 40 + i * 4, y: 55, type: 'circle' })),

  // --- Team Tables (T1 to T6) ---
  ...[1, 2, 3, 4, 5, 6].flatMap(t => [
      { id: `T${t}-1`, x: 10 + (t > 3 ? 70 : 0), y: 40 + (t % 3) * 15, type: 'circle' },
      { id: `T${t}-2`, x: 14 + (t > 3 ? 70 : 0), y: 40 + (t % 3) * 15, type: 'circle' },
      { id: `T${t}-3`, x: 10 + (t > 3 ? 70 : 0), y: 46 + (t % 3) * 15, type: 'circle' },
      { id: `T${t}-4`, x: 14 + (t > 3 ? 70 : 0), y: 46 + (t % 3) * 15, type: 'circle' },
  ]),

  // --- Dedicated Desks (D-1 to D-12) ---
  ...Array.from({ length: 12 }, (_, i) => ({ 
      id: `D-${i + 1}`, 
      x: 25 + (i % 6) * 5, 
      y: 70 + Math.floor(i / 6) * 10, 
      type: 'square' 
  })),
];

const SeatStatus = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  SELECTED: 'selected',
  RESTRICTED: 'restricted',
};

const Seat = ({ config, status, bookedUntil, user, onSelect }) => {
  const isSelected = status === SeatStatus.SELECTED;
  const isBooked = status === SeatStatus.BOOKED;
  const isRestricted = status === SeatStatus.RESTRICTED;

  const baseClasses = "absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center border-2 transition-all duration-200 shadow-sm cursor-pointer hover:scale-125 z-10";
  
  const statusClasses = {
    [SeatStatus.AVAILABLE]: "bg-green-100 border-green-500 text-green-700 hover:bg-green-200 hover:shadow-green-200/50",
    [SeatStatus.SELECTED]: "bg-indigo-600 border-indigo-800 text-white scale-125 shadow-lg shadow-indigo-500/50 z-20",
    [SeatStatus.BOOKED]: "bg-red-100 border-red-300 text-red-300 cursor-not-allowed",
    [SeatStatus.RESTRICTED]: "bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed opacity-80",
  };

  const shapeClasses = {
    circle: "rounded-full w-6 h-6 sm:w-8 sm:h-8",
    square: "rounded-md w-8 h-8 sm:w-10 sm:h-10",
    rect: "rounded-md",
  };

  const customStyle = {
    left: `${config.x}%`,
    top: `${config.y}%`,
    width: config.type === 'rect' ? `${config.w || 4}%` : undefined,
    height: config.type === 'rect' ? `${config.h || 4}%` : undefined,
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (!isBooked && !isRestricted) {
      onSelect(config.id);
    }
  };

  const tooltipData = {
      id: config.id,
      status,
      label: config.label,
      bookedUntil: isBooked ? (user ? bookedUntil : 'Occupied') : null
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={clsx(baseClasses, statusClasses[status], shapeClasses[config.type])}
      style={customStyle}
      onClick={handleClick}
      data-tooltip-id="map-tooltip"
      data-tooltip-content={JSON.stringify(tooltipData)}
    >
      {isSelected && <User className="w-4 h-4" />}
      {isBooked && <span className="text-xs font-bold">✕</span>}
      {isRestricted && <Lock className="w-3 h-3" />}
      
      {config.type === 'rect' && !isSelected && !isBooked && (
        <span className="text-[8px] font-bold opacity-70 truncate px-0.5">
            {config.label || config.id}
        </span>
      )}
    </motion.div>
  );
};

const OfficeLayout = ({ onSeatSelect, selectedSeat }) => {
  const { user } = useAuth();
  const [apiSeats, setApiSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSeats = async () => {
        try {
            const date = new DateObject({ calendar: persian, locale: persian_en });
            const today = date.format("YYYY-MM-DD");
            const data = await getSeats(today);
            setApiSeats(data);
        } catch (error) {
            console.error("Failed to fetch seats:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchSeats();
  }, []);

  const getSeatData = (seatId) => {
      const apiSeat = apiSeats.find(s => s.visual_id === seatId);
      if (selectedSeat === seatId) return { status: SeatStatus.SELECTED };
      if (apiSeat?.status === 'booked') return { status: SeatStatus.BOOKED, bookedUntil: apiSeat.booked_until };
      return { status: SeatStatus.AVAILABLE };
  };

  return (
    <div className="w-full h-[600px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative group">
      
      {/* Legend */}
      <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur p-3 rounded-lg shadow-lg border border-gray-200 text-xs space-y-2 pointer-events-none">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-100 border border-green-500"></div> Available
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-600 border border-indigo-800"></div> Selected
        </div>
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div> Booked
        </div>
      </div>

      <TransformWrapper centerOnInit minScale={0.5} maxScale={4}>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
              <button onClick={() => zoomIn()} className="bg-white p-2 rounded-lg shadow hover:bg-gray-50 text-gray-700">+</button>
              <button onClick={() => zoomOut()} className="bg-white p-2 rounded-lg shadow hover:bg-gray-50 text-gray-700">-</button>
              <button onClick={() => resetTransform()} className="bg-white p-2 rounded-lg shadow hover:bg-gray-50 text-gray-700">↺</button>
            </div>

            <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
              <div className="relative shadow-2xl rounded-xl overflow-hidden bg-white" style={{ minWidth: '800px', width: '90%' }}>
                <img src="/floor-plan.png" alt="Office Floor Plan" className="w-full h-auto object-contain select-none" draggable={false} />
                <div className="absolute inset-0">
                  {!loading && SEAT_CONFIG.map((seat) => {
                      const { status, bookedUntil } = getSeatData(seat.id);
                      return (
                        <Seat
                          key={seat.id}
                          config={seat}
                          status={status}
                          bookedUntil={bookedUntil}
                          user={user}
                          onSelect={onSeatSelect}
                        />
                      );
                  })}
                </div>
              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      <Tooltip
        id="map-tooltip"
        className="z-50 !opacity-100 !bg-gray-800 !text-white !rounded-lg !px-3 !py-2 !shadow-xl"
        render={({ content }) => {
            if (!content) return null;
            const data = JSON.parse(content);
            return (
                <div className="text-center">
                    <div className="font-bold text-sm">{data.label || data.id}</div>
                    <div className="text-xs uppercase opacity-75">
                        {data.status === 'booked' ? (data.bookedUntil || 'Occupied') : data.status}
                    </div>
                </div>
            );
        }}
      />
    </div>
  );
};

export default OfficeLayout;
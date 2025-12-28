import React, { useState } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Tooltip } from 'react-tooltip';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Lock, User, Info } from 'lucide-react';

// --- Atomic Components ---

const SeatStatus = {
  AVAILABLE: 'available',
  BOOKED: 'booked',
  SELECTED: 'selected',
  RESERVED: 'reserved',
};

const Seat = ({ id, status = SeatStatus.AVAILABLE, type = 'circle', className, onSelect, amenities = [] }) => {
  const isSelected = status === SeatStatus.SELECTED;
  const isBooked = status === SeatStatus.BOOKED;
  const isReserved = status === SeatStatus.RESERVED;

  // Visual variants based on status
  const baseStyles = "relative flex items-center justify-center cursor-pointer transition-all duration-200 border-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500";
  
  const statusStyles = {
    [SeatStatus.AVAILABLE]: "bg-white border-gray-300 hover:border-indigo-400 hover:shadow-md text-gray-500",
    [SeatStatus.SELECTED]: "bg-indigo-600 border-indigo-700 text-white shadow-lg scale-110 z-10",
    [SeatStatus.BOOKED]: "bg-gray-200 border-gray-300 cursor-not-allowed text-gray-400",
    [SeatStatus.RESERVED]: "bg-amber-50 border-amber-200 cursor-not-allowed text-amber-400",
  };

  const shapeStyles = {
    circle: "rounded-full w-8 h-8",
    square: "rounded-md w-10 h-10",
    rect: "rounded-sm w-12 h-8",
  };

  return (
    <>
      <motion.button
        whileHover={!isBooked && !isReserved ? { scale: 1.15 } : {}}
        whileTap={!isBooked && !isReserved ? { scale: 0.95 } : {}}
        onClick={() => !isBooked && !isReserved && onSelect(id)}
        className={clsx(baseStyles, statusStyles[status], shapeStyles[type], className)}
        data-tooltip-id="seat-tooltip"
        data-tooltip-content={JSON.stringify({ id, status, amenities })}
        aria-label={`Seat ${id} ${status}`}
        disabled={isBooked || isReserved}
      >
        {isSelected && <User className="w-4 h-4" />}
        {isReserved && <Lock className="w-3 h-3" />}
        {isBooked && <span className="text-xs">✕</span>}
      </motion.button>
    </>
  );
};

// 4-Seater Table (Cluster)
const ClusterTable = ({ idPrefix, onSeatSelect, selectedSeat }) => (
  <div className="relative w-36 h-28 flex items-center justify-center p-2 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
    {/* Chairs */}
    <div className="absolute top-0 flex gap-8">
      <Seat id={`${idPrefix}-1`} onSelect={onSeatSelect} status={selectedSeat === `${idPrefix}-1` ? SeatStatus.SELECTED : SeatStatus.AVAILABLE} />
      <Seat id={`${idPrefix}-2`} onSelect={onSeatSelect} status={selectedSeat === `${idPrefix}-2` ? SeatStatus.SELECTED : SeatStatus.AVAILABLE} />
    </div>
    <div className="absolute bottom-0 flex gap-8">
      <Seat id={`${idPrefix}-3`} onSelect={onSeatSelect} status={selectedSeat === `${idPrefix}-3` ? SeatStatus.SELECTED : SeatStatus.AVAILABLE} />
      <Seat id={`${idPrefix}-4`} onSelect={onSeatSelect} status={selectedSeat === `${idPrefix}-4` ? SeatStatus.SELECTED : SeatStatus.AVAILABLE} />
    </div>
    
    {/* Table Surface */}
    <div className="w-28 h-14 bg-white border border-gray-300 rounded-lg flex items-center justify-center z-0 shadow-sm">
      <span className="text-xs font-bold text-gray-400">{idPrefix}</span>
    </div>
  </div>
);

// 12-Seater Joint Table
const CollabHub = ({ onSeatSelect, selectedSeat }) => (
  <div className="relative w-full h-[360px] flex items-center justify-center bg-indigo-50/30 rounded-3xl border border-indigo-100 p-4">
    {/* Table Surface */}
    <div className="w-32 h-full bg-white border border-gray-300 rounded-2xl flex flex-col items-center justify-center z-0 shadow-sm">
      <span className="text-xs font-bold text-gray-400 -rotate-90 tracking-widest uppercase">Collab Hub</span>
    </div>

    {/* Chairs - Left Side (6) */}
    <div className="absolute left-4 h-full flex flex-col justify-around py-6">
      {[...Array(6)].map((_, i) => (
        <Seat 
            key={`CH-L-${i+1}`} 
            id={`CH-L-${i+1}`} 
            onSelect={onSeatSelect} 
            status={selectedSeat === `CH-L-${i+1}` ? SeatStatus.SELECTED : SeatStatus.AVAILABLE}
            type="circle" 
        />
      ))}
    </div>

    {/* Chairs - Right Side (6) */}
    <div className="absolute right-4 h-full flex flex-col justify-around py-6">
      {[...Array(6)].map((_, i) => (
        <Seat 
            key={`CH-R-${i+1}`} 
            id={`CH-R-${i+1}`} 
            onSelect={onSeatSelect} 
            status={selectedSeat === `CH-R-${i+1}` ? SeatStatus.SELECTED : SeatStatus.AVAILABLE}
            type="circle" 
        />
      ))}
    </div>
  </div>
);

// --- Main Layout ---

const OfficeLayout = ({ onSeatSelect, selectedSeat, bookedSeats = [] }) => {
  
  // Helper to determine status (in a real app, check bookedSeats array)
  const getStatus = (id) => {
      if (selectedSeat === id) return SeatStatus.SELECTED;
      if (bookedSeats.includes(id)) return SeatStatus.BOOKED;
      return SeatStatus.AVAILABLE;
  };

  return (
    <div className="relative w-full h-[600px] bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
      
      {/* Map Controls & Legend Overlay */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white p-2 rounded-lg shadow-md border border-gray-100 text-xs space-y-2">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-white border border-gray-300"></div> Available</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-indigo-600"></div> Selected</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-200"></div> Booked</div>
        </div>
      </div>

      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={2}
        centerOnInit={true}
        limitToBounds={false}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <div className="absolute bottom-4 right-4 z-20 flex gap-2">
                <button onClick={() => zoomIn()} className="bg-white p-2 rounded shadow hover:bg-gray-50">+</button>
                <button onClick={() => zoomOut()} className="bg-white p-2 rounded shadow hover:bg-gray-50">-</button>
                <button onClick={() => resetTransform()} className="bg-white p-2 rounded shadow hover:bg-gray-50">Reset</button>
            </div>

            <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full">
              <div className="w-[1000px] h-[800px] bg-white relative shadow-2xl m-20 p-12 rounded-3xl border border-gray-100">
                
                {/* Zone Labels */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 text-gray-300 text-6xl font-black opacity-20 pointer-events-none">OFFICE v2</div>

                {/* ZONE 1: Dedicated Zone (3x4) */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-2/3">
                    <div className="text-center mb-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Dedicated Zone (Quiet)</div>
                    <div className="grid grid-cols-4 gap-6 justify-items-center">
                        {[...Array(12)].map((_, i) => (
                            <Seat 
                                key={`D-${i+1}`} 
                                id={`D-${i+1}`} 
                                type="square" 
                                onSelect={onSeatSelect} 
                                status={getStatus(`D-${i+1}`)}
                                amenities={['Monitor', 'Ergo Chair']}
                            />
                        ))}
                    </div>
                </div>

                {/* ZONE 2: Middle Work Area */}
                <div className="absolute top-64 w-full px-12 flex justify-between gap-8">
                    {/* Left Flank */}
                    <div className="flex flex-col justify-between gap-8">
                        <ClusterTable idPrefix="T1" onSeatSelect={onSeatSelect} selectedSeat={selectedSeat} />
                        <ClusterTable idPrefix="T2" onSeatSelect={onSeatSelect} selectedSeat={selectedSeat} />
                        <ClusterTable idPrefix="T3" onSeatSelect={onSeatSelect} selectedSeat={selectedSeat} />
                    </div>

                    {/* Center Collab */}
                    <div className="flex-1 max-w-sm">
                        <CollabHub onSeatSelect={onSeatSelect} selectedSeat={selectedSeat} />
                    </div>

                    {/* Right Flank */}
                    <div className="flex flex-col justify-between gap-8">
                        <ClusterTable idPrefix="T4" onSeatSelect={onSeatSelect} selectedSeat={selectedSeat} />
                        <ClusterTable idPrefix="T5" onSeatSelect={onSeatSelect} selectedSeat={selectedSeat} />
                        <ClusterTable idPrefix="T6" onSeatSelect={onSeatSelect} selectedSeat={selectedSeat} />
                    </div>
                </div>

                {/* ZONE 3: Bottom Rooms */}
                <div className="absolute bottom-12 w-full px-12 grid grid-cols-12 gap-4 h-64">
                    {/* Sliding Door Visual */}
                    <div className="absolute -top-6 left-1/3 w-1/3 h-4 bg-gray-100 rounded-full flex items-center justify-center border border-gray-200">
                        <div className="w-1/2 h-full bg-red-100 rounded-full border border-red-200" />
                    </div>

                    {/* Private Rooms */}
                    <div className="col-span-4 flex flex-col gap-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={`PR-${i+1}`} className="flex-1 border border-gray-200 rounded-lg flex items-center justify-between px-4 bg-gray-50">
                                <span className="text-xs text-gray-500">Suite {i+1}</span>
                                <div className="flex gap-2">
                                    <Seat id={`PR-${i+1}-A`} type="circle" className="w-6 h-6" onSelect={onSeatSelect} status={getStatus(`PR-${i+1}-A`)} />
                                    <Seat id={`PR-${i+1}-B`} type="circle" className="w-6 h-6" onSelect={onSeatSelect} status={getStatus(`PR-${i+1}-B`)} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="col-span-2"></div>

                    {/* Meeting Complex */}
                    <div className="col-span-6 flex flex-col gap-4">
                        <div className="flex-[2] border-2 border-gray-800 rounded-2xl bg-white relative">
                            <span className="absolute top-2 left-2 text-[10px] font-bold text-gray-400">BOARDROOM</span>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-32 h-16 border border-gray-400 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">10 Pax</div>
                            </div>
                        </div>
                        <div className="flex-1 border border-gray-300 rounded-xl bg-gray-50 flex items-center justify-between px-6">
                            <span className="text-xs font-bold text-gray-500">Large Suite (+20%)</span>
                            <div className="flex gap-2">
                                <Seat id="LPR-1" type="circle" className="w-6 h-6" onSelect={onSeatSelect} status={getStatus("LPR-1")} />
                                <Seat id="LPR-2" type="circle" className="w-6 h-6" onSelect={onSeatSelect} status={getStatus("LPR-2")} />
                                <Seat id="LPR-3" type="circle" className="w-6 h-6" onSelect={onSeatSelect} status={getStatus("LPR-3")} />
                            </div>
                        </div>
                    </div>
                </div>

              </div>
            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* Global Tooltip */}
      <Tooltip 
        id="seat-tooltip" 
        render={({ content }) => {
            if (!content) return null;
            const data = JSON.parse(content);
            return (
                <div className="flex flex-col">
                    <span className="font-bold">{data.id}</span>
                    <span className="text-xs uppercase opacity-75">{data.status}</span>
                    {data.amenities?.length > 0 && (
                        <div className="mt-1 flex gap-1">
                            {data.amenities.map(a => <span key={a} className="bg-white/20 px-1 rounded text-[10px]">{a}</span>)}
                        </div>
                    )}
                </div>
            )
        }} 
      />
    </div>
  );
};

export default OfficeLayout;

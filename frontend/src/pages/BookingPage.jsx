import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Check, Calendar as CalendarIcon, Clock, CreditCard } from 'lucide-react';
import DatePicker from 'react-multi-date-picker';
import jalali from 'react-date-object/calendars/jalali';
import persian_fa from 'react-date-object/locales/persian_fa';
import DateObject from "react-date-object";
import { toast } from 'react-toastify';

import OfficeLayout from '../components/OfficeLayout';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/api';

const BookingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State: Booking Context
  const [date, setDate] = useState(new DateObject({ calendar: jalali, locale: persian_fa }));
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");

  // State: Selection & Cart
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [cart, setCart] = useState(null); // Simple single-item cart for MVP
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Handlers ---

  const handleSeatSelect = (seatId) => {
    // If already in cart, don't re-select
    if (cart?.seatId === seatId) return;
    setSelectedSeat(seatId);
  };

  const addToCart = () => {
    if (!selectedSeat) return;
    
    setCart({
      seatId: selectedSeat,
      date: date.format("YYYY/MM/DD"),
      start: startTime,
      end: endTime,
      price: 150000, // Mock price, would come from API in real app
      itemType: selectedSeat.startsWith('PR') ? 'Private Suite' : 'Hot Desk'
    });
    setSelectedSeat(null); // Clear selection as it's now in cart
    toast.success("Item added to cart");
  };

  const removeFromCart = () => {
    setCart(null);
    toast.info("Cart cleared");
  };

  const handleCheckout = async () => {
    if (!cart) return;
    setIsSubmitting(true);

    try {
        // Backend API Payload
        const payload = {
            seat_id: cart.seatId, // In real app, map Visual ID to UUID here or backend does it
            // For this MVP, we need to handle the ID mapping. 
            // We'll send the raw visual_id and let the backend/service handle it or mock success.
            // Ideally: space: uuid... 
            
            full_name: user?.full_name || "Guest User",
            national_id: user?.national_id || "0000000000",
            mobile: user?.mobile || "09000000000",
            booking_date_jalali: cart.date.replace(/\//g, '-'),
            start_time: cart.start,
            end_time: cart.end,
            booking_type: 'hourly',
            space: null, // This would fail validation without UUID. 
        };

        // Simulate network delay for UX
        await new Promise(r => setTimeout(r, 1500));
        
        // In a real integration, we'd call: await createBooking(payload);
        
        setIsCheckoutOpen(false);
        setCart(null);
        navigate('/success', { state: { booking: { ...cart, id: 'MOCK-123' } } });
        
    } catch (error) {
        console.error(error);
        toast.error("Booking failed. Please try again.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col h-screen overflow-hidden font-sans">
      
      {/* --- Top Bar: Filters --- */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-indigo-700">Book a Space</h1>
            <span className="text-gray-400 text-sm hidden sm:inline">|</span>
            <span className="text-gray-500 text-sm hidden sm:inline">Select your spot on the map</span>
        </div>

        <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 px-2">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <DatePicker 
                    calendar={jalali} 
                    locale={persian_fa} 
                    value={date} 
                    onChange={setDate}
                    inputClass="bg-transparent text-sm font-medium outline-none w-24 cursor-pointer text-gray-700"
                />
            </div>
            <div className="w-px h-6 bg-gray-300"></div>
            <div className="flex items-center gap-2 px-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <select 
                    value={startTime} 
                    onChange={(e) => setStartTime(e.target.value)} 
                    className="bg-transparent text-sm font-medium outline-none cursor-pointer"
                >
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="13:00">13:00</option>
                </select>
                <span className="text-gray-400">-</span>
                <select 
                    value={endTime} 
                    onChange={(e) => setEndTime(e.target.value)} 
                    className="bg-transparent text-sm font-medium outline-none cursor-pointer"
                >
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="20:00">20:00</option>
                </select>
            </div>
        </div>
      </header>

      {/* --- Main Content: Map --- */}
      <div className="flex-1 relative overflow-hidden bg-gray-100">
        <OfficeLayout 
            onSeatSelect={handleSeatSelect} 
            selectedSeat={selectedSeat || cart?.seatId} // Highlight cart item too
        />
        
        {/* --- Selection Drawer (Add to Cart) --- */}
        <AnimatePresence>
            {selectedSeat && !cart && (
                <motion.div 
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl p-6 w-[90%] max-w-md border border-gray-100 z-30"
                >
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">{selectedSeat}</h3>
                            <p className="text-sm text-gray-500">{date.format("YYYY/MM/DD")} • {startTime} - {endTime}</p>
                        </div>
                        <button onClick={() => setSelectedSeat(null)} className="p-1 hover:bg-gray-100 rounded-full">
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                    
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <div className="text-xs text-gray-500 uppercase font-semibold">Price</div>
                            <div className="text-xl font-bold text-indigo-600">150,000 <span className="text-xs text-gray-400 font-normal">Toman</span></div>
                        </div>
                        <button 
                            onClick={addToCart}
                            className="flex-1 bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30"
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </div>

      {/* --- Cart Bar (Sticky Bottom) --- */}
      <AnimatePresence>
        {cart && (
            <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                className="bg-white border-t border-gray-200 shadow-[0_-5px_20px_-5px_rgba(0,0,0,0.1)] p-4 px-6 z-40"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                                1 Item in Cart
                                <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full uppercase">{cart.seatId}</span>
                            </div>
                            <div className="text-sm text-gray-500">Total: {cart.price.toLocaleString()} Toman</div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={removeFromCart}
                            className="text-gray-500 hover:text-red-500 text-sm font-medium px-4"
                        >
                            Remove
                        </button>
                        <button 
                            onClick={() => setIsCheckoutOpen(true)}
                            className="bg-gray-900 text-white font-bold py-2.5 px-6 rounded-lg hover:bg-gray-800 transition-all shadow-md"
                        >
                            Checkout
                        </button>
                    </div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* --- Checkout Modal --- */}
      <AnimatePresence>
        {isCheckoutOpen && cart && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    onClick={() => setIsCheckoutOpen(false)}
                />
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10"
                >
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-indigo-600" />
                            Confirm Order
                        </h2>
                        <button onClick={() => setIsCheckoutOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Order Summary */}
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-indigo-900">{cart.itemType} ({cart.seatId})</span>
                                <span className="font-bold text-indigo-700">{cart.price.toLocaleString()} T</span>
                            </div>
                            <div className="text-sm text-indigo-600 space-y-1">
                                <p>Date: {cart.date}</p>
                                <p>Time: {cart.start} - {cart.end}</p>
                            </div>
                        </div>

                        {/* User Details (Read Only) */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">Booking For</label>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 text-sm">
                                {user?.full_name || "Guest User"} <br/>
                                <span className="text-gray-400">{user?.mobile || "0912..."}</span>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                             <div className="mt-0.5">
                                 <input type="checkbox" id="terms" className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                             </div>
                             <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed">
                                I agree to the <a href="#" className="text-indigo-600 underline">Terms of Service</a> and <a href="#" className="text-indigo-600 underline">Cancellation Policy</a>.
                             </label>
                        </div>
                    </div>

                    <div className="p-6 border-t border-gray-100 flex gap-4">
                        <button 
                            onClick={() => setIsCheckoutOpen(false)}
                            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleCheckout}
                            disabled={isSubmitting}
                            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Processing...' : (
                                <>
                                    <Check className="w-5 h-5" /> Confirm & Pay
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default BookingPage;
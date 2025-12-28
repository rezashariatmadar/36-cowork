import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BookingForm from './BookingForm';
import * as api from '../../services/api';
import { BrowserRouter } from 'react-router-dom';

// Mock API
vi.mock('../../services/api');

// Mock Router
const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedNavigate,
    };
});

// Mock DatePicker
vi.mock('react-multi-date-picker', () => {
    return {
        default: ({ value, onChange }) => (
            <input 
                data-testid="date-picker"
                value={value || ''} 
                onChange={(e) => onChange(new Date(e.target.value))} // Simple mock object
            />
        )
    }
});

// Mock Date Object for DatePicker
// The real component uses .format(), our mock passed `new Date()`. 
// We need to match what Controller expects.
// Controller passes `onChange`. Real DatePicker calls it with a DateObject that has .format().
// Let's adjust the mock to pass an object with .format().

vi.mock('react-multi-date-picker', () => {
    return {
        default: ({ value, onChange }) => (
            <input 
                data-testid="date-picker"
                value={value || ''} 
                onChange={(e) => onChange({ format: () => e.target.value })} 
            />
        )
    }
});


describe('BookingForm Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('submits form successfully', async () => {
        // 1. Mock Data
        const mockSpaces = [{ id: '1', name: 'Test Space', type: 'hot_desk', hourly_rate: 100 }];
        const mockAvailability = [{ start_time: '08:00:00', end_time: '10:00:00' }];
        const mockBookingResponse = { id: 'booking-123', status: 'pending' };

        api.getSpaces.mockResolvedValue(mockSpaces);
        api.getAvailability.mockResolvedValue(mockAvailability);
        api.createBooking.mockResolvedValue(mockBookingResponse);

        render(
            <BrowserRouter>
                <BookingForm />
            </BrowserRouter>
        );

        // 2. Select Space
        await waitFor(() => {
            expect(screen.getByText('Test Space (hot_desk) - $100/hr')).toBeInTheDocument();
        });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });

        // 3. Select Date (via Mock)
        fireEvent.change(screen.getByTestId('date-picker'), { target: { value: '2025-01-01' } });

        // 4. Wait for Availability to Load (triggered by space + date)
        await waitFor(() => {
            expect(api.getAvailability).toHaveBeenCalled();
            // Check if Time Inputs appear (they are inside TimeSlotSelector which shows if slots > 0)
            expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
        });

        // 5. Fill Time
        fireEvent.change(screen.getByLabelText(/Start Time/i), { target: { value: '08:00' } });
        fireEvent.change(screen.getByLabelText(/End Time/i), { target: { value: '09:00' } });

        // 6. Fill Personal Info
        fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'John Doe' } });
        fireEvent.change(screen.getByLabelText(/National ID/i), { target: { value: '0060495219' } });
        fireEvent.change(screen.getByLabelText(/Mobile/i), { target: { value: '09123456789' } });
        
        // 7. Agreements
        fireEvent.click(screen.getByLabelText(/I accept the terms/i));
        fireEvent.click(screen.getByLabelText(/I accept the privacy/i));

        // 8. Submit
        const submitBtn = screen.getByRole('button', { name: /Confirm Booking/i });
        expect(submitBtn).not.toBeDisabled();
        fireEvent.click(submitBtn);

        // 9. Verify Submission
        await waitFor(() => {
            expect(api.createBooking).toHaveBeenCalledWith(expect.objectContaining({
                space: '1',
                full_name: 'John Doe',
                booking_date_jalali: '2025-01-01',
                start_time: '08:00',
                end_time: '09:00'
            }));
            expect(mockedNavigate).toHaveBeenCalledWith('/success', expect.any(Object));
        });
    });
});
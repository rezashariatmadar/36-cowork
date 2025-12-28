import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SpaceSelector from './SpaceSelector';
import * as api from '../../services/api';

// Mock the API service
vi.mock('../../services/api');

describe('SpaceSelector', () => {
  it('renders loading state initially', () => {
    // Mock getSpaces to return a promise that doesn't resolve immediately
    api.getSpaces.mockReturnValue(new Promise(() => {}));
    
    // Mock register function from react-hook-form
    const mockRegister = vi.fn();
    
    render(<SpaceSelector register={mockRegister} />);
    
    expect(screen.getByRole('combobox')).toBeDisabled();
    expect(screen.getByText('Loading spaces...')).toBeInTheDocument();
  });

  it('renders spaces after fetching', async () => {
    const mockSpaces = [
        { id: '1', name: 'Space A', type: 'hot_desk', hourly_rate: 100 },
        { id: '2', name: 'Space B', type: 'meeting_room', hourly_rate: 200 }
    ];
    
    api.getSpaces.mockResolvedValue(mockSpaces);
    const mockRegister = vi.fn(); // Mocking register to return props required for input
    mockRegister.mockReturnValue({ name: 'space', onChange: vi.fn(), onBlur: vi.fn(), ref: vi.fn() });

    render(<SpaceSelector register={mockRegister} />);

    // Wait for loading to finish
    await waitFor(() => {
        expect(screen.getByText('Choose a space...')).toBeInTheDocument();
    });

    expect(screen.getByRole('combobox')).not.toBeDisabled();
    expect(screen.getByText('Space A (hot_desk) - $100/hr')).toBeInTheDocument();
    expect(screen.getByText('Space B (meeting_room) - $200/hr')).toBeInTheDocument();
  });
});

import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BookingForm from './components/booking/BookingForm';
import SuccessPage from './pages/SuccessPage';
import ErrorPage from './pages/ErrorPage';
import OfficeLayout from './components/OfficeLayout';
import BookingStepper from './components/booking/BookingStepper';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useState } from 'react';

// Wrapper component to manage stepper state and render form sections
const BookingWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const handleNextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <>
      <BookingStepper currentStep={currentStep} />
      <BookingForm 
        currentStep={currentStep} 
        setCurrentStep={setCurrentStep} 
        handleNextStep={handleNextStep}
        handlePrevStep={handlePrevStep}
        navigate={navigate}
      />
    </>
  );
};

const ProtectedRoute = ({ children }) => {
    const { token, loading } = useAuth();
    if (loading) return <div>Loading...</div>;
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

function App() {
  return (
    <AuthProvider>
        <Router>
            <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    <Route path="/" element={
                        <ProtectedRoute>
                            <BookingWizard />
                        </ProtectedRoute>
                    } />
                    <Route path="/success" element={<SuccessPage />} />
                    <Route path="/error" element={<ErrorPage />} />
                    <Route path="/layout" element={<OfficeLayout />} />
                </Routes>
                <ToastContainer position="top-center" rtl />
            </div>
        </Router>
    </AuthProvider>
  )
}

export default App;
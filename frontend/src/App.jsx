import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SuccessPage from './pages/SuccessPage';
import ErrorPage from './pages/ErrorPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import BookingPage from './pages/BookingPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
    const { token } = useAuth();
    if (!token) return <Navigate to="/login" replace />;
    return children;
};

function App() {
  return (
    <AuthProvider>
        <Router>
            <div className="min-h-screen bg-gray-50">
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<RegisterPage />} />
                    
                    <Route path="/booking" element={
                        <ProtectedRoute>
                            <BookingPage />
                        </ProtectedRoute>
                    } />
                    
                    <Route path="/success" element={<SuccessPage />} />
                    <Route path="/error" element={<ErrorPage />} />
                </Routes>
                <ToastContainer position="top-center" rtl />
            </div>
        </Router>
    </AuthProvider>
  )
}

export default App;
import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const registerSchema = z.object({
    full_name: z.string().min(3, "Full name is required"),
    mobile: z.string().regex(/^09\d{9}$/, "Mobile must be 11 digits starting with 09"),
    national_id: z.string().regex(/^\d{10}$/, "National ID must be 10 digits"),
    email: z.string().email().optional().or(z.literal('')),
    password: z.string().min(6, "Password must be at least 6 chars"), // Or enforce national ID logic if preferred
});

const RegisterPage = () => {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
      resolver: zodResolver(registerSchema)
  });

  const onSubmit = async (data) => {
    try {
        await registerUser(data);
        toast.success("Registered successfully! Please login.");
        navigate('/login');
    } catch (error) {
        toast.error("Registration failed. Mobile or National ID might be taken.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Create an account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input type="text" {...register('full_name')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile</label>
              <input type="text" {...register('mobile')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              {errors.mobile && <p className="text-red-500 text-xs">{errors.mobile.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">National ID</label>
              <input type="text" {...register('national_id')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              {errors.national_id && <p className="text-red-500 text-xs">{errors.national_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email (Optional)</label>
              <input type="email" {...register('email')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" {...register('password')} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Registering...' : 'Register'}
            </button>
          </div>
          
          <div className="text-center text-sm">
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Already have an account? Sign in
              </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;

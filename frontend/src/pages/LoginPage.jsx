import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    const success = await login(data.mobile, data.password);
    if (success) {
      toast.success("Logged in successfully!");
      navigate('/');
    } else {
      toast.error("Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
              <input
                type="text"
                {...register('mobile', { required: "Mobile is required" })}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.mobile && <p className="text-red-500 text-xs">{errors.mobile.message}</p>}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Password (National ID)</label>
              <input
                type="password"
                {...register('password', { required: "Password is required" })}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
          
          <div className="text-center text-sm">
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Don't have an account? Register
              </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

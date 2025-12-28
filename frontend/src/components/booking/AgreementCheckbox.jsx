import React from 'react';

const AgreementCheckbox = ({ label, register, name, error }) => {
  return (
    <div className="mb-2">
        <div className="flex items-center">
            <input 
                id={name}
                type="checkbox" 
                {...register(name)} 
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" 
            />
            <label 
                htmlFor={name}
                className="mr-2 block text-sm text-gray-900 select-none cursor-pointer"
            >
                {label}
            </label>
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
};

export default AgreementCheckbox;
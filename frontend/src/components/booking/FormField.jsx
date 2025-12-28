import React from 'react';
import clsx from 'clsx';

const FormField = ({ label, error, children, className, htmlFor }) => {
  return (
    <div className={clsx("mb-4", className)}>
      {label && (
        <label 
            htmlFor={htmlFor} 
            className="block text-sm font-medium text-gray-700 mb-1"
        >
            {label}
        </label>
      )}
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error.message}</p>}
    </div>
  );
};

export default FormField;
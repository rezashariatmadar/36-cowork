import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Check, Calendar, MapPin, User } from 'lucide-react';

const steps = [
  { id: 1, title: 'Date & Time', icon: Calendar },
  { id: 2, title: 'Choose Seat', icon: MapPin },
  { id: 3, title: 'Confirm', icon: User },
];

const BookingStepper = ({ currentStep }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-center">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const Icon = step.icon;

          return (
            <React.Fragment key={step.id}>
              {/* Step Circle */}
              <div className="flex flex-col items-center relative z-10">
                <div
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 bg-white",
                    isCompleted ? "border-indigo-600 bg-indigo-600 text-white" :
                    isCurrent ? "border-indigo-600 text-indigo-600" :
                    "border-gray-300 text-gray-400"
                  )}
                >
                  {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                </div>
                <span 
                    className={clsx(
                        "absolute top-12 text-xs font-medium whitespace-nowrap",
                        isCurrent ? "text-indigo-600" : "text-gray-500"
                    )}
                >
                    {step.title}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="w-16 h-1 mx-2 bg-gray-200 rounded">
                  <div
                    className={clsx(
                      "h-full bg-indigo-600 rounded transition-all duration-500 ease-out",
                      currentStep > step.id ? "w-full" : "w-0"
                    )}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default BookingStepper;

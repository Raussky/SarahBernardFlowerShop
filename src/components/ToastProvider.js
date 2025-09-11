import React, { createContext, useContext, useRef } from 'react';
import ToastNotification from './ToastNotification';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const toastRef = useRef(null);

  const showToast = (message, type) => {
    if (toastRef.current) {
      toastRef.current.show(message, type);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastNotification ref={toastRef} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
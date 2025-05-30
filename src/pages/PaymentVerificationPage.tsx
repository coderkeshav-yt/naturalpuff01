import React from 'react';
import PaymentVerification from '@/components/payment/PaymentVerification';
import { useNavigate } from 'react-router-dom';

const PaymentVerificationPage: React.FC = () => {
  const navigate = useNavigate();
  
  const handleComplete = () => {
    navigate('/');
  };
  
  return (
    <PaymentVerification onComplete={handleComplete} />
  );
};

export default PaymentVerificationPage;

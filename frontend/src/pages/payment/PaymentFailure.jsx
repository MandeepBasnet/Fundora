import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../services/api';

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const [markedFailed, setMarkedFailed] = useState(false);

  useEffect(() => {
    const notifyBackend = async () => {
      // eSewa might pass 'transaction_uuid' or similar depending on how they implemented their return URLs
      // Check for common keys
      const transactionId = searchParams.get('transaction_uuid') || searchParams.get('transactionId') || searchParams.get('pidx');
      
      if (transactionId && !markedFailed) {
        try {
          // Fire and forget
          await api.get(`/payments/payment-failed/${transactionId}`);
          setMarkedFailed(true);
        } catch (error) {
          console.error('Failed to notify backend of payment failure', error);
        }
      }
    };

    notifyBackend();
  }, [searchParams, markedFailed]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Cancelled or Failed</h2>
      <p className="text-gray-600 mb-6">You cancelled the payment process or an error occurred.</p>
      <Link to="/" className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition">
        Return Home
      </Link>
    </div>
  );
};

export default PaymentFailure;

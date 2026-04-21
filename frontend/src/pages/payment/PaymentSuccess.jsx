import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import paymentService from '../../services/paymentService';
import { toast } from 'react-hot-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, failed
  const [transaction, setTransaction] = useState(null);
  const isVerifying = useRef(false); // Ref to prevent double-firing in StrictMode

  useEffect(() => {
    const verify = async () => {
      // Prevent double call
      if (isVerifying.current) return;
      isVerifying.current = true;

      const data = searchParams.get('data'); // eSewa
      const pidx = searchParams.get('pidx'); // Khalti

      try {
        let result;
        if (data) {
          result = await paymentService.verifyEsewa(data);
        } else if (pidx) {
          result = await paymentService.verifyKhalti(pidx);
        } else {
            // Direct access without params? Maybe show history?
             setStatus('failed');
             return;
        }

        setTransaction(result.transaction);
        setStatus('success');
        toast.success('Payment successfully verified!');
      } catch (error) {
        console.error('Verification failed', error);
        setStatus('failed');
        toast.error('Payment verification failed or was cancelled.');
      }
    };

    verify();
  }, [searchParams]);

  if (status === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-700">Verifying your payment...</h2>
        <p className="text-gray-500">Please do not close this window.</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-6">We couldn't verify your payment. Please try again or contact support.</p>
        <div className="space-x-4">
            <Link to="/" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition">
              Return Home
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h2>
      <p className="text-gray-600 mb-6">Thank you for your contribution. Your transaction has been recorded.</p>
       
       {transaction && (
           <div className="bg-gray-50 p-4 rounded-md mb-6 text-left max-w-md w-full">
               <div className="flex justify-between mb-2">
                   <span className="text-sm text-gray-500">Transaction ID:</span>
                   <span className="text-sm font-mono">{transaction.transactionId}</span>
               </div>
               <div className="flex justify-between mb-2">
                   <span className="text-sm text-gray-500">Amount:</span>
                   <span className="text-sm font-semibold">NPR {transaction.amount}</span>
               </div>
               <div className="flex justify-between">
                   <span className="text-sm text-gray-500">Status:</span>
                   <span className="text-sm text-green-600 capitalize">{transaction.status}</span>
               </div>
           </div>
       )}

      <div className="space-x-4">
        <Link to="/dashboard/transactions" className="px-6 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition">
          View History
        </Link>
        <Link to="/" className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition">
          Browse More
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;

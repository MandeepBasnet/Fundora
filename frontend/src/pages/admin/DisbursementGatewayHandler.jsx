import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { Card, Button } from '../../components/ui';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

export default function DisbursementGatewayHandler({ gateway }) {
  const [searchParams] = useSearchParams();
  const { releaseId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying disbursement payment...');
  const [releaseData, setReleaseData] = useState(null);
  
  // Prevent double firing in React 18 strict mode
  const verifiedRef = useRef(false);

  useEffect(() => {
    if (verifiedRef.current) return;
    
    const verifyPayment = async () => {
      verifiedRef.current = true;
      try {
        let response;
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        if (gateway === 'esewa') {
          // eSewa sends generic 'data' param encoded in base64, releaseId was passed in success_url
          const data = searchParams.get('data');
          
          if (!data || !releaseId) throw new Error("Missing verification details");

          response = await axios.post(
            'http://localhost:5000/api/admin/fund-releases/verify-esewa', 
            { data, releaseId },
            config
          );

        } else if (gateway === 'khalti') {
          // Khalti sends pidx, transaction_id, status etc. releaseId was passed in return_url
          const pidx = searchParams.get('pidx');

          if (!pidx || !releaseId) throw new Error("Missing verification details");

          response = await axios.post(
            'http://localhost:5000/api/admin/fund-releases/verify-khalti', 
            { pidx, releaseId },
            config
          );
        }

        if (response && response.data) {
          setStatus('success');
          setMessage(response.data.message || 'Funds disbursed successfully!');
          setReleaseData(response.data.release);
          toast.success('Funds successfully released to the creator.');
        }

      } catch (error) {
        console.error('Verification Error:', error);
        setStatus('error');
        setMessage(error.response?.data?.message || error.message || 'Payment verification failed');
        toast.error('Disbursement verification failed.');
      }
    };

    if (token) {
        verifyPayment();
    }
  }, [gateway, searchParams, token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center border-none shadow-lg">
        {status === 'verifying' && (
          <div className="py-8">
            <Loader2 className="w-16 h-16 animate-spin text-sky-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verifying Transfer...</h2>
            <p className="text-slate-500">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Disbursement Successful!</h2>
            <p className="text-slate-500 mb-6">{message}</p>
            
            {releaseData && (
              <div className="bg-slate-50 rounded-xl p-4 mb-8 text-left space-y-2 text-sm border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Method</span>
                  <span className="font-medium text-slate-900 uppercase">{releaseData.disbursementMethod.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Amount Sent</span>
                  <span className="font-bold text-green-600">NPR {releaseData.amount?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-slate-200 mt-2">
                  <span className="text-slate-400">Ref</span>
                  <span className="font-mono text-slate-500">{releaseData.transactionReference}</span>
                </div>
              </div>
            )}

            <Button 
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              onClick={() => navigate('/admin/fund-disbursements')}
            >
              Return to Disbursements
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="py-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Disbursement Failed</h2>
            <p className="text-slate-500 mb-8">{message}</p>
            <Button 
              className="w-full" variant="outline"
              onClick={() => navigate('/admin/fund-disbursements')}
            >
              Back to Overview
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

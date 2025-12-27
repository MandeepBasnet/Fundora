import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, KeyRound, RefreshCw, CheckCircle } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { FundoraLogo } from '../../components/FundoraLogo';
import axios from 'axios';

export function ResetPasswordOTPPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    
    const lastIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastIndex]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post('http://localhost:5000/api/password/verify-otp', {
        email,
        otp: otpCode
      });

      setSuccess(true);
      
      // Redirect to new password page with reset token
      setTimeout(() => {
        navigate('/new-password', { 
          state: { 
            email: res.data.email,
            resetToken: res.data.resetToken 
          } 
        });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');

    try {
      await axios.post('http://localhost:5000/api/password/forgot', { email });
      setCountdown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <Card className="p-8 shadow-xl border-slate-200 bg-white max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">OTP Verified!</h2>
          <p className="text-slate-500">Redirecting to set new password...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/forgot-password" className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600 mb-8 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <Card className="p-6 md:p-8 shadow-xl border-slate-200 bg-white">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                <KeyRound className="w-6 h-6" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Enter Reset Code</h1>
            <p className="text-slate-500 mt-2">
              We've sent a 6-digit code to
            </p>
            <p className="text-sky-600 font-medium">{email}</p>
          </div>

          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg transition-all
                  ${error ? 'border-red-300 bg-red-50' : digit ? 'border-red-500 bg-red-50' : 'border-slate-200'}
                  focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200`}
              />
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center mb-4">{error}</div>
          )}

          <Button 
            onClick={handleVerify}
            disabled={loading || otp.some(d => !d)}
            className="w-full h-11 text-base bg-red-600 hover:bg-red-700 shadow-lg shadow-red-200 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Code'}
          </Button>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={handleResend}
              disabled={resendLoading || countdown > 0}
              className="inline-flex items-center gap-2 text-sky-600 font-medium hover:underline disabled:opacity-50 disabled:no-underline"
            >
              <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
              {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}

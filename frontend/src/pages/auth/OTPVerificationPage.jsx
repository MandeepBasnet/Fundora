import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { Button, Card } from '../../components/ui';
import { FundoraLogo } from '../../components/FundoraLogo';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

export function OTPVerificationPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const { setUserAndToken } = useAuth();
  
  // Get email from navigation state or redirect to signup
  const email = location.state?.email;
  const userName = location.state?.name || 'User';
  const userRole = location.state?.role || 'backer';

  useEffect(() => {
    if (!email) {
      navigate('/signup');
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
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
    
    // Focus last filled input or last input
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
      const res = await axios.post('http://localhost:5000/api/otp/verify', {
        email,
        otp: otpCode
      });

      // Auto-login: Store tokens and user data
      if (res.data.token) {
        setUserAndToken(res.data, res.data.token);
      }

      setSuccess(true);
      
      // Redirect to role-based dashboard after 1.5 seconds
      setTimeout(() => {
        const role = res.data.role || userRole;
        if (role === 'admin') {
          navigate('/admin');
        } else if (role === 'creator') {
          navigate('/creator');
        } else {
          navigate('/dashboard');
        }
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
      const res = await axios.post('http://localhost:5000/api/otp/resend', { email });
      setCountdown(60); // 60 second cooldown
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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Email Verified!</h2>
          <p className="text-slate-500">Logging you in automatically...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/signup" className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600 mb-8 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Sign Up
        </Link>

        <Card className="p-6 md:p-8 shadow-xl border-slate-200 bg-white">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-4">
              <FundoraLogo />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Verify Your Email</h1>
            <p className="text-slate-500 mt-2">
              We've sent a 6-digit code to
            </p>
            <p className="text-sky-600 font-medium">{email}</p>
          </div>

          {/* OTP Input */}
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
                  ${error ? 'border-red-300 bg-red-50' : digit ? 'border-sky-500 bg-sky-50' : 'border-slate-200'}
                  focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200`}
              />
            ))}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center mb-4">{error}</div>
          )}

          <Button 
            onClick={handleVerify}
            disabled={loading || otp.some(d => !d)}
            className="w-full h-11 text-base bg-sky-600 hover:bg-sky-700 shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>

          {/* Resend Section */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-500 mb-3">
              <Mail className="w-4 h-4" />
              <span className="text-sm">Didn't receive the code?</span>
            </div>
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

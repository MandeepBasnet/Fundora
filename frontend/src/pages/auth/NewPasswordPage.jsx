import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';
import { FundoraLogo } from '../../components/FundoraLogo';
import axios from 'axios';

export function NewPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const email = location.state?.email;
  const resetToken = location.state?.resetToken;

  useEffect(() => {
    if (!email || !resetToken) {
      navigate('/forgot-password');
    }
  }, [email, resetToken, navigate]);

  const calculateStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    return strength;
  };

  const strength = calculateStrength(password);

  const getStrengthColor = (index) => {
    if (strength === 0) return 'bg-slate-200';
    if (strength === 1) return index === 0 ? 'bg-red-500' : 'bg-slate-200';
    if (strength === 2) return index <= 1 ? 'bg-yellow-500' : 'bg-slate-200';
    if (strength === 3) return 'bg-green-500';
    return 'bg-slate-200';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.post('http://localhost:5000/api/password/reset', {
        email,
        resetToken,
        newPassword: password
      });

      setSuccess(true);
      
      setTimeout(() => {
        navigate('/login', { 
          state: { message: 'Password reset successfully! Please log in.' } 
        });
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
        <Card className="p-8 shadow-xl border-slate-200 bg-white max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h2>
          <p className="text-slate-500">Redirecting you to login...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/forgot-password" className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600 mb-8 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Start Over
        </Link>

        <Card className="p-6 md:p-8 shadow-xl border-slate-200 bg-white">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                <Lock className="w-6 h-6" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Set New Password</h1>
            <p className="text-slate-500 mt-2">
              Create a strong password for your account
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">New Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter new password" 
                  className="h-11 pr-10" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex gap-1 mt-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${getStrengthColor(i)}`}></div>
                ))}
              </div>
              <p className="text-xs text-slate-500">Must be at least 8 characters</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="relative">
                <Input 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Confirm new password" 
                  className="h-11 pr-10" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-500">Passwords match ✓</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={loading || password.length < 8 || password !== confirmPassword}
              className="w-full h-11 text-base bg-sky-600 hover:bg-sky-700 shadow-lg shadow-blue-200 disabled:opacity-50"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

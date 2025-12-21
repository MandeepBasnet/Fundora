import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';
import { FundoraLogo } from '../../components/FundoraLogo';

export function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState('backer');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await register(
        `${formData.firstName} ${formData.lastName}`,
        formData.email,
        formData.password,
        userType
      );
      // Redirect based on role
      if (userType === 'creator') {
         navigate('/creator');
      } else {
         navigate('/dashboard');
      }
    } catch (err) {
      setError(err);
    }
  };

  const calculateStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    return strength;
  };

  const strength = calculateStrength(formData.password);

  const getStrengthColor = (index) => {
    if (strength === 0) return 'bg-slate-200';
    if (strength === 1) return index === 0 ? 'bg-red-500' : 'bg-slate-200';
    if (strength === 2) return index <= 1 ? 'bg-yellow-500' : 'bg-slate-200';
    if (strength === 3) return 'bg-green-500';
    return 'bg-slate-200';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-600 hover:text-sky-600 mb-8 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <Card className="p-6 md:p-8 shadow-xl border-slate-200 bg-white">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-4">
              <FundoraLogo />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create Account</h1>
            <p className="text-slate-500 mt-2">Join the community of changemakers</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <div className="text-red-500 text-sm text-center">{error}</div>}
            {/* User Type Selector */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div 
                className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${userType === 'backer' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => setUserType('backer')}
              >
                <div className="font-bold text-sm">Backer</div>
                <div className="text-xs opacity-80">I want to support</div>
              </div>
              <div 
                className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${userType === 'creator' ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => setUserType('creator')}
              >
                <div className="font-bold text-sm">Creator</div>
                <div className="text-xs opacity-80">I want to build</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">First Name</label>
                <Input 
                  name="firstName"
                  placeholder="John" 
                  className="h-11" 
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Last Name</label>
                <Input 
                  name="lastName"
                  placeholder="Doe" 
                  className="h-11" 
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input 
                type="email" 
                name="email"
                placeholder="name@company.com" 
                className="h-11" 
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  name="password"
                  placeholder="Create a password" 
                  className="h-11 pr-10" 
                  value={formData.password}
                  onChange={handleChange}
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

            <div className="flex items-start gap-3 pt-2">
              <input type="checkbox" id="terms" className="mt-1 h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-blue-500" required />
              <label htmlFor="terms" className="text-sm text-slate-600">
                I agree to the <a href="#" className="text-sky-600 hover:underline">Terms of Service</a> and <a href="#" className="text-sky-600 hover:underline">Privacy Policy</a>
              </label>
            </div>

            <Button type="submit" className="w-full h-11 text-base bg-sky-600 hover:bg-sky-700 shadow-lg shadow-blue-200">
              Create Account
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-sky-600 font-bold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

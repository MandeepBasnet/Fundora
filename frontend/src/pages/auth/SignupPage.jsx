import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Card } from '../../components/ui';
import { FundoraLogo } from '../../components/FundoraLogo';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export function SignupPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'backer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    const res = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    });

    if (res.success) {
      if (formData.role === 'creator') {
        navigate('/creator');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8 border-slate-200 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <FundoraLogo className="h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Create an account</h2>
          <p className="mt-2 text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <div className="mt-1 relative">
                <Input
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="John Doe"
                />
                <User className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Email address</label>
              <div className="mt-1 relative">
                <Input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="you@example.com"
                />
                <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="mt-1 relative">
                <Input
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="••••••••"
                />
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="mt-1 relative">
                <Input
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10"
                  placeholder="••••••••"
                />
                <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">I want to...</label>
              <div className="mt-1 grid grid-cols-2 gap-4">
                <div 
                  className={`border rounded-lg p-3 cursor-pointer text-center transition-all ${formData.role === 'backer' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-slate-300'}`}
                  onClick={() => setFormData({ ...formData, role: 'backer' })}
                >
                  <p className="font-medium">Back Projects</p>
                </div>
                <div 
                  className={`border rounded-lg p-3 cursor-pointer text-center transition-all ${formData.role === 'creator' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'bg-white border-slate-300'}`}
                  onClick={() => setFormData({ ...formData, role: 'creator' })}
                >
                  <p className="font-medium">Raise Funds</p>
                </div>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
      </Card>
    </div>
  );
}

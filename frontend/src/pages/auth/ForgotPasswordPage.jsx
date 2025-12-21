import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Card } from '../../components/ui';
import { FundoraLogo } from '../../components/FundoraLogo';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8 p-8 border-slate-200 shadow-lg">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <FundoraLogo className="h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Reset password</h2>
          <p className="mt-2 text-sm text-slate-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {submitted ? (
          <div className="text-center space-y-6">
            <div className="bg-green-50 text-green-700 p-4 rounded-lg flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8" />
              <p className="font-medium">Check your email</p>
              <p className="text-sm">We've sent password reset instructions to {email}</p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Return to login
              </Button>
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4 rounded-md shadow-sm">
              <div>
                <label className="text-sm font-medium text-slate-700">Email address</label>
                <div className="mt-1 relative">
                  <Input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="you@example.com"
                  />
                  <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </Button>

            <div className="text-center">
              <Link to="/login" className="font-medium text-sm text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { Button, Card, Input } from '../../components/ui';
import { FundoraLogo } from '../../components/FundoraLogo';

export function ForgotPassword() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>
      
      <div className="w-full max-w-md relative z-10">
        <Link to="/login" className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 mb-8 transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <Card className="p-6 md:p-8 shadow-xl border-slate-200 bg-white">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                <Mail className="w-6 h-6" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Forgot Password?</h1>
            <p className="text-slate-500 mt-2">No worries, we'll send you reset instructions.</p>
          </div>

          <form className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input type="email" placeholder="name@company.com" className="h-11" />
            </div>

            <Button className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
              Reset Password
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Remember your password?{' '}
              <Link to="/login" className="text-blue-600 font-bold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

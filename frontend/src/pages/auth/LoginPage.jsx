import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import { Button, Card, Input } from '../components/ui';
import { FundoraLogo } from '../components/FundoraLogo';

export function LoginPage() {
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
            <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Sign in to continue to your dashboard</p>
          </div>

          <form className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email Address</label>
              <Input type="email" placeholder="name@company.com" className="h-11" />
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Input type="password" placeholder="Enter your password" className="h-11 pr-10" />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="remember" className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-blue-500" />
                  <label htmlFor="remember" className="text-sm text-slate-600">Remember me</label>
                </div>
                <Link to="/forgot-password" className="text-sm text-sky-600 hover:underline font-medium">Forgot password?</Link>
              </div>
            </div>

            <Button className="w-full h-11 text-base bg-sky-600 hover:bg-sky-700 shadow-lg shadow-blue-200">
              Sign In
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              Don't have an account?{' '}
              <Link to="/signup" className="text-sky-600 font-bold hover:underline">
                Sign up for free
              </Link>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}

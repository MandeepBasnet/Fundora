import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, UserPlus } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const Forbidden403 = () => {
  const location = useLocation();
  const from = location.state?.from || '';

  const isCampaignCreation = from.includes('start-campaign') || from.includes('edit-campaign');

  return (
    <div className="min-h-[80vh] bg-white flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Access Denied</h1>
        
        <div className="text-slate-600 mb-8 space-y-4">
          <p>You do not have permission to view this page.</p>
          
          {isCampaignCreation && (
            <div className="bg-sky-50 border border-sky-100 text-sky-800 p-4 rounded-lg text-sm text-left">
              <strong className="block font-bold mb-1">Want to start a campaign?</strong>
              Your current account is registered as a <strong>Backer</strong>. To raise funds and create your own campaigns, you need a Creator account. Please create a new account and select <strong>Creator</strong> as your role during sign-up to continue.
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {isCampaignCreation && (
            <Link to="/signup" className="w-full">
              <Button className="w-full h-11 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Sign Up as Creator
              </Button>
            </Link>
          )}
          <Link to="/" className="w-full">
            <Button variant="outline" className="w-full h-11 border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

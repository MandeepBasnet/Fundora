import React from 'react';
import { Link } from 'react-router-dom';
import { FundoraLogo } from './FundoraLogo';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-200 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <FundoraLogo invert className="mb-4" />
            <p className="text-slate-400 text-sm">Empowering the next generation of Nepali creators and innovators.</p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Discover</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Tech & Innovation</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Creative Works</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Community Projects</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">For Creators</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Start a Campaign</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Creator Handbook</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Success Stories</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-white mb-4">Connect</h4>
            <ul className="space-y-2 text-slate-400 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link to="/" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-sm">© 2025 Fundora Nepal. All rights reserved.</p>
          <div className="flex gap-4">
             <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded">Secured by eSewa</div>
             <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded">Secured by Khalti</div>
          </div>
        </div>
      </div>
    </footer>
  );
}

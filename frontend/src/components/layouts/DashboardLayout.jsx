import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../Sidebar';

export function DashboardLayout() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="hidden lg:block lg:col-span-1">
          <Sidebar className="sticky top-24" />
        </div>
        <div className="lg:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

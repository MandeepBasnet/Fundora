import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, DollarSign, Flag, ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle, FileText
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { adminData } from '../../mockData';

export function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
        <p className="text-slate-500">Platform statistics and action items</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* ... (keep stats cards) */}
        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 text-sky-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-none">Active: {adminData.activeCampaigns}</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{adminData.totalCampaigns}</div>
          <div className="text-sm text-slate-500">Total Campaigns</div>
        </Card>

        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{adminData.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-slate-500">Total Users</div>
        </Card>

        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-none">Rev: Rs. {adminData.monthlyRevenue.toLocaleString()}</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">Rs. {(adminData.totalFunding/1000000).toFixed(1)}M</div>
          <div className="text-sm text-slate-500">Total Volume</div>
        </Card>

        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-none">{adminData.platformSuccessRate}% Success</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">High</div>
          <div className="text-sm text-slate-500">Platform Health</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Action Items */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-lg text-slate-900">Action Required</h3>
          
          <div className="grid sm:grid-cols-3 gap-4">
            <Link to="/admin/campaigns">
              <Card className="p-6 border-l-4 border-l-blue-500 cursor-pointer hover:bg-slate-50 h-full">
                <div className="flex justify-between items-start mb-2">
                  <ShieldAlert className="w-6 h-6 text-blue-500" />
                  <Badge className="bg-blue-100 text-blue-700">{adminData.pendingApprovals}</Badge>
                </div>
                <h4 className="font-bold text-slate-900">Campaign Approvals</h4>
                <p className="text-xs text-slate-500 mt-1">Pending review</p>
              </Card>
            </Link>

            <Link to="/admin/campaigns">
              <Card className="p-6 border-l-4 border-l-orange-500 cursor-pointer hover:bg-slate-50 h-full">
                <div className="flex justify-between items-start mb-2">
                  <CheckCircle2 className="w-6 h-6 text-orange-500" />
                  <Badge className="bg-orange-100 text-orange-700">{adminData.pendingReviews}</Badge>
                </div>
                <h4 className="font-bold text-slate-900">Milestone Reviews</h4>
                <p className="text-xs text-slate-500 mt-1">Proof submitted</p>
              </Card>
            </Link>

            <Link to="/admin/moderation">
              <Card className="p-6 border-l-4 border-l-red-500 cursor-pointer hover:bg-slate-50 h-full">
                <div className="flex justify-between items-start mb-2">
                  <Flag className="w-6 h-6 text-red-500" />
                  <Badge className="bg-red-100 text-red-700">{adminData.flaggedCampaigns}</Badge>
                </div>
                <h4 className="font-bold text-slate-900">Flagged Content</h4>
                <p className="text-xs text-slate-500 mt-1">Requires moderation</p>
              </Card>
            </Link>
          </div>

          <Card className="p-6 border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900">Recent Activity Log</h3>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {adminData.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className={`p-2 rounded-full mt-1 ${
                    activity.type === 'flag' ? 'bg-red-100 text-red-600' : 
                    activity.type === 'large_backing' ? 'bg-green-100 text-green-600' : 
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {activity.type === 'flag' ? <Flag className="w-4 h-4" /> : 
                     activity.type === 'large_backing' ? <DollarSign className="w-4 h-4" /> : 
                     <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.message}</p>
                    <p className="text-xs text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Navigation */}
        <div className="space-y-6">
          <Card className="p-6 border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Quick Navigation</h3>
            <div className="space-y-2">
              <Link to="/admin/campaigns">
                <Button className="w-full justify-start bg-slate-900 hover:bg-slate-800 text-white">
                  <ShieldAlert className="w-4 h-4 mr-2" /> Review Campaigns
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" /> Manage Users
                </Button>
              </Link>
              <Link to="/admin/moderation">
                <Button variant="outline" className="w-full justify-start">
                  <Flag className="w-4 h-4 mr-2" /> Moderation Queue
                </Button>
              </Link>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="w-4 h-4 mr-2" /> Financial Reports
              </Button>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none">
            <h3 className="font-bold text-lg mb-2">System Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Server Load</span>
                <span className="text-green-400 font-medium">Normal (12%)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Database</span>
                <span className="text-green-400 font-medium">Connected</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300">Payment Gateway</span>
                <span className="text-green-400 font-medium">Operational</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

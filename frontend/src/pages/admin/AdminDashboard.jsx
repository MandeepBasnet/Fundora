import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, DollarSign, Flag, ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle, FileText, Loader2, AlertCircle
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export function AdminDashboard() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error('Error fetching admin dashboard:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-sky-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center text-red-600 border-red-200 bg-red-50">
        <AlertCircle className="w-10 h-10 mx-auto mb-4" />
        <h2 className="text-lg font-bold">Error</h2>
        <p>{error}</p>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Overview</h1>
        <p className="text-slate-500">Platform statistics and action items</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 text-sky-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-none">Active: {data.activeCampaigns}</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{data.totalCampaigns}</div>
          <div className="text-sm text-slate-500">Total Campaigns</div>
        </Card>

        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{data.totalUsers.toLocaleString()}</div>
          <div className="text-sm text-slate-500">Total Users</div>
        </Card>

        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-none">Rev: Rs. {data.monthlyRevenue?.toLocaleString() || 0}</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">Rs. {((data.totalFunding || 0) / 1000000).toFixed(1)}M</div>
          <div className="text-sm text-slate-500">Total Volume</div>
        </Card>

        <Card className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-none">{data.platformSuccessRate || 85}% Success</Badge>
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
                  <Badge className="bg-blue-100 text-blue-700">{data.pendingApprovals}</Badge>
                </div>
                <h4 className="font-bold text-slate-900">Campaign Approvals</h4>
                <p className="text-xs text-slate-500 mt-1">Pending review</p>
              </Card>
            </Link>

            <Link to="/admin/milestone-review">
              <Card className="p-6 border-l-4 border-l-orange-500 cursor-pointer hover:bg-slate-50 h-full">
                <div className="flex justify-between items-start mb-2">
                  <CheckCircle2 className="w-6 h-6 text-orange-500" />
                  <Badge className="bg-orange-100 text-orange-700">{data.pendingReviews}</Badge>
                </div>
                <h4 className="font-bold text-slate-900">Milestone Reviews</h4>
                <p className="text-xs text-slate-500 mt-1">Proof submitted</p>
              </Card>
            </Link>

            <Link to="/admin/moderation">
              <Card className="p-6 border-l-4 border-l-red-500 cursor-pointer hover:bg-slate-50 h-full">
                <div className="flex justify-between items-start mb-2">
                  <Flag className="w-6 h-6 text-red-500" />
                  <Badge className="bg-red-100 text-red-700">{data.flaggedCampaigns}</Badge>
                </div>
                <h4 className="font-bold text-slate-900">Flagged Content</h4>
                <p className="text-xs text-slate-500 mt-1">Requires moderation</p>
              </Card>
            </Link>
          </div>

          <Card className="p-6 border-slate-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-slate-900">Recent Activity Log</h3>
            </div>
            {(!data.recentActivity || data.recentActivity.length === 0) ? (
              <p className="text-sm text-slate-500">No recent activity.</p>
            ) : (
              <div className="space-y-4">
                {data.recentActivity.map((activity) => (
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
            )}
          </Card>
        </div>

        {/* Quick Navigation */}
        <div className="space-y-6">
          <Card className="p-6 border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Quick Navigation</h3>
            <div className="space-y-2">
              <Link to="/admin/campaigns">
                <Button variant="outline" className="w-full justify-start hover:bg-sky-600 hover:text-white hover:border-sky-600">
                  <ShieldAlert className="w-4 h-4 mr-2" /> Review Campaigns
                </Button>
              </Link>
              <Link to="/admin/users">
                <Button variant="outline" className="w-full justify-start hover:bg-sky-600 hover:text-white hover:border-sky-600">
                  <Users className="w-4 h-4 mr-2" /> Manage Users
                </Button>
              </Link>
              <Link to="/admin/moderation">
                <Button variant="outline" className="w-full justify-start hover:bg-sky-600 hover:text-white hover:border-sky-600">
                  <Flag className="w-4 h-4 mr-2" /> Moderation Queue
                </Button>
              </Link>
              <Link to="/admin/financial-reports">
                <Button variant="outline" className="w-full justify-start hover:bg-sky-600 hover:text-white hover:border-sky-600">
                  <DollarSign className="w-4 h-4 mr-2" /> Financial Reports
                </Button>
              </Link>
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

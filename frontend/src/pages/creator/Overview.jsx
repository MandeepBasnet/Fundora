import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, DollarSign, CheckCircle2, Clock, AlertCircle, Upload, Eye, TrendingUp, Wallet, Users, Loader2
} from 'lucide-react';
import { Button, Card, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export function Overview() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/dashboard/creator`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
      } catch (err) {
        console.error('Error fetching creator dashboard:', err);
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

  const percentageFunded = data.goal > 0 ? Math.round((data.totalRaised / data.goal) * 100) : 0;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Creator Dashboard</h1>
          <p className="text-slate-500">Welcome back, {user?.name || 'Creator'}</p>
        </div>
        <Link to="/start-campaign">
          <Button className="bg-sky-600 hover:bg-sky-700 gap-2 h-11 px-6 shadow-lg shadow-blue-200">
            <PlusCircle className="h-5 w-5" /> Start New Campaign
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <Card className="p-6 border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <DollarSign className="w-6 h-6 text-sky-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">Rs. {data.totalRaised.toLocaleString()}</div>
          <div className="text-sm text-slate-500 font-medium">Total Raised</div>
          <Progress value={percentageFunded} className="mt-4 h-1.5" />
        </Card>

        <Card className="p-6 border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{data.backers.toLocaleString()}</div>
          <div className="text-sm text-slate-500 font-medium">Total Backers</div>
        </Card>

        <Card className="p-6 border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-xl">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{data.views.toLocaleString()}</div>
          <div className="text-sm text-slate-500 font-medium">Campaign Views</div>
        </Card>

        <Card className="p-6 border-none shadow-md hover:shadow-lg transition-shadow bg-slate-900 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/10 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-blue-500 text-white border-none">Active</Badge>
          </div>
          <div className="text-xl font-bold mb-1 truncate">{data.campaignTitle}</div>
          <div className="text-sm text-slate-400 font-medium">Current Campaign</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Milestones & Actions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Campaign Banner */}
          {data.campaignTitle !== 'No Active Campaign' && (
            <Card className="p-6 border-l-4 border-l-blue-600 bg-white shadow-md">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-slate-900">{data.campaignTitle}</h3>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Live</Badge>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-slate-500">
                    <span className="flex items-center gap-1"><DollarSign className="w-4 h-4"/> Goal: Rs. {data.goal.toLocaleString()}</span>
                  </div>
                </div>
                <Link to="/creator/campaigns">
                  <Button variant="outline">Manage</Button>
                </Link>
              </div>
              
              {data.pendingMilestones.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-200 rounded-lg text-blue-700">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-slate-900">Next Milestone: {data.pendingMilestones[0].title}</h4>
                      </div>
                      <p className="text-sm text-slate-600 mb-4">
                        Please submit verification documents to unlock the next fund release of <strong>Rs. {data.pendingMilestones[0].fundAmount.toLocaleString()}</strong>.
                      </p>
                      <Link to="/creator/milestones">
                        <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800">
                          <Upload className="w-4 h-4 mr-2" /> Upload Proof
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Milestones Tabs */}
          <Card className="p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Milestone Tracker</h2>
            </div>
            
            <Tabs defaultValue="pending">
              <TabsList className="mb-6 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                <TabsTrigger value="pending" className="flex-1 sm:flex-none px-6">Pending ({data.pendingMilestones.length})</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 sm:flex-none px-6">Completed ({data.completedMilestones.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 animate-in fade-in-50">
                {data.pendingMilestones.length === 0 ? (
                  <p className="text-slate-500 py-4 text-center">No pending milestones.</p>
                ) : (
                  data.pendingMilestones.map((milestone) => (
                    <div key={milestone.id} className="border border-slate-200 rounded-xl p-5 hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{milestone.title}</h3>
                            <p className="text-sm text-slate-500">{milestone.description}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-blue-600 bg-blue-50 border-blue-100">In Progress</Badge>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className="text-sm font-medium text-slate-600">
                          Unlocks: <span className="text-slate-900">Rs. {milestone.fundAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-slate-500">
                          Deadline: {new Date(milestone.deadline).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 animate-in fade-in-50">
                {data.completedMilestones.length === 0 ? (
                  <p className="text-slate-500 py-4 text-center">No completed milestones.</p>
                ) : (
                  data.completedMilestones.map((milestone) => (
                    <div key={milestone.id} className="border border-green-200 bg-green-50/30 rounded-xl p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex gap-4">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{milestone.title}</h3>
                            <p className="text-sm text-green-700 font-medium flex items-center gap-1">
                              Funds Released <CheckCircle2 className="w-3 h-3"/>
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-4 border-t border-green-100">
                        <div className="text-sm font-medium text-slate-600">
                          Amount: <span className="text-slate-900">Rs. {milestone.fundAmount.toLocaleString()}</span>
                        </div>
                        <div className="text-sm text-slate-500">
                          Completed: {new Date(milestone.completedDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column: Activity & Funds */}
        <div className="space-y-8">
          <Card className="p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Recent Backers</h3>
            {data.recentBackers.length === 0 ? (
              <p className="text-slate-500 py-4">No recent backers.</p>
            ) : (
              <div className="space-y-6">
                {data.recentBackers.map((backer, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                      {backer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">{backer.name}</div>
                      <div className="text-xs text-slate-500">backed your campaign</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">+ Rs. {backer.amount.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">{backer.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Link to="/creator/transactions">
              <Button variant="outline" className="w-full mt-6 text-sm">View All Transactions</Button>
            </Link>
          </Card>

          <Card className="p-6 bg-slate-900 text-white">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Funds Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-slate-400 text-sm">Total Raised</span>
                <span className="font-bold text-lg">Rs. {data.fundsOverview.totalRaised.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-slate-400 text-sm">Available for Release</span>
                <span className="font-bold text-lg text-green-400">Rs. {data.fundsOverview.availableForRelease.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Pending Milestones</span>
                <span className="font-bold text-lg text-orange-400">Rs. {data.fundsOverview.pendingMilestones.toLocaleString()}</span>
              </div>
            </div>
            <Link to="/creator/finances">
              <Button className="w-full mt-6 bg-white text-slate-900 hover:bg-slate-100 font-bold">
                Payout Settings
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}

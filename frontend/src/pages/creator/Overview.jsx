import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlusCircle, DollarSign, CheckCircle2, Clock, AlertCircle, Upload, Eye, TrendingUp, Wallet, Users
} from 'lucide-react';
import { Button, Card, Badge, Progress, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { dashboardData } from '../../mockData';

export function Overview() {
  const percentageFunded = Math.round((dashboardData.totalRaised / dashboardData.goal) * 100);

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Creator Dashboard</h1>
          <p className="text-slate-500">Welcome back, TechFarm Nepal</p>
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
            <Badge className="bg-green-100 text-green-700 border-none">+12%</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">Rs. {dashboardData.totalRaised.toLocaleString()}</div>
          <div className="text-sm text-slate-500 font-medium">Total Raised</div>
          <Progress value={percentageFunded} className="mt-4 h-1.5" />
        </Card>

        <Card className="p-6 border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-none">+8%</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{dashboardData.backers}</div>
          <div className="text-sm text-slate-500 font-medium">Total Backers</div>
        </Card>

        <Card className="p-6 border-none shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-xl">
              <Eye className="w-6 h-6 text-orange-600" />
            </div>
            <Badge className="bg-green-100 text-green-700 border-none">+24%</Badge>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">{dashboardData.views.toLocaleString()}</div>
          <div className="text-sm text-slate-500 font-medium">Campaign Views</div>
        </Card>

        <Card className="p-6 border-none shadow-md hover:shadow-lg transition-shadow bg-slate-900 text-white">
          <div className="flex items-start justify-between mb-4">
            <div className="bg-white/10 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <Badge className="bg-blue-500 text-white border-none">Active</Badge>
          </div>
          <div className="text-3xl font-bold mb-1">12</div>
          <div className="text-sm text-slate-400 font-medium">Days Remaining</div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Milestones & Actions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Campaign Banner */}
          <Card className="p-6 border-l-4 border-l-blue-600 bg-white shadow-md">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-lg text-slate-900">{dashboardData.campaignTitle}</h3>
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">Live</Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4"/> Goal: Rs. {dashboardData.goal.toLocaleString()}</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> 12 Days Left</span>
                </div>
              </div>
              <Button variant="outline">Manage</Button>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-200 rounded-lg text-blue-700">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold text-slate-900">Action Required: Milestone Proof</h4>
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Due in 3 days</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">
                    You have completed the "Field Testing" phase. Please submit verification documents to unlock the next fund release of <strong>Rs. 200,000</strong>.
                  </p>
                  <Button className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800">
                    <Upload className="w-4 h-4 mr-2" /> Upload Proof
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Milestones Tabs */}
          <Card className="p-6 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900">Milestone Tracker</h2>
            </div>
            
            <Tabs defaultValue="pending">
              <TabsList className="mb-6 bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                <TabsTrigger value="pending" className="flex-1 sm:flex-none px-6">Pending ({dashboardData.pendingMilestones.length})</TabsTrigger>
                <TabsTrigger value="completed" className="flex-1 sm:flex-none px-6">Completed ({dashboardData.completedMilestones.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending" className="space-y-4 animate-in fade-in-50">
                {dashboardData.pendingMilestones.map((milestone) => (
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
                ))}
              </TabsContent>

              <TabsContent value="completed" className="space-y-4 animate-in fade-in-50">
                {dashboardData.completedMilestones.map((milestone) => (
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
                      <Button variant="ghost" size="sm" className="text-slate-500">View Proof</Button>
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
                ))}
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right Column: Activity & Funds */}
        <div className="space-y-8">
          <Card className="p-6">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-6">
              {dashboardData.recentBackers.map((backer, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                    {backer.name.charAt(0)}
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
            <Button variant="outline" className="w-full mt-6 text-sm">View All Transactions</Button>
          </Card>

          <Card className="p-6 bg-slate-900 text-white">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Funds Overview
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-slate-400 text-sm">Total Raised</span>
                <span className="font-bold text-lg">Rs. 387,500</span>
              </div>
              <div className="flex justify-between items-center pb-4 border-b border-white/10">
                <span className="text-slate-400 text-sm">Available for Release</span>
                <span className="font-bold text-lg text-green-400">Rs. 250,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Pending Milestones</span>
                <span className="font-bold text-lg text-orange-400">Rs. 137,500</span>
              </div>
            </div>
            <Button className="w-full mt-6 bg-white text-slate-900 hover:bg-slate-100 font-bold">
              Payout Settings
            </Button>
          </Card>
        </div>
      </div>
    </>
  );
}

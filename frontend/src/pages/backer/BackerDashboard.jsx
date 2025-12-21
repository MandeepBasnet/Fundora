import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, TrendingUp, Clock, MessageSquare, ExternalLink } from 'lucide-react';
import { Button, Card, Progress, Badge } from '../../components/ui';
import { backerData } from '../../mockData';

export function BackerDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Backer Dashboard</h1>
        <p className="text-slate-500">Track your impact and discover new projects</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-sky-600 text-white border-none">
          <div className="flex items-center gap-3 mb-4 text-blue-100">
            <div className="p-2 bg-white/10 rounded-lg"><Heart className="h-5 w-5" /></div>
            <span className="font-medium">Total Contributed</span>
          </div>
          <div className="text-3xl font-bold mb-1">Rs. {backerData.totalBacked.toLocaleString()}</div>
          <p className="text-sm text-blue-100 mt-2">Across {backerData.campaignsBacked} campaigns</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4 text-slate-500">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp className="h-5 w-5" /></div>
            <span className="font-medium">Impact Score</span>
          </div>
          <div className="text-3xl font-bold text-slate-900 mb-1">Top 10%</div>
          <p className="text-sm text-slate-500 mt-2">You're a super backer!</p>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Campaigns */}
          <Card className="p-6 border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-6">Active Campaigns</h3>
            <div className="space-y-6">
              {backerData.activeCampaigns.map((campaign) => (
                <div key={campaign.id} className="flex gap-4 items-start pb-6 border-b border-slate-100 last:border-0 last:pb-0">
                  <img src={campaign.image} alt={campaign.title} className="w-24 h-16 object-cover rounded-lg bg-slate-100" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-slate-900">{campaign.title}</h4>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">{campaign.daysLeft} days left</Badge>
                    </div>
                    <p className="text-sm text-slate-500 mb-3">by {campaign.creator}</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Backed: Rs. {campaign.amountBacked.toLocaleString()}</span>
                        <span>{campaign.progress}% Funded</span>
                      </div>
                      <Progress value={campaign.progress} className="h-1.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/backer/supported">
              <Button variant="outline" className="w-full mt-6">View All Supported Projects</Button>
            </Link>
          </Card>

          {/* Recommended */}
          <Card className="p-6 border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-6">Recommended for You</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {backerData.recommended.map((campaign) => (
                <div key={campaign.id} className="group cursor-pointer">
                  <div className="h-32 overflow-hidden rounded-lg mb-3 relative">
                    <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <h4 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors">{campaign.title}</h4>
                  <p className="text-xs text-slate-500">{campaign.category}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="p-6 border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" /> Transaction History
              </Button>
              <Link to="/backer/messages">
                <Button variant="outline" className="w-full justify-start">
                  <MessageSquare className="w-4 h-4 mr-2" /> Message Creators
                </Button>
              </Link>
              <Link to="/campaigns">
                <Button className="w-full justify-start bg-sky-600 hover:bg-blue-700 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" /> Browse Campaigns
                </Button>
              </Link>
            </div>
          </Card>

          {/* Recent Transactions */}
          <Card className="p-6 border-slate-200">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {backerData.recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-full text-slate-500 mt-1">
                    <Clock className="w-3 h-3" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{txn.description}</p>
                    <p className="text-xs text-slate-500">{txn.date}</p>
                    <p className="text-xs font-bold text-slate-900 mt-1">- Rs. {txn.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

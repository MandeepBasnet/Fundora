import React, { useState } from 'react';
import { Plus, Search, Filter, MoreVertical, Edit3, BarChart2, Eye, Upload, X, CheckCircle2 } from 'lucide-react';
import { Button, Card, Input, Badge, Progress } from '../../components/ui';
import { creatorCampaigns } from '../../mockData';

export function MyCampaigns() {
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleOpenMilestoneModal = (campaign) => {
    setSelectedCampaign(campaign);
    setShowMilestoneModal(true);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Campaigns</h1>
          <p className="text-slate-500">Manage your projects and track progress</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Start New Campaign
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Search campaigns..." className="pl-9 bg-white" />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>

      {/* Campaign List */}
      <div className="space-y-4">
        {creatorCampaigns.map((campaign) => (
          <Card key={campaign.id} className="p-5 hover:shadow-md transition-shadow border-slate-200">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Image */}
              <div className="w-full md:w-48 h-32 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                <img src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" />
              </div>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-slate-900">{campaign.title}</h3>
                        <Badge variant="outline" className={getStatusColor(campaign.status)}>
                          {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">Created on Jan 15, 2024 • ID: #{campaign.id}</p>        
                    </div>
                    <button className="text-slate-400 hover:text-slate-600">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {campaign.status !== 'draft' && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-900">Rs. {campaign.raised.toLocaleString()}</span>    
                      <span className="text-slate-500">{Math.round((campaign.raised/campaign.goal)*100)}% of Rs. {campaign.goal.toLocaleString()}</span>
                    </div>
                    <Progress value={(campaign.raised/campaign.goal)*100} className="h-2" />
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                <Button variant="outline" size="sm" className="justify-start gap-2">
                  <Edit3 className="h-4 w-4" /> Edit
                </Button>
                <Button variant="outline" size="sm" className="justify-start gap-2">
                  <BarChart2 className="h-4 w-4" /> Stats
                </Button>
                {campaign.status === 'active' && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                    onClick={() => handleOpenMilestoneModal(campaign)}
                  >
                    <CheckCircle2 className="h-4 w-4" /> Submit Proof
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Milestone Submission Modal */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg bg-white shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Submit Milestone Proof</h2>
              <button onClick={() => setShowMilestoneModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 mb-4">
                <p>Submitting proof for: <strong>Prototype Development</strong> (25% Release)</p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Progress Description</label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="Describe what has been achieved..."
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Evidence Upload</label>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50">
                  <div className="inline-flex p-3 bg-white rounded-full shadow-sm mb-3">
                    <Upload className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-slate-600">Click to upload images, videos or documents</p>
                  <p className="text-xs text-slate-400 mt-1">Max file size: 10MB</p>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Next Milestone Estimate</label>
                <Input type="date" />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowMilestoneModal(false)}>Cancel</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Submit for Review</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

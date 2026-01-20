import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, MoreVertical, Edit3, BarChart2, Eye, Trash2, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button, Card, Input, Badge, Progress } from '../../components/ui';
import campaignService from '../../services/campaignService';

export function MyCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getMyCampaigns();
      setCampaigns(data);
    } catch (err) {
      setError('Failed to load campaigns');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200';
      case 'draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const handleOpenMilestoneModal = (campaign) => {
    setSelectedCampaign(campaign);
    setShowMilestoneModal(true);
  };

  const handleEditCampaign = (campaignId) => {
    navigate(`/edit-campaign/${campaignId}`);
  };

  const handleDeleteCampaign = async (campaignId) => {
    try {
      setDeleting(true);
      await campaignService.deleteCampaign(campaignId);
      setCampaigns(campaigns.filter(c => c._id !== campaignId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete campaign');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewCampaign = (campaignId) => {
    navigate(`/campaigns/${campaignId}`);
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Campaigns</h1>
          <p className="text-slate-500">Manage your projects and track progress</p>
        </div>
        <Button 
          onClick={() => navigate('/start-campaign')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" /> Start New Campaign
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search campaigns..." 
            className="pl-9 bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-md border border-slate-300 bg-white text-sm"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="pending">Pending</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Campaign List */}
      {filteredCampaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-slate-400 mb-4">
            <Plus className="w-12 h-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">No campaigns yet</h3>
          <p className="text-slate-500 mb-4">Start your first campaign to bring your ideas to life!</p>
          <Button 
            onClick={() => navigate('/start-campaign')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Start Your First Campaign
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign._id} className="p-5 hover:shadow-md transition-shadow border-slate-200">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Image */}
                <div className="w-full md:w-48 h-32 shrink-0 rounded-lg overflow-hidden bg-slate-100">
                  {campaign.coverImage || campaign.images?.[0]?.url ? (
                    <img 
                      src={campaign.coverImage || campaign.images[0].url} 
                      alt={campaign.title} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      No Image
                    </div>
                  )}
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
                        <p className="text-sm text-slate-500">
                          {campaign.category} • Created {new Date(campaign.createdAt).toLocaleDateString()}
                        </p>
                        {campaign.shortDescription && (
                          <p className="text-sm text-slate-600 mt-1 line-clamp-1">{campaign.shortDescription}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {campaign.status !== 'draft' && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-900">
                          Rs. {(campaign.currentAmount || 0).toLocaleString()}
                        </span>
                        <span className="text-slate-500">
                          {campaign.fundingProgress || 0}% of Rs. {(campaign.fundingGoal || 0).toLocaleString()}
                        </span>
                      </div>
                      <Progress value={campaign.fundingProgress || 0} className="h-2" />
                      {campaign.daysRemaining !== null && (
                        <p className="text-xs text-slate-500">{campaign.daysRemaining} days remaining</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-[140px]">
                  {(campaign.status === 'draft' || campaign.status === 'pending') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start gap-2"
                      onClick={() => handleEditCampaign(campaign._id)}
                    >
                      <Edit3 className="h-4 w-4" /> Edit
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="justify-start gap-2"
                    onClick={() => handleViewCampaign(campaign._id)}
                  >
                    <Eye className="h-4 w-4" /> View
                  </Button>

                  {campaign.status === 'active' && campaign.fundingType === 'milestone-based' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                      onClick={() => handleOpenMilestoneModal(campaign)}
                    >
                      <CheckCircle2 className="h-4 w-4" /> Submit Proof
                    </Button>
                  )}

                  {campaign.status === 'draft' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => setShowDeleteConfirm(campaign._id)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white shadow-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Delete Campaign?</h2>
            <p className="text-slate-600 mb-6">This action cannot be undone. Are you sure you want to delete this draft campaign?</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => handleDeleteCampaign(showDeleteConfirm)}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Milestone Submission Modal */}
      {showMilestoneModal && selectedCampaign && (
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
                <p>Campaign: <strong>{selectedCampaign.title}</strong></p>
              </div>

              {selectedCampaign.milestones?.map((milestone, idx) => (
                milestone.status === 'pending' && (
                  <div key={idx} className="p-4 border rounded-lg">
                    <p className="font-medium">{milestone.title}</p>
                    <p className="text-sm text-slate-500">{milestone.percentage}% of funds</p>
                  </div>
                )
              ))}

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-700">Progress Description</label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  placeholder="Describe what has been achieved..."
                />
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

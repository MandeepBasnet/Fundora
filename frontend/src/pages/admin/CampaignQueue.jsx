import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, Eye, Clock, 
  Loader2, AlertCircle, X, Check, Image as ImageIcon
} from 'lucide-react';
import { Button, Card, Badge, Tabs, TabsList, TabsTrigger, TabsContent, Input } from '../../components/ui';
import adminService from '../../services/adminService';

// Rejection reasons mapping
const REJECTION_REASONS = {
  unrealistic_goals: 'Unrealistic Goals',
  inappropriate_content: 'Inappropriate Content',
  incomplete_information: 'Incomplete Information',
  copyright_issues: 'Copyright Issues',
  violates_guidelines: 'Violates Community Guidelines',
  duplicate_campaign: 'Duplicate Campaign',
  insufficient_details: 'Insufficient Details',
  misleading_information: 'Misleading Information',
  other: 'Other'
};

// Approval checklist items
const CHECKLIST_ITEMS = [
  'Follows community guidelines',
  'Realistic goal and rewards',
  'Clear and complete description',
  'Appropriate media content'
];

export function CampaignQueue() {
  // State
  const [campaigns, setCampaigns] = useState([]);
  const [editRequests, setEditRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalPending: 0, avgReviewTimeHours: 0 });
  
  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modal states
  const [reviewModal, setReviewModal] = useState({ open: false, campaign: null, loading: false });
  const [rejectModal, setRejectModal] = useState({ open: false, campaignId: null, loading: false, isEditRequest: false });
  const [editReviewModal, setEditReviewModal] = useState({ open: false, campaign: null });
  const [checklist, setChecklist] = useState([]);
  
  // Rejection form
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');

  // Fetch pending campaigns and edit requests
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError('');
      const [pendingData, editRequestsData] = await Promise.all([
        adminService.getPendingCampaigns(),
        adminService.getEditRequests()
      ]);
      setCampaigns(pendingData.campaigns);
      setStats(pendingData.stats);
      setEditRequests(editRequestsData);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Open campaign review modal
  const openReviewModal = async (campaignId) => {
    try {
      setReviewModal({ open: true, campaign: null, loading: true });
      setChecklist([]);
      const campaign = await adminService.getCampaignForReview(campaignId);
      setReviewModal({ open: true, campaign, loading: false });
    } catch (err) {
      setError('Failed to load campaign details');
      setReviewModal({ open: false, campaign: null, loading: false });
    }
  };

  // Close review modal
  const closeReviewModal = () => {
    setReviewModal({ open: false, campaign: null, loading: false });
    setChecklist([]);
  };

  // Toggle checklist item
  const toggleChecklist = (index) => {
    setChecklist(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  // Approve campaign
  const handleApprove = async (campaignId) => {
    try {
      await adminService.approveCampaign(campaignId);
      setCampaigns(prev => prev.filter(c => c._id !== campaignId));
      setStats(prev => ({ ...prev, totalPending: prev.totalPending - 1 }));
      closeReviewModal();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve campaign');
    }
  };

  // Open reject modal
  const openRejectModal = (campaignId) => {
    setRejectModal({ open: true, campaignId, loading: false, isEditRequest: false });
    setRejectReason('');
    setRejectMessage('');
  };

  // Open reject modal for edit request
  const openRejectEditModal = (campaignId) => {
    setRejectModal({ open: true, campaignId, loading: false, isEditRequest: true });
    setRejectReason('');
    setRejectMessage('');
  };

  // Close reject modal
  const closeRejectModal = () => {
    setRejectModal({ open: false, campaignId: null, loading: false, isEditRequest: false });
    setRejectReason('');
    setRejectMessage('');
  };

  // Submit rejection (handles both new campaigns and edit requests)
  const handleReject = async () => {
    if (!rejectReason) {
      setError('Please select a rejection reason');
      return;
    }

    try {
      setRejectModal(prev => ({ ...prev, loading: true }));
      
      if (rejectModal.isEditRequest) {
        await adminService.rejectEditRequest(rejectModal.campaignId, rejectReason);
        setEditRequests(prev => prev.filter(c => c._id !== rejectModal.campaignId));
      } else {
        await adminService.rejectCampaign(rejectModal.campaignId, rejectReason, rejectMessage);
        setCampaigns(prev => prev.filter(c => c._id !== rejectModal.campaignId));
        setStats(prev => ({ ...prev, totalPending: prev.totalPending - 1 }));
      }
      
      closeRejectModal();
      closeReviewModal();
      setEditReviewModal({ open: false, campaign: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject');
      setRejectModal(prev => ({ ...prev, loading: false }));
    }
  };

  // Approve edit request
  const handleApproveEdit = async (campaignId) => {
    try {
      await adminService.approveEditRequest(campaignId);
      setEditRequests(prev => prev.filter(c => c._id !== campaignId));
      setEditReviewModal({ open: false, campaign: null });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve edit request');
    }
  };

  // View edit request details
  const openEditReviewModal = (campaign) => {
    setEditReviewModal({ open: true, campaign });
  };

  // Toggle campaign selection
  const toggleSelection = (campaignId) => {
    setSelectedIds(prev => 
      prev.includes(campaignId)
        ? prev.filter(id => id !== campaignId)
        : [...prev, campaignId]
    );
  };

  // Select all
  const selectAll = () => {
    if (selectedIds.length === campaigns.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(campaigns.map(c => c._id));
    }
  };

  // Bulk approve
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    
    if (!window.confirm(`Approve ${selectedIds.length} campaigns?`)) return;

    try {
      setLoading(true);
      await adminService.bulkApproveCampaigns(selectedIds);
      setCampaigns(prev => prev.filter(c => !selectedIds.includes(c._id)));
      setStats(prev => ({ ...prev, totalPending: prev.totalPending - selectedIds.length }));
      setSelectedIds([]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to bulk approve');
    } finally {
      setLoading(false);
    }
  };

  if (loading && campaigns.length === 0 && editRequests.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Approvals & Reviews</h1>
          <p className="text-slate-500">Manage campaign submissions and edit requests</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-slate-500">
            Avg. review time: <span className="font-medium text-slate-700">{stats.avgReviewTimeHours}h</span>
          </div>
          <Badge className="bg-blue-100 text-blue-700 border-none px-3 py-1">
            {stats.totalPending + editRequests.length} Pending
          </Badge>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bulk actions */}
      {selectedIds.length > 0 && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-blue-700 font-medium">{selectedIds.length} campaigns selected</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
              Clear Selection
            </Button>
            <Button 
              size="sm" 
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleBulkApprove}
            >
              <CheckCircle2 className="w-4 h-4 mr-1" /> Approve Selected
            </Button>
          </div>
        </div>
      )}

      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="campaigns" className="px-6">
            New Campaigns <Badge className="ml-2 bg-blue-100 text-blue-700 border-none">{stats.totalPending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="edits" className="px-6">
            Edit Requests <Badge className="ml-2 bg-purple-100 text-purple-700 border-none">{editRequests.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card className="border-slate-200 overflow-hidden">
            {campaigns.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">All caught up!</h3>
                <p className="text-slate-500">No pending campaigns to review.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-4">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.length === campaigns.length && campaigns.length > 0}
                          onChange={selectAll}
                          className="rounded border-slate-300"
                        />
                      </th>
                      <th className="px-4 py-4">Campaign</th>
                      <th className="px-4 py-4">Category</th>
                      <th className="px-4 py-4">Goal</th>
                      <th className="px-4 py-4">Waiting</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaigns.map((campaign) => (
                      <tr key={campaign._id} className={`hover:bg-slate-50 transition-colors ${campaign.isOverdue ? 'bg-amber-50' : ''}`}>
                        <td className="px-4 py-4">
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(campaign._id)}
                            onChange={() => toggleSelection(campaign._id)}
                            className="rounded border-slate-300"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                              {campaign.coverImage || campaign.images?.[0]?.url ? (
                                <img 
                                  src={campaign.coverImage || campaign.images[0].url} 
                                  alt="" 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <ImageIcon className="w-6 h-6 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-slate-900">{campaign.title}</div>
                              <div className="text-xs text-slate-500">by {campaign.creator?.name || 'Unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="secondary">{campaign.category}</Badge>
                        </td>
                        <td className="px-4 py-4 font-medium">
                          Rs. {campaign.fundingGoal?.toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <div className={`flex items-center gap-1 ${campaign.isOverdue ? 'text-amber-600 font-medium' : 'text-slate-500'}`}>
                            <Clock className="w-3 h-3" />
                            {campaign.waitingTime}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-slate-600 hover:text-blue-600"
                              onClick={() => openReviewModal(campaign._id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleApprove(campaign._id)}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openRejectModal(campaign._id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="edits">
          <Card className="border-slate-200 overflow-hidden">
            {editRequests.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No pending edits</h3>
                <p className="text-slate-500">Edit requests from creators will appear here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-4">Campaign</th>
                      <th className="px-4 py-4">Creator</th>
                      <th className="px-4 py-4">Updated Fields</th>
                      <th className="px-4 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editRequests.map((campaign) => (
                      <tr key={campaign._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900">{campaign.title}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                              {campaign.creator?.name?.charAt(0)}
                            </div>
                            {campaign.creator?.name}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2 flex-wrap">
                            {Object.keys(campaign.pendingUpdates || {}).map(field => (
                              <Badge key={field} variant="outline" className="capitalize bg-purple-50 text-purple-700 border-purple-200">
                                {field}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button 
                            size="sm" 
                            className="bg-sky-600 hover:bg-sky-700 text-white"
                            onClick={() => openEditReviewModal(campaign)}
                          >
                            Review Changes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Review Modal */}
      {editReviewModal.open && editReviewModal.campaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <div className="sticky top-0 bg-white p-6 border-b border-slate-200 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-900">Review Edit Request</h2>
              <button onClick={() => setEditReviewModal({ open: false, campaign: null })} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
                <p className="font-medium">Campaign: {editReviewModal.campaign.title}</p>
                <p>Creator: {editReviewModal.campaign.creator?.name}</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-slate-900">Proposed Changes</h3>
                <div className="border rounded-lg divide-y">
                  {Object.entries(editReviewModal.campaign.pendingUpdates || {}).map(([field, value]) => (
                    <div key={field} className="p-4">
                      <div className="text-xs font-bold text-slate-500 uppercase mb-2">{field}</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-red-50 p-3 rounded border border-red-100">
                          <div className="text-xs text-red-600 mb-1 font-medium">Current</div>
                          <div className="text-sm text-slate-600">
                            {field === 'images' ? (
                              <div className="grid grid-cols-2 gap-2">
                                {editReviewModal.campaign[field]?.map((img, idx) => (
                                  <img 
                                    key={idx} 
                                    src={img.url} 
                                    alt="Current" 
                                    className="w-full h-20 object-cover rounded" 
                                  />
                                ))}
                              </div>
                            ) : field === 'rewardTiers' || field === 'milestones' ? (
                              <div className="space-y-1">
                                {Array.isArray(editReviewModal.campaign[field]) && editReviewModal.campaign[field].map((item, i) => (
                                  <div key={i} className="bg-white/50 p-1.5 rounded text-xs border border-slate-100">
                                    {item.title || item.name || `Item ${i+1}`} {item.amount ? `- Rs. ${item.amount}` : item.percentage ? `- ${item.percentage}%` : ''}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              typeof editReviewModal.campaign[field] === 'object' ? 
                                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(editReviewModal.campaign[field], null, 2)}</pre> : 
                                String(editReviewModal.campaign[field])
                            )}
                          </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded border border-green-100">
                          <div className="text-xs text-green-600 mb-1 font-medium">Proposed</div>
                          <div className="text-sm text-slate-900">
                            {field === 'images' ? (
                              <div className="grid grid-cols-2 gap-2">
                                {value?.map((img, idx) => (
                                  <img 
                                    key={idx} 
                                    src={img.url} 
                                    alt="New update" 
                                    className="w-full h-20 object-cover rounded" 
                                  />
                                ))}
                              </div>
                            ) : field === 'rewardTiers' || field === 'milestones' ? (
                              <div className="space-y-1">
                                {Array.isArray(value) && value.map((item, i) => (
                                  <div key={i} className="bg-white/50 p-1.5 rounded text-xs border border-slate-100">
                                    {item.title || item.name || `Item ${i+1}`} {item.amount ? `- Rs. ${item.amount}` : item.percentage ? `- ${item.percentage}%` : ''}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              typeof value === 'object' ? 
                                <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre> : 
                                String(value)
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-slate-50 p-6 border-t border-slate-200 flex justify-end gap-3">
              <Button 
                variant="outline" 
                className="text-red-600 border-red-200 hover:bg-red-50"
                onClick={() => openRejectEditModal(editReviewModal.campaign._id)}
              >
                Reject Changes
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => handleApproveEdit(editReviewModal.campaign._id)}
              >
                Approve Changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Campaign Review Modal */}
      {reviewModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white p-6 border-b border-slate-200 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-slate-900">Campaign Review</h2>
              <button onClick={closeReviewModal} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {reviewModal.loading ? (
              <div className="p-12 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : reviewModal.campaign && (
              <div className="p-6 space-y-6">
                {/* Campaign Header */}
                <div className="flex gap-6">
                  {/* Cover Image */}
                  <div className="w-48 h-36 rounded-lg overflow-hidden bg-slate-200 flex-shrink-0">
                    {reviewModal.campaign.coverImage || reviewModal.campaign.images?.[0]?.url ? (
                      <img 
                        src={reviewModal.campaign.coverImage || reviewModal.campaign.images[0].url} 
                        alt="" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-slate-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-slate-900">{reviewModal.campaign.title}</h3>
                    <p className="text-slate-600 mt-1">{reviewModal.campaign.shortDescription}</p>
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      <Badge variant="secondary">{reviewModal.campaign.category}</Badge>
                      <span className="text-slate-500">Goal: <strong className="text-slate-900">Rs. {reviewModal.campaign.fundingGoal?.toLocaleString()}</strong></span>
                      <span className="text-slate-500">Duration: <strong className="text-slate-900">{reviewModal.campaign.duration} days</strong></span>
                      <span className="text-slate-500">Type: <strong className="text-slate-900 capitalize">{reviewModal.campaign.fundingType?.replace('-', ' ')}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Creator Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-2">Creator Information</h4>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                      {reviewModal.campaign.creator?.name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <div className="font-medium">{reviewModal.campaign.creator?.name}</div>
                      <div className="text-sm text-slate-500">{reviewModal.campaign.creator?.email}</div>
                    </div>
                    <div className="ml-auto text-sm text-slate-500">
                      <div>Previous campaigns: <strong>{reviewModal.campaign.creatorStats?.totalCampaigns || 0}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Description</h4>
                  <div className="bg-white border rounded-lg p-4 text-slate-600 max-h-48 overflow-y-auto">
                    {reviewModal.campaign.description}
                  </div>
                </div>

                {/* Images Gallery */}
                {reviewModal.campaign.images?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Images ({reviewModal.campaign.images.length})</h4>
                    <div className="grid grid-cols-5 gap-2">
                      {reviewModal.campaign.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img.url} 
                          alt={`Image ${idx + 1}`} 
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Video */}
                {reviewModal.campaign.video?.url && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Video</h4>
                    <video src={reviewModal.campaign.video.url} controls className="w-full max-h-64 rounded-lg" />
                  </div>
                )}

                {/* Reward Tiers */}
                {reviewModal.campaign.rewardTiers?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Reward Tiers ({reviewModal.campaign.rewardTiers.length})</h4>
                    <div className="space-y-2">
                      {reviewModal.campaign.rewardTiers.map((tier, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-lg flex justify-between">
                          <div>
                            <div className="font-medium">{tier.title}</div>
                            <div className="text-sm text-slate-500">{tier.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">Rs. {tier.amount?.toLocaleString()}</div>
                            {tier.quantityLimit && (
                              <div className="text-xs text-slate-500">Limit: {tier.quantityLimit}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Milestones */}
                {reviewModal.campaign.milestones?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Milestones ({reviewModal.campaign.milestones.length})</h4>
                    <div className="space-y-2">
                      {reviewModal.campaign.milestones.map((milestone, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-lg flex justify-between">
                          <div>
                            <div className="font-medium">{milestone.title}</div>
                            <div className="text-sm text-slate-500">{milestone.description}</div>
                          </div>
                          <Badge className="bg-blue-100 text-blue-700 border-none">
                            {milestone.percentage}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Checklist */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-medium text-slate-900 mb-3">Review Checklist</h4>
                  <div className="space-y-2">
                    {CHECKLIST_ITEMS.map((item, idx) => (
                      <label key={idx} className="flex items-center gap-3 cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={checklist.includes(idx)}
                          onChange={() => toggleChecklist(idx)}
                          className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
                        />
                        <span className={checklist.includes(idx) ? 'text-green-700' : 'text-slate-600'}>
                          {item}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            {!reviewModal.loading && reviewModal.campaign && (
              <div className="sticky bottom-0 bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
                <Button variant="outline" onClick={closeReviewModal}>
                  Close
                </Button>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => openRejectModal(reviewModal.campaign._id)}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleApprove(reviewModal.campaign._id)}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve Campaign
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white shadow-2xl">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Reject Campaign</h2>
              <p className="text-slate-500 text-sm mt-1">The creator will be notified via email.</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Rejection Reason *
                </label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Select a reason...</option>
                  {Object.entries(REJECTION_REASONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Additional Message (Optional)
                </label>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  placeholder="Provide more details for the creator..."
                  className="w-full min-h-[100px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={closeRejectModal} disabled={rejectModal.loading}>
                Cancel
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
                disabled={rejectModal.loading || !rejectReason}
              >
                {rejectModal.loading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <XCircle className="w-4 h-4 mr-2" />
                )}
                Reject Campaign
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

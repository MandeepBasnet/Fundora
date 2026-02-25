import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { 
  getAllFundReleases
} from '../../services/milestoneService';
import { 
  getEligiblePayouts, 
  releaseCampaignFunds,
  initiateDisbursementPayment
} from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { Loader2, DollarSign, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FundDisbursements() {
  const [activeTab, setActiveTab] = useState('eligible');
  
  // Eligible Payouts State
  const [eligiblePayouts, setEligiblePayouts] = useState([]);
  const [loadingEligible, setLoadingEligible] = useState(true);
  const [releasingId, setReleasingId] = useState(null);

  // Disbursement History State
  const [disbursements, setDisbursements] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  // Dialog State
  const [selectedMilestoneCampaign, setSelectedMilestoneCampaign] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (activeTab === 'eligible') {
      fetchEligiblePayouts();
    } else {
      fetchDisbursementHistory();
    }
  }, [activeTab]);

  const fetchEligiblePayouts = async () => {
    try {
      setLoadingEligible(true);
      const data = await getEligiblePayouts();
      setEligiblePayouts(data);
    } catch (error) {
      console.error('Failed to load eligible payouts:', error);
      toast.error('Failed to load eligible payouts');
    } finally {
      setLoadingEligible(false);
    }
  };

  const fetchDisbursementHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await getAllFundReleases({ limit: 50 });
      setDisbursements(data.releases || []);
    } catch (error) {
      console.error('Failed to load disbursement history:', error);
      toast.error('Failed to load disbursement history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleReleaseFunds = async (campaignId, overrideMilestone = false) => {
    try {
      setReleasingId(campaignId);
      await releaseCampaignFunds(campaignId, overrideMilestone);
      toast.success('Funds released successfully!');
      fetchEligiblePayouts();
      setSelectedMilestoneCampaign(null);
    } catch (error) {
      console.error('Failed to release funds:', error);
      toast.error(error.response?.data?.message || 'Failed to release funds');
    } finally {
      setReleasingId(null);
    }
  };

  const handleInitiatePayment = async (release) => {
    try {
      setUpdatingId(release._id);
      
      const payload = {
        paymentMethod: release.disbursementMethod || 'esewa', // Default to esewa if not set
      };

      const data = await initiateDisbursementPayment(release._id, payload.paymentMethod);
      
      // Handle Gateway Redirects
      if (data.paymentMethod === 'esewa') {
        const form = document.createElement('form');
        form.setAttribute('method', 'POST');
        form.setAttribute('action', data.formUrl);

        for (const key in data.formData) {
          const hiddenField = document.createElement('input');
          hiddenField.setAttribute('type', 'hidden');
          hiddenField.setAttribute('name', key);
          hiddenField.setAttribute('value', data.formData[key]);
          form.appendChild(hiddenField);
        }

        document.body.appendChild(form);
        toast.loading('Redirecting to eSewa...', { duration: 2000 });
        console.log('Action URL:', data.formUrl, 'Payload:', data.formData);
        
        // Slight delay to ensure DOM update is registered and user sees toast
        setTimeout(() => {
          form.submit();
        }, 500);
      } else if (data.paymentMethod === 'khalti') {
        window.location.href = data.paymentUrl;
      }
      
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      toast.error(error.response?.data?.message || 'Failed to initiate payment');
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      'pending': 'bg-amber-100 text-amber-700',
      'processing': 'bg-blue-100 text-blue-700',
      'completed': 'bg-green-100 text-green-700',
      'failed': 'bg-red-100 text-red-700'
    };
    return (
      <Badge className={`${styles[status] || 'bg-gray-100'} border-none uppercase text-[10px]`}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fund Disbursements</h1>
        <p className="text-slate-500">Manage and track non-milestone payouts to creators</p>
      </div>

      <Tabs defaultValue="eligible" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
          <TabsTrigger value="eligible">Eligible for Payout</TabsTrigger>
          <TabsTrigger value="history">Disbursement History</TabsTrigger>
        </TabsList>

        <TabsContent value="eligible" className="space-y-4">
          <Card className="overflow-hidden border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Ready for Disbursement
              </h3>
              <Badge variant="outline" className="bg-white">
                {eligiblePayouts.length} Campaigns
              </Badge>
            </div>
            
            {loadingEligible ? (
              <div className="p-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              </div>
            ) : eligiblePayouts.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No campaigns are currently eligible for payout.</p>
                <p className="text-sm mt-1">Milestone campaigns are handled in Milestone Review.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Campaign</th>
                      <th className="px-6 py-4 font-medium">Type</th>
                      <th className="px-6 py-4 font-medium text-right">Available (NPR)</th>
                      <th className="px-6 py-4 font-medium text-right">Fee (5%)</th>
                      <th className="px-6 py-4 font-medium text-right">Net Payout</th>
                      <th className="px-6 py-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {eligiblePayouts.map((camp) => (
                      <tr key={camp.campaignId} className="bg-white hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{camp.title}</div>
                          <div className="text-xs text-slate-500">{camp.creator?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="capitalize text-[10px]">
                            {camp.fundingType.replace('-', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right text-slate-600">
                          {camp.grossAvailable.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-red-600">
                          -{camp.platformFee.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          {camp.netAmount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button 
                            onClick={() => {
                              if (camp.fundingType === 'milestone-based' && camp.pendingMilestonesCount > 0) {
                                setSelectedMilestoneCampaign(camp);
                              } else {
                                handleReleaseFunds(camp.campaignId);
                              }
                            }}
                            disabled={releasingId === camp.campaignId}
                            className={`${camp.fundingType === 'milestone-based' && camp.pendingMilestonesCount > 0 ? 'bg-amber-500 hover:bg-amber-600' : 'bg-sky-600 hover:bg-sky-700'} text-white w-full`}
                          >
                            {releasingId === camp.campaignId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                {camp.fundingType === 'milestone-based' && camp.pendingMilestonesCount > 0 
                                  ? 'Review & Release' 
                                  : 'Release Funds'} 
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
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

        <TabsContent value="history" className="space-y-4">
          <Card className="overflow-hidden border-slate-200">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-sky-600" />
                Disbursement Status Tracking
              </h3>
            </div>
            
            {loadingHistory ? (
              <div className="p-12 flex justify-center items-center">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              </div>
            ) : disbursements.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No fund releases found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date / Campaign</th>
                      <th className="px-6 py-4 font-medium">Origin</th>
                      <th className="px-6 py-4 font-medium text-right">Net Amount</th>
                      <th className="px-6 py-4 font-medium">Method</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium w-48 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {disbursements.map((release) => (
                      <tr key={release._id} className="bg-white hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="text-xs text-slate-500 mb-1">
                            {new Date(release.createdAt).toLocaleDateString()}
                          </div>
                          <div className="font-medium text-slate-900 truncate max-w-[200px]">
                            {release.campaign?.title}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {release.milestoneTitle ? (
                            <div className="text-xs">
                              <span className="font-medium block text-sky-700">Milestone</span>
                              <span className="truncate max-w-[150px] inline-block">{release.milestoneTitle}</span>
                            </div>
                          ) : (
                            <div className="text-xs font-medium text-emerald-700">Generic Release</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          Rs. {release.amount.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 uppercase text-xs font-medium">
                          {release.disbursementMethod.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(release.disbursementStatus)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {release.disbursementStatus !== 'completed' && (
                            <div className="flex justify-end gap-2">
                              {(release.disbursementStatus === 'pending' || release.disbursementStatus === 'failed') && (
                                <Button 
                                  size="sm" 
                                  className={`${release.disbursementMethod === 'khalti' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'} text-white text-xs px-4 h-8 capitalize`}
                                  disabled={updatingId === release._id}
                                  onClick={() => handleInitiatePayment(release)}
                                >
                                  {updatingId === release._id ? <Loader2 className="w-3 h-3 animate-spin" /> : `Pay via ${release.disbursementMethod || 'eSewa'}`}
                                </Button>
                              )}
                            </div>
                          )}
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

      {/* Warning Dialog for Milestone Override */}
      {selectedMilestoneCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 shadow-xl border-none">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex shrink-0 items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Pending Milestones Detected</h3>
                <p className="text-slate-600 text-sm mb-4">
                  This is a milestone-based campaign that currently has <strong className="text-slate-900">{selectedMilestoneCampaign.pendingMilestonesCount} pending or unapproved milestones</strong>. 
                </p>
                <p className="text-slate-600 text-sm mb-6">
                  It is heavily recommended to review and approve milestones before discharging funds. Are you sure you want to override and release the available <strong className="text-green-600">NPR {selectedMilestoneCampaign.netAmount.toLocaleString()}</strong>?
                </p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-4">
              <Button 
                onClick={() => navigate('/admin/milestone-review')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white"
              >
                 Go to Milestone Review
              </Button>
              <Button 
                onClick={() => handleReleaseFunds(selectedMilestoneCampaign.campaignId, true)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                disabled={releasingId === selectedMilestoneCampaign.campaignId}
              >
                {releasingId === selectedMilestoneCampaign.campaignId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Override & Release Funds'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setSelectedMilestoneCampaign(null)}
                className="w-full text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}

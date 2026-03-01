import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import { 
  getAllFundReleases
} from '../../services/milestoneService';
import { 
  getEligiblePayouts, 
  releaseCampaignFunds,
  initiateDisbursementPayment,
  rollbackDisbursement
} from '../../services/adminService';
import { toast } from 'react-hot-toast';
import { Loader2, DollarSign, RefreshCw, CheckCircle2, AlertTriangle, ArrowRight, AlertCircle, RotateCcw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateReceiptPDF } from '../../utils/receiptGenerator';

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
  
  // Pagination State
  const itemsPerPage = 10;
  const [eligiblePage, setEligiblePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const totalEligiblePages = Math.ceil(eligiblePayouts.length / itemsPerPage);
  const paginatedEligible = eligiblePayouts.slice(
    (eligiblePage - 1) * itemsPerPage,
    eligiblePage * itemsPerPage
  );

  const totalHistoryPages = Math.ceil(disbursements.length / itemsPerPage);
  const paginatedHistory = disbursements.slice(
    (historyPage - 1) * itemsPerPage,
    historyPage * itemsPerPage
  );

  // Dialog State
  const [selectedMilestoneCampaign, setSelectedMilestoneCampaign] = useState(null);
  const [customReleaseAmount, setCustomReleaseAmount] = useState('');
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
      const data = await getAllFundReleases({ limit: 1000 });
      setDisbursements(data.releases || []);
    } catch (error) {
      console.error('Failed to load disbursement history:', error);
      toast.error('Failed to load disbursement history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleReleaseFunds = async (campaignId, overrideMilestone = false, amount = null) => {
    try {
      setReleasingId(campaignId);
      await releaseCampaignFunds(campaignId, overrideMilestone, amount);
      toast.success('Funds released successfully!');
      fetchEligiblePayouts();
      setSelectedMilestoneCampaign(null);
      setCustomReleaseAmount('');
    } catch (error) {
      console.error('Failed to release funds:', error);
      toast.error(error.response?.data?.message || 'Failed to release funds');
    } finally {
      setReleasingId(null);
    }
  };

  const handleRollback = async (releaseId) => {
    if (!window.confirm("Are you sure you want to cancel this disbursement? Funds will be returned to the Eligible Payouts list.")) return;
    try {
      setUpdatingId(releaseId);
      await rollbackDisbursement(releaseId);
      toast.success('Disbursement rolled back successfully.');
      fetchDisbursementHistory();
    } catch (error) {
      console.error('Failed to rollback:', error);
      toast.error(error.response?.data?.message || 'Failed to rollback disbursement');
    } finally {
      setUpdatingId(null);
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

  const handleDownloadReceipt = (release) => {
    try {
      const formattedTx = {
         id: release.transactionReference || release._id,
         date: new Date(release.disbursedAt || release.createdAt).toLocaleDateString(),
         description: release.milestoneTitle ? `Milestone: ${release.milestoneTitle}` : `Campaign Payout`,
         campaignTitle: release.campaign?.title || 'Unknown Campaign',
         type: 'Debit',
         amount: release.grossAmount || release.amount,
         status: release.disbursementStatus.charAt(0).toUpperCase() + release.disbursementStatus.slice(1),
         method: (release.disbursementMethod || 'System').charAt(0).toUpperCase() + (release.disbursementMethod || 'System').slice(1),
         platformFee: release.platformFee || 0,
         netAmount: release.amount
      };
      // For Admin Disbursement view, treat Admin as the "generator" and trigger Credit layout
      generateReceiptPDF(formattedTx, { role: 'creator' });
      toast.success('Receipt downloaded');
    } catch (error) {
      console.error("Failed to generate PDF", error);
      toast.error('Error generating receipt');
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
                      <th className="px-6 py-4 font-medium text-right">Total Funded</th>
                      <th className="px-6 py-4 font-medium text-right">Available (NPR)</th>
                      <th className="px-6 py-4 font-medium text-right">Fee (5%)</th>
                      <th className="px-6 py-4 font-medium text-right">Net Payout</th>
                      <th className="px-6 py-4 font-medium text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedEligible.map((camp) => (
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
                        <td className="px-6 py-4 text-right text-slate-900 font-medium">
                          {camp.totalFunded?.toLocaleString() || 0}
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
                              if (camp.fundingType === 'milestone-based') {
                                setSelectedMilestoneCampaign(camp);
                                setCustomReleaseAmount(camp.netAmount.toString());
                              } else {
                                handleReleaseFunds(camp.campaignId);
                              }
                            }}
                            disabled={releasingId === camp.campaignId}
                            className={`${camp.fundingType === 'milestone-based' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-sky-600 hover:bg-sky-700'} text-white w-full`}
                          >
                            {releasingId === camp.campaignId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                {camp.fundingType === 'milestone-based' 
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

            {/* Eligible Pagination Controls */}
            {totalEligiblePages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <span className="text-sm text-slate-500">
                  Showing {((eligiblePage - 1) * itemsPerPage) + 1} to {Math.min(eligiblePage * itemsPerPage, eligiblePayouts.length)} of {eligiblePayouts.length} entries
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEligiblePage(p => Math.max(1, p - 1))}
                    disabled={eligiblePage === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setEligiblePage(p => Math.min(totalEligiblePages, p + 1))}
                    disabled={eligiblePage === totalEligiblePages}
                  >
                    Next
                  </Button>
                </div>
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
                      <th className="px-6 py-4 font-medium w-64 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedHistory.map((release) => (
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
                          {release.disbursementStatus === 'completed' ? (
                            <div className="flex justify-end pr-2">
                               <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-slate-400 hover:text-sky-600"
                                  onClick={() => handleDownloadReceipt(release)}
                                  title="Download PDF Receipt"
                                >
                                  <FileText className="w-4 h-4" />
                                </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-2 items-center">
                              {(release.disbursementStatus === 'pending' || release.disbursementStatus === 'failed') && (
                                <>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-8 px-2"
                                    disabled={updatingId === release._id}
                                    onClick={() => handleRollback(release._id)}
                                    title="Rollback disbursement"
                                  >
                                    <RotateCcw className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    className={`${release.disbursementMethod === 'khalti' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-green-600 hover:bg-green-700'} text-white text-xs px-4 h-8 capitalize`}
                                    disabled={updatingId === release._id}
                                    onClick={() => handleInitiatePayment(release)}
                                  >
                                    {updatingId === release._id ? <Loader2 className="w-3 h-3 animate-spin" /> : `Pay via ${release.disbursementMethod || 'eSewa'}`}
                                  </Button>
                                </>
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
            
            {/* History Pagination Controls */}
            {totalHistoryPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
                <span className="text-sm text-slate-500">
                  Showing {((historyPage - 1) * itemsPerPage) + 1} to {Math.min(historyPage * itemsPerPage, disbursements.length)} of {disbursements.length} entries
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                    disabled={historyPage === totalHistoryPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Warning Dialog for Milestone Override */}
      {selectedMilestoneCampaign && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 shadow-xl border-none">
            
            {selectedMilestoneCampaign.alreadyReleased > 0 ? (
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-amber-100 rounded-full flex shrink-0 items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Check Milestone Proofs</h3>
                  <p className="text-slate-600 text-sm mb-2">
                    This campaign has already received funds. Please check its past milestone proofs up to where the released amount (<strong className="text-slate-900">NPR {selectedMilestoneCampaign.alreadyReleased.toLocaleString()}</strong>) matched, before releasing more funds.
                  </p>
                  {selectedMilestoneCampaign.pendingMilestonesCount > 0 && (
                     <p className="text-amber-700 text-sm bg-amber-50 rounded p-2 mb-4 border border-amber-200">
                       It has <strong>{selectedMilestoneCampaign.pendingMilestonesCount} pending milestones</strong>.
                     </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-4 mb-4">
                 <div className="w-12 h-12 bg-sky-100 rounded-full flex shrink-0 items-center justify-center">
                  <DollarSign className="w-6 h-6 text-sky-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Initial Disbursement</h3>
                  <p className="text-slate-600 text-sm">
                    This campaign has reached its funding goal and is eligible for its first payout!
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-4 text-sm mt-4">
               <div className="flex justify-between mb-1">
                 <span className="text-slate-500">Total Funded:</span>
                 <span className="font-medium">NPR {selectedMilestoneCampaign.totalFunded?.toLocaleString()}</span>
               </div>
               <div className="flex justify-between mb-1">
                 <span className="text-slate-500">Already Released:</span>
                 <span className="font-medium text-amber-600">NPR {selectedMilestoneCampaign.alreadyReleased?.toLocaleString()}</span>
               </div>
               <div className="flex justify-between mb-3 border-b border-slate-200 pb-2">
                 <span className="text-slate-500">Max Net Available:</span>
                 <span className="font-bold text-green-600">NPR {selectedMilestoneCampaign.netAmount?.toLocaleString()}</span>
               </div>

               <div>
                 <label className="block text-slate-700 font-medium mb-1">Custom Payout Amount (Net NPR)</label>
                 <input 
                   type="number"
                   className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                   value={customReleaseAmount}
                   onChange={(e) => setCustomReleaseAmount(e.target.value)}
                   max={selectedMilestoneCampaign.netAmount}
                   min={0}
                 />
                 <p className="text-xs text-slate-400 mt-1">Specify how much to release if partially paying for a milestone tier.</p>
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
                onClick={() => handleReleaseFunds(selectedMilestoneCampaign.campaignId, true, customReleaseAmount)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                disabled={releasingId === selectedMilestoneCampaign.campaignId}
              >
                {releasingId === selectedMilestoneCampaign.campaignId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Release Specified Funds'}
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => { setSelectedMilestoneCampaign(null); setCustomReleaseAmount(''); }}
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

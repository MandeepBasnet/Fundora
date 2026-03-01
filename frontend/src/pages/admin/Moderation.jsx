import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, AlertTriangle, Eye, Filter, Search, ShieldAlert, X, Flag, MessageSquare, Ban, Users, TrendingUp
} from 'lucide-react';
import { Button, Card, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

export function Moderation() {
  const [activeTab, setActiveTab] = useState('pending');
  const [flags, setFlags] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [campaignStats, setCampaignStats] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  
  const [resolutionAction, setResolutionAction] = useState('none');
  const [adminComments, setAdminComments] = useState('');
  const [isMalicious, setIsMalicious] = useState(false);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    fetchFlags();
  }, [activeTab]);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const res = await api.get('/flags/admin/users');
        if (res.data.success) {
          setUserStats(res.data.data);
        }
      } else if (activeTab === 'campaigns') {
        const res = await api.get('/flags/admin/campaigns');
        if (res.data.success) {
          setCampaignStats(res.data.data);
        }
      } else {
        const res = await api.get('/flags/admin');
        if (res.data.success) {
          const allFlags = res.data.data;
          if (activeTab === 'pending') {
            setFlags(allFlags.filter(f => ['pending', 'under_review'].includes(f.status)));
          } else if (activeTab === 'resolved') {
            setFlags(allFlags.filter(f => ['resolved', 'dismissed'].includes(f.status)));
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch stats/flags:', error);
      toast.error('Failed to load moderation data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReview = (report) => {
    setSelectedReport(report);
    setResolutionAction('none');
    setAdminComments('');
    setIsMalicious(false);
    setShowReviewModal(true);
  };

  const handleResolveFlag = async () => {
    if (!adminComments) {
      toast.error('Admin comments are required for all resolutions');
      return;
    }

    setIsResolving(true);
    try {
      const payload = {
        resolutionAction,
        adminComments,
        isMalicious: resolutionAction === 'none' ? isMalicious : false
      };

      const res = await api.patch(`/flags/admin/${selectedReport._id}/resolve`, payload);
      
      if (res.data.success) {
        toast.success(`Flag successfully resolved as ${res.data.data.status}`);
        setShowReviewModal(false);
        fetchFlags(); // refresh list
      }
    } catch (error) {
      console.error('Resolve error:', error);
      toast.error(error.response?.data?.message || 'Failed to resolve flag');
    } finally {
      setIsResolving(false);
    }
  };

  const handleRestoreCampaign = async (campaignId) => {
    if (!window.confirm("Are you sure you want to restore this campaign? This will dismiss all its pending active flags and penalize the reporters.")) {
      return;
    }

    try {
      const res = await api.patch(`/flags/admin/campaigns/${campaignId}/restore`);
      if (res.data.success) {
        toast.success('Campaign restored successfully');
        fetchFlags(); // Refresh data
      }
    } catch (error) {
      console.error('Restore error:', error);
      toast.error(error.response?.data?.message || 'Failed to restore campaign');
    }
  };

  const getRiskColor = (count) => {
    if (count >= 5) return 'border-red-200 bg-red-50 text-red-700';
    if (count >= 3) return 'border-amber-200 bg-amber-50 text-amber-700';
    return 'border-green-200 bg-green-50 text-green-700';
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Moderation Center</h1>
          <p className="text-slate-500">Review reported campaigns and manage platform integrity.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchFlags}><Search className="w-4 h-4 mr-2" /> Refresh</Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200 p-1 mb-6">
          <TabsTrigger value="pending" className="data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
            Pending Review
          </TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
            Resolved 
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800">
            User Stats
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="data-[state=active]:bg-slate-100 data-[state=active]:text-slate-800">
            Campaign Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              </div>
            ) : flags.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                 <ShieldAlert className="w-12 h-12 mb-4 text-slate-300" />
                 <h3 className="text-lg font-medium text-slate-900">Queue is Clear</h3>
                 <p>There are no pending reports at the moment.</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Campaign</th>
                      <th className="px-6 py-4">Reason</th>
                      <th className="px-6 py-4">Active Flags</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {flags.map((flag) => (
                      <tr key={flag._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{flag.campaign?.title || 'Unknown'}</div>
                          <div className="text-slate-500 text-xs">Reporter: {flag.reporter?.name || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded-full">
                            {flag.reason}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className={getRiskColor(flag.campaign?.activeFlagCount || 0)}>
                            {flag.campaign?.activeFlagCount || 0} Reports
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(flag.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="outline" onClick={() => handleOpenReview(flag)}>Review</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          {/* Resolved tab replicates the table but implies read-only actions */}
          <Card className="border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Campaign</th>
                      <th className="px-6 py-4">Outcome</th>
                      <th className="px-6 py-4">Action Taken</th>
                      <th className="px-6 py-4">Resolved Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {flags.map((flag) => (
                      <tr key={flag._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{flag.campaign?.title || 'Unknown'}</div>
                          <div className="text-slate-500 text-xs">Reporter: {flag.reporter?.name || 'Unknown'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={flag.status === 'dismissed' ? 'outline' : 'default'} className={flag.status === 'dismissed' ? 'border-slate-300 text-slate-600' : 'bg-red-600'}>
                            {flag.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          {flag.resolutionAction ? (
                            <span className="capitalize text-slate-700 font-medium">{flag.resolutionAction.replace('_', ' ')}</span>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {flag.resolvedAt ? new Date(flag.resolvedAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button size="sm" variant="outline" onClick={() => handleOpenReview(flag)}>
                            <Eye className="w-4 h-4 mr-2" /> View Details
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

        <TabsContent value="users">
          <Card className="border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              </div>
            ) : userStats.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                 <Users className="w-12 h-12 mb-4 text-slate-300" />
                 <h3 className="text-lg font-medium text-slate-900">No User Data</h3>
                 <p>No flags have been submitted by any users yet.</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4 text-center">Total Reports Submitted</th>
                      <th className="px-6 py-4 text-center border-l border-slate-200">False/Malicious Reports</th>
                      <th className="px-6 py-4">Account Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userStats.map((user) => (
                      <tr key={user._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-slate-500 text-xs">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-medium text-slate-700">
                          {user.totalSubmitted}
                        </td>
                        <td className="px-6 py-4 text-center border-l text-red-600 font-bold border-slate-100">
                          {user.falseFlags}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={user.status === 'restricted' ? 'destructive' : 'outline'} className={user.status === 'restricted' ? '' : 'text-green-600 border-green-200 bg-green-50'}>
                            {user.status === 'restricted' ? 'Flagging Restricted' : 'Active'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card className="border-slate-200 shadow-sm overflow-hidden min-h-[400px]">
             {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
              </div>
            ) : campaignStats.length === 0 ? (
               <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500">
                 <TrendingUp className="w-12 h-12 mb-4 text-slate-300" />
                 <h3 className="text-lg font-medium text-slate-900">No Campaign Data</h3>
                 <p>No campaigns currently have any flags associated with them.</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Campaign</th>
                      <th className="px-6 py-4 text-center">Total Flags (All-Time)</th>
                      <th className="px-6 py-4 text-center">Active Flags (Unresolved)</th>
                      <th className="px-6 py-4 text-center">Dismissed</th>
                      <th className="px-6 py-4 text-center">Upheld Reports</th>
                      <th className="px-6 py-4">Creator</th>
                      <th className="px-6 py-4 text-center border-l w-32 border-slate-200">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {campaignStats.map((camp) => (
                      <tr key={camp._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{camp.title}</div>
                          <div className="text-slate-500 text-xs">{camp.category} • <span className="capitalize">{camp.status}</span></div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                          {camp.totalFlags}
                        </td>
                        <td className="px-6 py-4 text-center border-l border-slate-100">
                          {camp.activeFlags > 0 ? (
                            <Badge variant="outline" className={getRiskColor(camp.activeFlags)}>
                              {camp.activeFlags}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">0</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-slate-500 font-medium">
                          {camp.dismissedFlags}
                        </td>
                        <td className="px-6 py-4 text-center text-red-600 font-medium border-r border-slate-100">
                          {camp.upheldFlags}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 font-medium text-sm">{camp.creator?.name || 'Unknown'}</div>
                          <div className="text-slate-500 text-xs">{camp.creator?.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-center border-l border-slate-50 w-32">
                          {camp.status === 'suspended' ? (
                            <Button 
                              variant="outline" 
                              onClick={() => handleRestoreCampaign(camp._id)}
                              className="w-full text-xs font-bold border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                            >
                              Restore
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-400 block whitespace-nowrap">-</span>
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

      {/* Report Review Modal */}
      {showReviewModal && selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-4xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-600" /> Review Report 
              </h2>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Left Column: Details */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Report Details</h3>
                    <div className="bg-red-50 border border-red-100 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-red-800 font-medium">Reason:</span>
                        <span className="text-sm text-red-900 font-bold">{selectedReport.reason}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-800 font-medium">Reporter:</span>
                        <span className="text-sm text-red-900">{selectedReport.reporter?.name}</span>
                      </div>
                      <div className="pt-2 border-t border-red-200">
                        <span className="text-xs text-red-800 font-medium block mb-1">Description:</span>
                        <p className="text-sm text-red-900 whitespace-pre-wrap">{selectedReport.description}</p>
                      </div>
                    </div>
                  </div>

                  {selectedReport.evidence && selectedReport.evidence.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Evidence Attached</h3>
                      <div className="flex gap-2 flex-wrap">
                         {selectedReport.evidence.map((img, i) => (
                           <a key={i} href={img.url} target="_blank" rel="noreferrer" className="block w-24 h-24 rounded-lg overflow-hidden border border-slate-200 hover:ring-2 hover:ring-blue-500 transition-all">
                             <img src={img.url} alt="Evidence" className="w-full h-full object-cover" />
                           </a>
                         ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Campaign Context</h3>
                    <Card className="p-4 border-slate-200 bg-slate-50">
                      <div className="font-bold text-slate-900 mb-1">{selectedReport.campaign?.title}</div>
                      <div className="text-sm text-slate-600 mb-2">Status: <span className="capitalize font-medium">{selectedReport.campaign?.status}</span></div>
                      
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-200">
                        <Badge variant="outline" className={getRiskColor(selectedReport.campaign?.activeFlagCount || 0)}>
                           {selectedReport.campaign?.activeFlagCount || 0} Active Reports
                        </Badge>
                      </div>
                      <Button variant="link" className="px-0 text-blue-600 h-auto mt-2 text-xs" onClick={() => window.open(`/campaigns/${selectedReport.campaign?._id}`, '_blank')}>View Full Campaign</Button>
                    </Card>
                  </div>
                </div>

                {/* Right Column: Resolution */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-3">Resolution Actions</h3>
                  
                  {['resolved', 'dismissed'].includes(selectedReport.status) ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mt-2">
                       <h4 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Historical Decision</h4>
                       
                       <div className="grid grid-cols-2 gap-4 mb-4">
                         <div>
                           <div className="text-xs text-slate-500 mb-1">Status</div>
                           <Badge variant={selectedReport.status === 'dismissed' ? 'outline' : 'default'} className={selectedReport.status === 'dismissed' ? 'border-slate-300 text-slate-600' : 'bg-red-600'}>
                             {selectedReport.status.toUpperCase()}
                           </Badge>
                         </div>
                         <div>
                           <div className="text-xs text-slate-500 mb-1">Action Taken</div>
                           <div className="text-sm font-medium text-slate-800 capitalize">
                             {selectedReport.resolutionAction ? selectedReport.resolutionAction.replace('_', ' ') : 'None'}
                           </div>
                         </div>
                       </div>
                       
                       <div className="pt-4 border-t border-slate-200">
                         <div className="text-xs text-slate-500 mb-2">Admin Comments</div>
                         <div className="text-sm text-slate-700 bg-white p-3 rounded border border-slate-200 whitespace-pre-wrap">
                           {selectedReport.adminComments || 'No comments provided.'}
                         </div>
                       </div>
                    </div>
                  ) : (
                    <>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setResolutionAction('none')}
                      className={`w-full text-left p-4 rounded-lg border transition-all group ${resolutionAction === 'none' ? 'border-green-500 bg-green-50 ring-1 ring-green-500' : 'border-slate-200 hover:border-green-300 hover:bg-green-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white text-green-600 rounded-full shadow-sm">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Dismiss Report</div>
                          <div className="text-xs text-slate-500">Content is safe, report is invalid</div>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setResolutionAction('warned')}
                      className={`w-full text-left p-4 rounded-lg border transition-all group ${resolutionAction === 'warned' ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500' : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white text-amber-600 rounded-full shadow-sm">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Issue Warning</div>
                          <div className="text-xs text-slate-500">Notify creator about violation</div>
                        </div>
                      </div>
                    </button>
                    
                     <button 
                      onClick={() => setResolutionAction('suspended')}
                      className={`w-full text-left p-4 rounded-lg border transition-all group ${resolutionAction === 'suspended' ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-500' : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white text-orange-600 rounded-full shadow-sm">
                          <Ban className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Suspend Campaign</div>
                          <div className="text-xs text-slate-500">Temporarily hide and ask for corrections</div>
                        </div>
                      </div>
                    </button>

                    <button 
                      onClick={() => setResolutionAction('terminated')}
                      className={`w-full text-left p-4 rounded-lg border transition-all group ${resolutionAction === 'terminated' ? 'border-red-500 bg-red-50 ring-1 ring-red-500' : 'border-slate-200 hover:border-red-300 hover:bg-red-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white text-red-600 rounded-full shadow-sm">
                          <XCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">Terminate Campaign</div>
                          <div className="text-xs text-slate-500">Remove permanently & trigger refunds</div>
                        </div>
                      </div>
                    </button>
                  </div>

                  {resolutionAction === 'none' && (
                    <div className="flex items-center gap-2 mt-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <input 
                        type="checkbox" 
                        id="malicious" 
                        checked={isMalicious}
                        onChange={(e) => setIsMalicious(e.target.checked)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <label htmlFor="malicious" className="text-sm text-slate-700">
                        Mark this flag as malicious/spam (Penalizes reporter)
                      </label>
                    </div>
                  )}

                  <div className="pt-4 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Resolution Comments (Required)</label>
                    <textarea 
                      value={adminComments}
                      onChange={(e) => setAdminComments(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Explain the reasoning for this decision. This will be sent to the user(s)."
                      rows="4"
                    ></textarea>
                  </div>
                  </>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowReviewModal(false)} disabled={isResolving}>
                {['resolved', 'dismissed'].includes(selectedReport.status) ? 'Close' : 'Cancel'}
              </Button>
              {!['resolved', 'dismissed'].includes(selectedReport.status) && (
                <Button 
                  onClick={handleResolveFlag}
                  disabled={isResolving || !adminComments}
                  className="bg-slate-900 text-white hover:bg-slate-800"
                >
                  {isResolving ? 'Saving...' : 'Save Resolution'}
                </Button>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

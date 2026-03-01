import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, XCircle, RefreshCw, Loader2, AlertCircle, Eye, Clock,
  FileText, Image, Video, ChevronDown, ChevronRight, DollarSign, Users, X
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/ui';
import { 
  getPendingMilestones, getMilestoneForReview, 
  approveMilestone, rejectMilestone, requestMilestoneResubmission 
} from '../../services/milestoneService';
import toast from 'react-hot-toast';

export function MilestoneReview() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewDetail, setReviewDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [rejectionCategory, setRejectionCategory] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [resubmissionFeedback, setResubmissionFeedback] = useState('');

  // Lightbox
  const [lightboxFile, setLightboxFile] = useState(null);

  useEffect(() => {
    fetchPendingMilestones();
  }, []);

  const fetchPendingMilestones = async () => {
    try {
      setLoading(true);
      const data = await getPendingMilestones();
      setSubmissions(data.submissions || []);
    } catch (err) {
      toast.error('Failed to load pending milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (submission) => {
    try {
      setSelectedSubmission(submission);
      setDetailLoading(true);
      const data = await getMilestoneForReview(
        submission.campaign._id, 
        submission.milestone._id
      );
      setReviewDetail(data);
    } catch (err) {
      toast.error('Failed to load milestone details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedSubmission) return;
    try {
      setActionLoading(true);
      const result = await approveMilestone(
        selectedSubmission.campaign._id,
        selectedSubmission.milestone._id
      );
      toast.success('Milestone approved successfully!');
      setSelectedSubmission(null);
      setReviewDetail(null);
      fetchPendingMilestones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve milestone');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      setActionLoading(true);
      await rejectMilestone(
        selectedSubmission.campaign._id,
        selectedSubmission.milestone._id,
        { rejectionCategory, rejectionReason }
      );
      toast.success('Milestone rejected and creator notified.');
      setShowRejectModal(false);
      resetModals();
      setSelectedSubmission(null);
      setReviewDetail(null);
      fetchPendingMilestones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject milestone');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResubmit = async () => {
    if (!resubmissionFeedback.trim()) {
      toast.error('Please provide feedback for resubmission');
      return;
    }
    try {
      setActionLoading(true);
      await requestMilestoneResubmission(
        selectedSubmission.campaign._id,
        selectedSubmission.milestone._id,
        { feedback: resubmissionFeedback }
      );
      toast.success('Resubmission requested and creator notified.');
      setShowResubmitModal(false);
      resetModals();
      setSelectedSubmission(null);
      setReviewDetail(null);
      fetchPendingMilestones();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request resubmission');
    } finally {
      setActionLoading(false);
    }
  };

  const resetModals = () => {
    setRejectionCategory('');
    setRejectionReason('');
    setResubmissionFeedback('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Milestone Review</h1>
        <p className="text-slate-500">
          Review submitted milestone proofs and approve fund releases
          {submissions.length > 0 && (
            <Badge className="ml-2 bg-amber-100 text-amber-700">{submissions.length} pending</Badge>
          )}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex gap-6">
        {/* List */}
        <div className={`space-y-3 ${selectedSubmission ? 'w-1/3' : 'w-full'} transition-all`}>
          {submissions.length === 0 ? (
            <Card className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">All caught up!</h3>
              <p className="text-slate-500">No pending milestone submissions to review.</p>
            </Card>
          ) : (
            submissions.map((sub, idx) => (
              <Card 
                key={`${sub.campaign._id}-${sub.milestone._id}`}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedSubmission?.milestone._id === sub.milestone._id 
                    ? 'ring-2 ring-sky-500 border-sky-300' 
                    : 'border-slate-200'
                }`}
                onClick={() => handleViewDetail(sub)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                    {sub.campaign.coverImage && (
                      <img src={sub.campaign.coverImage} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{sub.campaign.title}</p>
                    <p className="text-sm text-slate-600">
                      Milestone {sub.milestone.order}: {sub.milestone.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {new Date(sub.milestone.submittedAt).toLocaleDateString()}
                      <span>•</span>
                      <span className="text-sky-600 font-medium">
                        NPR {sub.milestone.releaseAmount?.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      By {sub.campaign.creator?.name}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 mt-1" />
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Detail Panel */}
        {selectedSubmission && (
          <div className="flex-1 space-y-4">
            {detailLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
              </div>
            ) : reviewDetail ? (
              <>
                {/* Campaign Details */}
                <Card className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-3">Campaign Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Creator</p>
                      <p className="font-medium">{reviewDetail.campaign.creator?.name}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Total Funded</p>
                      <p className="font-medium">NPR {reviewDetail.campaign.currentAmount?.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Released So Far</p>
                      <p className="font-medium">NPR {(reviewDetail.campaign.released_amount || 0).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Backers</p>
                      <p className="font-medium">{reviewDetail.campaign.backerCount}</p>
                    </div>
                  </div>

                  {/* All milestones overview */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-medium text-slate-700 mb-2">All Milestones</p>
                    <div className="flex gap-1">
                      {reviewDetail.campaign.milestones?.sort((a,b) => a.order - b.order).map(m => (
                        <div
                          key={m._id}
                          className={`flex-1 h-2 rounded-full ${
                            m.status === 'approved' || m.status === 'completed' ? 'bg-green-400' :
                            m.status === 'submitted' ? 'bg-yellow-400' :
                            m.status === 'rejected' ? 'bg-red-400' :
                            'bg-slate-200'
                          }`}
                          title={`${m.title} (${m.status})`}
                        />
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Milestone Submission */}
                <Card className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-1">
                    Milestone {reviewDetail.milestone.order}: {reviewDetail.milestone.title}
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">{reviewDetail.milestone.description}</p>



                  {/* Progress Description */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Creator's Progress Description</h4>
                    <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-700 whitespace-pre-wrap">
                      {reviewDetail.milestone.progressDescription || 'No description provided'}
                    </div>
                  </div>

                  {/* Proof Files */}
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-2">
                      Proof Files ({reviewDetail.milestone.proofFiles?.length || 0})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {reviewDetail.milestone.proofFiles?.map((file, idx) => (
                        <div 
                          key={idx}
                          className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => setLightboxFile(file)}
                        >
                          <div className="h-32 bg-slate-100 flex items-center justify-center overflow-hidden">
                            {file.fileType === 'image' ? (
                              <img src={file.url} alt={file.caption || ''} className="w-full h-full object-cover" />
                            ) : file.fileType === 'video' ? (
                              <Video className="w-8 h-8 text-slate-400" />
                            ) : (
                              <FileText className="w-8 h-8 text-slate-400" />
                            )}
                          </div>
                          {file.caption && (
                            <p className="text-xs text-slate-500 p-2 truncate">{file.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resubmission info */}
                  {reviewDetail.milestone.resubmissionCount > 0 && (
                    <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                      <p className="font-medium">This is resubmission #{reviewDetail.milestone.resubmissionCount}</p>
                    </div>
                  )}
                </Card>

                {/* Action Buttons */}
                <Card className="p-5">
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      className="text-amber-600 border-amber-300 hover:bg-amber-50"
                      onClick={() => setShowResubmitModal(true)}
                      disabled={actionLoading}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" /> Request Resubmission
                    </Button>
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Reject
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      Approve & Release Funds
                    </Button>
                  </div>
                </Card>
              </>
            ) : null}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white shadow-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Reject Milestone</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                <select
                  value={rejectionCategory}
                  onChange={(e) => setRejectionCategory(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                >
                  <option value="">Select a category...</option>
                  <option value="insufficient_proof">Insufficient Proof/Evidence</option>
                  <option value="poor_quality">Poor Quality Deliverables</option>
                  <option value="incomplete_work">Incomplete Work</option>
                  <option value="misleading">Misleading or Inaccurate Claims</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                  placeholder="Explain why this milestone is being rejected..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setShowRejectModal(false); resetModals(); }}>Cancel</Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleReject}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reject Milestone
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Resubmission Modal */}
      {showResubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md bg-white shadow-2xl p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Request Resubmission</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Feedback for Creator <span className="text-red-500">*</span>
              </label>
              <textarea
                value={resubmissionFeedback}
                onChange={(e) => setResubmissionFeedback(e.target.value)}
                className="flex min-h-[100px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                placeholder="Describe what needs to be improved or added for this milestone..."
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => { setShowResubmitModal(false); resetModals(); }}>Cancel</Button>
              <Button 
                className="bg-amber-600 hover:bg-amber-700 text-white"
                onClick={handleResubmit}
                disabled={actionLoading}
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Request Resubmission
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Lightbox */}
      {lightboxFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxFile(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setLightboxFile(null)}
              className="absolute -top-10 right-0 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
            {lightboxFile.fileType === 'image' ? (
              <img src={lightboxFile.url} alt={lightboxFile.caption || ''} className="max-h-[85vh] rounded-lg" />
            ) : lightboxFile.fileType === 'video' ? (
              <video src={lightboxFile.url} controls className="max-h-[85vh] rounded-lg" />
            ) : (
              <iframe src={lightboxFile.url} className="w-[800px] h-[85vh] bg-white rounded-lg" title="Document viewer" />
            )}
            {lightboxFile.caption && (
              <p className="text-white text-center mt-3">{lightboxFile.caption}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

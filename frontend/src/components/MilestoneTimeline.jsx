import React, { useState } from 'react';
import { CheckCircle2, Clock, Lock, ShieldCheck, ExternalLink, XCircle, RefreshCw, Eye, X, FileText, Video } from 'lucide-react';
import { Badge, Button } from './ui';

export function MilestoneTimeline({ milestones }) {
  const [lightboxFile, setLightboxFile] = useState(null);

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved': return 'bg-green-500';
      case 'in-progress': return 'bg-sky-500';
      case 'submitted':
      case 'under-review': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      case 'resubmission-required': return 'bg-amber-500';
      case 'locked':
      case 'pending':
      default: return 'bg-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'approved': return <CheckCircle2 className="w-6 h-6 text-white" />;
      case 'in-progress': return <Clock className="w-6 h-6 text-white" />;
      case 'submitted':
      case 'under-review': return <Eye className="w-6 h-6 text-white" />;
      case 'rejected': return <XCircle className="w-6 h-6 text-white" />;
      case 'resubmission-required': return <RefreshCw className="w-6 h-6 text-white" />;
      case 'locked':
      case 'pending': return <Lock className="w-6 h-6 text-white" />;
      default: return null;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'completed': <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Completed</Badge>,
      'approved': <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">Approved</Badge>,
      'in-progress': <Badge className="bg-sky-100 text-sky-700 hover:bg-sky-200 border-none">In Progress</Badge>,
      'submitted': <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none">Submitted</Badge>,
      'under-review': <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none">Under Review</Badge>,
      'rejected': <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-none">Rejected</Badge>,
      'resubmission-required': <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none">Resubmission Required</Badge>,
      'locked': <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none">Locked</Badge>,
      'pending': <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-none">Pending</Badge>,
    };
    return badges[status] || null;
  };

  const getLineColor = (status) => {
    if (['completed', 'approved'].includes(status)) return 'bg-green-500';
    return 'bg-gray-300';
  };

  return (
    <div className="space-y-6">
      {milestones.map((milestone, index) => (
        <div key={milestone._id || milestone.id || index} className="relative">
          {/* Connection Line */}
          {index < milestones.length - 1 && (
            <div 
              className={`absolute left-6 top-12 w-0.5 h-full ${getLineColor(milestone.status)}`}
            />
          )}

          {/* Milestone Card */}
          <div className="flex gap-4">
            {/* Icon */}
            <div className={`w-12 h-12 rounded-full ${getStatusColor(milestone.status)} flex items-center justify-center flex-shrink-0 relative z-10`}>
              {getStatusIcon(milestone.status)}
            </div>

            {/* Content */}
            <div className="flex-1 pb-8">
              <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="mb-1 font-semibold text-slate-900">{milestone.title}</h3>
                    {getStatusBadge(milestone.status)}
                  </div>
                  <div className="text-right">
                    <div className="text-sky-600 font-medium">
                      Rs. {(milestone.fundAmount || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {['approved', 'completed'].includes(milestone.status) ? 'released' : 'to be released'}
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-3">{milestone.description}</p>

                {/* Progress Description for submitted/reviewed milestones */}
                {milestone.progressDescription && ['submitted', 'under-review', 'approved', 'completed'].includes(milestone.status) && (
                  <div className="mb-3 p-3 bg-slate-50 rounded-lg">
                    <p className="text-xs font-medium text-slate-500 mb-1">Creator Update</p>
                    <p className="text-sm text-slate-700">{milestone.progressDescription}</p>
                  </div>
                )}

                {/* Rejection feedback */}
                {(milestone.status === 'rejected' || milestone.status === 'resubmission-required') && (
                  <div className="mb-3 p-3 bg-red-50 rounded-lg">
                    <p className="text-xs font-medium text-red-500 mb-1">Review Feedback</p>
                    <p className="text-sm text-red-700">{milestone.rejectionReason || milestone.resubmissionFeedback || 'No feedback provided'}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {['completed', 'approved'].includes(milestone.status) && milestone.reviewedAt && (
                      <span className="text-green-700 font-medium">
                        Approved on {new Date(milestone.reviewedAt).toLocaleDateString()}
                      </span>
                    )}
                    {milestone.status === 'submitted' && milestone.submittedAt && (
                      <span className="text-yellow-700 font-medium">
                        Submitted on {new Date(milestone.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                    {milestone.status === 'in-progress' && milestone.expectedDate && (
                      <span className="text-sky-700 font-medium">Expected by {new Date(milestone.expectedDate).toLocaleDateString()}</span>
                    )}
                    {['locked', 'pending'].includes(milestone.status) && milestone.expectedDate && (
                      <span className="text-gray-500">Expected by {new Date(milestone.expectedDate).toLocaleDateString()}</span>
                    )}
                  </div>

                  {/* Proof files viewer */}
                  {milestone.proofFiles && milestone.proofFiles.length > 0 && (
                    <div className="flex gap-1">
                      {milestone.proofFiles.slice(0, 3).map((file, i) => (
                        <button
                          key={i}
                          onClick={() => setLightboxFile(file)}
                          className="w-8 h-8 rounded border overflow-hidden hover:opacity-80 transition-opacity"
                        >
                          {file.fileType === 'image' ? (
                            <img src={file.thumbnailUrl || file.url} alt="" className="w-full h-full object-cover" />
                          ) : file.fileType === 'video' ? (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                              <Video className="w-3 h-3 text-slate-500" />
                            </div>
                          ) : (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                              <FileText className="w-3 h-3 text-slate-500" />
                            </div>
                          )}
                        </button>
                      ))}
                      {milestone.proofFiles.length > 3 && (
                        <span className="text-xs text-slate-500 self-center ml-1">
                          +{milestone.proofFiles.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-sky-50 rounded-lg border border-sky-200">
        <h4 className="text-sky-900 mb-2 font-medium flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> How Milestone-Based Funding Works</h4>
        <ul className="text-sm text-sky-800 space-y-1 pl-5 list-disc">
          <li>Funds are held securely until milestones are completed</li>
          <li>Creators submit proof for each milestone</li>
          <li>Our team verifies the submission within 48 hours</li>
          <li>Once verified, funds are released to the creator</li>
          <li>You'll receive notifications for each milestone completion</li>
        </ul>
      </div>

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
              <iframe src={lightboxFile.url} className="w-[800px] h-[85vh] bg-white rounded-lg" title="Document" />
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

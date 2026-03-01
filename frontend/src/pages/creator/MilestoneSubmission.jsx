import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Upload, CheckCircle2, Clock, XCircle, AlertCircle, Loader2, 
  FileText, Image, Video, X, ChevronRight, RefreshCw, Lock, ArrowLeft 
} from 'lucide-react';
import { Button, Card, Badge, Progress } from '../../components/ui';
import campaignService from '../../services/campaignService';
import { getCampaignMilestones, submitMilestoneProof } from '../../services/milestoneService';
import { uploadToCloudinary } from '../../services/cloudinaryService';
import toast from 'react-hot-toast';

// Milestone status badge config
const STATUS_CONFIG = {
  'pending': { color: 'bg-slate-100 text-slate-600', icon: Clock, label: 'Pending' },
  'in-progress': { color: 'bg-orange-100 text-orange-700', icon: Clock, label: 'In Progress' },
  'submitted': { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Submitted' },
  'under-review': { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Under Review' },
  'approved': { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Approved' },
  'rejected': { color: 'bg-red-100 text-red-700', icon: XCircle, label: 'Rejected' },
  'resubmission-required': { color: 'bg-amber-100 text-amber-700', icon: RefreshCw, label: 'Resubmission Required' },
  'completed': { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Completed' }
};

export function MilestoneSubmission() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [proofFiles, setProofFiles] = useState([]);
  const [progressDescription, setProgressDescription] = useState('');
  const [nextMilestoneEstimate, setNextMilestoneEstimate] = useState('');
  const [uploadProgress, setUploadProgress] = useState({});

  // Fetch creator's milestone-based campaigns
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getMyCampaigns();
      // Filter to milestone-based campaigns that are active/completed and funded
      const milestoneCampaigns = data.filter(c => 
        c.fundingType === 'milestone-based' && 
        ['active', 'completed'].includes(c.status)
      );
      setCampaigns(milestoneCampaigns);
    } catch (err) {
      setError('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCampaign = async (campaign) => {
    try {
      setSelectedCampaign(campaign);
      setLoading(true);
      const data = await getCampaignMilestones(campaign._id);
      setMilestones(data.milestones || []);
      setSelectedMilestone(null);
      resetForm();
    } catch (err) {
      setError('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProofFiles([]);
    setProgressDescription('');
    setNextMilestoneEstimate('');
    setUploadProgress({});
  };

  // Determine which milestone can be submitted next
  const getSubmittableMilestone = useCallback(() => {
    if (!milestones.length) return null;
    const sorted = [...milestones].sort((a, b) => a.order - b.order);
    for (const m of sorted) {
      if (['pending', 'in-progress', 'rejected', 'resubmission-required'].includes(m.status)) {
        // Check if all previous milestones are approved/completed
        const prevApproved = sorted
          .filter(pm => pm.order < m.order)
          .every(pm => ['approved', 'completed'].includes(pm.status));
        if (prevApproved) return m;
      }
    }
    return null;
  }, [milestones]);

  // File upload handler
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 10;
    
    if (proofFiles.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    for (const file of files) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      try {
        // Determine resource type for Cloudinary
        let resourceType = 'image';
        if (file.type.startsWith('video')) resourceType = 'video';
        else if (file.type === 'application/pdf') resourceType = 'raw';

        const result = await uploadToCloudinary(
          file, 
          (progress) => setUploadProgress(prev => ({ ...prev, [fileId]: progress })),
          file.type.startsWith('video') ? 'video' : file.type === 'application/pdf' ? 'raw' : 'image'
        );

        const proofFile = {
          url: result.url,
          publicId: result.publicId,
          caption: '',
          fileType: file.type.startsWith('image') ? 'image' : 
                    file.type.startsWith('video') ? 'video' : 'pdf',
          thumbnailUrl: result.url
        };

        setProofFiles(prev => [...prev, proofFile]);
        setUploadProgress(prev => {
          const copy = { ...prev };
          delete copy[fileId];
          return copy;
        });

        toast.success(`${file.name} uploaded`);
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Failed to upload ${file.name}`);
        setUploadProgress(prev => {
          const copy = { ...prev };
          delete copy[fileId];
          return copy;
        });
      }
    }
  };

  const removeProofFile = (index) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileCaption = (index, caption) => {
    setProofFiles(prev => prev.map((f, i) => i === index ? { ...f, caption } : f));
  };

  // Submit proof
  const handleSubmit = async () => {
    if (!selectedMilestone) return;

    if (proofFiles.length === 0) {
      toast.error('Please upload at least one proof file');
      return;
    }
    if (!progressDescription.trim()) {
      toast.error('Please provide a progress description');
      return;
    }

    try {
      setSubmitting(true);
      await submitMilestoneProof(selectedCampaign._id, selectedMilestone._id, {
        proofFiles,
        progressDescription: progressDescription.trim(),
        nextMilestoneEstimate: nextMilestoneEstimate || undefined
      });

      toast.success('Milestone proof submitted successfully!');
      
      // Refresh milestones
      const data = await getCampaignMilestones(selectedCampaign._id);
      setMilestones(data.milestones || []);
      setSelectedMilestone(null);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit proof');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !selectedCampaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
      </div>
    );
  }

  const submittableMilestone = getSubmittableMilestone();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        {selectedCampaign && (
          <button 
            onClick={() => { setSelectedCampaign(null); setSelectedMilestone(null); resetForm(); }}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Milestone Submissions</h1>
          <p className="text-slate-500">Submit proof of milestone completion for your campaigns</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Step 1: Campaign Selection */}
      {!selectedCampaign && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Select a Campaign</h2>
          {campaigns.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-slate-500">No milestone-based campaigns found that are eligible for proof submission.</p>
              <p className="text-sm text-slate-400 mt-2">Campaigns must be active/completed and have reached their funding goal.</p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {campaigns.map(campaign => (
                <Card 
                  key={campaign._id} 
                  className="p-5 hover:shadow-md transition-all cursor-pointer border-slate-200 hover:border-sky-300"
                  onClick={() => handleSelectCampaign(campaign)}
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      {campaign.coverImage ? (
                        <img src={campaign.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <Image className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{campaign.title}</h3>
                      <p className="text-sm text-slate-500">
                        Rs. {(campaign.currentAmount || 0).toLocaleString()} / Rs. {(campaign.fundingGoal || 0).toLocaleString()}
                        <span className="mx-2">•</span>
                        {campaign.milestones?.length || 0} milestones
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Milestone Overview + Submission */}
      {selectedCampaign && (
        <div className="space-y-6">
          {/* Campaign info */}
          <Card className="p-5 bg-gradient-to-r from-sky-50 to-sky-100/50 border-sky-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shrink-0">
                {selectedCampaign.coverImage && (
                  <img src={selectedCampaign.coverImage} alt="" className="w-full h-full object-cover" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{selectedCampaign.title}</h3>
                <p className="text-sm text-slate-600">
                  Funded: Rs. {(selectedCampaign.currentAmount || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-sky-600" />
            </div>
          ) : (
            <>
              {/* Milestones Timeline */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">Milestones</h2>
                {milestones.map((milestone, idx) => {
                  const config = STATUS_CONFIG[milestone.status] || STATUS_CONFIG['pending'];
                  const StatusIcon = config.icon;
                  const isSubmittable = submittableMilestone?._id === milestone._id;
                  const isSelected = selectedMilestone?._id === milestone._id;

                  return (
                    <div key={milestone._id} className="space-y-3">
                      <Card 
                        className={`p-4 transition-all ${
                          isSelected ? 'ring-2 ring-sky-500 border-sky-300' : 
                          isSubmittable ? 'border-sky-200 hover:border-sky-300 cursor-pointer' : 
                          'border-slate-200 opacity-80'
                        }`}
                        onClick={() => isSubmittable && setSelectedMilestone(milestone)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            milestone.status === 'approved' || milestone.status === 'completed' ? 'bg-green-100' :
                            milestone.status === 'rejected' ? 'bg-red-100' :
                            isSubmittable ? 'bg-sky-100' : 'bg-slate-100'
                          }`}>
                            <StatusIcon className={`w-4 h-4 ${
                              milestone.status === 'approved' || milestone.status === 'completed' ? 'text-green-600' :
                              milestone.status === 'rejected' ? 'text-red-600' :
                              isSubmittable ? 'text-sky-600' : 'text-slate-400'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium text-slate-900">
                                Milestone {milestone.order}: {milestone.title}
                              </span>
                              <Badge variant="outline" className={config.color}>
                                {config.label}
                              </Badge>
                              <span className="text-sm text-slate-500">{milestone.percentage}%</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">{milestone.description}</p>
                            {milestone.fundAmount && (
                              <p className="text-sm font-medium text-sky-600 mt-1">
                                Release: Rs. {milestone.fundAmount.toLocaleString()}
                              </p>
                            )}
                            {/* Rejection info */}
                            {(milestone.status === 'rejected' || milestone.status === 'resubmission-required') && (
                              <div className="mt-2 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                                <p className="font-medium">Feedback:</p>
                                <p>{milestone.rejectionReason || milestone.resubmissionFeedback || 'No feedback provided'}</p>
                                {milestone.resubmissionCount > 0 && (
                                  <p className="text-xs mt-1 text-red-500">Resubmission #{milestone.resubmissionCount}</p>
                                )}
                              </div>
                            )}
                            {isSubmittable && !isSelected && (
                              <p className="text-sm text-sky-600 mt-2 font-medium">
                                → Click to submit proof for this milestone
                              </p>
                            )}
                          </div>
                          {!isSubmittable && !['approved', 'completed', 'submitted', 'rejected', 'resubmission-required'].includes(milestone.status) && (
                            <Lock className="w-4 h-4 text-slate-300 mt-1" />
                          )}
                        </div>
                      </Card>

                      {/* Submission Form conditionally rendered under the selected milestone */}
                      {isSelected && (
                        <Card className="p-6 border-sky-200 bg-white space-y-6">
                          <h2 className="text-lg font-semibold text-slate-900">
                            Submit Proof — {milestone.title}
                          </h2>

                          {/* File Upload */}
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-slate-700">
                              Proof Files <span className="text-red-500">*</span>
                            </label>
                            <p className="text-xs text-slate-500">Upload images, videos, or PDFs as evidence of milestone completion</p>
                            
                            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-sky-400 transition-colors">
                              <input
                                type="file"
                                multiple
                                accept="image/*,video/*,.pdf"
                                onChange={handleFileChange}
                                className="hidden"
                                id={`proof-upload-${milestone._id}`}
                              />
                              <label htmlFor={`proof-upload-${milestone._id}`} className="cursor-pointer">
                                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                                <p className="text-sm text-slate-600">Click to upload or drag files here</p>
                                <p className="text-xs text-slate-400 mt-1">Images, Videos, PDFs • Max 10 files</p>
                              </label>
                            </div>

                            {/* Upload progress */}
                            {Object.entries(uploadProgress).map(([id, progress]) => (
                              <div key={id} className="flex items-center gap-3 text-sm">
                                <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
                                <div className="flex-1">
                                  <Progress value={progress} className="h-2" />
                                </div>
                                <span className="text-slate-500">{progress}%</span>
                              </div>
                            ))}

                            {/* Uploaded files */}
                            {proofFiles.length > 0 && (
                              <div className="space-y-2">
                                {proofFiles.map((file, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                                    <div className="w-12 h-12 rounded bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                                      {file.fileType === 'image' ? (
                                        <img src={file.url} alt="" className="w-full h-full object-cover" />
                                      ) : file.fileType === 'video' ? (
                                        <Video className="w-5 h-5 text-slate-500" />
                                      ) : (
                                        <FileText className="w-5 h-5 text-slate-500" />
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <input
                                        type="text"
                                        value={file.caption}
                                        onChange={(e) => updateFileCaption(idx, e.target.value)}
                                        placeholder="Add a caption..."
                                        className="w-full text-sm border border-slate-200 rounded px-2 py-1 bg-white"
                                      />
                                    </div>
                                    <button 
                                      onClick={() => removeProofFile(idx)}
                                      className="text-slate-400 hover:text-red-500"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Progress Description */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">
                              Progress Description <span className="text-red-500">*</span>
                            </label>
                            <textarea
                              value={progressDescription}
                              onChange={(e) => setProgressDescription(e.target.value)}
                              className="flex min-h-[120px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                              placeholder="Describe in detail what has been accomplished for this milestone, what evidence you're providing, and any relevant metrics or outcomes..."
                              maxLength={2000}
                            />
                            <p className="text-xs text-slate-400 text-right">{progressDescription.length}/2000</p>
                          </div>

                          {/* Next Milestone Estimate */}
                          <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-700">
                              Next Milestone Estimated Completion (optional)
                            </label>
                            <input
                              type="date"
                              value={nextMilestoneEstimate}
                              onChange={(e) => setNextMilestoneEstimate(e.target.value)}
                              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>

                          {/* Submit Button */}
                          <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button 
                              variant="outline" 
                              onClick={() => { setSelectedMilestone(null); resetForm(); }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              className="bg-sky-600 hover:bg-sky-700 text-white"
                              onClick={handleSubmit}
                              disabled={submitting || Object.keys(uploadProgress).length > 0}
                            >
                              {submitting ? (
                                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting...</>
                              ) : (
                                <><CheckCircle2 className="w-4 h-4 mr-2" /> Submit for Review</>
                              )}
                            </Button>
                          </div>
                        </Card>
                      )}
                    </div>
                  );
                })}
              </div>

              {!submittableMilestone && milestones.length > 0 && (
                <Card className="p-6 text-center bg-green-50 border-green-200">
                  <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="font-medium text-green-800">All milestones have been submitted or completed!</p>
                  <p className="text-sm text-green-600 mt-1">Check the notification bell for status updates.</p>
                </Card>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

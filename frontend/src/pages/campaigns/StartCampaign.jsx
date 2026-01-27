import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  CheckCircle2, ChevronRight, ChevronLeft, Upload, Plus, Trash2, 
  Calendar, DollarSign, Image as ImageIcon, Video, Save, Loader2, X, AlertCircle
} from 'lucide-react';
import { Button, Card, Input, Progress } from '../../components/ui';
import campaignService from '../../services/campaignService';
import { uploadToCloudinary } from '../../services/cloudinaryService';

// Predefined categories (matches backend)
const CAMPAIGN_CATEGORIES = [
  'Technology', 'Art', 'Music', 'Film', 'Games', 
  'Education', 'Community', 'Innovation', 'Health', 'Environment'
];

// Duration options (7-90 days)
const DURATION_OPTIONS = [
  { value: 7, label: '7 Days' },
  { value: 14, label: '14 Days' },
  { value: 30, label: '30 Days' },
  { value: 45, label: '45 Days' },
  { value: 60, label: '60 Days' },
  { value: 90, label: '90 Days' }
];

// Initial form state
const initialFormState = {
  title: '',
  description: '',
  shortDescription: '',
  category: 'Technology',
  fundingGoal: '',
  duration: 30,
  fundingType: 'reward-based',
  rewardTiers: [],
  milestones: [],
  images: [],
  video: null
};

// Initial reward tier
const createEmptyRewardTier = () => ({
  id: Date.now(),
  title: '',
  description: '',
  amount: '',
  deliveryDate: '',
  quantityLimit: '',
  isAvailable: true
});

// Initial milestone
const createEmptyMilestone = (order) => ({
  id: Date.now(),
  title: '',
  description: '',
  percentage: '',
  order,
  estimatedCompletionDate: ''
});

export function StartCampaign() {
  const navigate = useNavigate();
  const { campaignId } = useParams(); // For editing existing campaigns
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormState);
  const [campaignDbId, setCampaignDbId] = useState(null); // Store DB id after first save
  const [campaignStatus, setCampaignStatus] = useState('draft');
  const [originalData, setOriginalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  
  // Image/Video upload refs and state
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreview, setVideoPreview] = useState(null);

  // Calculate total steps based on funding type
  const totalSteps = formData.fundingType === 'milestone-based' ? 6 : 5;
  const progress = (step / totalSteps) * 100;

  // Load existing campaign if editing
  useEffect(() => {
    if (campaignId) {
      loadCampaign(campaignId);
    }
  }, [campaignId]);

  const loadCampaign = async (id) => {
    try {
      setLoading(true);
      const campaign = await campaignService.getCampaignById(id);
      
      const mappedData = {
        title: campaign.pendingUpdates?.title || campaign.title || '',
        description: campaign.pendingUpdates?.description || campaign.description || '',
        shortDescription: campaign.pendingUpdates?.shortDescription || campaign.shortDescription || '',
        category: campaign.pendingUpdates?.category || campaign.category || 'Technology',
        fundingGoal: (campaign.pendingUpdates?.fundingGoal || campaign.fundingGoal)?.toString() || '',
        duration: campaign.pendingUpdates?.duration || campaign.duration || 30,
        fundingType: campaign.pendingUpdates?.fundingType || campaign.fundingType || 'reward-based',
        rewardTiers: (campaign.pendingUpdates?.rewardTiers || campaign.rewardTiers)?.map((t, idx) => ({ ...t, id: t._id || `tier-${idx}` })) || [],
        milestones: (campaign.pendingUpdates?.milestones || campaign.milestones)?.map((m, idx) => ({ ...m, id: m._id || `milestone-${idx}` })) || [],
        images: campaign.pendingUpdates?.images || campaign.images || [],
        video: campaign.pendingUpdates?.video || campaign.video || null
      };

      setFormData(mappedData);
      setOriginalData(mappedData);
      
      // CRITICAL: Set DB ID and status so edits update the existing campaign
      setCampaignDbId(campaign._id);
      setCampaignStatus(campaign.status);

      if (campaign.pendingUpdates && Object.keys(campaign.pendingUpdates).length > 0) {
        // Use pending images for preview
        const previewImages = (campaign.pendingUpdates.images || campaign.images || []).map(i => i.url);
        setImagePreviews(previewImages);
        if (campaign.pendingUpdates.video?.url) setVideoPreview(campaign.pendingUpdates.video.url);
        else if (campaign.video?.url) setVideoPreview(campaign.video.url);
      } else {
        setImagePreviews(campaign.images?.map(i => i.url) || []);
        if (campaign.video?.url) setVideoPreview(campaign.video.url);
      }
    } catch (err) {
      setError('Failed to load campaign');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // Form field handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleFundingTypeChange = (type) => {
    setFormData(prev => ({ ...prev, fundingType: type }));
  };

  // Reward Tier Handlers
  const addRewardTier = () => {
    setFormData(prev => ({
      ...prev,
      rewardTiers: [...prev.rewardTiers, createEmptyRewardTier()]
    }));
  };

  const updateRewardTier = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      rewardTiers: prev.rewardTiers.map(tier => 
        tier.id === id ? { ...tier, [field]: value } : tier
      )
    }));
  };

  const removeRewardTier = (id) => {
    setFormData(prev => ({
      ...prev,
      rewardTiers: prev.rewardTiers.filter(tier => tier.id !== id)
    }));
  };

  // Milestone Handlers
  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [...prev.milestones, createEmptyMilestone(prev.milestones.length + 1)]
    }));
  };

  const updateMilestone = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => 
        m.id === id ? { ...m, [field]: value } : m
      )
    }));
  };

  const removeMilestone = (id) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter(m => m.id !== id)
        .map((m, idx) => ({ ...m, order: idx + 1 }))
    }));
  };

  // Get total milestone percentage
  const totalMilestonePercentage = formData.milestones.reduce(
    (sum, m) => sum + (parseInt(m.percentage) || 0), 0
  );

  // Media Upload Handlers - Direct upload to Cloudinary (FAST)
  const handleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    // Check limit
    if (imagePreviews.length + files.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }

    setUploadingMedia(true);
    setUploadProgress(0);
    setError('');

    try {
      const uploadedImages = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Show preview immediately
        const preview = URL.createObjectURL(file);
        setImagePreviews(prev => [...prev, preview]);
        
        // Upload directly to Cloudinary (bypasses backend = FAST)
        const result = await uploadToCloudinary(file, (percent) => {
          // Calculate overall progress across all files
          const overallProgress = Math.round(((i * 100) + percent) / files.length);
          setUploadProgress(overallProgress);
        });
        
        uploadedImages.push({ url: result.url, publicId: result.publicId });
      }
      
      // Update form data with uploaded images
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...uploadedImages]
      }));
      
      setSuccess(`${files.length} image(s) uploaded successfully!`);
    } catch (err) {
      console.error('Image upload error:', err);
      setError('Failed to upload images: ' + err.message);
      // Remove failed previews
      setImagePreviews(prev => prev.slice(0, prev.length - files.length));
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  const handleVideoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show local preview immediately
    setVideoPreview(URL.createObjectURL(file));
    setUploadingMedia(true);
    setUploadProgress(0);
    setError('');

    try {
      // Upload directly to Cloudinary (bypasses backend = FAST for videos)
      const result = await uploadToCloudinary(file, (percent) => {
        setUploadProgress(percent);
      }, 'video');
      
      setFormData(prev => ({
        ...prev,
        video: { url: result.url, publicId: result.publicId }
      }));
      
      setSuccess('Video uploaded successfully!');
    } catch (err) {
      console.error('Video upload error:', err);
      setError('Failed to upload video: ' + err.message);
      setVideoPreview(null);
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
    }
  };

  const removeImage = (index) => {
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
      pendingImages: (prev.pendingImages || []).filter((_, i) => i !== index)
    }));
  };

  const removeVideo = () => {
    setVideoPreview(null);
    setFormData(prev => ({ ...prev, video: null, pendingVideo: null }));
  };

  // Prepare data for API (clean up form data)
  const prepareDataForApi = () => {
    const data = {
      title: formData.title,
      description: formData.description,
      shortDescription: formData.shortDescription,
      category: formData.category,
      images: formData.images,
      fundingGoal: parseInt(formData.fundingGoal) || 0,
      duration: parseInt(formData.duration) || 30,
      fundingType: formData.fundingType,
      rewardTiers: formData.rewardTiers.map(t => ({
        title: t.title,
        description: t.description,
        amount: parseInt(t.amount) || 0,
        deliveryDate: t.deliveryDate,
        quantityLimit: t.quantityLimit ? parseInt(t.quantityLimit) : null,
        isAvailable: t.isAvailable !== false
      })).filter(t => t.title && t.amount),
      milestones: formData.milestones.map(m => ({
        title: m.title,
        description: m.description,
        percentage: parseInt(m.percentage) || 0,
        order: m.order,
        estimatedCompletionDate: m.estimatedCompletionDate
      })).filter(m => m.title && m.percentage)
    };
    return data;
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setError('');

      const data = prepareDataForApi();
      const result = await campaignService.saveDraft(data, campaignDbId);
      
      setCampaignDbId(result._id);
      setSuccess('Draft saved successfully!');

      // Upload pending media if any
      if (formData.pendingImages?.length > 0) {
        await campaignService.uploadCampaignImages(result._id, formData.pendingImages);
      }
      if (formData.pendingVideo) {
        await campaignService.uploadCampaignMedia(result._id, formData.pendingVideo, 'video');
      }
      
      // Clear pending
      setFormData(prev => ({ ...prev, pendingImages: [], pendingVideo: null }));

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  // Submit for Approval
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // First save the latest data
      const data = prepareDataForApi();
      let dbId = campaignDbId;
      
      if (!dbId) {
        const result = await campaignService.saveDraft(data);
        dbId = result._id;
        setCampaignDbId(dbId);

        // Upload pending media
        if (formData.pendingImages?.length > 0) {
          await campaignService.uploadCampaignImages(dbId, formData.pendingImages);
        }
        if (formData.pendingVideo) {
          await campaignService.uploadCampaignMedia(dbId, formData.pendingVideo, 'video');
        }
      } else {
        await campaignService.updateCampaign(dbId, data);
      }

      // Submit for approval (only if draft)
      if (campaignStatus === 'draft') {
        await campaignService.submitCampaign(dbId);
        setSuccess('Campaign submitted for approval!');
      } else if (campaignStatus === 'active') {
        setSuccess('Edit request submitted for administrator approval.');
      } else {
        setSuccess('Campaign updated successfully!');
      }
      
      
      setShowSuccessPage(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to submit campaign');
    } finally {
      setLoading(false);
    }
  };

  // Validation per step
  const validateStep = (stepNum) => {
    switch(stepNum) {
      case 1:
        if (!formData.title || formData.title.length < 5) return 'Title must be at least 5 characters';
        if (!formData.description || formData.description.length < 100) return 'Description must be at least 100 characters';
        if (!formData.category) return 'Category is required';
        return null;
      case 2:
        if (!formData.fundingGoal || parseInt(formData.fundingGoal) < 1000) return 'Funding goal must be at least NPR 1,000';
        if (!formData.duration) return 'Duration is required';
        if (!formData.fundingType) return 'Funding type is required';
        return null;
      case 3:
        if (imagePreviews.length === 0) return 'At least one image is required';
        return null;
      case 4:
        if (formData.fundingType === 'reward-based' && formData.rewardTiers.length === 0)
          return 'At least one reward tier is required';
        return null;
      case 5:
        if (formData.fundingType === 'milestone-based') {
          if (formData.milestones.length === 0) return 'At least one milestone is required';
          if (totalMilestonePercentage !== 100) return 'Milestone percentages must total 100%';
        }
        return null;
      default:
        return null;
    }
  };

  const handleNextStep = () => {
    const validation = validateStep(step);
    if (validation) {
      setError(validation);
      return;
    }
    setError('');
    nextStep();
  };

  if (loading && campaignId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (showSuccessPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-xl w-full p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {campaignStatus === 'active' ? 'Edit Request Submitted' : 'Campaign Submitted!'}
          </h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto">
            {success || 'Your changes have been saved successfully.'}
            {campaignStatus === 'active' && ' Admin approval is required before changes go live.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/creator/campaigns')} 
              className="bg-sky-600 hover:bg-sky-700 min-w-[200px]"
            >
              Go to My Campaigns
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(`/campaigns/${campaignDbId}`)}
            >
              View Preview
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              {campaignDbId ? 'Edit Campaign' : 'Start a Campaign'}
            </h1>
            <div className="flex items-center gap-4 text-sm font-medium text-slate-500 mb-2">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}% Completed</span>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="text-slate-600 border-slate-300 hover:bg-slate-100 w-full sm:w-auto"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save as Draft
          </Button>
        </div>
        <Progress value={progress} className="h-2 mb-8" />

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <CheckCircle2 className="w-5 h-5" />
            {success}
          </div>
        )}

        {/* Upload Progress */}
        {uploadingMedia && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-blue-700 font-medium">Uploading... {uploadProgress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        <Card className="p-6 md:p-8 border-slate-200 shadow-lg">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Basic Information</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Campaign Title *</label>
                  <Input 
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Smart Solar Backpack" 
                  />
                  <p className="text-xs text-slate-500">Minimum 5 characters. Keep it short and impactful.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Category *</label>
                  <select 
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {CAMPAIGN_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Short Description</label>
                  <Input 
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleInputChange}
                    placeholder="A brief tagline for your campaign"
                    maxLength={200}
                  />
                  <p className="text-xs text-slate-500">{formData.shortDescription.length}/200 characters</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Description *</label>
                  <textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="flex min-h-[150px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Tell your story... explain your project, why it matters, and how funds will be used."
                  />
                  <p className="text-xs text-slate-500">
                    {formData.description.length}/100 minimum characters
                    {formData.description.length < 100 && ` (${100 - formData.description.length} more needed)`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Funding Details */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Funding Details</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Funding Goal (NPR) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Rs.</span>
                    <Input 
                      name="fundingGoal"
                      type="number" 
                      value={formData.fundingGoal}
                      onChange={handleInputChange}
                      placeholder="50000" 
                      className="pl-10"
                      min="1000"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Minimum NPR 1,000</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Duration *</label>
                  <select 
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    {DURATION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500">Campaign will run for this many days after approval</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Funding Type *</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['reward-based', 'donation-based', 'milestone-based'].map((type) => (
                      <div 
                        key={type} 
                        onClick={() => handleFundingTypeChange(type)}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          formData.fundingType === type 
                            ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-600' 
                            : 'border-slate-200 hover:border-blue-500 hover:bg-blue-50'
                        }`}
                      >
                        <div className="font-medium capitalize">{type.replace('-', ' ')}</div>
                        <p className="text-xs mt-1 text-slate-500">
                          {type === 'reward-based' && 'Offer rewards to backers'}
                          {type === 'donation-based' && 'Accept donations without rewards'}
                          {type === 'milestone-based' && 'Release funds in phases'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Media Upload */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Media Upload</h2>
              
              <div className="space-y-6">
                {/* Images */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Campaign Images * ({imagePreviews.length}/5)
                  </label>
                  
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative group">
                          <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover rounded-lg" />
                          <button 
                            onClick={() => removeImage(idx)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          {idx === 0 && (
                            <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                              Cover
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {imagePreviews.length < 5 && (
                    <div 
                      onClick={() => imageInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50"
                    >
                      <input 
                        ref={imageInputRef}
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <div className="inline-flex p-4 bg-white rounded-full shadow-sm mb-4">
                        {uploadingMedia ? (
                          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-sky-600" />
                        )}
                      </div>
                      <h3 className="font-medium text-slate-900">Upload Campaign Images</h3>
                      <p className="text-sm text-slate-500 mt-1">Drag & drop or click to browse</p>
                      <p className="text-xs text-slate-400 mt-2">JPG, PNG up to 10MB each. First image is cover.</p>
                    </div>
                  )}
                </div>

                {/* Video */}
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">
                    Pitch Video (Optional)
                  </label>
                  
                  {videoPreview ? (
                    <div className="relative">
                      <video src={videoPreview} controls className="w-full rounded-lg" />
                      <button 
                        onClick={removeVideo}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => videoInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-slate-50"
                    >
                      <input 
                        ref={videoInputRef}
                        type="file" 
                        accept="video/*" 
                        onChange={handleVideoSelect}
                        className="hidden"
                      />
                      <div className="inline-flex p-4 bg-white rounded-full shadow-sm mb-4">
                        <Video className="w-8 h-8 text-purple-600" />
                      </div>
                      <h3 className="font-medium text-slate-900">Upload Pitch Video</h3>
                      <p className="text-sm text-slate-500 mt-1">MP4, MOV up to 100MB</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Rewards & Tiers */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Rewards & Tiers</h2>
              
              {formData.fundingType === 'donation-based' ? (
                <div className="text-center py-8 text-slate-500">
                  <p>Donation-based campaigns don't require reward tiers.</p>
                  <p className="text-sm mt-2">You can proceed to the next step.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.rewardTiers.map((tier, idx) => (
                    <div key={tier.id} className="border border-slate-200 rounded-xl p-6 relative">
                      <button 
                        onClick={() => removeRewardTier(tier.id)}
                        className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                      <h3 className="font-bold text-lg mb-4">Reward Tier #{idx + 1}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Title *</label>
                          <Input 
                            value={tier.title}
                            onChange={(e) => updateRewardTier(tier.id, 'title', e.target.value)}
                            placeholder="Early Bird Special" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Amount (NPR) *</label>
                          <Input 
                            type="number" 
                            value={tier.amount}
                            onChange={(e) => updateRewardTier(tier.id, 'amount', e.target.value)}
                            placeholder="1000" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Delivery Date *</label>
                          <Input 
                            type="date" 
                            value={tier.deliveryDate}
                            onChange={(e) => updateRewardTier(tier.id, 'deliveryDate', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Quantity Limit</label>
                          <Input 
                            type="number" 
                            value={tier.quantityLimit}
                            onChange={(e) => updateRewardTier(tier.id, 'quantityLimit', e.target.value)}
                            placeholder="Leave empty for unlimited"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <label className="text-sm font-medium text-slate-700">Description *</label>
                          <textarea 
                            value={tier.description}
                            onChange={(e) => updateRewardTier(tier.id, 'description', e.target.value)}
                            className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" 
                            placeholder="What backers will receive..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button 
                    variant="outline" 
                    className="w-full border-dashed border-2 py-6 text-slate-500 hover:text-sky-600 hover:border-blue-600"
                    onClick={addRewardTier}
                  >
                    <Plus className="w-5 h-5 mr-2" /> Add Reward Tier
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Milestones (Only if Milestone-based) */}
          {step === 5 && formData.fundingType === 'milestone-based' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 border-b pb-4">Project Milestones</h2>
              <p className="text-sm text-slate-500">
                Define the key phases of your project. Funds will be released upon verification of each milestone.
                <span className={`ml-2 font-medium ${totalMilestonePercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
                  Total: {totalMilestonePercentage}% {totalMilestonePercentage !== 100 && '(must equal 100%)'}
                </span>
              </p>
              
              <div className="space-y-4">
                {formData.milestones.map((milestone, idx) => (
                  <div key={milestone.id} className="border border-slate-200 rounded-xl p-6 relative">
                    <button 
                      onClick={() => removeMilestone(milestone.id)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg">Milestone #{idx + 1}</h3>
                      <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                        {milestone.percentage || 0}% of Funds
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Milestone Title *</label>
                        <Input 
                          value={milestone.title}
                          onChange={(e) => updateMilestone(milestone.id, 'title', e.target.value)}
                          placeholder="e.g., Prototype Development" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Description & Deliverables *</label>
                        <textarea 
                          value={milestone.description}
                          onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                          className="flex min-h-[80px] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          placeholder="What will you achieve in this phase?"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Percentage (%) *</label>
                          <Input 
                            type="number"
                            value={milestone.percentage}
                            onChange={(e) => updateMilestone(milestone.id, 'percentage', e.target.value)}
                            placeholder="25"
                            min="1"
                            max="100"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-700">Est. Completion Date</label>
                          <Input 
                            type="date"
                            value={milestone.estimatedCompletionDate}
                            onChange={(e) => updateMilestone(milestone.id, 'estimatedCompletionDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <Button 
                  variant="outline" 
                  className="w-full border-dashed border-2 py-6 text-slate-500 hover:text-sky-600 hover:border-blue-600"
                  onClick={addMilestone}
                >
                  <Plus className="w-5 h-5 mr-2" /> Add Another Milestone
                </Button>
              </div>
            </div>
          )}

          {/* Final Step: Review */}
          {step === totalSteps && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center py-8">
                <div className="inline-flex p-4 bg-green-100 rounded-full text-green-600 mb-4">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Ready to Launch?</h2>
                <p className="text-slate-500 mt-2">Review your campaign details before submitting for approval.</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-6 space-y-4 text-sm">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Title</span>
                  <span className="font-medium">{formData.title || 'Not set'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Category</span>
                  <span className="font-medium">{formData.category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Goal</span>
                  <span className="font-medium">Rs. {parseInt(formData.fundingGoal || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Duration</span>
                  <span className="font-medium">{formData.duration} Days</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Funding Type</span>
                  <span className="font-medium capitalize">{formData.fundingType.replace('-', ' ')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Images</span>
                  <span className="font-medium">{imagePreviews.length} uploaded</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500">Reward Tiers</span>
                  <span className="font-medium">{formData.rewardTiers.length} defined</span>
                </div>
                {formData.fundingType === 'milestone-based' && (
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span className="text-slate-500">Milestones</span>
                    <span className="font-medium">{formData.milestones.length} defined ({totalMilestonePercentage}%)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
            <Button 
              variant="ghost" 
              onClick={prevStep} 
              disabled={step === 1}
              className={step === 1 ? 'invisible' : ''}
            >
              <ChevronLeft className="w-4 h-4 mr-2" /> Previous
            </Button>
            
            {step < totalSteps ? (
              <Button onClick={handleNextStep} className="bg-sky-600 hover:bg-blue-700">
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button 
                onClick={handleSubmit} 
                className="bg-green-600 hover:bg-green-700 px-8"
                disabled={loading || (campaignStatus === 'active' && JSON.stringify(formData) === JSON.stringify(originalData))}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
                ) : (
                  campaignStatus === 'active' ? 'Update Campaign' : 'Submit for Approval'
                )}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

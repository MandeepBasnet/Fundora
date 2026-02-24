import React, { useState } from 'react';
import { Flag, X, Upload } from 'lucide-react';
import { Button, Card } from '../ui';
import api from '../../services/api';
import toast from 'react-hot-toast';

const REPORT_REASONS = [
  'Fraud/Scam',
  'Misleading Information',
  'Inappropriate Content',
  'Copyright Violation',
  'No Progress Updates',
  'Spam',
  'Other'
];

export function ReportCampaignModal({ isOpen, onClose, campaignId }) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorError, setError] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Check quantity limit
    if (files.length + selectedFiles.length > 3) {
      toast.error('You can only upload up to 3 images as evidence.');
      return;
    }

    // Check size limit (5MB each)
    for (let file of selectedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds 5MB limit.`);
        return;
      }
    }

    setFiles(prev => [...prev, ...selectedFiles].slice(0, 3));
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!reason) {
      setError('Please select a reason for reporting.');
      return;
    }

    if (description.length < 100) {
      setError(`Description is too short. Please provide at least 100 characters. Currently: ${description.length} chars.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('campaignId', campaignId);
      formData.append('reason', reason);
      formData.append('description', description);
      
      files.forEach(file => {
        formData.append('evidence', file);
      });

      const response = await api.post('/flags', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success(response.data.message || 'Report submitted successfully.');
        onClose();
        // Reset form
        setReason('');
        setDescription('');
        setFiles([]);
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error.response?.data?.message || 'Failed to submit report. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-lg bg-white shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Flag className="w-5 h-5 text-red-500" />
            Report Campaign
          </h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6">
            Your report will be reviewed by our Trust & Safety team. Please provide as much detailed evidence as possible.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {errorError && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
                {errorError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reason for reporting <span className="text-red-500">*</span>
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select a reason...</option>
                {REPORT_REASONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex justify-between">
                <span>Detailed Description <span className="text-red-500">*</span></span>
                <span className={`text-xs ${description.length < 100 ? 'text-red-500' : 'text-green-600'}`}>
                  {description.length}/min 100 chars
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Please describe exactly why you are flagging this campaign..."
                rows="4"
                className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Evidence / Screenshots (Optional, Max 3 images)
              </label>
              
              <div className="flex flex-wrap gap-2 mb-2">
                {files.map((file, index) => (
                  <div key={index} className="relative group w-20 h-20 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                    <img src={URL.createObjectURL(file)} alt="Evidence" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => removeFile(index)} 
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                
                {files.length < 3 && (
                  <label className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50 cursor-pointer flex flex-col items-center justify-center text-slate-500 transition-colors">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium uppercase tracking-wide">Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-slate-500">Supported formats: JPG, PNG. Max 5MB per file.</p>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || description.length < 100 || !reason} className="bg-red-600 hover:bg-red-700 text-white min-w-[120px]">
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

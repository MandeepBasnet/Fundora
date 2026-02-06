import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import { format } from 'date-fns';

const UpdateFeed = ({ campaignId, creatorId }) => {
  const { user } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    images: [],
    video: null
  });
  const [submitting, setSubmitting] = useState(false);

  const isCreator = user && user._id === creatorId;

  useEffect(() => {
    fetchUpdates();
  }, [campaignId]);

  const fetchUpdates = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getUpdates(campaignId);
      setUpdates(data);
    } catch (err) {
      console.error('Error fetching updates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'images') {
      if (files.length > 3) {
        alert('Maximum 3 images allowed');
        return;
      }
      setFormData(prev => ({ ...prev, images: Array.from(files) }));
    } else if (name === 'video') {
      setFormData(prev => ({ ...prev, video: files[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newUpdate = await campaignService.createUpdate(campaignId, formData);
      setUpdates([newUpdate, ...updates]);
      setShowForm(false);
      setFormData({ title: '', content: '', images: [], video: null });
    } catch (err) {
      console.error('Error creating update:', err);
      alert('Failed to post update');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">
          Updates ({updates.length})
        </h3>
        {isCreator && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Post Update
          </button>
        )}
      </div>

      {/* Post Update Form */}
      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h4 className="text-xl font-semibold mb-4">New Update</h4>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full p-2 border rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                className="w-full p-2 border rounded-md"
                rows="5"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Images (Max 3)</label>
                <input
                  type="file"
                  name="images"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Video (Max 1)</label>
                <input
                  type="file"
                  name="video"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="w-full text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'Posting...' : 'Post Update'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Updates List */}
      {loading ? (
        <div className="text-center py-8">Loading updates...</div>
      ) : updates.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No updates posted yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {updates.map((update, index) => (
            <div 
              key={update._id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-sm font-medium text-emerald-600 mb-1 block">
                      Update #{updates.length - index}
                    </span>
                    <h4 className="text-xl font-bold text-gray-900">
                      {update.title}
                    </h4>
                  </div>
                  <span className="text-sm text-gray-500">
                    {format(new Date(update.createdAt), 'MMM d, yyyy')}
                  </span>
                </div>

                <div className="prose max-w-none text-gray-600 mb-6 whitespace-pre-wrap">
                  {update.content}
                </div>

                {/* Media Grid */}
                {(update.images?.length > 0 || update.video) && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    {update.video && (
                      <div className="col-span-2 aspect-video bg-black rounded-lg overflow-hidden">
                        <video 
                          src={update.video.url} 
                          controls 
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {update.images?.map((img, i) => (
                      <div key={i} className="aspect-video rounded-lg overflow-hidden bg-gray-100">
                        <img 
                          src={img.url} 
                          alt={`Update attachment ${i+1}`}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {/* Future: Add Like/Comment on updates */}
                  <span>{update.likes?.length || 0} Likes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpdateFeed;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import campaignService from '../../services/campaignService';
import CommentItem from './CommentItem';

const CommentSection = ({ campaignId, creatorId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' or 'oldest'

  useEffect(() => {
    fetchComments();
  }, [campaignId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await campaignService.getComments(campaignId);
      setComments(data);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const addedComment = await campaignService.addComment(campaignId, newComment);
      setComments([addedComment, ...comments]);
      setNewComment('');
    } catch (err) {
      console.error('Error posting comment:', err);
      setError('Failed to post comment');
    }
  };

  const handleReply = async (commentId, content) => {
    try {
      const addedReply = await campaignService.addComment(campaignId, content, commentId);
      // Optimistically update or re-fetch. Re-fetching is safer for threading consistency
      // But let's try to append locally for better UX if possible, 
      // simplified: just re-fetch to ensure correct tree structure construction
      fetchComments(); 
    } catch (err) {
      setError('Failed to post reply');
    }
  };

  const handleEdit = async (commentId, content) => {
    try {
      await campaignService.editComment(commentId, content);
      setComments(comments.map(c => 
        c._id === commentId ? { ...c, content, isEdited: true } : c
      ));
      // Also need to check if it was a nested comment. 
      // Since our state is flat list and we process it on render, updating flat list is enough? 
      // Yes, if we structure it every render.
      fetchComments(); // Simplest approach to ensure deep updates
    } catch (err) {
      setError('Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await campaignService.deleteComment(commentId);
      fetchComments();
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  // Organize comments into threads
  const getThreadedComments = () => {
    const map = {};
    const roots = [];
    
    // Deep copy to avoid mutating state directly during sorting
    const commentsCopy = JSON.parse(JSON.stringify(comments));

    // Sort based on selection
    commentsCopy.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    // Initialize map
    commentsCopy.forEach(c => {
      c.replies = [];
      map[c._id] = c;
    });

    // Build tree
    commentsCopy.forEach(c => {
      if (c.parentComment) {
        if (map[c.parentComment]) {
          map[c.parentComment].replies.push(c);
        } else {
          // Parent might be deleted or missing, treat as root or orphan? 
          // If parent soft-deleted, it should still be in the list.
          // If hard-deleted (no replies), then this shouldn't happen for valid data.
          roots.push(c);
        }
      } else {
        roots.push(c);
      }
    });

    return roots;
  };

  const threadedComments = getThreadedComments();

  return (
    <div className="mt-8">
      <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
        Comments ({comments.length})
      </h3>

      {/* New Comment Form */}
      {user ? (
        <form onSubmit={handlePostComment} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Ask a question or share your thoughts..."
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
            rows="3"
            maxLength={1000}
          />
          <div className="flex justify-between items-center mt-2">
            <span className="text-sm text-gray-500">
              {newComment.length}/1000 characters
            </span>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Post Comment
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            Please <a href="/login" className="text-emerald-600 hover:underline">log in</a> to post comments.
          </p>
        </div>
      )}

      {/* Sort & List */}
      <div className="flex justify-end mb-4">
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-700"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading comments...</div>
      ) : error ? (
        <div className="text-red-500 text-center py-4">{error}</div>
      ) : threadedComments.length === 0 ? (
        <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
          No comments yet. Be the first to share your thoughts!
        </div>
      ) : (
        <div className="space-y-6">
          {threadedComments.map(comment => (
            <CommentItem
              key={comment._id}
              comment={comment}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              creatorId={creatorId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentSection;

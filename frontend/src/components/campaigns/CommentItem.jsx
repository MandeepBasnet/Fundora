import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const CommentItem = ({ comment, onReply, onEdit, onDelete, depth = 0 }) => {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [editContent, setEditContent] = useState(comment.content);

  const isOwner = user && user._id === comment.author._id;
  const isAdmin = user && user.role === 'admin';
  const canEdit = isOwner && !comment.isDeleted && new Date() - new Date(comment.createdAt) < 24 * 60 * 60 * 1000;
  const canDelete = (isOwner || isAdmin) && !comment.isDeleted;

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    onReply(comment._id, replyContent);
    setIsReplying(false);
    setReplyContent('');
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editContent.trim()) return;
    onEdit(comment._id, editContent);
    setIsEditing(false);
  };

  if (comment.isDeleted && (!comment.replies || comment.replies.length === 0)) {
    return null; // Don't show deleted comments if they have no replies (should have been hard deleted by backend anyway, but safe check)
  }

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'ml-8' : ''} mb-4`}>
      <div className="flex-shrink-0">
        <img 
          src={comment.author.profile?.avatar || "https://ui-avatars.com/api/?name=" + comment.author.name} 
          alt={comment.author.name}
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>
      
      <div className="flex-grow">
        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{comment.author.name}</span>
              {comment.author.role === 'admin' && (
                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Admin</span>
              )}
              {/* Add Creator badge logic if passed down */}
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
              </span>
              {comment.isEdited && <span className="text-xs text-gray-400">(edited)</span>}
            </div>
          </div>

          {isEditing ? (
            <form onSubmit={handleEditSubmit} className="mt-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                rows="3"
              />
              <div className="flex gap-2 mt-2">
                <button 
                  type="submit" 
                  className="px-3 py-1 bg-emerald-600 text-white text-sm rounded hover:bg-emerald-700"
                >
                  Save
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-gray-600 text-sm hover:text-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
              {comment.isDeleted ? (
                <span className="italic text-gray-400">[Comment deleted by user]</span>
              ) : (
                comment.content
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-1 ml-1 text-sm text-gray-500">
          {user && !comment.isDeleted && depth < 2 && ( // Max depth 3 levels (0, 1, 2)
            <button 
              onClick={() => setIsReplying(!isReplying)}
              className="hover:text-emerald-600 font-medium"
            >
              Reply
            </button>
          )}
          
          {canEdit && (
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className="hover:text-blue-600"
            >
              Edit
            </button>
          )}
          
          {canDelete && (
            <button 
              onClick={() => onDelete(comment._id)}
              className="hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>

        {isReplying && (
          <form onSubmit={handleReplySubmit} className="mt-3 ml-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${comment.author.name}...`}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 text-sm"
              rows="2"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button 
                type="submit" 
                className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"
              >
                Post Reply
              </button>
              <button 
                type="button" 
                onClick={() => setIsReplying(false)}
                className="px-3 py-1 text-gray-600 text-xs hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Recursive rendering for replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies.map(reply => (
              <CommentItem 
                key={reply._id} 
                comment={reply} 
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;

import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { CommentsList, CommentForm, CommentProps } from './comment';
import { useAuth } from '@/context/auth-context';
import { MessageSquare } from 'lucide-react';
import { FaPen, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';

export interface PostTag {
  id: number;
  name: string;
}

export interface PostAttachment {
  type: 'image' | 'code' | 'video';
  content: string;
  language?: string;
  url: string;
}

export interface PostAuthor {
  id: number;
  username: string;
  displayName: string | null;
  avatar?: string;
  isInstructor?: boolean;
}

// Using CommentProps from comment.tsx instead

export interface CommunityPostProps {
  id: number;
  author: PostAuthor;
  content: string;
  createdAt: Date;
  tags: PostTag[];
  likes: number;
  comments: number;
  reposts: number;
  isLiked?: boolean;
  isReposted?: boolean;
  repostedPost?: CommunityPostProps;
  attachment?: PostAttachment;
  onLike: (id: number) => void;
  onComment: (id: number) => void;
  onRepost: (id: number) => void;
  onEdit?: (id: number, content: string) => void;
  onDelete?: (id: number) => void;
}

const CommunityPost: React.FC<CommunityPostProps> = ({
  id,
  author,
  content,
  createdAt,
  tags,
  likes: initialLikes,
  comments: commentCount,
  reposts: repostCount,
  isLiked = false,
  isReposted = false,
  repostedPost,
  attachment,
  onLike,
  onComment,
  onRepost,
  onEdit,
  onDelete
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentProps[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(commentCount);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const { user } = useAuth();
  
  // Add useEffect to fetch comments on mount
  useEffect(() => {
    fetchComments();
  }, [id]); // Re-fetch when post ID changes
  
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  // Add custom time formatting
  const formattedTime = timeAgo.includes('less than a minute') 
    ? 'just now' 
    : timeAgo;
  
  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
    onLike(id);
  };
  
  const handleComment = () => {
    setShowComments(!showComments);
    onComment(id);
  };
  
  const handleRepost = () => {
    onRepost(id);
  };
  
  const handleToggleComments = () => {
    setShowComments(!showComments);
    if (!showComments && comments.length === 0) {
      fetchComments();
    }
  };
  
  const fetchComments = async () => {
    if (isLoadingComments) return;
    
    setIsLoadingComments(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/posts/${id}/comments`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Helper function to add handlers to a comment and its replies
        const addHandlersToComment = (comment: any): CommentProps => {
          return {
            id: comment.id,
            content: comment.content,
            author: comment.author,
            likes: comment.likes,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            onLike: handleLikeComment,
            onDelete: handleDeleteComment,
            onEdit: handleEditComment
          };
        };
        
        // Add handlers to all comments and their nested replies
        const commentsWithHandlers = data.map(addHandlersToComment);
        setComments(commentsWithHandlers);
        setCommentsCount(data.length);
      } else {
        console.error('Failed to fetch comments:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };
  
  const handleCommentSubmit = async (content: string) => {
    if (!user) return; // Ensure user is logged in
    
    try {
      // Get token from localStorage (as per our auth context implementation)
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        const newComment = await response.json();
        // Add handlers to the new comment
        const commentWithHandlers: CommentProps = {
          id: newComment.id,
          content: newComment.content,
          author: newComment.author,
          likes: newComment.likes,
          createdAt: newComment.createdAt,
          onLike: handleLikeComment,
          onDelete: handleDeleteComment,
          onEdit: handleEditComment,
        };
        setComments(prev => [...prev, commentWithHandlers]);
        setCommentsCount(prev => prev + 1);
        return Promise.resolve();
      } else {
        return Promise.reject(new Error('Failed to post comment'));
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      return Promise.reject(error);
    }
  };
  
  const handleLikeComment = async (commentId: number) => {
    if (!user) return; // Ensure user is logged in
    
    try {
      // Get token from localStorage (as per our auth context implementation)
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (!response.ok) {
        console.error('Failed to like comment');
      }
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };
  
  const handleDeleteComment = async (commentId: number) => {
    if (!user) return; // Ensure user is logged in
    
    try {
      // Get token from localStorage (as per our auth context implementation)
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (response.ok) {
        setComments(prev => prev.filter(comment => comment.id !== commentId));
        setCommentsCount(prev => prev - 1);
      } else {
        console.error('Failed to delete comment');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };
  
  const handleEdit = async () => {
    if (!user || !onEdit) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/posts/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ content: editedContent }),
      });
      
      if (response.ok) {
        onEdit(id, editedContent);
        setIsEditing(false);
      } else {
        console.error('Failed to update post');
      }
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };
  
  const handleDelete = async () => {
    if (!user || !onDelete) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/posts/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });
      
      if (response.ok) {
        onDelete(id);
      } else {
        console.error('Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };
  
  const handleEditComment = async (commentId: number, content: string) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        const updatedComment = await response.json();
        setComments(prev => prev.map(comment => 
          comment.id === commentId 
            ? { ...comment, content: updatedComment.content, updatedAt: updatedComment.updatedAt } 
            : comment
        ));
      } else {
        console.error('Failed to update comment');
      }
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };
  
  const handleReplyToComment = async (parentId: number, content: string) => {
    if (!user) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/community/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ content, parentId }),
      });
      
      if (response.ok) {
        const newComment = await response.json();
        // Add handlers to the new comment
        const commentWithHandlers: CommentProps = {
          id: newComment.id,
          content: newComment.content,
          author: newComment.author,
          likes: newComment.likes,
          createdAt: newComment.createdAt,
          onLike: handleLikeComment,
          onDelete: handleDeleteComment,
          onEdit: handleEditComment,
        };
        
        // If it's a reply, add it to the parent's replies
        setComments(prev => [...prev, commentWithHandlers]);
        setCommentsCount(prev => prev + 1);
      } else {
        console.error('Failed to post reply');
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };
  
  return (
    <div className="border-b border-zinc-800 py-6 first:pt-2 last:border-0">
      <div className="flex">
        <Avatar className="h-10 w-10 mr-4">
          <AvatarImage src={author.avatar} alt={author.displayName ?? author.username} />
          <AvatarFallback>{(author.displayName ?? author.username).substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <h4 className="font-medium text-white mr-2">{author.displayName ?? author.username}</h4>
              {author.isInstructor && (
                <span className="text-primary text-xs font-medium bg-primary/10 px-2 py-0.5 rounded mr-1">
                  Instructor
                </span>
              )}
              <span className="mx-2 text-zinc-400">·</span>
              <span className="text-zinc-400 text-xs">{formattedTime}</span>
            </div>
            {user && user.id === author.id && (
              <div className="flex items-center space-x-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                      onClick={handleEdit}
                    >
                      <FaCheck className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:text-destructive"
                      onClick={() => {
                        setIsEditing(false);
                        setEditedContent(content);
                      }}
                    >
                      <FaTimes className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                      onClick={() => setIsEditing(true)}
                    >
                      <FaPen className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:text-destructive"
                      onClick={handleDelete}
                    >
                      <FaTrash className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
          
          {isEditing ? (
            <textarea
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none mb-4"
              rows={3}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
            />
          ) : (
            <p className="text-white mb-4">{content}</p>
          )}
          
          {repostedPost && (
            <div className="bg-zinc-900 rounded-lg p-3 mb-4">
              <div className="text-sm text-zinc-400 mb-2">Reposted from @{repostedPost.author.username}:</div>
              <p className="text-white">{repostedPost.content}</p>
            </div>
          )}
          
          {attachment && (
            <div className="mb-4">
              {attachment.type === 'image' && (
                <img 
                  src={attachment.url} 
                  alt="Post attachment" 
                  className="rounded-lg max-w-full h-auto"
                />
              )}
              {attachment.type === 'video' && (
                <video 
                  src={attachment.url} 
                  controls 
                  className="rounded-lg max-w-full"
                />
              )}
            </div>
          )}
          
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center mb-4">
              {tags.map(tag => (
                <span key={tag.id} className="bg-zinc-900 text-zinc-400 text-xs px-2 py-1 rounded mr-2 mb-2">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 ${
                liked ? 'text-primary' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <i className={`ri-arrow-up-line ${liked ? 'fill-current' : ''}`} />
              <span>{likeCount}</span>
            </button>
            <button
              onClick={handleComment}
              className="flex items-center space-x-1 text-zinc-400 hover:text-zinc-200"
            >
              <MessageSquare size={16} />
              <span>{commentsCount}</span>
            </button>
            <button
              onClick={handleRepost}
              className={`flex items-center space-x-1 ${
                isReposted ? 'text-primary' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <i className={`ri-repeat-line ${isReposted ? 'fill-current' : ''}`} />
              <span>{repostCount}</span>
            </button>
          </div>
          
          {showComments && (
            <div className="mt-4 space-y-4">
              {isLoadingComments ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : (
                <>
                  <CommentForm 
                    postId={id} 
                    onCommentSubmit={handleCommentSubmit} 
                  />
                  <CommentsList 
                    postId={id}
                    comments={comments}
                    onLikeComment={handleLikeComment}
                    onDeleteComment={handleDeleteComment}
                    onEditComment={handleEditComment}
                  />
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityPost;

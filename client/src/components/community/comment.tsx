import React, { useState } from 'react';
import { FaRegHeart, FaHeart, FaReply, FaTrash } from 'react-icons/fa';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";

export interface CommentProps {
  id: number;
  content: string;
  author: {
    id: number;
    username: string;
    displayName: string | null;
    profileImage: string | null;
  };
  likes: number;
  createdAt: string;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
}

export const Comment: React.FC<CommentProps> = ({
  id,
  content,
  author,
  likes,
  createdAt,
  onLike,
  onDelete,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const { user } = useAuth();
  
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike(id);
  };
  
  const handleDelete = () => {
    onDelete(id);
  };
  
  const displayName = author.displayName || author.username;
  const profileImage = author.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  const timestamp = new Date(createdAt);
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });
  
  const canDelete = user?.id === author.id;
  
  return (
    <div className="p-3 rounded-lg bg-card shadow-sm mb-2">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profileImage} alt={displayName} />
          <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-sm">{displayName}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          
          <p className="mt-1 text-sm">{content}</p>
          
          <div className="flex items-center mt-2 gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs flex items-center gap-1 h-7 px-2 text-muted-foreground hover:text-primary"
              onClick={handleLike}
            >
              {isLiked ? <FaHeart className="text-primary" /> : <FaRegHeart />}
              <span>{likeCount > 0 ? likeCount : ''}</span>
            </Button>
            
            {canDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs flex items-center gap-1 h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <FaTrash />
                <span>Delete</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface CommentFormProps {
  postId: number;
  onCommentSubmit: (content: string) => Promise<void>;
}

export const CommentForm: React.FC<CommentFormProps> = ({
  postId,
  onCommentSubmit
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onCommentSubmit(content);
      setContent('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!user) {
    return (
      <div className="text-center p-3 text-sm text-muted-foreground">
        Log in to comment
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.username)}&background=random`} />
          <AvatarFallback>{(user.displayName || user.username).substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <textarea
            className="w-full p-2 text-sm border border-zinc-700 bg-zinc-800 text-white rounded-md resize-none min-h-[60px] focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
          
          <div className="flex justify-end mt-2">
            <Button 
              type="submit" 
              size="sm" 
              disabled={!content.trim() || isSubmitting}
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
};

interface CommentsListProps {
  postId: number;
  comments: CommentProps[];
  onLikeComment: (id: number) => void;
  onDeleteComment: (id: number) => void;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  postId,
  comments,
  onLikeComment,
  onDeleteComment
}) => {
  return (
    <div className="mt-3">
      {comments.length > 0 ? (
        <div className="space-y-2">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              id={comment.id}
              content={comment.content}
              author={comment.author}
              likes={comment.likes}
              createdAt={comment.createdAt}
              onLike={onLikeComment}
              onDelete={onDeleteComment}
            />
          ))}
        </div>
      ) : (
        <div className="text-center p-3 text-sm text-muted-foreground">
          No comments yet. Be the first to comment!
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { FaRegHeart, FaHeart, FaTrash, FaPen, FaCheck, FaTimes } from 'react-icons/fa';
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
  updatedAt?: string;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  onEdit: (id: number, content: string) => void;
}

export const Comment: React.FC<CommentProps> = ({
  id,
  content,
  author,
  likes,
  createdAt,
  updatedAt,
  onLike,
  onDelete,
  onEdit,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const { user } = useAuth();
  
  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    onLike(id);
  };
  
  const handleDelete = () => {
    onDelete(id);
  };
  
  const handleEdit = () => {
    if (isEditing) {
      onEdit(id, editedContent);
      setIsEditing(false);
    } else {
      setIsEditing(true);
    }
  };
  
  const displayName = author.displayName || author.username;
  const profileImage = author.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  const timestamp = new Date(createdAt);
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });
  
  const canModify = user?.id === author.id;
  
  return (
    <div className="p-3 rounded-lg bg-card shadow-sm mb-2">
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={profileImage} alt={displayName} />
          <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{displayName}</span>
              {updatedAt && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
              <span className="mx-2 text-zinc-400">·</span>
              <span className="text-zinc-400 text-xs">{timeAgo}</span>
            </div>
            <div className="flex items-center gap-2">
              {canModify && (
                <>
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
                </>
              )}
            </div>
          </div>
          
          {isEditing ? (
            <div className="mt-2">
              <textarea
                className="w-full p-2 text-sm border border-zinc-700 bg-zinc-800 text-white rounded-md resize-none min-h-[60px] focus:outline-none focus:ring-1 focus:ring-primary"
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
              />
            </div>
          ) : (
            <p className="mt-1 text-sm">{content}</p>
          )}
          
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
              {isSubmitting ? 'Posting...' : 'Comment'}
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
  onEditComment: (id: number, content: string) => void;
}

export const CommentsList: React.FC<CommentsListProps> = ({
  postId,
  comments,
  onLikeComment,
  onDeleteComment,
  onEditComment,
}) => {
  return (
    <div className="mt-3">
      {comments.length > 0 ? (
        <div className="space-y-2">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              {...comment}
              onLike={onLikeComment}
              onDelete={onDeleteComment}
              onEdit={onEditComment}
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
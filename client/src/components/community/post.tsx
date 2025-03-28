import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { CommentsList, CommentForm } from './comment';
import { useAuth } from '@/context/auth-context';

export interface PostTag {
  id: number;
  name: string;
}

export interface PostAttachment {
  type: 'image' | 'code';
  content: string;
  language?: string;
}

export interface PostAuthor {
  id: number;
  username: string;
  displayName: string | null;
  avatar?: string;
  isInstructor?: boolean;
}

export interface PostComment {
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
}

export interface CommunityPostProps {
  id: number;
  author: PostAuthor;
  content: string;
  createdAt: Date;
  tags: PostTag[];
  likes: number;
  comments: number;
  isLiked?: boolean;
  attachment?: PostAttachment;
  onLike: (id: number) => void;
  onComment: (id: number) => void;
  onShare: (id: number) => void;
}

const CommunityPost: React.FC<CommunityPostProps> = ({
  id,
  author,
  content,
  createdAt,
  tags,
  likes: initialLikes,
  comments: commentCount,
  isLiked = false,
  attachment,
  onLike,
  onComment,
  onShare
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsCount, setCommentsCount] = useState(commentCount);
  const { user } = useAuth();
  
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  
  const handleLike = () => {
    if (liked) {
      setLikeCount(prev => Math.max(prev - 1, 0));
    } else {
      setLikeCount(prev => prev + 1);
    }
    setLiked(!liked);
    onLike(id);
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
      const response = await fetch(`/api/community/posts/${id}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
        setCommentsCount(data.length);
      } else {
        console.error('Failed to fetch comments');
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
      const response = await fetch(`/api/community/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (response.ok) {
        const newComment = await response.json();
        setComments(prev => [...prev, newComment]);
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
      const response = await fetch(`/api/community/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
      const response = await fetch(`/api/community/comments/${commentId}`, {
        method: 'DELETE',
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
  
  return (
    <div className="border-b border-zinc-800 py-6 first:pt-2 last:border-0">
      <div className="flex">
        <Avatar className="h-10 w-10 mr-4">
          <AvatarImage src={author.avatar} alt={author.displayName ?? author.username} />
          <AvatarFallback>{(author.displayName ?? author.username).substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <h4 className="font-medium text-white mr-2">{author.displayName ?? author.username}</h4>
            
            {author.isInstructor && (
              <span className="text-primary text-xs font-medium bg-primary/10 px-2 py-0.5 rounded mr-1">
                Instructor
              </span>
            )}
            
            <span className="text-zinc-400 text-xs">@{author.username}</span>
            <span className="mx-2 text-zinc-400">·</span>
            <span className="text-zinc-400 text-xs">{timeAgo}</span>
          </div>
          
          <p className="text-white mb-4">{content}</p>
          
          {attachment && (
            <div className="mb-4">
              {attachment.type === 'image' && (
                <div className="bg-zinc-900 rounded-lg overflow-hidden">
                  <img src={attachment.content} alt="Post attachment" className="w-full h-auto" />
                </div>
              )}
              
              {attachment.type === 'code' && (
                <div className="bg-zinc-900 p-3 rounded-lg mb-4">
                  <pre className="text-zinc-400 text-xs overflow-x-auto">
                    <code>{attachment.content}</code>
                  </pre>
                </div>
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
          
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${liked ? 'text-red-500' : 'text-zinc-400'} hover:text-red-500 mr-6 px-2`}
              onClick={handleLike}
            >
              <i className={`${liked ? 'ri-heart-fill' : 'ri-heart-line'} mr-1`}></i>
              <span>{likeCount}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-zinc-400 hover:text-white mr-6 px-2"
              onClick={handleToggleComments}
            >
              <i className="ri-chat-1-line mr-1"></i>
              <span>{commentsCount}</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-zinc-400 hover:text-white px-2"
              onClick={() => onShare(id)}
            >
              <i className="ri-share-line mr-1"></i>
              <span>Share</span>
            </Button>
          </div>
          
          <Collapsible open={showComments} onOpenChange={setShowComments} className="mt-4">
            <CollapsibleContent>
              {isLoadingComments ? (
                <div className="py-4 text-center text-zinc-400">Loading comments...</div>
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
                  />
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default CommunityPost;

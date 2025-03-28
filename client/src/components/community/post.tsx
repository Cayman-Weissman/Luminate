import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

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
  comments,
  isLiked = false,
  attachment,
  onLike,
  onComment,
  onShare
}) => {
  const [liked, setLiked] = useState(isLiked);
  const [likeCount, setLikeCount] = useState(initialLikes);
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
              onClick={() => onComment(id)}
            >
              <i className="ri-chat-1-line mr-1"></i>
              <span>{comments}</span>
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
        </div>
      </div>
    </div>
  );
};

export default CommunityPost;

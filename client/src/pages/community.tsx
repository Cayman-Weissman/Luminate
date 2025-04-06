import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Bell, 
  MessageSquare, 
  Star,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Plus,
  Heart,
  X,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import CommunityPost from '@/components/community/post';
import { useAuth } from '@/context/auth-context';

// Types
interface Topic {
  id: number;
  title: string;
  description: string;
  category: string;
  followers: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  symbol: string;
}

interface Post {
  id: number;
  topicId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    username: string;
    displayName: string;
    avatar: string;
    isVerified: boolean;
  };
  likes: number;
  comments: number;
  reposts: number;
  sentiment?: 'up' | 'down';
  isLiked: boolean;
  isReposted: boolean;
  repostedPost?: Post;
  replyTo?: number | Post;
  replies?: Post[];
}

interface TrendingTopic {
  id: number;
  title: string;
  changePercentage: number;
}

interface NewPost {
  content: string;
  sentiment?: 'up' | 'down';
  replyTo?: number | Post;
  repostId?: number;
}

// Main component
const Community = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // States
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState<NewPost>({
    content: '',
    sentiment: undefined,
    replyTo: undefined,
    repostId: undefined
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [activeTab, setActiveTab] = useState<'popular' | 'latest'>('popular');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
    avatar: string;
  } | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Post | null>(null);
  const [reposting, setReposting] = useState<Post | null>(null);
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Fetch topics
  const fetchTopics = async () => {
    try {
      const response = await apiRequest('GET', '/api/community/topics', undefined);
      if (Array.isArray(response)) {
        setTopics(response);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load topics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch posts for a topic
  const fetchTopicPosts = async (topicId: number, pageNum: number = 1) => {
    try {
      const response = await apiRequest('GET', `/api/community/posts?topic=${topicId}&page=${pageNum}`, undefined);
      if (Array.isArray(response)) {
        // Process each post to include full reply and repost data
        const processedPosts = response.map(post => {
          // Process replies
          const processedReplies = post.replies?.map((reply: any) => ({
            id: reply.id,
            topicId: reply.topicId,
            content: reply.content,
            createdAt: reply.createdAt,
            author: reply.author || {
              id: 0,
              username: 'Anonymous',
              displayName: 'Anonymous',
              avatar: null,
              isVerified: false
            },
            likes: reply.likes,
            comments: reply.comments,
            reposts: reply.reposts,
            sentiment: reply.sentiment,
            isLiked: reply.isLiked,
            isReposted: reply.isReposted,
            replyTo: reply.replyTo,
            repostedPost: reply.repostedPost
          }));

          // Process reposted post if it exists
          const processedRepostedPost = post.repostedPost ? {
            id: post.repostedPost.id,
            topicId: post.repostedPost.topicId,
            content: post.repostedPost.content,
            createdAt: post.repostedPost.createdAt,
            author: post.repostedPost.author || {
              id: 0,
              username: 'Anonymous',
              displayName: 'Anonymous',
              avatar: null,
              isVerified: false
            },
            likes: post.repostedPost.likes,
            comments: post.repostedPost.comments,
            reposts: post.repostedPost.reposts,
            sentiment: post.repostedPost.sentiment,
            isLiked: post.repostedPost.isLiked,
            isReposted: post.repostedPost.isReposted,
            replyTo: post.repostedPost.replyTo,
            repostedPost: post.repostedPost.repostedPost
          } : undefined;

          // Process the main post
          return {
            id: post.id,
            topicId: post.topicId,
            content: post.content,
            createdAt: post.createdAt,
            author: post.author || {
              id: 0,
              username: 'Anonymous',
              displayName: 'Anonymous',
              avatar: null,
              isVerified: false
            },
            likes: post.likes,
            comments: post.comments,
            reposts: post.reposts,
            sentiment: post.sentiment,
            isLiked: post.isLiked,
            isReposted: post.isReposted,
            replyTo: post.replyTo,
            repostedPost: processedRepostedPost,
            replies: processedReplies
          };
        });
        
        // Filter out replies from the main posts list and sort by creation time
        const mainPosts = processedPosts.filter(post => !post.replyTo);
        const sortedPosts = mainPosts.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        if (pageNum === 1) {
          setPosts(sortedPosts);
        } else {
          setPosts(prev => [...prev, ...sortedPosts]);
        }
        setHasMore(response.length === 10);
        setPage(pageNum);
      }
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      toast({
        title: 'Error',
        description: 'Failed to load posts',
        variant: 'destructive',
      });
    }
  };

  // Add function to format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}m ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}h ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle topic selection
  const handleTopicSelect = (topic: Topic) => {
    setSelectedTopic(topic.id);
  };

  // Handle post creation
  const handleCreatePost = async () => {
    try {
      if (!selectedTopic) {
        toast({
          title: 'Error',
          description: 'Please select a topic',
          variant: 'destructive',
        });
        return;
      }

      if (!newPost.content.trim() && !newPost.repostId) {
        toast({
          title: 'Error',
          description: 'Post content cannot be empty',
          variant: 'destructive',
        });
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to create posts',
          variant: 'destructive',
        });
        return;
      }

      const replyToId = typeof newPost.replyTo === 'object' ? newPost.replyTo.id : newPost.replyTo;

      const response = await apiRequest('POST', '/api/community/posts', {
        topicId: selectedTopic,
        content: newPost.content,
        sentiment: newPost.sentiment,
        replyTo: replyToId,
        repostId: newPost.repostId,
      });

      if (response) {
        // If this is a reply, add it to the parent post's replies
        if (replyToId) {
          const newReply = {
            ...response,
            author: {
              id: currentUser?.id || 0,
              username: currentUser?.username || 'Anonymous',
              displayName: currentUser?.username || 'Anonymous',
              avatar: currentUser?.avatar || null,
              isVerified: false
            }
          };
          setPosts(prev => prev.map(post => 
            post.id === replyToId 
              ? { ...post, replies: [...(post.replies || []), newReply] }
              : post
          ));
    } else {
          // If this is a repost, include the original post data
          if (newPost.repostId) {
            const originalPost = posts.find(p => p.id === newPost.repostId);
            if (originalPost) {
              response.repostedPost = originalPost;
            }
          }
          // Add the new post to the beginning of the list with proper author data
          const newPostWithAuthor = {
            ...response,
            author: {
              id: currentUser?.id || 0,
              username: currentUser?.username || 'Anonymous',
              displayName: currentUser?.username || 'Anonymous',
              avatar: currentUser?.avatar || null,
              isVerified: false
            }
          };
          setPosts(prev => [newPostWithAuthor, ...prev]);
        }

        setNewPost({ content: '', sentiment: undefined, replyTo: undefined, repostId: undefined });
        setReplyingTo(null);
        setReposting(null);
        toast({
          title: 'Success',
          description: 'Post created successfully',
        });
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      if (error.status === 401) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to create posts',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create post',
          variant: 'destructive',
        });
      }
    }
  };

  // Handle post like
  const handleLikePost = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to like posts',
          variant: 'destructive',
        });
        return;
      }

      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.isLiked) {
        await apiRequest('DELETE', `/api/community/posts/${postId}/like`, {});
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, isLiked: false, likes: p.likes - 1 } : p
        ));
      } else {
        await apiRequest('POST', `/api/community/posts/${postId}/like`, {});
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, isLiked: true, likes: p.likes + 1 } : p
        ));
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive',
      });
    }
  };

  // Add function to fetch trending topics
  const fetchTrendingTopics = async () => {
    try {
      const response = await apiRequest('GET', '/api/trending/ticker', undefined);
      setTrendingTopics(response);
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    }
  };

  // Add function to toggle watchlist
  const toggleWatchlist = (topicId: number) => {
    setWatchlist(prev => {
      if (prev.includes(topicId)) {
        return prev.filter(id => id !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };
  
  // Add function to fetch current user
  const fetchCurrentUser = async () => {
    try {
      const response = await apiRequest('GET', '/api/auth/me', undefined);
      if (response) {
        setCurrentUser({
          id: response.id,
          username: response.username,
          avatar: response.avatar
        });
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    }
  };

  // Add function to handle infinite scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && !isLoadingMore && hasMore) {
      setIsLoadingMore(true);
      fetchTopicPosts(selectedTopic!, page + 1).finally(() => setIsLoadingMore(false));
    }
  };

  // Add functions for reply and repost
  const handleReply = (post: Post) => {
    setReplyingToId(post.id);
    setReplyContent(`@${post.author.username} `);
  };

  const handleRepost = (post: Post) => {
    setReposting(post);
    setNewPost(prev => ({
      ...prev,
      content: '',
      repostId: post.id
    }));
  };

  // Add function to handle reply submission
  const handleSubmitReply = async (postId: number) => {
    if (!replyContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to reply',
          variant: 'destructive',
        });
        return;
      }

      const response = await apiRequest('POST', '/api/community/posts', {
        topicId: selectedTopic,
        content: replyContent.trim(),
        replyTo: postId,
      });

      if (response) {
        const newReply = {
          ...response,
          author: {
            id: currentUser?.id || 0,
            username: currentUser?.username || 'Anonymous',
            displayName: currentUser?.username || 'Anonymous',
            avatar: currentUser?.avatar || null,
            isVerified: false
          }
        };

        // Find the parent post and add the reply to its replies array
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, replies: [...(post.replies || []), newReply] }
            : post
        ));
        
        setReplyContent('');
        setReplyingToId(null);
        toast({
          title: 'Success',
          description: 'Reply posted successfully',
        });
      }
    } catch (error: any) {
      console.error('Error posting reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to post reply',
        variant: 'destructive',
      });
    }
  };

  const handleShare = (id: number) => {
    // ... existing code ...
  };

  const handleEditPost = (id: number, content: string) => {
    setPosts(posts.map(post => 
      post.id === id ? { ...post, content } : post
    ));
  };

  const handleDeletePost = (id: number) => {
    setPosts(posts.filter(post => post.id !== id));
  };

  // Initial load
  useEffect(() => {
    fetchTopics();
    fetchTrendingTopics();
    fetchCurrentUser();
  }, []);

  // Update useEffect to fetch posts when topic changes
  useEffect(() => {
    if (selectedTopic) {
      fetchTopicPosts(selectedTopic);
    }
  }, [selectedTopic]);
  
  const displayedTopics = showAllTopics ? topics : topics.slice(0, 5);
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-white">Loading...</div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Trending Ticker Banner */}
      <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 mb-6">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-2">
          <TrendingUp className="w-4 h-4" />
          <span>Trending Topics</span>
        </div>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden snap-x snap-mandatory mx-10 py-2">
            {trendingTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-3 py-1 rounded-full text-sm snap-start ${
                  selectedTopic === topic.id
                    ? 'bg-primary text-white'
                    : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                }`}
              >
                <span>{topic.title}</span>
                <span className={`text-xs ${topic.changePercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {topic.changePercentage >= 0 ? '+' : ''}{topic.changePercentage}%
                </span>
              </button>
            ))}
          </div>
          <button 
            onClick={() => {
              const container = document.querySelector('.overflow-x-auto');
              if (container) {
                const itemWidth = container.querySelector('button')?.offsetWidth || 0;
                const gap = 16; // gap-4 = 16px
                container.scrollLeft -= (itemWidth + gap) * 2;
              }
            }}
            className="absolute left-0 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300 z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={() => {
              const container = document.querySelector('.overflow-x-auto');
              if (container) {
                const itemWidth = container.querySelector('button')?.offsetWidth || 0;
                const gap = 16; // gap-4 = 16px
                container.scrollLeft += (itemWidth + gap) * 2;
              }
            }}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-yellow-400 hover:text-yellow-300 z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - Topics list */}
        <div className="lg:col-span-3 space-y-6">
          {/* Watchlist Section */}
          {watchlist.length > 0 && (
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Watchlist
              </h3>
              <div className="space-y-2">
                {topics
                  .filter(topic => watchlist.includes(topic.id))
                  .map(topic => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-700/50 cursor-pointer"
                      onClick={() => handleTopicSelect(topic)}
                    >
                      <span className="text-white">{topic.title}</span>
                      <Badge className="bg-zinc-700 text-zinc-300">
                        #{topic.symbol}
                    </Badge>
                  </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* All Topics Section */}
          <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
            <h3 className="text-lg font-semibold text-white mb-4">All Topics</h3>
            <div className="space-y-2">
              {displayedTopics.map(topic => (
                <div
                    key={topic.id} 
                  className={`flex items-center justify-between p-2 rounded-lg hover:bg-zinc-700/50 cursor-pointer ${
                    selectedTopic === topic.id ? 'bg-zinc-700/50' : ''
                  }`}
                  onClick={() => handleTopicSelect(topic)}
                >
                  <span className="text-white">{topic.title}</span>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-zinc-700 text-zinc-300">
                      #{topic.symbol}
                    </Badge>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWatchlist(topic.id);
                      }}
                      className={`${
                        watchlist.includes(topic.id) ? 'text-primary' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <i className={watchlist.includes(topic.id) ? 'ri-bookmark-fill' : 'ri-bookmark-line'} />
                    </button>
              </div>
                </div>
                ))}
              {topics.length > 5 && (
                <button
                  onClick={() => setShowAllTopics(!showAllTopics)}
                  className="w-full text-left px-3 py-2 rounded-md text-muted-foreground hover:bg-zinc-800"
                >
                  {showAllTopics ? 'Show Less' : 'Show More'}
                </button>
              )}
              </div>
          </div>
        </div>
        
        {/* Right column - Posts feed */}
        <div className="lg:col-span-8">
          {selectedTopic ? (
            <>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{topics.find(t => t.id === selectedTopic)?.title}</h2>
                <p className="text-zinc-400">{topics.find(t => t.id === selectedTopic)?.description}</p>
          </div>
          
              {/* Post creation form */}
              <Card className="bg-zinc-800 border-zinc-700 mb-6">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.username || 'User')}&background=random`} 
                        alt={currentUser?.username || 'User'}
                      />
                      <AvatarFallback>
                        {(currentUser?.username || 'U')[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-zinc-400">Posting to #{topics.find(t => t.id === selectedTopic)?.symbol}</span>
                          <span className="text-sm text-zinc-400">as {currentUser?.username}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`${newPost.sentiment === 'up' ? 'text-green-500' : 'text-zinc-400'}`}
                            onClick={() => setNewPost(prev => ({ ...prev, sentiment: prev.sentiment === 'up' ? undefined : 'up' }))}
                          >
                            <ChevronUp size={20} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={`${newPost.sentiment === 'down' ? 'text-red-500' : 'text-zinc-400'}`}
                            onClick={() => setNewPost(prev => ({ ...prev, sentiment: prev.sentiment === 'down' ? undefined : 'down' }))}
                          >
                            <ChevronDown size={20} />
                  </Button>
          </div>
                </div>
                      {replyingTo && (
                        <div className="bg-zinc-900 rounded-lg p-3 mb-3 text-sm text-zinc-400">
                          Replying to @{replyingTo.author.username}
                </div>
                      )}
                      {reposting && (
                        <div className="bg-zinc-900 rounded-lg p-3 mb-3">
                          <div className="text-sm text-zinc-400 mb-2">Reposting:</div>
                          <div className="text-white">{reposting.content}</div>
                        </div>
                      )}
                      <textarea
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        rows={3}
                        placeholder={reposting ? "Add your thoughts..." : "Share your thoughts..."}
                        value={newPost.content}
                        onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                      />
                      <div className="flex justify-end mt-3">
                        <Button 
                          className="bg-primary hover:bg-primary/90"
                          onClick={handleCreatePost}
                          disabled={!newPost.content.trim() && !newPost.repostId}
                        >
                          {reposting ? 'Repost' : 'Post'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          
              {/* Posts feed */}
              <div className="space-y-4">
                {posts.map((post) => (
                  <CommunityPost
                    key={post.id}
                    id={post.id}
                    author={{
                      id: post.author.id,
                      username: post.author.username,
                      displayName: post.author.displayName,
                      avatar: post.author.avatar,
                      isInstructor: post.author.isVerified
                    }}
                    content={post.content}
                    createdAt={new Date(post.createdAt)}
                    tags={[]}
                    likes={post.likes}
                    comments={post.comments}
                    reposts={post.reposts}
                    isLiked={post.isLiked}
                    isReposted={post.isReposted}
                    repostedPost={post.repostedPost ? {
                      id: post.repostedPost.id,
                      author: {
                        id: post.repostedPost.author.id,
                        username: post.repostedPost.author.username,
                        displayName: post.repostedPost.author.displayName,
                        avatar: post.repostedPost.author.avatar,
                        isInstructor: post.repostedPost.author.isVerified
                      },
                      content: post.repostedPost.content,
                      createdAt: new Date(post.repostedPost.createdAt),
                      tags: [],
                      likes: post.repostedPost.likes,
                      comments: post.repostedPost.comments,
                      reposts: post.repostedPost.reposts,
                      isLiked: post.repostedPost.isLiked,
                      isReposted: post.repostedPost.isReposted,
                      onLike: () => {},
                      onComment: () => {},
                      onRepost: () => {},
                    } : undefined}
                    onLike={handleLikePost}
                    onComment={() => handleReply(post)}
                    onRepost={() => handleRepost(post)}
                    onEdit={handleEditPost}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <MessageSquare size={48} className="mx-auto text-zinc-600 mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">Select a Topic</h2>
              <p className="text-zinc-400">Choose a topic from the list to view its discussion feed</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Community;
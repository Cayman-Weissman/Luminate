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
  Award,
  BarChart2,
  ChevronUp,
  ChevronDown,
  BookOpen,
  ArrowRight,
  List,
  ChevronRight,
  Plus
} from 'lucide-react';

// Types
interface LearningTopic {
  id: number;
  title: string;
  description: string;
  icon?: string;
  banner?: string;
  category: string;
  rank: number;
  changePercentage: number;
  followers?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  symbol?: string;
}

interface TopicPost {
  id: number;
  topicId: number;
  author: {
    id: number;
    username: string;
    displayName?: string;
    avatar?: string;
    reputation?: number;
    isVerified?: boolean;
  };
  content: string;
  timestamp: Date | string;
  likes: number;
  comments: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  isLiked?: boolean;
}

// Create ticker symbol from topic title
const createTickerSymbol = (title: string): string => {
  // Remove any non-alphanumeric characters and take the first 4-5 characters
  return title
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4);
};

// Format large numbers (e.g., 1500 -> 1.5K)
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Format percentage changes with + or - sign
const formatPercentage = (percentage: number): string => {
  return percentage > 0
    ? `+${percentage.toFixed(2)}%`
    : `${percentage.toFixed(2)}%`;
};

// Get color based on percentage change
const getChangeColor = (change: number): string => {
  if (change > 3) return 'text-green-500';
  if (change > 0) return 'text-green-400';
  if (change < -3) return 'text-red-500';
  if (change < 0) return 'text-red-400';
  return 'text-yellow-400';
};

// Get background color based on percentage change
const getChangeBgColor = (change: number): string => {
  if (change > 3) return 'bg-green-500/10';
  if (change > 0) return 'bg-green-400/10';
  if (change < -3) return 'bg-red-500/10';
  if (change < 0) return 'bg-red-400/10';
  return 'bg-yellow-400/10';
};

// Topic Card Component
const TopicTickerCard: React.FC<{ 
  topic: LearningTopic;
  onClick: (id: number) => void;
}> = ({ topic, onClick }) => {
  const symbol = topic.symbol || createTickerSymbol(topic.title);
  const changeColor = getChangeColor(topic.changePercentage);
  const changeBgColor = getChangeBgColor(topic.changePercentage);
  
  return (
    <Card 
      className="bg-zinc-800 border-zinc-700 hover:bg-zinc-750 transition-all cursor-pointer overflow-hidden"
      onClick={() => onClick(topic.id)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-lg text-white">{topic.title}</h3>
              <span className="text-xs text-zinc-400">#{symbol}</span>
            </div>
            <p className="text-zinc-400 text-sm line-clamp-2 mt-1">{topic.description}</p>
          </div>
          <div className="flex flex-col items-end">
            <Badge variant="outline" className={`${changeBgColor} ${changeColor} flex items-center space-x-1 px-2`}>
              {topic.changePercentage > 0 ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              <span>{formatPercentage(topic.changePercentage)}</span>
            </Badge>
            <div className="flex items-center mt-2 text-xs text-zinc-400">
              <BookOpen size={12} className="mr-1" /> 
              <span>{formatNumber(topic.followers || 0)} learners</span>
              <span className="mx-1">•</span>
              <Badge variant="outline" className="bg-zinc-700 text-zinc-300 text-[10px] h-5">
                {topic.difficulty || 'beginner'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Topic Post Component
const TopicPost: React.FC<{
  post: TopicPost;
  symbol: string;
  onLike: (postId: number) => void;
  onComment: (postId: number) => void;
}> = ({ post, symbol, onLike, onComment }) => {
  // Format timestamp
  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    // Calculate days difference
    const daysDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      // If today, show hours
      const hoursDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
      if (hoursDiff === 0) {
        // If less than an hour, show minutes
        const minutesDiff = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
        return `${minutesDiff} min ago`;
      }
      return `${hoursDiff}h ago`;
    } else if (daysDiff === 1) {
      return 'yesterday';
    } else {
      return `${daysDiff} days ago`;
    }
  };

  const sentimentColor = post.sentiment === 'bullish' 
    ? 'text-green-500' 
    : post.sentiment === 'bearish' 
      ? 'text-red-500' 
      : 'text-yellow-500';

  return (
    <Card className="bg-zinc-800 border-zinc-700 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={post.author.avatar} alt={post.author.displayName || post.author.username} />
            <AvatarFallback>{(post.author.displayName || post.author.username).charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            {/* Author info and timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium text-white">
                  {post.author.displayName || post.author.username}
                </span>
                {post.author.isVerified && (
                  <Badge variant="outline" className="ml-1 bg-blue-500/20 text-blue-400 text-[10px] px-1">
                    <Star size={10} className="mr-0.5" /> Pro
                  </Badge>
                )}
                <span className="text-zinc-400 text-xs ml-2">@{post.author.username}</span>
              </div>
              <div className="flex items-center">
                <span className="text-zinc-400 text-xs">{formatTimestamp(post.timestamp)}</span>
                <span className="text-zinc-400 mx-1">•</span>
                <span className="text-zinc-400 text-xs">#{symbol}</span>
              </div>
            </div>
            
            {/* Post content */}
            <p className="text-white mt-2">{post.content}</p>
            
            {/* Sentiment badge */}
            <div className="mt-3 flex items-center space-x-1">
              <Badge variant="outline" className={`${sentimentColor} text-xs px-2 py-0.5`}>
                {post.sentiment === 'bullish' ? (
                  <TrendingUp size={12} className="mr-1" />
                ) : post.sentiment === 'bearish' ? (
                  <TrendingDown size={12} className="mr-1" />
                ) : (
                  <BarChart2 size={12} className="mr-1" />
                )}
                {post.sentiment.charAt(0).toUpperCase() + post.sentiment.slice(1)}
              </Badge>
            </div>
            
            {/* Action buttons */}
            <div className="mt-3 flex items-center space-x-4 text-zinc-400">
              <button 
                className={`flex items-center space-x-1 ${post.isLiked ? 'text-primary' : 'hover:text-zinc-200'}`}
                onClick={() => onLike(post.id)}
              >
                <ChevronUp size={16} />
                <span>{formatNumber(post.likes)}</span>
              </button>
              <button 
                className="flex items-center space-x-1 hover:text-zinc-200"
                onClick={() => onComment(post.id)}
              >
                <MessageSquare size={14} />
                <span>{formatNumber(post.comments)}</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main component
const Community = () => {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  // States
  const [topics, setTopics] = useState<LearningTopic[]>([]);
  const [watchlist, setWatchlist] = useState<LearningTopic[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<LearningTopic[]>([]);
  const [topicPosts, setTopicPosts] = useState<TopicPost[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<LearningTopic[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<LearningTopic | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'trending' | 'watchlist' | 'discover'>('trending');
  
  // Fetch topics data
  const fetchTopics = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('GET', '/api/trending/topics', undefined);
      
      if (Array.isArray(response)) {
        // Transform data to include more StockTwits-like fields
        const transformedTopics = response.map((topic, index) => ({
          ...topic,
          // Generate a ticker symbol if not provided
          symbol: topic.symbol || createTickerSymbol(topic.title),
          // Default followers if not provided with more predictable values
          followers: topic.followers || (5000 - (index * 500)),
          // Default difficulty if not provided - deterministic based on index
          difficulty: topic.difficulty || ['beginner', 'intermediate', 'advanced'][
            index % 3
          ] as 'beginner' | 'intermediate' | 'advanced',
        }));
        
        setTopics(transformedTopics);
        setTrendingTopics(transformedTopics.slice(0, 5));
        setFilteredTopics(transformedTopics);
        
        // Initially only fetch watchlist for topics with ID 1-4
        setWatchlist(transformedTopics.filter(topic => topic.id <= 4));
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load topics. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch topic posts
  const fetchTopicPosts = async (topicId?: number) => {
    try {
      // If a specific topic ID is provided, fetch posts for that topic
      const endpoint = topicId 
        ? `/api/community/posts?topic=${topicId}` 
        : '/api/community/posts';
      
      const response = await apiRequest('GET', endpoint, undefined);
      
      if (Array.isArray(response)) {
        // Transform posts to include sentiment - deterministic based on post content length
        const transformedPosts = response.map(post => {
          // Determine sentiment based on the content length for consistency
          let sentiment: 'bullish' | 'bearish' | 'neutral';
          const contentLength = post.content?.length || 0;
          
          if (contentLength % 3 === 0) {
            sentiment = 'bullish';
          } else if (contentLength % 3 === 1) {
            sentiment = 'bearish';
          } else {
            sentiment = 'neutral';
          }
          
          return {
            ...post,
            topicId: post.topicId || 1,
            timestamp: post.createdAt || new Date(),
            sentiment
          };
        });
        
        setTopicPosts(transformedPosts);
      }
    } catch (error) {
      console.error('Error fetching topic posts:', error);
    }
  };
  
  // Initial data load
  useEffect(() => {
    fetchTopics();
    fetchTopicPosts();
  }, []);
  
  // Handle topic filtering by category
  useEffect(() => {
    if (activeCategory) {
      setFilteredTopics(topics.filter(topic => topic.category === activeCategory));
    } else {
      setFilteredTopics(topics);
    }
  }, [activeCategory, topics]);
  
  // Handle search filtering
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredTopics(
        topics.filter(
          topic => 
            topic.title.toLowerCase().includes(query) || 
            topic.description.toLowerCase().includes(query) ||
            (topic.symbol && topic.symbol.toLowerCase().includes(query))
        )
      );
    } else {
      if (activeCategory) {
        setFilteredTopics(topics.filter(topic => topic.category === activeCategory));
      } else {
        setFilteredTopics(topics);
      }
    }
  }, [searchQuery, topics, activeCategory]);
  
  // Handle post filtering by selected topic
  useEffect(() => {
    if (selectedTopic) {
      fetchTopicPosts(selectedTopic.id);
    } else {
      fetchTopicPosts();
    }
  }, [selectedTopic]);
  
  // Handle topic selection
  const handleTopicSelect = (topicId: number) => {
    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      setSelectedTopic(topic);
    }
  };
  
  // Start learning a topic
  const startLearningTopic = (topicId: number) => {
    setLocation(`/topics/${topicId}`);
  };
  
  // Handle post actions
  const handleLikePost = async (postId: number) => {
    try {
      // Find the post
      const postIndex = topicPosts.findIndex(p => p.id === postId);
      if (postIndex === -1) return;
      
      const post = topicPosts[postIndex];
      const isLiked = post.isLiked;
      
      // Optimistically update UI
      const updatedPosts = [...topicPosts];
      updatedPosts[postIndex] = {
        ...post,
        isLiked: !isLiked,
        likes: isLiked ? post.likes - 1 : post.likes + 1,
      };
      setTopicPosts(updatedPosts);
      
      // Send API request
      if (isLiked) {
        await apiRequest('DELETE', `/api/community/posts/${postId}/like`, {});
      } else {
        await apiRequest('POST', `/api/community/posts/${postId}/like`, {});
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast({
        title: 'Error',
        description: 'Failed to update like status',
        variant: 'destructive',
      });
      
      // Revert optimistic update
      fetchTopicPosts(selectedTopic?.id);
    }
  };
  
  const handleCommentPost = (postId: number) => {
    toast({
      title: 'Comments',
      description: 'Comment feature coming soon!',
    });
  };
  
  // Toggle topic in watchlist
  const toggleWatchlist = (topicId: number) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    
    const isInWatchlist = watchlist.some(t => t.id === topicId);
    
    if (isInWatchlist) {
      setWatchlist(watchlist.filter(t => t.id !== topicId));
      toast({
        title: 'Removed from Watchlist',
        description: `${topic.title} has been removed from your watchlist`,
      });
    } else {
      setWatchlist([...watchlist, topic]);
      toast({
        title: 'Added to Watchlist',
        description: `${topic.title} has been added to your watchlist`,
      });
    }
  };
  
  // Reset selected topic
  const clearSelectedTopic = () => {
    setSelectedTopic(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="text-white">Loading educational market data...</div>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header with search and global stats */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-white">Learning Market</h1>
          
          <div className="flex items-center space-x-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" size={16} />
              <Input
                type="text"
                placeholder="Search topics or tickers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-800 pl-10 text-white border-zinc-700 focus-visible:ring-primary"
              />
            </div>
            
            <Button variant="outline" className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700">
              <Bell size={18} />
            </Button>
          </div>
        </div>
        
        {/* Market stats bar */}
        <div className="bg-zinc-800 rounded-lg p-2 overflow-x-auto">
          <div className="flex space-x-4 whitespace-nowrap min-w-max">
            <div className="flex items-center px-2">
              <span className="text-zinc-400 text-sm mr-2">Market:</span>
              <Badge className="bg-green-500/20 text-green-400">
                <TrendingUp size={12} className="mr-1" /> Active
              </Badge>
            </div>
            <div className="flex items-center px-2 border-l border-zinc-700">
              <span className="text-zinc-400 text-sm mr-2">Trending:</span>
              <span className="text-green-400 font-medium">AI</span>
              <span className="text-green-400 text-xs ml-1">+12.4%</span>
            </div>
            <div className="flex items-center px-2 border-l border-zinc-700">
              <span className="text-zinc-400 text-sm mr-2">Growth:</span>
              <span className="text-green-400 font-medium">Web Dev</span>
              <span className="text-green-400 text-xs ml-1">+8.3%</span>
            </div>
            <div className="flex items-center px-2 border-l border-zinc-700">
              <span className="text-zinc-400 text-sm mr-2">Declining:</span>
              <span className="text-red-400 font-medium">Legacy Systems</span>
              <span className="text-red-400 text-xs ml-1">-5.2%</span>
            </div>
            <div className="flex items-center px-2 border-l border-zinc-700">
              <span className="text-zinc-400 text-sm mr-2">Most Active:</span>
              <span className="text-white font-medium">Python</span>
              <span className="text-zinc-400 text-xs ml-1">32K learners</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column - Topic list */}
        <div className="lg:col-span-7 space-y-5">
          {/* View selector */}
          <div className="flex items-center space-x-1 border-b border-zinc-700 pb-2">
            <Button 
              variant={activeView === 'trending' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveView('trending')}
              className={activeView === 'trending' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'}
            >
              <TrendingUp size={14} className="mr-1" /> Trending
            </Button>
            <Button 
              variant={activeView === 'watchlist' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveView('watchlist')}
              className={activeView === 'watchlist' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'}
            >
              <Star size={14} className="mr-1" /> Watchlist
            </Button>
            <Button 
              variant={activeView === 'discover' ? 'default' : 'ghost'} 
              size="sm"
              onClick={() => setActiveView('discover')}
              className={activeView === 'discover' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'}
            >
              <Search size={14} className="mr-1" /> Discover
            </Button>
          </div>
          
          {/* Selected topic header */}
          {selectedTopic && (
            <div className="bg-zinc-800 rounded-lg p-4 border border-zinc-700 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-bold text-white">{selectedTopic.title}</h2>
                    <Badge className="bg-zinc-700 text-zinc-300">
                      #{selectedTopic.symbol || createTickerSymbol(selectedTopic.title)}
                    </Badge>
                    <Badge 
                      className={`${getChangeBgColor(selectedTopic.changePercentage)} ${getChangeColor(selectedTopic.changePercentage)}`}
                    >
                      {selectedTopic.changePercentage > 0 ? (
                        <TrendingUp size={12} className="mr-1" />
                      ) : (
                        <TrendingDown size={12} className="mr-1" />
                      )}
                      {formatPercentage(selectedTopic.changePercentage)}
                    </Badge>
                  </div>
                  <p className="text-zinc-400 mt-1">{selectedTopic.description}</p>
                  
                  <div className="flex items-center mt-3 space-x-3">
                    <Button 
                      variant="default" 
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => startLearningTopic(selectedTopic.id)}
                    >
                      <BookOpen size={14} className="mr-1" /> Start Learning
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-zinc-700 text-zinc-300 hover:bg-zinc-700"
                      onClick={() => toggleWatchlist(selectedTopic.id)}
                    >
                      <Star 
                        size={14} 
                        className={`mr-1 ${watchlist.some(t => t.id === selectedTopic.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} 
                      /> 
                      {watchlist.some(t => t.id === selectedTopic.id) ? 'Watching' : 'Watch'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-zinc-400 hover:text-white"
                      onClick={clearSelectedTopic}
                    >
                      Back to All
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col items-end">
                  <div className="text-sm text-zinc-400">
                    <span className="flex items-center">
                      <BookOpen size={14} className="mr-1" /> 
                      {formatNumber(selectedTopic.followers || 0)} learners
                    </span>
                  </div>
                  <Badge 
                    variant="outline" 
                    className="mt-2 bg-zinc-700/50 text-zinc-300"
                  >
                    {selectedTopic.difficulty || 'beginner'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          
          {/* Topics list */}
          <div className="space-y-3">
            {activeView === 'trending' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Trending Topics</h2>
                {trendingTopics.map(topic => (
                  <TopicTickerCard 
                    key={topic.id} 
                    topic={topic} 
                    onClick={handleTopicSelect} 
                  />
                ))}
              </div>
            )}
            
            {activeView === 'watchlist' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Your Watchlist</h2>
                {watchlist.length > 0 ? (
                  watchlist.map(topic => (
                    <TopicTickerCard 
                      key={topic.id} 
                      topic={topic} 
                      onClick={handleTopicSelect} 
                    />
                  ))
                ) : (
                  <Card className="bg-zinc-800 border-zinc-700">
                    <CardContent className="p-6 text-center">
                      <Star size={36} className="mx-auto mb-3 text-zinc-500" />
                      <h3 className="text-white font-medium mb-2">Your watchlist is empty</h3>
                      <p className="text-zinc-400 text-sm mb-4">Keep track of topics you're interested in by adding them to your watchlist</p>
                      <Button 
                        variant="outline" 
                        className="bg-zinc-700 text-white border-zinc-600"
                        onClick={() => setActiveView('trending')}
                      >
                        <Plus size={14} className="mr-1" /> Add Topics
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {activeView === 'discover' && (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Discover Topics</h2>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Button 
                    variant={activeCategory === null ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(null)}
                    className={activeCategory === null ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}
                  >
                    All
                  </Button>
                  <Button 
                    variant={activeCategory === 'programming' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('programming')}
                    className={activeCategory === 'programming' ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}
                  >
                    Programming
                  </Button>
                  <Button 
                    variant={activeCategory === 'design' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('design')}
                    className={activeCategory === 'design' ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}
                  >
                    Design
                  </Button>
                  <Button 
                    variant={activeCategory === 'ai' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('ai')}
                    className={activeCategory === 'ai' ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}
                  >
                    AI & ML
                  </Button>
                  <Button 
                    variant={activeCategory === 'business' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory('business')}
                    className={activeCategory === 'business' ? 'bg-primary text-white' : 'bg-zinc-800 text-zinc-300 border-zinc-700'}
                  >
                    Business
                  </Button>
                </div>
                
                {filteredTopics.map(topic => (
                  <TopicTickerCard 
                    key={topic.id} 
                    topic={topic} 
                    onClick={handleTopicSelect} 
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Right column - Topic feed and details */}
        <div className="lg:col-span-5 space-y-5">
          {/* Feed header */}
          <div className="flex items-center justify-between border-b border-zinc-700 pb-2">
            <h2 className="text-lg font-semibold text-white">
              {selectedTopic ? `${selectedTopic.title} Feed` : 'Learning Feed'}
            </h2>
            <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
              <List size={14} className="mr-1" /> Filter
            </Button>
          </div>
          
          {/* Topic posts */}
          <div className="space-y-4">
            {topicPosts.length > 0 ? (
              topicPosts.map(post => (
                <TopicPost 
                  key={post.id} 
                  post={post} 
                  symbol={selectedTopic ? 
                    selectedTopic.symbol || createTickerSymbol(selectedTopic.title) : 
                    "LRNG"
                  }
                  onLike={handleLikePost}
                  onComment={handleCommentPost}
                />
              ))
            ) : (
              <Card className="bg-zinc-800 border-zinc-700">
                <CardContent className="p-6 text-center">
                  <MessageSquare size={36} className="mx-auto mb-3 text-zinc-500" />
                  <h3 className="text-white font-medium mb-2">No posts yet</h3>
                  <p className="text-zinc-400 text-sm mb-4">Be the first to share your insights on this topic!</p>
                  <Button className="bg-primary hover:bg-primary/90 text-white">
                    <Plus size={14} className="mr-1" /> Create Post
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
          
          {/* Learning progress card */}
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-4">
              <h3 className="text-lg font-medium text-white mb-2">Your Learning Progress</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-300">Daily goal</span>
                  <Badge className="bg-green-500/20 text-green-400">4/5 topics</Badge>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2.5">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <div className="pt-2">
                  <h4 className="text-sm font-medium text-white mb-2">Continue Learning</h4>
                  <div className="space-y-2">
                    {trendingTopics.slice(0, 3).map(topic => (
                      <div key={topic.id} className="flex items-center justify-between bg-zinc-750 p-2 rounded-lg">
                        <div className="flex items-center">
                          <Badge className="bg-zinc-700 text-zinc-300 mr-2">
                            #{topic.symbol || createTickerSymbol(topic.title)}
                          </Badge>
                          <span className="text-white font-medium">{topic.title}</span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary/80"
                          onClick={() => startLearningTopic(topic.id)}
                        >
                          <ArrowRight size={14} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Community;
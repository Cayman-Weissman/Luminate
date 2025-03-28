import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommunityPost from '@/components/community/post';
import ContributorCard from '@/components/community/contributor-card';
import CreatePostDialog from '@/components/community/create-post-dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import TrendingTicker from '@/components/trending/ticker';
import TopicCard from '@/components/trending/topic-card';

interface Post {
  id: number;
  author: {
    id: number;
    username: string;
    displayName: string | null;
    avatar?: string;
    isInstructor?: boolean;
  };
  content: string;
  createdAt: Date;
  tags: Array<{ id: number; name: string }>;
  likes: number;
  comments: number;
  isLiked?: boolean;
  attachment?: {
    type: 'image' | 'code';
    content: string;
    language?: string;
  };
}

interface Contributor {
  id: number;
  name: string;
  username: string;
  points: number;
  rank: number;
  avatar: string;
  badges: Array<{ id: number; name: string; icon: string }>;
}

const Community = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('popular');
  const [activeCategory, setActiveCategory] = useState('all');
  const [posts, setPosts] = useState<Post[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [trendingItems, setTrendingItems] = useState<{id: number, rank: number, title: string, changePercentage: number}[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [trendingTopics, setTrendingTopics] = useState<{id: number, title: string, icon: string, changePercentage: number, category: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch posts and contributors
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const categoryParam = activeCategory !== 'all' ? `&category=${activeCategory}` : '';
      const postsData = await apiRequest('GET', `/api/community/posts?tab=${activeTab}${categoryParam}`, undefined);
      const contributorsData = await apiRequest('GET', '/api/community/contributors', undefined);
      
      setPosts(Array.isArray(postsData) ? postsData : []);
      setContributors(Array.isArray(contributorsData) ? contributorsData : []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load community data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch trending topics for ticker
  const fetchTrendingTopics = async () => {
    try {
      const response = await apiRequest('GET', '/api/trending/topics', undefined);
      if (Array.isArray(response)) {
        // Map the trending topics to the ticker format
        const tickerItems = response.map(topic => ({
          id: topic.id,
          rank: topic.rank || topic.id,
          title: topic.title,
          changePercentage: topic.changePercentage || Math.random() * 20 - 10 // Fallback to random change
        }));
        setTrendingItems(tickerItems);
        setTrendingTopics(response);
      }
    } catch (error) {
      console.error('Error fetching trending topics:', error);
    }
  };

  // Load data when component mounts or tab/category changes
  useEffect(() => {
    fetchData();
    fetchTrendingTopics();
  }, [activeTab, activeCategory]);
  
  // Filter posts by selected topic if one is selected
  useEffect(() => {
    if (selectedTopic) {
      const topicParam = `&topic=${encodeURIComponent(selectedTopic)}`;
      const categoryParam = activeCategory !== 'all' ? `&category=${activeCategory}` : '';
      
      // Fetch posts filtered by the selected topic
      apiRequest('GET', `/api/community/posts?tab=${activeTab}${categoryParam}${topicParam}`, undefined)
        .then((data) => {
          setPosts(Array.isArray(data) ? data : []);
        })
        .catch((error) => {
          console.error('Error fetching topic posts:', error);
        });
    }
  }, [selectedTopic]);
  
  const handleLike = async (postId: number) => {
    try {
      // Find the post being liked
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Determine whether to like or unlike based on current state
      const isCurrentlyLiked = post.isLiked;
      
      if (isCurrentlyLiked) {
        // Send unlike request
        await apiRequest('DELETE', `/api/community/posts/${postId}/like`, {});
      } else {
        // Send like request
        await apiRequest('POST', `/api/community/posts/${postId}/like`, {});
      }
      
      // Note: We don't call fetchData() here anymore to avoid refreshing the whole page
      // The like/unlike state is handled locally in the post component
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update like status",
        variant: "destructive",
      });
    }
  };
  
  const handleComment = (postId: number) => {
    // Open comment modal or navigate to comment section
    toast({
      title: "Opening comments",
      description: `Viewing comments for post ${postId}`,
    });
  };
  
  const handleShare = (postId: number) => {
    // Handle share functionality
    toast({
      title: "Share post",
      description: "Post share options opened",
    });
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[70vh]">Loading community data...</div>;
  }
  
  // Create a mobile create post button
  const mobileCreatePostButton = (
    <Button 
      className="fixed z-10 bottom-6 right-6 rounded-full w-14 h-14 bg-primary hover:bg-primary/90 text-zinc-900 sm:hidden flex items-center justify-center shadow-lg"
    >
      <i className="ri-add-line text-xl"></i>
    </Button>
  );
  
  // Handle topic selection from ticker
  const handleTopicSelect = (ticker: string) => {
    if (selectedTopic === ticker) {
      // If clicking on already selected topic, clear the filter
      setSelectedTopic(null);
    } else {
      setSelectedTopic(ticker);
    }
  };
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Trending Ticker - StockTwits-style */}
      <section className="mb-6">
        {trendingItems.length > 0 ? (
          <div className="bg-zinc-900 rounded-lg p-2 shadow-md mb-6 overflow-hidden">
            <div className="mb-2 px-2 flex justify-between items-center">
              <h3 className="text-sm font-medium text-zinc-400">Trending Topics</h3>
              <Button variant="ghost" size="sm" className="text-xs text-zinc-400 hover:text-white p-1 h-auto">
                View All
              </Button>
            </div>
            <TrendingTicker 
              items={trendingItems} 
              onSelect={handleTopicSelect}
              selectedTicker={selectedTopic} 
            />
          </div>
        ) : null}
      </section>
      
      {/* Filter notification when a topic is selected */}
      {selectedTopic && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-white">Viewing posts about <span className="font-bold text-primary">{selectedTopic}</span></span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedTopic(null)}
            className="text-xs text-zinc-400 hover:text-white"
          >
            Clear Filter
          </Button>
        </div>
      )}
      
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Community</h2>
          <div className="hidden sm:block">
            <CreatePostDialog onPostCreated={fetchData} />
          </div>
        </div>
        
        {/* Community Tabs */}
        <Card className="bg-zinc-800 rounded-xl overflow-hidden shadow-lg mb-8">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-zinc-700 overflow-x-auto">
              <TabsList className="h-auto bg-transparent border-b border-zinc-700 w-auto min-w-full flex">
                <TabsTrigger
                  value="popular"
                  className="px-3 sm:px-4 py-3 text-xs sm:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-none rounded-none bg-transparent flex-shrink-0"
                >
                  Popular
                </TabsTrigger>
                <TabsTrigger
                  value="latest"
                  className="px-3 sm:px-4 py-3 text-xs sm:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-none rounded-none bg-transparent flex-shrink-0"
                >
                  Latest
                </TabsTrigger>
                <TabsTrigger
                  value="myfeed"
                  className="px-3 sm:px-4 py-3 text-xs sm:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-none rounded-none bg-transparent flex-shrink-0"
                >
                  My Feed
                </TabsTrigger>
                <TabsTrigger
                  value="questions"
                  className="px-3 sm:px-4 py-3 text-xs sm:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-none rounded-none bg-transparent flex-shrink-0"
                >
                  Questions
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="px-3 sm:px-4 py-3 text-xs sm:text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-none rounded-none bg-transparent flex-shrink-0"
                >
                  Projects
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab}>
              <CardContent className="p-4">
                {/* Category filter */}
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button 
                    variant={activeCategory === 'all' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveCategory('all')}
                    className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600"
                  >
                    All
                  </Button>
                  <Button 
                    variant={activeCategory === 'general' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveCategory('general')}
                    className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600"
                  >
                    General
                  </Button>
                  <Button 
                    variant={activeCategory === 'question' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveCategory('question')}
                    className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600"
                  >
                    Questions
                  </Button>
                  <Button 
                    variant={activeCategory === 'project' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveCategory('project')}
                    className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600"
                  >
                    Projects
                  </Button>
                  <Button 
                    variant={activeCategory === 'achievement' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveCategory('achievement')}
                    className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600"
                  >
                    Achievements
                  </Button>
                  <Button 
                    variant={activeCategory === 'resource' ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setActiveCategory('resource')}
                    className="bg-zinc-700 text-white border-zinc-600 hover:bg-zinc-600"
                  >
                    Resources
                  </Button>
                </div>
                
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <CommunityPost
                      key={post.id}
                      id={post.id}
                      author={post.author}
                      content={post.content}
                      createdAt={post.createdAt}
                      tags={post.tags || []}
                      likes={post.likes}
                      comments={post.comments || 0}
                      isLiked={post.isLiked}
                      attachment={post.attachment}
                      onLike={handleLike}
                      onComment={handleComment}
                      onShare={handleShare}
                    />
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-zinc-400 mb-4">No posts available. Be the first to share something!</p>
                    <CreatePostDialog onPostCreated={fetchData} />
                  </div>
                )}
                
                {posts.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" className="bg-zinc-900 hover:bg-zinc-700 text-white font-medium">
                      Load More
                      <i className="ri-arrow-down-line ml-2"></i>
                    </Button>
                  </div>
                )}
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
        
        {/* Community Leaderboard */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Top Contributors</h3>
          <Button variant="link" className="text-zinc-400 hover:text-white text-sm p-0">View All</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contributors.length > 0 ? (
            contributors.map((contributor) => (
              <ContributorCard
                key={contributor.id}
                id={contributor.id}
                name={contributor.name}
                username={contributor.username}
                points={contributor.points}
                rank={contributor.rank}
                avatar={contributor.avatar}
                badges={contributor.badges || []}
              />
            ))
          ) : (
            <div className="col-span-3 py-8 text-center">
              <p className="text-zinc-400">No contributors data available.</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Mobile Create Post Button */}
      <CreatePostDialog onPostCreated={fetchData} trigger={mobileCreatePostButton} />
    </main>
  );
};

export default Community;

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommunityPost from '@/components/community/post';
import ContributorCard from '@/components/community/contributor-card';
import CreatePostDialog from '@/components/community/create-post-dialog';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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
  const [posts, setPosts] = useState<Post[]>([]);
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch posts and contributors
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const postsData = await apiRequest('GET', `/api/community/posts?tab=${activeTab}`, undefined);
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
  
  // Load data when component mounts or tab changes
  useEffect(() => {
    fetchData();
  }, [activeTab]);
  
  const handleLike = async (postId: number) => {
    try {
      await apiRequest('POST', `/api/community/posts/${postId}/like`, {});
      fetchData(); // Refresh data
      toast({
        title: "Success",
        description: "Post liked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to like post",
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
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

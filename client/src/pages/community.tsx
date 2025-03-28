import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CommunityPost from '@/components/community/post';
import ContributorCard from '@/components/community/contributor-card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const Community = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('popular');
  
  // Fetch community posts
  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useQuery({
    queryKey: ['/api/community/posts', activeTab],
  });
  
  // Fetch top contributors
  const { data: contributors, isLoading: contributorsLoading } = useQuery({
    queryKey: ['/api/community/contributors'],
  });
  
  const handleLike = async (postId: number) => {
    try {
      await apiRequest('POST', `/api/community/posts/${postId}/like`, {});
      refetchPosts();
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
  
  const handleCreatePost = () => {
    // Open create post modal
    toast({
      title: "Create post",
      description: "New post creation started",
    });
  };
  
  const isLoading = postsLoading || contributorsLoading;
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[70vh]">Loading community data...</div>;
  }
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Community</h2>
          <Button 
            className="hidden sm:flex items-center bg-primary hover:bg-primary/90 text-zinc-900 font-medium"
            onClick={handleCreatePost}
          >
            <i className="ri-add-line mr-1"></i>
            New Post
          </Button>
        </div>
        
        {/* Community Tabs */}
        <Card className="bg-zinc-800 rounded-xl overflow-hidden shadow-lg mb-8">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-zinc-700">
              <TabsList className="h-auto bg-transparent border-b border-zinc-700">
                <TabsTrigger
                  value="popular"
                  className="px-4 py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  Popular
                </TabsTrigger>
                <TabsTrigger
                  value="latest"
                  className="px-4 py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  Latest
                </TabsTrigger>
                <TabsTrigger
                  value="myfeed"
                  className="px-4 py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  My Feed
                </TabsTrigger>
                <TabsTrigger
                  value="questions"
                  className="px-4 py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  Questions
                </TabsTrigger>
                <TabsTrigger
                  value="projects"
                  className="px-4 py-3 text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-white data-[state=active]:shadow-none rounded-none bg-transparent"
                >
                  Projects
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={activeTab}>
              <CardContent className="p-4">
                {posts?.map((post: any) => (
                  <CommunityPost
                    key={post.id}
                    id={post.id}
                    author={post.author}
                    content={post.content}
                    createdAt={post.createdAt}
                    tags={post.tags}
                    likes={post.likes}
                    comments={post.comments}
                    attachment={post.attachment}
                    onLike={handleLike}
                    onComment={handleComment}
                    onShare={handleShare}
                  />
                ))}
                
                <div className="flex justify-center mt-6">
                  <Button variant="outline" className="bg-zinc-900 hover:bg-zinc-700 text-white font-medium">
                    Load More
                    <i className="ri-arrow-down-line ml-2"></i>
                  </Button>
                </div>
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
          {contributors?.map((contributor: any) => (
            <ContributorCard
              key={contributor.id}
              id={contributor.id}
              name={contributor.name}
              username={contributor.username}
              points={contributor.points}
              rank={contributor.rank}
              avatar={contributor.avatar}
              badges={contributor.badges}
            />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Community;

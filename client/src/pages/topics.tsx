import React, { useState, useEffect, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TopicCard from '@/components/trending/topic-card';
import TopicDetail from '@/components/trending/topic-detail';
import { TrendingTopic } from '@/lib/types';
import { useLocation } from 'wouter';
import TrendingTicker, { TrendingItem } from '@/components/trending/ticker';
import { AuthContext } from '@/context/auth-context';

const Topics = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState<TrendingTopic | null>(null);
  const [location] = useLocation();
  const { isAuthenticated, user } = useContext(AuthContext);
  
  // Fetch trending topics
  const { data: topics = [], isLoading: topicsLoading } = useQuery<TrendingTopic[]>({
    queryKey: ['/api/trending/topics'],
  });
  
  // Fetch trending ticker data
  const { data: trendingItems = [], isLoading: tickerLoading } = useQuery<TrendingItem[]>({
    queryKey: ['/api/trending/ticker'],
  });
  
  // Fetch user interests
  const { data: userInterests = [], isLoading: interestsLoading } = useQuery<any[]>({
    queryKey: ['/api/user/interests'],
    enabled: isAuthenticated,
  });
  
  // State for AI-generated content
  const [aiContent, setAiContent] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  
  // Function to generate AI content
  const generateAiContent = async () => {
    setAiLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Make sure we have a token before making the request
      if (!token) {
        console.error('No auth token found');
        setAiLoading(false);
        return;
      }
      
      const response = await fetch('/api/ai/course-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          topic: 'Trending Technology Topics', 
          format: 'article', 
          targetAudience: 'beginner'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch AI content');
      }
      
      const data = await response.json();
      setAiContent(data);
    } catch (error) {
      console.error('Error generating AI content:', error);
    } finally {
      setAiLoading(false);
    }
  };
  
  // Generate AI content on initial load
  useEffect(() => {
    generateAiContent();
  }, []);
  
  const isLoading = topicsLoading || tickerLoading || aiLoading || (isAuthenticated && interestsLoading);
  
  // Parse URL parameters
  useEffect(() => {
    if (!isLoading && topics.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);
      const topicId = searchParams.get('topicId');
      
      if (topicId) {
        const topicIdNum = parseInt(topicId);
        const foundTopic = topics.find(t => t.id === topicIdNum);
        if (foundTopic) {
          setSelectedTopic(foundTopic);
          // Update URL to remove parameters
          window.history.replaceState({}, '', '/topics');
        }
      }
    }
  }, [isLoading, topics]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real implementation, this would trigger a search query
    console.log(`Searching for: ${searchQuery}`);
  };
  
  // Filter topics based on search query and active category
  const filteredTopics = topics.filter(topic => {
    // Filter by search query
    const matchesSearch = !searchQuery || 
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      topic.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = activeCategory === 'all' || topic.category === activeCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  // Group topics by category
  const getCategories = (): string[] => {
    const categoriesSet = new Set<string>();
    topics.forEach(topic => categoriesSet.add(topic.category));
    return ['all', ...Array.from(categoriesSet)];
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[70vh]">Loading topics...</div>;
  }
  
  // Handle selecting a topic
  const handleSelectTopic = (topic: TrendingTopic) => {
    setSelectedTopic(topic);
    window.scrollTo(0, 0); // Scroll to top of page
  };

  // Handle going back to topic list
  const handleBackToTopics = () => {
    setSelectedTopic(null);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {selectedTopic ? (
        // Show topic detail view when a topic is selected
        <TopicDetail topic={selectedTopic} onBack={handleBackToTopics} />
      ) : (
        // Show topics list when no topic is selected
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-3xl font-bold text-white mb-4 md:mb-0"></h1>
            
            <form onSubmit={handleSearch} className="w-full md:w-64">
              <div className="relative">
                <Input 
                  type="text" 
                  placeholder="Search topics..." 
                  className="bg-zinc-800 border-zinc-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button 
                  type="submit"
                  size="icon"
                  variant="ghost" 
                  className="absolute right-0 top-0 h-full"
                >
                  <i className="ri-search-line"></i>
                  <span className="sr-only">Search</span>
                </Button>
              </div>
            </form>
          </div>
          
          {/* Trending Ticker */}
          <section className="mb-8">
            <div className="flex items-center mb-4">
              <h2 className="text-2xl font-bold text-white">Trending Now</h2>
              <span className="ml-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">Live</span>
            </div>
            <TrendingTicker items={trendingItems as TrendingItem[]} />
          </section>
          
          {/* User Interests Section - Shown when user is logged in */}
          {isAuthenticated && (
            <section className="mb-8">
              <div className="flex items-center mb-4">
                <h2 className="text-2xl font-bold text-white">Your Interests</h2>
                {userInterests.length > 0 && (
                  <span className="ml-3 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full">
                    {userInterests.length}
                  </span>
                )}
              </div>
              
              {userInterests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userInterests.map((interest) => {
                    const topic = interest.topic;
                    return (
                      <Card key={interest.id} className="bg-zinc-800/90 border-zinc-700 overflow-hidden backdrop-blur-sm hover:bg-zinc-700/90 transition cursor-pointer" onClick={() => handleSelectTopic(topic)}>
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-primary/10 text-primary mr-3`}>
                              <i className={topic.icon && topic.icon.startsWith('ri-') ? topic.icon : 'ri-lightbulb-line'}></i>
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{topic.title}</h3>
                              <div className="flex items-center text-xs">
                                <span className="text-zinc-400 mr-3">{topic.learnerCount.toLocaleString()} learners</span>
                                <span className="text-emerald-400">+{topic.growthPercentage}%</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="bg-zinc-800/90 border-zinc-700 overflow-hidden backdrop-blur-sm">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary mx-auto mb-4 flex items-center justify-center">
                      <i className="ri-star-line text-xl"></i>
                    </div>
                    <h3 className="font-semibold text-white text-lg mb-2">No interests saved yet</h3>
                    <p className="text-zinc-400 mb-4">Click on any topic and select "Add to Interests" to start building your personalized learning collection.</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => setActiveCategory('all')}
                    >
                      <i className="ri-search-line"></i>
                      Browse Topics
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>
          )}
          
          <Tabs defaultValue={activeCategory} onValueChange={setActiveCategory} className="w-full mb-8">
            <TabsList className="bg-zinc-800 p-1 mb-6 flex flex-wrap">
              {getCategories().map(category => (
                <TabsTrigger key={category} value={category} className="capitalize">
                  {category === 'all' ? 'All Topics' : category}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value={activeCategory} className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTopics.map(topic => (
                  <TopicCard 
                    key={topic.id} 
                    topic={topic} 
                    onClick={() => handleSelectTopic(topic)}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
          
          {filteredTopics.length === 0 && (
            <div className="bg-zinc-800 rounded-lg p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">No topics found</h3>
              <p className="text-zinc-400 mb-4">Try adjusting your search or category filter to find what you're looking for.</p>
              <Button onClick={() => {setSearchQuery(''); setActiveCategory('all');}}>
                Reset Filters
              </Button>
            </div>
          )}
          
          {/* AI-generated content section */}
          <section className="mt-12 bg-zinc-800/50 backdrop-blur-sm rounded-lg p-6 border border-primary/20">
            <div className="flex items-center mb-4">
              <i className="ri-ai-generate text-primary text-xl mr-2"></i>
              <h2 className="text-2xl font-bold text-white">AI-Generated Quick Learn</h2>
            </div>
            <p className="text-zinc-400 mb-6">Personalized educational content generated by our AI system based on current trending topics:</p>
            
            <div className="bg-zinc-900/60 rounded-lg p-6 mb-4 border border-zinc-700">
              {aiLoading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : aiContent ? (
                <div className="prose prose-invert max-w-none">
                  <h3 className="text-xl font-semibold text-white mb-4">AI-Generated Course Content</h3>
                  <div className="text-zinc-300">
                    {aiContent.content}
                  </div>
                </div>
              ) : (
                <div className="text-center text-zinc-400">
                  <p>Failed to load AI-generated content. Please try again later.</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-2" 
                onClick={generateAiContent}
                disabled={aiLoading}
              >
                {aiLoading ? (
                  <span className="animate-spin mx-1">⟳</span>
                ) : (
                  <i className="ri-refresh-line"></i>
                )}
                {aiLoading ? "Generating..." : "Generate New Content"}
              </Button>
            </div>
          </section>
          
          {/* Topic recommendations section */}
          <section className="mt-12 bg-zinc-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Topic Recommendations</h2>
            <p className="text-zinc-400 mb-6">Based on current learning trends and industry demands, we recommend exploring these emerging topics:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">AI Ethics & Governance</h3>
                <p className="text-zinc-300 text-sm">Understanding the ethical implications and governance frameworks for artificial intelligence applications.</p>
              </div>
              <div className="bg-zinc-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Sustainable Technology</h3>
                <p className="text-zinc-300 text-sm">Exploring how technology can address climate change and environmental challenges.</p>
              </div>
              <div className="bg-zinc-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-2">Quantum Computing Basics</h3>
                <p className="text-zinc-300 text-sm">Introduction to quantum computing concepts and their potential impact on various industries.</p>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default Topics;
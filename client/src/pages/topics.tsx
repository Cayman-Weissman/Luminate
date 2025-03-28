import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TopicCard from '@/components/trending/topic-card';
import { TrendingTopic } from '@/lib/types';

const Topics = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Fetch trending topics
  const { data: topics = [], isLoading } = useQuery<TrendingTopic[]>({
    queryKey: ['/api/trending/topics'],
  });
  
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
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">Learning Topics</h1>
        
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

      <p className="text-zinc-400 mb-8">
        Explore our comprehensive catalog of learning topics. From cutting-edge technology to business fundamentals, dive into subject areas that match your interests and career goals.
      </p>
      
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
              <Card key={topic.id} className="bg-zinc-800/90 border-zinc-700 overflow-hidden backdrop-blur-sm hover:bg-zinc-700/90 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${topic.icon.startsWith('bg-') ? topic.icon : 'bg-primary/10'} text-primary mr-3`}>
                      <i className={topic.icon.startsWith('ri-') ? topic.icon : 'ri-lightbulb-line'}></i>
                    </div>
                    <h3 className="text-xl font-semibold text-white">{topic.title}</h3>
                  </div>
                  <p className="text-zinc-300 mb-4">{topic.description}</p>
                  <div className="flex items-center justify-between text-sm mb-4">
                    <span className="text-zinc-400">{topic.learnerCount.toLocaleString()} learners</span>
                    <span className="text-emerald-400">+{topic.growthPercentage}% growth</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {topic.tags?.map((tag, index) => (
                      <span key={index} className="bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-2">Explore Topic</Button>
                </CardContent>
              </Card>
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
    </main>
  );
};

export default Topics;
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import TrendingTicker from '@/components/trending/ticker';
import TopicCard from '@/components/trending/topic-card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Trending = () => {
  const { toast } = useToast();
  const [category, setCategory] = useState<string>('all');
  
  // Fetch trending topics data
  const { data: trendingItems, isLoading: tickerLoading } = useQuery({
    queryKey: ['/api/trending/ticker'],
  });
  
  // Fetch trending course cards
  const { data: topicCards, isLoading: topicsLoading } = useQuery({
    queryKey: ['/api/trending/topics', category],
  });
  
  const handleExplore = (topicId: number) => {
    toast({
      title: "Exploring topic",
      description: `Navigating to topic ${topicId}`,
    });
    // Navigate to the topic
    window.location.href = `/courses/topic/${topicId}`;
  };
  
  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };
  
  const isLoading = tickerLoading || topicsLoading;
  
  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[70vh]">Loading trending data...</div>;
  }
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Trending Topics</h2>
          <div className="hidden sm:block">
            <div className="inline-flex items-center">
              <span className="text-zinc-400 mr-2 text-sm">Filter:</span>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px] bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="science">Science</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        {/* Trending Ticker */}
        <TrendingTicker items={trendingItems || []} />
        
        {/* Trending Topics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
          {topicCards?.map((topic: any) => (
            <TopicCard
              key={topic.id}
              id={topic.id}
              title={topic.title}
              description={topic.description}
              icon={topic.icon}
              iconBackground={topic.iconBackground}
              iconColor={topic.iconColor}
              learnerCount={topic.learnerCount}
              growthPercentage={topic.growthPercentage}
              onExplore={handleExplore}
            />
          ))}
        </div>
      </section>
    </main>
  );
};

export default Trending;

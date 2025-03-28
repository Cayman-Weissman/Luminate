import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import TrendingTicker, { TrendingItem } from '@/components/trending/ticker';
import TopicCard from '@/components/trending/topic-card';
import TopicTrendChart from '@/components/ui/topic-trend-chart';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TrendingTopic } from '@/lib/types';

const Trending = () => {
  const { toast } = useToast();
  const [category, setCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<string>('cards');
  
  // Fetch trending topics data
  const { data: trendingItems, isLoading: tickerLoading } = useQuery<TrendingItem[]>({
    queryKey: ['/api/trending/ticker'],
  });
  
  // Fetch trending course cards
  const { data: topicCards, isLoading: topicsLoading } = useQuery<TrendingTopic[]>({
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <h2 className="text-2xl font-bold text-white">Trending Topics</h2>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-full sm:w-auto">
              <TabsList className="bg-zinc-800 border border-zinc-700">
                <TabsTrigger value="cards" className="data-[state=active]:bg-zinc-700">
                  <span className="hidden sm:inline">Topic Cards</span>
                  <span className="sm:hidden">Cards</span>
                </TabsTrigger>
                <TabsTrigger value="charts" className="data-[state=active]:bg-zinc-700">
                  <span className="hidden sm:inline">Growth Analytics</span>
                  <span className="sm:hidden">Charts</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="sm:block">
              <div className="inline-flex items-center">
                <span className="text-zinc-400 mr-2 text-sm">Filter:</span>
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="w-full sm:w-[180px] bg-zinc-800 border-zinc-700">
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
        </div>
        
        {/* Trending Ticker */}
        <TrendingTicker items={trendingItems || []} />
        
        {/* Trending Content Based on View Mode */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
            {topicCards?.map((topic) => (
              <TopicCard
                key={topic.id}
                id={topic.id}
                title={topic.title}
                description={topic.description}
                icon={topic.icon}
                iconBackground={topic.iconBackground || 'bg-primary/10'}
                iconColor={topic.iconColor || 'text-primary'}
                learnerCount={topic.learnerCount}
                growthPercentage={topic.growthPercentage}
                onExplore={handleExplore}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {topicCards?.map((topic) => (
              <TopicTrendChart 
                key={topic.id}
                topicId={topic.id}
                topicName={topic.title}
                className="h-full"
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default Trending;

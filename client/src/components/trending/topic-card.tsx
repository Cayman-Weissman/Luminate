import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingTopic } from '@/lib/types';

interface TopicCardProps {
  topic: TrendingTopic;
}

const TopicCard: React.FC<TopicCardProps> = ({ topic }) => {
  return (
    <Card className="bg-zinc-800/90 border-zinc-700 overflow-hidden backdrop-blur-sm hover:bg-zinc-700/90 transition-colors">
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
  );
};

export default TopicCard;
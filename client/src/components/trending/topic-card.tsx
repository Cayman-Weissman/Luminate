import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface TopicCardProps {
  id: number;
  title: string;
  description: string;
  icon: string;
  iconBackground: string;
  iconColor: string;
  learnerCount: number;
  growthPercentage: number;
  onExplore: (id: number) => void;
}

const TopicCard: React.FC<TopicCardProps> = ({
  id,
  title,
  description,
  icon,
  iconBackground,
  iconColor,
  learnerCount,
  growthPercentage,
  onExplore
}) => {
  return (
    <Card className="bg-zinc-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all group">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className={`${iconBackground} p-3 rounded-lg`}>
            <i className={`${icon} text-2xl ${iconColor}`}></i>
          </div>
          <div className="bg-zinc-900 rounded-full px-3 py-1 text-xs text-zinc-400 flex items-center">
            <i className="ri-user-line mr-1"></i>
            {learnerCount.toLocaleString()}k learners
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-400 mb-4">{description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="h-2 w-16 bg-zinc-900 rounded-full overflow-hidden">
              <div 
                className={`h-full ${growthPercentage >= 50 ? 'bg-green-500' : 'bg-amber-500'} rounded-full`} 
                style={{ width: `${Math.min(100, growthPercentage)}%` }}
              ></div>
            </div>
            <span className={`ml-2 ${growthPercentage >= 50 ? 'text-green-500' : 'text-amber-500'} text-xs`}>
              +{growthPercentage}%
            </span>
          </div>
          
          <Button 
            variant="link" 
            className="text-primary text-sm flex items-center font-medium p-0 hover:no-underline"
            onClick={() => onExplore(id)}
          >
            Explore
            <i className="ri-arrow-right-line ml-1"></i>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TopicCard;

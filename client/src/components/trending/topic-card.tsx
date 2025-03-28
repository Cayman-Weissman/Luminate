import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

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

// Generate mini chart data for preview inside card
const generateMiniChartData = (topicId: number, dataPoints = 10) => {
  const data = [];
  const seed = topicId * 1000;
  const baseValue = 100 + (topicId % 5) * 20;
  const trend = ((topicId % 7) - 3) / 10; // -0.3 to 0.3

  for (let i = 0; i < dataPoints; i++) {
    const timeProgress = i / dataPoints;
    const trendFactor = baseValue * (1 + (trend * timeProgress));
    const seasonalFactor = 1 + 0.1 * Math.sin(timeProgress * Math.PI * 2);
    const randomNoise = 0.9 + (Math.sin(seed + i) * 0.2);
    
    const value = Math.round(trendFactor * seasonalFactor * randomNoise);
    data.push({ value });
  }
  
  return data;
};

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
  const chartData = generateMiniChartData(id);
  const chartColor = growthPercentage >= 50 ? '#22c55e' : '#f59e0b'; // green-500 or amber-500

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
        
        {/* Mini chart preview */}
        <div className="h-16 mb-4 bg-zinc-900/50 rounded-md p-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-mini-${id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.8} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={chartColor} 
                strokeWidth={1.5}
                fill={`url(#gradient-mini-${id})`} 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
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

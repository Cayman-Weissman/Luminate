import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

export interface TrendingItem {
  id: number;
  rank: number;
  title: string;
  changePercentage: number;
}

interface TrendingTickerProps {
  items: TrendingItem[];
}

const TrendingTicker: React.FC<TrendingTickerProps> = ({ items }) => {
  return (
    <Card className="bg-zinc-800 rounded-xl shadow-lg overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="bg-primary/10 text-primary px-4 py-2 rounded-md flex items-center mr-4 flex-shrink-0">
            <i className="ri-fire-fill mr-2"></i>
            <span className="font-medium">Trending Now</span>
          </div>
          
          <div className="overflow-hidden whitespace-nowrap relative">
            <div className="inline-flex animate-marquee">
              {items.map((item) => (
                <div key={item.id} className="inline-block px-4 py-1 mr-6">
                  <div className="flex items-center">
                    <span className="text-zinc-400 mr-2">#{item.rank}</span>
                    <span className="text-white">{item.title}</span>
                    <span className={`ml-2 ${item.changePercentage > 10 ? 'text-green-500' : item.changePercentage > 0 ? 'text-amber-500' : 'text-red-500'} text-sm`}>
                      {item.changePercentage > 0 ? '+' : ''}{item.changePercentage}%
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Duplicate items for continuous scrolling */}
              {items.map((item) => (
                <div key={`dup-${item.id}`} className="inline-block px-4 py-1 mr-6">
                  <div className="flex items-center">
                    <span className="text-zinc-400 mr-2">#{item.rank}</span>
                    <span className="text-white">{item.title}</span>
                    <span className={`ml-2 ${item.changePercentage > 10 ? 'text-green-500' : item.changePercentage > 0 ? 'text-amber-500' : 'text-red-500'} text-sm`}>
                      {item.changePercentage > 0 ? '+' : ''}{item.changePercentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingTicker;

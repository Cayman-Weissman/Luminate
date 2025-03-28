import React from 'react';
import { Button } from '@/components/ui/button';

export interface TrendingItem {
  id: number;
  rank: number;
  title: string;
  changePercentage: number;
}

interface TrendingTickerProps {
  items: TrendingItem[];
  onSelect?: (ticker: string) => void;
  selectedTicker?: string | null;
}

const TrendingTicker: React.FC<TrendingTickerProps> = ({ items, onSelect, selectedTicker }) => {
  // Handle ticker item click if onSelect is provided
  const handleTickerClick = (title: string) => {
    if (onSelect) {
      onSelect(title);
    }
  };
  
  return (
    <div className="overflow-x-auto whitespace-nowrap py-1 scrollbar-hide">
      <div className="inline-flex gap-2 pl-2 pr-4">
        {items.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            onClick={() => handleTickerClick(item.title)}
            className={`
              border px-3 py-1 rounded-md text-sm font-medium flex items-center whitespace-nowrap
              ${selectedTicker === item.title 
                ? 'bg-primary/20 border-primary text-primary' 
                : 'border-zinc-700 text-white hover:bg-zinc-800'}
            `}
          >
            <span className="text-sm font-medium">${item.title.toUpperCase().replace(/\s+/g, '')}</span>
            <span 
              className={`ml-2 text-xs font-medium
                ${item.changePercentage > 0 
                  ? 'text-green-500' 
                  : item.changePercentage < 0 
                    ? 'text-red-500' 
                    : 'text-zinc-400'}
              `}
            >
              {item.changePercentage > 0 ? '+' : ''}{item.changePercentage.toFixed(2)}%
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TrendingTicker;

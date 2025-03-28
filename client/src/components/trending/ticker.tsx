import React from 'react';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface TrendingItem {
  id: number;
  rank: number;
  title: string;
  changePercentage: number;
}

interface TrendingTickerProps {
  items: TrendingItem[];
  onSelect?: (id: number) => void;
  selectedTickerId?: number | null;
}

const TrendingTicker: React.FC<TrendingTickerProps> = ({ items, onSelect, selectedTickerId }) => {
  // Handle ticker item click if onSelect is provided
  const handleTickerClick = (id: number) => {
    if (onSelect) {
      onSelect(id);
    }
  };
  
  // Create ticker symbol from title
  const createTickerSymbol = (title: string): string => {
    // Remove any non-alphanumeric characters and take the first 4 characters
    return title
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 4);
  };
  
  return (
    <div className="overflow-x-auto whitespace-nowrap py-2 bg-zinc-900 border-y border-zinc-800 scrollbar-hide">
      <div className="inline-flex gap-3 px-4">
        {items.map((item) => {
          const symbol = createTickerSymbol(item.title);
          const isPositive = item.changePercentage > 0;
          const isNegative = item.changePercentage < 0;
          const isSelected = selectedTickerId === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => handleTickerClick(item.id)}
              className={`
                px-3 py-1 rounded flex items-center whitespace-nowrap h-auto
                ${isSelected 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-transparent text-white hover:bg-zinc-800'}
              `}
            >
              <div className="flex flex-col items-start">
                <div className="flex items-center">
                  <span className="text-sm font-semibold">{item.title}</span>
                  <span className="text-xs text-zinc-500 ml-1.5">#{symbol}</span>
                </div>
                <div className="flex items-center mt-0.5">
                  {isPositive && <TrendingUp size={12} className="text-green-500 mr-1" />}
                  {isNegative && <TrendingDown size={12} className="text-red-500 mr-1" />}
                  {!isPositive && !isNegative && <Minus size={12} className="text-zinc-400 mr-1" />}
                  <span 
                    className={`text-xs font-medium
                      ${isPositive 
                        ? 'text-green-500' 
                        : isNegative 
                          ? 'text-red-500' 
                          : 'text-zinc-400'}
                    `}
                  >
                    {isPositive ? '+' : ''}{item.changePercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
};

export default TrendingTicker;

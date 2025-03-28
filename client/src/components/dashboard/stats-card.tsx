import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  iconBgColor?: string;
  iconColor?: string;
  progress?: number;
  progressColor?: string;
  subtitle?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  progress,
  progressColor = 'bg-primary',
  subtitle
}) => {
  return (
    <Card className="bg-zinc-800 hover:bg-zinc-700 transition-all hover:shadow-xl hover:translate-y-[-2px]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm">{title}</p>
            <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBgColor}`}>
            <i className={`${icon} ${iconColor} text-2xl`}></i>
          </div>
        </div>
        
        {(progress !== undefined || subtitle) && (
          <div className="mt-4">
            {progress !== undefined && (
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${progressColor} rounded-full`} 
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-zinc-400 mt-2">{subtitle}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;

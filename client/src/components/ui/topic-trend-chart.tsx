import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface TopicTrendChartProps {
  topicId: number;
  topicName: string;
  className?: string;
}

// Generate realistic looking time series data for a topic
const generateTimeSeriesData = (topicId: number, timeframe: string) => {
  const data: { date: string; activeCount: number }[] = [];
  
  // Use a consistent seed based on topicId to ensure same topic always gets same pattern
  const seed = topicId * 1000;
  
  // Determine amount of data points based on timeframe
  let dataPoints: number;
  let dateFormat: string;
  let startDate = new Date();
  
  switch (timeframe) {
    case '1W':
      dataPoints = 7;
      dateFormat = 'MMM d';
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '1M':
      dataPoints = 30;
      dateFormat = 'MMM d';
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '3M':
      dataPoints = 12; // Show weekly data points
      dateFormat = 'MMM d';
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '6M':
      dataPoints = 24; // Show bi-weekly data points
      dateFormat = 'MMM d';
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1Y':
      dataPoints = 12; // Show monthly data points
      dateFormat = 'MMM yyyy';
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case '5Y':
      dataPoints = 10; // Show 6-month data points
      dateFormat = 'MMM yyyy';
      startDate.setFullYear(startDate.getFullYear() - 5);
      break;
    default:
      dataPoints = 30;
      dateFormat = 'MMM d';
      startDate.setDate(startDate.getDate() - 30);
  }
  
  // Base active learners count (vary by topic id to ensure different topics have different scales)
  const baseCount = 1000 + (topicId * 500);
  
  // Growth trend multiplier (some topics are growing, some declining)
  const growthTrend = ((topicId % 5) - 2) / 10; // -0.2 to 0.2
  
  // Generate data
  for (let i = 0; i < dataPoints; i++) {
    const currentDate = new Date(startDate);
    
    // Adjust date based on timeframe and iteration
    switch (timeframe) {
      case '1W':
        currentDate.setDate(currentDate.getDate() + i);
        break;
      case '1M':
        currentDate.setDate(currentDate.getDate() + i);
        break;
      case '3M':
        currentDate.setDate(currentDate.getDate() + (i * 7)); // Weekly
        break;
      case '6M':
        currentDate.setDate(currentDate.getDate() + (i * 14)); // Bi-weekly
        break;
      case '1Y':
        currentDate.setMonth(currentDate.getMonth() + i);
        break;
      case '5Y':
        currentDate.setMonth(currentDate.getMonth() + (i * 6));
        break;
    }
    
    // Calculate active learners with realistic variations
    // Base + growth trend + seasonal variation + random noise
    const timeProgress = i / dataPoints;
    const trendFactor = baseCount * (1 + (growthTrend * timeProgress));
    const seasonalFactor = 1 + 0.1 * Math.sin(timeProgress * Math.PI * 2); // Seasonal variation
    const randomNoise = 0.9 + (Math.sin(seed + i) * 0.2); // Deterministic "random" noise
    
    const activeCount = Math.round(trendFactor * seasonalFactor * randomNoise);
    
    data.push({
      date: currentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: timeframe === '1Y' || timeframe === '5Y' ? 'numeric' : undefined
      }),
      activeCount
    });
  }
  
  return data;
};

export function TopicTrendChart({ topicId, topicName, className = '' }: TopicTrendChartProps) {
  const [timeframe, setTimeframe] = useState<string>('1M');
  const chartData = generateTimeSeriesData(topicId, timeframe);
  
  // Calculate change percentage
  const startValue = chartData[0]?.activeCount || 0;
  const endValue = chartData[chartData.length - 1]?.activeCount || 0;
  const changePercentage = startValue ? ((endValue - startValue) / startValue) * 100 : 0;
  
  return (
    <Card className={`bg-zinc-800/90 border-zinc-700 overflow-hidden p-4 ${className}`}>
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-white">{topicName}</h3>
          <div className="text-right">
            <p className="text-sm text-zinc-400">Active Learners</p>
            <div className="text-lg font-medium text-white">
              {endValue.toLocaleString()}
              <span className={`ml-2 text-sm ${changePercentage >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {changePercentage >= 0 ? '+' : ''}{changePercentage.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${topicId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#9CA3AF', fontSize: 12 }} 
              tickLine={false} 
              axisLine={{ stroke: '#4B5563' }}
            />
            <YAxis 
              tick={{ fill: '#9CA3AF', fontSize: 12 }} 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(value) => {
                if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `${(value / 1000).toFixed(0)}k`;
                return value.toString();
              }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '0.375rem' }} 
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value: number) => [value.toLocaleString(), 'Active Learners']}
            />
            <Area 
              type="monotone" 
              dataKey="activeCount" 
              stroke="#F59E0B" 
              strokeWidth={2}
              fill={`url(#gradient-${topicId})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
        
        <Tabs defaultValue={timeframe} onValueChange={setTimeframe} className="w-full">
          <TabsList className="grid grid-cols-6 bg-zinc-900 border border-zinc-700">
            <TabsTrigger value="1W" className="data-[state=active]:bg-zinc-800">1W</TabsTrigger>
            <TabsTrigger value="1M" className="data-[state=active]:bg-zinc-800">1M</TabsTrigger>
            <TabsTrigger value="3M" className="data-[state=active]:bg-zinc-800">3M</TabsTrigger>
            <TabsTrigger value="6M" className="data-[state=active]:bg-zinc-800">6M</TabsTrigger>
            <TabsTrigger value="1Y" className="data-[state=active]:bg-zinc-800">1Y</TabsTrigger>
            <TabsTrigger value="5Y" className="data-[state=active]:bg-zinc-800">5Y</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </Card>
  );
}

export default TopicTrendChart;
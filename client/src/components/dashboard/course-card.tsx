import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import ProgressCircle from '@/components/ui/progress-circle';

interface CourseCardProps {
  id: string | number;
  title: string;
  category: string;
  description: string;
  timeLeft: string;
  progress: number;
  image: string;
}

const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  category,
  description,
  timeLeft,
  progress,
  image
}) => {
  return (
    <Card className="bg-zinc-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all group">
      <div className="h-36 overflow-hidden relative">
        <img 
          className="w-full h-full object-cover transform group-hover:scale-105 transition-transform" 
          src={image} 
          alt={title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
        <div className="absolute bottom-3 left-4 text-white font-medium flex items-center">
          <ProgressCircle 
            value={progress} 
            size={32} 
            className="mr-3"
            primaryColor={progress > 75 ? '#4CAF50' : progress > 40 ? '#4A90E2' : '#FFD700'}
          >
            <span className="text-xs font-bold">{progress}%</span>
          </ProgressCircle>
          <span>{title}</span>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="bg-zinc-900 rounded-full px-3 py-1 text-xs text-zinc-400">{category}</span>
          <span className="text-zinc-400 text-xs">{timeLeft} left</span>
        </div>
        
        <p className="text-sm text-zinc-400 mb-4">{description}</p>
        
        <Link href={`/courses/${id}`}>
          <Button 
            variant="secondary" 
            className="w-full bg-zinc-900 hover:bg-zinc-700 text-white font-medium"
          >
            <i className="ri-play-circle-line mr-2"></i>
            Continue Learning
          </Button>
        </Link>
      </div>
    </Card>
  );
};

export default CourseCard;

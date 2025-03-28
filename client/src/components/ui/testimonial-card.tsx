import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface TestimonialCardProps {
  name: string;
  role: string;
  avatar: string;
  text: string;
  rating: number;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({
  name,
  role,
  avatar,
  text,
  rating
}) => {
  return (
    <Card className="bg-zinc-800 rounded-xl shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <Avatar className="h-12 w-12 mr-4">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback>{name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div>
            <h4 className="font-medium text-white">{name}</h4>
            <p className="text-zinc-400 text-sm">{role}</p>
          </div>
        </div>
        
        <p className="text-zinc-400 mb-4">{text}</p>
        
        <div className="flex text-primary">
          {[...Array(5)].map((_, i) => (
            <i key={i} className={`${i < rating ? 'ri-star-fill' : i + 0.5 === rating ? 'ri-star-half-fill' : 'ri-star-line'}`}></i>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TestimonialCard;

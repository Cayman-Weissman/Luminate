import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  primaryColor?: string;
  bgColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export function ProgressCircle({
  value,
  size = 32,
  strokeWidth = 4,
  primaryColor = 'currentColor',
  bgColor = 'rgba(255, 255, 255, 0.1)',
  className,
  children
}: ProgressCircleProps) {
  // Ensure value is between 0 and 100
  const normalizedValue = Math.min(100, Math.max(0, value));
  
  // Calculate radius (half of size minus stroke width)
  const radius = (size - strokeWidth) / 2;
  
  // Calculate circumference
  const circumference = 2 * Math.PI * radius;
  
  // Calculate stroke dash based on percentage
  const strokeDash = (normalizedValue / 100) * circumference;
  
  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg 
        width={size} 
        height={size} 
        className="transform -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={primaryColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDash}
          strokeLinecap="round"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

export default ProgressCircle;

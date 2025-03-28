import React, { useEffect, useRef, useState } from 'react';

interface Dot {
  x: number;
  y: number;
  element: HTMLDivElement;
}

export const InteractiveBackground: React.FC = () => {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const [mouseMoved, setMouseMoved] = useState(false);
  
  useEffect(() => {
    // Don't run on server side
    if (typeof window === 'undefined') return;
    
    const createDots = () => {
      if (!backgroundRef.current) return;
      
      // Clear current dots
      backgroundRef.current.innerHTML = '';
      dotsRef.current = [];
      
      const dotSize = 2;
      const spacing = 30;
      const width = window.innerWidth;
      const height = window.innerHeight;
      const rows = Math.ceil(height / spacing);
      const cols = Math.ceil(width / spacing);
      
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const dot = document.createElement('div');
          dot.classList.add('w-[2px]', 'h-[2px]', 'bg-white/10', 'absolute', 'rounded-full', 'transition-all', 'duration-200');
          dot.style.left = `${j * spacing}px`;
          dot.style.top = `${i * spacing}px`;
          
          backgroundRef.current.appendChild(dot);
          
          dotsRef.current.push({
            x: j * spacing,
            y: i * spacing,
            element: dot
          });
        }
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      setMouseMoved(true);
      
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      
      dotsRef.current.forEach(dot => {
        const distance = Math.sqrt(
          Math.pow(mouseX - dot.x, 2) + 
          Math.pow(mouseY - dot.y, 2)
        );
        
        if (distance < 60) {
          dot.element.classList.add('bg-primary/40', 'scale-150');
          dot.element.classList.remove('bg-white/10');
        } else {
          dot.element.classList.remove('bg-primary/40', 'scale-150');
          dot.element.classList.add('bg-white/10');
        }
      });
    };
    
    createDots();
    
    window.addEventListener('resize', createDots);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('resize', createDots);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);
  
  return (
    <div
      ref={backgroundRef}
      className="fixed top-0 left-0 w-full h-full z-[-1] pointer-events-none"
      aria-hidden="true"
    />
  );
};

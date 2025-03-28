import React, { useEffect, useRef } from 'react';

interface DotGridBackgroundProps {
  className?: string;
}

export function DotGridBackground({ className = '' }: DotGridBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      ctx.scale(dpr, dpr);
    };

    // Handles responsive canvas sizing
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Draw the dot grid
    const drawDotGrid = () => {
      if (!canvas || !ctx) return;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate dots based on screen size
      const spacing = 30; // Space between dots
      const dotSize = 0.7; // Base size of each dot (smaller to match other pages)
      
      // Calculate how many dots we need
      const dotsX = Math.ceil(canvas.clientWidth / spacing);
      const dotsY = Math.ceil(canvas.clientHeight / spacing);
      
      // Get mouse position
      const mouseX = mouseRef.current.x;
      const mouseY = mouseRef.current.y;
      
      // Draw each dot
      for (let x = 0; x < dotsX; x++) {
        for (let y = 0; y < dotsY; y++) {
          const xPos = x * spacing;
          const yPos = y * spacing;
          
          // Make the dot pulsate slightly
          const time = Date.now() / 3000;
          const distance = Math.sqrt(
            Math.pow(xPos - canvas.clientWidth / 2, 2) + 
            Math.pow(yPos - canvas.clientHeight / 2, 2)
          );
          
          let opacity = Math.min(
            0.3,
            0.15 + 0.05 * Math.sin(time + distance / 50)
          );
          
          // Calculate distance from dot to mouse
          const mouseDistance = Math.sqrt(
            Math.pow(xPos - mouseX, 2) + 
            Math.pow(yPos - mouseY, 2)
          );
          
          // Make dots glow when near the cursor
          const influenceRadius = 100; // Radius of cursor influence
          if (mouseDistance < influenceRadius) {
            // Increase opacity and size based on proximity to cursor
            const influence = 1 - (mouseDistance / influenceRadius);
            opacity = Math.min(0.8, opacity + influence * 0.5);
            
            // Draw a slightly larger dot with glow effect
            const glowSize = dotSize + influence * 1.5;
            
            // Draw glow
            const gradient = ctx.createRadialGradient(
              xPos, yPos, 0,
              xPos, yPos, glowSize * 2
            );
            gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(xPos, yPos, glowSize * 2, 0, Math.PI * 2);
            ctx.fill();
          }
          
          // Draw base dot
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
          ctx.beginPath();
          ctx.arc(xPos, yPos, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      
      // Request next frame
      requestAnimationFrame(drawDotGrid);
    };

    // Start animation
    drawDotGrid();

    // Track mouse movement for interactive dots
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
    />
  );
}

export default DotGridBackground;
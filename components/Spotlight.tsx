'use client';
import { useEffect, useRef } from 'react';

export default function Spotlight() {
  const divRef = useRef<HTMLDivElement>(null);
  const position = useRef({ x: 0, y: 0 }); // Target mouse position
  const current = useRef({ x: 0, y: 0 });  // Current glow position (for lag)

  useEffect(() => {
    // 1. Update target position on mouse move
    const handleMouseMove = (e: MouseEvent) => {
      position.current = { x: e.clientX, y: e.clientY };
    };

    // 2. Animation loop for the "Latency" effect
    const animate = () => {
      if (!divRef.current) return;

      // Smoothly move "current" towards "position" (Linear Interpolation)
      // Change 0.1 to 0.05 for more lag, or 0.2 for less lag
      const easing = 0.08; 
      
      // ... previous code ...
      
      current.current.x += (position.current.x - current.current.x) * easing;
      current.current.y += (position.current.y - current.current.y) * easing;

      // UPDATED: Brighter Blue (rgba 96, 165, 250) and Higher Opacity (0.25)
      divRef.current.style.background = `radial-gradient(
        600px circle at ${current.current.x}px ${current.current.y}px, 
        rgba(96, 165, 250, 0.25), 
        transparent 40%
      )`;

      requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={divRef}
      suppressHydrationWarning={true}
      className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
      style={{
        // Match the brighter blue here too
        background: `radial-gradient(600px circle at 0px 0px, rgba(96, 165, 250, 0.25), transparent 40%)`
      }}
    />
  );
}
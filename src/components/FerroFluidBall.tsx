import { useEffect, useRef, useState } from "react";

interface FerroFluidBallProps {
  audioElement?: HTMLAudioElement | null;
  audioAnalyser?: AnalyserNode | null;
  isActive?: boolean;
}

export const FerroFluidBall = ({ audioElement, audioAnalyser, isActive = false }: FerroFluidBallProps) => {
  const [time, setTime] = useState(0);
  const animationRef = useRef<number>();

  // Simple animation loop
  useEffect(() => {
    const animate = () => {
      setTime(prev => prev + 0.008);
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  // Generate smooth organic shape - animates more when active
  const generateFluidPath = (t: number) => {
    const numPoints = 64;
    const centerX = 100;
    const centerY = 100;
    
    // Simple approach: animate more when active (conversation happening)
    const activityBoost = isActive ? 1.5 : 0.3; // 1.5x when active, 0.3x when idle
    const baseRadius = 85;
    
    const calculatedPoints: Array<{x: number, y: number}> = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
      // Spherical harmonics-like deformation
      const wave1 = Math.sin(angle * 2 + t * 0.8) * 2.5 * activityBoost;
      const wave2 = Math.sin(angle * 3 - t * 0.6) * 1.8 * activityBoost;
      const wave3 = Math.cos(angle * 4 + t * 0.4) * 1.2 * activityBoost;
      const wave4 = Math.sin(angle * 5 - t * 0.9) * 0.8 * activityBoost;
      
      // Add breathing effect
      const breathe = Math.sin(t * 0.5) * 2 * activityBoost;
      
      const radius = baseRadius + wave1 + wave2 + wave3 + wave4 + breathe;
      
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      calculatedPoints.push({ x, y });
    }
    
    // Build path with smooth cubic Bezier curves
    const pathParts: string[] = [];
    pathParts.push(`M ${calculatedPoints[0].x},${calculatedPoints[0].y}`);
    
    for (let i = 0; i < numPoints; i++) {
      const current = calculatedPoints[i];
      const next = calculatedPoints[(i + 1) % numPoints];
      const prev = calculatedPoints[(i - 1 + numPoints) % numPoints];
      const nextNext = calculatedPoints[(i + 2) % numPoints];
      
      const tension = 0.5;
      
      const cp1x = current.x + (next.x - prev.x) * tension;
      const cp1y = current.y + (next.y - prev.y) * tension;
      
      const cp2x = next.x - (nextNext.x - current.x) * tension;
      const cp2y = next.y - (nextNext.y - current.y) * tension;
      
      pathParts.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`);
    }
    
    return pathParts.join(' ') + ' Z';
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10">
      <svg width="500" height="500" viewBox="0 0 200 200" className="drop-shadow-2xl">
        <defs>
          <radialGradient id="ferroGradient" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%" stopColor="#0a0a0a" stopOpacity="1" />
            <stop offset="40%" stopColor="#050505" stopOpacity="1" />
            <stop offset="70%" stopColor="#020202" stopOpacity="1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="1" />
          </radialGradient>

          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <path
          d={generateFluidPath(time)}
          fill="url(#ferroGradient)"
          filter="url(#glow)"
        />
      </svg>
    </div>
  );
};

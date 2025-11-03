import memoryBg from "@/assets/memory-bg.svg";

interface HudMemoryProps {
  percentage: number;
  label?: string;
}

export const HudMemory = ({ percentage, label = "Memory Reserve" }: HudMemoryProps) => {
  return (
    <div className="relative animate-fade-in" style={{ width: "181px", height: "307px" }}>
      {/* SVG Background */}
      <img 
        src={memoryBg} 
        alt="" 
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Content overlay */}
      <div className="relative h-full flex flex-col items-center justify-between pt-16 pb-8">
        {/* Top spacer */}
        <div></div>
        
        {/* Percentage - positioned in center of sphere */}
        <div className="text-2xl font-bold text-white tracking-wider" style={{ marginTop: "-63px" }}>
          {percentage}%
        </div>

        {/* Label at bottom */}
        <div className="text-xs font-medium text-white text-center tracking-wider">
          {label}
        </div>
      </div>
    </div>
  );
};

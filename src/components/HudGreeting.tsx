import { useEffect, useState } from "react";

interface HudGreetingProps {
  name: string;
}

export const HudGreeting = ({ name }: HudGreetingProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 0 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="animate-fade-in">
      <h1 className="text-5xl font-medium mb-2">
        Hello {name}
      </h1>
      <p className="text-4xl font-light">
        {getTimeOfDayGreeting()}.
      </p>
      <p className="text-2xl font-light mt-2 opacity-70">
        {formatTime()}
      </p>
    </div>
  );
};

import { useEffect, useState } from "react";

export const HudDateTime = () => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDay = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "long" });
  };

  return (
    <div className="text-right animate-fade-in">
      <div className="text-3xl font-medium mb-2">
        {formatDate(dateTime)}
      </div>
      <div className="text-2xl font-light">
        {formatDay(dateTime)}
      </div>
    </div>
  );
};

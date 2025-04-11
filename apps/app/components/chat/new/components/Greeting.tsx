import React from "react";

// Function to get time of day greeting
const getTimeGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "good morning";
  if (hour < 18) return "good afternoon";
  return "good evening";
};

interface GreetingProps {
  userName?: string | null;
}

export function Greeting({ userName }: GreetingProps) {
  const timeGreeting = getTimeGreeting();
  const greeting = userName ? `${timeGreeting}, ${userName}.` : timeGreeting;

  return (
    <div className="flex items-center justify-center gap-3">
      <h1 className="text-5xl text-primary mb-1 font-title tracking-tight select-none">
        {greeting}
      </h1>
    </div>
  );
}

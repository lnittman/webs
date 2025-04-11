import React from "react";

interface ErrorMessageProps {
  content: any;
}

export function ErrorMessage({ content }: ErrorMessageProps) {
  return (
    <div className="text-destructive px-6 py-3">
      Error: {content.error || "An unknown error occurred"}
    </div>
  );
} 
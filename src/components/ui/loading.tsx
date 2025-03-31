import { Loader2 } from "lucide-react";

interface LoadingProps {
  text?: string;
  className?: string;
}

export function Loading({ text = "Loading...", className = "" }: LoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] space-y-4 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse"></div>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      <p className="text-muted-foreground animate-pulse">{text}</p>
    </div>
  );
} 
import { Loader2 } from "lucide-react";

export const LoaderCircle = ({ size = 24, className = "" }) => {
  return (
    <Loader2 
      className={`animate-spin text-muted-foreground ${className}`} 
      size={size} 
    />
  );
};

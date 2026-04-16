import { Glasses } from "lucide-react";
import { Link } from "react-router";

interface LogoProps {
  className?: string;
  variant?: "default" | "white";
}

export default function Logo({ className = "", variant = "default" }: LogoProps) {
  const textColor = variant === "white" ? "text-white" : "text-primary";
  const iconColor = variant === "white" ? "text-white" : "text-primary";

  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className={`w-10 h-10 ${iconColor} bg-primary/10 rounded-lg flex items-center justify-center`}>
        <Glasses className="w-6 h-6" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className={`text-xl ${textColor} tracking-tight font-bold`}>
          Vision
        </span>
        <span className={`text-xs ${textColor} opacity-80`}>
          Direct
        </span>
      </div>
    </Link>
  );
}

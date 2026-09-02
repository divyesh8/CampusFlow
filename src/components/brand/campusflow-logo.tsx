interface CampusFlowLogoProps {
  size?: number;
  showWordmark?: boolean;
  className?: string;
}

export function CampusFlowLogo({ size = 32, showWordmark = false, className }: CampusFlowLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="CampusFlow"
      >
        <rect width="32" height="32" rx="8" className="fill-foreground" />
        <path
          d="M22 10C19.5 8 16 7.5 13 8.5C10 9.5 8 12 7.5 15C7 18 8 21 10.5 23"
          stroke="currentColor"
          className="text-background"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="10.5" cy="23" r="2.2" className="fill-background opacity-60" />
        <circle cx="22" cy="10" r="2.2" className="fill-background" />
        <circle cx="13" cy="8.5" r="1.8" className="fill-background opacity-60" />
      </svg>
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight">CampusFlow</span>
      )}
    </div>
  );
}

export function CampusFlowLogoMark({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <CampusFlowLogo size={size} className={className} />
  );
}

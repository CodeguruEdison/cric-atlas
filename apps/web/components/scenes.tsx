export function FieldScene({ seed }: { seed: number }) {
  const id = `field-${seed}`;
  return (
    <svg aria-hidden viewBox="0 0 360 140" preserveAspectRatio="xMidYMid slice" className="size-full">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3b82d6" /><stop offset="1" stopColor="#bfe3f7" /></linearGradient>
        <linearGradient id={`${id}-grass`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#65a83a" /><stop offset="1" stopColor="#8ec64a" /></linearGradient>
      </defs>
      <rect width="360" height="140" fill={`url(#${id}-sky)`} />
      <ellipse cx={40 + ((seed * 53) % 280)} cy="20" rx="38" ry="7" fill="#fff" opacity="0.8" />
      {Array.from({ length: 16 }, (_, i) => (
        <circle key={i} cx={i * 25 - 4} cy={58 - (((i + seed) * 17) % 14)} r={17 + (((i + seed) * 11) % 11)} fill={i % 3 === 0 ? "#1f6a35" : i % 3 === 1 ? "#17562c" : "#2a7c3e"} />
      ))}
      <rect y="66" width="360" height="74" fill={`url(#${id}-grass)`} />
      <ellipse cx="180" cy="108" rx="150" ry="28" fill="none" stroke="#fff" strokeOpacity="0.28" strokeWidth="9" />
      <ellipse cx="180" cy="108" rx="82" ry="15" fill="none" stroke="#fff" strokeOpacity="0.22" strokeWidth="7" />
      <path d="M170 96h20l5 24h-30z" fill="#d9c58e" opacity="0.85" />
    </svg>
  );
}

const heroTrees = Array.from({ length: 110 }, (_, i) => ({
  x: i * 15 - 10,
  y: 352 - ((i * 37) % 58),
  r: 20 + ((i * 23) % 30),
  fill: ["#123f24", "#17512c", "#0f3520", "#1c5e32", "#245f2f"][i % 5],
}));

function Wicket({ x, y, height = 92 }: { x: number; y: number; height?: number }) {
  return (
    <g fill="#e8c85a">
      {[0, 13, 26].map((offset) => <rect key={offset} x={x + offset} y={y} width="6" height={height} rx="2" />)}
      <rect x={x - 2} y={y - 3} width="36" height="4" rx="2" />
    </g>
  );
}

/** Original illustration, so the page never implies a photo of a specific ground. */
export function HeroScene() {
  return (
    <svg aria-hidden viewBox="0 0 1600 620" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full">
      <defs>
        <linearGradient id="hero-sky" x1="0" x2="1" y1="0" y2="0.7">
          <stop offset="0" stopColor="#102a46" /><stop offset="0.55" stopColor="#35597a" />
          <stop offset="0.82" stopColor="#d99a5b" /><stop offset="1" stopColor="#f6c56f" />
        </linearGradient>
        <linearGradient id="hero-grass" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#5f9f35" /><stop offset="1" stopColor="#2f7a2c" />
        </linearGradient>
        <filter id="hero-soft"><feGaussianBlur stdDeviation="2.5" /></filter>
        <radialGradient id="hero-sun"><stop offset="0" stopColor="#ffe9a8" stopOpacity="0.95" /><stop offset="1" stopColor="#ffb85c" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="1600" height="620" fill="url(#hero-sky)" />
      <circle cx="1400" cy="250" r="260" fill="url(#hero-sun)" />
      <g filter="url(#hero-soft)">{heroTrees.map((t) => <circle key={t.x} cx={t.x} cy={t.y} r={t.r} fill={t.fill} />)}</g>
      <rect y="365" width="1600" height="255" fill="url(#hero-grass)" />
      {Array.from({ length: 9 }, (_, i) => <path key={i} d={`M${i * 200 - 40} 370h100l-130 250h-110z`} fill="#fff" opacity="0.045" />)}
      <path d="M210 548L1390 548 1450 582 150 582z" fill="#c9ad72" opacity="0.65" />
      <Wicket x={230} y={474} height={78} />
      <Wicket x={1340} y={474} height={78} />
    </svg>
  );
}

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

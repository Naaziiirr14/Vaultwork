// Banknote-style rosette: same ellipse rotate panni repeat panna guilloche pattern varum
export default function Guilloche({ size = 420, petals = 40, weight = 0.6, className = "", style }) {
  const layers = [
    { rx: 190, ry: 70 },
    { rx: 150, ry: 54 },
    { rx: 110, ry: 38 },
  ];
  return (
    <svg
      viewBox="-200 -200 400 400"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
    >
      <g strokeWidth={weight}>
        {layers.map((l, li) =>
          Array.from({ length: petals }, (_, i) => (
            <ellipse
              key={`${li}-${i}`}
              rx={l.rx}
              ry={l.ry}
              transform={`rotate(${(i * 180) / petals + li * (90 / petals)})`}
            />
          ))
        )}
      </g>
      <circle r="196" strokeWidth={weight * 2} />
      <circle r="191" strokeWidth={weight} />
      <circle r="34" strokeWidth={weight * 1.6} />
      <circle r="27" strokeWidth={weight} />
    </svg>
  );
}

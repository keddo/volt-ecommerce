const CORNERS = [
  "left-0 top-0 border-l border-t",
  "right-0 top-0 border-r border-t",
  "left-0 bottom-0 border-l border-b",
  "right-0 bottom-0 border-r border-b",
];

export function CornerBrackets() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {CORNERS.map((corner) => (
        <span key={corner} className={`absolute h-4 w-4 border-accent/70 ${corner}`} style={{ margin: -1 }} />
      ))}
    </div>
  );
}

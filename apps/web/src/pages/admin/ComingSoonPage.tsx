import { useLocation } from "react-router-dom";

export function ComingSoonPage() {
  const { pathname } = useLocation();
  const section = pathname.split("/").pop() ?? "";

  return (
    <div>
      <h1 className="text-2xl font-bold capitalize">{section}</h1>
      <p className="mt-2 text-surface-muted">This section is built in a later phase.</p>
    </div>
  );
}

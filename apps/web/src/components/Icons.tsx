export function CartIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="M3 4h2.2l.9 3M6.1 7l1.6 8.2a1.6 1.6 0 0 0 1.57 1.3h8a1.6 1.6 0 0 0 1.57-1.27L20.5 7.8a.6.6 0 0 0-.59-.8H6.1Z" strokeLinejoin="round" />
      <circle cx="9.5" cy="20" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="17" cy="20" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function HeartIcon({ className = "h-5 w-5", filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      className={className}
      aria-hidden
    >
      <path
        d="M12 20.2 4.6 13c-2-1.98-2-5.2 0-7.18a4.9 4.9 0 0 1 7-0.02L12 6.2l0.4-0.4a4.9 4.9 0 0 1 7 0.02c2 1.98 2 5.2 0 7.18Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PhoneIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path
        d="M5.3 3.5h3l1.4 4.3-2.1 1.6a12 12 0 0 0 6.9 6.9l1.6-2.1 4.3 1.4v3a1.6 1.6 0 0 1-1.7 1.6A17.6 17.6 0 0 1 3.7 5.2a1.6 1.6 0 0 1 1.6-1.7Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TelegramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden>
      <path d="m3.5 12.4 16-7.9-3 16.3-5.4-4.3-2.6 2.6-.4-4.6Z" strokeLinejoin="round" strokeLinecap="round" />
      <path d="M16.5 4.5 9.1 14.5" strokeLinecap="round" />
    </svg>
  );
}

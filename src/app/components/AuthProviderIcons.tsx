import type { CSSProperties } from "react";

interface IconProps {
  style?: CSSProperties;
}

export function GoogleIcon({ style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={style}>
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.6 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.6 12 2.6 6.9 2.6 2.8 6.8 2.8 12s4.1 9.4 9.2 9.4c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12Z" />
      <path fill="#34A853" d="M2.8 12c0 1.7.6 3.2 1.6 4.5l3.1-2.4c-.2-.6-.4-1.3-.4-2.1s.1-1.4.4-2.1L4.4 7.5C3.4 8.8 2.8 10.3 2.8 12Z" />
      <path fill="#FBBC05" d="M12 21.4c2.5 0 4.7-.8 6.2-2.3l-3-2.4c-.8.6-1.9 1-3.2 1-2.5 0-4.7-1.7-5.5-4L3.3 16c1.6 3.2 4.9 5.4 8.7 5.4Z" />
      <path fill="#4285F4" d="M18.2 19.1c1.8-1.7 2.6-4.1 2.6-6.6 0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.2 1.1-.8 2.7-2.4 3.9l3.2 2.4Z" />
    </svg>
  );
}

export function FacebookIcon({ style }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" style={style}>
      <path fill="currentColor" d="M24 12.1C24 5.4 18.6 0 12 0S0 5.4 0 12.1c0 6 4.4 11 10.1 12v-8.5H7.1v-3.5h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.6.2 2.6.2v2.9h-1.5c-1.5 0-2 .9-2 1.9v2.3h3.4l-.5 3.5h-2.9v8.5C19.6 23.1 24 18.1 24 12.1Z" />
    </svg>
  );
}
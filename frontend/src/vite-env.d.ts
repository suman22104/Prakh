/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module '@tailwindcss/vite' {
  import type { PluginOption } from 'vite';
  export default function tailwindcss(): PluginOption;
}

declare module 'react-router-dom' {
  export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T;
  export function useNavigate(): (to: string | number, options?: { replace?: boolean; state?: unknown }) => void;
  export function useLocation(): { pathname: string; search: string; hash: string; state: unknown; key: string };
  export const BrowserRouter: React.ComponentType<{ children?: React.ReactNode }>;
  export const Routes: React.ComponentType<{ children?: React.ReactNode }>;
  export const Route: React.ComponentType<{ path?: string; element?: React.ReactNode; children?: React.ReactNode }>;
  export const Navigate: React.ComponentType<{ to: string; replace?: boolean }>;
  export const Link: React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string }>;
  export const NavLink: React.ComponentType<React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; className?: string | ((props: { isActive: boolean }) => string) }>;
}

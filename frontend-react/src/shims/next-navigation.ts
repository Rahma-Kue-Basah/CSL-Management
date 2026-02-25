import { useCallback } from "react";
import {
  useLocation,
  useNavigate,
  useParams as useRouteParams,
  useSearchParams as useRouteSearchParams,
} from "react-router-dom";

export function useRouter() {
  const navigate = useNavigate();

  return {
    push: (href: string) => navigate(href),
    replace: (href: string) => navigate(href, { replace: true }),
    back: () => navigate(-1),
    forward: () => navigate(1),
    refresh: () => window.location.reload(),
  };
}

export function usePathname() {
  const location = useLocation();
  return location.pathname;
}

export function useParams<T extends Record<string, string | string[] | undefined>>() {
  return useRouteParams() as T;
}

export function useSearchParams() {
  const [params] = useRouteSearchParams();
  return params;
}

export function redirect(href: string): never {
  if (typeof window !== "undefined") {
    window.location.replace(href);
  }
  throw new Error(`Redirected to ${href}`);
}

export function useSelectedLayoutSegments() {
  const pathname = usePathname();
  return useCallback(() => pathname.split("/").filter(Boolean), [pathname]);
}

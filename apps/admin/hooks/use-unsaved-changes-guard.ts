"use client";

import { useRouter } from "next/navigation";
import { type RefObject, useEffect, useState } from "react";

interface UseUnsavedChangesGuardReturn {
  showDialog: boolean;
  navigateTo: (href: string) => void;
  confirmExit: () => void;
  cancelExit: () => void;
  bypassNextNavigation: () => void;
}

/**
 * Guards against accidental navigation when there are unsaved changes.
 *
 * Accepts a RefObject<boolean> instead of a plain boolean to avoid React
 * render-timing issues. The ref must be updated synchronously (e.g. via the
 * native form onChange event) so the guard always has the latest dirty state
 * before any navigation event fires.
 *
 * Usage in the form component:
 *   const isDirtyRef = useRef(false);
 *   <form onChange={() => { isDirtyRef.current = true; }}>
 *   const guard = useUnsavedChangesGuard(isDirtyRef);
 *
 * - beforeunload  : browser close / refresh / external navigation
 * - click capture : intercepts <Link> / <a href> clicks before Next.js router
 *                   (Next.js 15+ uses Navigation API, not pushState, so
 *                    pushState-patching is bypassed — click capture is reliable)
 * - popstate      : browser Back / Forward button
 * - navigateTo()  : use on cancel / back buttons instead of <Link>
 * - bypassNextNavigation(): call before router.push() after a successful save
 */
export function useUnsavedChangesGuard(
  isDirtyRef: RefObject<boolean>,
): UseUnsavedChangesGuardReturn {
  const router = useRouter();
  const [showDialog, setShowDialog] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  // Block browser close / refresh (native beforeunload dialog)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirtyRef]);

  // Intercept in-app link clicks in capture phase — fires before Next.js router
  // and before the Navigation API handler, making it version-agnostic.
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;

      const anchor = (e.target as Element).closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href") ?? "";
      // Pass through: external, protocol-relative, hash-only
      if (!href || href.startsWith("http") || href.startsWith("//") || href.startsWith("#")) return;

      // Pass through: same-page (e.g. query/hash changes only)
      const targetPathname = href.split("?")[0].split("#")[0];
      if (!targetPathname || targetPathname === window.location.pathname) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      setPendingHref(href);
      setShowDialog(true);
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [isDirtyRef]);

  // Handle browser Back/Forward button
  useEffect(() => {
    const handlePopState = () => {
      if (!isDirtyRef.current) return;
      // Re-push current URL so the address bar doesn't change visually
      window.history.pushState(null, "", window.location.href);
      setPendingHref("back");
      setShowDialog(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isDirtyRef]);

  const navigateTo = (href: string) => {
    if (isDirtyRef.current) {
      setPendingHref(href);
      setShowDialog(true);
    } else {
      router.push(href);
    }
  };

  const confirmExit = () => {
    isDirtyRef.current = false;
    setShowDialog(false);
    const href = pendingHref;
    setPendingHref(null);
    if (href === "back") {
      router.back();
    } else if (href) {
      router.push(href);
    }
  };

  const cancelExit = () => {
    setShowDialog(false);
    setPendingHref(null);
  };

  // Call immediately before router.push() after a successful form save
  const bypassNextNavigation = () => {
    isDirtyRef.current = false;
  };

  return { showDialog, navigateTo, confirmExit, cancelExit, bypassNextNavigation };
}

/**
 * Fullscreen for the run viewport: native Fullscreen API when available, an
 * in-app fixed overlay ("immersive") when it is not (or the request is
 * denied). Fullscreen is left when the live run ends.
 */

import { useEffect, useRef, useState } from "react";

export function useViewportFullscreen(live: boolean) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const expanded = nativeFullscreen || immersive;

  useEffect(() => {
    const onChange = () =>
      setNativeFullscreen(
        document.fullscreenElement != null &&
          document.fullscreenElement === viewportRef.current,
      );
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (!immersive) {
      return;
    }
    // Native fullscreen exits on Esc by itself; the overlay needs a handler.
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setImmersive(false);
      }
    };
    window.addEventListener("keydown", onKey);
    // The overlay resizes the viewport without a window resize; nudge the
    // remaining window-resize listeners (the 3D canvas itself polls its
    // container size every frame and doesn't need it).
    window.dispatchEvent(new Event("resize"));
    return () => {
      window.removeEventListener("keydown", onKey);
      window.dispatchEvent(new Event("resize"));
    };
  }, [immersive]);

  // Leave fullscreen when the live run ends: native fullscreen's top layer
  // hides everything outside the viewport (toasts included), and the
  // completion UI lives outside it.
  useEffect(() => {
    if (live) {
      return;
    }
    setImmersive(false);
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
  }, [live]);

  const toggleFullscreen = () => {
    const element = viewportRef.current;
    if (!element) {
      return;
    }
    if (nativeFullscreen) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    if (immersive) {
      setImmersive(false);
      return;
    }
    if (typeof element.requestFullscreen === "function") {
      element.requestFullscreen().catch(() => setImmersive(true));
    } else {
      setImmersive(true);
    }
  };

  return { viewportRef, immersive, expanded, toggleFullscreen };
}

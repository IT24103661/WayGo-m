import { useEffect } from 'react';

export default function useMobileDrawerLock(isOpen) {
  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const isMobileViewport = window.matchMedia('(max-width: 1023px)').matches;
    if (!isMobileViewport || !isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    const originalOverscrollBehavior = document.body.style.overscrollBehavior;
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.overscrollBehavior = originalOverscrollBehavior;
    };
  }, [isOpen]);
}

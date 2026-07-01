import { useEffect, useState } from 'react';

/** Padding inferior cuando el teclado virtual reduce el viewport (móvil). */
export default function useKeyboardOffset(enabled = true) {
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || !window.visualViewport) {
      setKeyboardOffset(0);
      return undefined;
    }

    const update = () => {
      const viewport = window.visualViewport;
      const gap = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardOffset(gap > 40 ? gap : 0);
    };

    update();
    window.visualViewport.addEventListener('resize', update);
    window.visualViewport.addEventListener('scroll', update);
    return () => {
      window.visualViewport.removeEventListener('resize', update);
      window.visualViewport.removeEventListener('scroll', update);
    };
  }, [enabled]);

  return keyboardOffset;
}

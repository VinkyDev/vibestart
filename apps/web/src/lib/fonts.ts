import type { RefObject } from "react";
import { useEffect, useState } from "react";

const patience = 1000;

/**
 * True once the faces an element's text is set in have loaded, or once waiting for them has taken too
 * long. The display faces swap in as they load, so an entrance that starts before them rises in a fallback
 * and then changes face.
 * Only the slices the text itself falls in are awaited.
 */
export const useFontsReady = (ref: RefObject<HTMLElement | null>) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = ref.current;
    let settled = false;
    const settle = () => {
      if (!settled) {
        settled = true;
        setReady(true);
      }
    };
    const timer = setTimeout(settle, patience);
    const load = async (target: HTMLElement) => {
      const style = getComputedStyle(target);
      // A face that fails to load is waited for no longer than one that loads.
      await Promise.allSettled([
        document.fonts.load(
          `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`,
          target.textContent
        ),
      ]);
      settle();
    };
    if (element === null) {
      settle();
    } else {
      void load(element);
    }
    return () => {
      settled = true;
      clearTimeout(timer);
    };
  }, [ref]);

  return ready;
};

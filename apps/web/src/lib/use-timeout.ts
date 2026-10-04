import { useEffect, useEffectEvent } from "react";

export const useTimeout = (callback: () => void, delay: number | undefined) => {
  const onTimeout = useEffectEvent(callback);

  useEffect(() => {
    const timer =
      delay === undefined ? undefined : setTimeout(onTimeout, delay);
    return () => {
      clearTimeout(timer);
    };
  }, [delay]);
};

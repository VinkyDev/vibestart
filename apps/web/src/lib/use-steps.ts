import { useEffect, useState } from "react";

interface Pace {
  readonly count: number;
  readonly first: number;
  readonly next?: number;
  readonly from?: number;
}

export const useSteps = ({ count, first, from = 0, next = first }: Pace) => {
  const [step, setStep] = useState(from);
  const running = step < count;
  const wait = step === 0 ? first : next;

  useEffect(() => {
    const timer = running
      ? setTimeout(() => {
          setStep(step + 1);
        }, wait)
      : undefined;
    return () => {
      clearTimeout(timer);
    };
  }, [running, step, wait]);

  const replay = () => {
    setStep(0);
  };
  return [step, replay] as const;
};

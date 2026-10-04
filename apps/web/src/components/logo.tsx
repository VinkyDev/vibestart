import { useId } from "react";

export const strokes = {
  back: "M9.5 7.5 16 24.5",
  front: "M22.5 7.5 16 24.5",
} as const;
export const strokeWidth = 6.5;
export const backInk = 0.42;

/**
 * What the back stroke is clipped to: a square far wider than the mark, less the front stroke widened by
 * a gap of 1.55 on each side. The gap parts the layers and shows whatever lies beneath the mark.
 */
export const clearing =
  "M-64-64H96V96H-64Z M18.02 5.79 11.52 22.79A4.8 4.8 0 0 0 20.48 26.21L26.98 9.21A4.8 4.8 0 0 0 18.02 5.79Z";

export const Logo = ({ className }: { readonly className?: string }) => {
  const clip = useId();
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 32 32"
    >
      <clipPath id={clip}>
        <path clipRule="evenodd" d={clearing} />
      </clipPath>
      <path
        clipPath={`url(#${clip})`}
        d={strokes.back}
        strokeOpacity={backInk}
      />
      <path d={strokes.front} />
    </svg>
  );
};

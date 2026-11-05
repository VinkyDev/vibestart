/** A field of dots that fades out toward the edges, behind the stack. */
export const DotGrid = () => (
  <svg
    aria-hidden="true"
    className="absolute inset-0 -z-10 size-full mask-radial-from-20% mask-radial-to-70%"
  >
    <defs>
      <pattern
        height="20"
        id="dot-grid-pattern"
        patternUnits="userSpaceOnUse"
        width="20"
      >
        <circle className="fill-foreground/20" cx="2" cy="2" r="1" />
      </pattern>
    </defs>
    <rect fill="url(#dot-grid-pattern)" height="100%" width="100%" />
  </svg>
);

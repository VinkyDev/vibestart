import { CopyGlyph, useCopy } from "#/components/copy.tsx";
import { m } from "#/paraglide/messages.js";

export const CopyCommand = ({ command }: { readonly command: string }) => {
  const { copied, copy } = useCopy();

  return (
    <button
      aria-label={`${m.copy_command()}: ${command}`}
      className="bg-card text-snippet shadow-rest hover:shadow-lift focus-visible:ring-foreground/30 group transition-surface flex h-11 items-center gap-3 rounded-full pr-3 pl-5 font-mono outline-none focus-visible:ring-2 active:scale-97"
      onClick={() => {
        void copy(command);
      }}
      type="button"
    >
      <span className="text-muted-foreground/50 select-none">$</span>
      <span>{command}</span>
      <span className="text-muted-foreground group-hover:text-foreground grid size-6 place-items-center transition-colors">
        <CopyGlyph copied={copied} />
      </span>
    </button>
  );
};

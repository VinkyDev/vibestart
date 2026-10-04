import { registry } from "virtual:vibestart";

import type { Kind } from "@vibestart/core";

import { kindLabel } from "#/lib/i18n.ts";
import { none, optionsOf } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";

const Value = ({ children }: { readonly children: string }) => (
  <code className="bg-foreground/[0.05] rounded-md px-1.5 py-0.5 font-mono text-xs">
    {children}
  </code>
);

const defaultOf = (kind: Kind) => {
  if (kind.default === undefined) {
    return (
      <span className="text-muted-foreground">{m.viz_kind_follows()}</span>
    );
  }
  return <Value>{kind.default ?? none}</Value>;
};

export const KindOptions = () => (
  <div className="bg-card shadow-rest my-6 overflow-x-auto rounded-xl">
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="text-muted-foreground border-border border-b text-xs">
          <th className="px-4 py-2.5 font-medium">{m.viz_kind_flag()}</th>
          <th className="px-4 py-2.5 font-medium">{m.viz_kind_options()}</th>
          <th className="px-4 py-2.5 font-medium">{m.viz_kind_default()}</th>
        </tr>
      </thead>
      <tbody className="divide-border divide-y">
        {registry.kinds.map((kind) => (
          <tr className="align-top" key={kind.id}>
            <th
              className="px-4 py-2.5 text-left font-normal whitespace-nowrap"
              scope="row"
            >
              <code className="text-snippet block font-mono">--{kind.id}</code>
              <span className="text-muted-foreground block text-xs">
                {kindLabel(kind.id)}
              </span>
            </th>
            <td className="px-4 py-2.5">
              <span className="flex flex-wrap gap-1.5">
                {optionsOf(kind.id).map((option) => (
                  <Value key={option?.id ?? none}>{option?.id ?? none}</Value>
                ))}
              </span>
            </td>
            <td className="px-4 py-2.5 whitespace-nowrap">{defaultOf(kind)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

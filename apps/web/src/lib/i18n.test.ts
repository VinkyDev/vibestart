import { registry } from "virtual:vibestart";
import { beforeAll, describe, expect, it } from "vite-plus/test";

import { maxProjectNameLength, projectNameError } from "@vibestart/core";

import {
  addonDescription,
  capabilityText,
  integrationDescription,
  kindLabel,
} from "#/lib/i18n.ts";
import { fitOf } from "#/lib/roles.ts";
import { isDecision, optionsOf } from "#/lib/stack.ts";
import { m } from "#/paraglide/messages.js";
import { overwriteGetLocale } from "#/paraglide/runtime.js";

import en from "../../messages/en.json" with { type: "json" };
import zh from "../../messages/zh.json" with { type: "json" };

describe("messages", () => {
  // English messages restate what the generator says in English, so each must match it word for word.
  beforeAll(() => {
    overwriteGetLocale(() => "en");
  });

  it("translates every English message into Chinese", () => {
    expect(Object.keys(zh).toSorted()).toStrictEqual(
      Object.keys(en).toSorted()
    );
  });

  it("describes every integration as the registry does", () => {
    for (const integration of registry.integrations) {
      expect(integrationDescription(integration)).toBe(integration.description);
    }
  });

  it("describes every add-on as the registry does", () => {
    for (const addon of registry.addons) {
      expect(addonDescription(addon)).toBe(addon.description);
    }
  });

  it("phrases every capability as the registry does", () => {
    for (const [id, phrase] of Object.entries(registry.capabilities)) {
      expect(capabilityText(id)).toBe(phrase);
    }
  });

  it("names every kind as the registry does", () => {
    for (const kind of registry.kinds) {
      expect(kindLabel(kind.id)).toBe(kind.name);
    }
  });

  it("says when to pick every option of every decision", () => {
    const fits = registry.kinds
      .map(({ id }) => id)
      .filter((kind) => isDecision(kind))
      .flatMap((kind) =>
        optionsOf(kind).map((option) => fitOf(kind, option?.id ?? null))
      );
    expect(fits).not.toContain("");
  });

  it("words an invalid project name as Core does", () => {
    const name = "My App";
    expect(m.project_name_invalid({ max: maxProjectNameLength, name })).toBe(
      projectNameError(name)
    );
  });
});

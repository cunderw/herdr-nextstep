// What the menus hold: the main menu's items and each submenu's, built
// from Herdr's live model and commands. Items: { label, sub, run: [command,
// args], bind (the keys.json action that shows as its key), status, disabled }.

import { focused, layouts, keys, shared, window as appWindow } from "herdr";
import { spaces, agents } from "./data.js";

/** The main menu, top to bottom, as NeXT's: submenus first, Hide and Quit last. */
export function mainItems() {
  const mac = appWindow()?.platform === "macos";
  return [
    { label: "Info", sub: "info" },
    { label: "Space", sub: "space" },
    { label: "Tab", sub: "tab" },
    { label: "Pane", sub: "pane" },
    { label: "Agents", sub: "agents" },
    { label: "Layouts", sub: "layouts" },
    { label: "Find", run: ["terminal.search", {}], bind: "terminal.search" },
    { label: "Commands", run: ["app.palette", {}], bind: "app.palette" },
    mac ? { label: "Hide", run: ["app.hide", {}], bind: "app.hide" } : { label: "Miniaturize", run: ["window.minimize", {}] },
    mac ? { label: "Quit", run: ["app.quit", {}], bind: "app.quit" } : { label: "Close", run: ["window.close", {}] },
  ];
}

export const TITLES = { info: "Info", space: "Space", tab: "Tab", pane: "Pane", agents: "Agents", layouts: "Layouts" };

/** A submenu's items. `target`: the space or tab a right-click chose, else the shown one. */
export function subItems(kind, target) {
  const f = { ...(focused() ?? {}) };
  if (target && kind === "space") f.space = target;
  if (target && kind === "tab") f.tab = target;
  switch (kind) {
    case "info":
      return [
        { label: "Settings...", run: ["app.settings", {}], bind: "app.settings" },
        { label: "Help", run: ["app.help", {}], bind: "app.help" },
        { label: "What's New", run: ["app.whats_new", {}] },
        { label: "Check for Updates", run: ["app.check_updates", {}] },
      ];
    case "space":
      return [
        { label: "New", run: ["space.new", {}], bind: "space.new" },
        { label: "Rename...", run: ["space.rename", { id: f.space }], bind: "space.rename" },
        { label: "Next", run: ["space.next", {}], bind: "space.next" },
        { label: "Previous", run: ["space.prev", {}], bind: "space.prev" },
        { label: "Close", run: ["space.close", { id: f.space }], bind: "space.close" },
      ];
    case "tab":
      return [
        { label: "New", run: ["tab.new", {}], bind: "tab.new" },
        { label: "Rename...", run: ["tab.rename", { id: f.tab }], bind: "tab.rename" },
        { label: "Next", run: ["tab.next", {}], bind: "tab.next" },
        { label: "Previous", run: ["tab.prev", {}], bind: "tab.prev" },
        { label: "Miniaturize", run: ["tab.settle", { id: f.tab }], bind: "tab.settle" },
        { label: "Close", run: ["tab.close", { id: f.tab }], bind: "tab.close" },
      ];
    case "pane": {
      const none = !f.pane;
      return [
        { label: "Split Right", run: ["pane.split", { direction: "right" }], bind: "pane.split:right", disabled: none },
        { label: "Split Down", run: ["pane.split", { direction: "down" }], bind: "pane.split:down", disabled: none },
        { label: "Zoom", run: ["pane.zoom", {}], bind: "pane.zoom", disabled: none },
        { label: "Close", run: ["pane.close", {}], bind: "pane.close", disabled: none },
      ];
    }
    case "agents": {
      const list = agents().map((a) => ({
        label: agentName(a, true),
        status: a.status,
        on: a.focused,
        run: ["agent.focus", { terminal: a.address }],
      }));
      return [
        { label: "Next Agent", run: ["agent.next", {}], bind: "agent.next", disabled: !list.length },
        { label: "Previous Agent", run: ["agent.prev", {}], bind: "agent.prev", disabled: !list.length },
        ...list,
      ];
    }
    case "layouts": {
      const shown = shared("layout");
      return layouts().map((name) => ({ label: name, on: name === shown, run: ["layout.switch", { name }] }));
    }
  }
  return [];
}

/** How an agent is called: its space's name; `long` adds its tab's (the Agents submenu). */
export function agentName(a, long = false) {
  if (!long) return a.space_name;
  const s = spaces().find((x) => x.id === a.space);
  const t = s?.tabs.find((x) => x.id === a.tab);
  return `${a.space_name} \u203a ${t?.named ? t.name : "Tab " + (t?.name ?? a.tab_index)}`;
}

/**
 * The key equivalent NeXT showed at a menu item's right: the letter of a
 * Cmd binding (Cmd-Shift shows it upper case). Other chords show nothing.
 */
export function keyFor(bind) {
  if (!bind) return null;
  let all;
  try {
    all = keys() ?? [];
  } catch {
    return null;
  }
  for (const k of all) {
    if (k.action !== bind || !(k.section === "global" || k.section === "layout:nextstep")) continue;
    const m = /^cmd-(shift-)?([^-]|[a-z0-9,./\[\]=;'])$/.exec(k.keys ?? "");
    if (m) return m[1] ? m[2].toUpperCase() : m[2];
  }
  return null;
}

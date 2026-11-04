// A pane's title bar (the layout's pane header), as a NeXT window's: black
// with a white title for the pane that has the keyboard, gray for the rest.
// Miniaturize (left) puts the tab away to its miniwindow; close (right)
// closes the pane. Click focuses, double-click zooms.

import { div } from "gpui-kit";
import { props, run, home } from "herdr";
import { C, root, titleBar, barButton, light, tilde } from "./kit.js";
import { panes } from "./data.js";

export function paneTitle(p) {
  if (!p) return "";
  if (p.mod) return p.title || p.mod;
  const prog = p.program;
  const where = tilde(p.cwd, home());
  const name = prog && !prog.shell ? prog.name : (p.title ?? "").trim() || prog?.name || "Terminal";
  return where ? `${name}  —  ${where}` : name;
}

export default class PaneWindow {
  init() {}

  render() {
    const id = props()?.pane;
    const p = panes().find((x) => x.pane === id);
    if (!p) return root(div().size_full().bg(C.face));
    return root(div().size_full().flex().flex_col().bg(C.dark)).child(
      titleBar({
        id: `ns-pw-${id}`,
        key: Boolean(p.focused),
        title: paneTitle(p),
        h: 22,
        lead: light(p.status, 8),
        left: barButton(`ns-pw-min-${id}`, "miniaturize", () => run("tab.settle", { id: p.tab }), "Miniaturize"),
        right: barButton(`ns-pw-close-${id}`, "close", () => run("pane.close", { pane: id }), "Close"),
        onClick: (e) => (e.click_count >= 2 ? run("pane.zoom", { pane: id }) : run("pane.focus", { pane: id })),
      }),
    );
  }
}

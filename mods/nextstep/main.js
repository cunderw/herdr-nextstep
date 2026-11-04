// Herdr NeXTSTEP: the whole layout is this one mod, in roles. The layout
// and overlays give each copy props { role }:
//   menu     the left of the workspace: the main menu and the tabs' miniwindows
//   submenu  a submenu beside its menu item (a popup)
//   dock     the Dock down the right edge: spaces, agents, the clock
//   window   a pane's title bar (the layout's pane header)

import { View, div } from "gpui-kit";
import { props } from "herdr";
import { MenuColumn, Submenu } from "./menu.js";
import Dock from "./dock.js";
import PaneWindow from "./window.js";

const ROLES = { menu: MenuColumn, submenu: Submenu, dock: Dock, window: PaneWindow };

export default class NeXTSTEP extends View {
  init(p, cx) {
    const pr = props() ?? p ?? {};
    const R = ROLES[pr.role];
    this.role = R ? new R() : null;
    this.role?.init?.(pr, cx);
  }

  async close(cx) {
    await this.role?.close?.(cx);
  }

  render(cx) {
    if (!this.role) return div().p(8).child(`nextstep: no role "${props()?.role ?? ""}"`);
    return this.role.render(cx);
  }
}

// The left of the workspace: the main menu at the top (NeXT's vertical
// menu, here Herdr's commands) and the shown space's tabs as miniwindows at
// the bottom. A submenu opens beside its item as a popup (role "submenu").

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { props, run, shared, setShared, openOverlay, closeOverlay, window as appWindow } from "herdr";
import { C, root, titleBar, cell, tile, light, barButton, programIcon, art, hair } from "./kit.js";
import { mainItems, subItems, keyFor, TITLES } from "./menus.js";
import { spaces, panes } from "./data.js";

export const MENU_W = 136;
const ROW = 22;
const TITLE = 23;

/** The submenu that's open: { kind, id } (shared, since every copy is its own realm). */
function openSub() {
  return shared("nextstep.sub") ?? null;
}

function subWidth(items) {
  const longest = items.reduce((n, it) => Math.max(n, String(it.label ?? "").length + (keyFor(it.bind) ? 3 : 0)), 0);
  return Math.min(260, Math.max(128, Math.round(longest * 7 + 44)));
}

/** Opens a submenu: beside `bounds` (the item that asked), else at the pointer. */
export function openSubmenu(kind, bounds, target) {
  const was = openSub();
  if (was) closeOverlay(was.id);
  const items = subItems(kind, target);
  const id = openOverlay({
    mod: "nextstep",
    kind: "popup",
    frame: "none",
    width: subWidth(items),
    height: TITLE + items.length * ROW + 2,
    ...(bounds ? { at: { x: bounds.x + bounds.width, y: bounds.y } } : {}),
    props: { role: "submenu", kind, target: target ?? null },
  });
  setShared("nextstep.sub", { kind, id, target: target ?? null });
  return id;
}

export class Submenu {
  init() {}

  choose(it) {
    if (!it || it.disabled || !it.run) return;
    closeOverlay(props().overlay);
    run(it.run[0], it.run[1] ?? {});
  }

  async close() {
    const s = openSub();
    if (s && s.id === props()?.overlay) setShared("nextstep.sub", null);
  }

  render() {
    const p = props() ?? {};
    const items = subItems(p.kind, p.target);
    return root(v_flex().id("ns-sub").size_full().bg(C.face).border(hair()).border_color(C.dark))
      .child(titleBar({ id: "ns-sub-title", title: TITLES[p.kind] ?? "" }))
      .children(
        items.map((it, i) =>
          cell({
            id: `ns-sub-${i}`,
            label: it.label,
            key: keyFor(it.bind),
            on: it.on,
            disabled: it.disabled,
            lead: it.status !== undefined ? div().w(9).flex().items_center().justify_center().child(light(it.status, 8) ?? div()) : null,
            onClick: () => this.choose(it),
          }),
        ),
      );
  }
}

export class MenuColumn {
  init() {}

  /** The strip the macOS window buttons sit in; elsewhere NeXT's own two buttons. */
  strip() {
    const w = appWindow();
    const mac = !w || w.platform === "macos";
    const el = h_flex().flex_none().h(30).w_full().items_center().px(8).gap(4);
    if (mac || !w.buttons) return el;
    return el
      .child(barButton("ns-win-min", "miniaturize", () => run("window.minimize", {}), "Miniaturize"))
      .child(div().flex_1())
      .child(barButton("ns-win-close", "close", () => run("window.close", {}), "Close"));
  }

  menu() {
    const open = openSub();
    return v_flex()
      .flex_none()
      .w(MENU_W)
      .border(hair())
      .border_color(C.dark)
      .child(titleBar({ id: "ns-menu-title", title: "Herdr" }))
      .children(
        mainItems().map((it, i) =>
          cell({
            id: `ns-menu-${i}`,
            label: it.label,
            sub: Boolean(it.sub),
            key: keyFor(it.bind),
            on: Boolean(it.sub) && open?.kind === it.sub && !open?.target,
            onDown: (e) => {
              if (!it.sub) return;
              if (open?.kind === it.sub && !open?.target) {
                closeOverlay(open.id);
                setShared("nextstep.sub", null);
              } else openSubmenu(it.sub, e.bounds);
            },
            onClick: it.run ? () => run(it.run[0], it.run[1] ?? {}) : null,
          }),
        ),
      );
  }

  /** The shown space's tabs, as miniwindows from the bottom-left corner up. */
  miniwindows() {
    const s = spaces().find((x) => x.active);
    if (!s) return div();
    const all = panes();
    const tiles = s.tabs.map((t) => {
      const mine = all.filter((p) => p.tab === t.id);
      const pick = mine.find((p) => p.status) ?? mine.find((p) => p.focused) ?? mine[0];
      return tile(
        {
          id: `ns-tab-${t.id}`,
          title: t.named ? t.name : `Tab ${t.name}`,
          active: t.active,
          status: t.status,
          tooltip: `${t.named ? t.name : "Tab " + t.name}: ${t.panes} pane${t.panes === 1 ? "" : "s"}`,
          onClick: () => run("tab.select", { id: t.id }),
          onRight: () => openSubmenu("tab", null, t.id),
        },
        div()
          .relative()
          .child(pick?.mod ? art("terminal", 30) : programIcon(pick?.program, 30))
          .when(t.settled, (el) => el.opacity(0.45)),
      );
    });
    return h_flex().flex_none().w(MENU_W).flex_wrap().gap(4).children(tiles);
  }

  render() {
    return root(v_flex().id("ns-menu-col").size_full().pl(6).pb(6))
      .child(this.strip())
      .child(this.menu())
      .child(div().flex_1().min_h(8))
      .child(this.miniwindows());
  }
}

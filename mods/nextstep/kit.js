// The NeXTSTEP drawing kit: the palette, bevels, Dock tiles, title bars,
// status lights and the "..." of a tile that isn't running. Every role of
// the nextstep mod draws with these.

import { div, svg, image } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { settings } from "herdr";

export const C = {
  desk: "#4a4e5a", // the workspace behind everything
  face: "#aaaaaa", // panels, menus, tiles
  hi: "#ffffff", // bevel highlight, selection
  shadow: "#555555", // bevel shadow
  dark: "#000000", // outlines, the key window's title bar
  text: "#000000",
  white: "#ffffff",
  pressed: "#c8c8c8", // the shown space or tab
  screen: "#1d1d1f", // terminals
  working: "#f2b233",
  blocked: "#ef3b2d",
  done: "#3fcf52",
};

export const FONT = "Helvetica";
export const ASSETS = "mods/nextstep";

/** One device-crisp line at the person's zoom: 1 logical px. */
export function hair() {
  const z = Number(settings()?.zoom) || 1;
  return 1 / z;
}

/** Every role's root: Helvetica, black, 12 px. */
export function root(el) {
  return el.font_family(FONT).text_size(12).text_color(C.text);
}

/** Stops a press from reaching a window_drag block (the press is the control's). */
export function own(el) {
  return el.on_mouse_down("left", (_e, cx) => cx.stop_propagation());
}

// Bevels, outside in: [right+bottom color, top+left color].
const BEVEL = {
  raised: [[C.dark, C.hi], [C.shadow, C.face]],
  sunken: [[C.hi, C.shadow], [C.face, C.dark]],
  cell: [[C.shadow, C.hi]],
  flat: [],
};

/** Wraps `content` in a NeXT bevel. Size the result; the content fills it. */
export function bevel(kind, content, bg) {
  const h = hair();
  let inner = div().flex().flex_col().flex_1().min_w(0).min_h(0).relative();
  if (bg) inner = inner.bg(bg);
  let el = inner.child(content);
  const layers = BEVEL[kind] ?? [];
  for (let i = layers.length - 1; i >= 0; i--) {
    const [rb, tl] = layers[i];
    const a = div().flex().flex_col().flex_1().min_w(0).min_h(0).border_t(h).border_l(h).border_color(tl).child(el);
    let b = div().flex().flex_col().min_w(0).min_h(0).border_r(h).border_b(h).border_color(rb).child(a);
    if (i > 0) b = b.flex_1();
    el = b;
  }
  return layers.length ? el : div().flex().flex_col().child(inner);
}

/** A status light: amber pulsing while working, red blinking when blocked, green when done. */
export function light(status, size = 8) {
  const col = status === "working" ? C.working : status === "blocked" ? C.blocked : status === "done" ? C.done : null;
  if (!col) return null;
  let el = div()
    .flex_none()
    .relative()
    .w(size)
    .h(size)
    .rounded(size / 2)
    .bg(col)
    .border(hair())
    .border_color("#000000b0")
    .child(div().absolute().top(size * 0.18).left(size * 0.22).w(size * 0.32).h(size * 0.28).rounded(size).bg("#ffffffa0"));
  if (status === "working") el = el.loop("opacity", { from: 0.35, to: 1, period: 1400 });
  if (status === "blocked") el = el.loop("opacity", { from: 0.15, to: 1, period: 600 });
  return el;
}

/** The "..." NeXT drew under a Dock icon whose app wasn't running. */
export function ellipsis() {
  return h_flex()
    .flex_none()
    .gap(2)
    .children([0, 1, 2].map(() => div().w(2).h(2).bg(C.dark)));
}

/** The status corner of a tile: a light when something is going on, else "...". */
export function corner(status) {
  return light(status, 9) ?? ellipsis();
}

/** An icon from this mod: full color (art) or tinted with the text color (glyphs). */
export function art(name, w, h = w) {
  return image(`${ASSETS}/icons/${name}.svg`).flex_none().w(w).h(h);
}

export function glyph(name, w, h = w, color = C.text) {
  return svg(`${ASSETS}/icons/${name}.svg`).flex_none().w(w).h(h).text_color(color);
}

/** A program's icon from Herdr's table, at `size`, with the terminal art as fallback. */
export function programIcon(program, size) {
  if (!program?.icon || program.shell) return art("terminal", size);
  if (program.tint) {
    return div()
      .flex_none()
      .w(size)
      .h(size)
      .rounded(size * 0.18)
      .bg(program.tile ?? "#333333")
      .border(hair())
      .border_color(C.dark)
      .flex()
      .items_center()
      .justify_center()
      .child(svg(program.icon).w(size * 0.66).h(size * 0.66).text_color(program.color ?? C.white));
  }
  return image(program.icon).flex_none().w(size).h(size);
}

/**
 * A 64 px Dock tile (or miniwindow). o: { id, active, title (a miniwindow's
 * black strip), label, status, corner (false: none), onClick, onRight, tooltip }.
 */
export function tile(o, icon) {
  const size = o.size ?? 64;
  let body = v_flex()
    .size_full()
    .items_center()
    .relative()
    .when(Boolean(o.title), (el) =>
      el.child(
        div()
          .w_full()
          .h(11)
          .flex_none()
          .bg(C.dark)
          .px(2)
          .text_size(8.5)
          .font_weight(700)
          .text_color(C.white)
          .text_center()
          .truncate()
          .child(o.title),
      ),
    )
    .child(v_flex().flex_1().min_h(0).w_full().items_center().justify_center().child(icon))
    .when(o.label != null, (el) =>
      el.child(
        div()
          .w_full()
          .px(3)
          .mb(o.corner === false ? 4 : 12)
          .flex_none()
          .text_size(9.5)
          .line_height("11px")
          .text_center()
          .truncate()
          .when(Boolean(o.active), (d) => d.font_weight(700))
          .child(o.label),
      ),
    )
    .when(o.corner !== false, (el) => el.child(div().absolute().left(4).bottom(4).child(corner(o.status))));
  let t = bevel(o.active ? "sunken" : "raised", body, o.active ? C.pressed : C.face)
    .id(o.id)
    .flex_none()
    .w(size)
    .h(size);
  if (o.tooltip) t = t.tooltip(o.tooltip);
  t = t.on_mouse_down("left", (_e, cx) => cx.stop_propagation());
  if (o.onClick) t = t.on_click((e, cx) => o.onClick(e, cx));
  if (o.onRight)
    t = t.on_mouse_down("right", (e, cx) => {
      cx.stop_propagation();
      o.onRight(e, cx);
    });
  return t;
}

/** A small bevelled title-bar button (miniaturize, close), 15 px square. */
export function barButton(id, name, onClick, tooltip) {
  let b = bevel("raised", h_flex().size_full().items_center().justify_center().child(glyph(name, 9)), C.face)
    .id(id)
    .flex_none()
    .w(15)
    .h(15);
  if (tooltip) b = b.tooltip(tooltip);
  return b
    .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
    .on_click((e, cx) => {
      cx.stop_propagation();
      onClick(e, cx);
    });
}

/**
 * A NeXT title bar: black for the key window, gray otherwise, title
 * centred in Helvetica Bold. o: { id, title, key, left, right, lead, h, onClick }.
 */
export function titleBar(o) {
  const key = o.key !== false;
  const h = o.h ?? 23;
  const side = (el) => h_flex().flex_none().w(22).h_full().items_center().justify_center().when(Boolean(el), (d) => d.child(el));
  const bar = h_flex()
    .id(o.id)
    .flex_none()
    .w_full()
    .h(h)
    .items_center()
    .bg(key ? C.dark : C.face)
    .border_t(hair())
    .border_color(key ? "#3a3a3a" : C.hi)
    .child(side(o.left))
    .child(
      h_flex()
        .flex_1()
        .min_w(0)
        .h_full()
        .items_center()
        .justify_center()
        .gap(6)
        .when(Boolean(o.lead), (el) => el.child(o.lead))
        .child(
          div()
            .min_w(0)
            .truncate()
            .font_weight(700)
            .text_size(12.5)
            .text_color(key ? C.white : C.text)
            .child(o.title ?? ""),
        ),
    )
    .child(side(o.right));
  return o.onClick ? bar.on_click((e, cx) => o.onClick(e, cx)) : bar;
}

/** A menu cell: gray with a white top-left and dark bottom-right edge, white while open. */
export function cell(o) {
  const on = Boolean(o.on);
  const row = h_flex()
    .size_full()
    .items_center()
    .pl(5)
    .pr(4)
    .gap(4)
    .when(Boolean(o.lead), (el) => el.child(o.lead))
    .child(div().flex_1().min_w(0).truncate().text_color(o.disabled ? C.shadow : C.text).child(o.label))
    .when(Boolean(o.key), (el) => el.child(div().flex_none().text_color(o.disabled ? C.shadow : C.text).child(o.key)))
    .when(Boolean(o.sub), (el) => el.child(glyph("submenu", 6, 9)));
  let c = bevel("cell", row, on ? C.hi : C.face)
    .id(o.id)
    .flex_none()
    .w_full()
    .h(o.h ?? 22);
  c = c.on_mouse_down("left", (e, cx) => {
    cx.stop_propagation();
    o.onDown?.(e, cx);
  });
  if (o.onClick && !o.disabled) c = c.on_click((e, cx) => o.onClick(e, cx));
  return c;
}

/** "~/code/x" for a folder under home. */
export function tilde(path, homeDir) {
  if (!path) return "";
  if (homeDir && path === homeDir) return "~";
  if (homeDir && path.startsWith(homeDir + "/")) return "~" + path.slice(homeDir.length);
  return path;
}

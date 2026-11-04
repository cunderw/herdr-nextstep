// The Dock: a column of 64 px tiles down the right edge. Herdr's own tile
// on top, one tile per space, then one per agent, and the clock at the
// bottom. A tile with nothing running shows NeXT's "..."; a light shows
// working (amber, pulsing), blocked (red, blinking) or done (green).

import { div } from "gpui-kit";
import { h_flex, v_flex } from "gpui-base";
import { run, setAgentOrder } from "herdr";
import { C, root, tile, art, programIcon } from "./kit.js";
import { openSubmenu } from "./menu.js";
import { agentName } from "./menus.js";
import { spaces, agents } from "./data.js";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** A space's light: its most urgent agent's status; idle shows the "...". */
function spaceStatus(s) {
  return s.status === "idle" ? null : s.status;
}

export default class Dock {
  init(_p, cx) {
    // The clock is data, so a timer, and only as often as a minute changes.
    cx.timer.every(15000, (cx) => cx.notify());
  }

  clock() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const page = v_flex()
      .w(46)
      .h(48)
      .border(1)
      .border_color(C.dark)
      .bg("#f4f1e8")
      .items_center()
      .child(
        div()
          .w_full()
          .h(13)
          .flex_none()
          .bg("#111111")
          .text_center()
          .text_size(10)
          .line_height("13px")
          .font_family("Menlo")
          .text_color("#ff6a3d")
          .child(`${hh}:${mm}`),
      )
      .child(div().mt(1).text_size(8).line_height("9px").font_weight(700).text_color("#b0281e").child(DAYS[now.getDay()]))
      .child(div().text_size(16).line_height("16px").font_weight(700).child(String(now.getDate())))
      .child(div().text_size(8).line_height("9px").child(MONTHS[now.getMonth()]));
    return tile({ id: "ns-clock", corner: false, tooltip: now.toDateString() }, page);
  }

  render() {
    const all = spaces();
    const list = agents();
    setAgentOrder(list.map((a) => a.address));
    const spaceTiles = all.map((s) =>
      tile(
        {
          id: `ns-space-${s.id}`,
          label: s.name,
          active: s.active,
          status: spaceStatus(s),
          tooltip: `${s.name}${s.machine ? " on " + s.machine : ""}: ${s.tabs.length} tab${s.tabs.length === 1 ? "" : "s"}`,
          onClick: () => run("space.select", { id: s.id }),
          onRight: () => openSubmenu("space", null, s.id),
        },
        art(s.machine ? "remote" : "space", 40, 34),
      ),
    );
    const agentTiles = list.map((a) =>
      tile(
        {
          id: `ns-agent-${a.address}`,
          label: agentName(a),
          active: a.focused,
          status: a.status === "idle" ? null : a.status,
          tooltip: `${a.program?.name ?? "Agent"} in ${a.space_name}: ${a.status}`,
          onClick: () => run("agent.focus", { terminal: a.address }),
        },
        programIcon(a.program, 32),
      ),
    );
    const top = tile({ id: "ns-herdr", corner: false, tooltip: "Commands", onClick: () => run("app.palette", {}) }, art("herdr", 52));
    return root(v_flex().id("ns-dock").size_full().items_end())
      .child(top)
      .child(
        v_flex()
          .id("ns-dock-list")
          .flex_1()
          .min_h(0)
          .w_full()
          .items_end()
          .overflow_y_scroll()
          .children(spaceTiles)
          .when(agentTiles.length > 0, (el) => el.child(div().flex_none().h(6)))
          .children(agentTiles),
      )
      .child(this.clock());
  }
}

// Where the Dock, the menus and the miniwindows read Herdr's model. One
// seam, so every role lists the same spaces, tabs and agents.

import { spaces as hSpaces, agents as hAgents, panes as hPanes } from "herdr";

export const spaces = () => hSpaces();
export const agents = () => hAgents();
export const panes = () => hPanes();

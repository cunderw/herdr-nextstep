#!/usr/bin/env bash
# Copies the layout, its theme and the nextstep mod into Herdr's home. A
# symlinked mod folder loads its JavaScript but not its icons, so this copies
# instead; run it again after pulling.
set -euo pipefail
here=$(cd "$(dirname "$0")" && pwd)
home=${HERDR_APP_HOME:-$HOME/.config/herdr-app}
dest=$home/mods/nextstep
mkdir -p "$dest/icons" "$home/layouts" "$home/themes"
cp "$here"/mods/nextstep/*.js "$here"/mods/nextstep/mod.json "$dest"/
cp "$here"/mods/nextstep/icons/*.svg "$dest/icons/"
cp "$here"/layouts/nextstep.json "$home/layouts/nextstep.json"
cp "$here"/preview.png "$home/layouts/nextstep.png" 2>/dev/null || true
cp "$here"/themes/nextstep.json "$home/themes/nextstep.json"
herdr-app check "$dest"
echo "Installed. Switch to it with: herdr-app do layout.switch --name nextstep"

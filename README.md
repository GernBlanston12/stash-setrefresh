## Stash Set Refresh

Adds 🇪🇺 / 🇺🇸 buttons on 25 fps and 50 fps scenes in Stash.  
Clicking a button changes the monitor refresh rate, resolution, and Cinnamon UI scale.
Refresh rates, monitor/display channel, and UI scaling offered are user-configurable in plugin settings

## Current status
- Works when Stash runs on one machine and the display is on another (uses a small local listener).
- Linux + Cinnamon (xrandr + gsettings).
- Requires the listener script running on the machine that owns the monitor.

## Setup
1. Copy the plugin files into your Stash plugins folder.
2. Enable the plugin and fill in the settings (output, resolution, rates, endpoint URL).
3. On the machine with the monitor, run `stash-refresh-listener.py` (or install it as a user service).
4. Point the plugin’s Endpoint URL at `http://that-machine:8765/set`.

## Same-machine use
If Stash and the display are on the same box you can skip the listener and call the script directly via a plugin task. See the code for the earlier version that did this.

## Notes
Early / personal-use plugin. The listener approach exists because many people run Stash in Docker on a server while the monitor is on a desktop. PRs or ports to Windows/macOS welcome. stash-setrefresh
Stash plugin that adds refresh-rate switch buttons for 25/50 fps scenes

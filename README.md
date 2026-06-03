<p align="center">
  <a href="https://ztfr.eu/matrix">
    <img src="assets/community-badge.png" alt="Join Zeitfresser Matrix Community" height="70" />
  </a>
</p>

<h1 align="center">Simple Tiling</h1>
<h4 align="center">
A lightweight, opinionated, and automatic tiling window manager for GNOME Shell
</h4>

<h6 align="center">
  <a href="https://ztfr.eu">🏰 Website</a>
  ·
  <a href="https://ztfr.eu/matrix">📰 Zeitfresser Matrix Community</a>
  ·
  <a href="https://social.ztfr.eu/@dome">🐘 Mastodon</a>
  ·
  <a href="https://look.ztfr.eu/#/#support:ztfr.eu">💬 Supportchat</a>
</h6>
<br>

<img width="auto" height="auto" alt="Simple-Tiling-v6" src="https://github.com/user-attachments/assets/eb0f7cc3-6a5a-4036-8a1e-8f945c52e55c" />

## Introduction

Simple Tiling is a GNOME Shell extension for users who want a clean, predictable, and automatic tiling layout without the complexity of larger, more feature-heavy tiling extensions. It is designed to be simple to configure and intuitive to use, focusing on a core set of essential tiling features.

The extension supports **GNOME Shell 3.38 through 49** across four dedicated builds and runs on both **X11 and Wayland**.

## Features

* **Automatic Tiling:** Windows are automatically arranged into a master and stack layout without any manual intervention.
* **Master & Fibonacci Stack Layout:** The first window becomes the "master," occupying the left portion of the screen. All subsequent windows form a "stack" on the right, tiled using a space-efficient Fibonacci-style algorithm.
* **Configurable Master Window Ratio:** Set the master window width anywhere between 20 % and 80 % of the work area directly from the preferences window.
* **Multi-Monitor Support:** Each connected monitor maintains its own independent master/stack layout. Windows stay on their respective monitors without interference.
* **Monocle Mode:** Switch to a full-screen single-window layout at any time with a keyboard shortcut. Cycle through all tiled windows using the next/previous monocle shortcuts without changing the tile order.
* **Toggle Tiling:** Enable or disable the entire tiling system on the fly with an assignable keyboard shortcut — without disabling the extension. Re-enabling rescans all open windows and restores the layout automatically.
* **Float Window:** Temporarily remove any window from the tiling layout with a keyboard shortcut. The window can then be positioned freely. Press the shortcut again to snap it back into the layout.
* **Configurable New Window Behavior:** Choose whether new windows open as the new master or are appended to the stack.
* **Interactive Window Swapping:**
    * **Drag & Drop:** Swap any two windows by dragging one over the other.
    * **Keyboard Shortcuts:** Swap the focused window with the master or with its nearest neighbor in any direction (left, right, up, down).
* **Interactive Window Focus Switcher:** Move focus between windows with customizable keyboard shortcuts in all four directions.
* **Exceptions Management:** Exclude specific applications from tiling directly from the preferences window — no file editing required. Exceptions are stored persistently in GSettings and survive extension updates. Excluded windows are automatically centered and kept above all other windows.
* **Smart Pop-up Handling:** Dialogs, overlay windows, and applications that set the skip-taskbar flag are automatically excluded from tiling.
* **Simple Settings Panel:** Adjust keybindings, window gaps, master ratio, new window behavior, and exceptions from the GNOME Extensions preferences window.

## Requirements

* **GNOME Shell Version:** **3.38 – 49**
* **Session Type:** **X11 and Wayland** (fully supported)
* **Monitor Setup:** Single and multi-monitor setups supported.

## Installation

#### Recommended

Use the [GNOME Shell Extensions website](https://extensions.gnome.org/extension/8345/simple-tiling/) to install and enable the latest version.

#### Manual Installation

The repository includes a Makefile that produces ready-to-install ZIP packages for the four supported GNOME Shell lines.

1. **Clone the source**
   ```bash
   git clone https://github.com/Domoel/Simple-Tiling.git
   cd Simple-Tiling
   ```

2. **Install the package that matches your GNOME Shell version**

   ```bash
   make install-legacy        # GNOME Shell 3.38
   make install-enterprise    # GNOME Shell 40
   make install-interim       # GNOME Shell 41 – 44
   make install-modern        # GNOME Shell 45+
   ```

   To build ZIP archives without installing, run `make build` (all versions) or `make build-legacy` / `make build-enterprise` / `make build-interim` / `make build-modern` individually. Place the extracted archive in `~/.local/share/gnome-shell/extensions/` to install manually.

3. **Reload the shell**
   ```
   Press Alt + F2, type r, hit Enter   (X11)
   Log out and back in                  (Wayland)
   ```

4. **Clean up (optional)**
   ```bash
   make clean
   ```

## Configuration

#### Keyboard Shortcuts

All keyboard shortcuts are configured in GNOME Settings:

1. Open **Settings → Keyboard → View and Customize Shortcuts**.
2. Scroll to the **Custom Shortcuts** section.
3. All Simple Tiling shortcuts are listed there.

| Action | Default |
|---|---|
| Swap with master | `Super + Return` |
| Swap left / right / up / down | `Super + ←/→/↑/↓` |
| Focus left / right / up / down | `Alt + ←/→/↑/↓` |
| Toggle tiling | *(unset)* |
| Float / unfloat focused window | *(unset)* |
| Toggle monocle mode | *(unset)* |
| Monocle: next window | *(unset)* |
| Monocle: previous window | *(unset)* |

#### Exceptions

Applications excluded from tiling are managed directly in the Simple Tiling preferences window — no file editing required.

* Open the extension preferences and navigate to the **Exceptions** section.
* Enter the application's `WM_CLASS` (X11) or `App ID` (Wayland) and click the add button.
* Remove any entry with the delete button next to it.
* The check is case-insensitive. Exceptions are stored in GSettings and survive extension updates.

To find an application's `WM_CLASS`, run `xprop WM_CLASS` in a terminal and click the window. To find the `App ID` on Wayland, press `Alt + F2`, type `lg`, open the **Windows** tab, and click the target window.

Excluded applications are centered on screen and kept above all other windows.

#### Window Gaps

Inner gap (between windows) and outer gaps (horizontal and vertical screen edges) are adjustable in the preferences window.

#### Master Window Ratio

The master window width defaults to 50 % of the work area. Adjust it between 20 % and 80 % in the preferences window under **Window Behavior**.

#### Tiling Window Delays

If you experience race conditions between Mutter and the extension, the tiling delay constants (`TILING_DELAY_MS`, `CENTERING_DELAY_MS`) can be adjusted at the top of `extension.js` after installation.

## Development & Support

If you need support or want to participate in the development of this extension, join the <a href="https://ztfr.eu/matrix">Zeitfresser Matrix Community</a> or the <a href="https://look.ztfr.eu/#/#support:ztfr.eu">Development & Support Channel</a> on Matrix.

## License

This project is licensed under the MIT License — see the `LICENSE` file for details.

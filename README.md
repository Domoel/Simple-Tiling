
<h1 align="center">
Simple Tiling 
</span>
<h4 align="center">
<span style="display:inline-flex; align-items:center; gap:12px;">
A lightweight, opinionated, and automatic tiling window manager for GNOME Shell
</span>
<p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<img width="2560" height="1440" alt="Simple-Tiling-v6" src="https://github.com/user-attachments/assets/eb0f7cc3-6a5a-4036-8a1e-8f945c52e55c" />

## Introduction

Simple Tiling is a GNOME Shell extension created for users who want a clean, predictable, and automatic tiling layout without the complexity of larger, more feature-heavy tiling extensions. It is designed to be simple to configure and intuitive to use, focusing on a core set of essential tiling features.

This extension was built from the ground up to be stable and performant on **GNOME Shell 3.38**. However it is now also supporting modern gnome shells up to **version 49**.

## Features

* **Automatic Tiling:** Windows are automatically arranged into a master and stack layout without any manual intervention.
* **Master & Fibonacci Stack Layout:** The first window becomes the "master," occupying the left half of the screen. All subsequent windows form a "stack" on the right half, which is tiled using a space-efficient Fibonacci-style algorithm.
* **Configurable New Window Behavior:** Choose whether new windows open as the new master or are appended to the end of the stack.
* **Tiling Lock:** The layout is strict by default. If you manually move a window with the mouse and drop it in an empty space, it will automatically "snap back" to its designated tile position, preserving the integrity of the layout.
* **Interactive Window Swapping:**
    * **Drag & Drop:** Swap any two windows by simply dragging one and dropping it over the other.
    * **Keyboard Shortcuts:** A full set of keyboard shortcuts allows you to swap the focused window with the master or with its nearest neighbor in any direction (left, right, up, down).
* **Interactive Window Focus Switcher:** Change the current window focus with a set of customizable keyboard shortcuts in every direction (left, right, up, down).
* **Simple Settings Panel:** A simple settings panel within the gnome extension manager menu to adjust key bindings, window gaps / margins and window behavior.
* **External Exception List:** Use a simple `exceptions.txt` file to list applications (by their `WM_CLASS`) that should be ignored by the tiling manager.
* **Smart Pop-up Handling:** Windows on the exception list, as well as dialogs and other pop-ups, are automatically centered and kept "always on top" for a smooth workflow.
* **Configurable Tiling Window Delays:** Easily configure the tiling window delays if you have race condition issues by editing variables directly in the `extension.js`.

## Requirements

Please note that this extension has been developed for a very specific environment. However, with the latest updates, I have ensured that modern Gnome Shells and Wayland are also supported.

* **GNOME Shell Version:** **3.38 - 49**
* **Session Type:** **X11** (Wayland is still in beta but should be fine!).
* **Monitor Setup:** **Single monitor only.** Multi-monitor support is not yet implemented.

## Installation

#### Recommended:

Use the [GNOME Shell Extensions website](https://extensions.gnome.org/extension/8345/simple-tiling/) to install and enable the latest version.

#### Manual Installation

The repository includes a Makefile that produces ready‑to‑install ZIP packages for the three supported Gnome‑Shell lines (a legacy build for Gnome-Shell 3.38, an interim build for Gnome-Shell 40 - 44 and a modern build for Gnome-Shell 45+).

1. **Clone the Source**
   ```bash
   git clone https://github.com/Domoel/Simple-Tiling.git
   cd Simple-Tiling
   ```

2. **Install the package that matches your GNOME-Shell version**

   Open the Terminal within the Simple-Tiling directory and run
   ```bash
   make install-legacy        # Installs Legacy Extension (Gnome-Shell 3.38)
   make install-interim       # Installs Interim Extension (Gnome-Shell 40 - 44)
   make install-modern        # Installs Modern Extension (Gnome-Shell 45+)
   ```
   **Note:** This command will directly install the extension in the choosen variant (legacy, interim or modern). If you want to manually create and upload the extension to your gnome extensions directory `(~/.local/share/gnome-shell/extensions)` you can just run `make build` to create all versions as .zip or `make build-legacy`, `make build-interim` or `make build-modern` to create them seperately as .zip. To enable them you need to unzip these archives and put them into your extensions directory.

4.  **Reload the shell**
    ```bash
    Press Alt + F2, type  r , hit ↩   (works for X11 and Wayland)
    ```
5.  **Clean up (optional)**
    ```bash
    make clean        # perform this command in the downloaded folder to remove builds and generated ZIPs
    ```

## Configuration

#### Keyboard Shortcuts

All keyboard shortcuts can be configured through the Settings panel of Simple Tiling (which can be found in the Gnome Extension Application):
1.  Open **Settings**.
2.  Navigate to **Keyboard** -> **View and Customize Shortcuts**.
3.  Scroll down to the **Custom Shortcuts** section at the bottom.
4.  You will find all shortcuts for "Simple Tiling" listed there and can change them to your preference.

#### Ignoring Applications (`exceptions.txt`)

To prevent an application from being tiled, you can add its `WM_CLASS` (x11) or `App ID` (Wayland) to the `exceptions.txt` file in the extension's directory.

* Each application's `WM_CLASS` or `App ID` should be on a new line.
* Lines starting with `#` are treated as comments and are ignored.
* The check is case-insensitive.

To find an application's `WM_CLASS`, open a terminal and run the command `xprop WM_CLASS`. Your cursor will turn into a crosshair. Click on the window of the application you want to exclude. To find the `App ID`, Press Alt + F2, type 'lg', and press Enter. In the Looking Glass window, click the "Windows" tab. Click on the desired window to see its details. Find the value for "app id" and add it to a new line below.

An Example of an exceptions.txt can be found in the repo.

Ignored applications will be opened screen centered and kept above all other windows. These applications can be moved across the screen in floating mode.

#### Adjusting inner and/or outer Window Gaps / Margins

You can adjust the window gap margins (inner gaps between windows, outer gaps horizontal as well as vertical) in the Settings panel of Simple Tiling (which can be found in the Gnome Extension Application).

#### Configurable New Window Behavior

A toogle setting allows you to control the behavior for newly opened windows. You can choose to either have them become the new master window (pushing the old master into the stack) or have them appended to the stack as the last window (Default).

#### Adjusting Tiling Window Delays

If you have race condition issues between mutter (Gnome WM) and the Simple Tiling extension, you can adjust the window delay settings (both for tiling windows as well as for centered application from the exceptions list) directly in the extensions.js (~/.local/share/gnome-shell/extensions/simple-tiling@domoel/extension.js). You will find the parameter at line 17 & 18. Defaults to "20" for General Tiling Window Delay and "5" for centered Apps on the Exception List.

## Future Development

This extension was built to solve a specific need. However, future enhancements could include:
* Multi-monitor support.
* Additional layout algorithms.
* A more detailed settings panel to configure other options via a GUI.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

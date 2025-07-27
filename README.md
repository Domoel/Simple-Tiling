
<h1 align="center">
Simple Tiling 
</span>
<h4 align="center">
<span style="display:inline-flex; align-items:center; gap:12px;">
A lightweight, opinionated, and automatic tiling window manager for GNOME Shell 3.38.
</span>
<p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![GNOME Shell Version](https://img.shields.io/badge/GNOME%20Shell-3.38-blue)

<img width="2560" height="1440" alt="Simple-Tiling-v6" src="https://github.com/user-attachments/assets/eb0f7cc3-6a5a-4036-8a1e-8f945c52e55c" />

## Introduction

Simple Tiling is a GNOME Shell extension created for users who want a clean, predictable, and automatic tiling layout without the complexity of larger, more feature-heavy tiling extensions. It is designed to be simple to configure and intuitive to use, focusing on a core set of essential tiling features.

This extension was built from the ground up to be stable and performant on **GNOME Shell 3.38**.

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

Please note that this extension has been developed for a very specific environment:

* **GNOME Shell Version:** **3.38**
* **Session Type:** **X11** (Wayland is not supported).
* **Monitor Setup:** **Single monitor only.** Multi-monitor support is not yet implemented.

## Installation

#### Recommended:

Use the [GNOME Shell Extensions website](https://extensions.gnome.org/extension/8345/simple-tiling/) to install and enable the latest version.

#### Manual Installation

1. **Navigate to your extensions folder:**

   ```bash
   cd ~/.local/share/gnome-shell/extensions/
   ```
3. **Clone the repository directly into a folder named after the extension's UUID:**

   ```bash
   git clone https://github.com/Domoel/Simple-Tiling.git simple-tiling@domoel
   ```
5.  **Compile the GSettings schema.** This is a mandatory step for the keyboard shortcuts to work.

    ```bash
    cd ~/.local/share/gnome-shell/extensions/simple-tiling@domoel
    glib-compile-schemas schemas/
    ```
    
3.  **Restart GNOME Shell.** Press `Alt` + `F2`, type `r`, and press `Enter`.
   
5.  **Enable the extension** using the GNOME Extensions app or GNOME Tweaks.

## Configuration

#### Keyboard Shortcuts

All keyboard shortcuts can be configured through the Settings panel of Simple Tiling (which can be found in the Gnome Extension Application):
1.  Open **Settings**.
2.  Navigate to **Keyboard** -> **View and Customize Shortcuts**.
3.  Scroll down to the **Custom Shortcuts** section at the bottom.
4.  You will find all shortcuts for "Simple Tiling" listed there and can change them to your preference.

#### Ignoring Applications (`exceptions.txt`)

To prevent an application from being tiled, you can add its `WM_CLASS` to the `exceptions.txt` file in the extension's directory.

* Each application's `WM_CLASS` should be on a new line.
* Lines starting with `#` are treated as comments and are ignored.
* The check is case-insensitive.

To find an application's `WM_CLASS`, open a terminal and run the command `xprop WM_CLASS`. Your cursor will turn into a crosshair. Click on the window of the application you want to exclude. 

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
* Support for newer Gnome shells
* Additional layout algorithms.
* A more detailed settings panel to configure other options via a GUI.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.


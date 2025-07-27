/////////////////////////////////////////////////////////////
//       Simple-Tiling – LEGACY (for GNOME Shell 3.38)    //
//               © 2025 domoel – MIT                     //
//////////////////////////////////////////////////////////


// --- GLOBAL IMPORTS ---
'use strict';

const Main = imports.ui.main;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const ExtensionUtils = imports.misc.extensionUtils;
const ByteArray = imports.byteArray;

const Me = ExtensionUtils.getCurrentExtension();
const SCHEMA_NAME = "org.gnome.shell.extensions.simple-tiling.domoel";
const WM_SCHEMA = "org.gnome.desktop.wm.keybindings";

const TILING_DELAY_MS = 20; // Change Tiling Window Delay
const CENTERING_DELAY_MS = 5; // Change Centered Window Delay

const KEYBINDINGS = {
    "swap-master-window": (self) => self._swapWithMaster(),
    "swap-left-window":   (self) => self._swapInDirection("left"),
    "swap-right-window":  (self) => self._swapInDirection("right"),
    "swap-up-window":     (self) => self._swapInDirection("up"),
    "swap-down-window":   (self) => self._swapInDirection("down"),
    "focus-left":         (self) => self._focusInDirection("left"),
    "focus-right":        (self) => self._focusInDirection("right"),
    "focus-up":           (self) => self._focusInDirection("up"),
    "focus-down":         (self) => self._focusInDirection("down"),
};

// --- INTERACTIONHANDLER ---
class InteractionHandler {
    constructor(tiler) {
        this.tiler = tiler;
        this._settings = ExtensionUtils.getSettings(SCHEMA_NAME);
        this._wmSettings = new Gio.Settings({ schema: WM_SCHEMA });
        this._wmKeysToDisable = [];
        this._savedWmShortcuts = {};
        this._grabOpIds = [];
        this._settingsChangedId = null;
        this._onSettingsChanged = this._onSettingsChanged.bind(this);
        this._prepareWmShortcuts();
    }

    enable() {
        if (this._wmKeysToDisable.length) {
            this._wmKeysToDisable.forEach((key) =>
                this._wmSettings.set_value(key, new GLib.Variant("as", []))
            );
        }
        this._bindAllShortcuts();
        this._settingsChangedId = this._settings.connect(
            "changed",
            this._onSettingsChanged
        );
        this._grabOpIds.push(
            global.display.connect(
                "grab-op-begin",
                (display, screen, window) => {
                    if (this.tiler.windows.includes(window)) {
                        this.tiler.grabbedWindow = window;
                    }
                }
            )
        );
        this._grabOpIds.push(
            global.display.connect("grab-op-end", this._onGrabEnd.bind(this))
        );
    }

    disable() {
        if (this._wmKeysToDisable.length) {
            this._wmKeysToDisable.forEach((key) =>
                this._wmSettings.set_value(key, this._savedWmShortcuts[key])
            );
        }
        this._unbindAllShortcuts();
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        this._grabOpIds.forEach((id) => global.display.disconnect(id));
        this._grabOpIds = [];
    }

    _bind(key, callback) {
        Main.wm.addKeybinding(key, this._settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.NORMAL,
            () => callback(this));
    }

    _bindAllShortcuts() {
        for (const [key, handler] of Object.entries(KEYBINDINGS)) {
            this._bind(key, handler);
        }
    }

    _unbindAllShortcuts() {
        for (const key in KEYBINDINGS) {
            Main.wm.removeKeybinding(key);
        }
    }

    _onSettingsChanged() {
        this._unbindAllShortcuts();
        this._bindAllShortcuts();
    }
    
    _prepareWmShortcuts() {
        const schema = this._wmSettings.settings_schema;
        const keys = [];
        if (schema.has_key("toggle-tiled-left"))
            keys.push("toggle-tiled-left", "toggle-tiled-right");
        else if (schema.has_key("tile-left"))
            keys.push("tile-left", "tile-right");
        if (schema.has_key("toggle-maximized")) keys.push("toggle-maximized");
        else {
            if (schema.has_key("maximize")) keys.push("maximize");
            if (schema.has_key("unmaximize")) keys.push("unmaximize");
        }
        if (keys.length) {
            this._wmKeysToDisable = keys;
            keys.forEach(
                (key) =>
                    (this._savedWmShortcuts[
                        key
                    ] = this._wmSettings.get_value(key))
            );
        }
    }

    _focusInDirection(direction) {
        const sourceWindow = global.display.get_focus_window();
        if (!sourceWindow || !this.tiler.windows.includes(sourceWindow)) return;

        const targetWindow = this._findTargetInDirection(
            sourceWindow,
            direction
        );
        if (targetWindow) {
            targetWindow.activate(global.get_current_time());
        }
    }

    _swapWithMaster() {
        const windows = this.tiler.windows;
        if (windows.length < 2) return;
        const focusedWindow = global.display.get_focus_window();
        if (!focusedWindow || !windows.includes(focusedWindow)) return;
        const focusedIndex = windows.indexOf(focusedWindow);
        if (focusedIndex > 0) {
            [windows[0], windows[focusedIndex]] = [
                windows[focusedIndex],
                windows[0],
            ];
        } else if (focusedIndex === 0) {
            [windows[0], windows[1]] = [windows[1], windows[0]];
        }
        this.tiler.tileNow();
        if (windows.length > 0) windows[0].activate(global.get_current_time());
    }

    _swapInDirection(direction) {
        const sourceWindow = global.display.get_focus_window();
        if (!sourceWindow || !this.tiler.windows.includes(sourceWindow)) return;
        let targetWindow = null;
        const sourceIndex = this.tiler.windows.indexOf(sourceWindow);
        if (
            sourceIndex === 0 &&
            direction === "right" &&
            this.tiler.windows.length > 1
        ) {
            targetWindow = this.tiler.windows[1];
        } else {
            targetWindow = this._findTargetInDirection(sourceWindow, direction);
        }
        if (!targetWindow) return;
        const targetIndex = this.tiler.windows.indexOf(targetWindow);
        [this.tiler.windows[sourceIndex], this.tiler.windows[targetIndex]] = [
            this.tiler.windows[targetIndex],
            this.tiler.windows[sourceIndex],
        ];
        this.tiler.tileNow();
        sourceWindow.activate(global.get_current_time());
    }

    _findTargetInDirection(source, direction) {
        const sourceRect = source.get_frame_rect();
        let candidates = [];
        for (const win of this.tiler.windows) {
            if (win === source) continue;
            const targetRect = win.get_frame_rect();
            switch (direction) {
                case "left":
                    if (targetRect.x < sourceRect.x) candidates.push(win);
                    break;
                case "right":
                    if (targetRect.x > sourceRect.x) candidates.push(win);
                    break;
                case "up":
                    if (targetRect.y < sourceRect.y) candidates.push(win);
                    break;
                case "down":
                    if (targetRect.y > sourceRect.y) candidates.push(win);
                    break;
            }
        }
        if (candidates.length === 0) return null;
        let bestTarget = null;
        let minDeviation = Infinity;
        for (const win of candidates) {
            const targetRect = win.get_frame_rect();
            let deviation;
            if (direction === "left" || direction === "right") {
                deviation = Math.abs(sourceRect.y - targetRect.y);
            } else {
                deviation = Math.abs(sourceRect.x - targetRect.x);
            }
            if (deviation < minDeviation) {
                minDeviation = deviation;
                bestTarget = win;
            }
        }
        return bestTarget;
    }

    _onGrabEnd() {
        const grabbedWindow = this.tiler.grabbedWindow;
        if (!grabbedWindow) return;
        const targetWindow = this._findTargetUnderPointer(grabbedWindow);
        if (targetWindow) {
            const sourceIndex = this.tiler.windows.indexOf(grabbedWindow);
            const targetIndex = this.tiler.windows.indexOf(targetWindow);
            [
                this.tiler.windows[sourceIndex],
                this.tiler.windows[targetIndex],
            ] = [
                this.tiler.windows[targetIndex],
                this.tiler.windows[sourceIndex],
            ];
        }
        this.tiler.queueTile();
        this.tiler.grabbedWindow = null;
    }

    _findTargetUnderPointer(excludeWindow) {
        let [pointerX, pointerY] = global.get_pointer();
        let windows = global
            .get_window_actors()
            .map((actor) => actor.meta_window)
            .filter((win) => {
                if (
                    !win ||
                    win === excludeWindow ||
                    !this.tiler.windows.includes(win)
                )
                    return false;
                let frame = win.get_frame_rect();
                return (
                    pointerX >= frame.x &&
                    pointerX < frame.x + frame.width &&
                    pointerY >= frame.y &&
                    pointerY < frame.y + frame.height
                );
            });
        if (windows.length > 0) {
            return windows[windows.length - 1];
        }

        let bestTarget = null;
        let maxOverlap = 0;
        const sourceFrame = excludeWindow.get_frame_rect();
        for (const win of this.tiler.windows) {
            if (win === excludeWindow) continue;
            const targetFrame = win.get_frame_rect();
            const overlapX = Math.max(
                0,
                Math.min(
                    sourceFrame.x + sourceFrame.width,
                    targetFrame.x + targetFrame.width
                ) - Math.max(sourceFrame.x, targetFrame.x)
            );
            const overlapY = Math.max(
                0,
                Math.min(
                    sourceFrame.y + sourceFrame.height,
                    targetFrame.y + targetFrame.height
                ) - Math.max(sourceFrame.y, targetFrame.y)
            );
            const overlapArea = overlapX * overlapY;
            if (overlapArea > maxOverlap) {
                maxOverlap = overlapArea;
                bestTarget = win;
            }
        }
        return bestTarget;
    }
}

// --- TILER ---
class Tiler {
    constructor() {
        this.windows = [];
        this.grabbedWindow = null;
        this._settings = ExtensionUtils.getSettings(SCHEMA_NAME);
        this._signalIds = new Map();
        this._tileInProgress = false;

        this._innerGap = this._settings.get_int("inner-gap");
        this._outerGapVertical = this._settings.get_int("outer-gap-vertical");
        this._outerGapHorizontal = this._settings.get_int("outer-gap-horizontal");

        this._tilingDelay = TILING_DELAY_MS;
        this._centeringDelay = CENTERING_DELAY_MS;

        this._exceptions = [];
        this._interactionHandler = new InteractionHandler(this);

        this._tileTimeoutId = null;
        this._centerTimeoutIds = [];

        this._onWindowAdded = this._onWindowAdded.bind(this);
        this._onWindowRemoved = this._onWindowRemoved.bind(this);
        this._onActiveWorkspaceChanged = this._onActiveWorkspaceChanged.bind(
            this
        );
        this._onWindowMinimizedStateChanged = this._onWindowMinimizedStateChanged.bind(
            this
        );
        this._onSettingsChanged = this._onSettingsChanged.bind(this);
    }

    enable() {
        this._loadExceptions();
        const workspaceManager = global.workspace_manager;
        this._signalIds.set("workspace-changed", {
            object: workspaceManager,
            id: workspaceManager.connect(
                "active-workspace-changed",
                this._onActiveWorkspaceChanged
            ),
        });
        this._connectToWorkspace();
        this._interactionHandler.enable();
        this._signalIds.set("settings-changed", {
            object: this._settings,
            id: this._settings.connect("changed", this._onSettingsChanged),
        });
    }

    disable() {
        if (this._tileTimeoutId) {
            GLib.source_remove(this._tileTimeoutId);
            this._tileTimeoutId = null;
        }
        this._centerTimeoutIds.forEach(id => GLib.source_remove(id));
        this._centerTimeoutIds = [];

        this._interactionHandler.disable();
        this._disconnectFromWorkspace();
        for (const [, signal] of this._signalIds) {
            try {
                signal.object.disconnect(signal.id);
            } catch (e) {}
        }
        this._signalIds.clear();
        this.windows = [];
    }

    _onSettingsChanged() {
        this._innerGap = this._settings.get_int("inner-gap");
        this._outerGapVertical = this._settings.get_int("outer-gap-vertical");
        this._outerGapHorizontal = this._settings.get_int("outer-gap-horizontal");
        this.queueTile();
    }

    _loadExceptions() {
        const file = Gio.file_new_for_path(Me.path + "/exceptions.txt");
        if (!file.query_exists(null)) {
            this._exceptions = [];
            return;
        }
        const [ok, data] = file.load_contents(null);
        this._exceptions = ok
            ? ByteArray.toString(data)
                  .split("\n")
                  .map((l) => l.trim())
                  .filter((l) => l && !l.startsWith("#"))
                  .map((l) => l.toLowerCase())
            : [];
    }

    _isException(win) {
        if (!win) return false;
        const wmClass = (win.get_wm_class() || "").toLowerCase();
        const appId = (win.get_gtk_application_id() || "").toLowerCase();
        return this._exceptions.includes(wmClass) || this._exceptions.includes(appId);
    }

    _isTileable(win) {
        return (
            win &&
            !win.minimized &&
            !this._isException(win) &&
            win.get_window_type() === Meta.WindowType.NORMAL
        );
    }

    _centerWindow(win) {
        const timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._centeringDelay, () => {
            const index = this._centerTimeoutIds.indexOf(timeoutId);
            if (index > -1) {
                this._centerTimeoutIds.splice(index, 1);
            }
            
            if (!win || !win.get_display()) return GLib.SOURCE_REMOVE;
            if (win.get_maximized()) {
                win.unmaximize(Meta.MaximizeFlags.BOTH);
            }
            const monitorIndex = win.get_monitor();
            const workArea = Main.layoutManager.getWorkAreaForMonitor(
                monitorIndex
            );
            const frame = win.get_frame_rect();
            win.move_frame(
                true,
                workArea.x + Math.floor((workArea.width - frame.width) / 2),
                workArea.y + Math.floor((workArea.height - frame.height) / 2)
            );
            GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                if (win.get_display()) {
                    if (typeof win.set_keep_above === "function")
                        win.set_keep_above(true);
                    else if (typeof win.make_above === "function")
                        win.make_above();
                }
                return GLib.SOURCE_REMOVE;
            });
            return GLib.SOURCE_REMOVE;
        });

        this._centerTimeoutIds.push(timeoutId);
    }

    _onWindowMinimizedStateChanged() {
        this.queueTile();
    }

    _onWindowAdded(workspace, win) {
        if (this.windows.includes(win)) return;

        if (this._isException(win)) {
            this._centerWindow(win);
            return;
        }

        if (this._isTileable(win)) {
            if (this._settings.get_string("new-window-behavior") === "master") {
                this.windows.unshift(win);
            } else {
                this.windows.push(win);
            }

            const id = win.get_id();
            this._signalIds.set(`unmanaged-${id}`, {
                object: win,
                id: win.connect("unmanaged", () =>
                    this._onWindowRemoved(null, win)
                ),
            });
            this._signalIds.set(`size-changed-${id}`, {
                object: win,
                id: win.connect("size-changed", () => {
                    if (!this.grabbedWindow) this.queueTile();
                }),
            });
            this._signalIds.set(`minimized-${id}`, {
                object: win,
                id: win.connect(
                    "notify::minimized",
                    this._onWindowMinimizedStateChanged
                ),
            });

            this.queueTile();
        }
    }

    _onWindowRemoved(workspace, win) {
        const index = this.windows.indexOf(win);
        if (index > -1) {
            this.windows.splice(index, 1);
        }

        ["unmanaged", "size-changed", "minimized"].forEach((prefix) => {
            const key = `${prefix}-${win.get_id()}`;
            if (this._signalIds.has(key)) {
                const { object, id } = this._signalIds.get(key);
                try {
                    object.disconnect(id);
                } catch (e) {}
                this._signalIds.delete(key);
            }
        });
        this.queueTile();
    }

    _onActiveWorkspaceChanged() {
        this._disconnectFromWorkspace();
        this._connectToWorkspace();
    }

    _connectToWorkspace() {
        const workspace = global.workspace_manager.get_active_workspace();
        workspace
            .list_windows()
            .forEach((win) => this._onWindowAdded(workspace, win));
        this._signalIds.set("window-added", {
            object: workspace,
            id: workspace.connect("window-added", this._onWindowAdded),
        });
        this._signalIds.set("window-removed", {
            object: workspace,
            id: workspace.connect("window-removed", this._onWindowRemoved),
        });
        this.queueTile();
    }

    _disconnectFromWorkspace() {
        this.windows.slice().forEach((win) => this._onWindowRemoved(null, win));

        ["window-added", "window-removed"].forEach((key) => {
            if (this._signalIds.has(key)) {
                const { object, id } = this._signalIds.get(key);
                try {
                    object.disconnect(id);
                } catch (e) {}
                this._signalIds.delete(key);
            }
        });
    }

    queueTile() {
        if (this._tileInProgress || this._tileTimeoutId) return;
        this._tileInProgress = true;
        
        this._tileTimeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, this._tilingDelay, () => {
            this._tileWindows();
            this._tileInProgress = false;
            this._tileTimeoutId = null;
            return GLib.SOURCE_REMOVE;
        });
    }

    tileNow() {
        if (!this._tileInProgress) {
            this._tileWindows();
        }
    }

    _splitLayout(windows, area) {
        if (windows.length === 0) return;
        if (windows.length === 1) {
            windows[0].move_resize_frame(
                true,
                area.x,
                area.y,
                area.width,
                area.height
            );
            return;
        }

        const gap = Math.floor(this._innerGap / 2);
        const primaryWindows = [windows[0]];
        const secondaryWindows = windows.slice(1);
        let primaryArea, secondaryArea;

        if (area.width > area.height) {
            const primaryWidth = Math.floor(area.width / 2) - gap;
            primaryArea = {
                x: area.x,
                y: area.y,
                width: primaryWidth,
                height: area.height,
            };
            secondaryArea = {
                x: area.x + primaryWidth + this._innerGap,
                y: area.y,
                width: area.width - primaryWidth - this._innerGap,
                height: area.height,
            };
        } else {
            const primaryHeight = Math.floor(area.height / 2) - gap;
            primaryArea = {
                x: area.x,
                y: area.y,
                width: area.width,
                height: primaryHeight,
            };
            secondaryArea = {
                x: area.x,
                y: area.y + primaryHeight + this._innerGap,
                width: area.width,
                height: area.height - primaryHeight - this._innerGap,
            };
        }

        this._splitLayout(primaryWindows, primaryArea);
        this._splitLayout(secondaryWindows, secondaryArea);
    }

    _tileWindows() {
        const windowsToTile = this.windows.filter((win) => !win.minimized);
        if (windowsToTile.length === 0) return;
        const monitor = Main.layoutManager.primaryMonitor;
        const workArea = Main.layoutManager.getWorkAreaForMonitor(
            monitor.index
        );
        const innerArea = {
            x: workArea.x + this._outerGapHorizontal,
            y: workArea.y + this._outerGapVertical,
            width: workArea.width - 2 * this._outerGapHorizontal,
            height: workArea.height - 2 * this._outerGapVertical,
        };

        windowsToTile.forEach((win) => {
            if (win.get_maximized()) win.unmaximize(Meta.MaximizeFlags.BOTH);
        });

        if (windowsToTile.length === 1) {
            windowsToTile[0].move_resize_frame(
                true,
                innerArea.x,
                innerArea.y,
                innerArea.width,
                innerArea.height
            );
            return;
        }

        const gap = Math.floor(this._innerGap / 2);
        const masterWidth = Math.floor(innerArea.width / 2) - gap;
        const master = windowsToTile[0];
        master.move_resize_frame(
            true,
            innerArea.x,
            innerArea.y,
            masterWidth,
            innerArea.height
        );
        const stackArea = {
            x: innerArea.x + masterWidth + this._innerGap,
            y: innerArea.y,
            width: innerArea.width - masterWidth - this._innerGap,
            height: innerArea.height,
        };
        this._splitLayout(windowsToTile.slice(1), stackArea);
    }
}

// --- EXTENSION WRAPPER ---
var LegacyExtension = class {
    constructor() {
        this.tiler = null;
    }
    enable() {
        this.tiler = new Tiler();
        this.tiler.enable();
    }
    disable() {
        if (this.tiler) {
            this.tiler.disable();
            this.tiler = null;
        }
    }
};

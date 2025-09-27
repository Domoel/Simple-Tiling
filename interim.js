///////////////////////////////////////////////////////////////
//      Simple‑Tiling – MODERN (GNOME Shell 40 - 44)         //
//               © 2025 domoel – MIT                         //
/////////////////////////////////////////////////////////////


// ── GLOBAL IMPORTS ────────────────────────────────────────
import { Extension } from "resource:///org/gnome/shell/extensions/js/extensions/extension.js";
import * as Main from "resource:///org/gnome/shell/ui/main.js";
import Meta from "gi://Meta";
import Shell from "gi://Shell";
import Gio from "gi://Gio";
import GLib from "gi://GLib";

// ── CONST ────────────────────────────────────────────
const WM_SCHEMA          = 'org.gnome.desktop.wm.keybindings';

const TILING_DELAY_MS    = 20;   // Change Tiling Window Delay
const CENTERING_DELAY_MS = 5;    // Change Centered Window Delay

const KEYBINDINGS = {
    'swap-master-window': (self) => self._swapWithMaster(),
    'swap-left-window':   (self) => self._swapInDirection('left'),
    'swap-right-window':  (self) => self._swapInDirection('right'),
    'swap-up-window':     (self) => self._swapInDirection('up'),
    'swap-down-window':   (self) => self._swapInDirection('down'),
    'focus-left':         (self) => self._focusInDirection('left'),
    'focus-right':        (self) => self._focusInDirection('right'),
    'focus-up':           (self) => self._focusInDirection('up'),
    'focus-down':         (self) => self._focusInDirection('down'),
};

// ── HELPER‑FUNCTION ────────────────────────────────────────
function getPointerXY() {
    if (global.get_pointer) {
        const [x, y] = global.get_pointer();
        return [x, y];
    }

    const ev = Clutter.get_current_event();
    if (ev) {
        const coords = ev.get_coords();
        if (Array.isArray(coords)) 
            return coords;
    }

    const device = Clutter.get_default_backend()
                          .get_default_seat()
                          .get_pointer();
    return device ? device.get_position() : [0, 0];
}

// ── INTERACTIONHANDLER ───────────────────────────────────
class InteractionHandler {
    constructor(tiler) {
        this.tiler              = tiler;
        this._settings          = this.tiler.settings;
        this._wmSettings        = new Gio.Settings({ schema: WM_SCHEMA });

        this._wmKeysToDisable   = [];
        this._savedWmShortcuts  = {};
        this._grabOpIds         = [];
        this._settingsChangedId = null;
    }

    enable() {
        this._prepareWmShortcuts();

        if (this._wmKeysToDisable.length)
            this._wmKeysToDisable.forEach(k =>
                this._wmSettings.set_value(k, new GLib.Variant('as', [])));

        this._bindAllShortcuts();
        this._settingsChangedId =
            this._settings.connect('changed', () => this._onSettingsChanged());

        this._grabOpIds.push(
            global.display.connect('grab-op-begin',
                (_, __, win) => { if (this.tiler.windows.includes(win))
                                      this.tiler.grabbedWindow = win; })
        );
        this._grabOpIds.push(
            global.display.connect('grab-op-end', () => this._onGrabEnd())
        );
    }

    disable() {
        if (this._wmKeysToDisable.length)
            this._wmKeysToDisable.forEach(k =>
                this._wmSettings.set_value(k, this._savedWmShortcuts[k]));

        this._unbindAllShortcuts();

        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        this._grabOpIds.forEach(id => global.display.disconnect(id));
        this._grabOpIds = [];
    }

    _bind(key, handler) {
        global.display.add_keybinding(
            key,
            this._settings,
            Meta.KeyBindingFlags.NONE,
            (..._args) => handler(this)
        );
    }

    _bindAllShortcuts()  { for (const [k,h] of Object.entries(KEYBINDINGS)) this._bind(k, h); }
    _unbindAllShortcuts(){ for (const k in KEYBINDINGS) global.display.remove_keybinding(k); }

    _onSettingsChanged() {
        this._unbindAllShortcuts();
        this._bindAllShortcuts();
    }

    _prepareWmShortcuts() {
        const schema = this._wmSettings.settings_schema;
        if (!schema) return;

        const keys = [];

        const add = key => { if (schema.has_key(key)) keys.push(key); };

        if (schema.has_key('toggle-tiled-left'))
            keys.push('toggle-tiled-left', 'toggle-tiled-right');
        else {
            add('tile-left');  add('tile-right');
        }

        if (schema.has_key('toggle-maximized'))
            keys.push('toggle-maximized');
        else {
            add('maximize');   add('unmaximize');
        }

        if (keys.length) {
            this._wmKeysToDisable = keys;
            keys.forEach(k => this._savedWmShortcuts[k] =
                             this._wmSettings.get_value(k));
        }
    }

    _focusInDirection(direction) {
        const src = global.display.get_focus_window();
        if (!src || !this.tiler.windows.includes(src)) return;
        const tgt = this._findTargetInDirection(src, direction);
        if (tgt) tgt.activate(global.get_current_time());
    }

    _swapWithMaster() {
        const w = this.tiler.windows;
        if (w.length < 2) return;
        const foc = global.display.get_focus_window();
        if (!foc || !w.includes(foc)) return;
        const idx = w.indexOf(foc);
        if (idx > 0) [w[0], w[idx]] = [w[idx], w[0]];
        else         [w[0], w[1]]   = [w[1], w[0]];
        this.tiler.tileNow();
        w[0]?.activate(global.get_current_time());
    }

    _swapInDirection(direction) {
        const src = global.display.get_focus_window();
        if (!src || !this.tiler.windows.includes(src)) return;
        let tgt = null;
        const idx = this.tiler.windows.indexOf(src);
        if (idx === 0 && direction==='right' && this.tiler.windows.length>1)
            tgt = this.tiler.windows[1];
        else
            tgt = this._findTargetInDirection(src, direction);
        if (!tgt) return;
        const tidx = this.tiler.windows.indexOf(tgt);
        [this.tiler.windows[idx], this.tiler.windows[tidx]] =
            [this.tiler.windows[tidx], this.tiler.windows[idx]];
        this.tiler.tileNow();
        src.activate(global.get_current_time());
    }

    _findTargetInDirection(src, dir) {
        const sRect = src.get_frame_rect(), cand=[];
        for (const win of this.tiler.windows) {
            if (win===src) continue;
            const r=win.get_frame_rect();
            if (dir==='left' && r.x<sRect.x)  cand.push(win);
            if (dir==='right'&& r.x>sRect.x)  cand.push(win);
            if (dir==='up'   && r.y<sRect.y)  cand.push(win);
            if (dir==='down' && r.y>sRect.y)  cand.push(win);
        }
        if (!cand.length) return null;
        let best=null, min=Infinity;
        for (const w of cand) {
            const r=w.get_frame_rect();
            const dev = (dir==='left'||dir==='right')
                       ? Math.abs(sRect.y - r.y)
                       : Math.abs(sRect.x - r.x);
            if (dev<min){min=dev; best=w;}
        }
        return best;
    }

    _onGrabEnd() {
        const grabbed = this.tiler.grabbedWindow;
        if (!grabbed) return;
        const tgt = this._findTargetUnderPointer(grabbed);
        if (tgt) {
            const a = this.tiler.windows.indexOf(grabbed);
            const b = this.tiler.windows.indexOf(tgt);
            [this.tiler.windows[a], this.tiler.windows[b]] =
                [this.tiler.windows[b], this.tiler.windows[a]];
        }
        this.tiler.queueTile();
        this.tiler.grabbedWindow = null;
    }

    _findTargetUnderPointer(exclude) {
        const [x,y] = getPointerXY();
        const wins = global.get_window_actors()
                           .map(a=>a.meta_window)
                           .filter(w=>w && w!==exclude &&
                                      this.tiler.windows.includes(w) && (()=>{const f=w.get_frame_rect();
                                           return x>=f.x && x<f.x+f.width &&
                                                  y>=f.y && y<f.y+f.height;})());
        if (wins.length) return wins[wins.length-1];

        let best=null, max=0, sRect=exclude.get_frame_rect();
        for (const w of this.tiler.windows) {
            if (w===exclude) continue;
            const r=w.get_frame_rect();
            const ovX=Math.max(0, Math.min(sRect.x+sRect.width, r.x+r.width)-Math.max(sRect.x,r.x));
            const ovY=Math.max(0, Math.min(sRect.y+sRect.height,r.y+r.height)-Math.max(sRect.y,r.y));
            const area=ovX*ovY;
            if (area>max){max=area; best=w;}
        }
        return best;
    }
}

// ── TILER ────────────────────────────────────────────────
class Tiler {
    constructor(extension) {
        this._extension       = extension;
        this.settings         = this._extension.getSettings();

        this.windows          = [];
        this.grabbedWindow    = null;
        this._signalIds       = new Map();
        this._tileInProgress  = false;

        this._innerGap        = this.settings.get_int('inner-gap');
        this._outerGapVertical= this.settings.get_int('outer-gap-vertical');
        this._outerGapHorizontal = this.settings.get_int('outer-gap-horizontal');

        this._tilingDelay     = TILING_DELAY_MS;
        this._centeringDelay  = CENTERING_DELAY_MS;

        this._exceptions      = [];
        this._interactionHandler = new InteractionHandler(this);

        this._tileTimeoutId   = null;
        this._centerTimeoutIds= [];
    }

    enable() {
        this._loadExceptions();
        this._workspaceManager = global.workspace_manager;

        this._signalIds.set('workspace-changed', {
            object: this._workspaceManager,
            id: this._workspaceManager.connect('active-workspace-changed',
                                               ()=>this._onActiveWorkspaceChanged())
        });

        this._connectToWorkspace();
        this._interactionHandler.enable();

        this._signalIds.set('settings-changed', {
            object: this.settings,
            id: this.settings.connect('changed', ()=>this._onSettingsChanged())
        });
    }

    disable() {
        if (this._tileTimeoutId) {
            GLib.source_remove(this._tileTimeoutId);
            this._tileTimeoutId = null;
        }
        this._centerTimeoutIds.forEach(id=>GLib.source_remove(id));
        this._centerTimeoutIds = [];

        this._interactionHandler.disable();
        this._disconnectFromWorkspace();

        for (const [,sig] of this._signalIds) {
            try { sig.object.disconnect(sig.id); } catch {}
        }
        this._signalIds.clear();
        this.windows = [];
    }

    _onSettingsChanged() {
        this._innerGap          = this.settings.get_int('inner-gap');
        this._outerGapVertical  = this.settings.get_int('outer-gap-vertical');
        this._outerGapHorizontal= this.settings.get_int('outer-gap-horizontal');
        this.queueTile();
    }

    _loadExceptions() {
        const file = Gio.File.new_for_path(this._extension.path + '/exceptions.txt');
        if (!file.query_exists(null)) { this._exceptions=[]; return; }

        const [ok,data] = file.load_contents(null);
        if (!ok) { this._exceptions=[]; return; }

        const txt = new TextDecoder('utf-8').decode(data);
        this._exceptions = txt.split('\n')
                              .map(l=>l.trim())
                              .filter(l=>l && !l.startsWith('#'))
                              .map(l=>l.toLowerCase());
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
        const timeoutId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            this._centeringDelay,
            () => {
                const index = this._centerTimeoutIds.indexOf(timeoutId);
                if (index > -1) this._centerTimeoutIds.splice(index, 1);

                if (!win || !win.get_display()) return GLib.SOURCE_REMOVE;
                if (win.get_maximized())
                    win.unmaximize(Meta.MaximizeFlags.BOTH);

                const monitorIndex = win.get_monitor();
                const workspace = this._workspaceManager.get_active_workspace();
                const workArea = workspace.get_work_area_for_monitor(
                    monitorIndex
                );

                const frame = win.get_frame_rect();
                win.move_frame(
                    true,
                    workArea.x + Math.floor((workArea.width - frame.width) / 2),
                    workArea.y +
                        Math.floor((workArea.height - frame.height) / 2)
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
            }
        );
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
            if (this.settings.get_string("new-window-behavior") === "master") {
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
                id: win.connect("notify::minimized", () =>
                    this._onWindowMinimizedStateChanged()
                ),
            });
            this.queueTile();
        }
    }

    _onWindowRemoved(workspace, win) {
        const index = this.windows.indexOf(win);
        if (index > -1) this.windows.splice(index, 1);

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
        const workspace = this._workspaceManager.get_active_workspace();
        workspace
            .list_windows()
            .forEach((win) => this._onWindowAdded(workspace, win));
        this._signalIds.set("window-added", {
            object: workspace,
            id: workspace.connect("window-added", (ws, win) =>
                this._onWindowAdded(ws, win)
            ),
        });
        this._signalIds.set("window-removed", {
            object: workspace,
            id: workspace.connect("window-removed", (ws, win) =>
                this._onWindowRemoved(ws, win)
            ),
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
        this._tileTimeoutId = GLib.timeout_add(
            GLib.PRIORITY_DEFAULT,
            this._tilingDelay,
            () => {
                this._tileWindows();
                this._tileInProgress = false;
                this._tileTimeoutId = null;
                return GLib.SOURCE_REMOVE;
            }
        );
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
        const workspace = this._workspaceManager.get_active_workspace();
        const workArea = workspace.get_work_area_for_monitor(monitor.index);

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

// ── EXTENSION‑WRAPPER ───────────────────────────────────
export default class InterimExtension extends Extension {
    enable() {
        this.tiler = new Tiler(this);
        this.tiler.enable();
    }

    disable() {
        if (this.tiler) {
            this.tiler.disable();
            this.tiler = null;
        }
    }
}

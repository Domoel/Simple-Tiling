///////////////////////////////////////////////////////
// --- Extension Settings Menu for Simple Tiling --- //
//            --- © 2025 domoel – MIT ---            //
///////////////////////////////////////////////////////


// --- GLOBAL IMPORTS ---
'use strict';

const { Gtk, GObject, Gio, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

// --- Global Version Checkup ---
let Adw;
try {
    Adw = imports.gi.Adw;
} catch (e) {
    Adw = null;
}



// --- DEFINITIONS ---

// --- Definitions for GNOME Shell 40+ ---
const ModernPrefs = Adw ? class extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        window.add(page);

        // --- Window Gaps ---
        const groupGaps = new Adw.PreferencesGroup({ title: 'Window Gaps' });
        page.add(groupGaps);

        const rowInnerGap = new Adw.SpinRow({
            title: 'Inner Gap',
            subtitle: 'The gap between windows in pixels.',
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
        });
        groupGaps.add(rowInnerGap);
        settings.bind('inner-gap', rowInnerGap, 'value', Gio.SettingsBindFlags.DEFAULT);

        const rowOuterHGap = new Adw.SpinRow({
            title: 'Outer Gap (horizontal)',
            subtitle: 'The gap to the left and right screen edges.',
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
        });
        groupGaps.add(rowOuterHGap);
        settings.bind('outer-gap-horizontal', rowOuterHGap, 'value', Gio.SettingsBindFlags.DEFAULT);

        const rowOuterVGap = new Adw.SpinRow({
            title: 'Outer Gap (vertical)',
            subtitle: 'The gap to the top and bottom screen edges.',
            adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
        });
        groupGaps.add(rowOuterVGap);
        settings.bind('outer-gap-vertical', rowOuterVGap, 'value', Gio.SettingsBindFlags.DEFAULT);

        // --- Window Behavior ---
        const groupBehavior = new Adw.PreferencesGroup({ title: 'Window Behavior' });
        page.add(groupBehavior);

        const rowNewWindow = new Adw.ComboRow({
            title: 'Open new windows as',
            subtitle: 'Determines if a new window is added as master or stack window.',
            model: new Gtk.StringList({ strings: ['Stack Window (Default)', 'Master Window'] }),
        });
        groupBehavior.add(rowNewWindow);
        
        const mapping = new Gio.SettingsBindMapping({
            settings: settings, key: 'new-window-behavior', property: 'selected',
            get_mapping: (value, variant_type) => value === 'master' ? 1 : 0,
            set_mapping: (value, param_type) => new GLib.Variant('s', value === 1 ? 'master' : 'stack'),
        });
        settings.bind_with_mapping('new-window-behavior', rowNewWindow, 'selected', Gio.SettingsBindFlags.DEFAULT, mapping);

        // --- Keybindings ---
        const groupKeys = new Adw.PreferencesGroup({ title: 'Keybindings' });
        page.add(groupKeys);

        const rowKeys = new Adw.ActionRow({
            title: 'Configure Shortcuts',
            subtitle: 'All shortcuts can be configured in GNOME\'s main Keyboard settings.',
        });
        groupKeys.add(rowKeys);

        const button = new Gtk.Button({ label: 'Open Keyboard Settings', valign: Gtk.Align.CENTER });
        button.connect('clicked', () => {
            const appInfo = Gio.AppInfo.create_from_commandline(
                'gnome-control-center keyboard', null, Gio.AppInfoCreateFlags.NONE
            );
            appInfo.launch([], null);
        });
        rowKeys.add_suffix(button);
        rowKeys.set_activatable_widget(button);
    }
} : null;


// --- Definitions for GNOME Shell 3.38 ---
const buildLegacyPrefsWidget = () => {
    const settings = ExtensionUtils.getSettings("org.gnome.shell.extensions.simple-tiling.domoel");
    const prefsWidget = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 20, margin_bottom: 20, margin_start: 20, margin_end: 20,
        spacing: 18,
        visible: true,
    });

    // --- Keybindings ---
    const keysTitle = new Gtk.Label({ label: "<b>Keybindings</b>", use_markup: true, halign: Gtk.Align.START, visible: true });
    const keysFrame = new Gtk.Frame({ label_widget: keysTitle, shadow_type: Gtk.ShadowType.NONE, visible: true });
    let keysBox = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL, margin: 12, spacing: 6, visible: true });
    keysFrame.add(keysBox);

    let store = new Gtk.ListStore();
    store.set_column_types([ GObject.TYPE_STRING, GObject.TYPE_STRING, GObject.TYPE_INT, GObject.TYPE_INT ]);

    const COLUMN_ID = 0, COLUMN_DESC = 1, COLUMN_KEY = 2, COLUMN_MODS = 3;
    const addKeybinding = (id, desc) => {
        let [key, mods] = [0, 0];
        const strv = settings.get_strv(id);
        if (strv && strv[0]) [key, mods] = Gtk.accelerator_parse(strv[0]);
        let iter = store.append();
        store.set(iter, [COLUMN_ID, COLUMN_DESC, COLUMN_KEY, COLUMN_MODS], [id, desc, key, mods]);
    };
    
    addKeybinding("swap-master-window", "Swap current window with master");
    addKeybinding("swap-up-window", "Swap current window with window above");
    addKeybinding("swap-down-window", "Swap current window with window below");
    addKeybinding("swap-left-window", "Swap current window with window to the left");
    addKeybinding("swap-right-window", "Swap current window with window to the right");
    addKeybinding("focus-up", "Focus window above");
    addKeybinding("focus-down", "Focus window below");
    addKeybinding("focus-left", "Focus window to the left");
    addKeybinding("focus-right", "Focus window to the right");

    let treeView = new Gtk.TreeView({ model: store, headers_visible: false, hexpand: true, visible: true });
    keysBox.add(treeView);

    let descRenderer = new Gtk.CellRendererText();
    let descColumn = new Gtk.TreeViewColumn({ expand: true });
    descColumn.pack_start(descRenderer, true);
    descColumn.add_attribute(descRenderer, "text", COLUMN_DESC);
    treeView.append_column(descColumn);

    let accelRenderer = new Gtk.CellRendererAccel({ "accel-mode": Gtk.CellRendererAccelMode.GTK, editable: true });
    accelRenderer.connect("accel-edited", (r, path, key, mods) => {
        let [ok, iter] = store.get_iter_from_string(path);
        if (ok) {
            store.set(iter, [COLUMN_KEY, COLUMN_MODS], [key, mods]);
            settings.set_strv(store.get_value(iter, COLUMN_ID), [ Gtk.accelerator_name(key, mods) ]);
        }
    });
    accelRenderer.connect("accel-cleared", (r, path) => {
        let [ok, iter] = store.get_iter_from_string(path);
        if (ok) {
            store.set(iter, [COLUMN_KEY, COLUMN_MODS], [0, 0]);
            settings.set_strv(store.get_value(iter, COLUMN_ID), []);
        }
    });
    let accelColumn = new Gtk.TreeViewColumn();
    accelColumn.pack_end(accelRenderer, false);
    accelColumn.add_attribute(accelRenderer, "accel-key", COLUMN_KEY);
    accelColumn.add_attribute(accelRenderer, "accel-mods", COLUMN_MODS);
    treeView.append_column(accelColumn);
    prefsWidget.add(keysFrame);

    // --- Window Gaps ---
    const gapsTitle = new Gtk.Label({ label: "<b>Window Gaps</b>", use_markup: true, halign: Gtk.Align.START, visible: true });
    const gapsFrame = new Gtk.Frame({ label_widget: gapsTitle, shadow_type: Gtk.ShadowType.NONE, visible: true });
    const gapsGrid = new Gtk.Grid({ margin: 12, column_spacing: 12, row_spacing: 12, visible: true });
    gapsFrame.add(gapsGrid);

    const addSpinButtonRow = (desc, key, pos) => {
        const label = new Gtk.Label({ label: desc, halign: Gtk.Align.START, visible: true });
        gapsGrid.attach(label, 0, pos, 1, 1);
        const adj = new Gtk.Adjustment({ lower: 0, upper: 50, step_increment: 1 });
        const spin = new Gtk.SpinButton({ adjustment: adj, climb_rate: 1, digits: 0, halign: Gtk.Align.END, visible: true });
        settings.bind(key, spin, "value", Gio.SettingsBindFlags.DEFAULT);
        gapsGrid.attach(spin, 1, pos, 1, 1);
    };
    addSpinButtonRow("Inner Gap", "inner-gap", 0);
    addSpinButtonRow("Outer Gap (horizontal)", "outer-gap-horizontal", 1);
    addSpinButtonRow("Outer Gap (vertical)", "outer-gap-vertical", 2);
    prefsWidget.add(gapsFrame);
    
    // --- Window Behavior ---
    const behaviorTitle = new Gtk.Label({ label: "<b>Window Behavior</b>", use_markup: true, halign: Gtk.Align.START, visible: true });
    const behaviorFrame = new Gtk.Frame({ label_widget: behaviorTitle, shadow_type: Gtk.ShadowType.NONE, visible: true });
    const behaviorGrid = new Gtk.Grid({ margin: 12, column_spacing: 12, row_spacing: 12, visible: true });
    behaviorFrame.add(behaviorGrid);
    
    const label = new Gtk.Label({ label: "Open new windows as", halign: Gtk.Align.START, visible: true });
    behaviorGrid.attach(label, 0, 0, 1, 1);
    const combo = new Gtk.ComboBoxText({ visible: true, halign: Gtk.Align.END });
    combo.append("stack", "Stack Window (Default)");
    combo.append("master", "Master Window");
    combo.set_active_id(settings.get_string("new-window-behavior"));
    combo.connect("changed", () => {
        settings.set_string("new-window-behavior", combo.get_active_id());
    });
    behaviorGrid.attach(combo, 1, 0, 1, 1);
    prefsWidget.add(behaviorFrame);

    return prefsWidget;
};


// --- MAIN ENTRY POINTS (called by GNOME Shell) ---

function init() {}

function buildPrefsWidget() {
    return buildLegacyPrefsWidget();
}

if (Adw) {
    var defaultExport = ModernPrefs;
}

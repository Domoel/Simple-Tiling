// ------------------------------------------------------ //
// Extension Settings Menu for Simple Tiling - Version 5  //
// © 2025 domoel – MIT                                    //
// ------------------------------------------------------ //

// ---------------------------------------------------- //
// Global Imports                                       //
// ---------------------------------------------------- //
"use strict";

const { Gtk, GObject, Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const SCHEMA_NAME = "org.gnome.shell.extensions.simple-tiling.domoel";

// ---------------------------------------------------- //
// Definition of Row Model                              //
// ---------------------------------------------------- //
const COLUMN_ID = 0;
const COLUMN_DESC = 1;
const COLUMN_KEY = 2;
const COLUMN_MODS = 3;

function init() {}

function buildPrefsWidget() {
    const settings = ExtensionUtils.getSettings(SCHEMA_NAME);

    const prefsWidget = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin_top: 20,
        margin_bottom: 20,
        margin_start: 20,
        margin_end: 20,
        spacing: 18,
        visible: true,
    });

    // ---------------------------------------------------- //
    // Section for Keybindings                              //
    // ---------------------------------------------------- //
    const keysTitle = new Gtk.Label({
        label: "<b>Tastenkürzel</b>",
        use_markup: true,
        halign: Gtk.Align.START,
        visible: true,
    });
    const keysFrame = new Gtk.Frame({
        label_widget: keysTitle,
        shadow_type: Gtk.ShadowType.NONE,
        visible: true,
    });
    let keysBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin: 12,
        spacing: 6,
        visible: true,
    });
    keysFrame.add(keysBox);

    let store = new Gtk.ListStore();
    store.set_column_types([
        GObject.TYPE_STRING,
        GObject.TYPE_STRING,
        GObject.TYPE_INT,
        GObject.TYPE_INT,
    ]);

    addKeybinding(store, settings, "swap-master-window", "Master-Fenster tauschen");
    
    addKeybinding(store, settings, "swap-up-window", "Fenster nach oben tauschen");
    addKeybinding(store, settings, "swap-down-window", "Fenster nach unten tauschen");
    addKeybinding(store, settings, "swap-left-window", "Fenster nach links tauschen");
    addKeybinding(store, settings, "swap-right-window", "Fenster nach rechts tauschen");    

    addKeybinding(store, settings, "focus-up", "Fokus nach oben wechseln");
    addKeybinding(store, settings, "focus-down", "Fokus nach unten wechseln");
    addKeybinding(store, settings, "focus-left", "Fokus nach links wechseln");
    addKeybinding(store, settings, "focus-right", "Fokus nach rechts wechseln");

    let treeView = new Gtk.TreeView({
        model: store,
        headers_visible: false,
        hexpand: true,
        visible: true,
    });
    keysBox.add(treeView);

    let descRenderer = new Gtk.CellRendererText();
    let descColumn = new Gtk.TreeViewColumn({ expand: true });
    descColumn.pack_start(descRenderer, true);
    descColumn.add_attribute(descRenderer, "text", COLUMN_DESC);
    treeView.append_column(descColumn);

    let accelRenderer = new Gtk.CellRendererAccel({
        "accel-mode": Gtk.CellRendererAccelMode.GTK,
        editable: true,
    });
    let accelColumn = new Gtk.TreeViewColumn();
    accelColumn.pack_end(accelRenderer, false);
    accelColumn.add_attribute(accelRenderer, "accel-key", COLUMN_KEY);
    accelColumn.add_attribute(accelRenderer, "accel-mods", COLUMN_MODS);
    treeView.append_column(accelColumn);

    accelRenderer.connect("accel-edited", (r, path, key, mods) => {
        let [ok, iter] = store.get_iter_from_string(path);
        if (ok) {
            store.set(iter, [COLUMN_KEY, COLUMN_MODS], [key, mods]);
            settings.set_strv(store.get_value(iter, COLUMN_ID), [
                Gtk.accelerator_name(key, mods),
            ]);
        }
    });

    accelRenderer.connect("accel-cleared", (r, path) => {
        let [ok, iter] = store.get_iter_from_string(path);
        if (ok) {
            store.set(iter, [COLUMN_KEY, COLUMN_MODS], [0, 0]);
            settings.set_strv(store.get_value(iter, COLUMN_ID), []);
        }
    });

    prefsWidget.add(keysFrame);

    // ---------------------------------------------------- //
    // Section for Window Gaps                              //
    // ---------------------------------------------------- //
    const gapsTitle = new Gtk.Label({
        label: "<b>Fensterabstände (Gaps)</b>",
        use_markup: true,
        halign: Gtk.Align.START,
        visible: true,
    });
    const gapsFrame = new Gtk.Frame({
        label_widget: gapsTitle,
        shadow_type: Gtk.ShadowType.NONE,
        visible: true,
    });
    const gapsGrid = new Gtk.Grid({
        margin: 12,
        column_spacing: 12,
        row_spacing: 12,
        visible: true,
    });
    gapsFrame.add(gapsGrid);

    addSpinButtonRow(gapsGrid, settings, "Innerer Abstand", "inner-gap", 0);
    addSpinButtonRow(
        gapsGrid,
        settings,
        "Äußerer Abstand (horizontal)",
        "outer-gap-horizontal",
        1
    );
    addSpinButtonRow(
        gapsGrid,
        settings,
        "Äußerer Abstand (vertikal)",
        "outer-gap-vertical",
        2
    );

    prefsWidget.add(gapsFrame);

    // ---------------------------------------------------- //
    // Section for Window Behavior (Master vs. Stack)       //
    // ---------------------------------------------------- //
    const behaviorTitle = new Gtk.Label({
        label: "<b>Fensterverhalten</b>",
        use_markup: true,
        halign: Gtk.Align.START,
        visible: true,
    });
    const behaviorFrame = new Gtk.Frame({
        label_widget: behaviorTitle,
        shadow_type: Gtk.ShadowType.NONE,
        visible: true,
    });
    const behaviorGrid = new Gtk.Grid({
        margin: 12,
        column_spacing: 12,
        row_spacing: 12,
        visible: true,
    });
    behaviorFrame.add(behaviorGrid);
    addComboBoxRow(
        behaviorGrid,
        settings,
        "Neues Fenster öffnen als",
        "new-window-behavior",
        0
    );
    prefsWidget.add(behaviorFrame);

    return prefsWidget;
}

function addKeybinding(model, settings, id, desc) {
    let [key, mods] = [0, 0];
    const strv = settings.get_strv(id);
    if (strv && strv[0]) {
        [key, mods] = Gtk.accelerator_parse(strv[0]);
    }
    let iter = model.append();
    model.set(
        iter,
        [COLUMN_ID, COLUMN_DESC, COLUMN_KEY, COLUMN_MODS],
        [id, desc, key, mods]
    );
}
function addSpinButtonRow(grid, settings, desc, key, pos) {
    const label = new Gtk.Label({
        label: desc,
        halign: Gtk.Align.START,
        visible: true,
    });
    grid.attach(label, 0, pos, 1, 1);
    const adj = new Gtk.Adjustment({ lower: 0, upper: 50, step_increment: 1 });
    const spin = new Gtk.SpinButton({
        adjustment: adj,
        climb_rate: 1,
        digits: 0,
        halign: Gtk.Align.END,
        visible: true,
    });
    settings.bind(key, spin, "value", Gio.SettingsBindFlags.DEFAULT);
    grid.attach(spin, 1, pos, 1, 1);
}
function addComboBoxRow(grid, settings, desc, key, pos) {
    const label = new Gtk.Label({
        label: desc,
        halign: Gtk.Align.START,
        visible: true,
    });
    grid.attach(label, 0, pos, 1, 1);
    const combo = new Gtk.ComboBoxText({
        visible: true,
        halign: Gtk.Align.END,
    });
    combo.append("stack", "Stack-Fenster (Standard)");
    combo.append("master", "Master-Fenster");
    combo.set_active_id(settings.get_string(key));
    combo.connect("changed", () => {
        settings.set_string(key, combo.get_active_id());
    });
    grid.attach(combo, 1, pos, 1, 1);
}

///////////////////////////////////////////////////////////////
//   Simple‑Tiling – LEGACY MENU (GNOME Shell 3.38)    	     //
//                © 2025 domoel – MIT                        //
/////////////////////////////////////////////////////////////


// ── GLOBAL IMPORTS ────────────────────────────────────────
"use strict";

const { Gtk, GObject, Gio } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;

const SCHEMA_NAME = "org.gnome.shell.extensions.simple-tiling.domoel";

// ── DEFINITIONS ────────────────────────────────────────────
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

    // ── KEYBINDINGS ────────────────────────────────────────────
    const keysTitle = new Gtk.Label({
        label: "<b>Keybindings</b>",
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

    addKeybinding(store, settings, "swap-master-window", "Swap current window with master");
    
    addKeybinding(store, settings, "swap-up-window", "Swap current window with window above");
    addKeybinding(store, settings, "swap-down-window", "Swap current window with window below");
    addKeybinding(store, settings, "swap-left-window", "Swap current window with window to the left");
    addKeybinding(store, settings, "swap-right-window", "Swap current window with window to the right");    

    addKeybinding(store, settings, "focus-up", "Focus window above");
    addKeybinding(store, settings, "focus-down", "Focus window below");
    addKeybinding(store, settings, "focus-left", "Focus window to the left");
    addKeybinding(store, settings, "focus-right", "Focus window to the right");

    addKeybinding(store, settings, "toggle-tiling", "Toggle tiling on/off");
    addKeybinding(store, settings, "float-window", "Float / unfloat focused window");
    addKeybinding(store, settings, "toggle-monocle", "Toggle monocle mode");
    addKeybinding(store, settings, "monocle-next", "Next window (monocle)");
    addKeybinding(store, settings, "monocle-prev", "Previous window (monocle)");

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

    // ── WINDOW GAPS ────────────────────────────────────────────
    const gapsTitle = new Gtk.Label({
        label: "<b>Window Gaps</b>",
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

    addSpinButtonRow(gapsGrid, settings, "Inner Gap", "inner-gap", 0);
    addSpinButtonRow(gapsGrid, settings, "Outer Gap (horizontal)", "outer-gap-horizontal", 1);
    addSpinButtonRow(gapsGrid, settings, "Outer Gap (vertical)", "outer-gap-vertical", 2);
    addSpinButtonRow(gapsGrid, settings, "Master Width (%)", "master-ratio", 3);

    prefsWidget.add(gapsFrame);

    // ── WINDOW BEHAVIOR ────────────────────────────────────────────
    const behaviorTitle = new Gtk.Label({
        label: "<b>Window Behavior</b>",
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
        "Open new windows as",
        "new-window-behavior",
        0
    );
    prefsWidget.add(behaviorFrame);

    // ── EXCEPTIONS ────────────────────────────────────────────
    const exceptTitle = new Gtk.Label({
        label: '<b>Exceptions</b>',
        use_markup: true,
        halign: Gtk.Align.START,
        visible: true,
    });
    const exceptFrame = new Gtk.Frame({
        label_widget: exceptTitle,
        shadow_type: Gtk.ShadowType.NONE,
        visible: true,
    });
    const exceptBox = new Gtk.Box({
        orientation: Gtk.Orientation.VERTICAL,
        margin: 12,
        spacing: 6,
        visible: true,
    });
    exceptFrame.add(exceptBox);

    const exceptDesc = new Gtk.Label({
        label: 'Apps excluded from tiling. To detect an app automatically: click 🔍, then click on the target window. Or type the WM_CLASS (X11) / App ID (Wayland) manually.',
        halign: Gtk.Align.START,
        wrap: true,
        visible: true,
    });
    exceptBox.add(exceptDesc);

    const listBox = new Gtk.ListBox({
        selection_mode: Gtk.SelectionMode.NONE,
        visible: true,
    });
    const scrolled = new Gtk.ScrolledWindow({
        min_content_height: 80,
        max_content_height: 200,
        propagate_natural_height: true,
        visible: true,
    });
    scrolled.add(listBox);
    exceptBox.add(scrolled);

    const refreshExceptions = () => {
        listBox.get_children().forEach(child => listBox.remove(child));
        for (const exc of settings.get_strv('exceptions')) {
            const rowBox = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 6,
                visible: true,
            });
            const lbl = new Gtk.Label({
                label: exc,
                halign: Gtk.Align.START,
                hexpand: true,
                visible: true,
            });
            const removeBtn = new Gtk.Button({
                relief: Gtk.ReliefStyle.NONE,
                visible: true,
            });
            removeBtn.set_image(new Gtk.Image({ icon_name: 'list-remove-symbolic', visible: true }));
            removeBtn.connect('clicked', () => {
                settings.set_strv('exceptions',
                    settings.get_strv('exceptions').filter(e => e !== exc));
            });
            rowBox.pack_start(lbl, true, true, 0);
            rowBox.pack_end(removeBtn, false, false, 0);
            const listRow = new Gtk.ListBoxRow({ visible: true });
            listRow.add(rowBox);
            listBox.add(listRow);
        }
        listBox.show_all();
    };

    refreshExceptions();
    settings.connect('changed::exceptions', refreshExceptions);

    const addBox = new Gtk.Box({
        orientation: Gtk.Orientation.HORIZONTAL,
        spacing: 6,
        visible: true,
    });
    const detectBtn = new Gtk.Button({ visible: true, tooltip_text: 'Detect last focused window' });
    detectBtn.set_image(new Gtk.Image({ icon_name: 'edit-find-symbolic', visible: true }));
    const addEntry = new Gtk.Entry({
        placeholder_text: 'Add exception…',
        hexpand: true,
        visible: true,
    });
    const addBtn = new Gtk.Button({ visible: true });
    addBtn.set_image(new Gtk.Image({ icon_name: 'list-add-symbolic', visible: true }));

    detectBtn.connect('clicked', () => {
        settings.set_boolean('pick-mode', true);
        detectBtn.sensitive = false;
        addEntry.placeholder_text = 'Click on a window…';
    });

    settings.connect('changed::pick-mode', () => {
        if (!settings.get_boolean('pick-mode')) {
            const appId   = settings.get_string('last-focused-app-id');
            const wmClass = settings.get_string('last-focused-wm-class');
            addEntry.set_text(appId || wmClass);
            addEntry.placeholder_text = 'Add exception…';
            detectBtn.sensitive = true;
        }
    });

    const doAdd = () => {
        const val = addEntry.get_text().trim().toLowerCase();
        if (!val) return;
        const current = settings.get_strv('exceptions');
        if (!current.includes(val))
            settings.set_strv('exceptions', [...current, val]);
        addEntry.set_text('');
    };
    addBtn.connect('clicked', doAdd);
    addEntry.connect('activate', doAdd);
    addBox.pack_start(detectBtn, false, false, 0);
    addBox.pack_start(addEntry, true, true, 0);
    addBox.pack_end(addBtn, false, false, 0);
    exceptBox.add(addBox);

    prefsWidget.add(exceptFrame);

    prefsWidget.show_all();
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
    const adj = new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 });
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
    combo.append("stack", "Stack Window (Default)");
    combo.append("master", "Master Window");
    combo.set_active_id(settings.get_string(key));
    combo.connect("changed", () => {
        settings.set_string(key, combo.get_active_id());
    });
    grid.attach(combo, 1, pos, 1, 1);
}

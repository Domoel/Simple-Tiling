//////////////////////////////////////////////////////////////////
//   Simple-Tiling – ENTERPRISE MENU (GNOME Shell 40 non-ESM)   //
//                     © 2025 domoel – MIT                      //
//////////////////////////////////////////////////////////////////

'use strict';

// ── GLOBAL IMPORTS ────────────────────────────────────────
const { Adw, Gio, Gtk, GLib } = imports.gi;
const ExtensionUtils = imports.misc.extensionUtils;
const _ = ExtensionUtils.gettext;


function init() {
}

function buildPrefsWidget() {
    const settings = ExtensionUtils.getSettings();
    const page = new Adw.PreferencesPage();

    // ── WINDOW GAPS ────────────────────────────────────────────
    const groupGaps = new Adw.PreferencesGroup({ title: 'Window Gaps' });
    page.add(groupGaps);

    const rowInnerGap = new Adw.SpinRow({
        title: 'Inner Gap',
        subtitle: 'The gap between windows in pixels.',
        adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
    });
    groupGaps.add(rowInnerGap);
    settings.bind('inner-gap', rowInnerGap, 'value', Gio.SettingsBindFlags.DEFAULT);

    const rowOuterH = new Adw.SpinRow({
        title: 'Outer Gap (horizontal)',
        subtitle: 'Left / right screen edges (pixels)',
        adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
    });
    groupGaps.add(rowOuterH);
    settings.bind('outer-gap-horizontal', rowOuterH, 'value', Gio.SettingsBindFlags.DEFAULT);

    const rowOuterV = new Adw.SpinRow({
        title: 'Outer Gap (vertical)',
        subtitle: 'Top / bottom screen edges (pixels)',
        adjustment: new Gtk.Adjustment({ lower: 0, upper: 100, step_increment: 1 }),
    });
    groupGaps.add(rowOuterV);
    settings.bind('outer-gap-vertical', rowOuterV, 'value', Gio.SettingsBindFlags.DEFAULT);

    // ── WINDOW BEHAVIOR ────────────────────────────────────────────
    const groupBehavior = new Adw.PreferencesGroup({ title: 'Window Behavior' });
    page.add(groupBehavior);

    const rowNewWindow = new Adw.ComboRow({
        title: 'Open new windows as',
        subtitle: 'Whether a new window starts as Master or Stack',
        model: new Gtk.StringList({
            strings: ['Stack Window (Default)', 'Master Window'],
        }),
    });
    groupBehavior.add(rowNewWindow);

    const currentBehavior = settings.get_string('new-window-behavior');
    rowNewWindow.selected = currentBehavior === 'master' ? 1 : 0;

    rowNewWindow.connect('notify::selected', () => {
        const newVal = rowNewWindow.selected === 1 ? 'master' : 'stack';
        settings.set_string('new-window-behavior', newVal);
    });

    // ── KEYBINDINGS ────────────────────────────────────────────
    const groupKeys = new Adw.PreferencesGroup({ title: 'Keybindings' });
    page.add(groupKeys);

    const rowKeys = new Adw.ActionRow({
        title: 'Configure Shortcuts',
        subtitle: 'Adjust all shortcuts in GNOME Keyboard settings.',
    });
    groupKeys.add(rowKeys);

    const btnOpenKeyboard = new Gtk.Button({ label: 'Open Keyboard Settings' });
    btnOpenKeyboard.connect('clicked', () => {
        const appInfo = Gio.AppInfo.create_from_commandline(
            'gnome-control-center keyboard', null, Gio.AppInfoCreateFlags.NONE
        );
        appInfo.launch([], null);
    });
    rowKeys.add_suffix(btnOpenKeyboard);
    rowKeys.set_activatable_widget(btnOpenKeyboard);

    return page;
}

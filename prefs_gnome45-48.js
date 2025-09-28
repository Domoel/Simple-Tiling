///////////////////////////////////////////////////////////////
//     Simple-Tiling – MODERN MENU (GNOME Shell 45+)         //
//                   © 2025 domoel – MIT                     //
///////////////////////////////////////////////////////////////

// ── GLOBAL IMPORTS ────────────────────────────────────────
import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import GLib from 'gi://GLib';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class SimpleTilingPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        window.add(page);

        // ── WINDOW GAPS ────────────────────────────────────────────
        const groupGaps = new Adw.PreferencesGroup({
            title: 'Window Gaps',
            description: 'Adjust spacing between windows and screen edges.'
        });
        page.add(groupGaps);

        const rowInnerGap = new Adw.SpinRow({
            title: 'Inner Gap',
            subtitle: 'Space between tiled windows (pixels)',
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
    }
}

///////////////////////////////////////////////////////////////
//    Simple-Tiling – MODERN MENU (GNOME Shell 41-44)        //
//                   © 2025 domoel – MIT                     //
///////////////////////////////////////////////////////////////

'use strict';

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';


export default class SimpleTilingPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const page = new Adw.PreferencesPage();
        window.add(page);

        // --- Group for Window Gaps ---
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

        // --- Group for Window Behavior ---
        const groupBehavior = new Adw.PreferencesGroup({ title: 'Window Behavior' });
        page.add(groupBehavior);

        const rowMasterRatio = new Adw.SpinRow({
            title: 'Master Window Width',
            subtitle: 'Percentage of the work area (20–80 %)',
            adjustment: new Gtk.Adjustment({ lower: 20, upper: 80, step_increment: 5 }),
        });
        groupBehavior.add(rowMasterRatio);
        settings.bind('master-ratio', rowMasterRatio, 'value', Gio.SettingsBindFlags.DEFAULT);

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

        // --- Group for Keybindings ---
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

        // ── EXCEPTIONS ─────────────────────────────────────────────
        const groupExceptions = new Adw.PreferencesGroup({
            title: 'Exceptions',
            description: 'Apps excluded from tiling. To detect an app automatically: focus its window first, then click 🔍. Or type the WM_CLASS (X11) / App ID (Wayland) manually. Values are matched case-insensitively.',
        });
        page.add(groupExceptions);

        const addRow = new Adw.EntryRow({ title: 'Add exception…' });
        const detectBtn = new Gtk.Button({
            icon_name: 'edit-find-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat', 'circular'],
            tooltip_text: 'Detect last focused window',
        });
        addRow.add_prefix(detectBtn);
        const addBtn = new Gtk.Button({
            icon_name: 'list-add-symbolic',
            valign: Gtk.Align.CENTER,
            css_classes: ['flat', 'circular'],
        });
        addRow.add_suffix(addBtn);

        const exceptionRows = [];

        const refreshExceptions = () => {
            exceptionRows.forEach(r => groupExceptions.remove(r));
            exceptionRows.length = 0;
            groupExceptions.remove(addRow);

            for (const exc of settings.get_strv('exceptions')) {
                const row = new Adw.ActionRow({ title: exc });
                const btn = new Gtk.Button({
                    icon_name: 'list-remove-symbolic',
                    valign: Gtk.Align.CENTER,
                    css_classes: ['flat', 'circular'],
                });
                btn.connect('clicked', () => {
                    settings.set_strv('exceptions',
                        settings.get_strv('exceptions').filter(e => e !== exc));
                });
                row.add_suffix(btn);
                groupExceptions.add(row);
                exceptionRows.push(row);
            }

            groupExceptions.add(addRow);
        };

        refreshExceptions();
        settings.connect('changed::exceptions', refreshExceptions);

        detectBtn.connect('clicked', () => {
            const appId   = settings.get_string('last-focused-app-id');
            const wmClass = settings.get_string('last-focused-wm-class');
            addRow.text = appId || wmClass;
        });

        addBtn.connect('clicked', () => {
            const val = addRow.text.trim().toLowerCase();
            if (!val) return;
            const current = settings.get_strv('exceptions');
            if (!current.includes(val))
                settings.set_strv('exceptions', [...current, val]);
            addRow.text = '';
        });
    }
}

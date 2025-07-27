/////////////////////////////////////////////////////////////
//             Simple-Tiling – GLOBAL CONFIG              //
//                   © 2025 domoel – MIT                 //
//////////////////////////////////////////////////////////


// --- GLOBAL IMPORTS ---
'use strict';

const ExtensionUtils = imports.misc.extensionUtils;
const Config = imports.misc.config;
const Me = ExtensionUtils.getCurrentExtension();
const [SHELL_MAJOR] = Config.PACKAGE_VERSION.split('.').map(n => parseInt(n));

let extension = null;

function init() {
}

// --- SHELL SWITCH ---
async function enable() {
    try {
        if (SHELL_MAJOR >= 40) {
            const module = await import('./modern.js');
            extension = new module.default(Me.metadata);
        } else {
            const { LegacyExtension } = Me.imports.legacy;
            extension = new LegacyExtension(Me.metadata);
        }
        extension.enable();
    } catch (e) {
        logError(e, `[Simple Tiling] Failed to enable extension`);
    }
}

function disable() {
    if (extension) {
        extension.disable();
        extension = null;
    }
}

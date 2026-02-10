import { setupUI, UIState } from './ui';

export interface ScriptMetadata {
    id: string;
    name: string;
    description: string;
    version: string;
    matches: (host: string) => boolean;
    execute: () => void;
    type?: 'site' | 'generic';
}

export function main(scripts: ScriptMetadata[]) {
    const currentHost = window.location.hostname;

    // Filter scripts
    const siteScripts = scripts.filter((s) => s.type === 'site' && s.matches(currentHost));
    const genericScripts = scripts.filter((s) => s.type === 'generic');

    // If no scripts at all, exit
    if (siteScripts.length === 0 && genericScripts.length === 0) {
        return;
    }

    // Load settings
    const STORAGE_KEY = "be_enabled_scripts";
    let enabledScripts: Record<string, boolean> = {};
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) enabledScripts = JSON.parse(stored);
    } catch (e) {
        console.error("Failed to load settings", e);
    }

    // Execute enabled scripts
    siteScripts.forEach((script) => {
        if (enabledScripts[script.id] !== false) {
            console.log("[BoredomEngine] Running Site Script:", script.name);
            script.execute();
        }
    });

    genericScripts.forEach((script) => {
        if (enabledScripts[script.id] === true) {
            console.log("[BoredomEngine] Running Generic Script:", script.name);
            script.execute();
        }
    });

    // Inject UI
    function injectMenu() {
        if (document.getElementById("boredom-menu-host")) return;

        const container = document.createElement("div");
        container.id = "boredom-menu-host";
        document.body.appendChild(container);

        const initialState: UIState = {
            enabledScripts,
            currentTab: siteScripts.length > 0 ? 'site' : 'generic',
            isOpen: false,
            siteScripts,
            genericScripts
        };

        setupUI(
            container,
            initialState,
            (id, enabled) => {
                enabledScripts[id] = enabled;
            },
            () => {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledScripts));
                window.location.reload();
            }
        );

        console.log("[BoredomEngine] Menu injected successfully via Lit.");
    }

    // Wait for body
    if (document.body) {
        injectMenu();
    } else {
        if (document.readyState === "loading") {
            window.addEventListener("DOMContentLoaded", injectMenu);
        } else {
            window.addEventListener("load", injectMenu);
        }
    }
}

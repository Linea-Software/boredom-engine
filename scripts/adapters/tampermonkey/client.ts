import { setupUI, UIState } from './ui';
import { Intensity } from '../../../src/common/intensity';

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
    const SCRIPTS_KEY = "be_enabled_scripts";
    const INTENSITY_KEY = "be_intensity";

    let enabledScripts: Record<string, boolean> = {};
    let intensity: Intensity = Intensity.Medium;

    try {
        const storedScripts = localStorage.getItem(SCRIPTS_KEY);
        if (storedScripts) enabledScripts = JSON.parse(storedScripts);

        const storedIntensity = localStorage.getItem(INTENSITY_KEY);
        if (storedIntensity && Object.values(Intensity).includes(storedIntensity as Intensity)) {
            intensity = storedIntensity as Intensity;
        }
    } catch (e) {
        console.error("Failed to load settings", e);
    }

    // Set global intensity for scripts to use
    (window as any).__BOREDOM_INTENSITY__ = intensity;

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
            genericScripts,
            intensity
        };

        setupUI(
            container,
            initialState,
            (id, enabled) => {
                enabledScripts[id] = enabled;
            },
            (newIntensity) => {
                intensity = newIntensity;
            },
            () => {
                localStorage.setItem(SCRIPTS_KEY, JSON.stringify(enabledScripts));
                localStorage.setItem(INTENSITY_KEY, intensity);
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

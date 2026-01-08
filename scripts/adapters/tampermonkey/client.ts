export interface ScriptMetadata {
    id: string;
    name: string;
    description: string;
    version: string;
    matches: (host: string) => boolean;
    execute: () => void;
}

export function main(scripts: ScriptMetadata[], menuHtml: string) {
    const currentHost = window.location.hostname;

    // Filter scripts for current host
    const availableScripts = scripts.filter(s => s.matches(currentHost));

    if (availableScripts.length === 0) {
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
    availableScripts.forEach(script => {
        if (enabledScripts[script.id] !== false) {
            console.log("[BoredomEngine] Running:", script.name);
            script.execute();
        }
    });

    // Inject UI
    function injectMenu() {
        const container = document.createElement('div');
        // Attach Shadow DOM
        const shadow = container.attachShadow({ mode: 'open' });
        shadow.innerHTML = menuHtml;
        document.body.appendChild(container);

        const panel = shadow.getElementById('panel') as HTMLElement;
        const fab = shadow.getElementById('fab') as HTMLElement;
        const list = shadow.getElementById('list') as HTMLElement;
        const saveBtn = shadow.getElementById('save-btn') as HTMLElement;

        // Toggle Panel
        fab.addEventListener('click', () => {
            panel.classList.toggle('open');
        });

        // Close when clicking outside (on the shadow host's window equivalent, difficult with shadow dom isolation)
        // Simple toggle is enough for now.

        // Populate List
        list.innerHTML = '';
        availableScripts.forEach(script => {
            const isEnabled = enabledScripts[script.id] !== false;

            const item = document.createElement('div');
            item.className = 'be-item';

            const info = document.createElement('div');
            info.className = 'be-item-info';

            const name = document.createElement('div');
            name.className = 'be-item-name';
            name.textContent = script.name;

            const desc = document.createElement('div');
            desc.className = 'be-item-desc';
            desc.textContent = script.description;

            info.appendChild(name);
            info.appendChild(desc);

            const switchLabel = document.createElement('label');
            switchLabel.className = 'be-switch';

            const input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = isEnabled;
            // Bind change
            input.addEventListener('change', (e: Event) => {
                const target = e.target as HTMLInputElement;
                enabledScripts[script.id] = target.checked;
            });

            const slider = document.createElement('span');
            slider.className = 'be-slider';

            switchLabel.appendChild(input);
            switchLabel.appendChild(slider);

            item.appendChild(info);
            item.appendChild(switchLabel);
            list.appendChild(item);
        });

        // Save & Reload
        saveBtn.addEventListener('click', () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledScripts));
            window.location.reload();
        });
    }

    // Wait for body
    if (document.body) {
        injectMenu();
    } else {
        window.addEventListener('DOMContentLoaded', injectMenu);
    }
}

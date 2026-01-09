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
    const availableScripts = scripts.filter((s) => s.matches(currentHost));

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
    availableScripts.forEach((script) => {
        if (enabledScripts[script.id] !== false) {
            console.log("[BoredomEngine] Running:", script.name);
            script.execute();
        }
    });

    // Inject UI
    function injectMenu() {
        console.log("[BoredomEngine] Attempting to inject menu...");
        try {
            if (document.getElementById("boredom-menu-host")) {
                console.log("[BoredomEngine] Menu already exists.");
                return;
            }

            // Extract CSS from menuHtml (since it contains <style>)
            const styleMatch = menuHtml.match(/<style>([\s\S]*?)<\/style>/);
            const cssContent = styleMatch ? styleMatch[1] : "";

            const container = document.createElement("div");
            container.id = "boredom-menu-host";
            // Attach Shadow DOM
            const shadow = container.attachShadow({ mode: "open" });

            // 1. Inject Styles
            if (cssContent) {
                const style = document.createElement("style");
                style.textContent = cssContent;
                shadow.appendChild(style);
            }

            // 2. Build DOM Structure manually to avoid Trusted Types issues
            const beContainer = document.createElement("div");
            beContainer.className = "be-container";

            // Panel
            const panel = document.createElement("div");
            panel.className = "be-panel";
            panel.id = "panel";

            const header = document.createElement("div");
            header.className = "be-header";

            const title = document.createElement("h3");
            title.className = "be-title";
            title.textContent = "Boredom Engine";

            const version = document.createElement("span");
            version.className = "be-version";
            version.textContent = "v1.0.0";

            header.appendChild(title);
            header.appendChild(version);

            const list = document.createElement("div");
            list.className = "be-content";
            list.id = "list";

            const footer = document.createElement("div");
            footer.className = "be-footer";

            const saveBtn = document.createElement("button");
            saveBtn.className = "be-btn";
            saveBtn.id = "save-btn";
            saveBtn.textContent = "Save & Reload";

            footer.appendChild(saveBtn);

            panel.appendChild(header);
            panel.appendChild(list);
            panel.appendChild(footer);

            // FAB
            const fab = document.createElement("button");
            fab.className = "be-fab";
            fab.id = "fab";
            fab.setAttribute("aria-label", "Boredom Engine Settings");

            // SVG
            const svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );
            svg.setAttribute("viewBox", "0 0 24 24");
            svg.setAttribute("fill", "none");
            svg.setAttribute("stroke", "currentColor");
            svg.setAttribute("stroke-width", "2");
            svg.setAttribute("stroke-linecap", "round");
            svg.setAttribute("stroke-linejoin", "round");

            const path = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );
            path.setAttribute("d", "M13 2L3 14h9l-1 8 10-12h-9l1-8z");

            svg.appendChild(path);
            fab.appendChild(svg);

            beContainer.appendChild(panel);
            beContainer.appendChild(fab);

            shadow.appendChild(beContainer);
            document.body.appendChild(container);

            console.log(
                "[BoredomEngine] Menu injected successfully via DOM construction."
            );

            // Event Listeners
            fab.addEventListener("click", () => {
                panel.classList.toggle("open");
            });

            // Populate List
            console.log(
                `[BoredomEngine] Populating menu with ${availableScripts.length} scripts.`
            );

            // Clear list safely
            while (list.firstChild) {
                list.removeChild(list.firstChild);
            }

            if (availableScripts.length === 0) {
                const empty = document.createElement("div");
                empty.className = "be-empty";
                empty.textContent = "No active scripts for this domain";
                list.appendChild(empty);
            }

            availableScripts.forEach((script) => {
                console.log("Appending script to menu:", script.name);
                const isEnabled = enabledScripts[script.id] !== false;

                const item = document.createElement("div");
                item.className = "be-item";

                const info = document.createElement("div");
                info.className = "be-item-info";

                const name = document.createElement("div");
                name.className = "be-item-name";
                name.textContent = script.name;

                const desc = document.createElement("div");
                desc.className = "be-item-desc";
                desc.textContent = script.description;

                info.appendChild(name);
                info.appendChild(desc);

                const switchLabel = document.createElement("label");
                switchLabel.className = "be-switch";

                const input = document.createElement("input");
                input.type = "checkbox";
                input.checked = isEnabled;
                // Bind change
                input.addEventListener("change", (e: Event) => {
                    const target = e.target as HTMLInputElement;
                    enabledScripts[script.id] = target.checked;
                });

                const slider = document.createElement("span");
                slider.className = "be-slider";

                switchLabel.appendChild(input);
                switchLabel.appendChild(slider);

                item.appendChild(info);
                item.appendChild(switchLabel);
                list.appendChild(item);
            });

            // Save & Reload
            saveBtn.addEventListener("click", () => {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(enabledScripts)
                );
                window.location.reload();
            });
        } catch (e) {
            console.error("[BoredomEngine] Failed to inject menu:", e);
        }

        // Verify injection
        setTimeout(() => {
            if (!document.getElementById("boredom-menu-host")) {
                console.error(
                    "[BoredomEngine] Menu host not found after injection attempt!"
                );
            }
        }, 1000);
    }

    // Wait for body
    if (document.body) {
        injectMenu();
    } else {
        console.log(
            "[BoredomEngine] Body not ready, waiting for DOMContentLoaded..."
        );
        if (document.readyState === "loading") {
            window.addEventListener("DOMContentLoaded", injectMenu);
        } else {
            window.addEventListener("load", injectMenu);
        }
    }
}

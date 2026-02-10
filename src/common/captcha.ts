/**
 * AI Instructions / Maintenance Notes:
 * 1) Do NOT mention Boredom Engine. The user should not associate this frustration with the engine branding.
 * 2) Do NOT mention any unaffiliated companies (reCAPTCHA, Cloudflare, Google, etc.). Use generic "Security Check" or "CAPTCHA".
 * 3) Use Lucide icons (Shield) for branding. Integrate via ES modules as documented:
 *    import { createIcons, Shield } from 'lucide';
 *    createIcons({ icons: { Shield }, root: shadowRoot });
 */

import { html, render } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { createIcons, Shield } from 'lucide';

export interface CaptchaState {
    isChecked: boolean;
    isLoading: boolean;
}

const styles = html`
<style>
    :host {
        --captcha-bg: #f9f9f9;
        --captcha-border: #d3d3d3;
        --captcha-text: #282727;
        --captcha-primary: #4a90e2;
        --captcha-success: #0f9d58;
    }

    .boredom-captcha-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #ffffff;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 2147483647;
        font-family: 'Roboto', 'Source Sans Pro', Arial, sans-serif;
        flex-direction: column;
    }

    @media (prefers-color-scheme: dark) {
        .boredom-captcha-overlay {
            background: #121212;
        }
    }

    .boredom-instruction {
        margin-bottom: 25px;
        color: #333;
        font-size: 18px;
        font-weight: 500;
        text-align: center;
        animation: boredom-fade-in 0.5s ease-out;
    }

    @media (prefers-color-scheme: dark) {
        .boredom-instruction {
            color: #e0e0e0;
        }
    }

    @keyframes boredom-fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .fkrc-checkbox-window {
        height: 74px;
        width: 300px;
        background-color: var(--captcha-bg);
        border-radius: 3px;
        border: 1px solid var(--captcha-border);
        position: relative;
        box-shadow: 0 0 4px 1px rgba(0,0,0,0.08);
        display: flex;
        align-items: center;
        padding-left: 12px;
        box-sizing: border-box;
    }

    @media (prefers-color-scheme: dark) {
        .fkrc-checkbox-window {
            background-color: #222;
            border-color: #444;
            box-shadow: 0 0 4px 1px rgba(0,0,0,0.5);
        }
    }

    .fkrc-checkbox-container {
        position: relative;
        width: 28px;
        height: 28px;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .fkrc-checkbox {
        width: 24px;
        height: 24px;
        background-color: #fff;
        border-radius: 2px;
        border: 2px solid #c1c1c1;
        cursor: pointer;
        transition: all 0.2s;
        box-sizing: border-box;
    }

    .fkrc-checkbox:hover {
        border-color: #b2b2b2;
    }

    @media (prefers-color-scheme: dark) {
        .fkrc-checkbox {
            background-color: #333;
            border-color: #555;
        }
    }

    .fkrc-checkbox.loading {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        opacity: 0;
        pointer-events: none;
    }

    .fkrc-checkbox.checked {
        border: none;
        background: transparent;
        pointer-events: none;
        display: flex;
        justify-content: center;
        align-items: center;
    }

    .fkrc-checkbox.checked::after {
        content: '';
        display: block;
        width: 6px;
        height: 14px;
        border: solid var(--captcha-success);
        border-width: 0 3px 3px 0;
        transform: rotate(45deg);
        margin-top: -2px;
    }

    .fkrc-im-not-a-robot {
        margin-left: 12px;
        font-size: 14px;
        color: var(--captcha-text);
        font-weight: 500;
        pointer-events: none;
    }

    @media (prefers-color-scheme: dark) {
        .fkrc-im-not-a-robot {
            color: #eee;
        }
    }

    .fkrc-branding-container {
        position: absolute;
        right: 12px;
        top: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--captcha-text);
        opacity: 0.6;
    }

    @media (prefers-color-scheme: dark) {
        .fkrc-branding-container {
            color: #aaa;
        }
    }

    .fkrc-branding-icon {
        width: 24px;
        height: 24px;
        margin-bottom: 2px;
    }

    .fkrc-branding-text {
        font-size: 8px;
        text-align: center;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .fkrc-spinner {
        position: absolute;
        height: 24px;
        width: 24px;
        border: 3px solid rgba(0,0,0,0.05);
        border-top: 3px solid var(--captcha-primary);
        border-radius: 50%;
        animation: fkrc-spin 1s linear infinite;
        box-sizing: border-box;
    }

    @media (prefers-color-scheme: dark) {
        .fkrc-spinner {
            border-color: rgba(255,255,255,0.1);
            border-top-color: var(--captcha-primary);
        }
    }

    @keyframes fkrc-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>
`;

export class FakeCaptcha {
    private overlay: HTMLElement | null = null;
    private resolvePromise: (() => void) | null = null;
    private state: CaptchaState = {
        isChecked: false,
        isLoading: false
    };

    private updateState(newState: Partial<CaptchaState>) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    public async trigger(): Promise<void> {
        return new Promise((resolve) => {
            if (this.overlay) return;
            this.resolvePromise = resolve;

            this.overlay = document.createElement("div");
            this.overlay.id = "boredom-captcha-host";
            document.body.appendChild(this.overlay);
            document.body.style.overflow = "hidden";

            this.render();
        });
    }

    private handleCheckboxClick() {
        if (this.state.isLoading || this.state.isChecked) return;

        this.updateState({ isLoading: true });

        // Fixed wait time + random jitter to simulate "verification"
        const delay = 4000 + Math.random() * 4000;
        setTimeout(() => {
            this.updateState({ isLoading: false, isChecked: true });

            // Wait a second with the checkmark visible before resolving
            setTimeout(() => {
                this.cleanup();
            }, 1000);
        }, delay);
    }

    private cleanup() {
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        document.body.style.overflow = "";
        if (this.resolvePromise) {
            this.resolvePromise();
            this.resolvePromise = null;
        }
    }

    private render() {
        if (!this.overlay) return;

        const { isChecked, isLoading } = this.state;

        const template = html`
            ${styles}
            <div class="boredom-captcha-overlay" @click=${(e: Event) => e.stopPropagation()}>
                <div class="boredom-instruction">
                    Please confirm you are not a robot to continue.
                </div>

                <div class="fkrc-checkbox-window">
                    <div class="fkrc-checkbox-container">
                        ${isLoading ? html`<div class="fkrc-spinner"></div>` : ''}
                        <div class="${classMap({
            'fkrc-checkbox': true,
            'loading': isLoading,
            'checked': isChecked
        })}" @click=${() => this.handleCheckboxClick()}>
                        </div>
                    </div>
                    
                    <div class="fkrc-im-not-a-robot">I'm not a robot</div>

                    <div class="fkrc-branding-container">
                        <i class="fkrc-branding-icon" data-lucide="shield"></i>
                        <div class="fkrc-branding-text">Security</div>
                    </div>
                </div>
            </div>
        `;

        const shadow = this.overlay.shadowRoot || this.overlay.attachShadow({ mode: 'open' });
        render(template, shadow);

        // Integrate Lucide icons
        createIcons({
            icons: { Shield },
            root: shadow
        });
    }
}

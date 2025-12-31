import { injectCss } from "$common";

export class FakeCaptcha {
    private overlay: HTMLElement | null = null;
    private resolvePromise: ((value: void | PromiseLike<void>) => void) | null =
        null;
    constructor() {
        this.injectStyles();
    }

    private injectStyles() {
        // Provided by Gemini
        injectCss(`
            .boredom-captcha-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(255, 255, 255, 0.98);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 2147483647; /* Max z-index */
                font-family: Roboto, Arial, sans-serif;
                user-select: none;
            }
            .boredom-captcha-box {
                background: #fff;
                border: 1px solid #d3d3d3;
                border-radius: 4px;
                padding: 16px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                width: 320px;
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .boredom-captcha-header {
                font-size: 16px;
                font-weight: 500;
                color: #333;
                margin-bottom: 5px;
            }
            .boredom-captcha-content {
                display: flex;
                align-items: center;
                background: #f9f9f9;
                border: 1px solid #d3d3d3;
                border-radius: 3px;
                padding: 20px;
                gap: 15px;
            }
            .boredom-captcha-checkbox {
                width: 24px;
                height: 24px;
                border: 2px solid #c1c1c1;
                border-radius: 2px;
                cursor: pointer;
                background: #fff;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: all 0.2s;
            }
            .boredom-captcha-checkbox:hover {
                border-color: #b0b0b0;
            }
            .boredom-captcha-checkbox.loading {
                border-color: transparent;
                border-top-color: #4285f4;
                border-right-color: #4285f4;
                border-radius: 50%;
                animation: boredom-spin 1s linear infinite;
                width: 24px;
                height: 24px;
                background: transparent;
            }
            .boredom-captcha-checkbox.checked {
                border: 0;
                background: transparent;
            }
            .boredom-captcha-checkbox.checked::after {
                content: '✔';
                color: #0f9d58;
                font-size: 26px;
            }
            .boredom-captcha-checkbox.error {
                border-color: #db4437;
            }
             /* Fake error X */
            .boredom-captcha-checkbox.error::after {
                content: '';
                display: block;
                width: 14px;
                height: 14px;
                background: #db4437;
                mask: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>');
                -webkit-mask: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>');
            }

            @keyframes boredom-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .boredom-label {
                font-size: 14px;
                color: #000;
                font-weight: 400;
            }
            .boredom-captcha-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 10px;
                color: #999;
                margin-top: 5px;
            }
            .boredom-message {
                font-size: 12px;
                color: #db4437;
                margin-top: 8px;
                min-height: 1.2em;
                text-align: center;
            }
        `);
    }

    public async trigger(): Promise<void> {
        return new Promise((resolve) => {
            if (this.overlay) return; // Already showing
            this.resolvePromise = resolve;
            this.createOverlay();
        });
    }

    private createOverlay() {
        this.overlay = document.createElement("div");
        this.overlay.className = "boredom-captcha-overlay";

        // Prevent scrolling while captive
        document.body.style.overflow = "hidden";

        const box = document.createElement("div");
        box.className = "boredom-captcha-box";

        const header = document.createElement("div");
        header.className = "boredom-captcha-header";
        header.innerText = "Security Verification";
        box.appendChild(header);

        const content = document.createElement("div");
        content.className = "boredom-captcha-content";

        const checkbox = document.createElement("div");
        checkbox.className = "boredom-captcha-checkbox";

        const label = document.createElement("span");
        label.className = "boredom-label";
        label.innerText = "I am not a robot";

        content.appendChild(checkbox);
        content.appendChild(label);
        box.appendChild(content);

        const message = document.createElement("div");
        message.className = "boredom-message";
        box.appendChild(message);

        const footer = document.createElement("div");
        footer.className = "boredom-captcha-footer";
        const imitation = document.createElement("span");
        imitation.innerText = "CAPTCHA";
        const privacy = document.createElement("span");
        privacy.innerText = "Privacy - Terms";

        footer.appendChild(imitation);
        footer.appendChild(privacy);
        box.appendChild(footer);

        this.overlay.appendChild(box);
        document.body.appendChild(this.overlay);

        checkbox.addEventListener("click", () => {
            if (
                checkbox.classList.contains("loading") ||
                checkbox.classList.contains("checked")
            )
                return;

            this.handleCheck(checkbox, message);
        });
    }

    private handleCheck(checkbox: HTMLElement, message: HTMLElement) {
        checkbox.className = "boredom-captcha-checkbox loading";
        message.innerText = "";

        // Annoying slow verification
        const delay = 2000 + Math.random() * 3000;

        setTimeout(() => {
            // Success
            checkbox.className = "boredom-captcha-checkbox checked";
            message.innerText = "";
            setTimeout(() => {
                this.cleanup();
            }, 800);
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
}

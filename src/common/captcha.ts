import { injectCss } from "$common";

export class FakeCaptcha {
    private overlay: HTMLElement | null = null;
    private resolvePromise: ((value: void | PromiseLike<void>) => void) | null =
        null;

    constructor() {
        this.injectStyles();
    }

    private injectStyles() {
        injectCss(`
            .fkrc-container {
                font-family: 'Roboto', 'Source Sans Pro', sans-serif;
            }
            .fkrc-checkbox-window {
                height: 74px;
                width: 300px;
                background-color: #f9f9f9;
                border-radius: 3px;
                border: 1px solid #d3d3d3;
                position: relative;
                box-shadow: 0 0 4px 1px rgba(0,0,0,0.08);
            }
            .fkrc-checkbox {
                position: relative;
                background-color: #fff;
                border-radius: 2px;
                height: 24px;
                width: 24px;
                border: 2px solid #c1c1c1;
                margin: 21px 0 0 12px;
                outline: none;
                transition: width 500ms, height 500ms, border-radius 500ms, margin-top 500ms, margin-left 500ms, opacity 700ms;
                cursor: pointer;
            }
            .fkrc-checkbox:hover {
                border: 2px solid #b2b2b2;
            }
            .fkrc-checkbox.checked {
                width: 28px !important;
                height: 28px !important;
                background-color: transparent !important;
                border: none !important;
                margin: 0 !important;
                opacity: 1 !important;
                display: flex;
                justify-content: center;
                align-items: center;
                position: absolute !important;
                left: 12px !important;
                top: 21px !important;
                transition: none !important;
                pointer-events: none;
            }
            .fkrc-checkbox.checked::after {
                content: '';
                display: block;
                width: 6px;
                height: 14px;
                border: solid #0f9d58;
                border-width: 0 3px 3px 0;
                transform: rotate(45deg);
                margin-top: -2px;
            }
            .fkrc-im-not-a-robot {
                position: absolute;
                left: 52px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 14px;
                color: #282727;
                font-weight: 500;
                pointer-events: none;
            }
            .boredom-instruction {
                margin-bottom: 15px;
                color: #333;
                font-size: 18px;
                font-weight: 500;
                text-align: center;
                animation: boredom-fade-in 0.5s ease-out;
            }
            @keyframes boredom-fade-in {
                from { opacity: 0; transform: translateY(-10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .fkrc-captcha-logo {
                position: absolute;
                right: 12px;
                top: 14px;
                width: 38px;
                height: 38px;
                background-image: url('https://www.gstatic.com/recaptcha/api2/logo_48.png');
                background-size: cover;
                background-repeat: no-repeat;
                opacity: 0.7;
            }
            .fkrc-checkbox-desc {
                color: #555555;
                position: absolute;
                font-size: 10px;
                text-align: center;
                right: 14px;
                bottom: 10px;
            }
            .fkrc-spinner {
                visibility: hidden;
                position: absolute;
                height: 26px;
                width: 26px;
                top: 21px;
                left: 12px;
                opacity: 0;
                transition: opacity 400ms;
                border: 3px solid #f9f9f9;
                border-top: 3px solid #4a90e2;
                border-radius: 50%;
                animation: fkrc-spin 1s linear infinite;
            }
            @keyframes fkrc-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .fkrc-verifywin-window {
                opacity: 0;
                position: absolute;
                visibility: hidden;
                width: 310px;
                background-color: #fff;
                border: 1px solid #cecece;
                box-shadow: 5px 6px 7px -3px rgba(0,0,0,0.12);
                transition: opacity 400ms;
                z-index: 2147483648;
            }
            .fkrc-verifywin-window-arrow {
                height: 0;
                width: 0;
                border-top: 6px solid transparent;
                border-bottom: 6px solid transparent;
                border-right: 6px solid #cecece;
                position: absolute;
                left: -6px;
                top: 24px;
                opacity: 0;
                transition: opacity 200ms;
            }
            .fkrc-verifywin-container {
                padding: 8px;
            }
            .fkrc-verifywin-header {
                background-color: #5a89e1;
                padding: 16px 16px 24px 16px;
                color: #fff;
            }
            .fkrc-verifywin-header-text-small {
                font-size: 14px;
                line-height: normal;
            }
            .fkrc-verifywin-header-text-big {
                font-size: 24px;
                font-weight: 700;
            }
            .fkrc-verifywin-main {
                padding: 10px 5px;
                min-height: 100px;
                background: #f0f0f0;
                display: flex;
                justify-content: center;
                align-items: center;
                color: #888;
                font-size: 12px;
            }
            .fkrc-verifywin-footer {
                border-top: 1px solid #cecece;
                padding: 10px 7px 0 7px;
                color: #737373;
                display: flex;
                justify-content: flex-end;
            }
            .fkrc-verifywin-verify-button {
                text-transform: uppercase;
                background-color: #4a90e2;
                color: #fff;
                text-align: center;
                width: 100px;
                padding: 10px 0;
                font-weight: 600;
                border-radius: 3px;
                font-size: 14px;
                border: none;
                cursor: pointer;
                outline: none;
            }
            .fkrc-verifywin-verify-button:disabled {
                background-color: #a0c0e8;
                cursor: default;
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
                font-family: Arial, sans-serif;
                flex-direction: column;
            }
        `);
    }

    public async trigger(): Promise<void> {
        return new Promise((resolve) => {
            if (this.overlay) return;
            this.resolvePromise = resolve;
            this.createOverlay();
        });
    }

    private createOverlay() {
        this.overlay = document.createElement("div");
        this.overlay.className = "boredom-captcha-overlay";
        document.body.style.overflow = "hidden";

        // Instruction Text
        const instruction = document.createElement("div");
        instruction.className = "boredom-instruction";
        instruction.innerText =
            "Please confirm you are not a robot to continue watching.";
        this.overlay.appendChild(instruction);

        // --- Checkbox Window ---
        const checkboxWindow = document.createElement("div");
        checkboxWindow.className = "fkrc-checkbox-window";

        const checkbox = document.createElement("div");
        checkbox.className = "fkrc-checkbox";

        const label = document.createElement("div");
        label.className = "fkrc-im-not-a-robot";
        label.innerText = "I'm not a robot";

        const logo = document.createElement("div");
        logo.className = "fkrc-captcha-logo";

        const desc = document.createElement("div");
        desc.className = "fkrc-checkbox-desc";
        // desc.innerHTML = `reCAPTCHA<br>Privacy - Terms`;
        desc.appendChild(document.createTextNode("reCAPTCHA"));
        desc.appendChild(document.createElement("br"));
        desc.appendChild(document.createTextNode("Privacy - Terms"));

        const spinner = document.createElement("div");
        spinner.className = "fkrc-spinner";

        checkboxWindow.appendChild(checkbox);
        checkboxWindow.appendChild(label);
        checkboxWindow.appendChild(logo);
        checkboxWindow.appendChild(desc);
        checkboxWindow.appendChild(spinner);

        // --- Verify Window ---
        const verifyWindow = document.createElement("div");
        verifyWindow.className = "fkrc-verifywin-window";

        const arrow = document.createElement("div");
        arrow.className = "fkrc-verifywin-window-arrow";
        verifyWindow.appendChild(arrow);

        const verifyContainer = document.createElement("div");
        verifyContainer.className = "fkrc-verifywin-container";

        const header = document.createElement("div");
        header.className = "fkrc-verifywin-header";

        const headerTextSmall = document.createElement("span");
        headerTextSmall.className = "fkrc-verifywin-header-text-small";
        headerTextSmall.innerText = "Select all images with";

        const headerBr = document.createElement("br");

        const headerTextBig = document.createElement("span");
        headerTextBig.className = "fkrc-verifywin-header-text-big";
        headerTextBig.innerText = "boredom";

        header.appendChild(headerTextSmall);
        header.appendChild(headerBr);
        header.appendChild(headerTextBig);

        const main = document.createElement("div");
        main.className = "fkrc-verifywin-main";
        main.innerText = "(No images available)";

        const footer = document.createElement("div");
        footer.className = "fkrc-verifywin-footer";

        const verifyBtn = document.createElement("button");
        verifyBtn.className = "fkrc-verifywin-verify-button";
        verifyBtn.innerText = "Verify";

        footer.appendChild(verifyBtn);
        verifyContainer.appendChild(header);
        verifyContainer.appendChild(main);
        verifyContainer.appendChild(footer);
        verifyWindow.appendChild(verifyContainer);

        // Append everything
        this.overlay.appendChild(checkboxWindow);
        this.overlay.appendChild(verifyWindow);
        document.body.appendChild(this.overlay);

        // Bind Events
        this.bindEvents(
            checkboxWindow,
            checkbox,
            spinner,
            verifyWindow,
            arrow,
            verifyBtn
        );
    }

    private bindEvents(
        checkboxWindow: HTMLElement,
        checkboxBtn: HTMLElement,
        spinner: HTMLElement,
        verifyWindow: HTMLElement,
        arrow: HTMLElement,
        verifyBtn: HTMLButtonElement
    ) {
        const showVerifyWindow = () => {
            // Logic from fakerecaptcha.js: calculations relative to checkbox window
            verifyWindow.style.display = "block";
            verifyWindow.style.visibility = "visible";
            verifyWindow.style.opacity = "1";

            const boxRect = checkboxWindow.getBoundingClientRect();

            verifyWindow.style.top = checkboxWindow.offsetTop - 80 + "px";
            verifyWindow.style.left = checkboxWindow.offsetLeft + 54 + "px";

            // Bounds checking (simplified from original)
            if (
                verifyWindow.offsetLeft + verifyWindow.offsetWidth >
                window.innerWidth - 10
            ) {
                verifyWindow.style.left = checkboxWindow.offsetLeft - 8 + "px"; // Shift left?
            } else {
                arrow.style.visibility = "visible";
                arrow.style.opacity = "1";
            }
        };

        const runClickedCheckboxEffects = () => {
            // Hide checkbox -> small dot
            checkboxBtn.style.width = "4px";
            checkboxBtn.style.height = "4px";
            checkboxBtn.style.borderRadius = "50%";
            checkboxBtn.style.marginLeft = "25px";
            checkboxBtn.style.marginTop = "33px";
            checkboxBtn.style.opacity = "0";

            setTimeout(() => {
                // Show Spinner
                spinner.style.visibility = "visible";
                spinner.style.opacity = "1";
            }, 500);

            const delay = 5000 + Math.random() * 5000;
            setTimeout(() => {
                spinner.style.visibility = "hidden";
                spinner.style.opacity = "0";

                // Show checked state
                checkboxBtn.classList.add("checked");

                // Wait a bit then done
                setTimeout(() => {
                    this.cleanup();
                }, 1000);
            }, delay);
        };

        checkboxBtn.addEventListener("click", (e) => {
            e.preventDefault();
            // Disable further clicks
            checkboxBtn.style.pointerEvents = "none";
            runClickedCheckboxEffects();
        });

        verifyBtn.addEventListener("click", (e) => {
            e.preventDefault();
            verifyBtn.disabled = true;
            // Simulate network delay
            setTimeout(() => {
                this.cleanup();
            }, 500);
        });
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

import { html, render } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { ScriptMetadata } from './client';
import { Intensity } from '../../../src/common/intensity';

export interface UIState {
  enabledScripts: Record<string, boolean>;
  currentTab: 'site' | 'generic';
  isOpen: boolean;
  siteScripts: ScriptMetadata[];
  genericScripts: ScriptMetadata[];
  intensity: Intensity;
}

const styles = html`
<style>
  :host {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    --primary: #6366f1;
    --primary-hover: #4f46e5;
    --bg: rgba(15, 23, 42, 0.95);
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --border: rgba(255, 255, 255, 0.1);
    
    position: fixed;
    top: 0;
    left: 0;
    width: 0;
    height: 0;
    z-index: 100000;
    pointer-events: none;
  }

  .be-container {
    pointer-events: auto;
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 2147483647;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  /* Floating Action Button */
  .be-fab {
    width: 56px;
    height: 56px;
    border-radius: 28px;
    background: var(--primary);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s, box-shadow 0.2s;
    border: none;
    outline: none;
    color: white;
  }

  .be-fab:hover {
    background: var(--primary-hover);
    transform: scale(1.05);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }

  .be-fab:active {
    transform: scale(0.95);
  }

  .be-fab svg {
    width: 24px;
    height: 24px;
    pointer-events: none;
  }

  /* Panel */
  .be-panel {
    position: absolute;
    bottom: 70px;
    right: 0;
    width: 320px;
    background: var(--bg);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    opacity: 0;
    visibility: hidden;
    transform: translateY(10px) scale(0.95);
    transform-origin: bottom right;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    pointer-events: none;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .be-panel.open {
    opacity: 1;
    visibility: visible;
    transform: translateY(0) scale(1);
    pointer-events: auto;
  }

  .be-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .be-title {
    font-weight: 600;
    font-size: 16px;
    color: var(--text);
    margin: 0;
  }

  .be-version {
    font-size: 11px;
    color: var(--text-muted);
    background: rgba(255,255,255,0.05);
    padding: 2px 6px;
    border-radius: 4px;
  }

  .be-content {
    padding: 12px 0;
    max-height: 400px;
    overflow-y: auto;
    flex: 1;
  }

  .be-empty {
    padding: 24px 20px;
    text-align: center;
    color: var(--text-muted);
    font-size: 14px;
  }

  .be-item {
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    transition: background 0.15s;
  }

  .be-item:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .be-item-info {
    flex: 1;
  }

  .be-item-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
    margin-bottom: 4px;
  }

  .be-item-desc {
    font-size: 12px;
    color: var(--text-muted);
    line-height: 1.4;
  }

  /* Switch */
  .be-switch {
    position: relative;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
  }

  .be-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .be-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255,255,255,0.1);
    transition: .3s;
    border-radius: 24px;
  }

  .be-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: var(--text-muted);
    transition: .3s;
    border-radius: 50%;
  }

  input:checked + .be-slider {
    background-color: var(--primary);
  }

  input:checked + .be-slider:before {
    transform: translateX(20px);
    background-color: white;
  }

  .be-footer {
    padding: 16px 20px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
  }

  .be-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .be-btn:hover {
    background: var(--primary-hover);
  }
  
  /* Scrollbar */
  .be-content::-webkit-scrollbar {
    width: 6px;
  }
  
  .be-content::-webkit-scrollbar-track {
    background: transparent;
  }
  
  .be-content::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.1); 
    border-radius: 3px;
  }
  
  .be-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.2); 
  }

  /* Tabs */
  .be-tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    margin-bottom: 0px;
  }

  .be-tab {
    flex: 1;
    text-align: center;
    padding: 12px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    transition: all 0.2s;
    border-bottom: 2px solid transparent;
  }

  .be-tab:hover {
    color: var(--text);
    background: rgba(255,255,255,0.03);
  }

  .be-tab.active {
    color: var(--primary);
    border-bottom: 2px solid var(--primary);
    background: rgba(255,255,255,0.05);
  }

  /* Intensity Selector */
  .be-intensity-section {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .be-intensity-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-muted);
    margin-bottom: 8px;
    display: block;
  }

  .be-select {
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border);
    color: var(--text);
    padding: 8px 12px;
    border-radius: 8px;
    font-size: 13px;
    outline: none;
    cursor: pointer;
  }
  
  .be-select:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.2);
  }

  .be-select option {
    background: #0f172a; /* Fallback */
    color: var(--text);
  }
</style>
`;

export function setupUI(
  container: HTMLElement,
  initialState: UIState,
  onToggle: (id: string, enabled: boolean) => void,
  onIntensityChange: (intensity: Intensity) => void,
  onSave: () => void
) {
  let state = { ...initialState };
  const shadow = container.shadowRoot || container.attachShadow({ mode: "open" });

  function updateState(newState: Partial<UIState>) {
    state = { ...state, ...newState };
    renderUI();
  }

  function renderUI() {
    const { currentTab, isOpen, enabledScripts, siteScripts, genericScripts, intensity } = state;
    const scriptsToShow = currentTab === 'site' ? siteScripts : genericScripts;

    const template = html`
            ${styles}
            <div class="be-container">
                <div class=${classMap({ 'be-panel': true, 'open': isOpen })}>
                    <div class="be-header">
                        <h3 class="be-title">Boredom Engine</h3>
                        <span class="be-version">v1.0.0</span>
                    </div>
                    
                    <div class="be-tabs">
                        <div class=${classMap({ 'be-tab': true, 'active': currentTab === 'site' })} 
                             @click=${() => updateState({ currentTab: 'site' })}>
                            Site
                        </div>
                        <div class=${classMap({ 'be-tab': true, 'active': currentTab === 'generic' })} 
                             @click=${() => updateState({ currentTab: 'generic' })}>
                            Generic
                        </div>
                    </div>

                    <div class="be-intensity-section">
                        <label class="be-intensity-label">Intensity Level</label>
                        <select class="be-select" @change=${(e: any) => onIntensityChange(e.target.value as Intensity)}>
                            ${Object.values(Intensity).map(val => html`
                                <option value="${val}" ?selected=${intensity === val}>
                                    ${val.charAt(0).toUpperCase() + val.slice(1)}
                                </option>
                            `)}
                        </select>
                    </div>

                    <div class="be-content">
                        ${scriptsToShow.length === 0
        ? html`<div class="be-empty">${currentTab === 'generic' ? 'No generic scripts available' : 'No active scripts for this domain'}</div>`
        : scriptsToShow.map(script => {
          const isChecked = script.type === 'generic'
            ? enabledScripts[script.id] === true
            : enabledScripts[script.id] !== false;

          return html`
                                    <div class="be-item">
                                        <div class="be-item-info">
                                            <div class="be-item-name">${script.name}</div>
                                            <div class="be-item-desc">${script.description}</div>
                                        </div>
                                        <label class="be-switch">
                                            <input type="checkbox" 
                                                .checked=${isChecked}
                                                @change=${(e: any) => onToggle(script.id, e.target.checked)}>
                                            <span class="be-slider"></span>
                                        </label>
                                    </div>
                                `;
        })
      }
                    </div>

                    <div class="be-footer">
                        <button class="be-btn" @click=${onSave}>Save & Reload</button>
                    </div>
                </div>

                <button class="be-fab" @click=${() => updateState({ isOpen: !state.isOpen })} aria-label="Boredom Engine Settings">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                    </svg>
                </button>
            </div>
        `;

    render(template, shadow);
  }

  renderUI();
}

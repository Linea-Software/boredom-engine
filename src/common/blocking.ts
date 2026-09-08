import { injectCss } from "./styling";

export type UrlPredicate = (url: URL) => boolean;

export interface RedirectRule {
    when: UrlPredicate;
    to: string | ((url: URL) => string);
}

export interface MediaSuppression {
    containers: readonly string[];
    mute?: boolean;
    pause?: boolean;
}

export interface InterfaceBlockOptions {
    /** Stable script/feature id. Used only when route-scoping CSS. */
    id: string;
    /** CSS selectors to collapse with display:none !important. */
    selectors?: readonly string[];
    /** Optional route predicate controlling whether the CSS block is active. */
    activeWhen?: UrlPredicate;
    /** Optional redirect rule(s) for routes that should not remain reachable. */
    redirect?: RedirectRule | readonly RedirectRule[];
    /** Optional media handling for content hidden by this block. */
    media?: MediaSuppression;
}

const NAVIGATION_EVENT = "boredom-engine:navigation";
const NAVIGATION_PATCH_KEY = "__BOREDOM_NAVIGATION_PATCHED__";

function dispatchNavigation(): void {
    window.dispatchEvent(new Event(NAVIGATION_EVENT));
}

function installNavigationEvents(): void {
    const globalState = window as unknown as Record<string, unknown>;
    if (globalState[NAVIGATION_PATCH_KEY] === true) return;
    globalState[NAVIGATION_PATCH_KEY] = true;

    window.addEventListener("popstate", dispatchNavigation);
    window.addEventListener("hashchange", dispatchNavigation);

    for (const method of ["pushState", "replaceState"] as const) {
        const original = history[method];
        history[method] = function (
            this: History,
            ...args: Parameters<History[typeof method]>
        ) {
            const result = original.apply(this, args);
            dispatchNavigation();
            return result;
        } as History[typeof method];
    }
}

function onNavigation(callback: () => void): void {
    installNavigationEvents();
    window.addEventListener(NAVIGATION_EVENT, callback);
    callback();
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", callback, { once: true });
    }
}

function normalizeSelectors(selectors: readonly string[] | undefined): string[] {
    return [...new Set((selectors ?? []).map((selector) => selector.trim()).filter(Boolean))];
}

function routeScopeAttribute(id: string): string {
    const normalized = id.toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
    return `data-boredom-block-${normalized}`;
}

function installCssBlock(
    id: string,
    selectors: readonly string[],
    activeWhen?: UrlPredicate,
): (() => void) | null {
    const normalized = normalizeSelectors(selectors);
    if (normalized.length === 0) return null;

    const scopeAttribute = activeWhen ? routeScopeAttribute(id) : null;
    const scopedSelectors = normalized.map((selector) =>
        scopeAttribute ? `:root[${scopeAttribute}="true"] ${selector}` : selector,
    );

    injectCss(`
        ${scopedSelectors.join(",\n        ")} {
            display: none !important;
        }
    `);

    if (!activeWhen || !scopeAttribute) return null;

    return () => {
        const root = document.documentElement;
        if (!root) return;
        const active = activeWhen(new URL(window.location.href));
        if (active) root.setAttribute(scopeAttribute, "true");
        else root.removeAttribute(scopeAttribute);
    };
}

function normalizeRedirects(
    redirect: RedirectRule | readonly RedirectRule[] | undefined,
): readonly RedirectRule[] {
    if (!redirect) return [];
    return "when" in redirect ? [redirect] : redirect;
}

function installMediaSuppression(media: MediaSuppression): void {
    const containers = normalizeSelectors(media.containers);
    if (containers.length === 0) return;

    const shouldMute = media.mute !== false;
    const shouldPause = media.pause !== false;

    const appliesTo = (element: HTMLMediaElement): boolean =>
        containers.some((selector) => element.closest(selector) !== null);

    const suppress = (element: HTMLMediaElement): void => {
        if (!appliesTo(element)) return;
        if (shouldMute && !element.muted) element.muted = true;
        if (shouldPause && !element.paused) element.pause();
    };

    const scan = () => {
        for (const selector of containers) {
            document.querySelectorAll(selector).forEach((container) => {
                if (container instanceof HTMLMediaElement) suppress(container);
                container.querySelectorAll("video, audio").forEach((element) => {
                    if (element instanceof HTMLMediaElement) suppress(element);
                });
            });
        }
    };

    // Hidden autoplaying media can still consume attention/resources. Capture
    // future play events instead of polling the DOM every few hundred ms.
    document.addEventListener(
        "play",
        (event) => {
            if (event.target instanceof HTMLMediaElement) suppress(event.target);
        },
        true,
    );

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", scan, { once: true });
    } else {
        scan();
    }
}

/**
 * Declaratively blocks distracting interface pieces.
 *
 * CSS is intentionally the primary mechanism: selectors automatically apply
 * to nodes inserted later by React/Vue/etc., so ordinary interface hiding does
 * not need MutationObservers, DOM removal, or polling loops. JavaScript is kept
 * for route control and media side effects only.
 */
export function blockInterface(options: InterfaceBlockOptions): void {
    const refreshRouteScope = installCssBlock(
        options.id,
        options.selectors ?? [],
        options.activeWhen,
    );
    const redirects = normalizeRedirects(options.redirect);

    if (refreshRouteScope || redirects.length > 0) {
        onNavigation(() => {
            refreshRouteScope?.();

            const url = new URL(window.location.href);
            for (const rule of redirects) {
                if (!rule.when(url)) continue;
                const target = typeof rule.to === "function" ? rule.to(url) : rule.to;
                if (new URL(target, url).href !== url.href) window.location.replace(target);
                return;
            }
        });
    }

    if (options.media) installMediaSuppression(options.media);
}

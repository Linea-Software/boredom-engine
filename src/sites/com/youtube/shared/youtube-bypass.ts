import { setAudioDelay } from "$common";

// Types
export type VideoQuality = 'tiny' | 'small' | 'medium' | 'large' | 'hd720' | 'hd1080' | 'highres' | 'default';

export interface BypassConfig {
    quality: VideoQuality;
    audioDelay: number;
    grayscale: number; // 0-1
    contrast: number; // 1 = normal
    saturate: number; // 1 = normal
}

export class YouTubeBypassController {
    private static instance: YouTubeBypassController;
    private config: BypassConfig = {
        quality: 'hd1080',
        audioDelay: 0,
        grayscale: 0,
        contrast: 1,
        saturate: 1
    };

    // Selectors from the original script
    private readonly PLAYER_SELECTORS = [
        '#player',
        '#movie_player',
        'ytd-player',
        '#player-container[role="complementary"]'
    ];

    private readonly RETRY_ATTEMPTS = 10;
    private readonly RETRY_DELAY = 800;

    private currentIframe: HTMLIFrameElement | null = null;
    private audioContext: AudioContext | null = null;

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): YouTubeBypassController {
        if (!YouTubeBypassController.instance) {
            YouTubeBypassController.instance = new YouTubeBypassController();
        }
        return YouTubeBypassController.instance;
    }

    /**
     * Initializes the bypass mechanism and hooks into navigation events.
     */
    private initialized = false;

    /**
     * Initializes the bypass mechanism and hooks into navigation events.
     */
    public init() {
        if (this.initialized) return;
        this.initialized = true;
        console.log('🚀 YouTube Player Bypass (Modern) Controller initialized');
        this.hookNavigation();
        this.replacePlayer();
    }

    /* ---------------------------------------------------------
       Public API for manipulation
    --------------------------------------------------------- */

    /**
     * Sets the preferred video quality. Triggers a player reload if changed.
     */
    public setQuality(quality: VideoQuality) {
        if (this.config.quality !== quality) {
            this.config.quality = quality;
            this.replacePlayer(); // Need to recreate iframe for param change effectively without API
        }
    }

    /**
     * Sets visual filters on the player.
     * @param grayscale 0 to 1 (1 = black and white)
     * @param contrast 1 is normal
     * @param saturate 1 is normal
     */
    public setFilters(grayscale: number, contrast: number = 1, saturate: number = 1) {
        this.config.grayscale = grayscale;
        this.config.contrast = contrast;
        this.config.saturate = saturate;
        this.applyFilters();
    }

    /**
     * Updates specific visual filters on the player.
     * @param filters Partial filter configuration
     */
    public updateFilters(filters: Partial<{ grayscale: number; contrast: number; saturate: number }>) {
        if (filters.grayscale !== undefined) this.config.grayscale = filters.grayscale;
        if (filters.contrast !== undefined) this.config.contrast = filters.contrast;
        if (filters.saturate !== undefined) this.config.saturate = filters.saturate;
        this.applyFilters();
    }

    /**
     * Sends a command to the YouTube iframe API.
     */
    private sendCommand(func: string, args: any[] = []) {
        if (!this.currentIframe || !this.currentIframe.contentWindow) return;
        this.currentIframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: func,
            args: args
        }), '*');
    }

    /**
     * Enforces a specific video quality via API commands.
     * Use this to aggressively set quality without reloading player.
     */
    public enforceQuality(quality: VideoQuality) {
        this.config.quality = quality;
        this.sendCommand('setPlaybackQuality', [quality]);
        this.sendCommand('setPlaybackQualityRange', [quality, quality]);
    }

    /**
     * Sets an audio delay on the playing video.
     * @param seconds Delay in seconds
     */
    public setAudioDelay(seconds: number) {
        this.config.audioDelay = seconds;
        this.applyAudioEffects();
    }

    /**
     * Gets the underlying video element from the iframe if available.
     */
    public getVideoElement(): HTMLVideoElement | null {
        if (!this.currentIframe) {
            return null;
        }
        try {
            return this.currentIframe.contentDocument?.querySelector('video') || null;
        } catch (e) {
            return null;
        }
    }

    /**
     * Simulates buffering by pausing video and showing a spinner.
     * @param duration Duration in ms
     */
    public simulateBuffering(duration: number) {
        const video = this.getVideoElement();
        if (!video || video.paused) return;

        video.pause();

        const container = this.currentIframe?.parentElement;
        if (!container) return;

        const spinner = document.createElement('div');
        spinner.className = 'boredom-spinner';
        spinner.style.cssText = `
            position: absolute;
            top: 50%; left: 50%;
            width: 64px; height: 64px;
            margin-top: -32px; margin-left: -32px;
            border: 8px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top: 8px solid #fff;
            animation: boredom-spin 1s linear infinite;
            z-index: 2000; /* Above iframe */
            pointer-events: none;
        `;

        const styleId = 'boredom-spinner-style';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                @keyframes boredom-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // We assume container is relative/absolute.
        // The iframe is created with width/height 100%.
        // The container usually is the #player-container.
        container.style.position = 'relative';
        container.appendChild(spinner);

        video.dispatchEvent(new CustomEvent('BoredomFakeBufferStart'));

        setTimeout(() => {
            spinner.remove();

            video.play().catch(console.error);
        }, duration);
    }

    /* ---------------------------------------------------------
       Internal Logic
    --------------------------------------------------------- */

    private sleep(ms: number) {
        return new Promise(r => setTimeout(r, ms));
    }

    private getVideoId(): string | null {
        try {
            return new URL(window.location.href).searchParams.get('v');
        } catch {
            return null;
        }
    }

    private findPlayerContainer(): HTMLElement | null {
        for (const sel of this.PLAYER_SELECTORS) {
            const el = document.querySelector<HTMLElement>(sel);
            if (el) return el;
        }
        return null;
    }

    private stopNativePlayback() {
        document.querySelectorAll('video, audio').forEach((el: any) => {
            try {
                if (el !== this.currentIframe) { // Don't kill our own iframe's video if we could see it (we can't usually)
                    if (el.tagName === 'VIDEO' || el.tagName === 'AUDIO') {
                        el.pause();
                        el.src = '';
                        el.load();
                        el.remove();
                    }
                }
            } catch (e) { }
        });
    }

    private createIframe(videoId: string): HTMLIFrameElement {
        const iframe = document.createElement('iframe');

        const params = new URLSearchParams({
            autoplay: '1',
            rel: '0',
            modestbranding: '1',
            enablejsapi: '1',
            controls: '1',
            fs: '1',
            origin: window.location.origin,
            quality: this.config.quality
        });

        iframe.src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
        iframe.title = 'YouTube video player';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        // @ts-ignore
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';

        Object.assign(iframe.style, {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: '12px'
        });

        return iframe;
    }

    private async replacePlayer(attempts = this.RETRY_ATTEMPTS): Promise<void> {
        if (!window.location.href.includes("/watch")) return;
        const videoId = this.getVideoId();
        if (!videoId) return;

        const container = this.findPlayerContainer();

        if (!container && attempts > 0) {
            await this.sleep(this.RETRY_DELAY);
            return this.replacePlayer(attempts - 1);
        }

        if (!container) {
            console.warn('❌ Player container not found');
            return;
        }

        // Check if we already have the correct iframe
        const existingIframe = container.querySelector('iframe[title="YouTube video player"]') as HTMLIFrameElement;
        if (existingIframe) {
            if (existingIframe.src.includes(videoId)) {
                this.currentIframe = existingIframe;
                this.applyFilters();
                // Attempt to apply audio effects (might need retry if frame not loaded)
                this.scheduleAudioEffectApplication();
                return;
            }
        }

        try {
            this.stopNativePlayback();

            container.textContent = '';
            const iframe = this.createIframe(videoId);
            container.appendChild(iframe);
            this.currentIframe = iframe;

            this.applyFilters();
            this.scheduleAudioEffectApplication();

            console.log('✅ YouTube player replaced');
        } catch (err) {
            console.error('❌ Failed to replace player', err);
        }
    }

    private applyFilters() {
        if (!this.currentIframe) return;
        const filters = [
            `grayscale(${this.config.grayscale})`,
            `contrast(${this.config.contrast})`,
            `saturate(${this.config.saturate})`
        ];
        this.currentIframe.style.filter = filters.join(' ');
    }

    private scheduleAudioEffectApplication() {
        if (!this.currentIframe) return;

        const tryApply = () => {
            try {
                // Accessing contentDocument might throw if cross-origin
                const doc = this.currentIframe?.contentDocument;
                if (doc) {
                    const video = doc.querySelector('video');
                    if (video) {
                        this.applyAudioEffectsToElement(video);
                    } else {
                        // Retry?
                        setTimeout(tryApply, 1000);
                    }
                }
            } catch (e) {
                // console.warn("Cannot access iframe content for audio effects (CORS?):", e);
            }
        };

        if (this.currentIframe.contentDocument && this.currentIframe.contentDocument.readyState === 'complete') {
            tryApply();
        } else {
            this.currentIframe.addEventListener('load', tryApply);
        }
    }

    private applyAudioEffects() {
        this.scheduleAudioEffectApplication();
    }

    private applyAudioEffectsToElement(video: HTMLVideoElement) {
        if (this.config.audioDelay > 0) {
            const ctx = setAudioDelay(video, this.config.audioDelay);
            if (ctx) {
                this.audioContext = ctx;
            }
        }
    }

    private hookNavigation() {
        const handler = () => this.replacePlayer();

        window.addEventListener('yt-navigate-finish', handler);
        window.addEventListener('yt-page-data-updated', handler);

        // Fallback
        let lastUrl = window.location.href;
        setInterval(() => {
            if (window.location.href !== lastUrl) {
                lastUrl = window.location.href;
                this.replacePlayer();
            }
        }, 1000);
    }
}

// Default export for auto-run behavior
// Automatically initialize when imported
const bypass = YouTubeBypassController.getInstance();
try {
    bypass.init();
} catch (e) {
    console.error("Failed to initialize YouTube Bypass:", e);
}

// Expose on window for debugging or external scripts
(window as any).YouTubeBypass = bypass;

export default function main() {
    // No-op, already initialized
}

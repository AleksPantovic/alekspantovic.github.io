console.log("--> pluginadapter.js: File started execution.");

import { PluginAdapter } from '@coyoapp/plugin-adapter';

export class DemoPlugin {
    constructor() {
        console.log("DemoPlugin constructor called.");

        new PluginAdapter().init().then(result => {
            // v0.2.0+ claims API: claims are now nested objects, not dot-separated keys
            // result.claims.cfg.test1, result.claims.cfg.test2, result.claims.ctx.test1, etc.
            const claims = result.claims || result;

            // Prefer config, fallback to context if not set
            const test1 = claims.cfg?.test1 ?? claims.ctx?.test1 ?? 'No Test1';
            const test2 = claims.cfg?.test2 ?? claims.ctx?.test2 ?? 'No Test2';

            this.updateSpanText('test1', test1);
            this.updateSpanText('test2', test2);
        }).catch(error => {
            this.updateSpanText('test1', `Error: ${error?.message || error || 'Unknown error'}`);
            this.updateSpanText('test2', `Error: ${error?.message || error || 'Unknown error'}`);
        });
    }

    private updateSpanText(id: string, text: string) {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = text;
        }
    }
}

new DemoPlugin();
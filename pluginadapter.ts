console.log("--> pluginadapter.js: File started execution.");

import { PluginAdapter } from '@coyoapp/plugin-adapter';

export class DemoPlugin {
    constructor() {
        console.log("DemoPlugin constructor called.");

        new PluginAdapter().init().then(result => {
            // Use only data keys defined in your manifest: userName and spotifyTitle
            const pluginData: any = result?.claims || result;

            // userName from context
            const userName = pluginData['ctx.userName'];
            this.updateSpanText('userName', userName || 'Guest');

            // spotifyTitle from config
            const spotifyTitle = pluginData['cfg.spotifyTitle'];
            this.updateSpanText('spotifyTitle', spotifyTitle || 'No Spotify Title');
        }).catch(error => {
            this.updateSpanText('userName', `Error: ${error?.message || error || 'Unknown error'}`);
            this.updateSpanText('spotifyTitle', `Error: ${error?.message || error || 'Unknown error'}`);
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
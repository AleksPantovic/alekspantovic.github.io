// pluginadapter.ts
import { PluginAdapter } from '@coyoapp/plugin-adapter';

export class DemoPlugin {
    constructor() {
        // Initialize the PluginAdapter and fetch context/config data
        new PluginAdapter().init().then(data => {
            // Cast to any to avoid type errors with ctx.* and cfg.* properties
            const pluginData: any = data;

            console.log("Haiilo Plugin Data Received:", pluginData); // Log the full data object for debugging

            // --- Access and display Context Data ---
            const userName = pluginData['ctx.userName'];
            this.updateSpanText('userName', userName || 'Guest'); // Default to 'Guest' if not provided

            // --- Access and display Config Data ---
            const apiKey = pluginData['cfg.apiKey'];
            this.updateSpanText('apiKey', apiKey || 'Not set'); // Display API Key from config

            const customTitle = pluginData['cfg.customTitle'];
            this.updateSpanText('customTitle', customTitle || 'No custom title'); // Display Custom Title from config

            const background = pluginData['cfg.background'];
            this.updateSpanText('background', background || 'Default (no color)'); // Display Background color text
            this.setBackgroundColor(background); // Apply background color

            const spotifyLink = pluginData['cfg.spotifyLink'];
            this.updateSpanText('spotifyLink', spotifyLink || 'No Spotify link'); // Display Spotify Link text

            const spotifyLayout = pluginData['cfg.spotifyLayout'];
            this.updateSpanText('spotifyLayout', spotifyLayout || 'No Spotify layout'); // Display Spotify Layout text

            // Add Spotify iframe if link and layout are available
            if (spotifyLink && spotifyLayout) {
                this.addSpotify(spotifyLink, spotifyLayout as "LARGE" | "COMPACT");
            }
        }).catch(error => {
            console.error("Error initializing Haiilo Plugin Adapter:", error);
            // Optionally, update a status element on the page to show the error
            this.updateSpanText('userName', 'Error loading plugin data!');
            this.updateSpanText('apiKey', 'Error');
            this.updateSpanText('customTitle', 'Error');
            this.updateSpanText('background', 'Error');
            this.updateSpanText('spotifyLink', 'Error');
            this.updateSpanText('spotifyLayout', 'Error');
        });
    }

    /**
     * Helper method to update the text content of a span element by its ID.
     * @param id The ID of the span element.
     * @param text The text content to set.
     */
    private updateSpanText(id: string, text: string) {
        const element = document.getElementById(id);
        if (element) {
            element.innerText = text;
        } else {
            console.warn(`Element with ID '${id}' not found.`);
        }
    }

    /**
     * Sets the background color of the body.
     * @param color The CSS color value.
     */
    private setBackgroundColor(color: string) {
        if (color) {
            document.body.style.backgroundColor = color;
        }
    }

    /**
     * Adds a Spotify iframe to the document body.
     * @param spotifyLink The Spotify share link.
     * @param spotifyLayout The desired layout (LARGE or COMPACT).
     */
    private addSpotify(spotifyLink: string, spotifyLayout: "LARGE" | "COMPACT") {
        const spotifyFrame = document.createElement("iframe");
        spotifyFrame.width = '300';
        spotifyFrame.height = spotifyLayout === "LARGE" ? '380' : '80';
        spotifyFrame.allow = "encrypted-media";
        // Convert the share link to an embed link
        spotifyFrame.src = spotifyLink.replace('https://open.spotify.com', 'https://open.spotify.com/embed');
        document.body.appendChild(spotifyFrame);
    }
}

// Instantiate the plugin to start its execution when the script loads
new DemoPlugin();
// pluginadapter.ts
import { PluginAdapter } from '@coyoapp/plugin-adapter';

export class DemoPlugin {
    constructor() {
        console.log("DemoPlugin constructor called."); // Log when constructor starts

        // Initialize the PluginAdapter and fetch context/config data
        new PluginAdapter().init().then(data => {
            // Cast to any to avoid type errors with ctx.* and cfg.* properties
            const pluginData: any = data;

            // --- IMPORTANT: Log the full received data object ---
            console.log("Haiilo Plugin Data Received (raw):", data);
            console.log("Haiilo Plugin Data Received (casted):", pluginData);

            // Check if pluginData has expected structure
            if (pluginData && typeof pluginData === 'object') {
                console.log("Data is an object. Proceeding to extract values.");

                // --- Access and display Context Data ---
                const userName = pluginData['ctx.userName'];
                console.log("Extracted userName:", userName);
                this.updateSpanText('userName', userName || 'Guest'); // Default to 'Guest' if not provided

                // --- Access and display Config Data ---
                const apiKey = pluginData['cfg.apiKey'];
                console.log("Extracted apiKey:", apiKey);
                this.updateSpanText('apiKey', apiKey || 'Not set'); // Display API Key from config

                const customTitle = pluginData['cfg.customTitle'];
                console.log("Extracted customTitle:", customTitle);
                this.updateSpanText('customTitle', customTitle || 'No custom title'); // Display Custom Title from config

                const background = pluginData['cfg.background'];
                console.log("Extracted background:", background);
                this.updateSpanText('background', background || 'Default (no color)'); // Display Background color text
                this.setBackgroundColor(background); // Apply background color

                const spotifyLink = pluginData['cfg.spotifyLink'];
                console.log("Extracted spotifyLink:", spotifyLink);
                this.updateSpanText('spotifyLink', spotifyLink || 'No Spotify link'); // Display Spotify Link text

                const spotifyLayout = pluginData['cfg.spotifyLayout'];
                console.log("Extracted spotifyLayout:", spotifyLayout);
                this.updateSpanText('spotifyLayout', spotifyLayout || 'No Spotify layout'); // Display Spotify Layout text

                // Add Spotify iframe if link and layout are available
                if (spotifyLink && spotifyLayout) {
                    console.log("Attempting to add Spotify iframe.");
                    this.addSpotify(spotifyLink, spotifyLayout as "LARGE" | "COMPACT");
                } else {
                    console.log("Spotify link or layout missing, not adding iframe.");
                }

            } else {
                console.warn("Haiilo Plugin Data is not an object or is null:", pluginData);
                this.updateSpanText('userName', 'No plugin data received.');
                this.updateSpanText('apiKey', 'No plugin data received.');
                this.updateSpanText('customTitle', 'No plugin data received.');
                this.updateSpanText('background', 'No plugin data received.');
                this.updateSpanText('spotifyLink', 'No plugin data received.');
                this.updateSpanText('spotifyLayout', 'No plugin data received.');
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
            console.log(`Updated span '${id}' with text: '${text}'`); // Log successful span update
        } else {
            console.warn(`Element with ID '${id}' not found. Cannot update.`);
        }
    }

    /**
     * Sets the background color of the body.
     * @param color The CSS color value.
     */
    private setBackgroundColor(color: string) {
        if (color) {
            document.body.style.backgroundColor = color;
            console.log(`Set background color to: '${color}'`);
        } else {
            console.log("No background color provided.");
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
        console.log(`Spotify iframe added with link: ${spotifyFrame.src} and layout: ${spotifyLayout}`);
    }
}

// Instantiate the plugin to start its execution when the script loads
new DemoPlugin();
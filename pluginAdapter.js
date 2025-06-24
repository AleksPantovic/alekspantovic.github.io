"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DemoPlugin = void 0;
// pluginadapter.ts
var plugin_adapter_1 = require("@coyoapp/plugin-adapter");
var DemoPlugin = /** @class */ (function () {
    function DemoPlugin() {
        var _this = this;
        // Initialize the PluginAdapter and fetch context/config data
        new plugin_adapter_1.PluginAdapter().init().then(function (data) {
            // Cast to any to avoid type errors with ctx.* and cfg.* properties
            var pluginData = data;
            console.log("Haiilo Plugin Data Received:", pluginData); // Log the full data object for debugging
            // --- Access and display Context Data ---
            var userName = pluginData['ctx.userName'];
            _this.updateSpanText('userName', userName || 'Guest'); // Default to 'Guest' if not provided
            // --- Access and display Config Data ---
            var apiKey = pluginData['cfg.apiKey'];
            _this.updateSpanText('apiKey', apiKey || 'Not set'); // Display API Key from config
            var customTitle = pluginData['cfg.customTitle'];
            _this.updateSpanText('customTitle', customTitle || 'No custom title'); // Display Custom Title from config
            var background = pluginData['cfg.background'];
            _this.updateSpanText('background', background || 'Default (no color)'); // Display Background color text
            _this.setBackgroundColor(background); // Apply background color
            var spotifyLink = pluginData['cfg.spotifyLink'];
            _this.updateSpanText('spotifyLink', spotifyLink || 'No Spotify link'); // Display Spotify Link text
            var spotifyLayout = pluginData['cfg.spotifyLayout'];
            _this.updateSpanText('spotifyLayout', spotifyLayout || 'No Spotify layout'); // Display Spotify Layout text
            // Add Spotify iframe if link and layout are available
            if (spotifyLink && spotifyLayout) {
                _this.addSpotify(spotifyLink, spotifyLayout);
            }
        }).catch(function (error) {
            console.error("Error initializing Haiilo Plugin Adapter:", error);
            // Optionally, update a status element on the page to show the error
            _this.updateSpanText('userName', 'Error loading plugin data!');
            _this.updateSpanText('apiKey', 'Error');
            _this.updateSpanText('customTitle', 'Error');
            _this.updateSpanText('background', 'Error');
            _this.updateSpanText('spotifyLink', 'Error');
            _this.updateSpanText('spotifyLayout', 'Error');
        });
    }
    /**
     * Helper method to update the text content of a span element by its ID.
     * @param id The ID of the span element.
     * @param text The text content to set.
     */
    DemoPlugin.prototype.updateSpanText = function (id, text) {
        var element = document.getElementById(id);
        if (element) {
            element.innerText = text;
        }
        else {
            console.warn("Element with ID '".concat(id, "' not found."));
        }
    };
    /**
     * Sets the background color of the body.
     * @param color The CSS color value.
     */
    DemoPlugin.prototype.setBackgroundColor = function (color) {
        if (color) {
            document.body.style.backgroundColor = color;
        }
    };
    /**
     * Adds a Spotify iframe to the document body.
     * @param spotifyLink The Spotify share link.
     * @param spotifyLayout The desired layout (LARGE or COMPACT).
     */
    DemoPlugin.prototype.addSpotify = function (spotifyLink, spotifyLayout) {
        var spotifyFrame = document.createElement("iframe");
        spotifyFrame.width = '300';
        spotifyFrame.height = spotifyLayout === "LARGE" ? '380' : '80';
        spotifyFrame.allow = "encrypted-media";
        // Convert the share link to an embed link
        spotifyFrame.src = spotifyLink.replace('https://open.spotify.com', 'https://open.spotify.com/embed');
        document.body.appendChild(spotifyFrame);
    };
    return DemoPlugin;
}());
exports.DemoPlugin = DemoPlugin;
// Instantiate the plugin to start its execution when the script loads
new DemoPlugin();
// The pluginadapter.js (compiled from this file) is loaded by index.html via a <script type="module" src="/dist/pluginadapter.js"></script> tag.
// When loaded, it runs new DemoPlugin(), which fetches config/context from Haiilo and updates the DOM directly.
// No data is "sent" to index.html; instead, pluginadapter.js manipulates the DOM elements in index.html by their IDs.

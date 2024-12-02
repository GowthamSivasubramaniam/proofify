// src/browser-quirk.js

function detectBrowserQuirks() {
    const quirks = {};

    // Detect if the browser allows certain subtle behaviors that bots often can't mimic
    quirks.doNotTrack = navigator.doNotTrack;
    quirks.javaEnabled = navigator.javaEnabled();
    quirks.touchSupport = 'ontouchstart' in window;

    // Detect headless Chrome (common in bots)
    quirks.headlessChrome = /HeadlessChrome/.test(navigator.userAgent);

    return quirks;
}

module.exports = { detectBrowserQuirks };

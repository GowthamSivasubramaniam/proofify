// src/api-probing.js

function probeAPIs() {
    const apiSupport = {};

    // Check for common web APIs and their support
    apiSupport.webGL = !!window.WebGLRenderingContext;
    apiSupport.geolocation = !!navigator.geolocation;
    apiSupport.serviceWorker = !!navigator.serviceWorker;

    return apiSupport;
}

module.exports = { probeAPIs };

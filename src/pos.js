async function checkFileDownloadable(fileUrl) {
    try {
        // Send a HEAD request to check the file
        const response = await fetch(fileUrl, { method: 'HEAD' });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const contentType = response.headers.get('Content-Type');
        const contentLength = response.headers.get('Content-Length');

        // Check if the content type is appropriate and if content length is greater than 0
        if (!contentType || contentLength === null || parseInt(contentLength) <= 0) {
            return false; // Not downloadable
        }

        console.log(`File is downloadable. Type: ${contentType}, Size: ${contentLength} bytes`);
        return true; // File is downloadable
    } catch (error) {
        console.error("Error checking file downloadability:", error.message);
        return false; // Error in checking; consider it not downloadable
    }
}

// Example Usage
async function caller() {
    try {
        const canDownload = await checkFileDownloadable('https://videos.pexels.com/video-files/29266034/12624830_1440_2560_24fps.mp4');
        console.log("Can download:", canDownload);
        return canDownload ? 1 : 0;
    } catch (error) {
        console.error("Error in caller:", error.message);
        return 0;
    }
}

module.exports = { caller };

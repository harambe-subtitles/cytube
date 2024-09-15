const ffmpeg = require('fluent-ffmpeg');
const fetch = require('node-fetch'); // For sending requests to your API

// Function to fetch video duration using ffmpeg
async function fetchVideoDuration(url) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(url, (err, metadata) => {
            if (err) {
                reject(`Error loading video: ${err.message}`);
            } else {
                resolve(metadata.format.duration);
            }
        });
    });
}

// Function to send video data to the API
async function sendVideoData(title, urls) {
    try {
        const urlArray = urls.split(',');
        const durationPromises = urlArray.map(url => fetchVideoDuration(url));
        const durations = await Promise.all(durationPromises);

        const videoData = {
            title,
            duration: durations[0] || 0, // Assuming the first URL's duration is used; adjust as needed
            live: false,
            sources: urlArray.map((url, index) => ({
                url,
                contentType: "video/mp4",
                quality: index === 0 ? 1080 : 720 // Example logic, adjust as needed
            })),
            textTracks: []
        };

        const response = await fetch('https://your-api-endpoint/api/handler', { // Replace with your API endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(videoData)
        });

        const responseData = await response.json();
        if (response.ok) {
            console.log(`Success: ${responseData.message}`);
        } else {
            console.error(`Error: ${responseData.error}`);
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

// Example usage
const title = 'Outlaw 2024';
const urls = 'https://example.com/video1.mp4,https://example.com/video2.mp4';
sendVideoData(title, urls);

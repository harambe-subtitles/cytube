import ffmpeg from 'fluent-ffmpeg';
import { Octokit } from '@octokit/rest';

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

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Extract title, urls, and qualities from query parameters
    const { title, urls, qualities } = req.query;

    // Validate input
    if (!title || !urls || !qualities) {
        return res.status(400).json({ error: 'Title, URLs, and qualities are required.' });
    }

    // Parse URLs and qualities
    const urlArray = urls.split(',').map(url => url.trim());
    const qualityArray = qualities.split(',').map(q => q.trim());

    if (urlArray.length === 0 || qualityArray.length === 0 || urlArray.length !== qualityArray.length) {
        return res.status(400).json({ error: 'Invalid format. Ensure URLs and qualities are provided as comma-separated lists and have the same length.' });
    }

    try {
        // Fetch durations for each URL
        const durationPromises = urlArray.map(url => fetchVideoDuration(url));
        const durations = await Promise.all(durationPromises);

        const videoData = {
            title,
            duration: durations[0] || 0, // Use the duration of the first video URL, adjust as needed
            live: false, // Placeholder, update if needed
            sources: urlArray.map((url, index) => ({
                url,
                contentType: "video/mp4",
                quality: parseInt(qualityArray[index], 10) || 1080 // Convert quality to integer, default to 1080
            })),
            textTracks: [] // Placeholder, update if needed
        };

        // GitHub repository details
        const owner = "harambe-subtitles"; // replace with your GitHub username
        const repo = "cytube-json"; // replace with your repository name
        const path = "videoData.json"; // the path where you want to store the file
        const branch = "main"; // the branch you want to commit to

        // GitHub personal access token
        const token = process.env.GITHUB_TOKEN;

        const octokit = new Octokit({ auth: token });

        try {
            // Get the current file content (if it exists)
            const { data: { content, sha } } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path,
                branch
            });

            // Update the file
            await octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo,
                path,
                message: "Update videoData.json",
                content: Buffer.from(JSON.stringify(videoData, null, 2)).toString('base64'),
                sha,
                branch
            });

            res.status(200).json({ message: "File updated successfully" });
        } catch (fileError) {
            if (fileError.status === 404) {
                // If the file does not exist, create it
                await octokit.rest.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path,
                    message: "Create videoData.json",
                    content: Buffer.from(JSON.stringify(videoData, null, 2)).toString('base64'),
                    branch
                });

                res.status(200).json({ message: "File created successfully" });
            } else {
                res.status(fileError.status || 500).json({ error: fileError.message });
            }
        }
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
}

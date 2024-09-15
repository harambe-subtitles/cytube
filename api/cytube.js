const { Octokit } = require('@octokit/rest');

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { title, urls, qualities, duration } = req.query;

    if (!title || !urls || !qualities) {
        return res.status(400).json({ error: 'Title, URLs, and qualities are required.' });
    }

    const urlArray = decodeURIComponent(urls).split(',').map(url => url.trim());
    const qualityArray = qualities.split(',').map(q => q.trim());

    if (urlArray.length === 0 || qualityArray.length === 0 || urlArray.length !== qualityArray.length) {
        return res.status(400).json({ error: 'Invalid format. Ensure URLs and qualities are provided as comma-separated lists and have the same length.' });
    }

    const videoData = {
        title,
        duration: duration,
        live: false,
        sources: urlArray.map((url, index) => ({
            url,
            contentType: "video/mp4",
            quality: parseInt(qualityArray[index], 10) || 720
        })),
        textTracks: []
    };

    const owner = "harambe-subtitles";
    const repo = "cytube-json";
    const pathInRepo = "videoData.json";
    const branch = "main";
    const token = process.env.GITHUB_TOKEN;

    try {
        const octokit = new Octokit({ auth: token });

        try {
            const { data: { content, sha } } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: pathInRepo,
                branch
            });

            await octokit.rest.repos.createOrUpdateFileContents({
                owner,
                repo,
                path: pathInRepo,
                message: "Update videoData.json",
                content: Buffer.from(JSON.stringify(videoData, null, 2)).toString('base64'),
                sha,
                branch
            });

            res.status(200).json({ message: "File updated successfully" });
        } catch (fileError) {
            if (fileError.status === 404) {
                await octokit.rest.repos.createOrUpdateFileContents({
                    owner,
                    repo,
                    path: pathInRepo,
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
        res.status(500).json({ error: `Failed to import @octokit/rest: ${error.message}` });
    }
};

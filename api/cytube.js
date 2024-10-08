module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    // Handle preflight request
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { title, urls, qualities, duration, trackUrls, trackNames, trackDefault } = req.query;

  if (!title || !urls || !qualities) {
    return res.status(400).json({ error: 'Title, URLs, and qualities are required.' });
  }

  const urlArray = decodeURIComponent(urls).split(',').map(url => url.trim());
  const qualityArray = qualities.split(',').map(q => q.trim());

  if (urlArray.length === 0 || qualityArray.length === 0 || urlArray.length !== qualityArray.length) {
    return res.status(400).json({ error: 'Invalid format. Ensure URLs and qualities are provided as comma-separated lists and have the same length.' });
  }

  // Handle the textTracks
  let textTracks = [];

  if (trackUrls && trackNames && trackDefault) {
    const trackUrlArray = decodeURIComponent(trackUrls).split(',').map(url => url.trim());
    const trackNameArray = decodeURIComponent(trackNames).split(',').map(name => name.trim());
    const trackDefaultArray = decodeURIComponent(trackDefault).split(',').map(defaultValue => defaultValue.trim() === 'true');

  // Ensure the trackUrls, trackNames, and trackDefault arrays are of the same length
  if (trackUrlArray.length !== trackNameArray.length || trackNameArray.length !== trackDefaultArray.length) {
    return res.status(400).json({ error: 'Track URLs, Track Names, and Track Defaults must have the same length.' });
  }

  // Map through track arrays and construct textTracks
  textTracks = trackUrlArray.map((url, index) => ({
    url,
    contentType: 'text/vtt',
    name: trackNameArray[index],
    default: trackDefaultArray[index]
  }));
}

  const videoData = {
    title,
    duration: Number(duration),
    live: false,
    sources: urlArray.map((url, index) => ({
      url,
      contentType: "video/mp4",
      quality: parseInt(qualityArray[index], 10) || 720
    })),
    textTracks // Add the dynamic textTracks here
  };

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const dateTimePart = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;

  const owner = "harambe-subtitles";
  const repo = "cytube-json";
  const pathInRepo = `videoData-${dateTimePart}.json`;
  const branch = "main";
  const token = process.env.GITHUB_TOKEN;

  try {
    const { Octokit } = await import('@octokit/rest');
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

        res.status(200).json({ message: "File created successfully", fileName: pathInRepo });
      } else {
        res.status(fileError.status || 500).json({ error: fileError.message });
      }
    }
  } catch (error) {
    res.status(500).json({ error: `Failed to import @octokit/rest: ${error.message}` });
  }
};

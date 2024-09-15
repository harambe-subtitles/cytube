export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Extract title and URLs from the query parameters
  const { title, urls } = req.query;

  // Validate input
  if (!title || !urls) {
    return res.status(400).json({ error: 'Title and URLs are required.' });
  }

  // Parse URLs if they are provided as a comma-separated string
  const urlArray = typeof urls === 'string' ? urls.split(',') : [];

  if (urlArray.length === 0) {
    return res.status(400).json({ error: 'Invalid URLs format. Provide URLs as a comma-separated list.' });
  }

  const videoData = {
    title,
    duration: 0, // Placeholder, update with actual logic if needed
    live: false, // Placeholder, update if needed
    sources: urlArray.map((url, index) => ({
      url,
      contentType: "video/mp4",
      quality: index === 0 ? 1080 : 720 // Example logic, adjust as needed
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

  try {
    // Dynamically import the Octokit module
    const { Octokit } = await import('@octokit/rest');

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

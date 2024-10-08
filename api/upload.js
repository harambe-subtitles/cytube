// Upload function with dynamic import for ES module
export default async function handler(req, res) {
  // Allow CORS from any origin by setting the Access-Control-Allow-Origin header
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle the OPTIONS method for preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end(); // Quickly respond to preflight requests
  }

  if (req.method === 'POST') {
    const { subtitleFiles } = req.body;

    if (!subtitleFiles || subtitleFiles.length === 0) {
      return res.status(400).json({ message: 'No subtitle files provided' });
    }

    const token = process.env.GITHUB_TOKEN;   // Access the GitHub token from environment variables
    const owner = 'harambe-subtitles';        // Replace with your GitHub username
    const repo = 'subtitles';                 // Replace with your repository name
    const branch = 'main';                    // The branch where files will be uploaded

    try {
      // Dynamically import the Octokit module
      const { Octokit } = await import('@octokit/rest');
      const btoa = (str) => Buffer.from(str).toString('base64'); // Buffer-based Base64 encoding

      const octokit = new Octokit({
        auth: token
      });

      for (const file of subtitleFiles) {
        const { fileName, content } = file;

        // Convert content to Base64 as required by GitHub API
        const base64Content = btoa(content);

        // Upload the file to GitHub
        await octokit.repos.createOrUpdateFileContents({
          owner,
          repo,
          path: `${fileName}`,   // Path to store the file in the repo
          message: `Upload subtitle ${fileName}`,
          content: base64Content,          // File content in Base64
          branch,
        });
      }

      return res.status(200).json({ message: 'Subtitles uploaded successfully!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to upload subtitles' });
    }
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
}

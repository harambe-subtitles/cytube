export default async function handler(req, res) {
  const videoData = {
    title: "Outlaw 2024 (tylko napisy)",
    duration: 5105,
    live: false,
    sources: [
      {
        url: "https://assets.frame.io/encode/590e3316-1793-4e94-8093-95923cf569aa/h264_1080_best.mp4?x-amz-meta-project_id=6b4a4337-f21e-40cf-8b54-b01949ad8d16&x-amz-meta-request_id=F_U0DtwsYHeR2FYW9niG&x-amz-meta-project_id=6b4a4337-f21e-40cf-8b54-b01949ad8d16&x-amz-meta-resource_type=asset&x-amz-meta-resource_id=590e3316-1793-4e94-8093-95923cf569aa&Expires=1726401600&Signature=L9aELJjSZh93w28AKR2rhrmEmsw9HVA9wHB4gpM0jtId96TXmWKE2ZBB8Ku1P2VtHF3-Fecp~TCYDOiOWB0PQjOTR9eyv~8MU0Szz62c4jKN4JqS1F0Xa8S943iTNE0Vu7Han6rmKkbMEjSx1O-xde7GG2PkEK1idy-VXvLhsEBibClX~ahdH2MiwCIpOY-zkqaMB~yjjXlm1zMU2i2szRTTkQqDY28ola04pxF98KD-FpQmkPiZKE7Ur-tXdomAtKr6TnLaahyYI376jYgpvb3F47CiitwwehezewvLcwM~veqLKnN7OHDk43rkTetbFL2J7eOug~JSLdKQSEAQ5A__&Key-Pair-Id=K1XW5DOJMY1ET9",
        contentType: "video/mp4",
        quality: 1080
      },
      {
        url: "https://assets.frame.io/encode/590e3316-1793-4e94-8093-95923cf569aa/h264_720.mp4?x-amz-meta-project_id=6b4a4337-f21e-40cf-8b54-b01949ad8d16&x-amz-meta-request_id=F_U0DtwsYHeR2FYW9niG&x-amz-meta-project_id=6b4a4337-f21e-40cf-8b54-b01949ad8d16&x-amz-meta-resource_type=asset&x-amz-meta-resource_id=590e3316-1793-4e94-8093-95923cf569aa&Expires=1726401600&Signature=Zng8HOKbTKsh9Qs52aP7YpZFQuvN1KoNav3OWwbOY3HjlWZypNm8Ln-GztwJHggHuaE63HLgTzL2f8Ib8L2Wefg5aArZSFZu6HEc50klfyGIYmSp9fUneT84BheZa8nVrc7q~VmGI5NNtgw-Mm9bbX5YaSEOxlSKcb3XPOG0OXXQp0Ef4hYjZP6CVW3PDB7pPZ7R9Gbsgm1sKQMh36Ovi~OqZTeqqxMlWUyTytXRUPGDVx-XUqSGQesBN1ljGi92lSbBnPZv7JipsaP~rMK6U42aV06AQaJvie3pQMhj3EAFIu6AOuD-SkQJ6IuyXEfzr~8BEPp8IbG2FqDaetsGSA__&Key-Pair-Id=K1XW5DOJMY1ET9",
        contentType: "video/mp4",
        quality: 720
      }
    ],
    textTracks: []
  };

  // GitHub repository details
  const owner = "your-github-username"; // replace with your GitHub username
  const repo = "your-repo-name"; // replace with your repository name
  const path = "videoData.json"; // the path where you want to store the file
  const branch = "main"; // the branch you want to commit to

  // GitHub personal access token
  const token = process.env.GITHUB_TOKEN;

  try {
    // Dynamically import the Octokit module
    const { Octokit } = await import('@octokit/rest');

    const octokit = new Octokit({ auth: token });

    // Get the current file content (if it exists)
    const { data: { content, sha } } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
      branch
    });

    // Decode the existing content
    const existingContent = Buffer.from(content, 'base64').toString('utf8');

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
  } catch (error) {
    // If the file does not exist, create it
    if (error.status === 404) {
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
      res.status(error.status || 500).json({ error: error.message });
    }
  }
}

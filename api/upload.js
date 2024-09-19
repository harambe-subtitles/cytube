import { Octokit } from "@octokit/rest";
import formidable from "formidable";
import fs from "fs";

// Initialize Octokit for GitHub API
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Store GITHUB_TOKEN in your Vercel environment
});

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method is allowed' });
  }

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error processing the file' });
    }

    const file = files.file;
    const filePath = file.filepath;
    const fileName = file.originalFilename;

    try {
      // Read the file and convert to base64
      const content = fs.readFileSync(filePath, 'utf8');
      const contentBase64 = Buffer.from(content).toString('base64');

      // GitHub repository details
      const owner = 'harambe-subtitles';
      const repo = 'subtitles';
      const branch = 'main'; // Target branch

      // Upload file to GitHub
      const response = await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `${fileName}`,
        message: `Upload ${fileName}`,
        content: contentBase64,
        branch,
      });

      res.status(200).json({ message: 'File uploaded successfully', data: response.data });
    } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });
}
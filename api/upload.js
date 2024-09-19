import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing to handle file uploads
  },
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins; adjust as needed
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    // Preflight request handling
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST method is allowed' });
  }

  // Dynamically import Octokit
  let Octokit;
  try {
    Octokit = (await import('@octokit/rest')).Octokit;
  } catch (error) {
    console.error('Error importing Octokit:', error);
    return res.status(500).json({ error: 'Failed to import Octokit' });
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN, // Your GitHub token from environment variables
  });

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parsing error:', err);
      return res.status(500).json({ error: 'Error processing the files' });
    }

    const fileFields = files.files || [];
    const nameFields = fields.names || [];
    const defaultFields = fields.defaults || [];

    if (!Array.isArray(fileFields) || fileFields.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    try {
      const uploadPromises = fileFields.map(async (file, index) => {
        const filePath = file.filepath;
        const fileName = file.originalFilename;
        const subtitleName = nameFields[index] || 'Unknown';
        const isDefault = defaultFields[index] === 'true';

        const content = fs.readFileSync(filePath, 'utf8');
        const contentBase64 = Buffer.from(content).toString('base64');

        await octokit.repos.createOrUpdateFileContents({
          owner: process.env.GITHUB_OWNER,
          repo: process.env.GITHUB_REPO,
          path: `${fileName}`, // Ensure this path is correct and doesn't conflict with existing files
          message: `Upload ${fileName}`,
          content: contentBase64,
          branch: process.env.GITHUB_BRANCH,
        });
      });

      await Promise.all(uploadPromises);

      res.status(200).json({ message: 'Files uploaded successfully' });
    } catch (error) {
      console.error('Error uploading files:', error);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  });
}

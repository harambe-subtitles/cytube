export default async function handler(req, res) {
    const fetch = (await import('node-fetch')).default;
  
    // Your existing code
    const token = process.env.GITHUB_TOKEN;
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${token}`
      }
    });
    const data = await response.json();
    console.log(data); // Should print user data if token is valid
  
    // Continue with the rest of your code
  }
  
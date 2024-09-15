import fetch from 'node-fetch';

async function testToken() {
  const token = process.env.GITHUB_TOKEN;
  const response = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `token ${token}`
    }
  });
  const data = await response.json();
  console.log(data); // Should print user data if token is valid
}

testToken().catch(console.error);
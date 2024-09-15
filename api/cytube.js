// Function to fetch video duration
async function fetchVideoDuration(url) {
  return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = url;
      video.style.display = 'none'; // Hide the video element

      video.addEventListener('loadedmetadata', () => {
          resolve(video.duration);
      });
      video.addEventListener('error', (e) => {
          reject(`Error loading video: ${e.message}`);
      });
  });
}

// Function to send video data to the API
async function sendVideoData(title, urls) {
  try {
      const urlArray = urls.split(',');
      const durationPromises = urlArray.map(url => fetchVideoDuration(url));
      const durations = await Promise.all(durationPromises);

      const videoData = {
          title,
          duration: durations[0] || 0, // Assuming the first URL's duration is used; adjust as needed
          live: false,
          sources: urlArray.map((url, index) => ({
              url,
              contentType: "video/mp4",
              quality: index === 0 ? 1080 : 720 // Example logic, adjust as needed
          })),
          textTracks: []
      };

      const response = await fetch('/api/handler', {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(videoData) // If using GET, move data to query params
      });

      const responseData = await response.json();
      if (response.ok) {
          console.log(`Success: ${responseData.message}`);
      } else {
          console.error(`Error: ${responseData.error}`);
      }
  } catch (error) {
      console.error(`Error: ${error.message}`);
  }
}

// Example usage
sendVideoData('Outlaw 2024', 'https://example.com/video1.mp4,https://example.com/video2.mp4');

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/generate', async (req, res) => {
  const { prompt } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // Simulate music generation
  setTimeout(() => {
    res.json({
      success: true,
      message: 'Music generated!',
      musicUrl: 'https://example.com/music.mp3',
      prompt: prompt
    });
  }, 2000);
});

app.get('/', (req, res) => {
  res.json({ message: 'AI Music Generator Server Running!' });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

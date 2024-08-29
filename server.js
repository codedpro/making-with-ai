const { HfInference } = require('@huggingface/inference');
const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const cors = require('cors');
const sharp = require('sharp');
const fs = require('fs');
const fsPromises = require('fs').promises;
const app = express();
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
//okay?its the path of url your page is this , it must be in folder
const MODEL = 'stabilityai/stable-diffusion-xl-base-1.0';
const mp3Cutter = require('mp3-cutter');
const fileUpload = require('express-fileupload');
app.use(cors());
// ?
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());

const archivedImagesDir = path.join(__dirname, 'archived_images');
fsPromises.mkdir(archivedImagesDir, { recursive: true });
app.use(express.json());
app.use(fileUpload());
app.post('/api/image-to-image', async (req, res) => {
  const { prompt } = req.body;
  const imageFile = req.files?.image;
  if (!prompt || !imageFile) {
    return res.status(400).send('Prompt and image are required');
  }

  try {
    const imageBuffer = Buffer.from(imageFile.data);
    const arrayBuffer = imageBuffer.buffer.slice(imageBuffer.byteOffset, imageBuffer.byteOffset + imageBuffer.byteLength);

    const response = await hf.imageToImage({
      model: 'stabilityai/stable-diffusion-xl-refiner-1.0',
      inputs: arrayBuffer,
      parameters: { prompt: prompt },
    });

    const blob = response;
    const arrayBufferResponse = await blob.arrayBuffer();
    const generatedImageBuffer = Buffer.from(arrayBufferResponse);

    const base64Image = generatedImageBuffer.toString('base64');

    const dataUrl = `data:image/jpeg;base64,${base64Image}`;

    res.json({
      image: dataUrl,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send(`Error generating image: ${error.message}`);
  }
});

app.post('/api/generate-image', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).send('Prompt is required');
  }

  try {
    const blob = await hf.textToImage({ inputs: prompt, model: MODEL, parameters: { negative_prompt: 'blurry' } });
    const buffer = Buffer.from(await blob.arrayBuffer());
    const base64 = buffer.toString('base64');

    res.json({ image: `data:image/jpeg;base64,${base64}` });
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).send(`Error generating image: ${error.message}`);
  }
});

// Route to get archived images
app.get('/api/archived-images', async (req, res) => {
  try {
    const files = await fs.readdir(archivedImagesDir);
    const imageUrls = files.map((file) => `/archived_images/${file}`);
    res.json(imageUrls);
  } catch (error) {
    console.error('Error reading archived images:', error);
    res.status(500).send('Error retrieving archived images');
  }
});

app.post('/api/archive-image', async (req, res) => {
  const { imageUrl } = req.body;
  if (!imageUrl) {
    return res.status(400).send('Image URL is required');
  }

  try {
    const response = await fetch(imageUrl);
    if (response.ok) {
      const buffer = await response.buffer();
      const fileName = `image_${Date.now()}.png`;
      await fs.writeFile(path.join(archivedImagesDir, fileName), buffer);
      res.json({ success: true, fileName });
    } else {
      res.status(response.status).send('Failed to fetch image');
    }
  } catch (error) {
    console.error('Error archiving image:', error);
    res.status(500).send('Error archiving image');
  }
});

app.delete('/api/archived-images/:fileName', async (req, res) => {
  const { fileName } = req.params;
  try {
    await fs.unlink(path.join(archivedImagesDir, fileName));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting archived image:', error);
    res.status(500).send('Error deleting archived image');
  }
});
app.post('/api/synthesize', async (req, res) => {
  const { text } = req.body;
  const duration = parseInt(req.body.duration);

  if (!text || isNaN(duration)) {
    return res.status(400).json({ error: 'Text and valid duration are required' });
  }

  try {
    const result = await hf.textToSpeech({
      model: 'facebook/musicgen-small',
      inputs: text,
    });

    const arrayBuffer = await result.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const audioFileName = `output_${Date.now()}.mp3`;
    const audioFilePath = path.join(__dirname, 'public', audioFileName);

    await fs.writeFile(audioFilePath, buffer);

    if (duration > 0) {
      const trimmedAudioFilePath = path.join(__dirname, 'public', `trimmed_${audioFileName}`);

      mp3Cutter.cut({
        src: audioFilePath,
        target: trimmedAudioFilePath,
        start: 0,
        end: duration / 2,
      });

      res.json({ audioUrl: `/${path.basename(trimmedAudioFilePath)}` });
    } else {
      res.json({ audioUrl: `/${path.basename(audioFilePath)}` });
    }
  } catch (error) {
    console.error('Error synthesizing speech:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
});

app.use('/archived_images', express.static(archivedImagesDir));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

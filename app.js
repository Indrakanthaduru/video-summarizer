import dotenv from 'dotenv';
import { GoogleGenerativeAI } from "@google/generative-ai";
import express from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const downloadPath = path.join(__dirname, 'uploads');
const assemblyAIKey = process.env.ASSEMBLYAI_API_KEY;
const app = express();
const port = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, downloadPath);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

app.post('/upload', upload.single('videoFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No file uploaded.');
    }

    const videoPath = req.file.path;

    // Get video duration
    const duration = await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          return reject(err);
        }
        resolve(metadata.format.duration);
      });
    });

    // Calculate summary length (1 sentence per 30s, min 5)
    const summaryLength = Math.max(5, Math.ceil(duration / 30));

    // Convert video to audio
    const audioPath = videoPath.replace(path.extname(videoPath), '.wav');
    await new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .toFormat('wav')
        .on('end', () => resolve())
        .on('error', (err) => reject(err))
        .save(audioPath);
    });

    // Transcribe audio using AssemblyAI
    const transcription = await transcribeAudio(audioPath, assemblyAIKey);

    // Summarize the transcript using Gemini API
    const summary = await summarizeText(transcription, summaryLength);

    // Clean up files
    fs.unlinkSync(videoPath);
    fs.unlinkSync(audioPath);

    res.json({ summary });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).send(error.message);
  }
});

async function transcribeAudio(filePath, assemblyAIKey) {
  const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: assemblyAIKey,
      'Transfer-Encoding': 'chunked'
    },
    body: fs.createReadStream(filePath)
  });
  const uploadData = await uploadResponse.json();
  if (!uploadData.upload_url) {
    throw new Error('Failed to upload file to AssemblyAI');
  }

  const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    headers: {
      authorization: assemblyAIKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ audio_url: uploadData.upload_url })
  });
  const transcribeData = await transcribeResponse.json();

  return new Promise((resolve, reject) => {
    const checkStatus = setInterval(async () => {
      const statusResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcribeData.id}`, {
        method: 'GET',
        headers: {
          authorization: assemblyAIKey
        }
      });
      const statusData = await statusResponse.json();

      if (statusData.status === 'completed') {
        clearInterval(checkStatus);
        resolve(statusData.text);
      } else if (statusData.status === 'failed') {
        clearInterval(checkStatus);
        reject('Transcription failed');
      }
    }, 5000);
  });
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function summarizeText(text, summaryLength = 5) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Summarize this transcript into exactly ${summaryLength} sentences, identifying key topics or side headings. Structure the summary with these headings. Do not exceed or fall short of this number of sentences.:\n\n${text}`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini summarization error:", error);
    throw new Error("Gemini summarization failed");
  }
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

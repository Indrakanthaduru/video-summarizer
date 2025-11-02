# AI Video Summarizer

This project is a web application that uses AI to automatically generate a text summary of a video file. The summary is structured with key topics and its length is proportional to the video's duration.

## Features

*   **Video Upload:** Upload video files through a user-friendly web interface.
*   **Proportional Summary Length:** The length of the summary is automatically adjusted based on the duration of the video.
*   **Structured Summaries:** The generated summaries are structured with key topics and side headings for better readability.
*   **Modern UI:** A clean and modern user interface with a loading spinner during processing.

## How it Works

1.  **Video Upload:** The user uploads a video file through the web interface.
2.  **Backend Processing:** The backend, built with Node.js and Express, handles the video processing pipeline:
    *   **Video Duration:** The video's duration is extracted using `ffprobe`.
    *   **Summary Length Calculation:** The summary length is calculated based on the video's duration.
    *   **Audio Extraction:** `ffmpeg` is used to extract the audio from the video.
    *   **Transcription:** The audio is sent to the AssemblyAI API for transcription.
    *   **Summarization:** The transcript is sent to the Google Gemini API for summarization, with instructions to create a structured summary of a specific length.
3.  **Display Summary:** The generated summary is sent back to the frontend and displayed to the user.

## Technologies Used

*   **Backend:** Node.js, Express.js
*   **Video/Audio Processing:** `ffmpeg`, `ffprobe`
*   **Node.js Wrapper for ffmpeg:** `fluent-ffmpeg`
*   **File Uploads:** `multer`
*   **Transcription:** AssemblyAI API
*   **Summarization:** Google Gemini API
*   **Frontend:** HTML, CSS, JavaScript

## Installation and Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Install `ffmpeg`:**
    This project requires `ffmpeg` and `ffprobe` to be installed on the server. Please follow the installation instructions for your operating system.
4.  **Create a `.env` file:**
    Create a `.env` file in the root of the project and add your API keys:
    ```
    ASSEMBLYAI_API_KEY=your_assemblyai_api_key
    GEMINI_API_KEY=your_gemini_api_key
    ```
5.  **Run the application:**
    ```bash
    node app.js
    ```
6.  **Open the application in your browser:**
    Navigate to `http://localhost:3001/front.html` in your web browser.

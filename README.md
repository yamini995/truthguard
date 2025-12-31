# TruthGuard - AI Fraud & Misinformation Detector

TruthGuard is a comprehensive AI-powered dashboard designed to detect fake news, job scams, phishing attempts, financial fraud, and medical misinformation. It leverages advanced NLP and pattern recognition powered by Google Gemini 2.0.

## 🏷 Powered by Google Technologies

*   **Firebase**: Authentication, Firestore Database, and Hosting for secure, scalable deployment.
*   **Google Safe Browsing API**: Real-time URL reputation checking to identify phishing and malicious sites.
*   **TensorFlow.js**: Client-side machine learning capabilities for pattern recognition.
*   **Google GenAI (Gemini 2.0 Flash)**: Multimodal analysis of text, images, and video content.

## 🚀 Deployment (Firebase Hosting)

This project is configured to be deployed on Firebase Hosting. Follow these steps to deploy your own instance.

### Prerequisites

1.  **Node.js**: Ensure Node.js is installed on your machine.
2.  **Firebase CLI**: Install the Firebase tools globally:
    ```bash
    npm install -g firebase-tools
    ```
3.  **Google Cloud Project**: You need a Google Cloud project with the Gemini API enabled.

### Deployment Steps

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd truthguard
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory (or `.env.local` for local development).
    ```env
    API_KEY=your_google_genai_api_key
    ```
    *Note: For a React production build (Vite/Webpack), variables often need a prefix (e.g., `VITE_API_KEY`) or must be injected during the build process.*

4.  **Login to Firebase:**
    ```bash
    firebase login
    ```

5.  **Initialize Firebase:**
    ```bash
    firebase init hosting
    ```
    *   **Select your project**: Choose the Google Cloud project you created.
    *   **Public directory**: Type `dist` (or `build` if using Create React App).
    *   **Configure as a single-page app**: Type **Yes** (rewrites all urls to /index.html).
    *   **Set up automatic builds and deploys with GitHub?**: Optional (No for manual deploy).

6.  **Build the application:**
    ```bash
    npm run build
    ```

7.  **Deploy:**
    ```bash
    firebase deploy
    ```

## 🛠 Features

*   **Fake News Detector**: Classifies news as Real, Suspicious, or Fake (Supports Text, Image, Video).
*   **Job Scam Detector**: Identifies fraudulent job offers.
*   **Phishing Check**: Analyzes URLs and page content.
*   **Deepfake/Media Analysis**: Detects AI-generated images and videos.
*   **Multimodal Input**: Supports text, image, and video uploads for **all detectors**.
*   **Responsive Design**: Mobile-optimized with bottom navigation.

## .env Structure

The application requires the following environment variables:


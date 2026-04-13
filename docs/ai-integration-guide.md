# AI Integration Guide: Voice & Computer Vision

**Author:** Manus AI
**Date:** January 20, 2026

## 1. Introduction

This document provides a technical guide for integrating the AI-powered features—voice-first setup and house scanning—into the family chore management app. It is intended for the development team (or an AI assistant like Claude) and provides detailed instructions for both frontend and backend implementation.

## 2. Voice AI Integration (Voice-First Onboarding)

### 2.1. Overview

The voice-first onboarding feature allows users to set up their family and house details through a natural conversation. The workflow involves capturing audio on the device, transcribing it to text, sending it to a backend service, and using a Large Language Model (LLM) to extract structured information.

### 2.2. Frontend Implementation (React Native)

1.  **Install Libraries:** Use a library like `react-native-voice` to access the device microphone and speech-to-text capabilities.

2.  **Capture Audio:** Create a UI with a "Start Talking" button that initiates audio capture. The `react-native-voice` library will provide real-time transcription.

3.  **Send to Backend:** Once the user has finished speaking (e.g., after a pause), send the transcribed text to the `/ai/voice-setup` endpoint on your backend.

**Example Code Snippet (React Native):**

```javascript
import Voice from 'react-native-voice';

const startListening = async () => {
  try {
    await Voice.start('en-US');
  } catch (e) {
    console.error(e);
  }
};

Voice.onSpeechResults = async (e) => {
  const transcribedText = e.value[0];
  const response = await fetch('https://api.yourdomain.com/v1/ai/voice-setup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text_input: transcribedText })
  });
  const data = await response.json();
  // ... handle the conversational response from the backend
};
```

### 2.3. Backend Implementation (Node.js)

1.  **Create API Endpoint:** Implement the `POST /ai/voice-setup` endpoint as specified in the API documentation.

2.  **LLM Integration:** Use the OpenAI or Google Gemini SDK to interact with the chosen LLM.

3.  **Prompt Engineering:** Craft a system prompt that instructs the LLM to act as a friendly family setup assistant. The prompt should specify the exact JSON format for the output.

**Example System Prompt for the LLM:**

> You are a helpful assistant setting up a family management app. Your goal is to extract the user's family details from their spoken input. You must extract the family size, the number of children, their names and ages, the house type, and the number of bedrooms. Always respond with a JSON object containing `action`, `extracted_data`, and `response_text`. The `action` can be `confirm_details` or `request_more_info`. The `response_text` should be a friendly, conversational question to the user.

4.  **Process LLM Response:** Parse the JSON response from the LLM and send it back to the frontend. The backend should manage the conversational state, accumulating the extracted details over multiple turns.

## 3. Computer Vision Integration (House Scanning)

### 3.1. Overview

The house scanning feature uses the device's camera and an on-device machine learning model to identify rooms and household assets. This allows the app to create a context-aware chore plan.

### 3.2. Model Selection & Preparation

1.  **Model:** Use a pre-trained YOLOv8 model, which is optimized for real-time object detection on mobile devices.

2.  **Conversion:** Convert the YOLOv8 model to the TensorFlow Lite (`.tflite`) format. This will allow it to run efficiently on both iOS and Android.

3.  **Dataset:** The model should be trained on a dataset of common household items, such as the [Scanned Objects by Google Research](https://research.google/blog/scanned-objects-by-google-research-a-dataset-of-3d-scanned-common-household-items/) dataset.

### 3.3. Frontend Implementation (React Native)

1.  **Install Libraries:** Use `react-native-camera` to access the camera feed and a library like `react-native-tensorflow-lite` to run the on-device model.

2.  **Camera View:** Create a component that displays the live camera feed.

3.  **Real-Time Inference:** On a frame-by-frame basis (or at a set interval, e.g., 5 times per second), pass the camera frame to the TensorFlow Lite model.

**Example Code Snippet (React Native):**

```javascript
import { RNCamera } from 'react-native-camera';
import Tflite from 'react-native-tflite';

let tflite = new Tflite();
const modelFile = 'path/to/your/model.tflite';
const labelsFile = 'path/to/your/labels.txt';

tflite.loadModel({ model: modelFile, labels: labelsFile }, (err, res) => {
  if (err) console.log(err);
});

const onFrameProcessed = (frame) => {
  tflite.runModelOnFrame({
    path: frame.uri,
    imageMean: 128.0,
    imageStd: 128.0,
    numResults: 5,
    threshold: 0.1
  }, (err, res) => {
    if (err) console.log(err);
    // res will be an array of detected objects
    // Aggregate these results to build the house map
  });
};
```

4.  **Data Aggregation:** As the model detects objects, aggregate them into a JSON structure that represents the rooms and their assets. For example, if a "dishwasher" and "refrigerator" are consistently detected in the same area, infer that this is the "kitchen".

5.  **User Confirmation:** After the scan is complete, present the aggregated data to the user for confirmation. Allow them to correct any inaccuracies.

6.  **Send to Backend:** Once confirmed, send the final `house_details` JSON object to the `/ai/house-scan` endpoint.

### 3.4. Backend Implementation (Node.js)

1.  **Create API Endpoint:** Implement the `POST /ai/house-scan` endpoint.

2.  **Save to Database:** The primary role of the backend in this feature is to receive the confirmed `house_details` JSON from the frontend and save it to the `HOUSES` table in the database, associated with the correct family.

## 4. Best Practices

*   **On-Device Processing:** For both voice and vision, perform as much of the processing as possible on the device. This enhances user privacy and reduces latency.
*   **Error Handling:** Implement robust error handling for cases where the AI models fail or return unexpected results.
*   **User Feedback:** Always allow the user to confirm and correct the information extracted by the AI. This builds trust and improves accuracy.
*   **Model Optimization:** Ensure that the computer vision model is optimized for mobile performance to avoid draining the user's battery.

This guide provides the foundational knowledge needed to integrate the advanced AI features into the family chore management app. A successful implementation will require careful attention to both the user experience and the technical details of the AI models.

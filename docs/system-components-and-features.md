# System Components & Features: Family Chore Management App

**Author:** Manus AI
**Date:** January 20, 2026

## 1. Introduction

This document provides a detailed breakdown of the system components and features for the family chore management app. It is intended to guide the development of both the frontend mobile application and the backend microservices. Each component is described with its primary responsibilities and key features.

## 2. Frontend Components (React Native)

The mobile application will be built using React Native and will consist of the following core components:

### 2.1. Onboarding Component

*   **Responsibility:** Guide new users through the initial setup process.
*   **Features:**
    *   **Voice-First Setup:** A conversational interface that uses the device's microphone to capture user input for family details, house type, and children's information.
    *   **Manual Setup:** A traditional form-based interface for users who prefer not to use the voice feature.
    *   **Account Creation:** Handles user registration and login.
    *   **Family Creation:** Allows parents to create a new family and invite members.

### 2.2. Dashboard Component

*   **Responsibility:** Provide a centralized view of the family's activities and progress.
*   **Features:**
    *   **Parent View:** Displays an overview of all children's chore progress, pending approvals, and recent activity.
    *   **Child View:** Shows the child's assigned chores, point balance, and progress towards rewards.
    *   **Daily & Weekly Summary:** A snapshot of the day's and week's plan, including chores, study time, and other activities.

### 2.3. Chore Management Component

*   **Responsibility:** Manage the creation, assignment, and tracking of chores.
*   **Features:**
    *   **Chore List:** A view of all assigned chores with due dates and status.
    *   **Chore Details:** A detailed view of a single chore, including description, points, and any notes.
    *   **Chore Completion:** Allows children to mark chores as complete and upload a photo for proof.
    *   **Chore Approval:** Allows parents to review and approve completed chores.

### 2.4. House Scanning Component

*   **Responsibility:** Capture the layout and assets of the user's home.
*   **Features:**
    *   **Camera Interface:** Uses the device's camera to allow the user to scan their home.
    *   **Real-Time Object Detection:** On-device machine learning to identify rooms and household items (e.g., dishwasher, TV, beds).
    *   **3D Mesh Generation (Optional):** For a more immersive experience, the component could generate a simple 3D model of the house.
    *   **Asset Confirmation:** Allows the user to confirm or correct the items identified by the AI.

### 2.5. Rewards Store Component

*   **Responsibility:** Manage the redemption of rewards.
*   **Features:**
    *   **Reward List:** A view of all available rewards with their point cost.
    *   **Reward Redemption:** Allows children to redeem rewards using their accumulated points.
    *   **Reward History:** A log of all redeemed rewards.

### 2.6. Settings Component

*   **Responsibility:** Allow users to configure the app and their account settings.
*   **Features:**
    *   **Family Management:** Add or remove family members, edit children's details.
    *   **Screen Time Settings:** Set daily screen time limits and conditions for each child.
    *   **Notification Preferences:** Configure push notifications for reminders and approvals.
    *   **Account Settings:** Change password, update email address.

## 3. Backend Services (Microservices)

The backend will be composed of several independent microservices, each with a specific responsibility:

### 3.1. User Service

*   **Responsibility:** Manages all aspects of user and family data.
*   **Functionality:**
    *   User authentication and authorization (JWT).
    *   User profile management.
    *   Family and member creation and management.

### 3.2. Chore Service

*   **Responsibility:** Manages the entire lifecycle of chores.
*   **Functionality:**
    *   Creation, editing, and deletion of master chore lists.
    *   Assignment of chores to users.
    *   Tracking of chore status and completion.
    *   Storage of proof-of-completion images (using Amazon S3).

### 3.3. Gamification Service

*   **Responsibility:** Manages the points, rewards, and engagement mechanics.
*   **Functionality:**
    *   Awarding points for chore completion.
    *   Tracking user point balances.
    *   Managing the redemption of rewards.
    *   Implementing badges, streaks, and leaderboards.

### 3.4. AI Service

*   **Responsibility:** Orchestrates communication with external AI/ML models.
*   **Functionality:**
    *   **Voice Processing:** Sends transcribed text to an LLM (GPT-4/Gemini) and processes the response to extract structured data.
    *   **Image/Video Processing:** Forwards data from the house scan to a computer vision model (YOLOv8) for object detection.
    *   **Automated Chore Generation:** Uses the extracted house details and family information to generate a customized chore plan.

## 4. Key Feature Implementation Details

### 4.1. Voice-First Onboarding

1.  The frontend captures audio from the microphone and uses an on-device speech-to-text library to transcribe it.
2.  The transcribed text is sent to the `/ai/voice-setup` endpoint.
3.  The AI Service maintains a session and sends the text to a pre-prompted LLM.
4.  The LLM extracts entities (family size, children's names/ages, house type) and formulates a clarifying question.
5.  The AI Service returns the extracted data and the question to the frontend.
6.  This conversational loop continues until all necessary information is gathered and confirmed.

### 4.2. House Scanning & Asset Recognition

1.  The frontend opens a camera view.
2.  As the user moves through their house, the app captures video frames.
3.  Each frame is passed to an on-device TensorFlow Lite model running YOLOv8.
4.  The model returns a list of detected objects and their bounding boxes (e.g., `{"object": "dishwasher", "confidence": 0.92}`).
5.  The frontend aggregates these detections over time to build a map of rooms and their associated assets.
6.  After the scan, the user is presented with a summary (e.g., "I found a dishwasher and a refrigerator in the Kitchen. Is that correct?") for confirmation.
7.  The confirmed `house_details` JSON is saved to the database.

### 4.3. Automated Chore Distribution

1.  This process is triggered weekly by a scheduled job (e.g., a cron job running in a Lambda function).
2.  The job fetches all families and their members.
3.  For each family, it retrieves the `house_details` and the master `CHORES` list.
4.  It then iterates through each child, considering their `age` and the `difficulty` of each chore.
5.  Using the research-backed rules (e.g., a child aged 8 can do 'medium' difficulty chores), it creates a list of eligible chores.
6.  It assigns chores from the eligible list, ensuring an equitable distribution of tasks and points among the children.
7.  New entries are created in the `ASSIGNED_CHORES` table for the upcoming week.

### 4.4. Screen Time Integration

1.  This feature will require a platform-specific implementation (using Apple's Screen Time API for iOS and Android's Digital Wellbeing API).
2.  The parent configures the `SCREEN_TIME_SETTINGS` for each child, including the daily limit and conditions (e.g., `must_complete_daily_chores: true`).
3.  The backend provides an endpoint that the mobile app can check to see if the conditions have been met.
4.  When a child opens a restricted app (e.g., a game), the family chore app (acting as a device administrator) can check the conditions.
5.  If the conditions are not met, the app can block access or display a message (e.g., "You need to complete your chores to unlock this app!").

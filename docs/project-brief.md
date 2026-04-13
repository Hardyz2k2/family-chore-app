# Project Brief: AI-Powered Family Chore Management App

**To:** Claude AI
**From:** Manus AI
**Date:** January 20, 2026

## 1. Project Goal

Your primary objective is to build a fully functional, AI-powered family chore management application based on the detailed specifications provided in this project brief. The application should be developed using the specified technology stack and deployed on Amazon Web Services (AWS).

## 2. Core Features to Implement

The MVP of this application should include the following core features:

1.  **Voice-First Onboarding:** A conversational AI to guide users through the initial setup.
2.  **House Scanning:** A computer vision feature to automatically identify rooms and household assets.
3.  **Automated Chore Planning:** An AI-driven system to generate and assign age-appropriate chores.
4.  **Gamified Rewards System:** A points-based system where children can earn rewards for completing chores.
5.  **Integrated Screen Time Management:** The ability for parents to link chore completion to their children's screen time.

## 3. How to Use This Project Brief

This project brief is organized into a series of detailed documents that provide all the necessary information for you to build the application. Please review each document carefully before you begin coding.

Start with the `technical_architecture.md` to understand the overall system design, and then proceed through the other documents as needed. The project is designed to be built in a modular fashion, so you can work on the different microservices and frontend components independently.

## 4. Project Documentation

All the necessary documentation is included in this project folder. Here is a guide to the documents and their contents:

*   **`technical_architecture.md`**: This document provides a high-level overview of the system architecture, including the microservices, technology stack, and data flow. **Start here.**

*   **`database_schema.md`**: This document contains the complete database schema for the PostgreSQL database, including table definitions and relationships. Use this to set up the database and create your data models.

*   **`api_specifications.md`**: This document provides a detailed specification for the RESTful API, including all endpoints, request/response formats, and authentication requirements. Use this to build the backend API.

*   **`system_components.md`**: This document breaks down the application into its core frontend and backend components, detailing the responsibilities and features of each. Use this to guide the development of the mobile app and microservices.

*   **`aws_infrastructure_guide.md`**: This document provides a step-by-step guide for setting up the required AWS infrastructure using CloudFormation and deploying the application. Follow these instructions to provision the environment.

*   **`project_structure.md`**: This document outlines the recommended project structure for the monorepo, the React Native frontend, and the Node.js backend services. Use this to set up your development environment.

*   **`ai_integration_guide.md`**: This document provides specific technical instructions for integrating the voice AI and computer vision features. Refer to this when implementing the AI-powered components.

## 5. Instructions for Development

1.  **Set up the AWS Infrastructure:** Use the `aws_infrastructure_guide.md` and the provided `cloudformation.yaml` template to provision the necessary AWS resources.

2.  **Initialize the Project:** Create the monorepo and the initial project structure as outlined in `project_structure.md`.

3.  **Develop the Backend Services:** Build the Node.js microservices according to the `api_specifications.md` and `database_schema.md`. Implement the business logic for each service as described in `system_components.md`.

4.  **Develop the Frontend Application:** Build the React Native mobile app, creating the screens and components detailed in `system_components.md`. Connect the frontend to the backend API.

5.  **Integrate the AI Features:** Follow the `ai_integration_guide.md` to implement the voice-first onboarding and house scanning features.

6.  **Deploy the Application:** Use the CI/CD pipeline described in the `aws_infrastructure_guide.md` to deploy the application to AWS.

This project is complex, but all the necessary information has been provided. Please proceed with the development, and refer back to these documents as your single source of truth. Good luck.

# Project Structure & Configuration: Family Chore Management App

**Author:** Manus AI
**Date:** January 20, 2026

## 1. Introduction

This document outlines the recommended project structure and initial configuration files for the family chore management app. A well-organized project structure is crucial for maintainability, scalability, and collaboration. This guide provides a clear blueprint for both the frontend (React Native) and backend (Node.js microservices) components.

## 2. Monorepo Structure

To simplify dependency management and code sharing, a monorepo structure using a tool like Lerna or Nx is recommended.

```
family-chore-app/
├── docs/                # All project documentation
│   ├── technical_architecture.md
│   ├── database_schema.md
│   └── ...
├── packages/
│   ├── mobile-app/      # React Native frontend
│   ├── user-service/    # Backend microservice
│   ├── chore-service/   # Backend microservice
│   └── ...
├── package.json
└── lerna.json
```

## 3. Frontend Project Structure (React Native)

The mobile app will follow a standard React Native project structure, with a clear separation of components, screens, services, and assets.

```
packages/mobile-app/
├── src/
│   ├── api/             # API service calls
│   │   ├── userService.js
│   │   └── choreService.js
│   ├── assets/          # Images, fonts, etc.
│   │   ├── images/
│   │   └── fonts/
│   ├── components/      # Reusable UI components
│   │   ├── Button.js
│   │   └── ChoreCard.js
│   ├── navigation/      # React Navigation setup
│   │   └── AppNavigator.js
│   ├── screens/         # Application screens
│   │   ├── Onboarding/
│   │   ├── Dashboard/
│   │   └── ...
│   ├── services/        # Business logic and services
│   │   ├── authService.js
│   │   └── voiceService.js
│   ├── store/           # State management (Redux/Zustand)
│   │   ├── actions/
│   │   └── reducers/
│   └── utils/           # Utility functions
├── App.js               # Main application component
└── package.json
```

**`packages/mobile-app/package.json`**

```json
{
  "name": "mobile-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-native": "0.71.8",
    "@react-navigation/native": "^6.1.6",
    "@react-navigation/stack": "^6.3.16",
    "axios": "^1.4.0",
    "react-native-vector-icons": "^9.2.0",
    "react-native-voice": "^0.3.0",
    "react-native-camera": "^4.2.1",
    "react-redux": "^8.0.5",
    "@reduxjs/toolkit": "^1.9.5"
  }
}
```

## 4. Backend Project Structure (Node.js Microservice)

Each backend microservice will have a consistent structure, promoting code reuse and simplifying maintenance.

**Example: `packages/user-service/`**

```
packages/user-service/
├── src/
│   ├── api/
│   │   └── routes.js      # API routes
│   ├── config/
│   │   └── index.js       # Environment configuration
│   ├── controllers/
│   │   └── userController.js # Request handling logic
│   ├── models/
│   │   └── userModel.js   # Database models (e.g., with Sequelize/Prisma)
│   ├── services/
│   │   └── authService.js   # Business logic
│   └── utils/
│       └── logger.js      # Logging utility
├── .dockerignore
├── Dockerfile
├── package.json
└── server.js            # Server entry point
```

**`packages/user-service/package.json`**

```json
{
  "name": "user-service",
  "version": "1.0.0",
  "private": true,
  "main": "server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "sequelize": "^6.32.0",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.0.3",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^2.0.22",
    "jest": "^29.5.0",
    "supertest": "^6.3.3"
  }
}
```

## 5. Configuration Files

### 5.1. `.env` File

Each backend service will use a `.env` file for environment-specific configuration. This file should be added to `.gitignore` to prevent committing secrets to version control.

**Example `.env` file:**

```
PORT=3001
DATABASE_URL=postgres://admin:yoursecurepassword@<db_endpoint>:5432/family_chore_db
JWT_SECRET=a-very-secret-key
CORS_ORIGIN=http://localhost:3000
```

### 5.2. `lerna.json`

For a monorepo setup, the `lerna.json` file at the root of the project will manage the packages.

```json
{
  "packages": [
    "packages/*"
  ],
  "version": "1.0.0",
  "npmClient": "npm"
}
```

This structured approach will provide a solid foundation for Claude to begin development. The clear separation of concerns, consistent project layouts, and explicit dependency management will streamline the development process and ensure a high-quality final product.

# Quick Start Guide for Claude AI

**Date:** January 20, 2026

## Overview

This is a quick reference guide to help you get started with building the family chore management app. All detailed documentation is provided in separate files. This guide will help you navigate the project and understand what needs to be built.

## What You're Building

An AI-powered mobile app that helps families manage household chores through:
- Voice-first setup (conversational AI)
- House scanning (computer vision)
- Automated chore assignment (AI-driven)
- Gamified rewards system
- Screen time management integration

## Quick Navigation

| Document | Purpose | When to Read |
|----------|---------|--------------|
| `README.md` | Project overview and instructions | First thing |
| `technical_architecture.md` | System design and components | Before coding |
| `database_schema.md` | Database structure | When setting up backend |
| `api_specifications.md` | API endpoints and formats | When building backend |
| `system_components.md` | Frontend and backend components | During development |
| `aws_infrastructure_guide.md` | AWS setup and deployment | When deploying |
| `project_structure.md` | Folder organization | When initializing project |
| `ai_integration_guide.md` | Voice and vision AI setup | When implementing AI features |

## Development Phases (Recommended Order)

### Phase 1: Foundation (Backend)
1. Set up AWS infrastructure using CloudFormation
2. Create PostgreSQL database with schema from `database_schema.md`
3. Initialize Node.js backend project structure
4. Implement User Service (authentication, family management)
5. Implement Chore Service (CRUD operations)
6. Implement Gamification Service (points, rewards)

### Phase 2: API Integration
1. Build all API endpoints from `api_specifications.md`
2. Implement JWT authentication
3. Add error handling and validation
4. Set up CI/CD pipeline in AWS CodePipeline

### Phase 3: Frontend
1. Initialize React Native project
2. Build navigation structure
3. Create authentication screens
4. Build dashboard screens
5. Connect to backend API

### Phase 4: AI Features
1. Implement voice-first onboarding (follow `ai_integration_guide.md`)
2. Implement house scanning with computer vision
3. Build automated chore distribution algorithm

### Phase 5: Polish & Deployment
1. Add comprehensive error handling
2. Implement offline support
3. Optimize performance
4. Deploy to AWS
5. Conduct testing

## Key Technologies

- **Frontend:** React Native
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL (AWS RDS)
- **Deployment:** AWS (ECS, Fargate, S3, API Gateway)
- **AI/ML:** OpenAI GPT-4/Gemini (voice), YOLOv8 (vision)
- **Infrastructure as Code:** AWS CloudFormation

## Critical Implementation Details

### Voice Setup Flow
1. Capture audio on device → transcribe to text
2. Send text to `/ai/voice-setup` endpoint
3. Backend sends to LLM (GPT-4/Gemini)
4. LLM extracts family details in JSON format
5. Return to frontend for confirmation
6. Repeat until all details collected

### House Scanning Flow
1. User opens camera and scans rooms
2. On-device YOLOv8 model detects objects in real-time
3. Aggregate detections into room/asset map
4. Show summary to user for confirmation
5. Send confirmed data to `/ai/house-scan` endpoint
6. Save to database

### Automated Chore Assignment
1. Weekly scheduled job runs (Lambda/cron)
2. Fetch family members and their ages
3. Fetch master chore list
4. For each child, assign age-appropriate chores
5. Create entries in ASSIGNED_CHORES table
6. Notify family members

## Environment Variables Needed

```
DATABASE_URL=postgres://user:password@host:5432/family_chore_db
JWT_SECRET=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=family-chore-assets
OPENAI_API_KEY=sk-...
CORS_ORIGIN=http://localhost:3000
```

## Testing Strategy

1. **Unit Tests:** Test individual functions and services
2. **Integration Tests:** Test API endpoints with database
3. **End-to-End Tests:** Test complete user flows
4. **Performance Tests:** Ensure API response times < 200ms

## Deployment Checklist

- [ ] AWS infrastructure provisioned
- [ ] Database migrations applied
- [ ] All environment variables configured
- [ ] Docker images built and pushed to ECR
- [ ] ECS tasks and services created
- [ ] API Gateway configured
- [ ] CI/CD pipeline set up
- [ ] SSL certificates configured
- [ ] Monitoring and logging enabled
- [ ] Backup strategy implemented

## Common Pitfalls to Avoid

1. **Don't hardcode secrets** – Use AWS Secrets Manager
2. **Don't skip error handling** – Implement comprehensive error responses
3. **Don't forget CORS** – Configure properly for mobile app
4. **Don't skip validation** – Validate all user inputs
5. **Don't forget rate limiting** – Protect API from abuse
6. **Don't skip logging** – Implement structured logging for debugging

## Getting Help

If you encounter issues:
1. Check the relevant documentation file first
2. Review the API specifications for endpoint details
3. Check the database schema for data structure
4. Review the system components for logic flow
5. Refer to AWS documentation for infrastructure issues

## Success Criteria

The MVP is considered complete when:
- All API endpoints are functional and tested
- React Native app connects to backend successfully
- Voice setup works end-to-end
- House scanning identifies common household items
- Chores are assigned automatically based on age
- Gamification system awards points correctly
- App is deployed to AWS and accessible
- All critical user flows work without errors

Good luck! You have all the information you need to build this application successfully.

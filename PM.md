# Family Chore App - Project Management

## Features Status

| # | Feature | Status | Priority | Notes |
|---|---------|--------|----------|-------|
| 1 | Conversational Onboarding (ChatGPT-style) | ✅ Done | P1 | Chat UI + voice/text + GPT-4 Turbo, 25 tests passing |
| 2 | House Scanning (Image Analysis) | ✅ Done | P2 | GPT-4o Vision (detail:high), asset detection, 27 tests passing |
| 3 | Smart Chore Distribution | ⏳ Pending | P3 | AI-powered fair scheduling |
| 4 | Gamification (Points/Rewards) | ✅ Done | P4 | Basic implementation complete |
| 5 | Screen Time Management | ✅ Done | P5 | Rule-based, app-level only |

## Legend
- ✅ Done - Feature complete and tested
- 🔄 In Progress - Currently working on
- ⏳ Pending - Not started yet
- ❌ Blocked - Has dependencies or issues

## Infrastructure Status

| Component | Status | URL/Details |
|-----------|--------|-------------|
| Frontend (S3) | ✅ Deployed | http://family-chore-app-frontend-579201839256.s3-website-eu-west-1.amazonaws.com |
| CloudFront (HTTPS) | ✅ Deployed | https://dnekl5ak5edve.cloudfront.net |
| Lambda Backend | ✅ Deployed | family-chore-api |
| API Gateway | ✅ Deployed | https://4aeyo9z2hf.execute-api.eu-west-1.amazonaws.com |
| RDS PostgreSQL | ✅ Running | family-chore-db |
| OpenAI Integration | ✅ Deployed | GPT-4 Turbo (chat) + GPT-4o (vision) |

## Change Log

| Date | Feature | Change |
|------|---------|--------|
| 2026-02-07 | Onboarding v2 | Rewrote as ChatGPT-style chat interface with text+voice input, message history, typing indicators |
| 2026-02-07 | House Scanning v2 | Upgraded to GPT-4o Vision detail:high, added asset/object detection, confidence filtering, room deduplication |
| 2026-02-07 | Backend Prompts | Enhanced conversation prompt for warmer tone, better data accumulation; upgraded room analysis for thorough asset detection |
| 2026-02-07 | Testing | Added 52 tests total (25 frontend + 27 backend) using Vitest |
| 2026-02-07 | Project Cleanup | Consolidated docs into family-chore-app/docs/, removed function.zip artifact |
| 2026-02-05 | Voice Onboarding | Completed - CloudFront HTTPS + OpenAI GPT-4 integration |
| 2026-02-05 | Gamification | Basic points/rewards/leaderboard complete |
| 2026-02-05 | Screen Time | Basic rule-based access control complete |
| 2026-01-31 | Initial Deploy | Full app deployed to AWS |

## Sprint: ChatGPT-Style Onboarding + House Scanning (2026-02-07)

### What Changed

#### Feature 1: Conversational Onboarding
- [x] Rewrote Onboarding.tsx as ChatGPT-style chat interface
- [x] Chat message history with AI/user bubbles
- [x] Text input field + mic button (type or talk)
- [x] Typing indicator (bouncing dots) while AI processes
- [x] Live speech transcription while listening
- [x] TTS toggle (mute/unmute voice)
- [x] Setup progress card showing extracted data
- [x] Seamless transition from chat to room scanning
- [x] Manual form mode as fallback (switchable)
- [x] Enhanced GPT-4 Turbo system prompt (warmer, more human)
- [x] Better data accumulation across conversation turns
- [x] 25 frontend tests passing

#### Feature 2: House Image Analysis
- [x] Upgraded GPT-4o Vision from detail:low to detail:high
- [x] Asset/object detection (appliances, furniture, fixtures)
- [x] Confidence threshold filtering (>= 0.5)
- [x] Room deduplication (case-insensitive)
- [x] Smarter chore difficulty inference (easy/medium/hard with points)
- [x] Room scan data stored in family house_details JSONB
- [x] Specific chores per detected asset (not generic)
- [x] Multi-room scanning flow in chat UI
- [x] 27 backend tests passing

### URLs
- **HTTPS App URL:** https://dnekl5ak5edve.cloudfront.net
- **API Gateway:** https://4aeyo9z2hf.execute-api.eu-west-1.amazonaws.com

## Next Sprint: Smart Chore Distribution (P3)

### Tasks
- [ ] Improve fairness algorithm for chore assignment
- [ ] Consider chore preferences and history
- [ ] Weekly rotation logic
- [ ] Notification system for assigned chores

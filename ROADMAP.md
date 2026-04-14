# Family Chore App — Feature Roadmap & Backlog

> **Last updated:** 2026-04-05

---

## Status Legend
- **Shipped** — Live in production
- **In Progress** — Currently being built
- **Planned** — Approved, will be built next
- **Backlog** — Idea captured, not yet scheduled
- **Concept** — Needs design/research before committing

---

## Shipped (v1.0)

### Web App (React)
- [x] Voice-first onboarding with AI conversation
- [x] House scanning with GPT-4o Vision (smart appliance detection)
- [x] AI-powered chore distribution (GPT-4o-mini, no duplicates, fair rotation)
- [x] Gamification: points, Rookie/Pro/Legend tiers, XP system
- [x] Weekly Superstar (silver) & Monthly Hero (gold) badges
- [x] Weekly progress badges (Getting Started → Chore Champion)
- [x] Streak tracking with fire meter
- [x] Rewards Shop (galaxy theme, per-child rewards)
- [x] Jobs Board (open + application-based, bidding, cash rewards, credibility system)
- [x] Family Rules page (bins, pets, gaming schedule)
- [x] Chore transfer (100% points) & support request (50/50 split)
- [x] Extra chores (claim bonus tasks)
- [x] Parent participation toggle
- [x] Auto-generated pet care & bin chores
- [x] Screen time management (chore-gated access)
- [x] Child invitation system (7-day expiry links)
- [x] Room scanning from Settings (post-setup)
- [x] Interactive dashboard (clickable stats)
- [x] Project wiki (WIKI.md + wiki.html)

### iOS App (SwiftUI — OMyDay) — v1.0.1 on TestFlight
- [x] 52 Swift files, full feature parity with web + new features
- [x] Smart auth (email, invite codes, biometric, kid exploring)
- [x] AI onboarding (GPT-4o voice/text, bins, pets, rooms)
- [x] Chore system v2 (morning/evening routines, daily habits, pet rotation)
- [x] Contracts board (kid pitching, portfolio, subcontracting)
- [x] Guided room scanning (name room → multi-photo → AI merge)
- [x] Unified invite codes (children, partners, link exploring kids)
- [x] Manage Family Members (add, invite, edit, remove, role change)
- [x] Manage Home (edit name, house type, delete family)
- [x] Business Portfolio (reliability, earnings, business levels)
- [x] Custom app icon + OMyDay branding
- [x] Published to TestFlight (Build 4)
- [x] Dark game theme with neon accents
- [x] Models, APIClient, KeychainHelper, Stores
- [x] Auth flow (Login/Register → RPG title screen)
- [x] Child views: Quest Map, Quest Detail, Profile
- [x] Parent views: Command Center, Approvals, Settings
- [x] Shared views: Shop, Leaderboard, Bounty Board
- [x] Game components: XP Bar, Quest Card, Streak Meter, Badge Grid, Particle Effects, Game Tab Bar

---

## Planned (v1.1)

### Inter-Family Leaderboard
**Priority: HIGH**
Families can see their progress amongst other families on a global leaderboard. Children get incentivized to finish tasks to boost their family's ranking.

- [ ] Backend: aggregate family scores (sum of all members' points)
- [ ] Backend: `GET /v1/leaderboard/global` — returns top families (anonymized or opt-in)
- [ ] Backend: opt-in/opt-out toggle per family for public leaderboard
- [ ] Frontend: Global Leaderboard tab showing family rankings
- [ ] Frontend: "Family Score" displayed on dashboard
- [ ] iOS: Global Rankings screen in game style
- [ ] Privacy: families must opt-in, display names only (no emails/personal data)
- [ ] Weekly reset option vs all-time rankings
- [ ] Achievement: "Top 10 Family" badge

### iOS App — Full Feature Parity
**Priority: HIGH**
- [ ] Fix network connectivity (entitlements)
- [ ] Test full login → quest map → complete → approve flow
- [ ] Family Rules view (bins, pets, gaming)
- [ ] Extra Quests view (claim bonus chores)
- [ ] Screen Time view
- [ ] Room scanning with camera
- [ ] Chore transfer/support UI
- [ ] Push notifications (APNs)

---

## Backlog (v1.2+)

### Notifications System
- [ ] Push notifications for new chore assignments
- [ ] Reminders before chore due dates
- [ ] Notification when chore is approved (points earned!)
- [ ] Badge achievement notifications
- [ ] Job posted notification for children
- [ ] Streak at risk reminder ("Complete your chores to keep your streak!")

### Smart Chore Distribution Enhancements
- [ ] Learn from completion history (assign chores kids complete faster)
- [ ] Seasonal chores (e.g., snow shoveling in winter, garden in summer)
- [ ] Custom recurrence patterns (e.g., every other day, first Monday of month)
- [ ] Chore difficulty auto-adjustment based on child's completion rate

### Advanced Gamification
- [ ] Avatar customization (unlock outfits/accessories with points)
- [ ] Achievement system beyond badges (quests completed milestones, points milestones)
- [ ] Daily login bonus
- [ ] Bonus XP for completing all chores before a time deadline
- [ ] "Power-ups" — temporary point multipliers earned through streaks
- [ ] Seasonal events / limited-time challenges

### Financial Literacy Integration
- [ ] Pocket money tracking (parents log allowance)
- [ ] Savings goals (kids save points toward big rewards)
- [ ] Gift card redemption integration (Amazon, app stores)
- [ ] Cash-out request workflow (child requests, parent confirms handover)

### Screen Time Integration (Deep)
- [ ] Integrate with iOS Screen Time API
- [ ] Integrate with gaming platforms (Roblox, Minecraft play time)
- [ ] Auto-lock device features until daily chores completed
- [ ] Gaming schedule enforcement (block apps outside allowed hours)

### Social Features
- [ ] Friend system between families
- [ ] Challenge another family (e.g., "who completes more chores this week")
- [ ] Community forums / Discord integration
- [ ] Share achievements to social media

### Onboarding Enhancements
- [ ] Tutorial videos for voice setup and house scanning
- [ ] White-glove onboarding for early adopters
- [ ] A/B testing different onboarding flows
- [ ] Guided tour after setup ("here's how to...")

### Analytics & Insights (Parents)
- [ ] Weekly family report (email digest)
- [ ] Chore completion trends over time (charts)
- [ ] Per-child performance insights
- [ ] Reward redemption analytics
- [ ] "Busiest chore day" and optimization suggestions

### Multi-Household Support
- [ ] Co-parenting: two households, shared children
- [ ] Different chore lists per household
- [ ] Sync points across households
- [ ] Custody schedule awareness

### Offline Support
- [ ] PWA with service worker (web)
- [ ] Local storage fallback when offline
- [ ] Sync queue for offline chore completions
- [ ] iOS: CoreData cache layer

---

## Concepts (Needs Research)

### AI Chore Coach
- Personal AI assistant per child that encourages them
- Suggests optimal chore order based on time of day
- Natural language: "Hey MyDay, what should I do next?"

### AR Room Detection
- Use iPhone LiDAR to scan rooms in 3D
- Auto-detect mess level and suggest cleaning tasks
- Before/after photo comparison for chore verification

### Marketplace / Commission Model
- In-app rewards marketplace (parents buy from partners)
- 10% commission on third-party reward fulfillment
- Brand partnerships (toy companies, experience providers)

### Sign in with Apple
**Priority: HIGH**
- Backend: `POST /auth/apple` endpoint — accepts Apple identity token, creates/finds user, returns JWT
- iOS: `AuthenticationServices` framework already imported, just needs backend
- Eliminates email/password friction for parents

### Sign in with Google
**Priority: HIGH**
- Backend: `POST /auth/google` endpoint — accepts Google identity token, creates/finds user, returns JWT
- iOS: Requires `GoogleSignIn` SDK pod/SPM integration
- Covers Android-switching families

### Kid Avatar / Character Customization
- Minecraft-style characters kids can unlock and customize with earned points
- Visual character creator during registration (hair, skin, clothes, accessories)
- Outfits, accessories, and skins unlockable via rewards shop
- Displayed on leaderboard, quest cards, profile page
- Seasonal cosmetics and limited-time items
- Avatar displayed across family — siblings can see each other's characters

### Wearable Integration
- Apple Watch companion app
- Quick chore check-off from wrist
- Haptic reminders for due chores
- Streak celebration animations

---

## How to Propose a Feature

1. Add it to the appropriate section in this file
2. Include: what it does, who it's for, and why it matters
3. Tag with priority if known (HIGH/MEDIUM/LOW)
4. Update the wiki changelog when shipped

import SwiftUI

struct ScreenTimeView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(FamilyStore.self) private var familyStore

    var body: some View {
        if auth.isParent {
            ParentScreenTimeView()
        } else {
            ChildScreenTimeView()
        }
    }
}

// MARK: - Child Screen Time View
struct ChildScreenTimeView: View {
    @Environment(AuthManager.self) private var auth
    @State private var access: ScreenTimeAccess?
    @State private var settings: ScreenTimeSettings?
    @State private var isLoading = true

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 20) {
                    VStack(spacing: 8) {
                        Image(systemName: "tv.fill").font(.system(size: 40)).foregroundStyle(.neonBlue).neonGlow(.neonBlue, radius: 12)
                        Text("Screen Time").font(.system(size: 24, weight: .black, design: .rounded)).foregroundStyle(.white)
                    }.padding(.top, 12)

                    if isLoading {
                        ProgressView().tint(.neonBlue).padding(.top, 40)
                    } else if let access {
                        // Access status
                        VStack(spacing: 12) {
                            ZStack {
                                Circle().fill(access.accessGranted ? Color.neonGreen.opacity(0.15) : Color.neonRed.opacity(0.15)).frame(width: 80, height: 80)
                                Image(systemName: access.accessGranted ? "checkmark.shield.fill" : "lock.shield.fill")
                                    .font(.system(size: 36))
                                    .foregroundStyle(access.accessGranted ? .neonGreen : .neonRed)
                                    .neonGlow(access.accessGranted ? .neonGreen : .neonRed, radius: 12)
                            }
                            Text(access.accessGranted ? "Screen Time Unlocked!" : "Screen Time Locked")
                                .font(.system(size: 18, weight: .black, design: .rounded))
                                .foregroundStyle(access.accessGranted ? .neonGreen : .neonRed)

                            if let reason = access.reason, !reason.isEmpty {
                                Text(reason).font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.5)).multilineTextAlignment(.center)
                            }
                        }.gameCard(glow: access.accessGranted ? .neonGreen : .neonRed)

                        // Requirements
                        if let todayCompleted = access.todayCompleted, let todayTotal = access.todayTotal {
                            HStack {
                                Image(systemName: "checkmark.circle.fill").foregroundStyle(.neonGreen)
                                Text("Chores: \(todayCompleted)/\(todayTotal) completed")
                                    .font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                Spacer()
                            }.gameCard(glow: .neonGreen.opacity(0.3))
                        }

                        if let current = access.currentPoints, let required = access.requiredPoints, required > 0 {
                            HStack {
                                Image(systemName: "star.fill").foregroundStyle(.neonYellow)
                                Text("Points: \(current)/\(required)")
                                    .font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                Spacer()
                            }.gameCard(glow: .neonYellow.opacity(0.3))
                        }

                        if let settings, settings.dailyLimitMinutes > 0 {
                            HStack {
                                Image(systemName: "clock.fill").foregroundStyle(.neonBlue)
                                Text("Daily limit: \(settings.dailyLimitMinutes) minutes")
                                    .font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                Spacer()
                            }.gameCard(glow: .neonBlue.opacity(0.3))
                        }

                        Text("Complete your daily chores to unlock screen time!")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.3))
                            .multilineTextAlignment(.center)
                    }
                }.padding(16)
            }
        }
        .task {
            guard let uid = auth.userId else { return }
            do {
                access = try await APIClient.shared.getScreenTimeAccess(uid)
                settings = try await APIClient.shared.getScreenTime(uid)
            } catch {}
            isLoading = false
        }
    }
}

// MARK: - Parent Screen Time View
struct ParentScreenTimeView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(FamilyStore.self) private var familyStore
    @State private var selectedChild: FamilyMember?
    @State private var settings = ScreenTimeSettings()
    @State private var access: ScreenTimeAccess?
    @State private var isSaving = false
    @State private var saved = false

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    VStack(spacing: 8) {
                        Image(systemName: "tv.fill").font(.system(size: 40)).foregroundStyle(.neonBlue).neonGlow(.neonBlue, radius: 12)
                        Text("Screen Time").font(.system(size: 24, weight: .black, design: .rounded)).foregroundStyle(.white)
                        Text("Configure per child").font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                    }.padding(.top, 12)

                    // Child selector
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(familyStore.children) { child in
                                Button {
                                    selectedChild = child
                                    Task { await loadChildSettings(child.userId) }
                                } label: {
                                    HStack(spacing: 6) {
                                        Text(child.firstName.prefix(1).uppercased())
                                            .font(.system(size: 14, weight: .bold, design: .rounded))
                                            .foregroundStyle(selectedChild?.userId == child.userId ? .white : .neonPurple)
                                        Text(child.firstName)
                                            .font(.system(size: 13, weight: .bold, design: .rounded))
                                            .foregroundStyle(selectedChild?.userId == child.userId ? .white : .white.opacity(0.5))
                                    }
                                    .padding(.horizontal, 14).padding(.vertical, 8)
                                    .background(selectedChild?.userId == child.userId ? Color.neonPurple : Color.gameCardLight)
                                    .clipShape(Capsule())
                                }
                            }
                        }
                    }

                    if let child = selectedChild {
                        // Inline stats grid
                        if let access {
                            HStack(spacing: 8) {
                                MiniStat(icon: "clock.fill", value: "\(settings.dailyLimitMinutes)", label: "Daily Min", color: .neonBlue)
                                MiniStat(icon: "star.fill", value: "\(access.currentPoints ?? 0)", label: "Points", color: .neonYellow)
                                MiniStat(icon: "checkmark.circle.fill", value: "\(access.todayCompleted ?? 0)/\(access.todayTotal ?? 0)", label: "Chores", color: .neonGreen)
                            }
                        }

                        // Settings form
                        VStack(spacing: 14) {
                            HStack {
                                Text("Settings for \(child.firstName)")
                                    .font(.system(size: 16, weight: .bold, design: .rounded))
                                    .foregroundStyle(.white)
                                Spacer()
                            }

                            // Daily limit
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Daily limit (minutes)").font(.system(size: 12, weight: .bold)).foregroundStyle(.white.opacity(0.4))
                                HStack {
                                    Text("\(settings.dailyLimitMinutes) min")
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                        .foregroundStyle(.neonBlue)
                                    Spacer()
                                    Stepper("", value: $settings.dailyLimitMinutes, in: 0...480, step: 15)
                                        .labelsHidden()
                                }
                            }.gameCard(glow: .neonBlue.opacity(0.2))

                            // Require daily chores
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text("Require daily chores").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                    Text("Must complete all chores first").font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                                }
                                Spacer()
                                Toggle("", isOn: $settings.requireDailyChores).tint(.neonGreen)
                            }.gameCard()

                            // Minimum points
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Minimum points required").font(.system(size: 12, weight: .bold)).foregroundStyle(.white.opacity(0.4))
                                HStack {
                                    Text("\(settings.minimumPoints) pts")
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                        .foregroundStyle(.neonYellow)
                                    Spacer()
                                    Stepper("", value: $settings.minimumPoints, in: 0...10000, step: 10)
                                        .labelsHidden()
                                }
                            }.gameCard(glow: .neonYellow.opacity(0.2))

                            // Save
                            if saved {
                                HStack { Image(systemName: "checkmark.circle.fill"); Text("Saved!") }
                                    .font(.system(size: 14, weight: .bold)).foregroundStyle(.neonGreen)
                            }

                            Button("Save Settings") {
                                isSaving = true
                                Task {
                                    try? await APIClient.shared.updateScreenTime(child.userId, settings: settings)
                                    saved = true; isSaving = false
                                    try? await Task.sleep(for: .seconds(2)); saved = false
                                }
                            }
                            .buttonStyle(NeonButtonStyle(color: .neonBlue))
                            .disabled(isSaving)
                        }

                        // Current access status
                        if let access {
                            VStack(spacing: 8) {
                                HStack {
                                    Text("Current Status")
                                        .font(.system(size: 14, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                    Spacer()
                                    HStack(spacing: 4) {
                                        Circle().fill(access.accessGranted ? Color.neonGreen : Color.neonRed).frame(width: 8, height: 8)
                                        Text(access.accessGranted ? "Unlocked" : "Locked")
                                            .font(.system(size: 12, weight: .bold, design: .rounded))
                                            .foregroundStyle(access.accessGranted ? .neonGreen : .neonRed)
                                    }
                                }
                                if let reason = access.reason, !reason.isEmpty {
                                    Text(reason).font(.system(size: 12, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                                        .frame(maxWidth: .infinity, alignment: .leading)
                                }
                            }.gameCard(glow: (access.accessGranted ? Color.neonGreen : Color.neonRed).opacity(0.3))
                        }
                    } else {
                        Text("Select a child to configure screen time")
                            .font(.system(size: 14, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.3))
                            .padding(.top, 40)
                    }

                    // How it works info card
                    VStack(alignment: .leading, spacing: 8) {
                        HStack(spacing: 6) {
                            Image(systemName: "info.circle.fill").foregroundStyle(.neonBlue)
                            Text("How Screen Time Works").font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(.neonBlue)
                        }
                        VStack(alignment: .leading, spacing: 4) {
                            Text("• Set daily time limits for each child").font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                            Text("• Require chore completion before unlocking").font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                            Text("• Set minimum point thresholds for access").font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                            Text("• Children can check their status in the app").font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                        }
                    }.gameCard(glow: .neonBlue.opacity(0.2))
                }.padding(16)
            }
        }
        .task {
            if let first = familyStore.children.first {
                selectedChild = first
                await loadChildSettings(first.userId)
            }
        }
    }

    private func loadChildSettings(_ userId: String) async {
        do {
            settings = try await APIClient.shared.getScreenTime(userId)
            access = try await APIClient.shared.getScreenTimeAccess(userId)
        } catch {
            settings = ScreenTimeSettings()
            access = nil
        }
    }
}

// MARK: - Mini Stat Component
struct MiniStat: View {
    let icon: String; let value: String; let label: String; let color: Color
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 14)).foregroundStyle(color)
            Text(value).font(.system(size: 16, weight: .black, design: .rounded)).foregroundStyle(.white)
            Text(label).font(.system(size: 9, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.4))
        }
        .frame(maxWidth: .infinity).gameCard(glow: color.opacity(0.2))
    }
}

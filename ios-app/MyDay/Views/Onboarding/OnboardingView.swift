import SwiftUI

/// Inline family setup flow — shown after new parent registers with no family.
/// Also shows a "Join existing family" option for parent 2.
struct SetupFamilyFlow: View {
    @Environment(AuthManager.self) private var auth
    @Environment(FamilyStore.self) private var familyStore
    @State private var step: SetupStep = .start
    @State private var mode: SetupMode = .choosing
    @State private var familyName = ""
    @State private var houseType = "house"
    @State private var children: [(name: String, age: String)] = [("", "")]
    @State private var selectedRewardIds: Set<String> = []
    @State private var isSubmitting = false
    @State private var error: String?
    @State private var showJoinFamily = false
    @State private var aiChatComplete = false
    @State private var extractedBinSchedule: ExtractedBinSchedule?
    @State private var extractedPets: [ExtractedPet]?
    @State private var didRestoreProgress = false

    enum SetupStep: Int { case start = 0, family = 1, children = 2, rewards = 3, complete = 4 }
    enum SetupMode { case choosing, aiChat, manual }

    // MARK: - Persistence Helpers
    private static let progressKey = "onboarding_progress"

    private func saveProgress() {
        var data: [String: Any] = [:]
        if !familyName.isEmpty { data["familyName"] = familyName }
        if houseType != "house" { data["houseType"] = houseType }
        let validChildren = children.filter { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty }
        if !validChildren.isEmpty {
            data["children"] = validChildren.map { ["name": $0.name, "age": $0.age] }
        }
        if !selectedRewardIds.isEmpty { data["rewards"] = Array(selectedRewardIds) }
        data["step"] = step.rawValue
        data["mode"] = mode == .aiChat ? "aiChat" : mode == .manual ? "manual" : "choosing"
        data["aiChatComplete"] = aiChatComplete
        UserDefaults.standard.set(data, forKey: Self.progressKey)
    }

    private func restoreProgress() {
        guard let data = UserDefaults.standard.dictionary(forKey: Self.progressKey) else { return }
        if let fn = data["familyName"] as? String { familyName = fn }
        if let ht = data["houseType"] as? String { houseType = ht }
        if let kids = data["children"] as? [[String: String]] {
            children = kids.map { ($0["name"] ?? "", $0["age"] ?? "") }
            if children.isEmpty { children = [("", "")] }
        }
        if let rids = data["rewards"] as? [String] { selectedRewardIds = Set(rids) }
        if let m = data["mode"] as? String {
            mode = m == "aiChat" ? .aiChat : m == "manual" ? .manual : .choosing
        }
        if let aic = data["aiChatComplete"] as? Bool { aiChatComplete = aic }
        // Restore step — but go to rewards if AI chat was complete, or to the saved step for manual
        if let s = data["step"] as? Int, let restoredStep = SetupStep(rawValue: s) {
            if restoredStep == .complete { step = .start } // Don't restore to complete
            else if aiChatComplete { step = .start; mode = .aiChat } // AI chat done → show rewards
            else if mode == .manual && restoredStep.rawValue > 0 { step = restoredStep }
        }
        didRestoreProgress = true
    }

    static func clearProgress() {
        UserDefaults.standard.removeObject(forKey: progressKey)
    }

    private var progress: Double {
        guard step.rawValue > 0 else { return 0 }
        return Double(step.rawValue) / 4.0
    }

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                // Progress + join family option
                if step != .start && step != .complete {
                    HStack {
                        if step == .family {
                            Button { withAnimation { step = .start } } label: {
                                HStack(spacing: 4) { Image(systemName: "chevron.left"); Text("Back") }
                                    .font(.system(size: 14, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                            }
                        } else if step == .children {
                            Button { withAnimation { step = .family } } label: {
                                HStack(spacing: 4) { Image(systemName: "chevron.left"); Text("Back") }
                                    .font(.system(size: 14, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                            }
                        } else if step == .rewards {
                            Button { withAnimation { step = .children } } label: {
                                HStack(spacing: 4) { Image(systemName: "chevron.left"); Text("Back") }
                                    .font(.system(size: 14, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                            }
                        }
                        Spacer()
                        Text("Step \(step.rawValue) of 3").font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                    }
                    .padding(.horizontal, 24).padding(.top, 12)

                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color.gameCardLight)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(LinearGradient(colors: [.neonBlue, .neonPurple], startPoint: .leading, endPoint: .trailing))
                                .frame(width: geo.size.width * progress)
                                .animation(.spring(response: 0.5), value: progress)
                        }
                    }.frame(height: 6).padding(.horizontal, 24).padding(.top, 8)
                }

                // Content
                if mode == .aiChat && !aiChatComplete {
                    VStack(spacing: 0) {
                        HStack {
                            Button { withAnimation { mode = .choosing; step = .start } } label: {
                                HStack(spacing: 4) { Image(systemName: "chevron.left"); Text("Back") }
                                    .font(.system(size: 14, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                            }
                            Spacer()
                            Button("Switch to Manual") { withAnimation { mode = .manual; step = .family } }
                                .font(.system(size: 12, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                        }.padding(.horizontal, 16).padding(.top, 8)

                        AIChatOnboardingView(
                            onComplete: $aiChatComplete,
                            extractedFamilyName: $familyName,
                            extractedChildren: $children,
                            extractedBinSchedule: $extractedBinSchedule,
                            extractedPets: $extractedPets
                        )
                    }
                } else if mode == .aiChat && aiChatComplete {
                    // AI done → rewards step
                    ScrollView {
                        rewardsStep.padding(24)
                    }
                } else {
                    ScrollView {
                        VStack(spacing: 24) {
                            switch step {
                            case .start: startStep
                            case .family: familyStep
                            case .children: childrenStep
                            case .rewards: rewardsStep
                            case .complete: completeStep
                            }
                        }.padding(24)
                    }
                }
            }
        }
        .navigationDestination(isPresented: $showJoinFamily) {
            ClaimInviteView()
        }
        .onAppear {
            if !didRestoreProgress { restoreProgress() }
        }
        .onChange(of: familyName) { _, _ in saveProgress() }
        .onChange(of: children.count) { _, _ in saveProgress() }
        .onChange(of: step) { _, _ in saveProgress() }
        .onChange(of: aiChatComplete) { _, _ in saveProgress() }
    }

    // MARK: - Start Step (choose mode or join existing family)
    private var startStep: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 20)

            Image(systemName: "sparkles").font(.system(size: 52)).foregroundStyle(.neonBlue).neonGlow(.neonBlue, radius: 24)
            Text("Set Up Your Family").font(.system(size: 28, weight: .black, design: .rounded)).foregroundStyle(.white)
            Text("Hi \(auth.user?.firstName ?? "there")! Let's get your family started.")
                .font(.system(size: 15, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.5)).multilineTextAlignment(.center)

            // Join existing family (parent 2)
            Button { showJoinFamily = true } label: {
                HStack(spacing: 12) {
                    Image(systemName: "link.circle.fill").font(.system(size: 24)).foregroundStyle(.neonGreen)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Join an existing family").font(.system(size: 15, weight: .bold, design: .rounded)).foregroundStyle(.white)
                        Text("Your partner already set things up? Enter their code").font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                    }
                    Spacer()
                    Image(systemName: "chevron.right").foregroundStyle(.white.opacity(0.2))
                }
                .padding(16).background(Color.neonGreen.opacity(0.06)).clipShape(RoundedRectangle(cornerRadius: 14))
                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.neonGreen.opacity(0.2), lineWidth: 1))
            }.buttonStyle(.plain)

            HStack { Rectangle().fill(.white.opacity(0.08)).frame(height: 1); Text("or create new").font(.system(size: 12, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.25)); Rectangle().fill(.white.opacity(0.08)).frame(height: 1) }

            // AI Chat setup
            Button { withAnimation { mode = .aiChat } } label: {
                HStack(spacing: 14) {
                    ZStack {
                        Circle().fill(Color.neonBlue.opacity(0.15)).frame(width: 46, height: 46)
                        Image(systemName: "mic.fill").font(.system(size: 20)).foregroundStyle(.neonBlue)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Chat with AI").font(.system(size: 15, weight: .bold, design: .rounded)).foregroundStyle(.white)
                        Text("Voice or text — AI guides you").font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                    }
                    Spacer()
                    Image(systemName: "chevron.right").foregroundStyle(.neonBlue.opacity(0.4))
                }.padding(14).background(Color.gameCard).clipShape(RoundedRectangle(cornerRadius: 14)).overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.neonBlue.opacity(0.2), lineWidth: 1))
            }.buttonStyle(.plain)

            // Manual setup
            Button { withAnimation { mode = .manual; step = .family } } label: {
                HStack(spacing: 14) {
                    ZStack {
                        Circle().fill(Color.neonPurple.opacity(0.15)).frame(width: 46, height: 46)
                        Image(systemName: "list.bullet.rectangle").font(.system(size: 18)).foregroundStyle(.neonPurple)
                    }
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Manual setup").font(.system(size: 15, weight: .bold, design: .rounded)).foregroundStyle(.white)
                        Text("Fill in the details yourself").font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                    }
                    Spacer()
                    Image(systemName: "chevron.right").foregroundStyle(.neonPurple.opacity(0.4))
                }.padding(14).background(Color.gameCard).clipShape(RoundedRectangle(cornerRadius: 14)).overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.neonPurple.opacity(0.15), lineWidth: 1))
            }.buttonStyle(.plain)

            // Logout
            Button("Log out") { auth.fullLogout() }
                .font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.2)).padding(.top, 8)
        }
    }

    // MARK: - Family Step
    private var familyStep: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Image(systemName: "house.fill").font(.system(size: 40)).foregroundStyle(.neonBlue).neonGlow(.neonBlue, radius: 12)
                Text("Name Your Family").font(.system(size: 24, weight: .black, design: .rounded)).foregroundStyle(.white)
            }
            VStack(alignment: .leading, spacing: 6) {
                Text("Family Name").font(.system(size: 12, weight: .bold)).foregroundStyle(.white.opacity(0.4))
                GameTextField(icon: "person.3.fill", placeholder: "e.g. The Johnsons", text: $familyName)
            }
            VStack(alignment: .leading, spacing: 6) {
                Text("Home Type").font(.system(size: 12, weight: .bold)).foregroundStyle(.white.opacity(0.4))
                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
                    HouseTypeCard(type: "house", label: "House", icon: "house.fill", selected: houseType == "house") { houseType = "house" }
                    HouseTypeCard(type: "apartment", label: "Apartment", icon: "building.2.fill", selected: houseType == "apartment") { houseType = "apartment" }
                    HouseTypeCard(type: "condo", label: "Condo", icon: "building.fill", selected: houseType == "condo") { houseType = "condo" }
                    HouseTypeCard(type: "townhouse", label: "Townhouse", icon: "house.lodge.fill", selected: houseType == "townhouse") { houseType = "townhouse" }
                }
            }
            Button("Next") { withAnimation { step = .children } }
                .buttonStyle(NeonButtonStyle()).disabled(familyName.trimmingCharacters(in: .whitespaces).isEmpty)
                .opacity(familyName.trimmingCharacters(in: .whitespaces).isEmpty ? 0.5 : 1)
        }
    }

    // MARK: - Children Step
    private var childrenStep: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Image(systemName: "person.3.fill").font(.system(size: 40)).foregroundStyle(.neonPurple).neonGlow(.neonPurple, radius: 12)
                Text("Add Your Children").font(.system(size: 24, weight: .black, design: .rounded)).foregroundStyle(.white)
                Text("You can add more later").font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
            }
            ForEach(children.indices, id: \.self) { i in
                HStack(spacing: 10) {
                    ZStack {
                        Circle().fill(Color.neonPurple.opacity(0.2)).frame(width: 36, height: 36)
                        Text("\(i + 1)").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.neonPurple)
                    }
                    GameTextField(icon: "person.fill", placeholder: "Name", text: Binding(get: { children[i].name }, set: { children[i].name = $0 }))
                    GameTextField(icon: "number", placeholder: "Age", text: Binding(get: { children[i].age }, set: { children[i].age = $0 })).frame(width: 80)
                    if children.count > 1 {
                        Button { children.remove(at: i) } label: { Image(systemName: "minus.circle.fill").font(.system(size: 22)).foregroundStyle(.neonRed.opacity(0.6)) }
                    }
                }
            }
            Button { children.append(("", "")) } label: {
                HStack(spacing: 6) { Image(systemName: "plus.circle.fill"); Text("Add Another") }
                    .font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.neonPurple)
            }
            Button("Next") { withAnimation { step = .rewards } }
                .buttonStyle(NeonButtonStyle(color: .neonPurple))
                .disabled(!children.contains { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty && !$0.age.isEmpty })
        }
    }

    // MARK: - Rewards Step
    private var rewardsStep: some View {
        VStack(spacing: 20) {
            VStack(spacing: 8) {
                Image(systemName: "gift.fill").font(.system(size: 40)).foregroundStyle(.neonGreen).neonGlow(.neonGreen, radius: 12)
                Text("Pick Rewards").font(.system(size: 24, weight: .black, design: .rounded)).foregroundStyle(.white)
                Text("\(selectedRewardIds.count) selected").font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(.neonGreen)
            }
            rewardSection("Daily Rewards", rewards: CuratedReward.daily)
            rewardSection("Weekly Rewards", rewards: CuratedReward.weekly)
            rewardSection("Family Targets", rewards: CuratedReward.familyTarget)
            if let error { Text(error).font(.system(size: 13, weight: .medium)).foregroundStyle(.neonRed) }
            Button(isSubmitting ? "Setting up..." : "Complete Setup") { submitSetup() }
                .buttonStyle(NeonButtonStyle(color: .neonGreen)).disabled(isSubmitting || selectedRewardIds.isEmpty)
            Button("Skip rewards") { selectedRewardIds = []; submitSetup() }
                .font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3)).disabled(isSubmitting)
        }
    }

    @ViewBuilder
    private func rewardSection(_ title: String, rewards: [CuratedReward]) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.5))
            ForEach(rewards) { reward in
                let selected = selectedRewardIds.contains(reward.id)
                Button {
                    if selected { selectedRewardIds.remove(reward.id) } else { selectedRewardIds.insert(reward.id) }
                } label: {
                    HStack(spacing: 12) {
                        Text(reward.emoji).font(.system(size: 24))
                        VStack(alignment: .leading, spacing: 2) {
                            Text(reward.name).font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(.white)
                            Text(reward.description).font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4)).lineLimit(1)
                        }
                        Spacer()
                        Text("\(reward.points) pts").font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(.neonYellow)
                        Image(systemName: selected ? "checkmark.circle.fill" : "circle").font(.system(size: 20)).foregroundStyle(selected ? .neonGreen : .white.opacity(0.2))
                    }
                    .padding(12).background(selected ? Color.neonGreen.opacity(0.08) : Color.gameCardLight)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
                    .overlay(RoundedRectangle(cornerRadius: 12).stroke(selected ? Color.neonGreen.opacity(0.3) : .clear, lineWidth: 1))
                }.buttonStyle(.plain)
            }
        }
    }

    // MARK: - Complete Step
    private var completeStep: some View {
        VStack(spacing: 24) {
            Spacer().frame(height: 60)
            Image(systemName: "checkmark.seal.fill").font(.system(size: 64)).foregroundStyle(.neonGreen).neonGlow(.neonGreen, radius: 24)
            Text("You're All Set!").font(.system(size: 28, weight: .black, design: .rounded)).foregroundStyle(.white)
            Text("Your family is ready.\nChores will be distributed automatically.")
                .font(.system(size: 15, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.5)).multilineTextAlignment(.center)
            Button("Go to Dashboard") {
                Task { await auth.restoreSession(); if let fid = auth.familyId { await familyStore.load(familyId: fid) } }
            }.buttonStyle(NeonButtonStyle(color: .neonGreen))
        }
    }

    // MARK: - Submit
    private func submitSetup() {
        isSubmitting = true; error = nil
        Task {
            do {
                let result = try await APIClient.shared.createFamily(name: familyName, houseType: houseType)
                guard let familyId = result["family_id"] else { error = "Failed"; isSubmitting = false; return }
                for child in children where !child.name.trimmingCharacters(in: .whitespaces).isEmpty {
                    try? await APIClient.shared.addFamilyMember(familyId, firstName: child.name.trimmingCharacters(in: .whitespaces), age: Int(child.age) ?? 8)
                }
                if !selectedRewardIds.isEmpty {
                    let all = CuratedReward.daily + CuratedReward.weekly + CuratedReward.familyTarget
                    let dicts = all.filter { selectedRewardIds.contains($0.id) }.map { ["family_id": familyId, "reward_name": $0.name, "description": $0.description, "point_cost": String($0.points)] }
                    try? await APIClient.shared.bulkCreateRewards(dicts)
                }
                // Save household config (bins + pets from AI chat)
                var config: [String: Any] = [:]
                if let bins = extractedBinSchedule, !bins.bins.isEmpty {
                    let childIds = children.filter { !$0.name.trimmingCharacters(in: .whitespaces).isEmpty }
                    // Map collection days from bins
                    let collectionDays = Array(Set(bins.bins.map { $0.collectionDay.lowercased() }))
                    // Get all child user IDs that were just created - we'll use family members
                    config["bin_schedule"] = [
                        "collection_days": collectionDays,
                        "rotation_children": [] // Will be set after family loads
                    ]
                }
                if let pets = extractedPets, !pets.isEmpty {
                    config["pets"] = pets.map { pet -> [String: Any] in
                        var p: [String: Any] = ["id": UUID().uuidString, "name": pet.name, "type": pet.type]
                        if pet.careTasks.contains("walk") { p["walk_rotation_children"] = [] }
                        if pet.careTasks.contains("litter") { p["litter_rotation_children"] = [] }
                        return p
                    }
                }
                if !config.isEmpty {
                    try? await APIClient.shared.updateFamilyConfig(familyId, config: config)
                }

                try? await APIClient.shared.distributeChores(familyId)
                await auth.restoreSession()
                SetupFamilyFlow.clearProgress()
                withAnimation { step = .complete }
            } catch let err as APIError { error = err.errorDescription }
            catch { self.error = error.localizedDescription }
            isSubmitting = false
        }
    }
}

// MARK: - Supporting Views
struct HouseTypeCard: View {
    let type: String; let label: String; let icon: String; let selected: Bool; let action: () -> Void
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon).font(.system(size: 24)).foregroundStyle(selected ? .neonBlue : .white.opacity(0.3))
                Text(label).font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(selected ? .white : .white.opacity(0.4))
            }.frame(maxWidth: .infinity).padding(.vertical, 16)
            .background(selected ? Color.neonBlue.opacity(0.15) : Color.gameCardLight)
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(selected ? Color.neonBlue.opacity(0.4) : .clear, lineWidth: 1))
        }.buttonStyle(.plain)
    }
}

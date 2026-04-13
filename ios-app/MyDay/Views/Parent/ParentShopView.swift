import SwiftUI

struct ParentShopView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(FamilyStore.self) private var familyStore
    @State private var rewards: [Reward] = []
    @State private var name = ""
    @State private var desc = ""
    @State private var cost = "50"
    @State private var selectedChildId: String?
    @State private var isAdding = false
    @State private var editingReward: Reward?
    @State private var editName = ""
    @State private var editDesc = ""
    @State private var editCost = ""

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "storefront.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(.neonPurple)
                            .neonGlow(.neonPurple, radius: 16)
                        Text("Rewards Shop")
                            .font(.system(size: 24, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                        Text("\(rewards.count) active rewards")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.4))
                    }.padding(.top, 12)

                    // Add new reward form
                    VStack(spacing: 10) {
                        Text("Add Reward")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, alignment: .leading)

                        GameTextField(icon: "gift.fill", placeholder: "Reward name", text: $name)
                        GameTextField(icon: "text.alignleft", placeholder: "Description", text: $desc)
                        GameTextField(icon: "star.fill", placeholder: "Point cost", text: $cost)

                        // Child picker
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Assign to").font(.system(size: 11, weight: .bold)).foregroundStyle(.white.opacity(0.4))
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 8) {
                                    ChildPickerChip(label: "All Children", isSelected: selectedChildId == nil) {
                                        selectedChildId = nil
                                    }
                                    ForEach(familyStore.children) { child in
                                        ChildPickerChip(label: child.firstName, isSelected: selectedChildId == child.userId) {
                                            selectedChildId = child.userId
                                        }
                                    }
                                }
                            }
                        }

                        Button("Add Reward") {
                            isAdding = true
                            Task {
                                try? await APIClient.shared.createReward(
                                    auth.familyId ?? "", name: name,
                                    description: desc, pointCost: Int(cost) ?? 50,
                                    childId: selectedChildId
                                )
                                name = ""; desc = ""; cost = "50"; selectedChildId = nil
                                await loadRewards()
                                isAdding = false
                            }
                        }
                        .buttonStyle(NeonButtonStyle(color: .neonPurple))
                        .disabled(name.isEmpty || isAdding)
                    }
                    .gameCard(glow: .neonPurple.opacity(0.3))

                    // Rewards list
                    ForEach(rewards) { reward in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(reward.rewardName)
                                        .font(.system(size: 14, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                    if let desc = reward.description, !desc.isEmpty {
                                        Text(desc)
                                            .font(.system(size: 11, weight: .medium))
                                            .foregroundStyle(.white.opacity(0.4))
                                            .lineLimit(2)
                                    }
                                }
                                Spacer()
                                HStack(spacing: 4) {
                                    Image(systemName: "star.fill").font(.system(size: 10)).foregroundStyle(.neonYellow)
                                    Text("\(reward.pointCost)").font(.system(size: 13, weight: .black, design: .rounded)).foregroundStyle(.neonYellow)
                                }
                            }

                            HStack(spacing: 12) {
                                if let childName = reward.childName {
                                    Text("For: \(childName)")
                                        .font(.system(size: 10, weight: .medium, design: .rounded))
                                        .foregroundStyle(.neonPurple)
                                } else {
                                    Text("All children")
                                        .font(.system(size: 10, weight: .medium, design: .rounded))
                                        .foregroundStyle(.white.opacity(0.3))
                                }
                                Spacer()
                                Button {
                                    editingReward = reward
                                    editName = reward.rewardName
                                    editDesc = reward.description ?? ""
                                    editCost = String(reward.pointCost)
                                } label: {
                                    Image(systemName: "pencil").font(.system(size: 14)).foregroundStyle(.neonBlue)
                                }
                                Button {
                                    Task {
                                        try? await APIClient.shared.deleteReward(reward.rewardId)
                                        await loadRewards()
                                    }
                                } label: {
                                    Image(systemName: "trash.fill").font(.system(size: 14)).foregroundStyle(.neonRed.opacity(0.6))
                                }
                            }
                        }
                        .gameCard()
                    }
                }
                .padding(16)
            }
        }
        .task { await loadRewards() }
        .refreshable { await loadRewards() }
        .sheet(item: $editingReward) { reward in
            EditRewardSheet(reward: reward, name: editName, desc: editDesc, cost: editCost) {
                await loadRewards()
            }
        }
    }

    private func loadRewards() async {
        guard let fid = auth.familyId else { return }
        do { rewards = try await APIClient.shared.getRewards(fid) } catch {}
    }
}

struct ChildPickerChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 12, weight: .bold, design: .rounded))
                .foregroundStyle(isSelected ? .white : .white.opacity(0.5))
                .padding(.horizontal, 12).padding(.vertical, 6)
                .background(isSelected ? Color.neonPurple.opacity(0.4) : Color.gameCardLight)
                .clipShape(Capsule())
                .overlay(Capsule().stroke(isSelected ? Color.neonPurple.opacity(0.5) : .clear, lineWidth: 1))
        }
    }
}

struct EditRewardSheet: View {
    @Environment(\.dismiss) private var dismiss
    let reward: Reward
    @State var name: String
    @State var desc: String
    @State var cost: String
    let onSave: () async -> Void
    @State private var isSaving = false

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()
            VStack(spacing: 16) {
                Text("Edit Reward").font(.system(size: 22, weight: .black, design: .rounded)).foregroundStyle(.white).padding(.top, 20)
                GameTextField(icon: "gift.fill", placeholder: "Reward name", text: $name)
                GameTextField(icon: "text.alignleft", placeholder: "Description", text: $desc)
                GameTextField(icon: "star.fill", placeholder: "Point cost", text: $cost)

                Button("Save Changes") {
                    isSaving = true
                    Task {
                        try? await APIClient.shared.updateReward(reward.rewardId, name: name, description: desc, pointCost: Int(cost) ?? 50)
                        await onSave()
                        dismiss()
                    }
                }
                .buttonStyle(NeonButtonStyle(color: .neonPurple))
                .disabled(name.isEmpty || isSaving)

                Button("Cancel") { dismiss() }
                    .font(.system(size: 14, weight: .medium)).foregroundStyle(.white.opacity(0.3))
            }.padding(20)
        }
    }
}

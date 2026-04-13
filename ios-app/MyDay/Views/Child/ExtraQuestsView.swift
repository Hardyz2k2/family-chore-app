import SwiftUI

struct ExtraQuestsView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(ChoreStore.self) private var choreStore
    @Environment(\.dismiss) private var dismiss
    @State private var claimingId: String?

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    HStack {
                        Button { dismiss() } label: {
                            Image(systemName: "xmark.circle.fill").font(.system(size: 28)).foregroundStyle(.white.opacity(0.3))
                        }
                        Spacer()
                    }

                    VStack(spacing: 8) {
                        Image(systemName: "bolt.circle.fill").font(.system(size: 44)).foregroundStyle(.neonPurple).neonGlow(.neonPurple, radius: 12)
                        Text("Bonus Quests").font(.system(size: 24, weight: .black, design: .rounded)).foregroundStyle(.white)
                        Text("Claim extra chores for bonus XP!").font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                    }

                    if choreStore.extraChores.isEmpty {
                        Text("No bonus quests available right now").font(.system(size: 14, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3)).padding(.top, 40)
                    } else {
                        ForEach(choreStore.extraChores) { chore in
                            HStack(spacing: 14) {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(chore.choreName).font(.system(size: 15, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                    if let desc = chore.description, !desc.isEmpty {
                                        Text(desc).font(.system(size: 12, weight: .medium)).foregroundStyle(.white.opacity(0.4)).lineLimit(1)
                                    }
                                    HStack(spacing: 8) {
                                        let tier = DifficultyTier(rawValue: chore.difficulty) ?? .easy
                                        Text(tier.label).font(.system(size: 10, weight: .heavy, design: .rounded))
                                            .foregroundStyle(tier == .easy ? .rookieGreen : tier == .medium ? .proYellow : .legendRed)
                                            .padding(.horizontal, 8).padding(.vertical, 3)
                                            .background((tier == .easy ? Color.rookieGreen : tier == .medium ? Color.proYellow : Color.legendRed).opacity(0.15))
                                            .clipShape(Capsule())
                                        HStack(spacing: 3) {
                                            Image(systemName: "star.fill").font(.system(size: 11)).foregroundStyle(.neonYellow)
                                            Text("\(chore.points)").font(.system(size: 13, weight: .black, design: .rounded)).foregroundStyle(.neonYellow)
                                        }
                                    }
                                }
                                Spacer()
                                Button {
                                    claimingId = chore.choreId
                                    Task {
                                        try? await APIClient.shared.claimExtraChore(auth.userId ?? "", choreId: chore.choreId)
                                        if let uid = auth.userId { await choreStore.loadExtraChores(userId: uid) }
                                        claimingId = nil
                                    }
                                } label: {
                                    Text(claimingId == chore.choreId ? "..." : "Claim")
                                        .font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                        .padding(.horizontal, 16).padding(.vertical, 8)
                                        .background(Color.neonPurple).clipShape(Capsule())
                                }
                                .disabled(claimingId == chore.choreId)
                            }
                            .gameCard(glow: .neonPurple.opacity(0.3))
                        }
                    }
                }
                .padding(16)
            }
        }
        .task {
            if let uid = auth.userId { await choreStore.loadExtraChores(userId: uid) }
        }
    }
}

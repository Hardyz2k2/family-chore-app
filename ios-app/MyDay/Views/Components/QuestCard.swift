import SwiftUI

struct QuestCard: View {
    let chore: AssignedChore
    var onTap: () -> Void = {}

    private var statusColor: Color {
        switch chore.status {
        case .pending: return .white.opacity(0.3)
        case .in_progress: return .neonOrange
        case .completed: return .neonBlue
        case .approved: return .neonGreen
        case .rejected: return .neonRed
        }
    }

    private var statusText: String {
        switch chore.status {
        case .pending: return "READY"
        case .in_progress: return "IN PROGRESS"
        case .completed: return "AWAITING APPROVAL"
        case .approved: return "COMPLETE"
        case .rejected: return "REJECTED"
        }
    }

    private var difficultyColor: Color {
        switch chore.difficultyTier {
        case .easy: return .rookieGreen
        case .medium: return .proYellow
        case .hard: return .legendRed
        }
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 14) {
                // Status indicator
                Circle()
                    .fill(statusColor)
                    .frame(width: 10, height: 10)
                    .neonGlow(statusColor, radius: chore.status == .in_progress ? 8 : 4)
                    .opacity(chore.status == .in_progress ? 0.8 : 1)
                    .animation(.easeInOut(duration: 1).repeatForever(), value: chore.status == .in_progress)

                VStack(alignment: .leading, spacing: 4) {
                    Text(chore.choreName)
                        .font(.system(size: 15, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    HStack(spacing: 8) {
                        // Difficulty badge
                        Text(chore.difficultyTier.label)
                            .font(.system(size: 10, weight: .heavy, design: .rounded))
                            .foregroundStyle(difficultyColor)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 3)
                            .background(difficultyColor.opacity(0.15))
                            .clipShape(Capsule())

                        Text(statusText)
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .foregroundStyle(statusColor)
                    }
                }

                Spacer()

                // Points reward
                HStack(spacing: 4) {
                    Image(systemName: "star.fill")
                        .font(.system(size: 14))
                        .foregroundStyle(.neonYellow)
                    Text("\(chore.points)")
                        .font(.system(size: 16, weight: .black, design: .rounded))
                        .foregroundStyle(.neonYellow)
                }
                .neonGlow(.neonYellow, radius: 4)
            }
            .gameCard(glow: statusColor)
        }
        .buttonStyle(.plain)
    }
}

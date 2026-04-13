import SwiftUI

struct WeeklyBadgeInfo {
    let min: Int; let label: String; let emoji: String
    static let all: [WeeklyBadgeInfo] = [
        .init(min: 1, label: "Getting Started!", emoji: "🌱"),
        .init(min: 3, label: "On a Roll!", emoji: "🎯"),
        .init(min: 5, label: "Hard Worker!", emoji: "💪"),
        .init(min: 7, label: "Super Helper!", emoji: "🦸"),
        .init(min: 10, label: "You're Cooking!", emoji: "👨‍🍳"),
        .init(min: 14, label: "Chore Champion!", emoji: "🏆"),
    ]
}

struct WeeklyBadgesSection: View {
    let weekCompleted: Int

    private var currentBadge: WeeklyBadgeInfo? {
        WeeklyBadgeInfo.all.last(where: { weekCompleted >= $0.min })
    }

    private var nextBadge: WeeklyBadgeInfo? {
        WeeklyBadgeInfo.all.first(where: { weekCompleted < $0.min })
    }

    private var progress: Double {
        guard let next = nextBadge else { return 1.0 }
        let prev = WeeklyBadgeInfo.all.last(where: { $0.min <= weekCompleted })?.min ?? 0
        return Double(weekCompleted - prev) / Double(next.min - prev)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "medal.fill").foregroundStyle(.neonPurple)
                Text("Weekly Progress").font(.system(size: 16, weight: .bold, design: .rounded)).foregroundStyle(.white)
                Spacer()
                Text("\(weekCompleted) done").font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(.neonPurple)
            }

            // Current badge
            if let badge = currentBadge {
                HStack(spacing: 10) {
                    Text(badge.emoji).font(.system(size: 32))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(badge.label).font(.system(size: 14, weight: .black, design: .rounded)).foregroundStyle(.neonPurple)
                        Text("\(weekCompleted) chores this week").font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                    }
                }
            }

            // Progress to next
            if let next = nextBadge {
                VStack(spacing: 4) {
                    HStack {
                        Text("\(weekCompleted)").font(.system(size: 11, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.5))
                        Spacer()
                        Text("\(next.min) for \(next.emoji) \(next.label)").font(.system(size: 11, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.5))
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color.gameCardLight)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(LinearGradient(colors: [.neonPurple, .neonPink], startPoint: .leading, endPoint: .trailing))
                                .frame(width: geo.size.width * progress)
                                .shadow(color: .neonPurple.opacity(0.4), radius: 4)
                        }
                    }.frame(height: 8)
                }
            } else if weekCompleted > 0 {
                Text("Max badge reached!").font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(.neonGreen)
            }

            // All badges grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 3), spacing: 8) {
                ForEach(WeeklyBadgeInfo.all, id: \.min) { badge in
                    let earned = weekCompleted >= badge.min
                    VStack(spacing: 4) {
                        Text(badge.emoji).font(.system(size: 24)).opacity(earned ? 1 : 0.2)
                        Text(badge.label).font(.system(size: 9, weight: .bold, design: .rounded))
                            .foregroundStyle(earned ? .neonPurple : .white.opacity(0.2))
                            .multilineTextAlignment(.center)
                        Text("\(badge.min)+").font(.system(size: 8, weight: .medium)).foregroundStyle(.white.opacity(0.2))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(earned ? Color.neonPurple.opacity(0.1) : Color.gameCardLight)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                    .overlay(RoundedRectangle(cornerRadius: 8).stroke(earned ? Color.neonPurple.opacity(0.3) : .clear, lineWidth: 1))
                }
            }
        }
        .gameCard(glow: .neonPurple.opacity(0.3))
    }
}

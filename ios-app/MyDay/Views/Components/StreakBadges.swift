import SwiftUI

struct StreakBadgeInfo {
    let min: Int
    let label: String
    let emoji: String

    static let all: [StreakBadgeInfo] = [
        .init(min: 1, label: "Warm Up", emoji: "🔥"),
        .init(min: 3, label: "On Fire", emoji: "🔥🔥"),
        .init(min: 7, label: "Blazing", emoji: "🌋"),
        .init(min: 14, label: "Inferno", emoji: "💥"),
        .init(min: 30, label: "Legendary", emoji: "🏆"),
    ]
}

struct StreakBadgesSection: View {
    let streak: Int

    private var currentBadge: StreakBadgeInfo? {
        StreakBadgeInfo.all.last(where: { streak >= $0.min })
    }

    private var nextBadge: StreakBadgeInfo? {
        StreakBadgeInfo.all.first(where: { streak < $0.min })
    }

    private var progress: Double {
        guard let next = nextBadge else { return 1.0 }
        let prev = StreakBadgeInfo.all.last(where: { $0.min <= streak })?.min ?? 0
        guard next.min > prev else { return 1.0 }
        return Double(streak - prev) / Double(next.min - prev)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "flame.fill").foregroundStyle(.neonOrange)
                Text("Streak Badges").font(.system(size: 16, weight: .bold, design: .rounded)).foregroundStyle(.white)
                Spacer()
                Text("\(streak) days").font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(.neonOrange)
            }

            // Current badge
            if let badge = currentBadge {
                HStack(spacing: 10) {
                    Text(badge.emoji).font(.system(size: 28))
                    VStack(alignment: .leading, spacing: 2) {
                        Text(badge.label).font(.system(size: 14, weight: .black, design: .rounded)).foregroundStyle(.neonOrange)
                        Text("\(streak) day streak").font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                    }
                }
            } else if streak == 0 {
                Text("Complete all your chores today to start a streak!")
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(.white.opacity(0.3))
            }

            // Progress to next
            if let next = nextBadge {
                VStack(spacing: 4) {
                    HStack {
                        Text("\(streak) days").font(.system(size: 11, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.5))
                        Spacer()
                        Text("\(next.min) days for \(next.emoji) \(next.label)").font(.system(size: 11, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.5))
                    }
                    GeometryReader { geo in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 4).fill(Color.gameCardLight)
                            RoundedRectangle(cornerRadius: 4)
                                .fill(LinearGradient(colors: [.neonOrange, .neonRed], startPoint: .leading, endPoint: .trailing))
                                .frame(width: geo.size.width * progress)
                                .shadow(color: .neonOrange.opacity(0.4), radius: 4)
                        }
                    }.frame(height: 8)
                }
            } else if streak > 0 {
                Text("Maximum streak badge achieved!").font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(.neonGreen)
            }

            // All streak badges grid
            LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 8), count: 5), spacing: 8) {
                ForEach(StreakBadgeInfo.all, id: \.min) { badge in
                    let earned = streak >= badge.min
                    VStack(spacing: 3) {
                        Text(badge.emoji).font(.system(size: 18)).opacity(earned ? 1 : 0.2)
                        Text(badge.label).font(.system(size: 8, weight: .bold, design: .rounded))
                            .foregroundStyle(earned ? .neonOrange : .white.opacity(0.2))
                            .multilineTextAlignment(.center)
                        Text("\(badge.min)d").font(.system(size: 7, weight: .medium)).foregroundStyle(.white.opacity(0.2))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(earned ? Color.neonOrange.opacity(0.1) : Color.gameCardLight)
                    .clipShape(RoundedRectangle(cornerRadius: 6))
                    .overlay(RoundedRectangle(cornerRadius: 6).stroke(earned ? Color.neonOrange.opacity(0.3) : .clear, lineWidth: 1))
                }
            }
        }
        .gameCard(glow: .neonOrange.opacity(0.3))
    }
}

import SwiftUI

struct XPBar: View {
    let points: Int
    var compact = false

    private var level: Int { GameLevel.level(for: points) }
    private var progress: Double { GameLevel.xpProgress(for: points) }
    private var xpInLevel: Int { GameLevel.xpInCurrentLevel(for: points) }

    var body: some View {
        VStack(spacing: compact ? 4 : 8) {
            HStack {
                Text("LVL \(level)")
                    .font(.system(size: compact ? 11 : 14, weight: .black, design: .rounded))
                    .foregroundStyle(.neonGreen)
                Text(GameLevel.title(for: level))
                    .font(.system(size: compact ? 10 : 12, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.5))
                Spacer()
                Text("\(xpInLevel)/\(GameLevel.xpPerLevel) XP")
                    .font(.system(size: compact ? 10 : 12, weight: .bold, design: .rounded))
                    .foregroundStyle(.neonGreen)
            }

            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    RoundedRectangle(cornerRadius: 6)
                        .fill(Color.gameCardLight)
                    RoundedRectangle(cornerRadius: 6)
                        .fill(
                            LinearGradient(colors: [.neonGreen, .neonBlue], startPoint: .leading, endPoint: .trailing)
                        )
                        .frame(width: geo.size.width * progress)
                        .shadow(color: .neonGreen.opacity(0.5), radius: 6)
                        .animation(.spring(response: 0.6), value: progress)
                }
            }
            .frame(height: compact ? 6 : 10)
        }
    }
}

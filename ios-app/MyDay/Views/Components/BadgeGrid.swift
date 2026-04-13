import SwiftUI

struct BadgeGrid: View {
    let weeklySuperstar: Bool
    let monthlyHero: Bool

    private let badges: [(String, String, Color, Bool)] = []

    var body: some View {
        HStack(spacing: 8) {
            BadgeItem(icon: "shield.fill", label: "Weekly\nSuperstar", color: .gray, earned: weeklySuperstar)
            BadgeItem(icon: "medal.fill", label: "Monthly\nHero", color: .neonYellow, earned: monthlyHero)
        }
    }
}

struct BadgeItem: View {
    let icon: String
    let label: String
    let color: Color
    let earned: Bool

    var body: some View {
        VStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 28))
                .foregroundStyle(earned ? color : .white.opacity(0.15))
                .shadow(color: earned ? color.opacity(0.5) : .clear, radius: 8)

            Text(label)
                .font(.system(size: 9, weight: .bold, design: .rounded))
                .foregroundStyle(earned ? .white : .white.opacity(0.2))
                .multilineTextAlignment(.center)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 12)
        .background(earned ? color.opacity(0.1) : Color.gameCardLight)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(earned ? color.opacity(0.3) : .clear, lineWidth: 1)
        )
    }
}

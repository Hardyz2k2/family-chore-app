import SwiftUI

// MARK: - Game Text Field (reusable across app)
struct GameTextField: View {
    let icon: String
    let placeholder: String
    @Binding var text: String
    var isSecure = false

    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.neonBlue.opacity(0.6))
                .frame(width: 20)

            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
            }
        }
        .font(.system(size: 15))
        .foregroundStyle(.white)
        .padding(14)
        .background(Color.gameCardLight)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.neonBlue.opacity(0.15), lineWidth: 1)
        )
    }
}

// MARK: - Card Modifier
struct GameCardModifier: ViewModifier {
    var glowColor: Color = .neonBlue

    func body(content: Content) -> some View {
        content
            .padding(16)
            .background(Color.gameCard)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(glowColor.opacity(0.2), lineWidth: 1)
            )
    }
}

// MARK: - Button Styles
struct NeonButtonStyle: ButtonStyle {
    var color: Color = .neonBlue

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 16, weight: .bold, design: .rounded))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .background(
                LinearGradient(colors: [color, color.opacity(0.7)], startPoint: .top, endPoint: .bottom)
            )
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .shadow(color: color.opacity(0.3), radius: configuration.isPressed ? 2 : 8, y: configuration.isPressed ? 1 : 4)
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.easeOut(duration: 0.15), value: configuration.isPressed)
    }
}

struct SecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 14, weight: .semibold, design: .rounded))
            .foregroundStyle(.white.opacity(0.7))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(Color.gameCardLight)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
    }
}

// MARK: - View Extensions
extension View {
    func gameCard(glow: Color = .neonBlue) -> some View {
        modifier(GameCardModifier(glowColor: glow))
    }

    func neonGlow(_ color: Color, radius: CGFloat = 8) -> some View {
        self.shadow(color: color.opacity(0.4), radius: radius)
    }

    /// Staggered entrance animation — slides up + fades in
    func slideUp(delay: Double = 0, appeared: Bool) -> some View {
        self
            .offset(y: appeared ? 0 : 20)
            .opacity(appeared ? 1 : 0)
            .animation(.spring(response: 0.5, dampingFraction: 0.8).delay(delay), value: appeared)
    }

    /// Scale bounce entrance
    func bounceIn(delay: Double = 0, appeared: Bool) -> some View {
        self
            .scaleEffect(appeared ? 1 : 0.8)
            .opacity(appeared ? 1 : 0)
            .animation(.spring(response: 0.4, dampingFraction: 0.6).delay(delay), value: appeared)
    }
}

import SwiftUI

struct WelcomeBackView: View {
    @Environment(AuthManager.self) private var auth
    @State private var isAuthenticating = false
    @State private var showFullAuth = false
    @State private var pulse = false

    private var userName: String {
        auth.savedUserName ?? "Hero"
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color.gameBackground.ignoresSafeArea()

                VStack(spacing: 32) {
                    Spacer()

                    // Logo
                    Image(systemName: "sparkles")
                        .font(.system(size: 52))
                        .foregroundStyle(.neonBlue)
                        .neonGlow(.neonBlue, radius: 24)
                        .scaleEffect(pulse ? 1.05 : 1)
                        .animation(.easeInOut(duration: 2).repeatForever(), value: pulse)

                    VStack(spacing: 8) {
                        Text("Welcome back,")
                            .font(.system(size: 16, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.5))
                        Text(userName)
                            .font(.system(size: 32, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                    }

                    // Face ID button
                    Button {
                        isAuthenticating = true
                        Task {
                            await auth.biometricLogin()
                            isAuthenticating = false
                        }
                    } label: {
                        VStack(spacing: 12) {
                            if isAuthenticating {
                                ProgressView().tint(.neonBlue).scaleEffect(1.5)
                            } else {
                                Image(systemName: "faceid")
                                    .font(.system(size: 48))
                                    .foregroundStyle(.neonBlue)
                                    .neonGlow(.neonBlue, radius: 12)
                            }
                            Text(isAuthenticating ? "Signing in..." : "Tap to sign in")
                                .font(.system(size: 14, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.5))
                        }
                        .frame(width: 140, height: 120)
                        .background(Color.neonBlue.opacity(0.06))
                        .clipShape(RoundedRectangle(cornerRadius: 20))
                        .overlay(RoundedRectangle(cornerRadius: 20).stroke(Color.neonBlue.opacity(0.2), lineWidth: 1))
                    }
                    .disabled(isAuthenticating)

                    if let error = auth.error {
                        Text(error)
                            .font(.system(size: 13, weight: .medium))
                            .foregroundStyle(.neonRed)
                    }

                    Spacer()

                    // Use different account
                    Button("Use a different account") {
                        showFullAuth = true
                    }
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(.white.opacity(0.3))
                    .padding(.bottom, 32)
                }
            }
            .onAppear { pulse = true }
            .navigationDestination(isPresented: $showFullAuth) {
                SmartAuthView()
            }
        }
    }
}

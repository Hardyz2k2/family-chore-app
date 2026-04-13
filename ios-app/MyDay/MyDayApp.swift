import SwiftUI

@main
struct MyDayApp: App {
    @State private var authManager = AuthManager()
    @State private var familyStore = FamilyStore()
    @State private var choreStore = ChoreStore()
    @State private var shopStore = ShopStore()

    var body: some Scene {
        WindowGroup {
            Group {
                if authManager.isLoading {
                    // 1. Loading — restore session
                    LaunchView()
                } else if !authManager.isAuthenticated && authManager.hasBiometricCredentials {
                    // 2. Logged out but has saved credentials → Face ID
                    WelcomeBackView()
                } else if !authManager.isAuthenticated {
                    // 3. Not logged in → smart auth
                    NavigationStack {
                        SmartAuthView()
                    }
                } else if authManager.isParent && authManager.familyId == nil {
                    // 4. Parent registered but no family → inline setup
                    NavigationStack {
                        SetupFamilyFlow()
                    }
                } else if authManager.isChild && authManager.familyId == nil {
                    // 5. Child exploring without family → join family screen
                    NoFamilyView()
                } else {
                    // 6. Fully set up → main app
                    MainTabView()
                }
            }
            .environment(authManager)
            .environment(familyStore)
            .environment(choreStore)
            .environment(shopStore)
            .task {
                await authManager.restoreSession()
            }
        }
    }
}

struct LaunchView: View {
    @State private var pulse = false
    @State private var rotate = false
    @State private var showText = false

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()

            // Subtle floating particles
            GeometryReader { geo in
                ForEach(0..<8, id: \.self) { i in
                    Circle()
                        .fill(Color.neonBlue.opacity(Double.random(in: 0.1...0.3)))
                        .frame(width: CGFloat.random(in: 4...8))
                        .offset(y: pulse ? -30 : 30)
                        .animation(.easeInOut(duration: Double.random(in: 2...4)).repeatForever(), value: pulse)
                        .position(
                            x: CGFloat.random(in: 0...geo.size.width),
                            y: geo.size.height / 2 + CGFloat.random(in: -100...100)
                        )
                }
            }

            VStack(spacing: 16) {
                Image(systemName: "sparkles")
                    .font(.system(size: 52))
                    .foregroundStyle(.neonBlue)
                    .neonGlow(.neonBlue, radius: 24)
                    .scaleEffect(pulse ? 1.15 : 0.9)
                    .rotationEffect(.degrees(rotate ? 10 : -10))
                    .animation(.easeInOut(duration: 1.5).repeatForever(), value: pulse)
                    .animation(.easeInOut(duration: 2).repeatForever(), value: rotate)

                Text("OMyDay")
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [.neonBlue, .neonPurple], startPoint: .leading, endPoint: .trailing)
                    )
                    .opacity(showText ? 1 : 0)
                    .offset(y: showText ? 0 : 10)
                    .animation(.easeOut(duration: 0.6).delay(0.3), value: showText)
            }
        }
        .onAppear {
            pulse = true
            rotate = true
            showText = true
        }
    }
}

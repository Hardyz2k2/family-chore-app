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
    @State private var appeared = false

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()

            VStack(spacing: 16) {
                Image(systemName: "sparkles")
                    .font(.system(size: 52))
                    .foregroundStyle(.neonBlue)
                    .neonGlow(.neonBlue, radius: 20)
                    .scaleEffect(appeared ? 1 : 0.5)
                    .opacity(appeared ? 1 : 0)
                    .animation(.spring(response: 0.6, dampingFraction: 0.7), value: appeared)

                Text("OMyDay")
                    .font(.system(size: 34, weight: .black, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(colors: [.neonBlue, .neonPurple], startPoint: .leading, endPoint: .trailing)
                    )
                    .opacity(appeared ? 1 : 0)
                    .offset(y: appeared ? 0 : 8)
                    .animation(.easeOut(duration: 0.5).delay(0.2), value: appeared)
            }
        }
        .onAppear { appeared = true }
    }
}

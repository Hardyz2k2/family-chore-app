import SwiftUI
import AuthenticationServices

struct SmartAuthView: View {
    @Environment(AuthManager.self) private var auth
    @State private var email = ""
    @State private var password = ""
    @State private var name = ""
    @State private var showRegisterFields = false
    @State private var isLoading = false
    @State private var showInviteCode = false
    @State private var showKidExplore = false
    @State private var pulse = false

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()

            // Background stars
            GeometryReader { geo in
                ForEach(0..<30, id: \.self) { i in
                    Circle()
                        .fill(.white.opacity(Double.random(in: 0.1...0.4)))
                        .frame(width: CGFloat.random(in: 1...3))
                        .position(
                            x: CGFloat.random(in: 0...geo.size.width),
                            y: CGFloat.random(in: 0...geo.size.height)
                        )
                }
            }

            ScrollView {
                VStack(spacing: 20) {
                    Spacer().frame(height: 30)

                    // Logo
                    VStack(spacing: 8) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 52))
                            .foregroundStyle(.neonBlue)
                            .neonGlow(.neonBlue, radius: 24)
                            .scaleEffect(pulse ? 1.05 : 1)
                            .animation(.easeInOut(duration: 2).repeatForever(), value: pulse)

                        Text("OMyDay")
                            .font(.system(size: 40, weight: .black, design: .rounded))
                            .foregroundStyle(
                                LinearGradient(colors: [.neonBlue, .neonPurple], startPoint: .leading, endPoint: .trailing)
                            )
                    }

                    // Social Auth
                    VStack(spacing: 10) {
                        SignInWithAppleButton(.signIn) { request in
                            request.requestedScopes = [.fullName, .email]
                        } onCompletion: { result in
                            handleAppleSignIn(result)
                        }
                        .signInWithAppleButtonStyle(.white)
                        .frame(height: 50)
                        .clipShape(RoundedRectangle(cornerRadius: 12))

                        // Google Sign In (placeholder — needs GoogleSignIn SDK)
                        Button {
                            // TODO: Integrate GoogleSignIn SDK
                        } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "g.circle.fill")
                                    .font(.system(size: 20))
                                Text("Sign in with Google")
                                    .font(.system(size: 16, weight: .semibold))
                            }
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .frame(height: 50)
                            .background(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                        }
                    }
                    .padding(.horizontal, 28)

                    // Divider
                    HStack {
                        Rectangle().fill(.white.opacity(0.1)).frame(height: 1)
                        Text("or").font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                        Rectangle().fill(.white.opacity(0.1)).frame(height: 1)
                    }
                    .padding(.horizontal, 28)

                    // Email/Password form
                    VStack(spacing: 12) {
                        // Registration name field (expandable)
                        if showRegisterFields {
                            GameTextField(icon: "person.fill", placeholder: "Your name", text: $name)
                                .transition(.move(edge: .top).combined(with: .opacity))
                        }

                        GameTextField(icon: "envelope.fill", placeholder: "Email", text: $email)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)

                        GameTextField(icon: "lock.fill", placeholder: "Password", text: $password, isSecure: true)

                        if let error = auth.error {
                            Text(error)
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(.neonRed)
                                .multilineTextAlignment(.center)
                        }

                        // Main action button
                        Button {
                            submit()
                        } label: {
                            if isLoading {
                                ProgressView().tint(.white)
                            } else {
                                Text(showRegisterFields ? "Create Account" : "Continue")
                            }
                        }
                        .buttonStyle(NeonButtonStyle())
                        .disabled(email.isEmpty || password.isEmpty || isLoading || (showRegisterFields && name.isEmpty))
                        .opacity(email.isEmpty || password.isEmpty ? 0.5 : 1)

                        // Toggle register mode
                        if !showRegisterFields {
                            Button("New here? Create Account") {
                                withAnimation(.spring(response: 0.4)) {
                                    showRegisterFields = true
                                    auth.error = nil
                                }
                            }
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(.neonBlue)
                        } else {
                            Button("Already have an account? Sign In") {
                                withAnimation(.spring(response: 0.4)) {
                                    showRegisterFields = false
                                    auth.error = nil
                                }
                            }
                            .font(.system(size: 14, weight: .semibold, design: .rounded))
                            .foregroundStyle(.neonBlue)
                        }
                    }
                    .padding(.horizontal, 28)

                    // Bottom options
                    VStack(spacing: 12) {
                        Rectangle().fill(.white.opacity(0.05)).frame(height: 1).padding(.horizontal, 28)

                        Button { showInviteCode = true } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "envelope.open.fill").font(.system(size: 20)).foregroundStyle(.neonGreen)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text("I have an invite code").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                    Text("Your parent gave you a 6-letter code").font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                                }
                                Spacer()
                                Image(systemName: "chevron.right").font(.system(size: 12)).foregroundStyle(.white.opacity(0.2))
                            }
                            .padding(14).background(Color.neonGreen.opacity(0.06)).clipShape(RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.neonGreen.opacity(0.2), lineWidth: 1))
                        }.buttonStyle(.plain).padding(.horizontal, 28)


                        Button { showKidExplore = true } label: {
                            HStack(spacing: 10) {
                                Image(systemName: "gamecontroller.fill")
                                    .font(.system(size: 20))
                                    .foregroundStyle(.neonPurple)
                                VStack(alignment: .leading, spacing: 1) {
                                    Text("I'm a kid exploring")
                                        .font(.system(size: 14, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                    Text("Create an account, join a family later")
                                        .font(.system(size: 11, weight: .medium, design: .rounded))
                                        .foregroundStyle(.white.opacity(0.3))
                                }
                                Spacer()
                                Image(systemName: "chevron.right")
                                    .font(.system(size: 12))
                                    .foregroundStyle(.white.opacity(0.2))
                            }
                            .padding(14)
                            .background(Color.neonPurple.opacity(0.06))
                            .clipShape(RoundedRectangle(cornerRadius: 14))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.neonPurple.opacity(0.15), lineWidth: 1))
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 28)
                    }

                    Spacer().frame(height: 20)
                }
            }
        }
        .onAppear { pulse = true; withAnimation { } }
        .navigationDestination(isPresented: $showInviteCode) {
            ClaimInviteView()
        }
        .navigationDestination(isPresented: $showKidExplore) {
            KidExploreAuthView()
        }
    }

    // MARK: - Submit (login or register)
    private func submit() {
        isLoading = true
        auth.error = nil
        Task {
            if showRegisterFields {
                // Register
                let parts = name.trimmingCharacters(in: .whitespaces).split(separator: " ", maxSplits: 1)
                let firstName = String(parts.first ?? "")
                let lastName = parts.count > 1 ? String(parts[1]) : ""
                await auth.register(email: email, password: password, firstName: firstName, lastName: lastName)
            } else {
                // Login
                await auth.login(email: email, password: password)
            }
            isLoading = false
        }
    }

    // MARK: - Apple Sign In
    private func handleAppleSignIn(_ result: Result<ASAuthorization, Error>) {
        switch result {
        case .success(let auth):
            if let credential = auth.credential as? ASAuthorizationAppleIDCredential,
               let tokenData = credential.identityToken,
               let _ = String(data: tokenData, encoding: .utf8) {
                // TODO: Send identity token to backend POST /auth/apple
                // For now, show message
                self.auth.error = "Apple Sign In needs backend support. Use email for now."
            }
        case .failure(let error):
            if (error as NSError).code != ASAuthorizationError.canceled.rawValue {
                auth.error = "Apple Sign In failed"
            }
        }
    }
}

// MARK: - Kid Explore Auth (standalone child registration)
struct KidExploreAuthView: View {
    @Environment(AuthManager.self) private var auth
    @State private var heroName = ""
    @State private var email = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var selectedAvatar = 0
    let avatars = ["🦸", "🧙", "🥷", "🧝", "🦹", "🤖", "🐉", "🦄"]

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    Spacer().frame(height: 20)

                    // Avatar
                    ZStack {
                        Circle()
                            .fill(LinearGradient(colors: [.neonPurple, .neonBlue], startPoint: .topLeading, endPoint: .bottomTrailing))
                            .frame(width: 80, height: 80)
                            .neonGlow(.neonPurple, radius: 16)
                        Text(avatars[selectedAvatar]).font(.system(size: 40))
                    }

                    // Avatar picker
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 10) {
                            ForEach(0..<avatars.count, id: \.self) { i in
                                Button { selectedAvatar = i } label: {
                                    Text(avatars[i]).font(.system(size: 28))
                                        .padding(8)
                                        .background(selectedAvatar == i ? Color.neonPurple.opacity(0.3) : Color.gameCardLight)
                                        .clipShape(Circle())
                                        .overlay(Circle().stroke(selectedAvatar == i ? Color.neonPurple : .clear, lineWidth: 2))
                                }
                            }
                        }.padding(.horizontal, 16)
                    }

                    Text("Create Your Hero")
                        .font(.system(size: 24, weight: .black, design: .rounded))
                        .foregroundStyle(.white)
                    Text("You can join a family later with a code from your parent")
                        .font(.system(size: 13, weight: .medium, design: .rounded))
                        .foregroundStyle(.white.opacity(0.4))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 20)

                    VStack(spacing: 12) {
                        GameTextField(icon: "person.fill", placeholder: "Hero Name", text: $heroName)
                        GameTextField(icon: "envelope.fill", placeholder: "Email", text: $email)
                        GameTextField(icon: "lock.fill", placeholder: "Secret Code", text: $password, isSecure: true)

                        if let error = auth.error {
                            Text(error).font(.system(size: 13, weight: .medium)).foregroundStyle(.neonRed).multilineTextAlignment(.center)
                        }

                        Button(isLoading ? "Creating..." : "Create Hero!") {
                            isLoading = true
                            Task {
                                await auth.register(email: email, password: password, firstName: heroName, lastName: "", role: "child")
                                isLoading = false
                            }
                        }
                        .buttonStyle(NeonButtonStyle(color: .neonPurple))
                        .disabled(heroName.isEmpty || email.isEmpty || password.isEmpty || isLoading)
                        .opacity(heroName.isEmpty || email.isEmpty || password.isEmpty ? 0.5 : 1)
                    }
                    .padding(.horizontal, 28)

                    Spacer()
                }
            }
        }
        #if os(iOS)
        .navigationBarTitleDisplayMode(.inline)
        #endif
    }
}

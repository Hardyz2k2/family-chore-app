import SwiftUI

/// Shown when an authenticated child has no family (exploring mode)
struct NoFamilyView: View {
    @Environment(AuthManager.self) private var auth
    @State private var linkCode: String?
    @State private var isGenerating = false
    @State private var showInviteCode = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ZStack {
                Color.gameBackground.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        Spacer().frame(height: 30)

                        // Header
                        VStack(spacing: 12) {
                            Image(systemName: "person.3.fill")
                                .font(.system(size: 48))
                                .foregroundStyle(.neonPurple)
                                .neonGlow(.neonPurple, radius: 20)

                            Text("Join a Family")
                                .font(.system(size: 26, weight: .black, design: .rounded))
                                .foregroundStyle(.white)

                            Text("You need to be part of a family to\nstart earning points and completing quests!")
                                .font(.system(size: 14, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.4))
                                .multilineTextAlignment(.center)
                        }

                        // Option 1: Invite your parent (generate code)
                        VStack(spacing: 12) {
                            if let code = linkCode {
                                // Show generated code
                                VStack(spacing: 10) {
                                    Text("Share this code with your parent")
                                        .font(.system(size: 13, weight: .medium, design: .rounded))
                                        .foregroundStyle(.white.opacity(0.5))

                                    Text(code)
                                        .font(.system(size: 36, weight: .black, design: .monospaced))
                                        .foregroundStyle(.neonGreen)
                                        .neonGlow(.neonGreen, radius: 10)
                                        .tracking(6)

                                    Text("They enter this in their app to add you")
                                        .font(.system(size: 12, weight: .medium, design: .rounded))
                                        .foregroundStyle(.white.opacity(0.3))

                                    Text("Expires in 7 days")
                                        .font(.system(size: 10, weight: .medium, design: .rounded))
                                        .foregroundStyle(.white.opacity(0.2))

                                    HStack(spacing: 12) {
                                        Button {
                                            #if os(iOS)
                                            UIPasteboard.general.string = code
                                            #endif
                                        } label: {
                                            HStack(spacing: 6) {
                                                Image(systemName: "doc.on.doc").font(.system(size: 14))
                                                Text("Copy")
                                            }
                                        }.buttonStyle(SecondaryButtonStyle())

                                        ShareLink(item: "Join me on OMyDay! Tell your parent to enter this code: \(code)") {
                                            HStack(spacing: 6) {
                                                Image(systemName: "square.and.arrow.up").font(.system(size: 14))
                                                Text("Share")
                                            }
                                        }.buttonStyle(NeonButtonStyle(color: .neonGreen))
                                    }
                                }
                                .gameCard(glow: .neonGreen.opacity(0.4))
                            } else {
                                Button {
                                    isGenerating = true
                                    Task {
                                        do {
                                            let result = try await APIClient.shared.generateLinkCode()
                                            linkCode = result["link_code"]
                                        } catch let err as APIError {
                                            error = err.errorDescription
                                        } catch {
                                            self.error = error.localizedDescription
                                        }
                                        isGenerating = false
                                    }
                                } label: {
                                    HStack(spacing: 12) {
                                        Image(systemName: "envelope.fill").font(.system(size: 22)).foregroundStyle(.neonGreen)
                                        VStack(alignment: .leading, spacing: 2) {
                                            Text("Invite Your Parent").font(.system(size: 15, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                            Text("Generate a code for your parent to add you").font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                                        }
                                        Spacer()
                                        if isGenerating {
                                            ProgressView().tint(.neonGreen)
                                        } else {
                                            Image(systemName: "chevron.right").foregroundStyle(.white.opacity(0.2))
                                        }
                                    }
                                    .padding(16)
                                    .background(Color.neonGreen.opacity(0.06))
                                    .clipShape(RoundedRectangle(cornerRadius: 16))
                                    .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.neonGreen.opacity(0.2), lineWidth: 1))
                                }
                                .buttonStyle(.plain)
                                .disabled(isGenerating)
                            }
                        }
                        .padding(.horizontal, 20)

                        // Divider
                        HStack {
                            Rectangle().fill(.white.opacity(0.08)).frame(height: 1)
                            Text("or").font(.system(size: 12, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.25))
                            Rectangle().fill(.white.opacity(0.08)).frame(height: 1)
                        }.padding(.horizontal, 28)

                        // Option 2: I have an invite code
                        VStack(spacing: 10) {
                            Button { showInviteCode = true } label: {
                                HStack(spacing: 12) {
                                    Image(systemName: "envelope.open.fill").font(.system(size: 20)).foregroundStyle(.neonBlue)
                                    VStack(alignment: .leading, spacing: 2) {
                                        Text("I have an invite code").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                        Text("Parent gave you a 6-letter code").font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                                    }
                                    Spacer()
                                    Image(systemName: "chevron.right").foregroundStyle(.white.opacity(0.2))
                                }
                                .padding(14).background(Color.neonBlue.opacity(0.06)).clipShape(RoundedRectangle(cornerRadius: 14))
                                .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.neonBlue.opacity(0.15), lineWidth: 1))
                            }.buttonStyle(.plain)

                        }
                        .padding(.horizontal, 20)

                        if let error {
                            Text(error).font(.system(size: 13, weight: .medium)).foregroundStyle(.neonRed)
                        }

                        // Logout
                        Button("Log Out") { auth.fullLogout() }
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.2))
                            .padding(.top, 16)

                        Spacer()
                    }
                }
            }
            .navigationDestination(isPresented: $showInviteCode) { ClaimInviteView() }
        }
    }
}

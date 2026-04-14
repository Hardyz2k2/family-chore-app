import SwiftUI

/// Parent enters a child's link code to add an existing child account to their family
struct LinkChildView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(FamilyStore.self) private var familyStore
    @Environment(\.dismiss) private var dismiss
    @State private var code = ""
    @FocusState private var codeFocused: Bool
    @State private var isLinking = false
    @State private var result: LinkResult?
    @State private var error: String?

    struct LinkResult {
        let childName: String
        let familyName: String
    }

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 20) {
                    Spacer().frame(height: 20)

                    VStack(spacing: 8) {
                        Image(systemName: "link.circle.fill")
                            .font(.system(size: 44))
                            .foregroundStyle(.neonBlue)
                            .neonGlow(.neonBlue, radius: 16)
                        Text("Link Existing Child")
                            .font(.system(size: 22, weight: .black, design: .rounded)).foregroundStyle(.white)
                        Text("Does your child already have an OMyDay account?\nAsk them for their code.")
                            .font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                            .multilineTextAlignment(.center)
                    }

                    // Code input
                    HStack(spacing: 8) {
                        ForEach(0..<6, id: \.self) { i in
                            let char = i < code.count ? String(code[code.index(code.startIndex, offsetBy: i)]) : ""
                            Text(char)
                                .font(.system(size: 22, weight: .black, design: .monospaced))
                                .foregroundStyle(.neonBlue)
                                .frame(width: 42, height: 52)
                                .background(Color.gameCardLight)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .overlay(RoundedRectangle(cornerRadius: 10)
                                    .stroke(i < code.count ? Color.neonBlue.opacity(0.4) :
                                            codeFocused && i == code.count ? Color.neonBlue.opacity(0.6) :
                                            Color.white.opacity(0.1), lineWidth: 1))
                        }
                    }
                    .onTapGesture { codeFocused = true }

                    TextField("Enter 6-letter code", text: $code)
                        .focused($codeFocused)
                        .autocorrectionDisabled()
                        .textInputAutocapitalization(.characters)
                        .keyboardType(.asciiCapable)
                        .font(.system(size: 16, weight: .bold, design: .monospaced))
                        .foregroundStyle(.neonBlue)
                        .multilineTextAlignment(.center)
                        .padding(12)
                        .background(Color.gameCardLight)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .onChange(of: code) { _, new in code = String(new.prefix(6)).uppercased() }

                    if let result {
                        VStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill").font(.system(size: 32)).foregroundStyle(.neonGreen)
                            Text("\(result.childName) added to \(result.familyName)!")
                                .font(.system(size: 16, weight: .bold, design: .rounded)).foregroundStyle(.neonGreen)
                        }.gameCard(glow: .neonGreen.opacity(0.4))

                        Button("Done") { dismiss() }
                            .buttonStyle(NeonButtonStyle(color: .neonGreen))
                    } else {
                        if let error {
                            Text(error).font(.system(size: 13, weight: .medium)).foregroundStyle(.neonRed).multilineTextAlignment(.center)
                        }

                        Button(isLinking ? "Linking..." : "Link Child") {
                            isLinking = true; error = nil
                            Task {
                                do {
                                    let r = try await APIClient.shared.linkChildToFamily(linkCode: code)
                                    result = LinkResult(childName: r["child_name"] ?? "Child", familyName: r["family_name"] ?? "Family")
                                    if let fid = auth.familyId { await familyStore.load(familyId: fid) }
                                } catch let err as APIError {
                                    error = err.errorDescription
                                } catch {
                                    self.error = error.localizedDescription
                                }
                                isLinking = false
                            }
                        }
                        .buttonStyle(NeonButtonStyle(color: .neonBlue))
                        .disabled(code.count < 6 || isLinking)
                        .opacity(code.count < 6 ? 0.5 : 1)

                        Button("Cancel") { dismiss() }
                            .font(.system(size: 14, weight: .medium)).foregroundStyle(.white.opacity(0.3))
                    }
                }.padding(24)
            }
        }
    }
}

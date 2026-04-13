import SwiftUI

struct BusinessPortfolioView: View {
    @Environment(AuthManager.self) private var auth
    @State private var portfolio: ContractPortfolio?
    @State private var isLoading = true

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "briefcase.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(.neonBlue)
                            .neonGlow(.neonBlue, radius: 16)
                        Text("My Business Portfolio")
                            .font(.system(size: 22, weight: .black, design: .rounded)).foregroundStyle(.white)
                    }.padding(.top, 16)

                    if isLoading {
                        ProgressView().tint(.neonBlue).padding(.top, 40)
                    } else if let p = portfolio {
                        // Business Level
                        VStack(spacing: 6) {
                            Text(p.businessLevelEmoji).font(.system(size: 40))
                            Text(p.businessLevel)
                                .font(.system(size: 20, weight: .black, design: .rounded)).foregroundStyle(.neonBlue)
                            Text("Business Level")
                                .font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.4))

                            // Progress to next level
                            let levels: [(String, Double)] = [("Hustler", 500), ("Entrepreneur", 1500), ("Mogul", 3000)]
                            if let next = levels.first(where: { p.totalEarnings < $0.1 }) {
                                VStack(spacing: 4) {
                                    GeometryReader { geo in
                                        ZStack(alignment: .leading) {
                                            RoundedRectangle(cornerRadius: 4).fill(Color.gameCardLight)
                                            RoundedRectangle(cornerRadius: 4)
                                                .fill(LinearGradient(colors: [.neonBlue, .neonPurple], startPoint: .leading, endPoint: .trailing))
                                                .frame(width: geo.size.width * min(1, p.totalEarnings / next.1))
                                        }
                                    }.frame(height: 8)
                                    Text("\(Int(p.totalEarnings))/\(Int(next.1)) pts to \(next.0)")
                                        .font(.system(size: 10, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                                }
                            }
                        }.gameCard(glow: .neonBlue.opacity(0.3))

                        // Hero Stats
                        HStack(spacing: 8) {
                            PortfolioStat(icon: "star.fill", value: "\(Int(p.totalEarnings))", label: "Total Earned", color: .neonYellow)
                            PortfolioStat(icon: "doc.text.fill", value: "\(p.totalContracts)", label: "Contracts", color: .neonBlue)
                            PortfolioStat(icon: "checkmark.shield.fill", value: "\(p.onTimePercentage)%", label: "Reliability", color: p.onTimePercentage >= 80 ? .neonGreen : p.onTimePercentage >= 50 ? .neonYellow : .neonRed)
                        }

                        // Reliability Gauge
                        VStack(spacing: 8) {
                            HStack {
                                Image(systemName: "checkmark.shield.fill").foregroundStyle(reliabilityColor(p.onTimePercentage))
                                Text("Reliability Score").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                Spacer()
                                Text("\(p.onTimePercentage)%").font(.system(size: 18, weight: .black, design: .rounded)).foregroundStyle(reliabilityColor(p.onTimePercentage))
                            }
                            GeometryReader { geo in
                                ZStack(alignment: .leading) {
                                    RoundedRectangle(cornerRadius: 6).fill(Color.gameCardLight)
                                    RoundedRectangle(cornerRadius: 6)
                                        .fill(reliabilityColor(p.onTimePercentage))
                                        .frame(width: geo.size.width * Double(p.onTimePercentage) / 100)
                                }
                            }.frame(height: 12)
                            Text(p.onTimePercentage >= 90 ? "Excellent reliability!" : p.onTimePercentage >= 70 ? "Good — keep delivering on time!" : "Needs improvement — complete contracts before deadlines")
                                .font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                        }.gameCard(glow: reliabilityColor(p.onTimePercentage).opacity(0.3))

                        // Entrepreneurship Stats (if they've pitched)
                        if p.proposalsTotal > 0 {
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    Image(systemName: "lightbulb.fill").foregroundStyle(.neonYellow)
                                    Text("Entrepreneurship").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                }
                                HStack(spacing: 12) {
                                    VStack(spacing: 2) {
                                        Text("\(p.proposalsTotal)").font(.system(size: 18, weight: .black, design: .rounded)).foregroundStyle(.white)
                                        Text("Pitched").font(.system(size: 9, weight: .bold)).foregroundStyle(.white.opacity(0.4))
                                    }
                                    VStack(spacing: 2) {
                                        Text("\(p.proposalsAccepted)").font(.system(size: 18, weight: .black, design: .rounded)).foregroundStyle(.neonGreen)
                                        Text("Approved").font(.system(size: 9, weight: .bold)).foregroundStyle(.white.opacity(0.4))
                                    }
                                    VStack(spacing: 2) {
                                        Text("\(p.proposalSuccessRate)%").font(.system(size: 18, weight: .black, design: .rounded)).foregroundStyle(.neonPurple)
                                        Text("Success Rate").font(.system(size: 9, weight: .bold)).foregroundStyle(.white.opacity(0.4))
                                    }
                                }
                            }.gameCard(glow: .neonYellow.opacity(0.3))
                        }

                        // Tips
                        VStack(alignment: .leading, spacing: 6) {
                            HStack(spacing: 6) {
                                Image(systemName: "lightbulb.fill").foregroundStyle(.neonBlue).font(.system(size: 12))
                                Text("Business Tips").font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(.neonBlue)
                            }
                            Text("• Complete contracts on time to boost your reliability score")
                                .font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                            Text("• Pitch your own contracts to show initiative")
                                .font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                            Text("• Higher reliability = parents trust you with bigger contracts")
                                .font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4))
                        }.gameCard(glow: .neonBlue.opacity(0.2))

                    } else {
                        VStack(spacing: 8) {
                            Image(systemName: "briefcase").font(.system(size: 40)).foregroundStyle(.white.opacity(0.15))
                            Text("Complete your first contract to start building your portfolio!")
                                .font(.system(size: 14, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                                .multilineTextAlignment(.center)
                        }.padding(.top, 40)
                    }
                }.padding(16)
            }
        }
        .task {
            guard let uid = auth.userId else { return }
            do {
                portfolio = try await APIClient.shared.getContractStats(uid)
            } catch {}
            isLoading = false
        }
    }

    private func reliabilityColor(_ pct: Int) -> Color {
        if pct >= 80 { return .neonGreen }
        if pct >= 50 { return .neonYellow }
        return .neonRed
    }
}

struct PortfolioStat: View {
    let icon: String; let value: String; let label: String; let color: Color
    var body: some View {
        VStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 16)).foregroundStyle(color)
            Text(value).font(.system(size: 18, weight: .black, design: .rounded)).foregroundStyle(.white)
            Text(label).font(.system(size: 9, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.4))
        }
        .frame(maxWidth: .infinity).gameCard(glow: color.opacity(0.2))
    }
}

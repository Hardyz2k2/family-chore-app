import SwiftUI

/// Child-only view: browse and buy rewards with earned points
struct ShopView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(ShopStore.self) private var shop
    @State private var buyingId: String?
    @State private var boughtId: String?

    private var availableRewards: [Reward] {
        shop.rewards.filter { r in
            r.isActive && (r.childId == nil || r.childId == auth.userId)
        }
    }

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    // Shop header
                    ZStack {
                        LinearGradient(colors: [.purple.opacity(0.3), .indigo.opacity(0.2), .clear], startPoint: .top, endPoint: .bottom)
                            .frame(height: 160)

                        VStack(spacing: 8) {
                            Image(systemName: "sparkles")
                                .font(.system(size: 32))
                                .foregroundStyle(.neonYellow)
                                .neonGlow(.neonYellow, radius: 16)
                            Text("Rewards Shop")
                                .font(.system(size: 24, weight: .black, design: .rounded))
                                .foregroundStyle(.white)
                            Text("Spend your hard-earned stars!")
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.4))

                            // Balance with glow
                            HStack(spacing: 8) {
                                Image(systemName: "star.fill").font(.system(size: 18)).foregroundStyle(.neonYellow)
                                    .neonGlow(.neonYellow, radius: 8)
                                Text("\(shop.points)")
                                    .font(.system(size: 28, weight: .black, design: .rounded))
                                    .foregroundStyle(.neonYellow)
                                Text("pts")
                                    .font(.system(size: 14, weight: .medium, design: .rounded))
                                    .foregroundStyle(.neonYellow.opacity(0.6))
                            }
                            .padding(.horizontal, 20).padding(.vertical, 10)
                            .background(Color.white.opacity(0.08))
                            .clipShape(Capsule())
                        }
                    }
                    .clipShape(RoundedRectangle(cornerRadius: 16))

                    // Rewards grid
                    if availableRewards.isEmpty {
                        VStack(spacing: 8) {
                            Image(systemName: "gift").font(.system(size: 40)).foregroundStyle(.white.opacity(0.15))
                            Text("No rewards available yet")
                                .font(.system(size: 14, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.4))
                            Text("Ask your parents to add some!")
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(.white.opacity(0.25))
                        }
                        .padding(.top, 40)
                    } else {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                            ForEach(availableRewards) { reward in
                                RewardCard(
                                    reward: reward,
                                    points: shop.points,
                                    isBuying: buyingId == reward.rewardId,
                                    justBought: boughtId == reward.rewardId
                                ) {
                                    Task {
                                        buyingId = reward.rewardId
                                        if await shop.redeemReward(reward, userId: auth.userId ?? "") {
                                            boughtId = reward.rewardId
                                            try? await Task.sleep(for: .seconds(2))
                                            boughtId = nil
                                        }
                                        buyingId = nil
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(16)
            }
        }
        .task {
            if let userId = auth.userId, let familyId = auth.familyId {
                await shop.loadAll(userId: userId, familyId: familyId)
            }
        }
    }
}

struct RewardCard: View {
    let reward: Reward
    let points: Int
    let isBuying: Bool
    let justBought: Bool
    let onBuy: () -> Void

    private var canAfford: Bool { points >= reward.pointCost }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            if justBought {
                VStack(spacing: 8) {
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 32))
                        .foregroundStyle(.neonGreen)
                        .frame(maxWidth: .infinity, alignment: .center)
                    Text("Purchased!")
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(.neonGreen)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            } else {
                Text(reward.rewardName)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                    .lineLimit(2)

                if let desc = reward.description, !desc.isEmpty {
                    Text(desc)
                        .font(.system(size: 11, weight: .medium))
                        .foregroundStyle(.white.opacity(0.4))
                        .lineLimit(2)
                }

                Spacer()

                HStack {
                    HStack(spacing: 3) {
                        Image(systemName: "star.fill")
                            .font(.system(size: 11))
                        Text("\(reward.pointCost)")
                            .font(.system(size: 13, weight: .black, design: .rounded))
                    }
                    .foregroundStyle(.neonYellow)

                    Spacer()

                    Button(action: onBuy) {
                        Text(isBuying ? "..." : "Buy")
                            .font(.system(size: 12, weight: .bold, design: .rounded))
                            .foregroundStyle(canAfford ? .white : .white.opacity(0.3))
                            .padding(.horizontal, 14)
                            .padding(.vertical, 6)
                            .background(canAfford ? Color.neonPurple : Color.gameCardLight)
                            .clipShape(Capsule())
                    }
                    .disabled(!canAfford || isBuying)
                }
            }
        }
        .frame(minHeight: 120)
        .gameCard(glow: justBought ? .neonGreen : canAfford ? .neonPurple : .clear)
    }
}

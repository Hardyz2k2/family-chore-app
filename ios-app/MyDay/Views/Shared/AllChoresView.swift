import SwiftUI

enum ChoreFilter: String, CaseIterable {
    case all = "All"
    case pending = "Pending"
    case completed = "Completed"
}

struct AllChoresView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(ChoreStore.self) private var choreStore
    @Environment(FamilyStore.self) private var familyStore
    @Environment(\.dismiss) private var dismiss
    @State private var filter: ChoreFilter = .all
    @State private var selectedChore: AssignedChore?
    @State private var showParticles = false

    private var filteredChores: [AssignedChore] {
        switch filter {
        case .all: return choreStore.chores
        case .pending: return choreStore.chores.filter { $0.status == .pending || $0.status == .in_progress }
        case .completed: return choreStore.chores.filter { $0.status == .completed || $0.status == .approved }
        }
    }

    /// Group chores by date, sorted chronologically
    private var groupedChores: [(date: String, label: String, chores: [AssignedChore])] {
        let grouped = Dictionary(grouping: filteredChores) { String($0.dueDate.prefix(10)) }
        let today = todayString()
        let tomorrow = tomorrowString()

        return grouped.keys.sorted().map { date in
            let label: String
            if date == today { label = "Today" }
            else if date == tomorrow { label = "Tomorrow" }
            else { label = formatDate(date) }
            return (date: date, label: label, chores: grouped[date]!)
        }
    }

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()

            VStack(spacing: 0) {
                // Header
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(auth.isParent ? "Family Chores" : "My Quests")
                            .font(.system(size: 22, weight: .black, design: .rounded))
                            .foregroundStyle(.white)
                        Text("\(filteredChores.count) chores")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.4))
                    }
                    Spacer()
                    Button { dismiss() } label: {
                        Image(systemName: "xmark.circle.fill").font(.system(size: 28)).foregroundStyle(.white.opacity(0.3))
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 16)
                .padding(.bottom, 8)

                // Filter tabs
                HStack(spacing: 8) {
                    ForEach(ChoreFilter.allCases, id: \.self) { f in
                        Button {
                            withAnimation(.spring(response: 0.3)) { filter = f }
                        } label: {
                            Text(f.rawValue)
                                .font(.system(size: 13, weight: .bold, design: .rounded))
                                .foregroundStyle(filter == f ? .white : .white.opacity(0.4))
                                .padding(.horizontal, 16)
                                .padding(.vertical, 8)
                                .background(filter == f ? Color.neonBlue.opacity(0.4) : Color.gameCardLight)
                                .clipShape(Capsule())
                                .overlay(Capsule().stroke(filter == f ? Color.neonBlue.opacity(0.4) : .clear, lineWidth: 1))
                        }
                    }
                    Spacer()
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)

                // Chore list
                ScrollView {
                    if groupedChores.isEmpty {
                        VStack(spacing: 12) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 48))
                                .foregroundStyle(.neonGreen.opacity(0.3))
                            Text(filter == .pending ? "No pending chores!" : filter == .completed ? "No completed chores yet" : "No chores assigned")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundStyle(.white.opacity(0.4))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.top, 60)
                    } else {
                        LazyVStack(spacing: 16, pinnedViews: .sectionHeaders) {
                            ForEach(groupedChores, id: \.date) { group in
                                Section {
                                    ForEach(group.chores) { chore in
                                        AllChoreCard(chore: chore, showChildName: auth.isParent) {
                                            if auth.isChild {
                                                selectedChore = chore
                                            }
                                        }
                                    }
                                } header: {
                                    HStack {
                                        Text(group.label)
                                            .font(.system(size: 14, weight: .bold, design: .rounded))
                                            .foregroundStyle(.neonBlue)
                                        Spacer()
                                        Text("\(group.chores.count) chores")
                                            .font(.system(size: 11, weight: .medium, design: .rounded))
                                            .foregroundStyle(.white.opacity(0.3))
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 6)
                                    .background(Color.gameBackground)
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                }
                .refreshable { await loadData() }
            }

            if showParticles {
                ParticleExplosion().allowsHitTesting(false)
            }
        }
        .sheet(item: $selectedChore) { chore in
            QuestDetailView(chore: chore) {
                showParticles = true
                Task {
                    await loadData()
                    try? await Task.sleep(for: .seconds(1.2))
                    showParticles = false
                }
            }
        }
        .task { await loadData() }
    }

    private func loadData() async {
        if auth.isParent, let fid = auth.familyId {
            await choreStore.loadFamilyChores(familyId: fid)
        } else if let uid = auth.userId {
            await choreStore.loadUserChores(userId: uid)
        }
    }

    private func todayString() -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.string(from: Date())
    }

    private func tomorrowString() -> String {
        let f = DateFormatter(); f.dateFormat = "yyyy-MM-dd"; return f.string(from: Date().addingTimeInterval(86400))
    }

    private func formatDate(_ dateStr: String) -> String {
        let inF = DateFormatter(); inF.dateFormat = "yyyy-MM-dd"
        let outF = DateFormatter(); outF.dateFormat = "EEEE, MMM d"
        if let d = inF.date(from: dateStr) { return outF.string(from: d) }
        return dateStr
    }
}

// MARK: - Chore Card for multi-day view
struct AllChoreCard: View {
    let chore: AssignedChore
    let showChildName: Bool
    let onTap: () -> Void

    private var statusColor: Color {
        switch chore.status {
        case .pending: return .white.opacity(0.3)
        case .in_progress: return .neonOrange
        case .completed: return .neonBlue
        case .approved: return .neonGreen
        case .rejected: return .neonRed
        }
    }

    private var statusText: String {
        switch chore.status {
        case .pending: return "PENDING"
        case .in_progress: return "IN PROGRESS"
        case .completed: return "AWAITING APPROVAL"
        case .approved: return "APPROVED"
        case .rejected: return "REJECTED"
        }
    }

    private var difficultyColor: Color {
        switch chore.difficultyTier {
        case .easy: return .rookieGreen
        case .medium: return .proYellow
        case .hard: return .legendRed
        }
    }

    var body: some View {
        Button(action: onTap) {
            HStack(spacing: 12) {
                Circle().fill(statusColor).frame(width: 8, height: 8).neonGlow(statusColor, radius: 3)

                VStack(alignment: .leading, spacing: 4) {
                    Text(chore.choreName)
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)

                    HStack(spacing: 6) {
                        if showChildName, let name = chore.firstName {
                            Text(name)
                                .font(.system(size: 10, weight: .bold, design: .rounded))
                                .foregroundStyle(.neonPurple)
                                .padding(.horizontal, 6).padding(.vertical, 2)
                                .background(Color.neonPurple.opacity(0.15))
                                .clipShape(Capsule())
                        }

                        Text(chore.difficultyTier.label)
                            .font(.system(size: 10, weight: .heavy, design: .rounded))
                            .foregroundStyle(difficultyColor)
                            .padding(.horizontal, 6).padding(.vertical, 2)
                            .background(difficultyColor.opacity(0.15))
                            .clipShape(Capsule())

                        Text(statusText)
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .foregroundStyle(statusColor)
                    }
                }

                Spacer()

                HStack(spacing: 3) {
                    Image(systemName: "star.fill").font(.system(size: 12)).foregroundStyle(.neonYellow)
                    Text("\(chore.points)").font(.system(size: 14, weight: .black, design: .rounded)).foregroundStyle(.neonYellow)
                }
            }
            .padding(14)
            .background(Color.gameCard)
            .clipShape(RoundedRectangle(cornerRadius: 14))
            .overlay(RoundedRectangle(cornerRadius: 14).stroke(statusColor.opacity(0.2), lineWidth: 1))
        }
        .buttonStyle(.plain)
    }
}

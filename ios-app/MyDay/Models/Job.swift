import Foundation

typealias Contract = Job
typealias ContractApplication = JobApplication

struct Job: Decodable, Identifiable {
    let jobId: String
    let familyId: String
    let postedBy: String
    var postedByName: String?
    let title: String
    var description: String?
    let rewardType: String
    let rewardAmount: Double
    let jobType: String
    var dueDate: String?
    var status: String
    var assignedTo: String?
    var assignedToName: String?
    var applicationCount: Int?
    var createdAt: String?
    var pitchReason: String?
    var proposedPrice: Double?

    var id: String { jobId }
    var isProposal: Bool { status == "proposed" }

    enum CodingKeys: String, CodingKey {
        case jobId, familyId, postedBy, postedByName, title, description
        case rewardType, rewardAmount, jobType, dueDate, status
        case assignedTo, assignedToName, applicationCount, createdAt
        case pitchReason, proposedPrice
        case job_id, family_id, posted_by, posted_by_name
        case reward_type, reward_amount, job_type, due_date
        case assigned_to, assigned_to_name, application_count, created_at
        case pitch_reason, proposed_price
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        jobId = (try? c.decodeStr(.jobId)) ?? (try? c.decodeStr(.job_id)) ?? ""
        familyId = (try? c.decodeStr(.familyId)) ?? (try? c.decodeStr(.family_id)) ?? ""
        postedBy = (try? c.decodeStr(.postedBy)) ?? (try? c.decodeStr(.posted_by)) ?? ""
        postedByName = (try? c.decode(String.self, forKey: .postedByName)) ?? (try? c.decode(String.self, forKey: .posted_by_name))
        title = (try? c.decode(String.self, forKey: .title)) ?? ""
        description = try? c.decode(String.self, forKey: .description)
        rewardType = (try? c.decode(String.self, forKey: .rewardType)) ?? (try? c.decode(String.self, forKey: .reward_type)) ?? "points"

        if let d = try? c.decode(Double.self, forKey: .rewardAmount) { rewardAmount = d }
        else if let d = try? c.decode(Double.self, forKey: .reward_amount) { rewardAmount = d }
        else if let s = try? c.decode(String.self, forKey: .rewardAmount), let d = Double(s) { rewardAmount = d }
        else if let i = try? c.decode(Int.self, forKey: .rewardAmount) { rewardAmount = Double(i) }
        else { rewardAmount = 0 }

        jobType = (try? c.decode(String.self, forKey: .jobType)) ?? (try? c.decode(String.self, forKey: .job_type)) ?? "open"
        dueDate = (try? c.decode(String.self, forKey: .dueDate)) ?? (try? c.decode(String.self, forKey: .due_date))
        status = (try? c.decode(String.self, forKey: .status)) ?? "open"
        assignedTo = (try? c.decodeStr(.assignedTo)) ?? (try? c.decodeStr(.assigned_to))
        assignedToName = (try? c.decode(String.self, forKey: .assignedToName)) ?? (try? c.decode(String.self, forKey: .assigned_to_name))
        applicationCount = (try? c.decode(Int.self, forKey: .applicationCount)) ?? (try? c.decode(Int.self, forKey: .application_count))
        createdAt = (try? c.decode(String.self, forKey: .createdAt)) ?? (try? c.decode(String.self, forKey: .created_at))
        pitchReason = (try? c.decode(String.self, forKey: .pitchReason)) ?? (try? c.decode(String.self, forKey: .pitch_reason))
        proposedPrice = (try? c.decode(Double.self, forKey: .proposedPrice)) ?? (try? c.decode(Double.self, forKey: .proposed_price))
    }
}

struct JobApplication: Decodable, Identifiable {
    let applicationId: String
    let jobId: String
    let userId: String
    var firstName: String?
    var age: Int?
    var reason: String?
    var bidAmount: Double?
    var status: String
    var counterAmount: Double?
    var counterMessage: String?
    var negotiationRound: Int?

    var id: String { applicationId }

    enum CodingKeys: String, CodingKey {
        case applicationId, jobId, userId, firstName, age, reason, bidAmount, status
        case counterAmount, counterMessage, negotiationRound
        case application_id, job_id, user_id, first_name, bid_amount
        case counter_amount, counter_message, negotiation_round
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        applicationId = (try? c.decodeStr(.applicationId)) ?? (try? c.decodeStr(.application_id)) ?? ""
        jobId = (try? c.decodeStr(.jobId)) ?? (try? c.decodeStr(.job_id)) ?? ""
        userId = (try? c.decodeStr(.userId)) ?? (try? c.decodeStr(.user_id)) ?? ""
        firstName = (try? c.decode(String.self, forKey: .firstName)) ?? (try? c.decode(String.self, forKey: .first_name))
        age = try? c.decode(Int.self, forKey: .age)
        reason = try? c.decode(String.self, forKey: .reason)
        bidAmount = (try? c.decode(Double.self, forKey: .bidAmount)) ?? (try? c.decode(Double.self, forKey: .bid_amount))
        status = (try? c.decode(String.self, forKey: .status)) ?? "pending"
        counterAmount = (try? c.decode(Double.self, forKey: .counterAmount)) ?? (try? c.decode(Double.self, forKey: .counter_amount))
        counterMessage = (try? c.decode(String.self, forKey: .counterMessage)) ?? (try? c.decode(String.self, forKey: .counter_message))
        negotiationRound = (try? c.decode(Int.self, forKey: .negotiationRound)) ?? (try? c.decode(Int.self, forKey: .negotiation_round))
    }
}

// MARK: - Contract Portfolio Stats
struct ContractPortfolio: Decodable {
    let totalContracts: Int
    let totalEarnings: Double
    let onTimePercentage: Int
    let proposalsTotal: Int
    let proposalsAccepted: Int
    let proposalSuccessRate: Int

    var businessLevel: String {
        switch totalEarnings {
        case 0..<500: return "Starter"
        case 500..<1500: return "Hustler"
        case 1500..<3000: return "Entrepreneur"
        default: return "Mogul"
        }
    }

    var businessLevelEmoji: String {
        switch totalEarnings {
        case 0..<500: return "🌱"
        case 500..<1500: return "💼"
        case 1500..<3000: return "🚀"
        default: return "👑"
        }
    }
}

// MARK: - Subcontract
struct Subcontract: Decodable, Identifiable {
    let subcontractId: String
    let parentJobId: String
    let subcontractorId: String
    let subcontractorName: String
    let taskDescription: String
    let amount: Double
    let status: String
    var id: String { subcontractId }
}

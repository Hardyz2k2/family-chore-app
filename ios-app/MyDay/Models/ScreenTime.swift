import Foundation

struct ScreenTimeSettings: Codable {
    var dailyLimitMinutes: Int
    var requireDailyChores: Bool
    var minimumPoints: Int

    // Use snake_case for encoding (API expects it) and decode both formats
    enum EncodingKeys: String, CodingKey {
        case daily_limit_minutes, require_daily_chores, minimum_points
    }

    enum DecodingKeys: String, CodingKey {
        case dailyLimitMinutes, requireDailyChores, minimumPoints
        case daily_limit_minutes, require_daily_chores, minimum_points
    }

    init(dailyLimitMinutes: Int = 60, requireDailyChores: Bool = true, minimumPoints: Int = 0) {
        self.dailyLimitMinutes = dailyLimitMinutes
        self.requireDailyChores = requireDailyChores
        self.minimumPoints = minimumPoints
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: DecodingKeys.self)
        dailyLimitMinutes = (try? c.decode(Int.self, forKey: .dailyLimitMinutes)) ?? (try? c.decode(Int.self, forKey: .daily_limit_minutes)) ?? 60
        requireDailyChores = (try? c.decode(Bool.self, forKey: .requireDailyChores)) ?? (try? c.decode(Bool.self, forKey: .require_daily_chores)) ?? true
        minimumPoints = (try? c.decode(Int.self, forKey: .minimumPoints)) ?? (try? c.decode(Int.self, forKey: .minimum_points)) ?? 0
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: EncodingKeys.self)
        try c.encode(dailyLimitMinutes, forKey: .daily_limit_minutes)
        try c.encode(requireDailyChores, forKey: .require_daily_chores)
        try c.encode(minimumPoints, forKey: .minimum_points)
    }
}

struct ScreenTimeAccess: Decodable {
    let accessGranted: Bool
    var reason: String?
    var currentPoints: Int?
    var requiredPoints: Int?
    var todayCompleted: Int?
    var todayTotal: Int?

    enum CodingKeys: String, CodingKey {
        case hasAccess, accessGranted, access_granted
        case reason
        case currentPoints, current_points
        case minimumPointsRequired, requiredPoints, required_points
        case completedChores, todayCompleted, today_completed
        case totalChores, todayTotal, today_total
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        accessGranted = (try? c.decode(Bool.self, forKey: .hasAccess))
            ?? (try? c.decode(Bool.self, forKey: .accessGranted))
            ?? (try? c.decode(Bool.self, forKey: .access_granted))
            ?? false
        reason = try? c.decode(String.self, forKey: .reason)
        currentPoints = (try? c.decode(Int.self, forKey: .currentPoints)) ?? (try? c.decode(Int.self, forKey: .current_points))
        requiredPoints = (try? c.decode(Int.self, forKey: .minimumPointsRequired)) ?? (try? c.decode(Int.self, forKey: .requiredPoints))
        todayCompleted = (try? c.decode(Int.self, forKey: .completedChores)) ?? (try? c.decode(Int.self, forKey: .todayCompleted))
        todayTotal = (try? c.decode(Int.self, forKey: .totalChores)) ?? (try? c.decode(Int.self, forKey: .todayTotal))
    }
}

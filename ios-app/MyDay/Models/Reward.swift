import Foundation

struct Reward: Decodable, Identifiable {
    let rewardId: String
    let familyId: String
    let rewardName: String
    var description: String?
    let pointCost: Int
    var childId: String?
    var childName: String?
    let isActive: Bool

    var id: String { rewardId }

    enum CodingKeys: String, CodingKey {
        case rewardId, familyId, rewardName, description, pointCost, childId, childName, isActive
        case reward_id, family_id, reward_name, point_cost, child_id, child_name, is_active
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        rewardId = (try? c.decodeStr(.rewardId)) ?? (try? c.decodeStr(.reward_id)) ?? ""
        familyId = (try? c.decodeStr(.familyId)) ?? (try? c.decodeStr(.family_id)) ?? ""
        rewardName = (try? c.decode(String.self, forKey: .rewardName)) ?? (try? c.decode(String.self, forKey: .reward_name)) ?? ""
        description = try? c.decode(String.self, forKey: .description)
        if let p = try? c.decode(Int.self, forKey: .pointCost) { pointCost = p }
        else if let p = try? c.decode(Int.self, forKey: .point_cost) { pointCost = p }
        else if let s = try? c.decode(String.self, forKey: .pointCost), let p = Int(s) { pointCost = p }
        else if let s = try? c.decode(String.self, forKey: .point_cost), let p = Int(s) { pointCost = p }
        else { pointCost = 0 }
        childId = (try? c.decodeStr(.childId)) ?? (try? c.decodeStr(.child_id))
        childName = (try? c.decode(String.self, forKey: .childName)) ?? (try? c.decode(String.self, forKey: .child_name))
        isActive = (try? c.decode(Bool.self, forKey: .isActive)) ?? (try? c.decode(Bool.self, forKey: .is_active)) ?? true
    }
}

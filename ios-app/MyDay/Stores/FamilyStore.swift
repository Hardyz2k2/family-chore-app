import Foundation
import Observation

@Observable
class FamilyStore {
    var family: Family?
    var isLoading = false

    var members: [FamilyMember] { family?.members ?? [] }
    var children: [FamilyMember] { members.filter { $0.role == "child" } }

    func load(familyId: String) async {
        isLoading = true
        do {
            family = try await APIClient.shared.getFamily(familyId)
        } catch {
            print("Failed to load family: \(error)")
        }
        isLoading = false
    }
}

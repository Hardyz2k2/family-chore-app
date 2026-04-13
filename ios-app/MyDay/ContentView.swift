import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationStack {
            SmartAuthView()
        }
        .environment(AuthManager())
        .environment(FamilyStore())
        .environment(ChoreStore())
        .environment(ShopStore())
    }
}

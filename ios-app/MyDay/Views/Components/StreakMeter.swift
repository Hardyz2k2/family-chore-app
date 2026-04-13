import SwiftUI

struct StreakMeter: View {
    let streak: Int

    var body: some View {
        HStack(spacing: 4) {
            ForEach(0..<7, id: \.self) { i in
                let active = i < streak
                RoundedRectangle(cornerRadius: 4)
                    .fill(active
                        ? LinearGradient(colors: [.neonOrange, .neonRed], startPoint: .top, endPoint: .bottom)
                        : LinearGradient(colors: [Color.gameCardLight, Color.gameCardLight], startPoint: .top, endPoint: .bottom)
                    )
                    .frame(width: 20, height: active ? 28 : 20)
                    .overlay(
                        active ? Image(systemName: "flame.fill")
                            .font(.system(size: 10))
                            .foregroundStyle(.white) : nil
                    )
                    .shadow(color: active ? .neonOrange.opacity(0.4) : .clear, radius: 4)
            }
            if streak > 7 {
                Text("+\(streak - 7)")
                    .font(.system(size: 12, weight: .black, design: .rounded))
                    .foregroundStyle(.neonOrange)
            }
        }
    }
}

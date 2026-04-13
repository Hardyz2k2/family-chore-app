import SwiftUI

struct StarParticle: Identifiable {
    let id = UUID()
    var x: CGFloat
    var y: CGFloat
    var scale: CGFloat
    var opacity: Double
}

struct ParticleExplosion: View {
    @State private var particles: [StarParticle] = []
    @State private var animate = false

    var body: some View {
        ZStack {
            ForEach(particles) { p in
                Image(systemName: "star.fill")
                    .font(.system(size: 12))
                    .foregroundStyle(.neonYellow)
                    .scaleEffect(animate ? p.scale * 0.3 : p.scale)
                    .opacity(animate ? 0 : p.opacity)
                    .offset(x: animate ? p.x * 2 : 0, y: animate ? p.y * 2 : 0)
            }
        }
        .onAppear {
            particles = (0..<12).map { _ in
                StarParticle(
                    x: CGFloat.random(in: -60...60),
                    y: CGFloat.random(in: -80...(-20)),
                    scale: CGFloat.random(in: 0.5...1.5),
                    opacity: Double.random(in: 0.6...1)
                )
            }
            withAnimation(.easeOut(duration: 1)) {
                animate = true
            }
        }
    }
}

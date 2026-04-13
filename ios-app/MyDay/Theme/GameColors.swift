import SwiftUI

extension Color {
    static let gameBackground = Color(red: 0.043, green: 0.059, blue: 0.102)   // #0B0F1A
    static let gameCard = Color(red: 0.082, green: 0.102, blue: 0.180)         // #151A2E
    static let gameCardLight = Color(red: 0.118, green: 0.141, blue: 0.235)    // #1E2440

    static let neonBlue = Color(red: 0, green: 0.831, blue: 1)                 // #00D4FF
    static let neonGreen = Color(red: 0, green: 1, blue: 0.533)               // #00FF88
    static let neonPurple = Color(red: 0.659, green: 0.333, blue: 0.969)      // #A855F7
    static let neonOrange = Color(red: 1, green: 0.420, blue: 0.208)          // #FF6B35
    static let neonRed = Color(red: 1, green: 0.2, blue: 0.4)                 // #FF3366
    static let neonYellow = Color(red: 1, green: 0.843, blue: 0)              // #FFD700
    static let neonPink = Color(red: 1, green: 0.412, blue: 0.706)            // #FF69B4

    static let rookieGreen = Color(red: 0.133, green: 0.773, blue: 0.369)     // #22C55E
    static let proYellow = Color(red: 0.918, green: 0.702, blue: 0.082)       // #EAB308
    static let legendRed = Color(red: 0.937, green: 0.267, blue: 0.267)       // #EF4444
}

extension ShapeStyle where Self == Color {
    static var gameBackground: Color { .gameBackground }
    static var gameCard: Color { .gameCard }
    static var gameCardLight: Color { .gameCardLight }
    static var neonBlue: Color { .neonBlue }
    static var neonGreen: Color { .neonGreen }
    static var neonYellow: Color { .neonYellow }
    static var neonOrange: Color { .neonOrange }
    static var neonRed: Color { .neonRed }
    static var neonPurple: Color { .neonPurple }
    static var neonPink: Color { .neonPink }
    static var rookieGreen: Color { .rookieGreen }
    static var proYellow: Color { .proYellow }
    static var legendRed: Color { .legendRed }
}

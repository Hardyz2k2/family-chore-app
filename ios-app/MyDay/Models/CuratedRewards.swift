import Foundation

struct CuratedReward: Identifiable {
    let id: String
    let name: String
    let description: String
    let points: Int
    let emoji: String
    let category: String

    // MARK: - Daily Rewards (10-25 pts)
    static let daily: [CuratedReward] = [
        CuratedReward(id: "d1", name: "30 min Screen Time", description: "30 minutes of tablet, TV, or phone time", points: 20, emoji: "📱", category: "daily"),
        CuratedReward(id: "d2", name: "30 min VR Time", description: "30 minutes of VR gaming or experiences", points: 25, emoji: "🥽", category: "daily"),
        CuratedReward(id: "d3", name: "30 min Gaming Time", description: "30 minutes of console or PC gaming", points: 20, emoji: "🎮", category: "daily"),
        CuratedReward(id: "d4", name: "Outside Play Time", description: "Extra 30 minutes of outdoor play", points: 15, emoji: "🌳", category: "daily"),
        CuratedReward(id: "d5", name: "Choose a Snack", description: "Pick a special snack from the pantry", points: 10, emoji: "🍪", category: "daily"),
        CuratedReward(id: "d6", name: "Stay Up 15 min Late", description: "Stay up 15 minutes past bedtime", points: 25, emoji: "🌙", category: "daily"),
        CuratedReward(id: "d7", name: "Pick the Music", description: "Choose the music for the car or house", points: 10, emoji: "🎵", category: "daily"),
    ]

    // MARK: - Weekly Rewards (40-100 pts)
    static let weekly: [CuratedReward] = [
        CuratedReward(id: "w1", name: "Chore Immunity Pass", description: "Skip any one chore this week", points: 80, emoji: "🛡️", category: "weekly"),
        CuratedReward(id: "w2", name: "Extra Gaming Session", description: "1 hour bonus gaming session on the weekend", points: 60, emoji: "🕹️", category: "weekly"),
        CuratedReward(id: "w3", name: "Choose Dinner Menu", description: "Pick what the family has for dinner one night", points: 50, emoji: "🍕", category: "weekly"),
        CuratedReward(id: "w4", name: "Movie Night Pick", description: "Choose the movie for family movie night", points: 40, emoji: "🎬", category: "weekly"),
        CuratedReward(id: "w5", name: "Friend Sleepover", description: "Have a friend over for a sleepover", points: 100, emoji: "🏠", category: "weekly"),
        CuratedReward(id: "w6", name: "Stay Up 30 min Late", description: "Stay up 30 minutes late on Friday or Saturday", points: 50, emoji: "⭐", category: "weekly"),
        CuratedReward(id: "w7", name: "Pocket Money Bonus", description: "Earn a small pocket money bonus", points: 75, emoji: "💰", category: "weekly"),
    ]

    // MARK: - Family Target Rewards (120-250 pts)
    static let familyTarget: [CuratedReward] = [
        CuratedReward(id: "f1", name: "Family Night Out", description: "The whole family goes out for dinner", points: 200, emoji: "🍽️", category: "family_target"),
        CuratedReward(id: "f2", name: "Play Area / Fun Zone", description: "Family trip to an indoor play area or fun zone", points: 250, emoji: "🎢", category: "family_target"),
        CuratedReward(id: "f3", name: "Cinema Trip", description: "Family outing to the cinema with popcorn", points: 200, emoji: "🍿", category: "family_target"),
        CuratedReward(id: "f4", name: "Ice Cream Outing", description: "Family trip to the ice cream shop", points: 150, emoji: "🍦", category: "family_target"),
        CuratedReward(id: "f5", name: "Park / Beach Day", description: "Family day out at the park or beach", points: 200, emoji: "🏖️", category: "family_target"),
        CuratedReward(id: "f6", name: "Game Night Special", description: "Special family board game night with treats", points: 120, emoji: "🎲", category: "family_target"),
    ]
}

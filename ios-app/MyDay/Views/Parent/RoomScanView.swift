import SwiftUI
import PhotosUI

struct RoomScanView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(FamilyStore.self) private var familyStore
    @Environment(\.dismiss) private var dismiss
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var imageData: Data?
    @State private var isAnalyzing = false
    @State private var detectedRooms: [DetectedRoom] = []
    @State private var savedRooms: [DetectedRoom] = []
    @State private var error: String?
    @State private var isSaving = false
    @State private var saved = false

    struct DetectedRoom: Identifiable {
        let id = UUID()
        let name: String
        let confidence: Double
        let assets: [String]
        var suggestedChores: [[String: String]]
    }

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    HStack {
                        Text("Scan Rooms").font(.system(size: 20, weight: .black, design: .rounded)).foregroundStyle(.white)
                        Spacer()
                        Button { dismiss() } label: { Image(systemName: "xmark.circle.fill").font(.system(size: 24)).foregroundStyle(.white.opacity(0.3)) }
                    }.padding(.top, 16)

                    VStack(spacing: 8) {
                        Image(systemName: "camera.viewfinder").font(.system(size: 40)).foregroundStyle(.neonBlue).neonGlow(.neonBlue, radius: 12)
                        Text("Upload a photo of a room and AI will detect what's in it and suggest chores")
                            .font(.system(size: 13, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.4))
                            .multilineTextAlignment(.center)
                    }

                    // Photo picker
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        HStack(spacing: 10) {
                            Image(systemName: isAnalyzing ? "hourglass" : "photo.on.rectangle.angled")
                            Text(isAnalyzing ? "Analyzing..." : imageData != nil ? "Scan Another Room" : "Choose Room Photo")
                        }
                        .font(.system(size: 14, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 14)
                        .background(isAnalyzing ? Color.gameCardLight : Color.neonBlue)
                        .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    .disabled(isAnalyzing)
                    .onChange(of: selectedPhoto) { _, item in
                        Task {
                            if let data = try? await item?.loadTransferable(type: Data.self) {
                                imageData = data
                                error = nil
                                detectedRooms = []
                                await analyzeImage(data)
                            }
                            // Reset selection so same photo can be re-picked
                            selectedPhoto = nil
                        }
                    }

                    // Preview
                    if let imageData, let uiImage = UIImage(data: imageData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .scaledToFill()
                            .frame(height: 180)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }

                    if isAnalyzing {
                        VStack(spacing: 8) {
                            ProgressView().tint(.neonBlue)
                            Text("AI is analyzing the room...").font(.system(size: 13, weight: .medium, design: .rounded)).foregroundStyle(.neonBlue)
                        }.padding(.vertical, 20)
                    }

                    if let error {
                        VStack(spacing: 8) {
                            Text(error).font(.system(size: 13, weight: .medium)).foregroundStyle(.neonRed)
                            Text("Tap \"Scan Another Room\" above to try a different photo")
                                .font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                        }
                    }

                    // Detected rooms
                    if !detectedRooms.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            Text("Detected Rooms").font(.system(size: 16, weight: .bold, design: .rounded)).foregroundStyle(.white)

                            ForEach(detectedRooms) { room in
                                VStack(alignment: .leading, spacing: 6) {
                                    HStack {
                                        Text(room.name).font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.neonBlue)
                                        Spacer()
                                        Text("\(Int(room.confidence * 100))% confidence")
                                            .font(.system(size: 10, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                                    }

                                    if !room.assets.isEmpty {
                                        Text("Assets: \(room.assets.joined(separator: ", "))")
                                            .font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.4)).lineLimit(2)
                                    }

                                    if !room.suggestedChores.isEmpty {
                                        Text("Suggested chores:").font(.system(size: 11, weight: .bold)).foregroundStyle(.white.opacity(0.5))
                                        ForEach(room.suggestedChores, id: \.description) { chore in
                                            HStack(spacing: 6) {
                                                Circle().fill(Color.neonGreen).frame(width: 4, height: 4)
                                                Text(chore["chore_name"] ?? "").font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.6))
                                                Spacer()
                                                Text(chore["difficulty"] ?? "").font(.system(size: 9, weight: .bold)).foregroundStyle(.white.opacity(0.3))
                                            }
                                        }
                                    }
                                }
                                .padding(12).background(Color.gameCardLight).clipShape(RoundedRectangle(cornerRadius: 10))
                            }
                        }.gameCard(glow: .neonBlue.opacity(0.3))
                    }

                    // Save
                    if !detectedRooms.isEmpty {
                        if saved {
                            HStack { Image(systemName: "checkmark.circle.fill"); Text("Rooms & chores saved!") }
                                .font(.system(size: 14, weight: .bold)).foregroundStyle(.neonGreen)
                        }

                        Button("Save Rooms & Create Chores") {
                            isSaving = true
                            Task {
                                let roomDicts = detectedRooms.map { room -> [String: Any] in
                                    [
                                        "name": room.name,
                                        "confidence": room.confidence,
                                        "assets": room.assets,
                                        "suggestedChores": room.suggestedChores
                                    ]
                                }
                                try? await APIClient.shared.addRoomsAndChores(auth.familyId ?? "", rooms: roomDicts)
                                if let fid = auth.familyId { await familyStore.load(familyId: fid) }
                                savedRooms.append(contentsOf: detectedRooms)
                                detectedRooms = []
                                imageData = nil
                                saved = true; isSaving = false
                                try? await Task.sleep(for: .seconds(2)); saved = false
                            }
                        }
                        .buttonStyle(NeonButtonStyle(color: .neonGreen))
                        .disabled(isSaving)
                    }

                    // Previously saved
                    if !savedRooms.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Saved this session").font(.system(size: 12, weight: .bold)).foregroundStyle(.white.opacity(0.4))
                            ForEach(savedRooms) { room in
                                HStack {
                                    Image(systemName: "checkmark.circle.fill").foregroundStyle(.neonGreen).font(.system(size: 12))
                                    Text(room.name).font(.system(size: 13, weight: .medium)).foregroundStyle(.white)
                                }
                            }
                        }.gameCard()
                    }

                    VStack(spacing: 4) {
                        Text("Each photo adds to your rooms — duplicates are automatically skipped")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.25))
                            .multilineTextAlignment(.center)
                        Text("Photos of the same room from different angles are merged by room name")
                            .font(.system(size: 10, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.15))
                            .multilineTextAlignment(.center)
                    }

                    Button("Done") { dismiss() }
                        .buttonStyle(SecondaryButtonStyle())
                }.padding(16)
            }
        }
    }

    private func analyzeImage(_ data: Data) async {
        isAnalyzing = true
        error = nil
        let base64 = data.base64EncodedString()
        do {
            let rooms = try await APIClient.shared.analyzeRoom(imageBase64: base64)
            detectedRooms = rooms.map { dict in
                DetectedRoom(
                    name: dict["name"] as? String ?? "Unknown Room",
                    confidence: dict["confidence"] as? Double ?? 0.5,
                    assets: dict["assets"] as? [String] ?? [],
                    suggestedChores: dict["suggestedChores"] as? [[String: String]] ?? []
                )
            }
            if detectedRooms.isEmpty {
                error = "No rooms detected. Try a clearer photo."
            }
        } catch {
            self.error = "Failed to analyze: \(error.localizedDescription)"
        }
        isAnalyzing = false
    }
}

import SwiftUI
import PhotosUI

struct RoomScanView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(FamilyStore.self) private var familyStore
    @Environment(\.dismiss) private var dismiss

    // Room naming
    @State private var roomName = ""
    @State private var showSuggestions = false

    // Photos (up to 4 per room)
    @State private var selectedPhotos: [PhotosPickerItem] = []
    @State private var photoImages: [UIImage] = []

    // Analysis
    @State private var isAnalyzing = false
    @State private var analysisResults: [AnalyzedAsset] = []
    @State private var suggestedChores: [[String: String]] = []
    @State private var error: String?

    // Session tracking
    @State private var savedRooms: [SavedRoom] = []
    @State private var isSaving = false
    @State private var roomCount = 1

    struct AnalyzedAsset: Identifiable {
        let id = UUID()
        let name: String
    }

    struct SavedRoom: Identifiable {
        let id = UUID()
        let name: String
        let assetCount: Int
        let choreCount: Int
    }

    let roomSuggestions = [
        "Kitchen", "Living Room", "Master Bedroom", "Kids Bedroom",
        "Bathroom", "Upstairs Bathroom", "Downstairs Toilet",
        "Dining Room", "Garage", "Laundry Room", "Home Office",
        "Playroom", "Hallway", "Garden", "Pantry"
    ]

    var body: some View {
        ZStack {
            Color.gameBackground.ignoresSafeArea()
            ScrollView {
                VStack(spacing: 16) {
                    // Header
                    HStack {
                        Text("Scan Rooms").font(.system(size: 20, weight: .black, design: .rounded)).foregroundStyle(.white)
                        Spacer()
                        Button { dismiss() } label: { Image(systemName: "xmark.circle.fill").font(.system(size: 24)).foregroundStyle(.white.opacity(0.3)) }
                    }.padding(.top, 16)

                    // Previously saved rooms this session
                    if !savedRooms.isEmpty {
                        VStack(alignment: .leading, spacing: 6) {
                            Text("Scanned").font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.4))
                            ForEach(savedRooms) { room in
                                HStack(spacing: 8) {
                                    Image(systemName: "checkmark.circle.fill").font(.system(size: 14)).foregroundStyle(.neonGreen)
                                    Text(room.name).font(.system(size: 13, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                    Spacer()
                                    Text("\(room.assetCount) items, \(room.choreCount) chores")
                                        .font(.system(size: 11, weight: .medium)).foregroundStyle(.white.opacity(0.3))
                                }
                            }
                        }.gameCard(glow: .neonGreen.opacity(0.2))
                    }

                    // ── STEP 1: Name the room ──
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text("Room \(roomCount)").font(.system(size: 11, weight: .black, design: .rounded)).foregroundStyle(.neonBlue)
                                .padding(.horizontal, 8).padding(.vertical, 3).background(Color.neonBlue.opacity(0.15)).clipShape(Capsule())
                            Spacer()
                        }

                        Text("What room is this?").font(.system(size: 16, weight: .bold, design: .rounded)).foregroundStyle(.white)

                        // Text input
                        GameTextField(icon: "house.fill", placeholder: "e.g. Kids Bedroom, Upstairs Bathroom", text: $roomName)
                            .onChange(of: roomName) { _, _ in showSuggestions = !roomName.isEmpty }

                        // Quick pick suggestions
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 6) {
                                ForEach(roomSuggestions.filter { roomName.isEmpty || $0.localizedCaseInsensitiveContains(roomName) }, id: \.self) { suggestion in
                                    Button {
                                        roomName = suggestion
                                        showSuggestions = false
                                    } label: {
                                        Text(suggestion)
                                            .font(.system(size: 12, weight: .bold, design: .rounded))
                                            .foregroundStyle(roomName == suggestion ? .white : .white.opacity(0.5))
                                            .padding(.horizontal, 12).padding(.vertical, 6)
                                            .background(roomName == suggestion ? Color.neonBlue.opacity(0.3) : Color.gameCardLight)
                                            .clipShape(Capsule())
                                    }
                                }
                            }
                        }
                    }.gameCard(glow: .neonBlue.opacity(0.2))

                    // ── STEP 2: Upload photos (1-4) ──
                    if !roomName.trimmingCharacters(in: .whitespaces).isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Text("Photos of \(roomName)").font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white)
                                Spacer()
                                Text("\(photoImages.count)/4").font(.system(size: 12, weight: .bold, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                            }

                            Text("Upload 1-4 photos from different angles for best results")
                                .font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))

                            // Photo grid
                            HStack(spacing: 10) {
                                ForEach(0..<4, id: \.self) { i in
                                    if i < photoImages.count {
                                        // Show uploaded photo
                                        ZStack(alignment: .topTrailing) {
                                            Image(uiImage: photoImages[i])
                                                .resizable().scaledToFill()
                                                .frame(width: 72, height: 72)
                                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                            Button {
                                                photoImages.remove(at: i)
                                            } label: {
                                                Image(systemName: "xmark.circle.fill").font(.system(size: 16))
                                                    .foregroundStyle(.white).background(Circle().fill(.neonRed)).offset(x: 4, y: -4)
                                            }
                                        }
                                    } else if i == photoImages.count {
                                        // Add button
                                        PhotosPicker(selection: Binding(
                                            get: { selectedPhotos },
                                            set: { newItems in
                                                selectedPhotos = newItems
                                                Task { await loadPhotos(newItems) }
                                            }
                                        ), maxSelectionCount: 4 - photoImages.count, matching: .images) {
                                            VStack(spacing: 4) {
                                                Image(systemName: "plus.circle.fill").font(.system(size: 24)).foregroundStyle(.neonBlue)
                                                Text("Add").font(.system(size: 10, weight: .bold, design: .rounded)).foregroundStyle(.neonBlue)
                                            }
                                            .frame(width: 72, height: 72)
                                            .background(Color.neonBlue.opacity(0.08))
                                            .clipShape(RoundedRectangle(cornerRadius: 10))
                                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.neonBlue.opacity(0.2), lineWidth: 1))
                                        }
                                    } else {
                                        // Empty slot
                                        RoundedRectangle(cornerRadius: 10)
                                            .fill(Color.gameCardLight)
                                            .frame(width: 72, height: 72)
                                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.white.opacity(0.05), lineWidth: 1))
                                    }
                                }
                            }

                            // Analyse button
                            if !photoImages.isEmpty && analysisResults.isEmpty {
                                Button {
                                    analyzeAllPhotos()
                                } label: {
                                    if isAnalyzing {
                                        HStack(spacing: 8) {
                                            ProgressView().tint(.white)
                                            Text("Analyzing \(photoImages.count) photo\(photoImages.count > 1 ? "s" : "")...")
                                        }
                                    } else {
                                        Label("Analyse \(roomName)", systemImage: "sparkles")
                                    }
                                }
                                .buttonStyle(NeonButtonStyle(color: .neonBlue))
                                .disabled(isAnalyzing)
                            }
                        }.gameCard(glow: .neonPurple.opacity(0.2))
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    // Error
                    if let error {
                        VStack(spacing: 6) {
                            Text(error).font(.system(size: 13, weight: .medium)).foregroundStyle(.neonRed)
                            Text("Try clearer photos or a different angle")
                                .font(.system(size: 11, weight: .medium, design: .rounded)).foregroundStyle(.white.opacity(0.3))
                        }
                    }

                    // ── STEP 3: Results ──
                    if !analysisResults.isEmpty {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                Image(systemName: "checkmark.circle.fill").foregroundStyle(.neonGreen)
                                Text("\(roomName) — \(analysisResults.count) items detected")
                                    .font(.system(size: 14, weight: .bold, design: .rounded)).foregroundStyle(.white)
                            }

                            // Assets
                            HStack(spacing: 4) {
                                ForEach(analysisResults.prefix(8)) { asset in
                                    Text(asset.name).font(.system(size: 10, weight: .medium, design: .rounded))
                                        .foregroundStyle(.neonBlue).padding(.horizontal, 6).padding(.vertical, 2)
                                        .background(Color.neonBlue.opacity(0.1)).clipShape(Capsule())
                                }
                                if analysisResults.count > 8 {
                                    Text("+\(analysisResults.count - 8)").font(.system(size: 10, weight: .bold)).foregroundStyle(.white.opacity(0.3))
                                }
                            }

                            // Suggested chores
                            if !suggestedChores.isEmpty {
                                Text("Suggested chores:").font(.system(size: 12, weight: .bold)).foregroundStyle(.white.opacity(0.5))
                                ForEach(suggestedChores.prefix(6), id: \.description) { chore in
                                    HStack(spacing: 6) {
                                        Circle().fill(Color.neonGreen).frame(width: 4, height: 4)
                                        Text(chore["chore_name"] ?? "").font(.system(size: 12, weight: .medium)).foregroundStyle(.white.opacity(0.6))
                                    }
                                }
                            }
                        }.gameCard(glow: .neonGreen.opacity(0.3))

                        // Action buttons
                        VStack(spacing: 10) {
                            Button("Save & Scan Next Room") {
                                saveRoom(thenNext: true)
                            }.buttonStyle(NeonButtonStyle(color: .neonGreen)).disabled(isSaving)

                            Button("Save & Done") {
                                saveRoom(thenNext: false)
                            }.buttonStyle(SecondaryButtonStyle()).disabled(isSaving)
                        }
                    }

                    // Done button (always visible at bottom)
                    if savedRooms.isEmpty && analysisResults.isEmpty {
                        Button("Cancel") { dismiss() }
                            .font(.system(size: 14, weight: .medium)).foregroundStyle(.white.opacity(0.3))
                    }
                }.padding(16)
            }
            .onTapGesture { UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil) }
        }
    }

    // MARK: - Load Photos
    private func loadPhotos(_ items: [PhotosPickerItem]) async {
        for item in items {
            if let data = try? await item.loadTransferable(type: Data.self),
               let image = UIImage(data: data) {
                if photoImages.count < 4 {
                    photoImages.append(image)
                }
            }
        }
        selectedPhotos = []
    }

    // MARK: - Analyse All Photos
    private func analyzeAllPhotos() {
        isAnalyzing = true
        error = nil
        Task {
            var allAssets: Set<String> = []
            var allChores: [[String: String]] = []

            for image in photoImages {
                // Resize to max 1024px to stay under Lambda's 6MB payload limit
                let resized = resizeImage(image, maxDimension: 1024)
                guard let data = resized.jpegData(compressionQuality: 0.4) else { continue }
                let base64 = data.base64EncodedString()
                do {
                    let rooms = try await APIClient.shared.analyzeRoom(imageBase64: base64)
                    for room in rooms {
                        if let assets = room["assets"] as? [String] {
                            for a in assets { allAssets.insert(a) }
                        }
                        if let chores = room["suggestedChores"] as? [[String: String]] {
                            for chore in chores {
                                if !allChores.contains(where: { $0["chore_name"] == chore["chore_name"] }) {
                                    allChores.append(chore)
                                }
                            }
                        }
                    }
                } catch {
                    // Continue with other photos if one fails
                }
            }

            if allAssets.isEmpty {
                self.error = "Couldn't detect anything. Try clearer, well-lit photos."
            } else {
                analysisResults = allAssets.sorted().map { AnalyzedAsset(name: $0) }
                suggestedChores = allChores
            }
            isAnalyzing = false
        }
    }

    // MARK: - Save Room
    private func saveRoom(thenNext: Bool) {
        isSaving = true
        Task {
            let roomDicts: [[String: Any]] = [[
                "name": roomName.trimmingCharacters(in: .whitespaces),
                "confidence": 0.95,
                "assets": analysisResults.map { $0.name },
                "suggestedChores": suggestedChores
            ]]
            try? await APIClient.shared.addRoomsAndChores(auth.familyId ?? "", rooms: roomDicts)
            if let fid = auth.familyId { await familyStore.load(familyId: fid) }

            savedRooms.append(SavedRoom(
                name: roomName,
                assetCount: analysisResults.count,
                choreCount: suggestedChores.count
            ))

            // Reset for next room
            roomName = ""
            photoImages = []
            analysisResults = []
            suggestedChores = []
            error = nil
            roomCount += 1
            isSaving = false

            if !thenNext {
                dismiss()
            }
        }
    }

    // Resize image to fit within maxDimension while maintaining aspect ratio
    private func resizeImage(_ image: UIImage, maxDimension: CGFloat) -> UIImage {
        let size = image.size
        guard size.width > maxDimension || size.height > maxDimension else { return image }
        let ratio = min(maxDimension / size.width, maxDimension / size.height)
        let newSize = CGSize(width: size.width * ratio, height: size.height * ratio)
        let renderer = UIGraphicsImageRenderer(size: newSize)
        return renderer.image { _ in image.draw(in: CGRect(origin: .zero, size: newSize)) }
    }
}

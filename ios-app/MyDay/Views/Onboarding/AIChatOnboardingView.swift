import SwiftUI
import Speech
import AVFoundation

struct ChatMessage: Identifiable {
    let id = UUID()
    let role: ChatRole
    let text: String
    let timestamp = Date()

    enum ChatRole { case ai, user }
}

struct AIChatOnboardingView: View {
    @Environment(AuthManager.self) private var auth
    @Environment(FamilyStore.self) private var familyStore
    @Binding var onComplete: Bool
    @Binding var extractedFamilyName: String
    @Binding var extractedChildren: [(name: String, age: String)]
    @Binding var extractedBinSchedule: ExtractedBinSchedule?
    @Binding var extractedPets: [ExtractedPet]?

    @State private var messages: [ChatMessage] = []
    @State private var inputText = ""
    @State private var sessionId: String?
    @State private var isLoading = false
    @State private var isComplete = false
    @State private var readyForRoomScan = false
    @State private var showRoomScan = false
    @State private var extracted = ExtractedFamilyData()
    @State private var ttsEnabled = true
    @State private var isListening = false
    @State private var liveTranscript = ""
    @State private var errorMessage: String?

    // Speech
    @State private var speechAuthorized = false
    @State private var speechAvailable = false
    private let speechSynthesizer = AVSpeechSynthesizer() // keep alive for TTS

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("AI Setup Assistant")
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    if let fn = extracted.familyName {
                        Text(fn).font(.system(size: 12, weight: .medium, design: .rounded)).foregroundStyle(.neonGreen)
                    }
                }
                Spacer()

                Button { ttsEnabled.toggle() } label: {
                    Image(systemName: ttsEnabled ? "speaker.wave.2.fill" : "speaker.slash.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(ttsEnabled ? .neonBlue : .white.opacity(0.3))
                }

                if !extracted.children.isEmpty {
                    HStack(spacing: 3) {
                        Image(systemName: "person.3.fill").font(.system(size: 12))
                        Text("\(extracted.children.count)").font(.system(size: 12, weight: .bold, design: .rounded))
                    }
                    .foregroundStyle(.neonPurple)
                    .padding(.horizontal, 8).padding(.vertical, 4)
                    .background(Color.neonPurple.opacity(0.15))
                    .clipShape(Capsule())
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
            .background(Color.gameCard)

            // Messages
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(messages) { msg in
                            MessageBubble(message: msg)
                                .id(msg.id)
                        }

                        if isLoading {
                            TypingIndicator()
                                .id("typing")
                        }

                        if isListening && !liveTranscript.isEmpty {
                            HStack {
                                Spacer()
                                Text(liveTranscript)
                                    .font(.system(size: 14, weight: .medium, design: .rounded))
                                    .foregroundStyle(.white.opacity(0.4))
                                    .italic()
                                    .padding(10)
                                    .background(Color.gameCardLight)
                                    .clipShape(RoundedRectangle(cornerRadius: 14))
                            }
                        }

                        if let errorMessage {
                            Text(errorMessage)
                                .font(.system(size: 12, weight: .medium, design: .rounded))
                                .foregroundStyle(.neonRed)
                                .padding(8)
                        }
                    }
                    .padding(16)
                }
                .onChange(of: messages.count) { _, _ in
                    withAnimation {
                        if let lastId = messages.last?.id {
                            proxy.scrollTo(lastId, anchor: .bottom)
                        }
                    }
                }
            }

            // Extracted data card
            if extracted.familyName != nil || !extracted.children.isEmpty {
                extractedDataCard
            }

            // Room scan button (when AI says ready — show regardless of isComplete)
            if readyForRoomScan {
                VStack(spacing: 8) {
                    Button {
                        showRoomScan = true
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "camera.viewfinder").font(.system(size: 22))
                            VStack(alignment: .leading, spacing: 2) {
                                Text("Scan a Room").font(.system(size: 15, weight: .bold, design: .rounded))
                                Text("Photograph rooms to auto-detect chores").font(.system(size: 11, weight: .medium, design: .rounded)).opacity(0.6)
                            }
                            Spacer()
                            Image(systemName: "chevron.right").font(.system(size: 14))
                        }
                        .foregroundStyle(.white)
                        .padding(14)
                        .background(LinearGradient(colors: [.neonBlue, .neonPurple.opacity(0.6)], startPoint: .leading, endPoint: .trailing))
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                    }
                    .padding(.horizontal, 16)

                    if !isComplete {
                        Text("You can scan multiple rooms, then type 'done' when finished")
                            .font(.system(size: 11, weight: .medium, design: .rounded))
                            .foregroundStyle(.white.opacity(0.25))
                            .padding(.horizontal, 16)
                    }
                }
                .padding(.bottom, 4)
            }

            // Complete button
            if isComplete {
                Button("Continue to Rewards") {
                    extractedFamilyName = extracted.familyName ?? ""
                    extractedChildren = extracted.children.map { ($0.name, String($0.age)) }
                    extractedBinSchedule = extracted.binSchedule
                    extractedPets = extracted.pets
                    onComplete = true
                }
                .buttonStyle(NeonButtonStyle(color: .neonGreen))
                .padding(.horizontal, 16)
                .padding(.bottom, 4)
            }

            // Input bar
            if !isComplete {
                inputBar
            }
        }
        .sheet(isPresented: $showRoomScan) { RoomScanView() }
        .task {
            await checkSpeechAvailability()
            if sessionId == nil && messages.isEmpty {
                await startConversation()
            }
        }
    }

    // MARK: - Extracted Data Card
    private var extractedDataCard: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                if let fn = extracted.familyName {
                    extractedChip(icon: "house.fill", text: fn, color: .neonBlue)
                }
                ForEach(extracted.children, id: \.name) { child in
                    extractedChip(icon: "person.fill", text: "\(child.name), \(child.age)", color: .neonPurple)
                }
                if let bins = extracted.binSchedule, !bins.bins.isEmpty {
                    extractedChip(icon: "trash.fill", text: "\(bins.bins.count) bins", color: .neonGreen)
                }
                if let pets = extracted.pets, !pets.isEmpty {
                    ForEach(pets, id: \.name) { pet in
                        extractedChip(icon: "pawprint.fill", text: pet.name, color: .neonOrange)
                    }
                }
            }
            .padding(.horizontal, 16)
        }
        .padding(.vertical, 6)
        .background(Color.gameCard)
    }

    private func extractedChip(icon: String, text: String, color: Color) -> some View {
        HStack(spacing: 4) {
            Image(systemName: icon).font(.system(size: 10)).foregroundStyle(color)
            Text(text).font(.system(size: 11, weight: .bold, design: .rounded)).foregroundStyle(.white)
        }
        .padding(.horizontal, 8).padding(.vertical, 4)
        .background(color.opacity(0.15)).clipShape(Capsule())
    }

    // MARK: - Input Bar
    private var inputBar: some View {
        HStack(spacing: 10) {
            // Mic button
            Button {
                if isListening { stopListening() }
                else { startListening() }
            } label: {
                Image(systemName: isListening ? "mic.fill" : "mic")
                    .font(.system(size: 20))
                    .foregroundStyle(isListening ? .neonRed : speechAvailable ? .neonBlue : .white.opacity(0.15))
                    .frame(width: 40, height: 40)
                    .background(isListening ? Color.neonRed.opacity(0.15) : Color.gameCardLight)
                    .clipShape(Circle())
                    .scaleEffect(isListening ? 1.1 : 1)
                    .animation(isListening ? .easeInOut(duration: 0.8).repeatForever(autoreverses: true) : .default, value: isListening)
            }
            .disabled(!speechAvailable || isLoading)

            // Text field
            TextField("Type a message...", text: $inputText)
                .font(.system(size: 15, design: .rounded))
                .foregroundStyle(.white)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .background(Color.gameCardLight)
                .clipShape(RoundedRectangle(cornerRadius: 20))
                .onSubmit { sendMessage() }

            // Send
            Button { sendMessage() } label: {
                Image(systemName: "arrow.up.circle.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(inputText.trimmingCharacters(in: .whitespaces).isEmpty ? .white.opacity(0.2) : .neonBlue)
            }
            .disabled(inputText.trimmingCharacters(in: .whitespaces).isEmpty || isLoading)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
        .background(Color.gameCard)
    }

    // MARK: - API Calls
    private func startConversation() async {
        isLoading = true
        do {
            let res = try await APIClient.shared.voiceSetup(sessionId: nil, textInput: "")
            sessionId = res.sessionId
            messages.append(ChatMessage(role: .ai, text: res.message))
            if ttsEnabled { speakText(res.message) }
        } catch {
            messages.append(ChatMessage(role: .ai, text: "Hi! I'm your setup assistant. Tell me your family name to get started."))
        }
        isLoading = false
    }

    /// Build conversation history from local messages for context recovery
    private var conversationHistory: [[String: String]] {
        messages.map { msg in
            ["role": msg.role == .ai ? "assistant" : "user", "content": msg.text]
        }
    }

    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespaces)
        guard !text.isEmpty else { return }
        inputText = ""
        errorMessage = nil
        messages.append(ChatMessage(role: .user, text: text))
        isLoading = true

        Task {
            do {
                let res = try await APIClient.shared.voiceSetup(
                    sessionId: sessionId, textInput: text,
                    conversationHistory: conversationHistory
                )
                sessionId = res.sessionId
                extracted = res.extractedData
                messages.append(ChatMessage(role: .ai, text: res.message))
                if res.readyForRoomScan { readyForRoomScan = true }
                if res.isComplete { isComplete = true }
                if ttsEnabled { speakText(res.message) }
            } catch {
                messages.append(ChatMessage(role: .ai, text: "Sorry, I had trouble understanding. Could you try again?"))
            }
            isLoading = false
        }
    }

    // MARK: - TTS (using persistent synthesizer)
    private func speakText(_ text: String) {
        // Use system TTS (works on simulator, no API call needed)
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(language: "en-US")
        utterance.rate = 0.5
        utterance.pitchMultiplier = 1.05
        speechSynthesizer.speak(utterance)
    }

    // MARK: - Speech Recognition
    private func checkSpeechAvailability() async {
        // Check if speech recognition is available on this device
        let status = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status)
            }
        }
        speechAuthorized = (status == .authorized)

        // Check if audio input is available (not available on simulator)
        let audioSession = AVAudioSession.sharedInstance()
        let hasInput = audioSession.availableInputs?.isEmpty == false
        speechAvailable = speechAuthorized && hasInput

        if !hasInput {
            print("[MyDay] No microphone available (simulator?). Voice input disabled.")
        }
    }

    private func startListening() {
        guard speechAvailable else {
            errorMessage = "Microphone not available. Use text input instead."
            return
        }

        guard let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US")),
              recognizer.isAvailable else {
            errorMessage = "Speech recognition not available."
            return
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true

        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

            let inputNode = AVAudioEngine().inputNode
            let engine = AVAudioEngine()
            let recordingFormat = engine.inputNode.outputFormat(forBus: 0)

            // Verify format is valid
            guard recordingFormat.channelCount > 0, recordingFormat.sampleRate > 0 else {
                errorMessage = "Microphone not available. Use text input instead."
                return
            }

            engine.inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
                request.append(buffer)
            }

            let task = recognizer.recognitionTask(with: request) { result, error in
                if let result {
                    liveTranscript = result.bestTranscription.formattedString
                    if result.isFinal {
                        inputText = result.bestTranscription.formattedString
                        stopListeningCleanup(engine: engine, request: request)
                    }
                }
                if error != nil {
                    stopListeningCleanup(engine: engine, request: request)
                }
            }

            engine.prepare()
            try engine.start()
            isListening = true
            liveTranscript = ""
            errorMessage = nil

            // Auto-stop after 8 seconds
            Task {
                try? await Task.sleep(for: .seconds(8))
                if isListening {
                    stopListeningCleanup(engine: engine, request: request)
                    if !liveTranscript.isEmpty {
                        inputText = liveTranscript
                        sendMessage()
                    }
                }
            }
        } catch {
            errorMessage = "Could not start recording. Use text input instead."
            isListening = false
        }
    }

    private func stopListening() {
        isListening = false
        liveTranscript = ""
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }

    private func stopListeningCleanup(engine: AVAudioEngine, request: SFSpeechAudioBufferRecognitionRequest) {
        engine.stop()
        engine.inputNode.removeTap(onBus: 0)
        request.endAudio()
        isListening = false
        if !liveTranscript.isEmpty {
            inputText = liveTranscript
        }
        liveTranscript = ""
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}

// MARK: - Message Bubble
struct MessageBubble: View {
    let message: ChatMessage

    var body: some View {
        HStack {
            if message.role == .user { Spacer() }

            VStack(alignment: message.role == .ai ? .leading : .trailing, spacing: 4) {
                if message.role == .ai {
                    HStack(spacing: 6) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 12))
                            .foregroundStyle(.neonBlue)
                        Text("OMyDay")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(.neonBlue)
                    }
                }

                Text(message.text)
                    .font(.system(size: 15, weight: .medium, design: .rounded))
                    .foregroundStyle(.white)
                    .padding(14)
                    .background(message.role == .ai ? Color.gameCard : Color.neonBlue.opacity(0.25))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(message.role == .ai ? Color.neonBlue.opacity(0.15) : Color.neonBlue.opacity(0.3), lineWidth: 1)
                    )
            }
            .frame(maxWidth: 300, alignment: message.role == .ai ? .leading : .trailing)

            if message.role == .ai { Spacer() }
        }
    }
}

// MARK: - Typing Indicator
struct TypingIndicator: View {
    @State private var phase = 0

    var body: some View {
        HStack {
            HStack(spacing: 4) {
                ForEach(0..<3, id: \.self) { i in
                    Circle()
                        .fill(Color.neonBlue)
                        .frame(width: 7, height: 7)
                        .opacity(phase == i ? 1 : 0.3)
                }
            }
            .padding(14)
            .background(Color.gameCard)
            .clipShape(RoundedRectangle(cornerRadius: 16))
            .overlay(RoundedRectangle(cornerRadius: 16).stroke(Color.neonBlue.opacity(0.15), lineWidth: 1))
            Spacer()
        }
        .onAppear {
            Timer.scheduledTimer(withTimeInterval: 0.4, repeats: true) { _ in
                withAnimation(.easeInOut(duration: 0.3)) { phase = (phase + 1) % 3 }
            }
        }
    }
}

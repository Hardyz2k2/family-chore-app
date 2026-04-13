import Foundation
import Security
import LocalAuthentication

nonisolated(unsafe) enum KeychainHelper: Sendable {
    private static let service = "com.myfamily.myday.auth"
    private static let tokenKey = "jwt_token"
    private static let credEmailKey = "biometric_email"
    private static let credPassKey = "biometric_password"
    private static let userNameKey = "saved_user_name"

    // MARK: - JWT Token (standard, no biometric)

    static func saveToken(_ token: String) {
        let data = Data(token.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey,
        ]
        SecItemDelete(query as CFDictionary)
        var newQuery = query
        newQuery[kSecValueData as String] = data
        SecItemAdd(newQuery as CFDictionary, nil)
    }

    static func getToken() -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: tokenKey,
        ]
        SecItemDelete(query as CFDictionary)
    }

    // MARK: - Biometric Credentials

    static func saveCredentials(email: String, password: String) {
        // Save email (no biometric needed to read email, just for display)
        saveItem(key: credEmailKey, value: email, biometric: false)
        // Save password (requires biometric to read)
        saveItem(key: credPassKey, value: password, biometric: true)
    }

    static func getSavedEmail() -> String? {
        getItem(key: credEmailKey, biometric: false)
    }

    static func getSavedUserName() -> String? {
        getItem(key: userNameKey, biometric: false)
    }

    static func saveUserName(_ name: String) {
        saveItem(key: userNameKey, value: name, biometric: false)
    }

    static var hasBiometricCredentials: Bool {
        getSavedEmail() != nil
    }

    /// Load credentials using Face ID / Touch ID. Returns (email, password) or nil.
    static func loadCredentialsWithBiometric() async -> (email: String, password: String)? {
        guard let email = getSavedEmail() else { return nil }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: credPassKey,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
            kSecUseOperationPrompt as String: "Sign in to MyDay",
        ]

        return await withCheckedContinuation { continuation in
            DispatchQueue.global().async {
                var result: AnyObject?
                let status = SecItemCopyMatching(query as CFDictionary, &result)
                if status == errSecSuccess, let data = result as? Data, let password = String(data: data, encoding: .utf8) {
                    continuation.resume(returning: (email, password))
                } else {
                    continuation.resume(returning: nil)
                }
            }
        }
    }

    static func deleteCredentials() {
        deleteItem(key: credEmailKey)
        deleteItem(key: credPassKey)
        deleteItem(key: userNameKey)
    }

    // MARK: - Private Helpers

    private static func saveItem(key: String, value: String, biometric: Bool) {
        let data = Data(value.utf8)
        // Delete existing
        deleteItem(key: key)

        var query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
        ]

        if biometric {
            let access = SecAccessControlCreateWithFlags(
                nil,
                kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
                .biometryCurrentSet,
                nil
            )
            if let access {
                query[kSecAttrAccessControl as String] = access
            }
        }

        SecItemAdd(query as CFDictionary, nil)
    }

    private static func getItem(key: String, biometric: Bool) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        guard status == errSecSuccess, let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    private static func deleteItem(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
        ]
        SecItemDelete(query as CFDictionary)
    }
}

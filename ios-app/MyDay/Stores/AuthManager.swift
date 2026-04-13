import Foundation
import Observation

@Observable
class AuthManager {
    var user: ProfileResponse?
    var isAuthenticated = false
    var isLoading = true
    var error: String?

    var isParent: Bool { user?.role == "parent" }
    var isChild: Bool { user?.role == "child" }
    var userId: String? { user?.userId }
    var familyId: String? { user?.familyId }

    var hasBiometricCredentials: Bool { KeychainHelper.hasBiometricCredentials }
    var savedUserName: String? { KeychainHelper.getSavedUserName() }

    func restoreSession() async {
        guard KeychainHelper.getToken() != nil else {
            isLoading = false
            return
        }
        do {
            let profile = try await APIClient.shared.getProfile()
            user = profile
            isAuthenticated = true
        } catch {
            KeychainHelper.deleteToken()
        }
        isLoading = false
    }

    func login(email: String, password: String) async {
        error = nil
        do {
            let response = try await APIClient.shared.login(email: email, password: password)
            KeychainHelper.saveToken(response.token)
            let profile = try await APIClient.shared.getProfile()
            user = profile
            isAuthenticated = true
            // Save credentials for biometric login
            KeychainHelper.saveCredentials(email: email, password: password)
            KeychainHelper.saveUserName(profile.firstName)
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    func register(email: String, password: String, firstName: String, lastName: String, role: String = "parent") async {
        error = nil
        do {
            let response = try await APIClient.shared.register(
                email: email, password: password,
                firstName: firstName, lastName: lastName, role: role
            )
            KeychainHelper.saveToken(response.token)
            let profile = try await APIClient.shared.getProfile()
            user = profile
            isAuthenticated = true
            // Save credentials for biometric login
            KeychainHelper.saveCredentials(email: email, password: password)
            KeychainHelper.saveUserName(profile.firstName)
        } catch let err as APIError {
            error = err.errorDescription
        } catch {
            self.error = error.localizedDescription
        }
    }

    func biometricLogin() async {
        error = nil
        guard let creds = await KeychainHelper.loadCredentialsWithBiometric() else {
            error = "Biometric authentication failed"
            return
        }
        await login(email: creds.email, password: creds.password)
    }

    func logout() {
        KeychainHelper.deleteToken()
        // Keep biometric credentials so they can Face ID next time
        user = nil
        isAuthenticated = false
    }

    func fullLogout() {
        KeychainHelper.deleteToken()
        KeychainHelper.deleteCredentials()
        user = nil
        isAuthenticated = false
    }
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface OTPVerification {
    email: string;
    otpCode: string;
}
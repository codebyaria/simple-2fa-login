"use server"
import { cookies } from 'next/headers'

export async function login(email: string, password: string) {
    try {
        const cookieStore = await cookies();

        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        })

        const data = await res.json()

        if (!res.ok) {
            throw new Error(data.error || "Login failed")
        }

        if (data.requiresOtp) {
            // Store email temporarily for OTP verification
            cookieStore.set("userEmail", email, { httpOnly: true, maxAge: 600 }) // 10 minutes
            return { success: true, redirect: "/verify-otp" }
        } else {
            return { success: true, redirect: "/dashboard" }
        }

    } catch (error) {
        console.error("Login error:", error)
        return { error: "An error occurred. Please try again." }
    }
}

export async function verifyOtp(otp: string) {

    const cookieStore = await cookies();
    const userEmail = cookieStore.get('userEmail');

    if (!userEmail) {
        throw new Error("Session expired. Please login again.")
    }

    const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otp, userEmail }),
    })

    const data = await response.json()

    if (!response.ok) {
        throw new Error(data.error || "Verification failed")
    }
}
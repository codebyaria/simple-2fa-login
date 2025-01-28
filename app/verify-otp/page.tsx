import { cookies } from "next/headers"
import OTPVerificationForm from "../components/OTPVerificationForm"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export default async function VerifyOtp() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // If there's no session, redirect to login
    redirect("/login")
  }

  const userEmail = user.email

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verify OTP</h2>
          <p className="mt-2 text-center text-sm text-gray-600">Enter the OTP sent to {userEmail}</p>
        </div>
        <OTPVerificationForm email={userEmail || ''} />
      </div>
    </div>
  )
}


import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser()

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return NextResponse.json(
        { error: "Logout failed" },
        { status: 500 }
      )
    }

    console.log(user?.id);

    const { data, error: errorDelete } = await supabase.from('two_fa_sessions').delete().eq('user_id', user?.id)

    console.log(errorDelete);
    console.log(data);

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}
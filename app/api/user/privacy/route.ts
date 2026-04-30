import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { updateUserPrivacyDefaultsByEmail } from "@/lib/user-privacy";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { defaultActivityIsPublic, defaultActivityMapIsPublic } =
      await request.json();

    if (typeof defaultActivityIsPublic !== "boolean") {
      return NextResponse.json(
        { error: "defaultActivityIsPublic must be a boolean" },
        { status: 400 }
      );
    }

    if (typeof defaultActivityMapIsPublic !== "boolean") {
      return NextResponse.json(
        { error: "defaultActivityMapIsPublic must be a boolean" },
        { status: 400 }
      );
    }

    const user = await updateUserPrivacyDefaultsByEmail(session.user.email, {
      defaultActivityIsPublic,
      defaultActivityMapIsPublic,
    });

    return NextResponse.json({
      success: true,
      privacy: user,
    });
  } catch (error) {
    console.error("Error updating privacy settings:", error);
    return NextResponse.json(
      { error: "Failed to update privacy settings" },
      { status: 500 }
    );
  }
}

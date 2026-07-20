import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth/auth"
import { uploadProfilePicture } from "@/lib/cloudinary/client"
import { db } from "@/lib/db"
import { user } from "@/lib/db/auth-schema"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_SIZE = 2 * 1024 * 1024

export async function POST(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers })
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
	}

	const formData = await request.formData()
	const file = formData.get("avatar") as File | null

	if (!file) {
		return NextResponse.json({ error: "Avatar file is required" }, { status: 400 })
	}

	if (!ALLOWED_TYPES.includes(file.type)) {
		return NextResponse.json({ error: "Only JPEG, PNG, and WEBP are allowed" }, { status: 400 })
	}

	if (file.size > MAX_SIZE) {
		return NextResponse.json({ error: "File size must be 2MB or less" }, { status: 400 })
	}

	const bytes = await file.arrayBuffer()
	const buffer = Buffer.from(bytes)

	const existingUser = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { id: true, imagePublicId: true },
	})

	if (!existingUser) {
		return NextResponse.json({ error: "User not found" }, { status: 404 })
	}

	const upload = await uploadProfilePicture(
		buffer,
		existingUser.id,
		existingUser.imagePublicId || undefined,
	)

	await db
		.update(user)
		.set({
			image: upload.url,
			imagePublicId: upload.publicId,
			avatarUpdatedAt: new Date(),
			updatedAt: new Date(),
		})
		.where(eq(user.id, existingUser.id))

	return NextResponse.json({ success: true, url: upload.url, publicId: upload.publicId })
}

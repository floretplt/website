import { NextResponse } from "next/server";
import { getUser, isAllowedAdminEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_IMAGE_TYPES = /^image\/(jpeg|png|gif|webp)$/i;

/** Strip path segments and unsafe chars; prevents overwriting paths outside `products/`. */
function safeProductImageFilename(raw: unknown): string {
  const s = String(raw ?? "").replace(/\0/g, "");
  const base = s.replace(/^.*[/\\]/, "");
  if (!base || base.includes("..")) {
    return `upload-${Date.now()}.jpg`;
  }
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "");
  return (cleaned || `upload-${Date.now()}`).slice(0, 200);
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user || !isAllowedAdminEmail(user.email ?? undefined)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const type = file.type || "";
  if (!ALLOWED_IMAGE_TYPES.test(type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, or WebP images are allowed" },
      { status: 400 },
    );
  }

  const name = safeProductImageFilename(formData.get("filename"));
  const admin = createAdminClient();
  const path = `products/${name}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from("products").upload(path, buf, {
    contentType: file.type || "image/jpeg",
    upsert: true,
  });

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path });
}

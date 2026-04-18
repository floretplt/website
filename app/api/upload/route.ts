import { NextResponse } from "next/server";
import { getUser, isAllowedAdminEmail } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const name = String(formData.get("filename") ?? `upload-${Date.now()}.jpg`);
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

import { handleInquiry } from "@/lib/inquiry-handler";

export async function POST(req: Request) {
  return handleInquiry(req, "wedding");
}

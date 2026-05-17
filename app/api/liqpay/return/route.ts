import { NextResponse } from "next/server";

function siteBase(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
}

function redirectToResult(data: string, signature: string) {
  const url = new URL(`${siteBase()}/order/liqpay/result`);
  url.searchParams.set("data", data);
  url.searchParams.set("signature", signature);
  return NextResponse.redirect(url, 303);
}

async function readLiqPayReturn(
  req: Request,
): Promise<{ data: string; signature: string } | null> {
  if (req.method === "POST") {
    const form = await req.formData();
    const data = form.get("data");
    const signature = form.get("signature");
    if (typeof data === "string" && typeof signature === "string") {
      return { data, signature };
    }
    return null;
  }

  const url = new URL(req.url);
  const data = url.searchParams.get("data");
  const signature = url.searchParams.get("signature");
  if (data && signature) return { data, signature };
  return null;
}

async function handleReturn(req: Request) {
  const pair = await readLiqPayReturn(req);
  if (!pair) {
    const url = new URL(`${siteBase()}/order/liqpay/result`);
    url.searchParams.set("pending", "1");
    return NextResponse.redirect(url, 303);
  }

  return redirectToResult(pair.data, pair.signature);
}

export async function POST(req: Request) {
  return handleReturn(req);
}

export async function GET(req: Request) {
  return handleReturn(req);
}

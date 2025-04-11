import { handlers as getHandlers } from "@/auth";
export const runtime = "nodejs";

let cachedHandlers: any = null;

async function getHandler() {
  if (!cachedHandlers) {
    cachedHandlers = await getHandlers();
  }
  return cachedHandlers;
}

export async function GET(request: any) {
  const { GET } = await getHandler();
  return GET(request);
}

export async function POST(request: any) {
  const { POST } = await getHandler();
  return POST(request);
}

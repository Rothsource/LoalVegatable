import { NextRequest } from "next/server";
import { POST as handleAccept } from "../route";

export async function POST(request: NextRequest) {
  return handleAccept(request);
}

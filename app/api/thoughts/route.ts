import { getThoughts } from "@/lib/thoughts";

export async function GET() {
  return Response.json(await getThoughts());
}

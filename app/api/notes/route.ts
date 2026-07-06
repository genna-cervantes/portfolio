import { getNotes } from "@/lib/notes";

export async function GET() {
  return Response.json(await getNotes());
}

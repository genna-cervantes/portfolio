import { promises as fs } from "fs";
import path from "path";

export const runtime = "nodejs";

type Booking = {
  start: string;
  createdAt: string;
  status?: "pending" | "confirmed";
  expiresAt?: string;
};

const BOOKINGS_FILE = path.join(process.cwd(), "data", "bookings.json");
const PENDING_TTL_MS = 15 * 60 * 1000;

function isActiveBooking(booking: Booking, now = new Date()) {
  if (booking.status === "confirmed") return true;
  if (booking.status === "pending" || !booking.status) {
    if (!booking.expiresAt) return true;
    return new Date(booking.expiresAt) > now;
  }

  return false;
}

async function readBookings(): Promise<Booking[]> {
  try {
    const raw = await fs.readFile(BOOKINGS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

async function writeBookings(bookings: Booking[]) {
  await fs.mkdir(path.dirname(BOOKINGS_FILE), { recursive: true });
  await fs.writeFile(BOOKINGS_FILE, `${JSON.stringify(bookings, null, 2)}\n`);
}

export async function GET() {
  const bookings = await readBookings();
  return Response.json({ bookings: bookings.filter((booking) => isActiveBooking(booking)) });
}

export async function POST(req: Request) {
  let start = "";

  try {
    const body = await req.json();
    start = typeof body?.start === "string" ? body.start : "";
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = new Date(start);
  if (!start || Number.isNaN(parsed.getTime())) {
    return Response.json({ error: "Invalid booking start time." }, { status: 400 });
  }

  const normalizedStart = parsed.toISOString();
  const now = new Date();
  const bookings = await readBookings();
  const activeBookings = bookings.filter((booking) => isActiveBooking(booking, now));
  const exists = activeBookings.some((booking) => booking.start === normalizedStart);

  if (exists) {
    return Response.json(
      { error: "That slot was already booked. Please pick another time." },
      { status: 409 }
    );
  }

  activeBookings.push({
    start: normalizedStart,
    createdAt: now.toISOString(),
    status: "pending",
    expiresAt: new Date(now.getTime() + PENDING_TTL_MS).toISOString(),
  });

  await writeBookings(activeBookings);

  return Response.json({ ok: true });
}

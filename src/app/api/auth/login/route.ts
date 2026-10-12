import { NextResponse } from "next/server";
import { createPool } from "mysql2/promise";
import { signToken, verifyPassword } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LoginBody {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  let body: LoginBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }

  const pool = createPool({ uri: connectionString, connectionLimit: 2 });

  try {
    const [rows] = await pool.execute(
      "SELECT id, email, password_hash, name, role FROM users WHERE email = ? LIMIT 1",
      [email],
    );
    const users = rows as Array<{
      id: number;
      email: string;
      password_hash: string;
      name: string;
      role: "admin" | "user";
    }>;

    if (users.length === 0) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const user = users[0];
    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  } finally {
    await pool.end();
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FileStore } from "@/lib/data/file-store";
import bcrypt from "bcryptjs";
import type { StaffList, User, SessionUser } from "@/types/auth";

const store = new FileStore();

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = session.user as SessionUser;
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const staffData = await store.getConfig<StaffList>("staff/users.json");
  if (!staffData) return NextResponse.json([]);

  // Return users without passwordHash
  const safeUsers = staffData.users.map((u) => ({
    id: u.id,
    username: u.username,
    name: u.name,
    role: u.role,
    active: u.active,
    createdAt: u.createdAt,
  }));
  return NextResponse.json(safeUsers);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = session.user as SessionUser;
  if (currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { username, name, role, password } = body as {
    username: string;
    name: string;
    role: string;
    password: string;
  };

  if (!username || !name || !role || !password) {
    return NextResponse.json({ error: "All fields are required" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const validRoles = ["admin", "manager", "receptionist"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const staffData = await store.getConfig<StaffList>("staff/users.json") ?? { users: [] };

  // Check for duplicate username
  if (staffData.users.some((u) => u.username === username)) {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }

  // Generate next user ID
  const existingNums = staffData.users
    .map((u) => parseInt(u.id.replace("USR-", ""), 10))
    .filter((n) => !isNaN(n));
  const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
  const id = `USR-${String(nextNum).padStart(3, "0")}`;

  const passwordHash = await bcrypt.hash(password, 10);

  const newUser: User = {
    id,
    username,
    name,
    role: role as User["role"],
    passwordHash,
    active: true,
    createdAt: new Date().toISOString(),
  };

  staffData.users.push(newUser);
  await store.putConfig("staff/users.json", staffData);

  const safeUser = {
    id: newUser.id,
    username: newUser.username,
    name: newUser.name,
    role: newUser.role,
    active: newUser.active,
    createdAt: newUser.createdAt,
  };
  return NextResponse.json({ success: true, user: safeUser }, { status: 201 });
}

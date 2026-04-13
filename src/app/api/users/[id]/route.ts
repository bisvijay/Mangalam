import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { FileStore } from "@/lib/data/file-store";
import bcrypt from "bcryptjs";
import type { StaffList, User, SessionUser } from "@/types/auth";

const store = new FileStore();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = session.user as SessionUser;
  if (currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const { username, name, role, password, active } = body as {
    username?: string;
    name?: string;
    role?: string;
    password?: string;
    active?: boolean;
  };

  const staffData = await store.getConfig<StaffList>("staff/users.json");
  if (!staffData) return NextResponse.json({ error: "Users not found" }, { status: 404 });

  const userIdx = staffData.users.findIndex((u) => u.id === id);
  if (userIdx === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existingUser = staffData.users[userIdx];

  // Check username uniqueness if changed
  if (username && username !== existingUser.username) {
    if (staffData.users.some((u) => u.username === username && u.id !== id)) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    existingUser.username = username;
  }

  if (name) existingUser.name = name;
  if (role) {
    const validRoles = ["admin", "manager", "receptionist"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    existingUser.role = role as User["role"];
  }
  if (typeof active === "boolean") existingUser.active = active;
  if (password) {
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    existingUser.passwordHash = await bcrypt.hash(password, 10);
  }

  staffData.users[userIdx] = existingUser;
  await store.putConfig("staff/users.json", staffData);

  const safeUser = {
    id: existingUser.id,
    username: existingUser.username,
    name: existingUser.name,
    role: existingUser.role,
    active: existingUser.active,
    createdAt: existingUser.createdAt,
  };
  return NextResponse.json({ success: true, user: safeUser });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const currentUser = session.user as SessionUser;
  if (currentUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  // Prevent deleting self
  if (currentUser.id === id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const staffData = await store.getConfig<StaffList>("staff/users.json");
  if (!staffData) return NextResponse.json({ error: "Users not found" }, { status: 404 });

  const userIdx = staffData.users.findIndex((u) => u.id === id);
  if (userIdx === -1) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  staffData.users.splice(userIdx, 1);
  await store.putConfig("staff/users.json", staffData);

  return NextResponse.json({ success: true });
}

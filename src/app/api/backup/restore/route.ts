import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

interface BackupData {
  createdAt: string;
  version: string;
  data: Record<string, unknown>;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user has admin role
  const user = session.user as { role?: string };
  if (user.role !== "admin" && user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
  }

  try {
    const backup: BackupData = await request.json();

    // Validate backup structure
    if (!backup.data || typeof backup.data !== "object") {
      return NextResponse.json({ error: "Invalid backup format - missing data" }, { status: 400 });
    }

    if (!backup.version) {
      return NextResponse.json({ error: "Invalid backup format - missing version" }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), "data");
    let restoredCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Restore each file from the backup
    for (const [relativePath, content] of Object.entries(backup.data)) {
      try {
        // Security check: prevent path traversal
        const normalizedPath = path.normalize(relativePath);
        if (normalizedPath.startsWith("..") || path.isAbsolute(normalizedPath)) {
          errors.push(`Skipped unsafe path: ${relativePath}`);
          errorCount++;
          continue;
        }

        // Only allow JSON files
        if (!relativePath.endsWith(".json")) {
          errors.push(`Skipped non-JSON file: ${relativePath}`);
          errorCount++;
          continue;
        }

        const fullPath = path.join(dataDir, normalizedPath);
        const dir = path.dirname(fullPath);

        // Create directory if it doesn't exist
        await fs.mkdir(dir, { recursive: true });

        // Write the file
        await fs.writeFile(fullPath, JSON.stringify(content, null, 2), "utf-8");
        restoredCount++;
      } catch (err) {
        errors.push(`Failed to restore ${relativePath}: ${err instanceof Error ? err.message : "Unknown error"}`);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Restored ${restoredCount} files${errorCount > 0 ? `, ${errorCount} failed` : ""}`,
      restoredCount,
      errorCount,
      errors: errors.length > 0 ? errors : undefined,
      backupDate: backup.createdAt,
    });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ 
      error: "Failed to restore backup", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}

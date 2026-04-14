import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

interface BackupData {
  createdAt: string;
  version: string;
  data: Record<string, Record<string, unknown>>;
}

async function getAllJsonFiles(dir: string, basePath: string = ""): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;
      
      if (entry.isDirectory()) {
        // Recursively get files from subdirectories
        const subDirData = await getAllJsonFiles(fullPath, relativePath);
        Object.assign(result, subDirData);
      } else if (entry.name.endsWith(".json")) {
        try {
          const content = await fs.readFile(fullPath, "utf-8");
          result[relativePath] = JSON.parse(content);
        } catch {
          // Skip files that can't be read or parsed
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }
  
  return result;
}

export async function GET() {
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
    const dataDir = path.join(process.cwd(), "data");
    const allData = await getAllJsonFiles(dataDir);

    const backup: BackupData = {
      createdAt: new Date().toISOString(),
      version: "1.0",
      data: allData as Record<string, Record<string, unknown>>,
    };

    const jsonString = JSON.stringify(backup, null, 2);
    const buffer = Buffer.from(jsonString, "utf-8");

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `mangalam-backup-${timestamp}.json`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "Failed to create backup" }, { status: 500 });
  }
}

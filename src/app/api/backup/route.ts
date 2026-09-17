import { NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth';

const API_BASE_URL = 
  process.env.FASTAPI_INTERNAL_URL ||
  process.env.API_URL ||
  "http://127.0.0.1:8000";

export async function GET() {
  try {
    const session = await getAuthSession();
    const token = (session as any)?.accessToken;

    const res = await fetch(`${API_BASE_URL}/api/v1/settings/backup`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: "Failed to generate backup: " + err }, { status: res.status });
    }

    const blob = await res.arrayBuffer();
    const contentDisposition = res.headers.get("content-disposition") || 'attachment; filename="foundation-backup.zip"';

    return new NextResponse(blob, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": contentDisposition,
      },
    });
  } catch (error) {
    console.error("Backup Error:", error);
    return NextResponse.json({ error: "Failed to generate backup" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    const token = (session as any)?.accessToken;

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const backendFormData = new FormData();
    backendFormData.append("file", file);

    const res = await fetch(`${API_BASE_URL}/api/v1/settings/restore`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: backendFormData
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: data?.detail || data?.message || "Failed to restore backup" }, { status: res.status });
    }

    return NextResponse.json({ success: true, message: "Database restored successfully" });
  } catch (error) {
    console.error("Restore Error:", error);
    return NextResponse.json({ error: "Failed to restore backup" }, { status: 500 });
  }
}

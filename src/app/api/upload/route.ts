import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ status: false, message: "File tidak ditemukan." }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ status: false, message: "Format file tidak didukung. Gunakan JPG, PNG, atau WebP." }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ status: false, message: "Ukuran file maksimal 5MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const folder = (formData.get("folder") as string) || "general";

    // Generate unique filename
    const ext = path.extname(file.name) || ".jpg";
    const uniqueName = `${folder}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    // Save file
    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    return NextResponse.json({
      status: true,
      message: "File berhasil diupload.",
      data: { fileName: uniqueName, url: `/uploads/${folder}/${uniqueName}` }
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ status: false, message: "Gagal mengupload file." }, { status: 500 });
  }
}

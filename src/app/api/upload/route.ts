import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

function extFor(type: string): string {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Seleccione un archivo de imagen" },
        { status: 400 }
      );
    }

    if (!ALLOWED.has(file.type)) {
      return NextResponse.json(
        { error: "Formato no permitido. Use JPG, PNG, WEBP o GIF." },
        { status: 400 }
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "La imagen supera 5 MB" },
        { status: 400 }
      );
    }

    const folder = path.join(process.cwd(), "public", "images", "uploads");
    await fs.mkdir(folder, { recursive: true });

    const name = `${Date.now()}-${randomBytes(4).toString("hex")}.${extFor(file.type)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(folder, name), buffer);

    const url = `/images/uploads/${name}`;
    return NextResponse.json({ url, name }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "No se pudo subir la imagen" },
      { status: 500 }
    );
  }
}

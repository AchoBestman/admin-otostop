export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/auth/middleware";
import { uploadToR2 } from "@/lib/r2/client";
import { success, error, rateLimitError } from "@/lib/utils/response";
import { checkRateLimit, getClientIP } from "@/lib/rate-limiting";
import type { JWTPayload } from "@/types";
import { randomUUID } from "crypto";

export const POST = withAuth(async (request: NextRequest, _context, auth: JWTPayload) => {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(ip, "upload");
    if (!rl.allowed) {
      return rateLimitError(rl.resetAt);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return error("No file provided", 400);
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      return error("File size exceeds 5MB limit", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const extension = file.name.split(".").pop();
    const key = `${randomUUID()}.${extension}`;
    const contentType = file.type || "application/octet-stream";

    await uploadToR2(key, buffer, contentType);

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return success({
      url: publicUrl,
      key: key,
    }, "File uploaded successfully");

  } catch (err: unknown) {
    console.error("Upload error:", err);
    return error("Failed to upload file", 500);
  }
});

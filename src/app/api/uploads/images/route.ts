import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminUser } from "@/modules/auth/server/auth-guards";
import { IMAGE_UPLOAD_ACCEPTED_TYPES, IMAGE_UPLOAD_MAX_SIZE_BYTES, IMAGE_UPLOAD_MAX_SIZE_MB } from "@/modules/media/config/image-upload";
import { type MediaPurpose, uploadImageToCloudinary } from "@/modules/media/server/cloudinary-images";
function parsePurpose(value: FormDataEntryValue | null): MediaPurpose | null { return value === "BLOG" || value === "CALENDAR" ? value : null; }
export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return NextResponse.json({ok:false,error:"Forbidden"},{status:403});
  const data = await request.formData(); const file = data.get("file"); const purpose = parsePurpose(data.get("purpose"));
  if (!(file instanceof File) || !purpose) return NextResponse.json({ok:false,error:"Archivo inválido"},{status:400});
  if (!IMAGE_UPLOAD_ACCEPTED_TYPES.includes(file.type as never)) return NextResponse.json({ok:false,error:"Formato de imagen no permitido"},{status:400});
  if (file.size > IMAGE_UPLOAD_MAX_SIZE_BYTES) return NextResponse.json({ok:false,error:`La imagen supera el límite de ${IMAGE_UPLOAD_MAX_SIZE_MB} MB`},{status:400});
  try { const uploaded = await uploadImageToCloudinary(Buffer.from(await file.arrayBuffer()), purpose); const asset = await prisma.mediaAsset.create({data:{...uploaded,purpose,uploadedById:user.id},select:{url:true,publicId:true}}); return NextResponse.json({ok:true,...asset}); }
  catch(error) { console.error("[media-upload] Upload failed",error); return NextResponse.json({ok:false,error:"No pudimos subir la imagen"},{status:500}); }
}
import "server-only";
import { DocumentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
export function listDocuments() { return prisma.document.findMany({ orderBy: [{ updatedAt: "desc" }], include: { uploadedBy: { select: { name: true, email: true } } } }); }
export function getPublishedDocumentBySlug(slug: string) { return prisma.document.findFirst({ where: { slug, status: DocumentStatus.PUBLISHED }, select: { cloudinaryPublicId: true, originalFileName: true, mimeType: true } }); }

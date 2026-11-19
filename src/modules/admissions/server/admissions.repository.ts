import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { AdmissionSave } from "../submission";

export const saveAdmission: AdmissionSave = async (key, fingerprint, payload) => {
  try {
    await prisma.admissionInquiry.create({ data: {
      idempotencyKey: key, fingerprint, questionnaireVersion: payload.questionnaireVersion,
      guardianNames: String(payload.answers.guardianNames), childName: String(payload.answers.childName),
      email: String(payload.answers.email), phone: String(payload.answers.phone),
      answers: payload.answers as Prisma.InputJsonObject,
    } });
    return true;
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") throw error;
    // A concurrent winner may have committed the same send. Never update it.
    const existing = await prisma.admissionInquiry.findUnique({ where: { idempotencyKey: key }, select: { fingerprint: true } });
    return existing?.fingerprint === fingerprint;
  }
};

import "server-only";

import { prisma } from "@/lib/prisma";
import type { PsychopedagogyProfileDTO, PsychopedagogyProfilePayload } from "@/modules/psychopedagogy/lib/profile-contract";
import { listStudentPsychopedagogyEntriesForSuperadmin } from "@/modules/psychopedagogy/server/psychopedagogy.repository";

const orderBy = [{ entryDate: "desc" }, { createdAt: "desc" }, { id: "desc" }] as const;
const entrySelect = { id: true, entryDate: true, title: true, body: true } as const;

function datedDTO<T extends { entryDate: Date }>(entry: T): Omit<T, "entryDate"> & { entryDate: string } {
  return { ...entry, entryDate: entry.entryDate.toISOString() };
}

export async function getPsychopedagogyProfile(studentId: string): Promise<PsychopedagogyProfileDTO> {
  const [learning, observations, accompaniments, interventions, instruments] = await Promise.all([
    prisma.psychopedagogyLearningProfile.findUnique({ where: { studentId }, select: { description: true } }),
    // These are the original observation records, including inactive authors' history.
    listStudentPsychopedagogyEntriesForSuperadmin(studentId),
    prisma.psychopedagogyAccompaniment.findMany({
      where: { studentId }, orderBy: [...orderBy], select: { ...entrySelect, kind: true },
    }),
    prisma.psychopedagogyIntervention.findMany({
      where: { studentId }, orderBy: [...orderBy],
      select: {
        id: true, entryDate: true, title: true, observationAnalysis: true,
        strategyFeedback: true, workPlan: true, implementation: true, evaluationResults: true,
      },
    }),
    prisma.psychopedagogyInstrument.findMany({
      where: { studentId }, orderBy: [...orderBy], select: { id: true, entryDate: true, kind: true, name: true, body: true },
    }),
  ]);
  return {
    learningStyleAndTemperament: learning?.description ?? "",
    observations: observations.map(datedDTO),
    accompaniments: accompaniments.map(datedDTO),
    interventions: interventions.map(datedDTO),
    instruments: instruments.map((entry) => ({ ...datedDTO(entry), kind: entry.kind ?? null })),
  };
}

export async function savePsychopedagogyProfileSection(studentId: string, teacherId: string | null, payload: PsychopedagogyProfilePayload, userId: string | null = null) {
  if (payload.section === "learning") {
    if (!teacherId && !userId) throw new Error("Missing learning profile author");
    const data = { description: payload.description, updatedById: teacherId, updatedByUserId: userId };
    return prisma.psychopedagogyLearningProfile.upsert({
      where: { studentId }, create: { studentId, ...data }, update: data, select: { id: true },
    });
  }
  if (payload.section === "accompaniment") {
    if (!teacherId && !userId) throw new Error("Missing accompaniment author");
    return prisma.psychopedagogyAccompaniment.create({
      data: {
        studentId, teacherId, ...(userId ? { authorUserId: userId } : {}),
        entryDate: new Date(`${payload.date}T00:00:00.000Z`),
        kind: payload.kind, title: payload.title, body: payload.body,
      }, select: { id: true },
    });
  }
  // Narrow each discriminant before persistence; never forward request objects or ownership.
  if (payload.section === "intervention") {
    if (!teacherId && !userId) throw new Error("Missing intervention author");
    return prisma.psychopedagogyIntervention.create({
      data: {
        studentId, teacherId, ...(userId ? { authorUserId: userId } : {}),
        entryDate: new Date(`${payload.date}T00:00:00.000Z`),
        title: payload.title, observationAnalysis: payload.observationAnalysis,
        strategyFeedback: payload.strategyFeedback, workPlan: payload.workPlan,
        implementation: payload.implementation, evaluationResults: payload.evaluationResults,
      }, select: { id: true },
    });
  }
  if (!teacherId && !userId) throw new Error("Missing instrument author");
  return prisma.psychopedagogyInstrument.create({
    data: {
      studentId, teacherId, ...(userId ? { authorUserId: userId } : {}),
      entryDate: new Date(`${payload.date}T00:00:00.000Z`),
      kind: payload.kind ?? null, name: payload.name, body: payload.body,
    }, select: { id: true },
  });
}

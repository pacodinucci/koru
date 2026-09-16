import "server-only";

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { canAccessFamilyStudent } from "@/modules/families/lib/family-student-access-policy";
import type {
  FamilyStudentAddressInput,
  FamilyStudentCompletionInput,
  FamilyStudentIdentityInput,
  FamilyStudentMedicalInput,
  FamilyStudentResponsibleInput,
  FamilyResponsibleUpdateInput,
} from "@/modules/family-dashboard/schemas/family-student-record.schema";

type FamilyUser = { id: string; name: string; email: string; familyId: string | null };

function requireFamilyId(user: Pick<FamilyUser, "familyId">) {
  if (!user.familyId) throw new Error("family_not_assigned");
  return user.familyId;
}

function parseBirthDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime()) || date > new Date()) throw new Error("invalid_birth_date");
  return date;
}

function normalizeIdentityPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleUpperCase("es-AR")
    .replace(/[^A-Z0-9]/g, "");
}

function buildStudentIdentity(input: FamilyStudentIdentityInput, birthDate: Date) {
  const documentNumber = normalizeIdentityPart(input.documentNumber);
  if (documentNumber) {
    const documentType = normalizeIdentityPart(input.documentType) || "DOCUMENT";
    return {
      documentType,
      documentNumber,
      identityKey: `document:${documentType}:${documentNumber}`,
    };
  }

  return {
    documentType: null,
    documentNumber: null,
    identityKey: [
      "personal",
      normalizeIdentityPart(input.firstName),
      normalizeIdentityPart(input.lastName),
      birthDate.toISOString().slice(0, 10),
    ].join(":"),
  };
}

function mapStudentIdentityConflict(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new Error("student_identity_conflict");
  }
  throw error;
}
async function requireOwnedStudent(studentId: string, familyId: string) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, familyId: true },
  });
  if (!student || !canAccessFamilyStudent({ studentFamilyId: student.familyId, userFamilyId: familyId })) {
    throw new Error("student_not_found");
  }
  return student;
}

export async function listFamilyStudentRecords(familyId: string) {
  return prisma.student.findMany({
    where: { familyId },
    orderBy: [{ createdAt: "asc" }],
    include: {
      group: { select: { id: true, name: true, ageRange: true } },
      address: true,
      medicalProfile: true,
      responsibles: { orderBy: { priority: "asc" } },
      guardians: { orderBy: { isPrimary: "desc" } },
    },
  });
}

export async function saveFamilyStudentIdentity(input: FamilyStudentIdentityInput, user: FamilyUser) {
  const familyId = requireFamilyId(user);
  const birthDate = parseBirthDate(input.birthDate);
  const identity = buildStudentIdentity(input, birthDate);
  const data = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    ...identity,
    birthDate,
    groupId: input.groupId,
    recordStep: 2,
  };
  const group = await prisma.studentGroup.findFirst({
    where: { id: input.groupId, isActive: true },
    select: { id: true },
  });
  if (!group) throw new Error("group_not_found");

  try {
    if (input.studentId) {
      await requireOwnedStudent(input.studentId, familyId);
      return await prisma.student.update({ where: { id: input.studentId }, data });
    }

    return await prisma.student.create({
      data: {
        ...data,
        familyId,
        guardians: {
          create: {
            userId: user.id,
            email: user.email.trim().toLowerCase(),
            fullName: user.name,
            relationship: "GUARDIAN",
            isPrimary: true,
            canPickup: true,
            emergencyContact: true,
          },
        },
      },
    });
  } catch (error) {
    mapStudentIdentityConflict(error);
  }
}
export async function saveFamilyStudentAddress(input: FamilyStudentAddressInput, user: FamilyUser) {
  await requireOwnedStudent(input.studentId, requireFamilyId(user));
  const { studentId, ...data } = input;
  return prisma.$transaction(async (tx) => {
    const address = await tx.studentAddress.upsert({ where: { studentId }, create: { studentId, ...data }, update: data });
    await tx.student.update({ where: { id: studentId }, data: { recordStep: 3 } });
    return address;
  });
}

export async function saveFamilyStudentMedical(input: FamilyStudentMedicalInput, user: FamilyUser) {
  await requireOwnedStudent(input.studentId, requireFamilyId(user));
  const { studentId, ...values } = input;
  const data = { ...values, bloodType: values.bloodType || null, knownAllergies: values.knownAllergies || null, medicalConditions: values.medicalConditions || null, regularMedications: values.regularMedications || null, insuranceProviderAndPolicy: values.hasHealthInsurance ? values.insuranceProviderAndPolicy || null : null };
  return prisma.$transaction(async (tx) => {
    const medicalProfile = await tx.studentMedicalProfile.upsert({ where: { studentId }, create: { studentId, ...data }, update: data });
    await tx.student.update({ where: { id: studentId }, data: { recordStep: 4 } });
    return medicalProfile;
  });
}

export async function completeFamilyStudentRecord(input: FamilyStudentCompletionInput, user: FamilyUser) {
  await requireOwnedStudent(input.studentId, requireFamilyId(user));
  return prisma.student.update({ where: { id: input.studentId }, data: { recordStatus: "SUBMITTED", recordCompletedAt: new Date() } });
}

export async function createFamilyStudentResponsible(input: FamilyStudentResponsibleInput, user: FamilyUser) {
  const familyId = requireFamilyId(user);
  const students = await prisma.student.findMany({ where: { familyId }, select: { id: true } });
  if (!students.length) throw new Error("student_not_found");
  return prisma.studentResponsible.createMany({
    data: students.map((student) => ({
      studentId: student.id,
      fullName: input.fullName,
      relationship: input.relationship,
      phone: input.phone,
      canPickup: input.canPickup,
      emergencyContact: input.emergencyContact,
    })),
  });
}
export async function updateFamilyResponsible(input: FamilyResponsibleUpdateInput, user: FamilyUser) {
  const familyId = requireFamilyId(user);
  const data = { fullName: input.fullName.trim(), relationship: input.relationship.trim(), phone: input.phone.trim(), canPickup: input.canPickup, emergencyContact: input.emergencyContact };
  if (input.id.startsWith("guardian-")) {
    const guardianId = input.id.slice("guardian-".length);
    const guardian = await prisma.studentGuardian.findUnique({ where: { id: guardianId }, select: { studentId: true } });
    if (!guardian) throw new Error("responsible_not_found");
    await requireOwnedStudent(guardian.studentId, familyId);
    return prisma.studentGuardian.update({ where: { id: guardianId }, data: { ...data, relationship: input.relationship as never } });
  }
  const responsible = await prisma.studentResponsible.findUnique({ where: { id: input.id }, select: { studentId: true } });
  if (!responsible) throw new Error("responsible_not_found");
  await requireOwnedStudent(responsible.studentId, familyId);
  return prisma.studentResponsible.update({ where: { id: input.id }, data });
}

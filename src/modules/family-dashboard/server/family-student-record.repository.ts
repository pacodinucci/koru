import "server-only";

import { prisma } from "@/lib/prisma";
import { canAccessFamilyStudent } from "@/modules/families/lib/family-student-access-policy";
import type {
  FamilyStudentAddressInput,
  FamilyStudentContactsInput,
  FamilyStudentIdentityInput,
  FamilyStudentMedicalInput,
  FamilyStudentResponsibleInput,
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
  const data = {
    firstName: input.firstName,
    lastName: input.lastName,
    documentType: input.documentType.toUpperCase(),
    documentNumber: input.documentNumber.toUpperCase(),
    birthDate: parseBirthDate(input.birthDate),
    groupId: input.groupId,
    recordStep: 2,
  };
  const group = await prisma.studentGroup.findFirst({ where: { id: input.groupId, isActive: true }, select: { id: true } });
  if (!group) throw new Error("group_not_found");

  if (input.studentId) {
    await requireOwnedStudent(input.studentId, familyId);
    return prisma.student.update({ where: { id: input.studentId }, data });
  }

  return prisma.student.create({
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
          emergencyContact: true,
        },
      },
    },
  });
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

export async function completeFamilyStudentRecord(input: FamilyStudentContactsInput, user: FamilyUser) {
  await requireOwnedStudent(input.studentId, requireFamilyId(user));
  return prisma.$transaction(async (tx) => {
    await tx.studentGuardian.updateMany({ where: { studentId: input.studentId, userId: user.id }, data: { email: user.email.trim().toLowerCase(), fullName: input.primaryContact.fullName, phone: input.primaryContact.phone, relationship: input.primaryContact.relationship, isPrimary: true, emergencyContact: true } });
    return tx.student.update({ where: { id: input.studentId }, data: { recordStatus: "SUBMITTED", recordCompletedAt: new Date() } });
  });
}

export async function createFamilyStudentResponsible(input: FamilyStudentResponsibleInput, user: FamilyUser) {
  await requireOwnedStudent(input.studentId, requireFamilyId(user));
  const currentPriority = await prisma.studentResponsible.aggregate({ where: { studentId: input.studentId }, _max: { priority: true } });
  return prisma.studentResponsible.create({ data: { ...input, priority: (currentPriority._max.priority ?? 0) + 1 } });
}
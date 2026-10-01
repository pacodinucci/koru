type FamilyUser = {
  id: string;
  name: string | null;
  email: string;
};

type FamilyGuardian = {
  id: string;
  userId: string | null;
  email: string;
  fullName: string | null;
  phone: string | null;
  relationship: string;
  canPickup: boolean;
  emergencyContact: boolean;
  user?: { id: string; name: string } | null;
};

type FamilyStudentResponsible = {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  canPickup: boolean;
  emergencyContact: boolean;
};

type FamilyStudent = {
  firstName: string;
  lastName: string;
  guardians: FamilyGuardian[];
  responsibles: FamilyStudentResponsible[];
};

export type FamilyResponsibleItem = {
  id: string;
  studentNames: string[];
  fullName: string;
  relationship: string;
  phone: string;
  canPickup: boolean;
  emergencyContact: boolean;
  hasUser: boolean;
  isCurrentUser: boolean;
  editable: boolean;
  deletable: boolean;
  deleteIds: string[];
  source: "family-user" | "guardian" | "responsible";
};

function guardianKey(guardian: Pick<FamilyGuardian, "userId" | "email">) {
  return guardian.userId
    ? `user:${guardian.userId}`
    : `email:${guardian.email.trim().toLocaleLowerCase("en-US")}`;
}

export function buildFamilyResponsibles(
  users: FamilyUser[],
  students: FamilyStudent[],
  currentUserId?: string,
): FamilyResponsibleItem[] {
  const studentNames = students.map((student) => `${student.firstName} ${student.lastName}`);
  const responsibleByIdentity = new Map<string, FamilyResponsibleItem>();

  for (const user of users) {
    const item: FamilyResponsibleItem = {
      id: `family-user-${user.id}`,
      studentNames,
      fullName: user.name || user.email,
      relationship: "GUARDIAN",
      phone: "Sin teléfono",
      canPickup: false,
      emergencyContact: false,
      hasUser: true,
      isCurrentUser: user.id === currentUserId,
      editable: false,
      deletable: false,
      deleteIds: [],
      source: "family-user",
    };
    responsibleByIdentity.set(`user:${user.id}`, item);
    responsibleByIdentity.set(`email:${user.email.trim().toLocaleLowerCase("en-US")}`, item);
  }

  const additionalResponsibles: FamilyResponsibleItem[] = [];

  for (const student of students) {
    const studentName = `${student.firstName} ${student.lastName}`;

    for (const guardian of student.guardians) {
      const key = guardianKey(guardian);
      const existing = responsibleByIdentity.get(key);

      if (existing) {
        if (!existing.studentNames.includes(studentName)) existing.studentNames.push(studentName);
        existing.relationship = guardian.relationship;
        existing.phone = guardian.phone || (guardian.userId ? existing.phone : "Sin teléfono");
        existing.canPickup ||= guardian.canPickup;
        existing.emergencyContact ||= guardian.emergencyContact;
        existing.id = existing.editable ? existing.id : `guardian-${guardian.id}`;
        existing.editable = true;
        existing.hasUser ||= Boolean(guardian.userId);
        existing.deletable = !existing.hasUser;
        if (!existing.deleteIds.includes(guardian.id)) existing.deleteIds.push(guardian.id);
        existing.source = "guardian";
        existing.isCurrentUser ||= guardian.userId === currentUserId;
        continue;
      }

      responsibleByIdentity.set(key, {
        id: `guardian-${guardian.id}`,
        studentNames: [studentName],
        fullName: guardian.fullName ?? guardian.user?.name ?? guardian.email,
        relationship: guardian.relationship,
        phone: guardian.phone ?? "Sin teléfono",
        canPickup: guardian.canPickup,
        emergencyContact: guardian.emergencyContact,
        hasUser: Boolean(guardian.userId),
        isCurrentUser: guardian.userId === currentUserId,
        editable: true,
        deletable: !guardian.userId,
        deleteIds: [guardian.id],
        source: "guardian",
      });
    }

    for (const responsible of student.responsibles) {
      additionalResponsibles.push({
        id: responsible.id,
        studentNames: [studentName],
        fullName: responsible.fullName,
        relationship: responsible.relationship,
        phone: responsible.phone,
        canPickup: responsible.canPickup,
        emergencyContact: responsible.emergencyContact,
        hasUser: false,
        isCurrentUser: false,
        editable: true,
        deletable: true,
        deleteIds: [responsible.id],
        source: "responsible",
      });
    }
  }

  return [...new Set(responsibleByIdentity.values()), ...additionalResponsibles];
}

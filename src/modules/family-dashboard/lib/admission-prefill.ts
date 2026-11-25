export type AdmissionSource = {
  childName: string;
  guardianNames: string;
  phone: string;
  email: string;
  answers: unknown;
};

export type AdmissionStudent = { firstName: string; lastName: string; birthDate: Date };

function stringAnswers(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function normalizedName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** A household link alone is not evidence that the inquiry describes this child. */
export function matchesAdmissionStudent(origin: AdmissionSource, student: AdmissionStudent) {
  const answers = stringAnswers(origin.answers);
  return normalizedName(origin.childName) === normalizedName(`${student.firstName} ${student.lastName}`)
    && answers.birthDate === student.birthDate.toISOString().slice(0, 10);
}

export function buildAdmissionPrefill(origin: AdmissionSource | null) {
  if (!origin) return null;
  const originalAnswers: Record<string, string> = {
    ...stringAnswers(origin.answers),
    childName: origin.childName,
    guardianNames: origin.guardianNames,
    phone: origin.phone,
    email: origin.email,
  };
  if (origin.answers && typeof origin.answers === "object" && "age" in origin.answers && typeof origin.answers.age === "number") {
    originalAnswers.age = String(origin.answers.age);
  }
  // Full names are unstructured in the initial form. Keep every word and allow correction.
  const parts = origin.childName.trim().split(/\s+/);
  const lastName = parts.length > 1 ? parts.pop()! : "";
  const answers: Record<string, string> = {};
  for (const [source, target] of [
    ["relationships", "relationships"],
    ["supportNeeds", "supportNeeds"],
    ["dailyRhythm", "dailyRhythms"],
    ["childDescription", "temperament"],
    ["projectAttraction", "koruMotivation"],
  ]) {
    if (originalAnswers[source]?.trim()) answers[target] = originalAnswers[source];
  }
  return {
    identity: {
      firstName: parts.join(" "),
      lastName,
      birthDate: originalAnswers.birthDate ?? "",
      primaryFullName: origin.guardianNames,
      primaryPhone: origin.phone,
      cityAndState: originalAnswers.city ?? "",
    },
    answers,
    originalAnswers,
  };
}

/** Explicit saved blanks are edits too; never bring a cleared answer back. */
export function mergeAdmissionAnswers(suggestions: Record<string, string>, saved: unknown) {
  return { ...suggestions, ...stringAnswers(saved) };
}

export type AdmissionPrefill = NonNullable<ReturnType<typeof buildAdmissionPrefill>>;

import { z } from "zod";

/**
 * Candidate families pure rules.
 *
 * Family kind is independent from the operational FamilyStatus: a candidate family
 * still uses the normal onboarding, invitations and status lifecycle. Only the kind
 * marker and the optional admission origin distinguish it, so conversion is a single
 * kind update that never rewrites identity, invitations or accounting.
 */

export type FamilyKindValue = "FAMILY" | "CANDIDATE";

export const DEFAULT_FAMILY_KIND: FamilyKindValue = "FAMILY";
export const CANDIDATE_FAMILY_KIND: FamilyKindValue = "CANDIDATE";

export const familyKindMessages = {
  invalidKind: "El tipo de familia no es válido.",
  invalidCreationData:
    "Completá el nombre y un email principal válido. El segundo email, si lo ingresás, también debe ser válido.",
  duplicateEmails: "Los dos emails deben ser distintos.",
  invalidAdmissionOrigin:
    "No pudimos preparar la familia candidata porque el contacto de admisión no tiene datos válidos. Revisá el contacto e intentá nuevamente.",
} as const;

const emailSchema = z.email();
const EMAIL_PATTERN = { test: (value: string) => emailSchema.safeParse(value).success };

export type FamilyKindResult = { ok: true; kind: FamilyKindValue } | { ok: false; message: string };

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normalizeEmail(value: unknown) {
  return normalizeText(value).toLowerCase();
}

function isValidName(name: string) {
  return name.length >= 2 && name.length <= 120;
}

/** Missing or blank kind keeps the historical behaviour: a regular family. */
export function parseFamilyKind(raw: unknown): FamilyKindResult {
  const normalized = normalizeText(raw).toUpperCase();
  if (!normalized) return { ok: true, kind: DEFAULT_FAMILY_KIND };
  if (normalized === DEFAULT_FAMILY_KIND) return { ok: true, kind: DEFAULT_FAMILY_KIND };
  if (normalized === CANDIDATE_FAMILY_KIND) return { ok: true, kind: CANDIDATE_FAMILY_KIND };
  return { ok: false, message: familyKindMessages.invalidKind };
}

/**
 * Rows with an admission origin are always candidate families, even if the caller
 * asks for a regular one: the origin is the authoritative source of the identity.
 */
export function resolveImportRowKind(input: { kind?: unknown; admissionInquiryId?: unknown }): FamilyKindResult {
  const admissionInquiryId = normalizeText(input.admissionInquiryId);
  const parsed = parseFamilyKind(input.kind);
  if (admissionInquiryId) return { ok: true, kind: CANDIDATE_FAMILY_KIND };
  return parsed;
}

export type FamilyCreationPermissionKey = "families.manage" | "contacts.view" | "contacts.manage";

/** Creating from an admission reads and writes the contacts module. */
export function requiredPermissionsForFamilyCreation(admissionInquiryId: unknown): FamilyCreationPermissionKey[] {
  const permissions: FamilyCreationPermissionKey[] = ["families.manage"];
  if (normalizeText(admissionInquiryId)) permissions.push("contacts.view", "contacts.manage");
  return permissions;
}

export type AdmissionOrigin = { id: string; guardianNames: string; childName?: string; email: string };

export type FamilyRecordDraft = {
  name: string;
  kind: FamilyKindValue;
  admissionInquiryId: string | null;
};

export type FamilyCreationDraft = FamilyRecordDraft & {
  primaryEmail: string;
  secondaryEmail?: string;
};

export type FamilyCreationInput = {
  kind?: unknown;
  name?: unknown;
  primaryEmail?: unknown;
  secondaryEmail?: unknown;
  admissionOrigin?: AdmissionOrigin | null;
};

export type FamilyCreationDraftResult =
  | { ok: true; draft: FamilyCreationDraft }
  | { ok: false; message: string };

/**
 * Resolves the family identity before any write happens.
 *
 * Admission identity supplies defaults, not immutable values. Authorized operators
 * may correct the family name and invitation email without changing the original
 * inquiry. Explicit blank or invalid edits are rejected rather than replaced.
 */
export function resolveFamilyCreationDraft(input: FamilyCreationInput): FamilyCreationDraftResult {
  const origin = input.admissionOrigin ?? null;

  if (origin) {
    const originEmail = normalizeEmail(input.primaryEmail ?? origin.email);
    const originId = normalizeText(origin.id);
    const secondaryEmail = normalizeEmail(input.secondaryEmail) || undefined;
    const originName = normalizeText(origin.guardianNames);
    const childName = normalizeText(origin.childName);
    const name = input.name === undefined
      ? (isValidName(originName) ? originName : childName)
      : normalizeText(input.name);

    if (!originId) {
      return { ok: false, message: familyKindMessages.invalidAdmissionOrigin };
    }
    if (!EMAIL_PATTERN.test(originEmail) || !isValidName(name) || (secondaryEmail && !EMAIL_PATTERN.test(secondaryEmail))) {
      return { ok: false, message: familyKindMessages.invalidCreationData };
    }
    if (secondaryEmail === originEmail) {
      return { ok: false, message: familyKindMessages.duplicateEmails };
    }

    return {
      ok: true,
      draft: {
        name,
        kind: CANDIDATE_FAMILY_KIND,
        primaryEmail: originEmail,
        secondaryEmail,
        admissionInquiryId: originId,
      },
    };
  }

  const parsedKind = parseFamilyKind(input.kind);
  if (!parsedKind.ok) return parsedKind;

  const name = normalizeText(input.name);
  const primaryEmail = normalizeEmail(input.primaryEmail);
  const secondaryEmail = normalizeEmail(input.secondaryEmail) || undefined;

  if (!isValidName(name) || !EMAIL_PATTERN.test(primaryEmail) || (secondaryEmail && !EMAIL_PATTERN.test(secondaryEmail))) {
    return { ok: false, message: familyKindMessages.invalidCreationData };
  }
  if (secondaryEmail === primaryEmail) {
    return { ok: false, message: familyKindMessages.duplicateEmails };
  }

  return {
    ok: true,
    draft: { name, kind: parsedKind.kind, primaryEmail, secondaryEmail, admissionInquiryId: null },
  };
}

/** Only the columns that belong to the family row; emails create invitations separately. */
export function familyCreationRecord(draft: FamilyRecordDraft) {
  return { name: draft.name, kind: draft.kind, admissionInquiryId: draft.admissionInquiryId };
}

export type CandidateConversionOutcome = "convert" | "already-family";

/** Conversion is idempotent: converting a regular family is a no-op. */
export function candidateConversionOutcome(kind: FamilyKindValue): CandidateConversionOutcome {
  return kind === CANDIDATE_FAMILY_KIND ? "convert" : "already-family";
}

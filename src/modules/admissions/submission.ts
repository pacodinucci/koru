import { createHash } from "node:crypto";
import { admissionSchema, type AdmissionPayload } from "./admissions.schema";

export type AdmissionSave = (key: string, fingerprint: string, payload: AdmissionPayload) => Promise<boolean>;
export async function submitAdmission(input: unknown, save: AdmissionSave) {
  const parsed = admissionSchema.safeParse(input);
  if (!parsed.success) return { success: false, status: 400, error: "Revisá los campos del cuestionario." };
  const payload = parsed.data;
  const fingerprint = createHash("sha256").update(JSON.stringify({ version: payload.questionnaireVersion, answers: payload.answers })).digest("hex");
  try {
    if (!await save(payload.idempotencyKey, fingerprint, payload)) {
      return { success: false, status: 409, error: "Este envío ya fue recibido con otras respuestas. Recargá la página para iniciar otro." };
    }
    return { success: true, status: 200 };
  } catch {
    return { success: false, status: 500, error: "No pudimos guardar el cuestionario. Intentá de nuevo." };
  }
}

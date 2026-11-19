import { readAdmissionRequest } from "./request";
import { submitAdmission, type AdmissionSave } from "./submission";

// Production and tests use the same HTTP boundary; only persistence is injected.
export function admissionHandler(save: AdmissionSave) {
  return async (request: Request): Promise<Response> => {
    let input: unknown;
    try { input = await readAdmissionRequest(request); }
    catch { return Response.json({ success: false, error: "El envío no es válido o supera el tamaño permitido." }, { status: 400 }); }
    const { status, ...result } = await submitAdmission(input, save);
    return Response.json(result, { status });
  };
}

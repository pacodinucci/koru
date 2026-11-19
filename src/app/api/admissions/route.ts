import { admissionHandler } from "@/modules/admissions/handler";
import { saveAdmission } from "@/modules/admissions/server/admissions.repository";
export const POST = admissionHandler(saveAdmission);

import { InitialQuestionnaireForm } from "@/modules/admisiones/views/initial-questionnaire-form";
export const metadata = { title: "Cuestionario inicial de vinculación | Koru", robots: { index: false, follow: true } };
export default function InitialQuestionnairePage() {
  return <main className="font-montserrat mx-auto max-w-3xl px-4 py-12 sm:py-20"><InitialQuestionnaireForm /></main>;
}

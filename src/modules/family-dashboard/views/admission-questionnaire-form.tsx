"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { admissionQuestionnaireSections } from "@/modules/family-dashboard/lib/admission-questionnaire";
import { saveAdmissionQuestionnaireAction } from "@/modules/family-dashboard/server/admission-questionnaire.actions";

export function AdmissionQuestionnaireForm({
  studentId,
  initialAnswers,
  submittedAt,
}: {
  studentId: string;
  initialAnswers: Record<string, string>;
  submittedAt: string | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initialAnswers);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(submit: boolean) {
    setMessage(null);
    startTransition(async () => {
      try {
        const result = await saveAdmissionQuestionnaireAction({ studentId, answers, submit });
        if (!result.ok) {
          setMessage(result.error === "empty_questionnaire" ? "Respondé al menos una pregunta antes de enviar." : "No pudimos guardar el cuestionario. Intentá de nuevo.");
          return;
        }
        setMessage(submit ? "Cuestionario enviado a Koru." : "Borrador guardado. Podés continuar más tarde.");
        router.refresh();
      } catch {
        setMessage("No pudimos guardar el cuestionario. Intentá de nuevo.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Respondé con la información que quieras compartir. Podés guardar un borrador y continuar en otro momento. La información se usará únicamente para el acompañamiento pedagógico interno de Koru.
      </p>
      {submittedAt ? <p className="text-sm text-muted-foreground">Enviado el {new Date(submittedAt).toLocaleDateString("es-AR")}. Si guardás cambios como borrador, quedará en progreso hasta que vuelvas a enviarlo.</p> : null}
      {admissionQuestionnaireSections.map((section) => (
        <Card key={section.title}>
          <CardHeader><CardTitle>{section.title}</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            {"description" in section ? <p className="text-sm text-muted-foreground">{section.description}</p> : null}
            {section.questions.map((question) => (
              <div key={question.key} className="space-y-2">
                <label htmlFor={question.key} className="text-sm font-medium">{question.label}</label>
                <Textarea
                  id={question.key}
                  value={answers[question.key] ?? ""}
                  onChange={(event) => setAnswers((current) => ({ ...current, [question.key]: event.target.value }))}
                  maxLength={5000}
                  rows={question.key === "biography" ? 8 : 3}
                  disabled={isPending}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      {message ? <p role="status" className="text-sm">{message}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={isPending} onClick={() => save(false)}>Guardar borrador</Button>
        <Button type="button" disabled={isPending} onClick={() => save(true)}>{submittedAt ? "Volver a enviar" : "Enviar a Koru"}</Button>
      </div>
    </div>
  );
}

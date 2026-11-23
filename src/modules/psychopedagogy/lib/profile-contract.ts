export type PsychopedagogyProfileSection = "learning" | "followups" | "interventions" | "instruments";

export type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  group: { name: string };
};

export type AccompanimentKind = "INDIVIDUAL" | "FAMILY";
export type InstrumentKind = "QUESTIONNAIRE" | "ASSESSMENT" | "INTERVIEW" | "TEST" | "OTHER";

export const instrumentKindLabels: Record<InstrumentKind, string> = {
  QUESTIONNAIRE: "Cuestionario",
  ASSESSMENT: "Prueba",
  INTERVIEW: "Entrevista",
  TEST: "Test",
  OTHER: "Otro",
};

type DatedEntry = { id: string; entryDate: string };
export type ObservationDTO = DatedEntry & { title: string; body: string };
export type AccompanimentDTO = ObservationDTO & { kind: AccompanimentKind };
export type InterventionDTO = DatedEntry & {
  title: string;
  observationAnalysis: string;
  strategyFeedback: string;
  workPlan: string;
  implementation: string;
  evaluationResults: string;
};
export type InstrumentDTO = DatedEntry & { name: string; body: string; kind?: InstrumentKind | null };

export type PsychopedagogyProfileDTO = {
  learningStyleAndTemperament: string;
  observations: ObservationDTO[];
  accompaniments: AccompanimentDTO[];
  interventions: InterventionDTO[];
  instruments: InstrumentDTO[];
};
export type PsychopedagogyProfileResponse = { profile: PsychopedagogyProfileDTO };

export type PsychopedagogyProfilePayload =
  | { section: "learning"; description: string }
  | { section: "accompaniment"; date: string; kind: AccompanimentKind; title: string; body: string }
  | {
      section: "intervention";
      date: string;
      title: string;
      observationAnalysis: string;
      strategyFeedback: string;
      workPlan: string;
      implementation: string;
      evaluationResults: string;
    }
  | { section: "instrument"; date: string; name: string; body: string; kind?: InstrumentKind };

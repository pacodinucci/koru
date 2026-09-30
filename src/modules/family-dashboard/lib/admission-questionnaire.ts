export const admissionQuestionnaireSections = [
  {
    title: "Información familiar",
    questions: [
      { key: "guardianOccupations", label: "Ocupación de madre, padre o tutores" },
    ],
  },
  {
    title: "Embarazo y nacimiento",
    questions: [
      { key: "pregnancy", label: "¿Cómo fue el embarazo?" },
      { key: "birth", label: "¿Cómo fue el parto?" },
      { key: "earlyEvents", label: "¿Hubo alguna situación importante durante el embarazo, nacimiento o primeros años de vida que consideren importante compartir?" },
    ],
  },
  {
    title: "Desarrollo infantil",
    questions: [
      { key: "walkingAge", label: "¿A qué edad comenzó a caminar?" },
      { key: "speakingAge", label: "¿A qué edad comenzó a hablar?" },
      { key: "earlyDevelopment", label: "¿Cómo describirían su desarrollo durante los primeros años?" },
      { key: "therapeuticSupport", label: "¿Ha habido algún acompañamiento terapéutico, médico o psicopedagógico?" },
      { key: "developmentConditions", label: "¿Hay alguna condición física, emocional, neurológica o de aprendizaje que debamos conocer?" },
    ],
  },
  {
    title: "Salud y bienestar",
    questions: [
      { key: "allergiesAndDiet", label: "¿Tiene alergias o restricciones alimenticias?" },
      { key: "currentMedication", label: "¿Toma algún medicamento actualmente?" },
      { key: "medicalHistory", label: "¿Ha tenido cirugías, hospitalizaciones o enfermedades importantes?" },
      { key: "sleepHabits", label: "¿Cómo describirían sus hábitos de sueño?" },
      { key: "dailyDiet", label: "¿Cómo describirían su alimentación cotidiana?" },
      { key: "movementAndNature", label: "¿Qué relación tiene con el movimiento físico, el juego y la naturaleza?" },
    ],
  },
  {
    title: "Mundo emocional y relacional",
    questions: [
      { key: "temperament", label: "¿Cómo describirían el temperamento de su hija/o?" },
      { key: "reactions", label: "¿Cómo suele reaccionar ante cambios, frustraciones o límites?" },
      { key: "emotionalExpression", label: "¿Cómo expresa sus emociones?" },
      { key: "relationships", label: "¿Cómo se relaciona con otros niños y adultos?" },
      { key: "emotionalSupportAtHome", label: "¿Qué estrategias utilizan en casa para acompañar momentos emocionales difíciles?" },
      { key: "recentChanges", label: "¿Ha vivido recientemente algún cambio significativo o situación difícil?" },
    ],
  },
  {
    title: "Vida familiar y cultura del hogar",
    questions: [
      { key: "familyMembers", label: "¿Quiénes conforman el núcleo familiar?" },
      { key: "siblings", label: "¿Hay hermanos/as? ¿Qué edades tienen?" },
      { key: "familyDynamics", label: "¿Cómo describirían la dinámica familiar?" },
      { key: "familyValues", label: "¿Qué valores consideran fundamentales en casa?" },
    ],
  },
  {
    title: "Pantallas y ritmo de vida",
    questions: [
      { key: "screenUse", label: "¿Cómo es el uso de pantallas en casa?" },
      { key: "dailyRhythms", label: "¿Cómo son los ritmos cotidianos de sueño, alimentación y descanso?" },
      { key: "freePlay", label: "¿Qué lugar tiene el juego libre en su vida cotidiana?" },
    ],
  },
  {
    title: "Observación pedagógica inicial",
    questions: [
      { key: "strengths", label: "¿Qué consideran que fortalece más a su hija/o actualmente?" },
      { key: "challenges", label: "¿Qué desafíos observan en este momento de su desarrollo?" },
      { key: "supportNeeds", label: "¿Hay algo importante que quisieran que sepamos para acompañarle mejor?" },
      { key: "futureMemory", label: "¿Qué les gustaría que su hija/o recuerde de su experiencia educativa en el futuro?" },
      { key: "anythingElse", label: "¿Hay algo más que deseen compartir con nosotros?" },
      { key: "koruMotivation", label: "¿Qué les inspira o mueve a querer formar parte de Koru?" },
    ],
  },
  {
    title: "Una pequeña biografía",
    description: "Contanos quién es, qué le gusta y disfruta, sus fortalezas, qué le cuesta, qué le da seguridad, cómo vive el mundo, qué le emociona y preocupa, cómo juega, ama y aprende.",
    questions: [
      { key: "biography", label: "Biografía de tu hija/o" },
    ],
  },
] as const;

export const admissionQuestionnaireKeys = admissionQuestionnaireSections.flatMap((section) =>
  section.questions.map((question) => question.key),
);

export function readQuestionnaireAnswers(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const source = value as Record<string, unknown>;
  return Object.fromEntries(admissionQuestionnaireKeys.map((key) => [key, typeof source[key] === "string" ? source[key] : ""]));
}

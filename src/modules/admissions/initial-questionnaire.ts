export const QUESTIONNAIRE_VERSION = "initial-v1";
export const QUESTIONNAIRE_INTRO = [
  "Gracias por acercarse a Koru.",
  "Este primer cuestionario tiene la intención de conocernos un poco antes de nuestro encuentro presencial. Más que un formulario administrativo, buscamos abrir un espacio de escucha y comprensión sobre la historia, necesidades e intereses de su hija/o y de su familia.",
  "Les invitamos a responder con honestidad y tranquilidad. No existen respuestas correctas o incorrectas; lo más importante es poder acercarnos de manera auténtica a quienes son y a lo que buscan para este momento de vida.",
];
export const QUESTIONNAIRE_PRIVACY = "Toda la información compartida será tratada con respeto y confidencialidad, y será utilizada únicamente con fines de acompañamiento pedagógico y vinculación inicial.";
export type Question = { key: string; label: string; type: "text" | "date" | "number" | "tel" | "email" | "textarea"; required: boolean; maxLength?: number };
const narrative = (key: string, label: string): Question => ({ key, label, type: "textarea", required: false, maxLength: 4000 });
export const QUESTIONNAIRE_SECTIONS: { title: string; description?: string; questions: Question[] }[] = [
  { title: "Información general", description: "Sobre su hija/o", questions: [
    { key: "childName", label: "Nombre completo:", type: "text", required: true, maxLength: 200 },
    { key: "birthDate", label: "Fecha de nacimiento:", type: "date", required: true },
    { key: "age", label: "Edad:", type: "number", required: true },
    { key: "guardianNames", label: "Nombre(s) de madre, padre o tutores:", type: "text", required: true, maxLength: 200 },
    { key: "phone", label: "Teléfono de contacto:", type: "tel", required: true, maxLength: 40 },
    { key: "email", label: "Correo electrónico:", type: "email", required: true, maxLength: 254 },
    { key: "city", label: "Ciudad donde viven:", type: "text", required: true, maxLength: 120 },
  ] },
  { title: "Sobre su hija/o", questions: [
    narrative("childDescription", "¿Cómo describirían a su hija/o?"),
    narrative("enjoys", "¿Qué disfruta hacer?"),
    narrative("interests", "¿Qué intereses, juegos o actividades llaman más su atención actualmente?"),
    narrative("relationships", "¿Cómo suele relacionarse con otros niños y adultos?"),
    narrative("importantTraits", "¿Hay algo importante que consideren valioso que sepamos sobre su forma de ser?"),
  ] },
  { title: "Trayectoria y experiencias educativas", questions: [
    narrative("previousEducation", "¿Ha asistido anteriormente a otro espacio educativo? ¿Cuál?"),
    narrative("schoolExperience", "¿Cómo ha sido su experiencia escolar hasta ahora?"),
    narrative("likedEducation", "¿Qué les ha gustado de otros espacios educativos?"),
    narrative("desiredChanges", "¿Qué les gustaría que fuera diferente en esta nueva experiencia?"),
  ] },
  { title: "Relación con Koru", questions: [
    narrative("discovery", "¿Cómo conocieron Koru?"),
    narrative("projectAttraction", "¿Qué les llamó la atención del proyecto?"),
    narrative("childExpectations", "¿Qué esperan encontrar aquí para su hija/o?"),
    narrative("familyExpectations", "¿Qué esperan encontrar ustedes como familia?"),
  ] },
  { title: "Ritmo de vida y bienestar", questions: [
    narrative("dailyRhythm", "¿Cómo describirían el ritmo cotidiano de su hija/o?"),
    narrative("supportNeeds", "¿Hay alguna necesidad médica, alimenticia, emocional o de acompañamiento que consideren importante compartir desde este momento?"),
    narrative("currentNeeds", "¿Qué sienten que su hija/o necesita en este momento de su vida?"),
  ] },
];

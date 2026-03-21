import type {
  LandingMetric,
  LandingPillar,
  LandingProgram,
} from "@/modules/landing/types/landing";

export const landingMetrics: LandingMetric[] = [
  { label: "Nuestro cuerpo escolar", value: "Respira" },
  { label: "Nuestro proceso", value: "Siente" },
  { label: "Nuestra comunidad", value: "Aprende" },
];

export const landingPillars: LandingPillar[] = [
  {
    id: "01",
    title: "Organismo vivo",
    subtitle: "Educacion que respira",
    description:
      "Nuestra propuesta no es un molde rigido. Es una forma cambiante que respira, siente, aprende y se transforma con quienes la habitan.",
  },
  {
    id: "02",
    title: "Pedagogias alternativas",
    subtitle: "Aprendizaje consciente",
    description:
      "Nos nutrimos de enfoques pedagogicos alternativos y de una mirada de crianza consciente que cuida los procesos.",
  },
  {
    id: "03",
    title: "Comunidad en camino",
    subtitle: "Tribu y vinculo",
    description:
      "Avanzamos como comunidad unida en el respeto por los ritmos, las emociones y la vida de cada persona.",
  },
  {
    id: "04",
    title: "Transformacion compartida",
    subtitle: "Abrazo y evolucion",
    description:
      "Koru es abrazo, tribu y transformacion. Cada experiencia abre nuevas formas de aprender, vincularse y crecer.",
  },
];

export const landingPrograms: LandingProgram[] = [
  {
    stage: "CUIDADO",
    studio: "Ritmos y emociones",
    ages: "Humano",
    summary:
      "Sostenemos procesos respetando tiempos personales y contextos de vida.",
  },
  {
    stage: "COMUNIDAD",
    studio: "Tribu que acompana",
    ages: "Colectivo",
    summary:
      "La comunidad es parte del aprendizaje: caminar juntos tambien es aprender.",
  },
  {
    stage: "APRENDIZAJE",
    studio: "Pedagogias alternativas",
    ages: "Vivo",
    summary:
      "Integramos metodologias activas para que el aprendizaje sea significativo y real.",
  },
  {
    stage: "TRANSFORMACION",
    studio: "Evolucion constante",
    ages: "Abierta",
    summary:
      "No buscamos repetir formulas: buscamos transformarnos con conciencia y sentido.",
  },
];

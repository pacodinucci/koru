import type { CmsSection } from "@/modules/admin/types/dashboard";

export const cmsLandingSections: CmsSection[] = [
  {
    id: "hero",
    title: "Hero",
    note: "Encabezado principal y primer mensaje de impacto.",
    fields: [
      {
        id: "hero-kicker",
        label: "Kicker",
        value: "BIENVENID@S A KORU OSA",
      },
      {
        id: "hero-title",
        label: "Titulo principal",
        value: "En Koru, entendemos la educacion como un organismo vivo.",
      },
      {
        id: "hero-body",
        label: "Parrafo principal",
        multiline: true,
        value:
          "Nuestro cuerpo escolar no es un molde rigido, sino una forma cambiante que respira, siente, aprende y se transforma junto a quienes lo habitan.",
      },
      {
        id: "hero-cta",
        label: "CTA principal",
        value: "Make a donation",
      },
    ],
  },
  {
    id: "vision",
    title: "Vision",
    note: "Manifiesto y principios pedagogicos de Koru.",
    fields: [
      {
        id: "vision-title",
        label: "Titulo",
        value:
          "Nos nutrimos de pedagogias alternativas, crianza consciente y comunidad.",
      },
      {
        id: "vision-body",
        label: "Descripcion",
        multiline: true,
        value:
          "Nos nutrimos de pedagogias alternativas, crianza consciente y el compromiso profundo con una comunidad que camina unida en el respeto por los ritmos, las emociones y la vida.",
      },
      {
        id: "vision-highlight",
        label: "Frase destacada",
        value: "Koru es abrazo, tribu y transformacion.",
      },
    ],
  },
  {
    id: "path",
    title: "Camino",
    note: "Bloques de contenido que explican como se vive el proyecto.",
    fields: [
      {
        id: "path-title",
        label: "Titulo",
        value: "Una practica educativa que se mueve con la vida",
      },
      {
        id: "path-body",
        label: "Descripcion",
        multiline: true,
        value:
          "Caminamos unid@s en el respeto por los ritmos, las emociones y la transformacion de cada proceso.",
      },
    ],
  },
  {
    id: "community",
    title: "Comunidad",
    note: "Seccion de convocatoria y cierre narrativo.",
    fields: [
      {
        id: "community-title",
        label: "Titulo",
        value: "Abrazo, tribu y transformacion.",
      },
      {
        id: "community-body",
        label: "Parrafo",
        multiline: true,
        value:
          "Quieres ser parte de esta vision? Siguenos para conocer mas y caminar junt@s por nuevos paradigmas educativos.",
      },
      {
        id: "community-card-title",
        label: "Titulo tarjeta oscura",
        value: "Organismo Social de Aprendizaje",
      },
      {
        id: "community-card-body",
        label: "Texto tarjeta oscura",
        multiline: true,
        value:
          "Comunidad que respira, siente, aprende y se transforma con quienes la habitan.",
      },
    ],
  },
  {
    id: "footer",
    title: "Footer",
    note: "Textos de pie de pagina y links.",
    fields: [
      {
        id: "footer-brand",
        label: "Marca",
        value: "Koru",
      },
      {
        id: "footer-campus",
        label: "Titulo campus",
        value: "Campus Koru",
      },
      {
        id: "footer-mail",
        label: "Email principal",
        value: "hola@koru.academy",
      },
      {
        id: "footer-legal",
        label: "Texto legal",
        value: "(c) 2026 Koru - Organismo Social de Aprendizaje",
      },
    ],
  },
];

export const cmsLandingDefaultTextMap = Object.fromEntries(
  cmsLandingSections.flatMap((section) =>
    section.fields.map((field) => [field.id, field.value]),
  ),
) as Record<string, string>;

export const cmsLandingTextKeys = Object.keys(cmsLandingDefaultTextMap);

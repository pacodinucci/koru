import { getCmsPublishedTextMapBySlug } from "@/modules/cms/server/cms-text.repository";

import { ContactoView } from "./contacto-view";

export default async function ContactoPage() {
  const textMap = await getCmsPublishedTextMapBySlug("/contacto");
  return <ContactoView textMap={textMap} />;
}
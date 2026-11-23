"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ContactsQuery } from "./contacts-query";

const ContactsStoreContext = createContext<ContactsQuery | null>(null);

/** One global Contacts store per dashboard tree, never a server-side singleton. */
export function ContactsStoreProvider({ children }: { children: ReactNode }) {
  const [model] = useState(() => new ContactsQuery("", {
    fetch: (...args) => fetch(...args),
    navigate: (query, replace) => {
      const url = `/dashboard/contactos${query ? `?${query}` : ""}`;
      // Next integrates native history without navigating the server route.
      if (replace) window.history.replaceState(null, "", url);
      else window.history.pushState(null, "", url);
    },
    schedule: (callback, milliseconds) => setTimeout(callback, milliseconds),
    cancel: (timer) => clearTimeout(timer),
  }));

  useEffect(() => () => model.stop(), [model]);

  return <ContactsStoreContext.Provider value={model}>{children}</ContactsStoreContext.Provider>;
}

export function useContactsModel() {
  const model = useContext(ContactsStoreContext);
  if (!model) throw new Error("Contacts must be rendered within ContactsStoreProvider.");
  return model;
}

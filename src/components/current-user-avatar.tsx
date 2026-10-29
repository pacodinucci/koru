"use client";

import { createContext, useContext, type ReactNode } from "react";

import { AvatarImage } from "@/components/ui/avatar";

const CurrentUserImageContext = createContext<string | null>(null);

/** Share only the current viewer's photo across dashboard shells. */
export function CurrentUserAvatarProvider({ image, children }: {
  image: string | null;
  children: ReactNode;
}) {
  return (
    <CurrentUserImageContext.Provider value={image}>
      {children}
    </CurrentUserImageContext.Provider>
  );
}

export function CurrentUserAvatarImage({ alt }: { alt: string }) {
  const image = useContext(CurrentUserImageContext);
  return image ? <AvatarImage src={image} alt={alt} /> : null;
}

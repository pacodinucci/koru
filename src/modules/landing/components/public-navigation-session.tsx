"use client";

import { useEffect, useState, type ComponentProps } from "react";

import { LandingNav } from "@/modules/landing/components/landing-nav";

type NavigationProps = ComponentProps<typeof LandingNav>;
type NavigationUser = NonNullable<NavigationProps["user"]>;

/** Identity is local to this mount, never part of the cached public shell. */
export function PublicNavigationSession(props: NavigationProps) {
  const [user, setUser] = useState<NavigationUser | null>(null);
  const suppliedIdentity = props.user !== undefined;

  useEffect(() => {
    if (props.previewMode || suppliedIdentity) return;

    const controller = new AbortController();
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/public/navigation", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json() as { user: NavigationUser | null };
        if (active) setUser(data.user);
      } catch {
        // Keep anonymous navigation on failure; retry only on a new mount.
      }
    }
    void load();
    return () => {
      active = false;
      controller.abort();
    };
  }, [props.previewMode, suppliedIdentity]);

  return <LandingNav {...props} user={suppliedIdentity ? props.user : user} />;
}

"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { requireUser } from "@/modules/auth/server/auth-guards";
import { GOOGLE_CALENDAR_SCOPE } from "@/modules/calendar/server/google-calendar/google-calendar-event";
import {
  activateGoogleCalendarConnection,
  disableGoogleCalendarConnection,
} from "@/modules/calendar/server/google-calendar/google-calendar.repository";
import {
  removeAllGoogleEventsForUser,
  syncUpcomingConfirmedEventsForUser,
} from "@/modules/calendar/server/google-calendar/google-calendar-sync.service";

function calendarUrl(params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `/calendario?${query.toString()}`;
}

export async function connectGoogleCalendarAction() {
  await requireUser();

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    redirect(calendarUrl({ googleError: "not_configured" }));
  }

  const callbackURL = new URL(
    "/calendario/google/callback",
    env.APP_URL ?? env.BETTER_AUTH_URL,
  ).toString();
  const errorCallbackURL = new URL(
    calendarUrl({ googleError: "authorization_failed" }),
    env.APP_URL ?? env.BETTER_AUTH_URL,
  ).toString();

  let result: { url?: string };

  try {
    result = await auth.api.linkSocialAccount({
      headers: await headers(),
      body: {
        provider: "google",
        scopes: [GOOGLE_CALENDAR_SCOPE],
        callbackURL,
        errorCallbackURL,
        requestSignUp: false,
      },
    });
  } catch {
    redirect(calendarUrl({ googleError: "authorization_failed" }));
  }

  if (!result.url) {
    redirect(calendarUrl({ googleError: "authorization_failed" }));
  }

  redirect(result.url);
}

export async function reactivateGoogleCalendarAction() {
  const user = await requireUser();
  try {
    await activateGoogleCalendarConnection(user.id);
  } catch {
    redirect(calendarUrl({ googleError: "reauthorization_required" }));
  }

  after(async () => {
    await syncUpcomingConfirmedEventsForUser(user.id);
  });
  redirect(calendarUrl({ google: "connected" }));
}

export async function disableGoogleCalendarAction() {
  const user = await requireUser();
  await disableGoogleCalendarConnection(user.id);

  after(async () => {
    await removeAllGoogleEventsForUser(user.id);
  });

  redirect(calendarUrl({ google: "disabled" }));
}

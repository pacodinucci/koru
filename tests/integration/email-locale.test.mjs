import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

// Transformación en memoria para probar las plantillas reales sin generar un build.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return { url: new URL(`../../src/${specifier.slice(2)}.ts`, import.meta.url).href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if (url.startsWith("file:") && /\.tsx?$/.test(url) && !url.includes("node_modules")) {
      const source = readFileSync(fileURLToPath(url), "utf8");
      return { format: "module", source: ts.transpileModule(source, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText, shortCircuit: true };
    }
    return nextLoad(url, context);
  },
});

const { UserInvitationEmail } = await import("../../src/modules/mailing/templates/user-invitation-email.tsx");
const { CalendarEventInvitationEmail } = await import("../../src/modules/mailing/templates/calendar-event-invitation-email.tsx");
const { ReceiptEmail } = await import("../../src/modules/mailing/templates/receipt-email.tsx");
const { OperationDecisionEmail } = await import("../../src/modules/mailing/templates/operation-decision-email.tsx");
const copy = await import("../../src/modules/mailing/lib/email-copy.ts");

function renderEmail(component, props) {
  const html = renderToStaticMarkup(createElement(component, props));
  assert.match(html, /lang="es-MX"/);
  assert.doesNotMatch(html, /Confirmá|Ingresá|[Pp]odés|es-AR/);
  return html;
}

test("invitación de cuenta usa español mexicano", () => {
  const html = renderEmail(UserInvitationEmail, { email: "familia@example.com", role: "PARENT", familyName: "Pérez", invitationUrl: "https://example.com/sign-up" });
  assert.match(html, /Crear cuenta/);
  assert.match(html, /puedes ignorar este correo/);
  assert.match(html, /Tu cuenta quedará vinculada/);
  assert.equal(copy.USER_INVITATION_SUBJECT, "Te invitaron a crear tu cuenta en Koru");
});

test("invitaciones internas y externas mantienen las fechas y zona del evento", () => {
  const props = { recipientName: "Ana", eventTitle: "Reunión", startsAt: new Date("2026-10-11T16:00:00Z"), endsAt: new Date("2026-10-11T17:00:00Z"), timeZone: "America/Mexico_City", eventUrl: "https://example.com/event" };
  const internal = renderEmail(CalendarEventInvitationEmail, props);
  assert.match(internal, /Confirma tu asistencia/);
  assert.match(internal, /Inicia sesión con el correo electrónico/);
  assert.match(internal, /Ciudad de México/);
  assert.match(internal, /11 de octubre de 2026/);
  const external = renderEmail(CalendarEventInvitationEmail, { ...props, requiresSignIn: false });
  assert.match(external, /puedes responder sin crear una cuenta/);
  assert.doesNotMatch(external, /Inicia sesión/);
  assert.equal(copy.calendarInvitationSubject("Reunión"), "Confirma tu asistencia: Reunión");
});

test("recibo usa fecha mexicana independiente de la zona del servidor", () => {
  const paidAt = new Date("2026-10-11T02:00:00Z");
  const date = copy.formatReceiptDate(paidAt);
  assert.equal(date, "10/10/2026");
  const html = renderEmail(ReceiptEmail, { receiptNumber: 42, amount: "150.00", paidAt, downloadUrl: "https://example.com/receipt" });
  assert.match(html, /ya puedes descargar/);
  assert.match(html, /Si vence, puedes descargar/);
  assert.ok(html.includes(date));
  const pdfSource = readFileSync(new URL("../../src/modules/families/server/receipt-pdf.service.tsx", import.meta.url), "utf8");
  assert.match(pdfSource, /formatReceiptDate\(receipt\.paidAt\)/);
});

test("operaciones traduce todos los estados con concordancia femenina", () => {
  for (const [status, label] of Object.entries({ PENDING: "pendiente", APPROVED: "aprobada", PARTIALLY_APPROVED: "aprobada parcialmente", REJECTED: "rechazada", CANCELED: "cancelada" })) {
    assert.equal(copy.operationEmailStatusLabel(status), label);
    for (const title of ["solicitud de inventario", "comprobación de gastos"]) {
      const html = renderEmail(OperationDecisionEmail, { recipientName: "Ana", title, status, detail: "Detalle", reason: "Motivo" });
      assert.ok(html.includes(label));
      assert.doesNotMatch(html, /partially_approved|approved|rejected|canceled/);
      assert.match(html, /Puedes consultar el detalle/);
    }
  }
});

test("los emisores usan los asuntos localizados y conceptos femeninos", () => {
  const service = readFileSync(new URL("../../src/modules/mailing/server/mailing.service.ts", import.meta.url), "utf8");
  assert.match(service, /subject: USER_INVITATION_SUBJECT/);
  assert.match(service, /subject: calendarInvitationSubject\(event\.title\)/);
  assert.match(service, /operationEmailStatusLabel\(input\.status\)/);
  for (const [file, title] of [["inventory", "solicitud de inventario"], ["cash-fund", "comprobación de gastos"]]) {
    const source = readFileSync(new URL(`../../src/modules/operations/server/${file}.actions.ts`, import.meta.url), "utf8");
    assert.ok(source.includes(`title: "${title}"`));
    assert.doesNotMatch(source, /title: "(?:pedido de inventario|rendición)"/);
  }
});

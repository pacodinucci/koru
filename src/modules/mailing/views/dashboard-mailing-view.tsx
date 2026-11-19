import {
  EmailDeliveryStatus,
  EmailMessageType,
  InvitationDeliveryJobStatus,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardSearchableTable } from "@/modules/dashboard/components/dashboard-searchable-table";
import {
  listEmailMessagesForAdmin,
  listInvitationDeliveryJobsForAdmin,
  sendInvitationDeliveryJobAction,
} from "@/modules/mailing/server/mailing.actions";

const sendableJobStatuses: InvitationDeliveryJobStatus[] = [
  InvitationDeliveryJobStatus.PENDING,
  InvitationDeliveryJobStatus.RETRY_SCHEDULED,
  InvitationDeliveryJobStatus.FAILED,
];

function formatDate(date: Date | null) {
  if (!date) return "-";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

function typeLabel(type: EmailMessageType) {
  return ({ USER_INVITATION: "Invitación", CALENDAR_EVENT: "Evento", BLOG_POST: "Nota", MANUAL: "Manual" })[type];
}

function statusLabel(status: EmailDeliveryStatus) {
  return ({ PENDING: "Pendiente", SENT: "Enviado", FAILED: "Falló" })[status];
}

const emailStatusVariants: Record<EmailDeliveryStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  SENT: "success",
  FAILED: "danger",
};

function statusVariant(status: EmailDeliveryStatus) {
  return emailStatusVariants[status];
}

function jobStatusLabel(status: InvitationDeliveryJobStatus) {
  return ({
    PENDING: "Pendiente", PROCESSING: "Procesando", RETRY_SCHEDULED: "Reintentando",
    SENT: "Enviado", FAILED: "Falló", CANCELLED: "Cancelado",
  })[status];
}

const jobStatusVariants: Record<InvitationDeliveryJobStatus, "warning" | "info" | "attention" | "success" | "danger" | "muted"> = {
  PENDING: "warning",
  PROCESSING: "info",
  RETRY_SCHEDULED: "attention",
  SENT: "success",
  FAILED: "danger",
  CANCELLED: "muted",
};

function jobStatusVariant(status: InvitationDeliveryJobStatus) {
  return jobStatusVariants[status];
}

export async function DashboardMailingView({ canManage }: { canManage: boolean }) {
  const [messages, invitationJobs] = await Promise.all([
    listEmailMessagesForAdmin(),
    listInvitationDeliveryJobsForAdmin(),
  ]);
  const counts = invitationJobs.reduce<Record<InvitationDeliveryJobStatus, number>>(
    (total, job) => ({ ...total, [job.status]: total[job.status] + 1 }),
    { PENDING: 0, PROCESSING: 0, RETRY_SCHEDULED: 0, SENT: 0, FAILED: 0, CANCELLED: 0 },
  );

  const jobRows = invitationJobs.map((job) => {
    const statusLabel = jobStatusLabel(job.status);
    const familyLabel = job.invitation.family?.name ?? "Sin familia";
    const nextAttemptAt = formatDate(job.nextAttemptAt);
    const detail = job.lastError ?? job.lastErrorCode ?? job.providerMessageId ?? "-";
    return {
      id: job.id,
      // Only values the row already renders may feed the live search.
      searchText: [
        job.invitation.email,
        familyLabel,
        `versión ${job.tokenVersion}`,
        statusLabel,
        String(job.attemptCount),
        nextAttemptAt,
        detail,
      ].join(" "),
      content: (
        <TableRow key={job.id}>
          <TableCell><div className="break-all font-medium">{job.invitation.email}</div><div className="mt-1 text-xs text-muted-foreground">{familyLabel} · versión {job.tokenVersion}</div></TableCell>
          <TableCell><Badge variant={jobStatusVariant(job.status)}>{statusLabel}</Badge></TableCell>
          <TableCell>{job.attemptCount}</TableCell>
          <TableCell className="text-xs">{nextAttemptAt}</TableCell>
          <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground" title={job.lastError ?? undefined}>{detail}</TableCell>
          <TableCell>{canManage && sendableJobStatuses.includes(job.status) ? <form action={sendInvitationDeliveryJobAction}><input type="hidden" name="jobId" value={job.id} /><Button type="submit" variant="outline" className="h-8 px-2 text-xs">Enviar</Button></form> : "-"}</TableCell>
        </TableRow>
      ),
    };
  });

  const messageRows = messages.map((message) => {
    const typeText = typeLabel(message.type);
    const statusText = statusLabel(message.status);
    const recipients = message.recipients.map((recipient) => recipient.email).join(", ");
    const providerText = message.providerMessageId ? `${message.provider}:${message.providerMessageId}` : message.provider;
    const createdAt = formatDate(message.createdAt);
    const errorText = message.error ?? "-";
    return {
      id: message.id,
      searchText: [typeText, message.subject, recipients, statusText, providerText, createdAt, errorText].join(" "),
      content: (
        <TableRow key={message.id}><TableCell>{typeText}</TableCell><TableCell className="max-w-[260px] truncate">{message.subject}</TableCell><TableCell className="max-w-[240px] text-xs text-slate-600">{recipients}</TableCell><TableCell><Badge variant={statusVariant(message.status)}>{statusText}</Badge></TableCell><TableCell className="text-xs text-slate-600">{providerText}</TableCell><TableCell className="text-xs text-muted-foreground">{createdAt}</TableCell><TableCell className="max-w-[280px] truncate text-xs text-slate-600">{errorText}</TableCell></TableRow>
      ),
    };
  });

  return (
    <div className="min-w-0 space-y-6">
      <section aria-labelledby="mailing-jobs-heading" className="min-w-0 space-y-2">
        <h2 id="mailing-jobs-heading" className="text-base font-semibold">
          Entregas de invitaciones
        </h2>
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
          <div className="rounded-lg border p-3"><div className="text-muted-foreground">Pendientes</div><strong>{counts.PENDING}</strong></div>
          <div className="rounded-lg border p-3"><div className="text-muted-foreground">Procesando</div><strong>{counts.PROCESSING}</strong></div>
          <div className="rounded-lg border p-3"><div className="text-muted-foreground">Reintentos</div><strong>{counts.RETRY_SCHEDULED}</strong></div>
          <div className="rounded-lg border p-3"><div className="text-muted-foreground">Enviadas</div><strong>{counts.SENT}</strong></div>
          <div className="rounded-lg border p-3"><div className="text-muted-foreground">Fallidas</div><strong>{counts.FAILED}</strong></div>
        </div>
        <DashboardSearchableTable
          searchId="mailing-jobs-search"
          searchPlaceholder="Buscar por email o estado"
          header={<TableHeader><TableRow>
            <TableHead>Invitación</TableHead><TableHead>Estado</TableHead><TableHead>Intentos</TableHead>
            <TableHead>Próximo intento</TableHead><TableHead>Detalle</TableHead><TableHead>Acción</TableHead>
          </TableRow></TableHeader>}
          rows={jobRows}
          columnCount={6}
          emptyMessage="Todavía no hay entregas de invitaciones registradas."
          tableClassName="min-w-[960px]"
        />
      </section>

      <section aria-labelledby="mailing-history-heading" className="min-w-0 space-y-2">
        <h2 id="mailing-history-heading" className="text-base font-semibold">
          Historial de mailing
        </h2>
        <DashboardSearchableTable
          searchId="mailing-history-search"
          searchPlaceholder="Buscar por asunto o destinatario"
          header={<TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Asunto</TableHead><TableHead>Destinatarios</TableHead><TableHead>Estado</TableHead><TableHead>Proveedor</TableHead><TableHead>Creado</TableHead><TableHead>Error</TableHead></TableRow></TableHeader>}
          rows={messageRows}
          columnCount={7}
          emptyMessage="Todavía no hay emails registrados."
          tableClassName="min-w-[1120px]"
        />
      </section>
    </div>
  );
}

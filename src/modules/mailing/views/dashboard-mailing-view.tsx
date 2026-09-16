import {
  EmailDeliveryStatus,
  EmailMessageType,
  InvitationDeliveryJobStatus,
} from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listEmailMessagesForAdmin,
  listInvitationDeliveryJobsForAdmin,
  requeueFailedInvitationDeliveryJobAction,
} from "@/modules/mailing/server/mailing.actions";

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

function statusVariant(status: EmailDeliveryStatus) {
  if (status === EmailDeliveryStatus.SENT) return "default" as const;
  if (status === EmailDeliveryStatus.FAILED) return "destructive" as const;
  return "secondary" as const;
}

function jobStatusLabel(status: InvitationDeliveryJobStatus) {
  return ({
    PENDING: "Pendiente", PROCESSING: "Procesando", RETRY_SCHEDULED: "Reintentando",
    SENT: "Enviado", FAILED: "Falló", CANCELLED: "Cancelado",
  })[status];
}

function jobStatusVariant(status: InvitationDeliveryJobStatus) {
  if (status === InvitationDeliveryJobStatus.SENT) return "default" as const;
  if (status === InvitationDeliveryJobStatus.FAILED) return "destructive" as const;
  if (status === InvitationDeliveryJobStatus.CANCELLED) return "outline" as const;
  return "secondary" as const;
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Entregas de invitaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-5">
            <div className="rounded-lg border p-3"><div className="text-muted-foreground">Pendientes</div><strong>{counts.PENDING}</strong></div>
            <div className="rounded-lg border p-3"><div className="text-muted-foreground">Procesando</div><strong>{counts.PROCESSING}</strong></div>
            <div className="rounded-lg border p-3"><div className="text-muted-foreground">Reintentos</div><strong>{counts.RETRY_SCHEDULED}</strong></div>
            <div className="rounded-lg border p-3"><div className="text-muted-foreground">Enviadas</div><strong>{counts.SENT}</strong></div>
            <div className="rounded-lg border p-3"><div className="text-muted-foreground">Fallidas</div><strong>{counts.FAILED}</strong></div>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Invitación</TableHead><TableHead>Estado</TableHead><TableHead>Intentos</TableHead>
              <TableHead>Próximo intento</TableHead><TableHead>Detalle</TableHead><TableHead>Acción</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {invitationJobs.length === 0 ? <TableRow><TableCell colSpan={6} className="text-muted-foreground">Todavía no hay entregas de invitaciones registradas.</TableCell></TableRow> : invitationJobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell><div className="break-all font-medium">{job.invitation.email}</div><div className="mt-1 text-xs text-muted-foreground">{job.invitation.family?.name ?? "Sin familia"} · versión {job.tokenVersion}</div></TableCell>
                  <TableCell><Badge variant={jobStatusVariant(job.status)}>{jobStatusLabel(job.status)}</Badge></TableCell>
                  <TableCell>{job.attemptCount}</TableCell>
                  <TableCell className="text-xs">{formatDate(job.nextAttemptAt)}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-xs text-muted-foreground" title={job.lastError ?? undefined}>{job.lastError ?? job.lastErrorCode ?? job.providerMessageId ?? "-"}</TableCell>
                  <TableCell>{canManage && job.status === InvitationDeliveryJobStatus.FAILED ? <form action={requeueFailedInvitationDeliveryJobAction}><input type="hidden" name="jobId" value={job.id} /><Button type="submit" variant="outline" className="h-8 px-2 text-xs">Reencolar</Button></form> : "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Historial de mailing</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Asunto</TableHead><TableHead>Destinatarios</TableHead><TableHead>Estado</TableHead><TableHead>Proveedor</TableHead><TableHead>Creado</TableHead><TableHead>Error</TableHead></TableRow></TableHeader>
            <TableBody>
              {messages.length === 0 ? <TableRow><TableCell colSpan={7} className="text-muted-foreground">Todavía no hay emails registrados.</TableCell></TableRow> : messages.map((message) => (
                <TableRow key={message.id}><TableCell>{typeLabel(message.type)}</TableCell><TableCell className="max-w-[260px] truncate">{message.subject}</TableCell><TableCell className="max-w-[240px] text-xs text-slate-600">{message.recipients.map((recipient) => recipient.email).join(", ")}</TableCell><TableCell><Badge variant={statusVariant(message.status)}>{statusLabel(message.status)}</Badge></TableCell><TableCell className="text-xs text-slate-600">{message.providerMessageId ? `${message.provider}:${message.providerMessageId}` : message.provider}</TableCell><TableCell>{formatDate(message.createdAt)}</TableCell><TableCell className="max-w-[280px] truncate text-xs text-slate-600">{message.error ?? "-"}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
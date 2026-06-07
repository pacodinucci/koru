import { EmailDeliveryStatus, EmailMessageType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listEmailMessagesForAdmin } from "@/modules/mailing/server/mailing.actions";

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function typeLabel(type: EmailMessageType) {
  const labels: Record<EmailMessageType, string> = {
    USER_INVITATION: "Invitación",
    CALENDAR_EVENT: "Evento",
    BLOG_POST: "Nota",
    MANUAL: "Manual",
  };

  return labels[type];
}

function statusLabel(status: EmailDeliveryStatus) {
  const labels: Record<EmailDeliveryStatus, string> = {
    PENDING: "Pendiente",
    SENT: "Enviado",
    FAILED: "Falló",
  };

  return labels[status];
}

function statusVariant(status: EmailDeliveryStatus) {
  if (status === EmailDeliveryStatus.SENT) {
    return "default" as const;
  }

  if (status === EmailDeliveryStatus.FAILED) {
    return "destructive" as const;
  }

  return "secondary" as const;
}

export async function DashboardMailingView() {
  const messages = await listEmailMessagesForAdmin();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de mailing</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Asunto</TableHead>
                <TableHead>Destinatarios</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    Todavía no hay emails registrados.
                  </TableCell>
                </TableRow>
              ) : (
                messages.map((message) => (
                  <TableRow key={message.id}>
                    <TableCell>{typeLabel(message.type)}</TableCell>
                    <TableCell className="max-w-[260px] truncate">
                      {message.subject}
                    </TableCell>
                    <TableCell className="max-w-[240px] text-xs text-slate-600">
                      {message.recipients
                        .map((recipient) => recipient.email)
                        .join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(message.status)}>
                        {statusLabel(message.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {message.providerMessageId
                        ? `${message.provider}:${message.providerMessageId}`
                        : message.provider}
                    </TableCell>
                    <TableCell>{formatDate(message.createdAt)}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-xs text-slate-600">
                      {message.error ?? "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

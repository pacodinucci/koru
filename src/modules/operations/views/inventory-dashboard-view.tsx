import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isSuperAdminRole, type AppUserRole } from "@/modules/auth/roles";
import { InventoryRequestDecisionForm } from "@/modules/operations/components/inventory-request-decision-form";
import { InventoryRequestForm } from "@/modules/operations/components/inventory-request-form";
import { adjustInventoryStockAction, cancelInventoryRequestAction, createInventoryProductAction, decideInventoryRequestLineAction, registerInventoryStockMovementAction, reverseInventoryMovementAction, setInventoryMinimumStockAction } from "@/modules/operations/server/inventory.actions";
import { listInventoryMovementsForAdmin, listInventoryProductsBelowMinimum, listInventoryProductsWithStock, listInventoryRequestsForReview, listTeacherInventoryRequests } from "@/modules/operations/server/inventory.repository";

type Props = { user: { id: string; role: AppUserRole } };
type ReactFormAction = (formData: FormData) => void | Promise<void>;
const fieldClass = "h-9 rounded-md border border-slate-300 bg-white px-3 text-sm";
const formAction = (action: (...args: never[]) => Promise<unknown>) => action as unknown as ReactFormAction;

export async function InventoryDashboardView({ user }: Props) {
  const admin = isAdminRole(user.role);
  const superAdmin = isSuperAdminRole(user.role);
  const teacher = await prisma.teacherProfile.findUnique({ where: { userId: user.id }, select: { id: true } });
  const [products, lowStock, pendingRequests, requests, movements] = await Promise.all([
    listInventoryProductsWithStock(),
    admin ? listInventoryProductsBelowMinimum() : Promise.resolve([]),
    admin ? listInventoryRequestsForReview() : Promise.resolve([]),
    teacher ? listTeacherInventoryRequests(teacher.id) : Promise.resolve([]),
    admin ? listInventoryMovementsForAdmin() : Promise.resolve([]),
  ]);

  return <div className="flex max-w-6xl flex-col gap-6">
    <header><h1 className="text-2xl font-semibold text-slate-900">Inventario</h1><p className="mt-1 text-sm text-slate-600">Productos, solicitudes, stock y movimientos.</p></header>

    {teacher ? <section className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Solicitar productos</CardTitle></CardHeader><CardContent><InventoryRequestForm products={products.map((product) => ({ id: product.id, name: product.name, unit: product.unit, stock: product.stock }))} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Mis solicitudes</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">
        {requests.length ? requests.map((request) => <article key={request.id} className="space-y-2 border-t pt-3 first:border-0 first:pt-0">
          <div className="flex items-start justify-between gap-2"><div><p className="font-medium">Pedido {request.id.slice(-6)} · {request.status}</p>{request.lines.map((line) => <p key={line.id} className="text-slate-600">{line.product.name}: {Number(line.requestedQuantity)} {line.product.unit}{line.approvedQuantity !== null ? ` · aprobado ${Number(line.approvedQuantity)}` : ""}</p>)}</div>
          {request.status === "PENDING" ? <form action={formAction(cancelInventoryRequestAction.bind(null, request.id))}><Button size="sm" type="submit" variant="outline">Cancelar</Button></form> : null}</div>
          {request.decisionReason ? <p className="text-xs text-slate-500">{request.decisionReason}</p> : null}
        </article>) : <p className="text-slate-500">Todavía no hay solicitudes.</p>}
      </CardContent></Card>
    </section> : null}

    {admin ? <section className="grid gap-4 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)]">
      <Card><CardHeader><CardTitle>Alertas de stock ({lowStock.length})</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{lowStock.length ? lowStock.map((product) => <p key={product.id}><strong>{product.name}</strong>: {product.stock} {product.unit} (mínimo {Number(product.minimumStock)})</p>) : <p className="text-slate-500">Sin alertas de stock.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Solicitudes pendientes ({pendingRequests.length})</CardTitle></CardHeader><CardContent className="space-y-4 text-sm">
        {pendingRequests.length ? pendingRequests.map((request) => request.lines.length === 1 ? request.lines.map((line) => <form key={line.id} action={formAction(decideInventoryRequestLineAction)} className="grid gap-2 border-t pt-3 first:border-0 first:pt-0"><input type="hidden" name="lineId" value={line.id} /><p>{request.teacher.displayName} · {line.product.name} · solicita {Number(line.requestedQuantity)}</p><input className={fieldClass} name="approvedQuantity" type="number" min="0" max={Number(line.requestedQuantity)} step="0.001" defaultValue={Number(line.requestedQuantity)} required /><input className={fieldClass} name="reason" placeholder="Motivo si hay diferencia" /><Button type="submit" variant="outline">Resolver línea</Button></form>) : <InventoryRequestDecisionForm key={request.id} requestId={request.id} teacherName={request.teacher.displayName} lines={request.lines.map((line) => ({ id: line.id, productName: line.product.name, requestedQuantity: Number(line.requestedQuantity) }))} />) : <p className="text-slate-500">No hay solicitudes pendientes.</p>}
      </CardContent></Card>
    </section> : null}

    {superAdmin ? <Card><CardHeader><CardTitle>Catálogo y configuración</CardTitle></CardHeader><CardContent className="grid gap-6 lg:grid-cols-2">
      <form action={formAction(createInventoryProductAction)} className="grid gap-2"><input className={fieldClass} name="name" placeholder="Producto" required /><input className={fieldClass} name="unit" placeholder="Unidad (pieza, caja, ml)" required /><input className={fieldClass} name="minimumStock" type="number" min="0" step="0.001" placeholder="Stock mínimo" required /><Button type="submit">Crear producto</Button></form>
      <div className="space-y-3">{products.map((product) => <form key={product.id} action={formAction(setInventoryMinimumStockAction)} className="flex gap-2"><input type="hidden" name="productId" value={product.id} /><span className="min-w-36 self-center text-sm">{product.name}</span><input className={fieldClass} name="minimumStock" type="number" min="0" step="0.001" defaultValue={Number(product.minimumStock)} /><Button type="submit" variant="outline">Actualizar mínimo</Button></form>)}</div>
    </CardContent></Card> : null}

    {admin ? <section className="grid gap-4 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Registrar movimiento</CardTitle></CardHeader><CardContent className="space-y-5">
        <form action={formAction(registerInventoryStockMovementAction)} className="grid gap-2"><select className={fieldClass} name="productId" required><option value="">Ingreso de stock para…</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input className={fieldClass} name="quantity" type="number" min="0.001" step="0.001" placeholder="Cantidad" required /><input className={fieldClass} name="unitCost" type="number" min="0" step="0.01" placeholder="Costo unitario (opcional)" /><input className={fieldClass} name="reason" placeholder="Motivo / referencia" required /><Button type="submit">Registrar ingreso</Button></form>
        <form action={formAction(adjustInventoryStockAction)} className="grid gap-2 border-t pt-4"><select className={fieldClass} name="productId" required><option value="">Producto a ajustar</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select><input className={fieldClass} name="quantity" type="number" step="0.001" placeholder="Ajuste positivo o negativo" required /><input className={fieldClass} name="reason" placeholder="Motivo" required /><Button type="submit" variant="outline">Registrar ajuste</Button></form>
      </CardContent></Card>
      <Card><CardHeader><CardTitle>Historial de movimientos</CardTitle></CardHeader><CardContent className="space-y-4">
        {movements.length ? movements.map((movement) => <div key={movement.id} className="flex items-center justify-between gap-3 border-t pt-3 text-sm first:border-0 first:pt-0"><div><p className="font-medium">{movement.product.name} · {movement.type}</p><p className="text-slate-600">{Number(movement.quantity)} {movement.product.unit} · {movement.reason ?? "Sin detalle"}</p></div>{movement.type !== "REVERSAL" && !movement.isReversed ? <form action={formAction(reverseInventoryMovementAction.bind(null, movement.id))}><Button size="sm" type="submit" variant="outline">Revertir</Button></form> : <span className="text-xs text-slate-500">{movement.isReversed ? "Revertido" : "Reversión"}</span>}</div>) : <p className="text-slate-500">Todavía no hay movimientos.</p>}
      </CardContent></Card>
    </section> : null}
  </div>;
}

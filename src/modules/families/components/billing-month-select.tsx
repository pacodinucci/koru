import { BILLING_MONTHS } from "@/modules/families/lib/annual-plan";
export function BillingMonthSelect({ name = "startMonth", defaultValue, value, onChange, label }: { name?: string; defaultValue?: number; value?: string; onChange?: (value: string) => void; label?: string }) {
 return <select name={name} defaultValue={defaultValue} value={value} onChange={onChange ? event => onChange(event.target.value) : undefined} aria-label={label} className="h-9 w-full min-w-0 rounded-md border border-input bg-background px-3 text-sm" required>{BILLING_MONTHS.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select>;
}

import { UserRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { FernShape } from "@/components/fern-shape";

type KoruIdCardProps = {
  studentId: string;
  firstName: string;
  lastName: string;
  groupName: string;
};

const fernColors = ["var(--brand-500)", "var(--complement-700)", "var(--orange-500)"];
// Fixed scattered positions keep the pattern stable across server and client renders.
const ferns = [
  { x: 8, y: 5, rotate: -32 },
  { x: 67, y: 11, rotate: 24 },
  { x: 39, y: 25, rotate: -12 },
  { x: 80, y: 38, rotate: 48 },
  { x: 12, y: 48, rotate: 16 },
  { x: 59, y: 58, rotate: -40 },
  { x: 27, y: 73, rotate: 34 },
  { x: 72, y: 84, rotate: -18 },
  { x: 3, y: 91, rotate: -52 },
];

export function KoruIdCard({ studentId, firstName, lastName, groupName }: KoruIdCardProps) {
  const fullName = `${firstName} ${lastName}`.trim();

  return (
    <Link href={`/family-dashboard/expediente#alumno-${encodeURIComponent(studentId)}`} aria-label={`Ver expediente de ${fullName}`} className="group block min-w-0 w-full max-w-[360px] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-[transform,box-shadow,border-color] duration-300 ease-out hover:border-[var(--brand-300)] hover:shadow-[0_14px_32px_-10px_rgba(90,62,153,0.4)] active:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-500)] focus-visible:ring-offset-4 motion-safe:hover:-translate-y-1 motion-safe:hover:-rotate-1 motion-safe:active:translate-y-0 motion-safe:active:rotate-0 motion-safe:active:scale-[0.97] motion-reduce:transition-none [container-type:inline-size]">
      <div className="relative isolate min-h-[57cqw] bg-[var(--brand-700)] text-white">
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-[32%] overflow-hidden bg-white">
          {ferns.map((fern, index) => (
            <FernShape
              key={index}
              color={fernColors[index % fernColors.length]}
              size="4.5cqw"
              x={`${fern.x}%`}
              y={`${fern.y}%`}
              opacity={0.55}
              rotate={fern.rotate}
            />
          ))}
        </div>

        <div className="relative z-10 flex min-h-[57cqw] w-[49%] flex-col items-center px-[4cqw] pb-[5cqw] pt-[4cqw] text-center">
          <Image
            src="/branding/koru-logo-white.png"
            alt="Koru"
            width={1536}
            height={1024}
            sizes="(max-width: 767px) 40vw, 240px"
            className="h-[23cqw] w-full object-contain"
          />
          <p className="mb-[2cqw] text-[2cqw] font-semibold tracking-[0.25em] text-white/75">Koru ID</p>
          <h2 className="mt-auto w-full font-[family-name:var(--font-montserrat)] text-[4.5cqw] leading-tight font-bold [overflow-wrap:anywhere]">{fullName}</h2>
          <p className="mt-[1.5cqw] w-full text-[3cqw] leading-snug font-medium text-white/90 [overflow-wrap:anywhere]">{groupName}</p>
        </div>

        <div role="img" aria-label="Avatar del alumno" className="absolute top-1/2 left-[51%] z-10 flex aspect-square w-[43%] -translate-y-1/2 items-center justify-center overflow-hidden rounded-full border-[1.2cqw] border-[var(--complement-600)] bg-[var(--brand-300)] text-[var(--brand-700)] ring-[1.2cqw] ring-white">
          <UserRound aria-hidden="true" strokeWidth={1.25} className="size-[65%]" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 z-20 w-1/2 -skew-x-12 bg-linear-to-r from-transparent via-white/20 to-transparent opacity-0 motion-safe:transition-[transform,opacity] motion-safe:duration-700 motion-safe:ease-out motion-safe:group-hover:translate-x-[350%] motion-safe:group-hover:opacity-100 motion-reduce:transition-none" />
      </div>
    </Link>
  );
}

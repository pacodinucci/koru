"use client";

import Image from "next/image";
import { useState } from "react";

const integralAspects = [
  {
    label: "Aspecto f\u00edsico",
    icon: "/assets/svg-integral/body-outline-svgrepo-com.svg",
    color: "bg-[#8bd7e6]",
    position: "left-[23%] top-[18%]",
    labelPosition:
      "right-[calc(100%+1.35rem)] top-1/2 -translate-y-1/2 text-right",
    size: "h-[4.65rem] w-[4.65rem]",
  },
  {
    label: "Aspecto mental",
    icon: "/assets/svg-integral/mind-smart-light-bulb-svgrepo-com.svg",
    color: "bg-[#ffe04a]",
    position: "left-[15%] top-[45%]",
    labelPosition:
      "right-[calc(100%+1.35rem)] top-1/2 -translate-y-1/2 text-right",
    size: "h-[4.65rem] w-[4.65rem]",
  },
  {
    label: "Aspecto emocional",
    icon: "/assets/svg-integral/heart-svgrepo-com.svg",
    color: "bg-[#f86ac6]",
    position: "left-[22%] top-[72%]",
    labelPosition:
      "right-[calc(100%+1.35rem)] top-1/2 -translate-y-1/2 text-right",
    size: "h-[4.85rem] w-[4.85rem]",
  },
  {
    label: "Aspecto sabidur\u00eda interior",
    icon: "/assets/svg-integral/mandala-svgrepo-com.svg",
    color: "bg-[#f86ac6]",
    position: "right-[22%] top-[19%]",
    labelPosition:
      "left-[calc(100%+1.35rem)] top-1/2 -translate-y-1/2 text-left",
    size: "h-[4.65rem] w-[4.65rem]",
  },
  {
    label: "Aspecto social",
    icon: "/assets/svg-integral/connection-pattern-1105-svgrepo-com.svg",
    color: "bg-[#ffe04a]",
    position: "right-[15%] top-[43%]",
    labelPosition:
      "left-[calc(100%+1.35rem)] top-1/2 -translate-y-1/2 text-left",
    size: "h-[4.65rem] w-[4.65rem]",
  },
  {
    label: "Aspecto intuitivo-creador",
    icon: "/assets/svg-integral/eye-svgrepo-com.svg",
    color: "bg-[#8bd7e6]",
    position: "right-[23%] top-[69%]",
    labelPosition:
      "left-[calc(100%+1.35rem)] top-1/2 -translate-y-1/2 text-left",
    size: "h-[4.85rem] w-[4.85rem]",
  },
];

const chainPath =
  "M250 112 C355 32 552 34 687 116 C730 142 759 171 752 216 C744 266 718 303 676 326 C550 396 374 392 243 339 C191 318 166 276 176 224 C185 176 207 139 250 112Z";

function IntegralAspectNode({
  aspect,
  isActive,
  onActivate,
  onDeactivate,
}: {
  aspect: (typeof integralAspects)[number];
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  return (
    <div className={`absolute ${aspect.position}`}>
      <button
        type="button"
        className={`group relative flex ${aspect.size} items-center justify-center rounded-full ${aspect.color} shadow-sm ring-1 ring-black/5 outline-none transition duration-300 hover:-translate-y-1 hover:scale-[1.06] hover:shadow-lg focus-visible:-translate-y-1 focus-visible:scale-[1.06] focus-visible:ring-2 focus-visible:ring-[var(--complement-800)] ${
          isActive
            ? "-translate-y-1 scale-[1.06] shadow-lg ring-2 ring-[var(--complement-800)]"
            : ""
        }`}
        aria-label={aspect.label}
        aria-pressed={isActive}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onFocus={onActivate}
        onBlur={onDeactivate}
        onClick={onActivate}
      >
        <span
          className={`pointer-events-none absolute -inset-2 rounded-full border border-[var(--complement-700)] transition duration-300 ${
            isActive ? "opacity-70 scale-100" : "opacity-0 scale-90"
          }`}
          aria-hidden="true"
        />
        <Image
          src={aspect.icon}
          alt=""
          width={48}
          height={48}
          className={`h-[58%] w-[58%] object-contain transition duration-300 [filter:sepia(1)_saturate(1.8)_hue-rotate(145deg)_brightness(0.75)] ${
            isActive
              ? "opacity-100 scale-110"
              : "opacity-70 group-hover:opacity-95"
          }`}
          aria-hidden="true"
        />
        <p
          className={`pointer-events-none absolute w-[10.5rem] text-[clamp(1rem,1.8vw,1.3rem)] font-medium leading-[1.15] transition duration-300 ${aspect.labelPosition} ${
            isActive
              ? "text-[var(--complement-800)] scale-[1.04]"
              : "text-black group-hover:text-[var(--complement-800)]"
          }`}
        >
          {aspect.label}
        </p>
      </button>
    </div>
  );
}

export function IntegralDevelopmentMap() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasActiveAspect = activeIndex !== null;

  return (
    <div className="mx-auto mt-12 w-full max-w-6xl md:mt-14">
      <div className="relative overflow-hidden bg-[#fdfbf6] px-4 py-8 shadow-sm ring-1 ring-black/[0.03] rounded-[2.5rem_3.5rem_2.75rem_3rem/2.75rem_2.25rem_3.25rem_2.5rem] md:px-8 md:py-10 lg:px-10">
        <style>{`
          @keyframes koruIntegralDotsTravel {
            to { stroke-dashoffset: -120; }
          }

          @media (prefers-reduced-motion: reduce) {
            .koru-integral-dots--active {
              animation: none;
            }
          }
        `}</style>

        <div className="relative mx-auto hidden min-h-[26rem] max-w-[58rem] md:block">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-[var(--orange-500)] opacity-80"
            viewBox="0 0 928 416"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={chainPath}
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.24"
            />
            <path
              d={chainPath}
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0.5 12"
              className={hasActiveAspect ? "koru-integral-dots--active" : ""}
              style={
                hasActiveAspect
                  ? { animation: "koruIntegralDotsTravel 3.8s linear infinite" }
                  : undefined
              }
            />
          </svg>

          <div className="absolute left-1/2 top-1/2 flex h-[15.5rem] w-[13rem] -translate-x-1/2 -translate-y-1/2 items-center justify-center">
            <Image
              src="/assets/svg-integral/kid.svg"
              alt="Autoconocimiento"
              width={220}
              height={220}
              className="h-[13.5rem] w-[13.5rem] object-contain opacity-38"
            />
            <p className="absolute left-1/2 top-[54%] z-10 w-[18rem] -translate-x-1/2 text-center text-[clamp(1.85rem,2.9vw,2.6rem)] font-medium leading-none text-[var(--complement-800)] [font-family:var(--font-indie-flower)]">
              Autoconocimiento
            </p>
          </div>

          {integralAspects.map((aspect, index) => (
            <IntegralAspectNode
              key={aspect.label}
              aspect={aspect}
              isActive={activeIndex === index}
              onActivate={() => setActiveIndex(index)}
              onDeactivate={() => setActiveIndex(null)}
            />
          ))}
        </div>

        <div className="grid gap-4 md:hidden">
          <div className="relative mx-auto flex h-48 w-48 items-center justify-center rounded-[48%_52%_45%_55%/55%_45%_52%_48%] border-2 border-dotted border-[var(--orange-500)]/65">
            <Image
              src="/assets/svg-integral/kid.svg"
              alt="Autoconocimiento"
              width={132}
              height={132}
              className="h-32 w-32 object-contain opacity-38"
            />
            <p className="absolute z-10 text-3xl font-medium leading-none text-[var(--complement-800)] [font-family:var(--font-indie-flower)]">
              Autoconocimiento
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {integralAspects.map((aspect, index) => {
              const isActive = activeIndex === index;

              return (
                <button
                  key={aspect.label}
                  type="button"
                  className={`flex items-center gap-3 rounded-[2rem] bg-white/75 px-4 py-3 text-left shadow-sm ring-1 ring-black/[0.04] transition duration-200 ${
                    isActive
                      ? "scale-[1.02] text-[var(--complement-800)] shadow-md ring-[var(--complement-700)]"
                      : "text-black"
                  }`}
                  aria-pressed={isActive}
                  onClick={() => setActiveIndex(isActive ? null : index)}
                >
                  <span
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${aspect.color}`}
                  >
                    <Image
                      src={aspect.icon}
                      alt=""
                      width={30}
                      height={30}
                      className={`h-7 w-7 object-contain transition duration-200 [filter:sepia(1)_saturate(1.8)_hue-rotate(145deg)_brightness(0.75)] ${
                        isActive ? "opacity-95 scale-110" : "opacity-70"
                      }`}
                      aria-hidden="true"
                    />
                  </span>
                  <span className="text-base font-medium leading-tight">
                    {aspect.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

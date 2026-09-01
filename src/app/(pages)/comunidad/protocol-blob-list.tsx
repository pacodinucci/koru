"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Protocol = {
  id: string;
  title: ReactNode;
  text: ReactNode;
};

type ProtocolBlobListProps = {
  protocols: Protocol[];
};

type OverlayState = {
  protocol: Protocol;
  index: number;
  rect: DOMRect;
  expanded: boolean;
};

const protocolBlobStyles = [
  {
    color: "bg-[color-mix(in_srgb,var(--complement-700)_34%,white)]",
    border: "border-[color-mix(in_srgb,var(--complement-800)_42%,white)]",
    shape: "rounded-[44%_56%_48%_52%/58%_42%_58%_42%]",
    innerShape: "rounded-[58%_42%_52%_48%/45%_55%_44%_56%]",
    innerInset: "inset-[0.34rem]",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_14%,white)]",
    border: "border-[color-mix(in_srgb,var(--orange-500)_30%,white)]",
    shape: "rounded-[56%_44%_61%_39%/42%_58%_42%_58%]",
    innerShape: "rounded-[46%_54%_45%_55%/58%_42%_56%_44%]",
    innerInset: "inset-[0.38rem]",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_20%,white)]",
    border: "border-[color-mix(in_srgb,var(--brand-700)_24%,white)]",
    shape: "rounded-[52%_48%_43%_57%/47%_55%_45%_53%]",
    innerShape: "rounded-[61%_39%_54%_46%/48%_58%_42%_52%]",
    innerInset: "inset-[0.36rem]",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_58%,white)]",
    border: "border-[color-mix(in_srgb,var(--orange-500)_70%,white)]",
    shape: "rounded-[56%_44%_61%_39%/42%_58%_42%_58%]",
    innerShape: "rounded-[48%_52%_39%_61%/42%_58%_53%_47%]",
    innerInset: "inset-[0.32rem]",
  },
];

export function ProtocolBlobList({ protocols }: ProtocolBlobListProps) {
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [overlay, setOverlay] = useState<OverlayState | null>(null);
  const [mobileProtocolIndex, setMobileProtocolIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!overlay && mobileProtocolIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOverlay(null);
        setMobileProtocolIndex(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [overlay, mobileProtocolIndex]);

  function openProtocol(protocol: Protocol, index: number) {
    if (window.matchMedia("(max-width: 1023px)").matches) {
      setOverlay(null);
      setMobileProtocolIndex(index);
      return;
    }

    const button = buttonRefs.current[protocol.id];
    if (!button) return;

    const rect = button.getBoundingClientRect();
    setOverlay({ protocol, index, rect, expanded: false });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setOverlay({ protocol, index, rect, expanded: true });
      });
    });
  }

  return (
    <>
      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        aria-label="Protocolos de cuidado"
      >
        {protocols.map((protocol, index) => {
          const style = protocolBlobStyles[index % protocolBlobStyles.length];

          return (
            <button
              key={protocol.id}
              ref={(node) => {
                buttonRefs.current[protocol.id] = node;
              }}
              type="button"
              aria-haspopup="dialog"
              aria-expanded={
                overlay?.protocol.id === protocol.id ||
                mobileProtocolIndex === index
              }
              onClick={() => openProtocol(protocol, index)}
              className={`group relative flex min-h-[7.75rem] w-full flex-col items-center justify-center overflow-hidden border px-6 py-5 text-center text-[var(--complement-900)] shadow-sm outline-none transition duration-200 hover:scale-[1.03] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--complement-800)] ${style.color} ${style.border} ${style.shape} cursor-pointer`}
            >
              <span
                className={`pointer-events-none absolute z-0 border border-white/70 opacity-70 ${style.innerInset} ${style.innerShape}`}
                aria-hidden="true"
              />
              <span
                className="relative z-10 block text-xl leading-tight"
                style={{ fontFamily: "var(--font-roboto-condensed)" }}
              >
                {protocol.title}
              </span>
            </button>
          );
        })}
      </div>


      {mobileProtocolIndex !== null ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-3 py-8 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="protocol-mobile-modal-title"
          onClick={() => setMobileProtocolIndex(null)}
        >
          {(() => {
            const protocol = protocols[mobileProtocolIndex];
            const style =
              protocolBlobStyles[mobileProtocolIndex % protocolBlobStyles.length];

            return (
              <div
                className={`relative flex min-h-[27rem] w-full max-w-[26rem] overflow-hidden border px-8 py-14 text-center shadow-xl rounded-[45%_55%_47%_53%/34%_34%_66%_66%] ${style.color} ${style.border}`}
                onClick={(event) => event.stopPropagation()}
              >
                <span
                  className="pointer-events-none absolute inset-[0.8rem] z-0 rounded-[42%_58%_50%_50%/38%_37%_63%_62%] border border-white/75"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  className="absolute right-7 top-7 z-20 text-2xl leading-none text-[var(--complement-900)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--complement-800)]"
                  onClick={() => setMobileProtocolIndex(null)}
                  aria-label="Cerrar protocolo"
                >
                  &times;
                </button>
                <div className="relative z-10 flex min-h-[19rem] w-full flex-1 flex-col items-center justify-center gap-5 overflow-hidden text-center">
                  <h3
                    id="protocol-mobile-modal-title"
                    className="max-w-[15rem] break-words text-[clamp(1.28rem,5.3vw,1.65rem)] leading-[1.02] text-[var(--complement-900)] [overflow-wrap:anywhere]"
                    style={{ fontFamily: "var(--font-roboto-condensed)" }}
                  >
                    {protocol.title}
                  </h3>
                  <p className="max-w-[18.5rem] break-words text-base leading-relaxed text-black/75 [overflow-wrap:anywhere] sm:text-lg">
                    {protocol.text}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      ) : null}

      {overlay ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-black/10 backdrop-blur-[1px]"
            onClick={() => setOverlay(null)}
            aria-label="Cerrar protocolo"
          />
          {(() => {
            const style =
              protocolBlobStyles[overlay.index % protocolBlobStyles.length];
            const isExpanded = overlay.expanded;

            return (
              <button
                type="button"
                onClick={() => setOverlay(null)}
                className={`fixed z-10 flex flex-col items-center justify-center overflow-hidden border text-center text-[var(--complement-900)] shadow-xl outline-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:ring-2 focus-visible:ring-[var(--complement-800)] ${style.color} ${style.border} ${style.shape}`}
                style={{
                  left: isExpanded ? "50%" : overlay.rect.left,
                  top: isExpanded ? "50%" : overlay.rect.top,
                  width: isExpanded ? "min(90vw, 42rem)" : overlay.rect.width,
                  height: isExpanded ? "20rem" : overlay.rect.height,
                  padding: isExpanded ? "1.75rem" : "1.25rem 1.5rem",
                  transform: isExpanded
                    ? "translate(-50%, -50%)"
                    : "translate(0, 0)",
                }}
                aria-label="Cerrar protocolo expandido"
              >
                <span
                  className={`pointer-events-none absolute z-0 border border-white/70 transition-opacity duration-500 ${style.innerInset} ${style.innerShape}`}
                  aria-hidden="true"
                />
                <span
                  className="relative z-10 block leading-tight transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    fontFamily: "var(--font-roboto-condensed)",
                    fontSize: isExpanded
                      ? "clamp(2rem, 4vw, 2.6rem)"
                      : "1.25rem",
                    transform: isExpanded
                      ? "translateY(0)"
                      : "translateY(0.25rem)",
                  }}
                >
                  {overlay.protocol.title}
                </span>
                <span
                  className={`relative z-10 max-w-xl overflow-hidden text-base leading-relaxed text-black/75 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:text-lg ${
                    isExpanded
                      ? "mt-5 max-h-40 translate-y-0 opacity-100 delay-100"
                      : "mt-0 max-h-0 translate-y-3 opacity-0"
                  }`}
                >
                  {overlay.protocol.text}
                </span>
              </button>
            );
          })()}
        </div>
      ) : null}
    </>
  );
}

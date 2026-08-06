"use client";

import Image from "next/image";
import { CSSProperties, useState } from "react";

const integralDimensions = [
  {
    label: "Corporal",
    description: "cuerpo y movimiento",
    icon: "/assets/svg-integral/body-outline-svgrepo-com.svg",
    color: "bg-[#8bd7e6]",
    x: "15.6%",
    y: "51.8%",
    labelPosition:
      "right-[calc(100%+1.2rem)] top-1/2 -translate-y-1/2 text-right",
    size: "h-[4.75rem] w-[4.75rem]",
  },
  {
    label: "Cognitiva",
    description: "pensamiento y aprendizaje",
    icon: "/assets/svg-integral/mind-smart-light-bulb-svgrepo-com.svg",
    color: "bg-[#ffe04a]",
    x: "46.3%",
    y: "26.8%",
    labelPosition:
      "right-[calc(100%+1.2rem)] top-1/2 -translate-y-1/2 text-right",
    size: "h-[4.85rem] w-[4.85rem]",
  },
  {
    label: "Emocional",
    description: "gesti\u00f3n y expresi\u00f3n emocional",
    icon: "/assets/svg-integral/heart-svgrepo-com.svg",
    color: "bg-[#f86ac6]",
    x: "77.6%",
    y: "17.9%",
    labelPosition:
      "left-1/2 top-[calc(100%+0.75rem)] -translate-x-1/2 text-center",
    size: "h-[5rem] w-[5rem]",
  },
  {
    label: "Social",
    description: "v\u00ednculos y comunidad",
    icon: "/assets/svg-integral/connection-pattern-1105-svgrepo-com.svg",
    color: "bg-[#ffe04a]",
    x: "73.3%",
    y: "80.4%",
    labelPosition:
      "left-[calc(100%+1.2rem)] top-1/2 -translate-y-1/2 text-left",
    size: "h-[4.85rem] w-[4.85rem]",
  },
  {
    label: "Interior",
    description: "autoconocimiento, intuici\u00f3n, conciencia y prop\u00f3sito",
    icon: "/assets/svg-integral/mandala-svgrepo-com.svg",
    color: "bg-[#8bd7e6]",
    x: "58.2%",
    y: "51.8%",
    labelPosition:
      "left-[calc(100%+1.2rem)] top-1/2 -translate-y-1/2 text-left",
    size: "h-[5.1rem] w-[5.1rem]",
  },
 ];

const dimensionContainerStyles = [
  {
    color: "bg-[color-mix(in_srgb,var(--complement-700)_34%,white)]",
    border: "border-[color-mix(in_srgb,var(--complement-800)_42%,white)]",
    shape: "rounded-[44%_56%_48%_52%/58%_42%_58%_42%]",
    innerShape: "rounded-[58%_42%_52%_48%/45%_55%_44%_56%]",
    innerInset: "inset-[0.45rem]",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_14%,white)]",
    border: "border-[color-mix(in_srgb,var(--orange-500)_30%,white)]",
    shape: "rounded-[56%_44%_61%_39%/42%_58%_42%_58%]",
    innerShape: "rounded-[46%_54%_45%_55%/58%_42%_56%_44%]",
    innerInset: "inset-[0.55rem]",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_20%,white)]",
    border: "border-[color-mix(in_srgb,var(--brand-700)_24%,white)]",
    shape: "rounded-[52%_48%_43%_57%/47%_55%_45%_53%]",
    innerShape: "rounded-[61%_39%_54%_46%/48%_58%_42%_52%]",
    innerInset: "inset-[0.5rem]",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--orange-500)_58%,white)]",
    border: "border-[color-mix(in_srgb,var(--orange-500)_70%,white)]",
    shape: "rounded-[56%_44%_61%_39%/42%_58%_42%_58%]",
    innerShape: "rounded-[48%_52%_39%_61%/42%_58%_53%_47%]",
    innerInset: "inset-[0.42rem]",
  },
  {
    color: "bg-[color-mix(in_srgb,var(--complement-900)_16%,white)]",
    border: "border-[color-mix(in_srgb,var(--complement-900)_34%,white)]",
    shape: "rounded-[47%_53%_56%_44%/57%_43%_52%_48%]",
    innerShape: "rounded-[53%_47%_59%_41%/56%_44%_48%_52%]",
    innerInset: "inset-[0.48rem]",
  },
];

const goldenSpiralPath =
  "M170.0 300.0 C171.2 291.3 173.6 264.8 177.5 247.8 C181.3 230.8 186.6 214.0 193.1 198.0 C199.5 181.9 207.4 166.4 216.2 151.7 C225.1 137.1 235.2 123.1 246.2 110.3 C257.2 97.4 269.3 85.3 282.1 74.5 C294.8 63.7 308.6 53.8 322.8 45.3 C337.0 36.7 352.0 29.3 367.2 23.2 C382.4 17.1 398.2 12.2 414.1 8.7 C429.9 5.1 446.1 2.9 462.1 1.9 C478.2 1.0 494.4 1.4 510.1 3.0 C525.9 4.6 541.7 7.6 556.8 11.7 C572.0 15.7 586.9 21.1 601.0 27.5 C615.2 33.9 628.9 41.5 641.7 50.0 C654.5 58.5 666.6 68.1 677.7 78.4 C688.9 88.8 699.2 100.1 708.4 111.9 C717.7 123.7 725.9 136.4 733.1 149.4 C740.2 162.4 746.2 176.1 751.1 189.9 C756.0 203.7 759.7 218.0 762.3 232.3 C764.9 246.5 766.3 261.1 766.5 275.4 C766.7 289.7 765.8 304.1 763.7 318.0 C761.7 332.0 758.5 345.9 754.3 359.2 C750.1 372.5 744.7 385.5 738.5 397.8 C732.3 410.1 725.0 422.0 717.0 433.0 C709.0 444.0 700.0 454.4 690.5 463.8 C680.9 473.2 670.5 481.9 659.7 489.6 C648.9 497.3 637.4 504.1 625.7 509.9 C614.0 515.7 601.7 520.5 589.3 524.2 C577.0 528.0 564.2 530.7 551.6 532.4 C539.0 534.1 526.2 534.8 513.6 534.4 C501.1 534.1 488.5 532.6 476.3 530.3 C464.2 528.0 452.1 524.6 440.7 520.4 C429.2 516.2 418.0 511.0 407.6 505.1 C397.1 499.2 387.0 492.4 377.8 484.9 C368.5 477.5 359.9 469.3 352.0 460.6 C344.2 451.9 337.1 442.6 330.8 432.9 C324.6 423.2 319.2 413.0 314.7 402.6 C310.1 392.2 306.5 381.3 303.7 370.5 C301.0 359.7 299.2 348.6 298.2 337.6 C297.3 326.7 297.3 315.6 298.1 304.8 C298.9 294.0 300.6 283.3 303.2 272.9 C305.7 262.6 309.1 252.4 313.1 242.8 C317.2 233.2 322.1 223.8 327.6 215.1 C333.1 206.4 339.4 198.1 346.1 190.6 C352.8 183.0 360.2 176.0 367.9 169.7 C375.6 163.4 383.9 157.8 392.4 152.9 C400.8 148.0 409.7 143.9 418.7 140.5 C427.7 137.1 437.0 134.5 446.3 132.7 C455.5 130.9 464.9 129.8 474.2 129.5 C483.4 129.2 492.7 129.7 501.7 130.9 C510.7 132.0 519.7 134.0 528.2 136.5 C536.7 139.1 545.0 142.4 552.9 146.3 C560.7 150.1 568.2 154.6 575.2 159.6 C582.2 164.5 588.7 170.1 594.7 176.0 C600.6 181.9 606.1 188.3 610.9 195.0 C615.7 201.6 620.0 208.7 623.6 215.9 C627.1 223.1 630.1 230.6 632.4 238.1 C634.7 245.6 636.4 253.4 637.5 261.0 C638.5 268.6 638.9 276.3 638.7 283.8 C638.5 291.3 637.6 298.8 636.2 306.0 C634.8 313.3 632.8 320.3 630.3 327.1 C627.8 333.8 624.7 340.3 621.2 346.4 C617.7 352.4 613.7 358.2 609.4 363.5 C605.1 368.8 600.3 373.7 595.3 378.1 C590.3 382.5 584.9 386.4 579.4 389.8 C573.9 393.3 568.1 396.2 562.3 398.6 C556.5 401.0 550.4 402.9 544.4 404.3 C538.5 405.6 532.4 406.5 526.4 406.8 C520.5 407.2 514.5 407.0 508.7 406.4 C503.0 405.8 497.3 404.7 491.9 403.2 C486.5 401.7 481.2 399.7 476.3 397.4 C471.3 395.1 466.6 392.3 462.3 389.3 C458.0 386.3 453.9 382.9 450.3 379.3 C446.6 375.8 443.3 371.9 440.4 367.9 C437.5 363.9 434.9 359.7 432.8 355.4 C430.7 351.2 429.0 346.7 427.7 342.3 C426.3 337.9 425.4 333.4 424.9 329.0 C424.4 324.6 424.2 320.2 424.4 316.0 C424.6 311.7 425.2 307.5 426.1 303.5 C427.0 299.5 428.3 295.7 429.8 292.1 C431.3 288.4 433.1 285.0 435.1 281.8 C437.1 278.7 439.4 275.7 441.8 273.1 C444.2 270.4 446.9 268.0 449.6 265.9 C452.3 263.9 455.2 262.1 458.1 260.6 C461.0 259.1 464.0 257.9 466.9 257.0 C469.9 256.1 472.9 255.5 475.8 255.1 C478.7 254.8 481.6 254.8 484.3 255.0 C487.1 255.1 489.8 255.6 492.3 256.3 C494.8 256.9 497.2 257.8 499.4 258.9 C501.6 259.9 503.7 261.2 505.5 262.6 C507.4 263.9 509.0 265.5 510.5 267.1 C511.9 268.6 513.1 270.4 514.1 272.1 C515.1 273.8 516.1 276.5 516.5 277.3";

function IntegralDimensionNode({
  dimension,
  index,
  isActive,
  onActivate,
  onDeactivate,
}: {
  dimension: (typeof integralDimensions)[number];
  index: number;
  isActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const style = dimensionContainerStyles[index % dimensionContainerStyles.length];

  return (
    <article
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: dimension.x, top: dimension.y } as CSSProperties}
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={onDeactivate}
    >
      <button
        type="button"
        className={`group relative flex min-h-[7.75rem] w-[clamp(10.75rem,13vw,12.9rem)] flex-col items-center justify-center overflow-hidden border px-5 py-4 text-center shadow-sm outline-none transition duration-200 hover:scale-[1.03] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--complement-800)] ${style.color} ${style.border} ${style.shape} ${
          isActive ? "scale-[1.03] shadow-md" : ""
        }`}
        aria-label={`${dimension.label}: ${dimension.description}`}
        aria-pressed={isActive}
        onClick={onActivate}
      >
        <span
          className={`pointer-events-none absolute z-0 border border-white/70 ${style.innerInset} ${style.innerShape}`}
          aria-hidden="true"
        />
        <Image
          src={dimension.icon}
          alt=""
          width={40}
          height={40}
          className={`relative z-10 mb-2 h-9 w-9 object-contain transition duration-200 [filter:sepia(1)_saturate(1.8)_hue-rotate(145deg)_brightness(0.75)] ${
            isActive ? "scale-110 opacity-100" : "opacity-75 group-hover:opacity-95"
          }`}
          aria-hidden="true"
        />
        <span className="relative z-10 block text-[clamp(1.05rem,1.3vw,1.22rem)] font-medium leading-[1.05] text-[var(--complement-900)]">
          {dimension.label}
        </span>
        <span className="relative z-10 mt-1 block max-w-[9.5rem] text-sm leading-tight text-black/55">
          {dimension.description}
        </span>
      </button>
    </article>
  );
}

export function IntegralDevelopmentMap() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasActiveDimension = activeIndex !== null;

  return (
    <div className="mx-auto mt-12 w-full max-w-6xl md:mt-14">
      <div className="relative overflow-hidden bg-[#fdfbf6] px-4 py-8 shadow-sm ring-1 ring-black/[0.03] rounded-[2.5rem_3.5rem_2.75rem_3rem/2.75rem_2.25rem_3.25rem_2.5rem] md:px-8 md:py-10 lg:px-10">
        <h3 className="relative z-10 text-left text-[clamp(1.9rem,3vw,2.75rem)] font-medium leading-none text-[var(--complement-800)] [font-family:var(--font-indie-flower)]">
          Desarrollo integral
        </h3>

        <style>{`
          @keyframes koruIntegralSpiralTravel {
            to { stroke-dashoffset: -130; }
          }

          @media (prefers-reduced-motion: reduce) {
            .koru-integral-spiral--active {
              animation: none;
            }
          }
        `}</style>

        <div className="relative mx-auto mt-2 hidden aspect-[928/560] max-w-[64rem] md:block">
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible text-[var(--orange-500)] opacity-85"
            viewBox="0 0 928 560"
            fill="none"
            aria-hidden="true"
          >
            <path
              d={goldenSpiralPath}
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.2"
            />
            <path
              d={goldenSpiralPath}
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="0.5 12"
              className={
                hasActiveDimension ? "koru-integral-spiral--active" : ""
              }
              style={
                hasActiveDimension
                  ? {
                      animation:
                        "koruIntegralSpiralTravel 4.2s linear infinite",
                    }
                  : undefined
              }
            />
          </svg>

          {integralDimensions.map((dimension, index) => (
            <IntegralDimensionNode
              key={dimension.label}
              dimension={dimension}
              index={index}
              isActive={activeIndex === index}
              onActivate={() => setActiveIndex(index)}
              onDeactivate={() => setActiveIndex(null)}
            />
          ))}
        </div>

        <div className="relative mx-auto mt-6 max-w-sm md:hidden">
          <div
            className="absolute bottom-8 left-1/2 top-8 -translate-x-1/2 border-l-[3px] border-dotted border-[var(--orange-500)] opacity-85"
            aria-hidden="true"
          />

          <div className="relative z-10 grid gap-5">
            {integralDimensions.map((dimension, index) => {
              const isActive = activeIndex === index;
              const style =
                dimensionContainerStyles[index % dimensionContainerStyles.length];

              return (
                <article key={dimension.label} className="flex justify-center">
                  <button
                    type="button"
                    className={`group relative flex min-h-[7.25rem] w-full max-w-[18rem] flex-col items-center justify-center overflow-hidden border px-5 py-4 text-center shadow-sm outline-none transition duration-200 hover:scale-[1.03] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[var(--complement-800)] ${style.color} ${style.border} ${style.shape} ${
                      isActive ? "scale-[1.03] shadow-md" : ""
                    }`}
                    aria-label={`${dimension.label}: ${dimension.description}`}
                    aria-pressed={isActive}
                    onClick={() => setActiveIndex(isActive ? null : index)}
                  >
                    <span
                      className={`pointer-events-none absolute z-0 border border-white/70 ${style.innerInset} ${style.innerShape}`}
                      aria-hidden="true"
                    />
                    <Image
                      src={dimension.icon}
                      alt=""
                      width={40}
                      height={40}
                      className={`relative z-10 mb-2 h-9 w-9 object-contain transition duration-200 [filter:sepia(1)_saturate(1.8)_hue-rotate(145deg)_brightness(0.75)] ${
                        isActive
                          ? "scale-110 opacity-100"
                          : "opacity-75 group-hover:opacity-95"
                      }`}
                      aria-hidden="true"
                    />
                    <span className="relative z-10 block text-[1.15rem] font-medium leading-[1.05] text-[var(--complement-900)]">
                      {dimension.label}
                    </span>
                    <span className="relative z-10 mt-1 block max-w-[12rem] text-sm leading-tight text-black/55">
                      {dimension.description}
                    </span>
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
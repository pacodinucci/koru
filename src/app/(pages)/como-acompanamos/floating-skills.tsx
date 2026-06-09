"use client";

import { useEffect, useRef, useState } from "react";

type FloatingSkillsProps = {
  skills: string[];
};

type FloatingSkill = {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
};

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
  lastX: number;
  lastY: number;
  lastTime: number;
  vx: number;
  vy: number;
};

const MIN_SPEED = 8;
const MAX_SPEED = 42;
const DEFAULT_CHIP_WIDTH = 180;
const DEFAULT_CHIP_HEIGHT = 44;
const PADDING = 22;
const MOBILE_BREAKPOINT = 640;
const MOBILE_PADDING = 14;

function clamp(value: number, min: number, max: number) {
  if (max < min) {
    return min;
  }

  return Math.min(Math.max(value, min), max);
}

function getPadding(width: number) {
  return width < MOBILE_BREAKPOINT ? MOBILE_PADDING : PADDING;
}

function limitVelocity(value: number) {
  return clamp(value, -MAX_SPEED, MAX_SPEED);
}

function ensureMovement(value: number, fallback: number) {
  if (Math.abs(value) >= MIN_SPEED) {
    return value;
  }

  return fallback;
}

function getMeasuredSize(
  label: string,
  index: number,
  width: number,
  measurements: Map<string, { width: number; height: number }>,
) {
  const id = `${label}-${index}`;
  const measured = measurements.get(id);
  const maxWidth = width - getPadding(width) * 2;

  if (measured) {
    return {
      width: Math.min(measured.width, maxWidth),
      height: measured.height,
    };
  }

  if (width < MOBILE_BREAKPOINT) {
    return {
      width: Math.min(Math.max(112, label.length * 7.5 + 30), maxWidth),
      height: DEFAULT_CHIP_HEIGHT,
    };
  }

  return {
    width: DEFAULT_CHIP_WIDTH,
    height: DEFAULT_CHIP_HEIGHT,
  };
}

function createInitialSkills(
  skills: string[],
  width: number,
  height: number,
  measurements = new Map<string, { width: number; height: number }>(),
) {
  const padding = getPadding(width);

  if (width < MOBILE_BREAKPOINT) {
    const titleReserve = width < 380 ? 132 : 118;
    const rowGap = Math.max(68, (height - titleReserve - padding * 2) / skills.length);
    const horizontalOffsets = [0.02, 0.5, 0.18, 0.42, 0.08, 0.56, 0.24];

    return skills.map((label, index) => {
      const size = getMeasuredSize(label, index, width, measurements);
      const maxX = width - size.width - padding;
      const maxY = height - size.height - padding;
      const availableX = Math.max(0, maxX - padding);
      const direction = index % 2 === 0 ? 1 : -1;
      const x = clamp(
        padding + availableX * horizontalOffsets[index % horizontalOffsets.length],
        padding,
        maxX,
      );
      const y = clamp(titleReserve + index * rowGap, padding, maxY);

      return {
        id: `${label}-${index}`,
        label,
        x,
        y,
        vx: direction * (5 + index),
        vy: (index % 3 === 0 ? 1 : -1) * (4 + index * 0.8),
        width: size.width,
        height: size.height,
      };
    });
  }

  const columns = Math.max(2, Math.ceil(Math.sqrt(skills.length)));
  const rowGap = Math.max(
    84,
    (height - padding * 2) / Math.ceil(skills.length / columns),
  );
  const columnGap = Math.max(190, (width - padding * 2) / columns);

  return skills.map((label, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const size = getMeasuredSize(label, index, width, measurements);
    const x = clamp(
      padding + column * columnGap + (index % 2) * 18,
      padding,
      width - size.width - padding,
    );
    const y = clamp(
      padding + row * rowGap + (index % 3) * 12,
      padding,
      height - size.height - padding,
    );
    const direction = index % 2 === 0 ? 1 : -1;

    return {
      id: `${label}-${index}`,
      label,
      x,
      y,
      vx: direction * (12 + index * 2.5),
      vy: (index % 3 === 0 ? 1 : -1) * (10 + index * 1.8),
      width: size.width,
      height: size.height,
    };
  });
}

function resolveCollisions(items: FloatingSkill[]) {
  const restitution = 0.96;

  for (let pass = 0; pass < 3; pass += 1) {
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const a = items[i];
        const b = items[j];
        const aCenterX = a.x + a.width / 2;
        const aCenterY = a.y + a.height / 2;
        const bCenterX = b.x + b.width / 2;
        const bCenterY = b.y + b.height / 2;
        const overlapX =
          a.width / 2 + b.width / 2 - Math.abs(aCenterX - bCenterX);
        const overlapY =
          a.height / 2 + b.height / 2 - Math.abs(aCenterY - bCenterY);

        if (overlapX <= 0 || overlapY <= 0) {
          continue;
        }

        const normalX =
          overlapX < overlapY ? Math.sign(bCenterX - aCenterX) || 1 : 0;
        const normalY =
          overlapX < overlapY ? 0 : Math.sign(bCenterY - aCenterY) || 1;
        const overlap = overlapX < overlapY ? overlapX : overlapY;
        const separation = overlap / 2 + 0.5;

        a.x -= normalX * separation;
        a.y -= normalY * separation;
        b.x += normalX * separation;
        b.y += normalY * separation;

        const relativeVelocityX = b.vx - a.vx;
        const relativeVelocityY = b.vy - a.vy;
        const velocityAlongNormal =
          relativeVelocityX * normalX + relativeVelocityY * normalY;

        if (velocityAlongNormal > 0) {
          continue;
        }

        const impulse = (-(1 + restitution) * velocityAlongNormal) / 2;
        a.vx = limitVelocity(a.vx - impulse * normalX);
        a.vy = limitVelocity(a.vy - impulse * normalY);
        b.vx = limitVelocity(b.vx + impulse * normalX);
        b.vy = limitVelocity(b.vy + impulse * normalY);

        const tangentKick = 0.18;
        a.vx = ensureMovement(
          a.vx + normalY * MIN_SPEED * tangentKick,
          -normalX * MIN_SPEED,
        );
        a.vy = ensureMovement(
          a.vy - normalX * MIN_SPEED * tangentKick,
          -normalY * MIN_SPEED,
        );
        b.vx = ensureMovement(
          b.vx - normalY * MIN_SPEED * tangentKick,
          normalX * MIN_SPEED,
        );
        b.vy = ensureMovement(
          b.vy + normalX * MIN_SPEED * tangentKick,
          normalY * MIN_SPEED,
        );
      }
    }
  }
}

export function FloatingSkills({ skills }: FloatingSkillsProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef(new Map<string, HTMLButtonElement>());
  const itemsRef = useRef<FloatingSkill[]>([]);
  const dragRef = useRef<DragState | null>(null);
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const [items, setItems] = useState<FloatingSkill[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    function readMeasurements() {
      const measurements = new Map<string, { width: number; height: number }>();

      for (const [id, node] of itemRefs.current.entries()) {
        const nodeRect = node.getBoundingClientRect();
        measurements.set(id, {
          width: nodeRect.width,
          height: nodeRect.height,
        });
      }

      return measurements;
    }

    function initialize(activeContainer: HTMLDivElement) {
      const rect = activeContainer.getBoundingClientRect();
      const nextItems = createInitialSkills(
        skills,
        rect.width,
        rect.height,
        readMeasurements(),
      );

      itemsRef.current = nextItems;
      setItems(nextItems.map((item) => ({ ...item })));

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (containerRef.current !== activeContainer) {
            return;
          }

          const measuredRect = activeContainer.getBoundingClientRect();
          const measuredItems = createInitialSkills(
            skills,
            measuredRect.width,
            measuredRect.height,
            readMeasurements(),
          );

          itemsRef.current = measuredItems;
          setItems(measuredItems.map((item) => ({ ...item })));
        });
      });
    }

    initialize(container);
    const resizeObserver = new ResizeObserver(() => initialize(container));
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [skills]);

  useEffect(() => {
    function tick(time: number) {
      const container = containerRef.current;
      if (!container) {
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const previousTime = previousTimeRef.current ?? time;
      const dt = Math.min((time - previousTime) / 1000, 0.04);
      previousTimeRef.current = time;
      const bounds = container.getBoundingClientRect();
      const padding = getPadding(bounds.width);
      const drag = dragRef.current;
      const nextItems = itemsRef.current.map((item) => ({ ...item }));

      for (const item of nextItems) {
        if (drag?.id === item.id) {
          item.vx = drag.vx;
          item.vy = drag.vy;
          continue;
        }

        item.x += item.vx * dt;
        item.y += item.vy * dt;
        item.vx *= 0.999;
        item.vy *= 0.999;

        if (item.x <= padding) {
          item.x = padding;
          item.vx = Math.abs(item.vx) || MIN_SPEED;
        }

        if (item.x + item.width >= bounds.width - padding) {
          item.x = bounds.width - item.width - padding;
          item.vx = -(Math.abs(item.vx) || MIN_SPEED);
        }

        if (item.y <= padding) {
          item.y = padding;
          item.vy = Math.abs(item.vy) || MIN_SPEED;
        }

        if (item.y + item.height >= bounds.height - padding) {
          item.y = bounds.height - item.height - padding;
          item.vy = -(Math.abs(item.vy) || MIN_SPEED);
        }
      }

      resolveCollisions(nextItems);

      for (const item of nextItems) {
        item.x = clamp(item.x, padding, bounds.width - item.width - padding);
        item.y = clamp(item.y, padding, bounds.height - item.height - padding);
        item.vx = limitVelocity(item.vx);
        item.vy = limitVelocity(item.vy);
      }

      itemsRef.current = nextItems;
      setItems(nextItems);
      frameRef.current = requestAnimationFrame(tick);
    }

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  function handlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    item: FloatingSkill,
  ) {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      id: item.id,
      offsetX: event.clientX - containerRect.left - item.x,
      offsetY: event.clientY - containerRect.top - item.y,
      lastX: event.clientX,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      vx: item.vx,
      vy: item.vy,
    };
  }

  function handlePointerMove(event: React.PointerEvent<HTMLButtonElement>) {
    const container = containerRef.current;
    const drag = dragRef.current;
    if (!container || !drag) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const padding = getPadding(containerRect.width);
    const now = event.timeStamp;
    const dt = Math.max((now - drag.lastTime) / 1000, 0.016);
    const nextItems = itemsRef.current.map((item) => ({ ...item }));
    const item = nextItems.find((candidate) => candidate.id === drag.id);

    if (!item) {
      return;
    }

    item.x = clamp(
      event.clientX - containerRect.left - drag.offsetX,
      padding,
      containerRect.width - item.width - padding,
    );
    item.y = clamp(
      event.clientY - containerRect.top - drag.offsetY,
      padding,
      containerRect.height - item.height - padding,
    );
    item.vx = limitVelocity((event.clientX - drag.lastX) / dt);
    item.vy = limitVelocity((event.clientY - drag.lastY) / dt);
    drag.vx = item.vx;
    drag.vy = item.vy;
    drag.lastX = event.clientX;
    drag.lastY = event.clientY;
    drag.lastTime = now;

    resolveCollisions(nextItems);
    itemsRef.current = nextItems;
    setItems(nextItems);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }

    event.currentTarget.releasePointerCapture(event.pointerId);
    const nextItems = itemsRef.current.map((item) =>
      item.id === drag.id
        ? {
            ...item,
            vx: ensureMovement(limitVelocity(drag.vx), MIN_SPEED),
            vy: ensureMovement(limitVelocity(drag.vy), MIN_SPEED),
          }
        : item,
    );

    dragRef.current = null;
    itemsRef.current = nextItems;
    setItems(nextItems);
  }

  return (
    <div
      ref={containerRef}
      className="isolate relative z-0 mt-20 min-h-[42rem] overflow-hidden rounded-[2rem] p-4 md:mt-24 md:min-h-[24rem] md:p-8"
      style={{
        background:
          "radial-gradient(circle at 18% 18%, var(--orange-500) 0%, transparent 30%), radial-gradient(circle at 82% 22%, var(--brand-600) 0%, transparent 34%), radial-gradient(circle at 70% 86%, var(--complement-700) 0%, transparent 38%), linear-gradient(135deg, var(--complement-900) 0%, var(--brand-800) 52%, var(--orange-700) 100%)",
      }}
    >
      <h3
        className="absolute top-6 left-5 z-[1] max-w-[16rem] text-4xl leading-none text-white md:top-8 md:left-8 md:max-w-xl md:text-5xl"
        style={{ fontFamily: "var(--font-indie-flower)" }}
      >
        Habilidades que cultivamos
      </h3>

      {items.map((item, index) => (
        <button
          key={item.id}
          ref={(node) => {
            if (node) {
              itemRefs.current.set(item.id, node);
            } else {
              itemRefs.current.delete(item.id);
            }
          }}
          type="button"
          onPointerDown={(event) => handlePointerDown(event, item)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute z-[2] max-w-[calc(100%-1.75rem)] cursor-grab touch-none select-none rounded-md border border-white/40 bg-white/25 px-3 py-2 text-center text-xs leading-tight font-semibold whitespace-normal text-white shadow-sm backdrop-blur transition-transform active:cursor-grabbing active:scale-105 sm:whitespace-nowrap md:px-4 md:text-sm"
          style={{
            transform: `translate3d(${item.x}px, ${item.y}px, 0)`,
            fontFamily:
              index % 3 === 0
                ? "var(--font-montserrat)"
                : index % 3 === 1
                  ? "var(--font-indie-flower)"
                  : "var(--font-roboto-condensed)",
            letterSpacing: index % 3 === 1 ? "0.04em" : undefined,
          }}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

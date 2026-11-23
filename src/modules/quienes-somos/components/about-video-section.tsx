"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

const videoSrc = "https://res.cloudinary.com/trsbzk8f/video/upload/v1795346887/koru/quienes-somos/institucional-1080p.mp4";
const posterSrc = "/assets/videos/koru-institucional-poster.jpg";

export function AboutVideoSection() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [waiting, setWaiting] = useState(false);

  function playVideo() {
    const video = videoRef.current;
    if (!video) return;

    setFailed(false);
    setWaiting(true);
    setStarted(true);
    // Assign the source only on request; keep play() inside the user gesture.
    video.src = videoSrc;
    video.load();
    video.play().catch(() => {
      setWaiting(false);
      setFailed(true);
    });
  }

  return (
    <section aria-labelledby="about-video-title" className="bg-white px-6 pb-16 md:px-10 lg:px-14 lg:pb-24">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[#6d7e96]">Conoce Koru</p>
          <h2 id="about-video-title" className="text-4xl leading-tight text-black md:text-5xl" style={{ fontFamily: "var(--font-roboto-condensed)" }}>
            Una mirada a nuestra comunidad
          </h2>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-sm bg-black">
          <video
            ref={videoRef}
            aria-label="Video institucional de Koru"
            className="h-full w-full object-contain"
            width={1920}
            height={1080}
            poster={posterSrc}
            preload="none"
            playsInline
            controls={started}
            onWaiting={() => setWaiting(true)}
            onPlaying={() => { setWaiting(false); setFailed(false); }}
            onError={() => { setWaiting(false); setFailed(true); }}
          />
          {!started || failed ? (
            <button
              type="button"
              onClick={playVideo}
              aria-label={failed ? "Reintentar reproducción del video de Koru" : "Reproducir video de Koru con sonido"}
              className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-4 bg-black/20 text-white transition-colors hover:bg-black/35 focus-visible:outline focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-white"
            >
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-black shadow-lg md:h-24 md:w-24">
                <Play aria-hidden="true" className="ml-1 h-8 w-8 fill-current" />
              </span>
              <span className="rounded-full bg-black/65 px-4 py-2 text-sm font-medium">{failed ? "Reintentar" : "Ver video con sonido"}</span>
            </button>
          ) : null}
          {waiting && !failed ? (
            <p role="status" className="pointer-events-none absolute left-4 top-4 rounded bg-black/75 px-3 py-2 text-sm text-white">Cargando video…</p>
          ) : null}
        </div>
        {failed ? (
          <p role="alert" className="mt-4 text-sm text-red-800">No se pudo reproducir el video. Revisa tu conexión e inténtalo de nuevo.</p>
        ) : null}
      </div>
    </section>
  );
}

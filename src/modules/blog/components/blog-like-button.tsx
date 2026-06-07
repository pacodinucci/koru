"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HeartIcon } from "lucide-react";

import { useToast } from "@/components/ui/toast";

type BlogLikeButtonProps = {
  slug: string;
  initialLiked: boolean;
  initialCount: number;
};

export function BlogLikeButton({
  slug,
  initialLiked,
  initialCount,
}: BlogLikeButtonProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, setPending] = useState(false);

  async function onToggle() {
    if (pending) return;

    const prevLiked = liked;
    const prevCount = count;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    setLiked(nextLiked);
    setCount(nextCount);
    setPending(true);

    try {
      const response = await fetch("/api/blog/likes/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (response.status === 401) {
        toast("Iniciá sesión para indicar que te gusta el post.", "error");
        router.push("/sign-in");
        return;
      }

      if (!response.ok) {
        setLiked(prevLiked);
        setCount(prevCount);
        toast("No pudimos actualizar el me gusta.", "error");
        return;
      }

      const data = (await response.json()) as {
        ok?: boolean;
        liked?: boolean;
        count?: number;
      };

      if (!data.ok || typeof data.liked !== "boolean" || typeof data.count !== "number") {
        setLiked(prevLiked);
        setCount(prevCount);
        toast("No pudimos actualizar el me gusta.", "error");
        return;
      }

      setLiked(data.liked);
      setCount(data.count);
      toast(data.liked ? "Me gusta agregado." : "Me gusta quitado.", "success");
    } catch {
      setLiked(prevLiked);
      setCount(prevCount);
      toast("No pudimos actualizar el me gusta.", "error");
    } finally {
      setPending(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={onToggle}
        disabled={pending}
        className="text-[#f25f5c] hover:opacity-80 disabled:opacity-70"
        aria-label="Me gusta"
      >
        <HeartIcon
          className="h-7 w-7"
          strokeWidth={2}
          fill={liked ? "currentColor" : "none"}
        />
      </button>
      <span className="text-sm text-muted-foreground">{count}</span>
    </span>
  );
}

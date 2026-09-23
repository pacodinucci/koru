const WHATSAPP_PHONE_NUMBER = "525513487080";

export function WhatsAppFloatingButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_PHONE_NUMBER}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 inline-flex size-14 items-center justify-center rounded-full text-white shadow-[0_4px_18px_rgba(0,0,0,0.32)] transition-all duration-200 hover:scale-105 hover:bg-[#25D366] hover:shadow-[0_8px_24px_rgba(37,211,102,0.42)] focus-visible:scale-105 focus-visible:bg-[#25D366] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 32 32"
        className="size-8 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
        fill="currentColor"
      >
        <path d="M16.02 3C8.84 3 3 8.84 3 16.02c0 2.3.6 4.55 1.75 6.53L3 29l6.63-1.7A13 13 0 0 0 16.02 29C23.2 29 29 23.2 29 16.02 29 8.84 23.2 3 16.02 3Zm0 23.62c-2.04 0-4.03-.55-5.78-1.58l-.42-.25-3.93 1 1.05-3.83-.28-.44a10.58 10.58 0 1 1 9.36 5.1Zm5.8-7.94c-.32-.16-1.9-.94-2.2-1.05-.3-.1-.51-.16-.73.16-.22.32-.84 1.05-1.03 1.27-.19.21-.38.24-.7.08-1.9-.95-3.15-1.7-4.4-3.86-.33-.57.33-.53.95-1.77.1-.2.05-.38-.03-.54-.08-.16-.73-1.75-1-2.4-.27-.64-.54-.55-.73-.56h-.62c-.21 0-.56.08-.86.4-.3.32-1.13 1.1-1.13 2.67 0 1.57 1.16 3.09 1.32 3.3.16.22 2.27 3.46 5.5 4.85.77.33 1.37.53 1.84.68.77.24 1.47.2 2.03.12.62-.1 1.9-.78 2.16-1.53.27-.76.27-1.4.19-1.54-.08-.13-.3-.21-.62-.37Z" />
      </svg>
    </a>
  );
}

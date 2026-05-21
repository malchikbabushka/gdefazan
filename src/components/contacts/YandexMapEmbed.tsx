import { YANDEX_MAP_WIDGET_SRC, YANDEX_MAPS_OPEN_URL } from "@/lib/contacts";

export function YandexMapEmbed() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <iframe
        title="Карта — ГДЕ ФАЗАН?!, Мытищи"
        src={YANDEX_MAP_WIDGET_SRC}
        className="h-[min(420px,55vh)] w-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
      <div className="border-t border-white/10 px-4 py-3 text-center">
        <a
          href={YANDEX_MAPS_OPEN_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-yellow-200/90 transition hover:text-yellow-100"
        >
          Открыть в Яндекс.Картах
        </a>
      </div>
    </div>
  );
}

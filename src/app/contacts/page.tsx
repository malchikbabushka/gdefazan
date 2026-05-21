import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import { YandexMapEmbed } from "@/components/contacts/YandexMapEmbed";
import {
  STORE_ADDRESS,
  STORE_EMAIL,
  STORE_EMAIL_HREF,
  STORE_PHONE,
  STORE_PHONE_HREF,
} from "@/lib/contacts";
import { repoGetSiteConfig } from "@/lib/server/admin-repository";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Адрес магазина в Мытищах, телефон, email и карта проезда. ГДЕ ФАЗАН?! — тепловизионные прицелы и монокуляры.",
  alternates: { canonical: "/contacts" },
  robots: { index: true, follow: true },
};

export default async function ContactsPage() {
  const config = await repoGetSiteConfig();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          Контакты
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-200/75">
          {config.storeName} — консультация, подбор оптики и выдача заказов по предварительной
          договорённости.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
          <ul className="space-y-5">
            <li className="flex gap-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-yellow-100/90" aria-hidden />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Адрес
                </div>
                <p className="mt-1 text-sm font-medium text-zinc-50">{STORE_ADDRESS}</p>
              </div>
            </li>

            <li className="flex gap-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
              <Phone className="mt-0.5 h-5 w-5 shrink-0 text-yellow-100/90" aria-hidden />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Телефон
                </div>
                <a
                  href={STORE_PHONE_HREF}
                  className="mt-1 inline-block text-sm font-semibold text-yellow-200/95 transition hover:text-yellow-100"
                >
                  {STORE_PHONE}
                </a>
              </div>
            </li>

            <li className="flex gap-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-yellow-100/90" aria-hidden />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Email
                </div>
                <a
                  href={STORE_EMAIL_HREF}
                  className="mt-1 inline-block text-sm font-semibold text-yellow-200/95 transition hover:text-yellow-100"
                >
                  {STORE_EMAIL}
                </a>
              </div>
            </li>

            <li className="flex gap-4 rounded-2xl border border-white/10 bg-black/35 px-4 py-4">
              <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-yellow-100/90" aria-hidden />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Часы работы
                </div>
                <p className="mt-1 text-sm text-zinc-100/90">{config.hours}</p>
              </div>
            </li>
          </ul>

          <YandexMapEmbed />
        </div>

        <p className="mt-8 text-xs text-zinc-400/90">
          <Link href="/shipping-payment" className="font-semibold text-zinc-200/90 hover:text-zinc-50">
            Доставка и оплата
          </Link>
          {" · "}
          <Link href="/warranty" className="font-semibold text-zinc-200/90 hover:text-zinc-50">
            Гарантия и возврат
          </Link>
        </p>
      </div>
    </div>
  );
}

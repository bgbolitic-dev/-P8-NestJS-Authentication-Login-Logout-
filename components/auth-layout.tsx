import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { CONFIG } from "@/lib/config";

// The card shared by the login and register pages

const APP_NAME = "BiGiBi";

interface AuthLayoutProps {
  active: "login" | "register";
  heroTitle: string;
  heroSubtitle: string;
  children: ReactNode;
}

export function AuthLayout({ active, heroTitle, heroSubtitle, children }: AuthLayoutProps) {
  const tabs = [
    { key: "login", label: "Login", href: CONFIG.ROUTES.LOGIN },
    { key: "register", label: "Register", href: CONFIG.ROUTES.REGISTER },
  ] as const;

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-[#cde7e7] via-[#e2f0f0] to-[#f2f8f8] p-4">
      {/* big soft circle behind the card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute size-[52rem] rounded-full bg-white/40"
      />

      {/* CHANGED: a wide landscape card (max-w-6xl on desktop, about 1152 x 704) */}
      <div className="relative h-[min(44rem,calc(100dvh-2rem))] w-full max-w-md animate-in fade-in zoom-in-95 overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#d3efea] to-[#e8f6f3] shadow-2xl shadow-teal-900/10 duration-500 lg:max-w-6xl">
        {/* CHANGED: the left side is now the whole background of the card (desktop only) */}
        <section className="absolute inset-y-0 left-0 hidden w-[56%] flex-col pb-6 pl-10 pr-28 pt-8 lg:flex">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
          </div>

          <div className="mt-8 space-y-3">
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
              {heroTitle}
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">{heroSubtitle}</p>
          </div>

          <div className="relative mt-2 min-h-0 flex-1">
            <Image
              src="/images/houses.svg"
              alt=""
              fill
              unoptimized
              priority
              className="object-contain"
            />
          </div>

          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME} · Illustration by{" "}
            <a href="https://storyset.com" target="_blank" rel="noreferrer" className="underline">
              Storyset
            </a>
          </p>
        </section>

        {/* CHANGED: the white form panel now sits on the right (44% of the card) */}
        <section className="absolute inset-y-0 right-0 flex w-full flex-col bg-white p-6 sm:p-8 lg:w-[44%]">
          {/* CHANGED: NEW - the curved edge between the picture and the form (desktop only) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-y-0 right-full hidden h-full w-36 lg:block"
          >
            {/* the pale outer curve */}
            <path
              d="M45 0 C 0 20 0 40 0 50 C 0 60 0 80 45 100 L100 100 L100 0 Z"
              fill="#ffffff"
              fillOpacity="0.55"
            />
            {/* the solid white curve */}
            <path
              d="M70 0 C 30 20 22 38 22 50 C 22 62 30 80 70 100 L100 100 L100 0 Z"
              fill="#ffffff"
            />
          </svg>

          <div className="relative mx-auto flex w-full max-w-sm rounded-full bg-secondary p-1">
            {tabs.map((t) => (
              <Link
                key={t.key}
                href={t.href}
                aria-current={active === t.key ? "page" : undefined}
                className={`flex-1 rounded-full py-2 text-center text-sm font-medium transition-colors ${
                  active === t.key
                    ? "bg-white text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </div>

          <div className="relative mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col overflow-y-auto py-4">
            <div className="my-auto">{children}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
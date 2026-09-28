"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CircleCheck, Download, Share, SquarePlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { defineCopy } from "@/lib/i18n/core";
import { useCopy } from "@/lib/i18n/client";
import { promptInstall, useInstallState } from "@/lib/pwa";

const copy = defineCopy({
  en: {
    title: "Acceptify AI app",
    description:
      "Install Acceptify on your phone or computer: its own icon, its own window, no browser tabs. Works on Android, iPhone, Windows and Mac.",
    updates: "The app updates itself — there is nothing to download when something new ships.",
    installed: "The app is installed on this device.",
    install: "Install the app",
    installing: "Opening…",
    installedToast: "Acceptify AI is installed",
    iosIntro: "On iPhone and iPad the app is added from Safari:",
    iosStep1: "Open this site in Safari.",
    iosStep2: "Tap Share at the bottom of the screen.",
    iosStep3: "Choose “Add to Home Screen”, then “Add”.",
    manual:
      "In Chrome or Edge, click the install icon on the right of the address bar, or open the browser menu (⋮) and choose “Install Acceptify AI”. If there is no such option, open this site in Chrome or Edge.",
  },
  ru: {
    title: "Приложение Acceptify AI",
    description:
      "Установи Acceptify на телефон или компьютер: своя иконка, своё окно, без вкладок браузера. Работает на Android, iPhone, Windows и Mac.",
    updates: "Приложение обновляется само — скачивать новые версии не нужно.",
    installed: "Приложение установлено на этом устройстве.",
    install: "Установить приложение",
    installing: "Открываю…",
    installedToast: "Acceptify AI установлен",
    iosIntro: "На iPhone и iPad приложение добавляется через Safari:",
    iosStep1: "Открой этот сайт в Safari.",
    iosStep2: "Нажми «Поделиться» внизу экрана.",
    iosStep3: "Выбери «На экран „Домой“», затем «Добавить».",
    manual:
      "В Chrome или Edge нажми значок установки справа в адресной строке или открой меню браузера (⋮) → «Установить Acceptify AI». Если такого пункта нет, открой сайт в Chrome или Edge.",
  },
});

export function InstallAppSettings() {
  const t = useCopy(copy);
  const state = useInstallState();
  const [busy, setBusy] = useState(false);

  async function install() {
    setBusy(true);
    try {
      if (await promptInstall()) toast.success(t.installedToast);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        {state === "installed" ? (
          <p className="flex items-center gap-2 font-medium">
            <CircleCheck className="size-4 text-emerald-500" />
            {t.installed}
          </p>
        ) : null}

        {state === "promptable" ? (
          <Button onClick={install} disabled={busy} className="w-fit gap-2">
            <Download className="size-4" />
            {busy ? t.installing : t.install}
          </Button>
        ) : null}

        {state === "ios" ? (
          <div className="flex flex-col gap-2">
            <p>{t.iosIntro}</p>
            <ol className="flex flex-col gap-2">
              <Step n={1}>{t.iosStep1}</Step>
              <Step n={2} icon={<Share className="size-4" />}>
                {t.iosStep2}
              </Step>
              <Step n={3} icon={<SquarePlus className="size-4" />}>
                {t.iosStep3}
              </Step>
            </ol>
          </div>
        ) : null}

        {state === "manual" ? <p className="text-muted-foreground">{t.manual}</p> : null}

        <p className="text-muted-foreground">{t.updates}</p>
      </CardContent>
    </Card>
  );
}

function Step({ n, icon, children }: { n: number; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
        {n}
      </span>
      <span className="flex items-center gap-2">
        {children}
        {icon}
      </span>
    </li>
  );
}

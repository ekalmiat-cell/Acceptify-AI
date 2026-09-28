import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";

/**
 * Makes the site installable as an app (Android, iPhone, Windows, Mac).
 * The installed app is the live site in its own window, so every deploy
 * reaches it on the next launch — see public/sw.js for what is cached.
 *
 * Russian is the default interface language, so names here are Russian;
 * the pages themselves still follow the language chosen in Settings.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: "Шансы на поступление в 239 университетов, эссе и подготовка — в одном приложении.",
    lang: "ru",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "any",
    // Splash screen matches the icon's own navy so launch looks seamless.
    background_color: "#062a44",
    theme_color: "#0b1f3a",
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Университеты", url: "/dashboard/universities", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Эссе", url: "/dashboard/essays", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Тренировка", url: "/dashboard/training", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}

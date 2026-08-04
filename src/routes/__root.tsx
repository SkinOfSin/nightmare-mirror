import {
  createRootRoute,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      {
        name: "description",
        content:
          "Skin of Sin — Nightmare Mirror by @ANancysilver. Body-horror kaleidoscope with spiders, blood, ritual glyphs, story beats, export stills, and record clips.",
      },
      { title: "Skin of Sin — Nightmare Mirror" },
      { name: "theme-color", content: "#050203" },
      { name: "author", content: "@ANancysilver" },
      {
        property: "og:title",
        content: "Skin of Sin — Nightmare Mirror",
      },
      {
        property: "og:description",
        content:
          "Paint. Something crawls out. Interactive body-horror kaleidoscope — collection piece by @ANancysilver.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
    ],
  }),
  component: RootDocument,
});

function RootDocument() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="m-0 overflow-hidden bg-[#050203]">
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  );
}

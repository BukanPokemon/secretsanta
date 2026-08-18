import './index.css';
import i18n from './i18n/config';
import '@fontsource/cherry-swash/400.css';
import '@fontsource/cherry-swash/700.css';
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, useNavigate, useSearchParams } from "react-router-dom";
import { ReactNode, Suspense, lazy, useEffect } from 'react';

// Route-level code splitting: each page's own chunk (and whatever it alone
// depends on — framer-motion is only used by Pairing, marked/guide content
// only by Guide) loads only when that route is actually visited, instead of
// every visitor downloading all three pages' code up front. Prerendering
// still works unchanged — scripts/prerender.mjs already waits for
// networkidle plus an `h1` selector, which covers the extra chunk fetch.
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Pairing = lazy(() => import('./pages/Pairing').then(m => ({ default: m.Pairing })));
const Guide = lazy(() => import('./pages/Guide').then(m => ({ default: m.Guide })));

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

function Redirect({ to }: { to: string }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`${to}?${searchParams.toString()}`);
  }, []);

  return null;
}

// One URL per language (rather than one URL with a runtime toggle) so each
// locale is independently indexable. The route itself is the source of
// truth for which language renders — this just keeps i18next in sync with
// it, which also persists the choice (i18next-browser-languagedetector
// caches on every changeLanguage() call).
function LocalePage({ lang, children }: { lang: 'id' | 'en'; children: ReactNode }) {
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  return <>{children}</>;
}

function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // i18next-browser-languagedetector already resolved i18n.language from
    // a cached choice (a prior explicit switch) or, failing that, the
    // browser's language — with fallbackLng: 'id' if neither yields a
    // supported language. No need to re-implement that here.
    const preferred = i18n.language?.startsWith('en') ? 'en' : 'id';
    navigate(`/${preferred}/`, { replace: true });
  }, [navigate]);

  return null;
}

const router = createBrowserRouter([{
  path: "/",
  element: <RootRedirect />,
}, {
  path: "/id",
  element: <LocalePage lang="id"><LazyPage><Home /></LazyPage></LocalePage>,
}, {
  path: "/en",
  element: <LocalePage lang="en"><LazyPage><Home /></LazyPage></LocalePage>,
}, {
  path: "/id/panduan",
  element: <LocalePage lang="id"><LazyPage><Guide /></LazyPage></LocalePage>,
}, {
  path: "/en/guide",
  element: <LocalePage lang="en"><LazyPage><Guide /></LazyPage></LocalePage>,
}, {
  path: "/pairing",
  element: <LazyPage><Pairing /></LazyPage>,
}, {
  path: "/pairing.html",
  element: <Redirect to="/pairing" />
}], {
  basename: import.meta.env.BASE_URL,
});

const root = createRoot(document.getElementById("root")!);
root.render(
  <RouterProvider router={router} />
);

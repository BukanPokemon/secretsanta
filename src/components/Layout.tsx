import { t } from "i18next";
import { MenuItem, SideMenu } from "./SideMenu";

export type LayoutProps = {
  menuItems: React.ReactNode[];
  children: React.ReactNode;
  // Mirrors SideMenu's top-left positioning (lg:absolute top-4, anchored to
  // the same container) but pinned to the opposite corner — for a single
  // compact control (like the theme dropdown) that shouldn't compete with
  // the language switcher for the same row.
  topRight?: React.ReactNode;
  // Rendered as its own row below the centered content area (not inside it,
  // and not as a sibling of <Layout> in the page) — a sticky-footer layout:
  // the content area is `flex-1`, so it centers within whatever space is
  // left once the footer's natural height is reserved, which pins the
  // footer to the bottom of the viewport for short content instead of
  // leaving a gap below it, while still just following the content in
  // normal flow (never `position: fixed`) once content is tall enough to
  // scroll.
  footer?: React.ReactNode;
};

export function Layout({ menuItems, children, topRight, footer }: LayoutProps) {
  return (
    // overflow-x-hidden unconditionally (not lg:-scoped like overflow-hidden
    // below it) clips the ~9px of horizontal overflow PostCard's rotate-2
    // transform produces — a rotated box's corners extend past its
    // unrotated width — without touching vertical scroll, which mobile
    // still needs since content there is taller than the viewport.
    <div className="min-h-screen flex flex-col overflow-x-hidden lg:overflow-hidden">
      <div className="flex-1 flex lg:items-center justify-center p-4">
        <div className="container mx-auto max-w-5xl">
          {/* Below lg, this is a plain flex row so the language switcher and
              theme dropdown sit side by side on one line instead of
              stacking — lg:contents drops the row's own box at the lg
              breakpoint so each child's lg:absolute positions it relative
              to the container above (viewport corner), same as before. */}
          <div className="flex flex-row items-start justify-between gap-3 lg:contents">
            <div className="lg:absolute lg:top-4 lg:left-4 lg:z-50">
              <SideMenu>
                {menuItems}
              </SideMenu>
            </div>

            {topRight && (
              <div className="lg:absolute lg:top-4 lg:right-4 lg:z-50">
                {topRight}
              </div>
            )}
          </div>

          <main className="my-12 md:my-16 flex flex-col justify-around lg:flex-row gap-12 md:gap-16">
            {children}
          </main>
        </div>
      </div>

      {footer && <div className="px-4 pb-4">{footer}</div>}
    </div>
  );
}

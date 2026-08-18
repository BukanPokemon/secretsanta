import { t } from "i18next";
import { MenuItem, SideMenu } from "./SideMenu";

export type LayoutProps = {
  menuItems: React.ReactNode[];
  children: React.ReactNode;
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

export function Layout({ menuItems, children, footer }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col lg:overflow-hidden">
      <div className="flex-1 flex lg:items-center justify-center p-4">
        <div className="container mx-auto max-w-5xl">
          <SideMenu>
            {menuItems}
          </SideMenu>

          <main className="my-12 md:my-16 flex flex-col justify-around lg:flex-row gap-12 md:gap-16">
            {children}
          </main>
        </div>
      </div>

      {footer && <div className="px-4 pb-4">{footer}</div>}
    </div>
  );
}

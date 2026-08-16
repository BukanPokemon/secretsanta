import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../i18n/config';
import * as Flags from 'country-flag-icons/react/3x2';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Flag({ className, code }: { className?: string; code: string }) {
  const upperCode = code.toUpperCase();
  const fixedCode = upperCode === `EN` ? `GB` : upperCode;

  const FlagComponent = Flags[fixedCode as keyof typeof Flags];
  return <FlagComponent className={className} />;
}

export function MenuItem({
  icon,
  to,
  onClick,
  children
}: {
  icon: React.ReactNode;
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const contents = (
    <div className="flex items-center select-none">
      <div className={`flex items-center justify-center w-6 mr-2 text-center`}>{icon}</div>
      <div>{children}</div>
    </div>
  );

  const className = `flex bg-white/60 hover:bg-white transition-colors rounded shadow px-2 py-1 cursor-pointer items-baseline`;

  const render = to
    ? to.startsWith(`https://`)
      ? (
        <a className={className} href={to} target={`_blank`} rel="noopener noreferrer">
          {contents}
        </a>
      )
      : <Link className={className} to={to}>{contents}</Link>
    : <div className={className} onClick={onClick}>{contents}</div>;

  return render;
}

// Each locale-prefixed page lives at its own URL (see index.tsx) rather
// than a runtime toggle, so switching language means navigating to the
// equivalent page in the other language, not just calling
// i18n.changeLanguage — that keeps the URL (and what a crawler would index)
// in sync with what's displayed. Pages with no locale-prefixed equivalent
// (like /pairing) just change the active language in place.
function getLocalizedPath(pathname: string, targetLang: string): string | null {
  if (pathname.startsWith('/id/panduan') || pathname.startsWith('/en/guide')) {
    return targetLang === 'id' ? '/id/panduan/' : '/en/guide/';
  }
  if (pathname.startsWith('/id') || pathname.startsWith('/en')) {
    return targetLang === 'id' ? '/id/' : '/en/';
  }
  return null;
}

export function SideMenu({ children }: { children?: React.ReactNode }) {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLanguageClick = (language: string) => {
    const localizedPath = getLocalizedPath(location.pathname, language);
    if (localizedPath) {
      navigate(localizedPath);
    } else {
      i18n.changeLanguage(language);
    }
  };

  return (
    <div className="lg:absolute top-4 left-4 z-50 flex flex-row items-center space-x-2">
      {SUPPORTED_LANGUAGES.map((language) => (
        <MenuItem
          key={language}
          icon={<Flag className="h-3" code={language} />}
          onClick={() => handleLanguageClick(language)}
        >
          {t(`language.name`, { lng: language })}
        </MenuItem>
      ))}
    </div>

  );
}

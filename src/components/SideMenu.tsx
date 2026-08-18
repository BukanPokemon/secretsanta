import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES } from '../i18n/config'
import { Link, useLocation, useNavigate } from 'react-router-dom'

export function MenuItem({
  icon,
  to,
  onClick,
  children,
}: {
  icon: React.ReactNode
  to?: string
  onClick?: () => void
  children: React.ReactNode
}) {
  const contents = (
    <div className="flex items-center select-none">
      <div className={`flex items-center justify-center w-6 mr-2 text-center`}>
        {icon}
      </div>
      <div>{children}</div>
    </div>
  )

  const className = `flex bg-white/60 hover:bg-white transition-colors rounded shadow px-2 py-1 cursor-pointer items-baseline`

  const render = to ? (
    to.startsWith(`https://`) ? (
      <a
        className={className}
        href={to}
        target={`_blank`}
        rel="noopener noreferrer"
      >
        {contents}
      </a>
    ) : (
      <Link className={className} to={to}>
        {contents}
      </Link>
    )
  ) : (
    <div className={className} onClick={onClick}>
      {contents}
    </div>
  )

  return render
}

// Each locale-prefixed page lives at its own URL (see index.tsx) rather
// than a runtime toggle, so switching language means navigating to the
// equivalent page in the other language, not just calling
// i18n.changeLanguage — that keeps the URL (and what a crawler would index)
// in sync with what's displayed. Pages with no locale-prefixed equivalent
// (like /pairing) just change the active language in place.
function getLocalizedPath(pathname: string, targetLang: string): string | null {
  if (pathname.startsWith('/id/panduan') || pathname.startsWith('/en/guide')) {
    return targetLang === 'id' ? '/id/panduan/' : '/en/guide/'
  }
  if (pathname.startsWith('/id') || pathname.startsWith('/en')) {
    return targetLang === 'id' ? '/id/' : '/en/'
  }
  return null
}

export function SideMenu({ children }: { children?: React.ReactNode }) {
  const { i18n, t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLanguageClick = (language: string) => {
    const localizedPath = getLocalizedPath(location.pathname, language)
    if (localizedPath) {
      navigate(localizedPath)
    } else {
      i18n.changeLanguage(language)
    }
  }

  const currentLanguage = i18n.language?.startsWith('en') ? 'en' : 'id'

  return (
    <div className="flex flex-row flex-wrap items-start gap-3">
      {children}
      <div className="flex flex-row items-center gap-1.5">
        {/* sr-only below sm: the caption is what was causing side-scrolling
            on narrow screens once label+dropdown shared a row — still
            programmatically associated with the select via htmlFor, so it's
            not lost for screen readers, just visually hidden until there's
            room for it. */}
        <label
          htmlFor="language-select"
          className="sr-only sm:not-sr-only sm:px-1.5 sm:py-0.5 sm:rounded sm:bg-white/80 text-[10px] font-semibold tracking-wide text-gray-700"
        >
          {t('language.switcherLabel')}
        </label>
        <select
          id="language-select"
          value={currentLanguage}
          onChange={(e) => handleLanguageClick(e.target.value)}
          className="bg-white/60 hover:bg-white transition-colors rounded shadow px-2 py-1 cursor-pointer text-sm"
        >
          {SUPPORTED_LANGUAGES.map((language) => (
            <option key={language} value={language}>
              {t('language.flag', { lng: language })} {t(`language.name`, { lng: language })}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

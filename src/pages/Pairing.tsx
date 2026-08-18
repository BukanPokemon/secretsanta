import '@fontsource/dancing-script/700.css'
import { useEffect, useState } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { decryptText } from '../utils/crypto'
import { decryptAssignmentFragment, AssignmentPayload } from '../utils/links'
import { formatBudget } from '../utils/currency'
import { PostCard } from '../components/PostCard'
import { Trans, useTranslation } from 'react-i18next'
import { MenuItem } from '../components/SideMenu'
import { PageTransition } from '../components/PageTransition'
import { ArrowLeft } from '@phosphor-icons/react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Layout } from '../components/Layout'
import { Confetti } from '../components/Confetti'
import { Fireworks } from '../components/Fireworks'
import { EventMetadata, ReceiverData } from '../types'
import { useDocumentMeta } from '../hooks/useDocumentMeta'

async function loadPairing(
  hash: string,
  searchParams: URLSearchParams,
): Promise<AssignmentPayload> {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash
  if (fragment) {
    return decryptAssignmentFragment(fragment)
  }

  // Legacy links (from before assignment data moved into the URL fragment):
  // `from`/`to`/`info` sit in the query string and `to` is encrypted with
  // the old hardcoded key. Keep decrypting these for at least one season so
  // links already sent out don't break.
  if (searchParams.has(`to`)) {
    const from = searchParams.get('from')!
    const to = searchParams.get('to')!
    const decrypted = await decryptText(to)
    const info = searchParams.get('info') ?? undefined

    try {
      const data = JSON.parse(decrypted) as ReceiverData
      return { from, to: data, info }
    } catch {
      return {
        from,
        to: { name: decrypted, hint: undefined } as ReceiverData,
        info,
      }
    }
  }

  throw new Error(`Missing pairing data`)
}

function formatEventDate(dateStr: string, language: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  if (isNaN(date.getTime())) return dateStr
  return new Intl.DateTimeFormat(language === 'id' ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function Pairing() {
  const { t, i18n } = useTranslation()
  const prefersReducedMotion = useReducedMotion()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assignment, setAssignment] = useState<[string, ReceiverData] | null>(
    null,
  )
  const [instructions, setInstructions] = useState<string | null>(null)
  const [eventInfo, setEventInfo] = useState<EventMetadata | null>(null)
  const [revealed, setRevealed] = useState(false)

  // Every pairing link is unique to one person and meaningless to anyone
  // else — there's nothing here worth a search engine indexing, and a
  // stray cached snippet showing someone's name would be a privacy leak.
  useDocumentMeta({
    title: t('pairing.title'),
    description: t('pairing.explainer'),
    path: '/pairing',
    lang: i18n.language === 'en' ? 'en' : 'id',
    noindex: true,
  })

  useEffect(() => {
    const decryptReceiver = async () => {
      try {
        const payload = await loadPairing(location.hash, searchParams)
        setAssignment([payload.from, payload.to])
        setInstructions(payload.info ?? null)
        setEventInfo(payload.event ?? null)
      } catch (err) {
        console.error('Decryption error:', err)
        setError(t('pairing.error'))
      } finally {
        setLoading(false)
      }
    }

    decryptReceiver()
  }, [location.hash, searchParams, t])

  // The organizer's theme choice travels inside the encrypted payload
  // (EventMetadata.theme), so the recipient's reveal page matches whatever
  // was chosen at generation time — not the recipient's own browser state.
  const theme = eventInfo?.theme ?? 'christmas'
  useEffect(() => {
    if (theme === 'christmas') {
      delete document.body.dataset.theme
    } else {
      document.body.dataset.theme = theme
    }
    return () => {
      delete document.body.dataset.theme
    }
  }, [theme])

  if (error) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center p-6">
        <div className="text-xl text-white text-center max-w-md">{error}</div>
      </div>
    )
  }

  const menuItems = [
    <MenuItem key={`back`} to="/" icon={<ArrowLeft weight={`bold`} />}>
      {t('pairing.startYourOwn')}
    </MenuItem>,
  ]

  const hasEventInfo =
    !!eventInfo &&
    (eventInfo.eventName ||
      eventInfo.eventDate ||
      eventInfo.exchangeDeadline ||
      eventInfo.budgetMin != null ||
      eventInfo.budgetMax != null)

  return (
    <>
      {theme === 'party' && <Confetti />}
      {theme === 'newyear' && <Fireworks />}
      <Layout menuItems={menuItems}>
        <PageTransition>
          <div>
            {!loading && assignment && (
              <PostCard>
                <AnimatePresence mode="wait">
                  {!revealed ? (
                    <motion.div
                      key="pre-reveal"
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.3 }}
                      className="text-center"
                    >
                      <h1 className="text-3xl font-bold mb-4 text-red-700">
                        {t('pairing.title')}
                      </h1>
                      <p className="mb-6 text-gray-600 text-sm max-w-sm mx-auto">
                        {t('pairing.explainer')}
                      </p>
                      <p className="mb-6 text-lg text-gray-700">
                        <Trans
                          i18nKey="pairing.greeting"
                          components={{
                            name: (
                              <span className="font-semibold">
                                {assignment[0]}
                              </span>
                            ),
                          }}
                        />
                      </p>
                      <motion.button
                        type="button"
                        onClick={() => setRevealed(true)}
                        animate={
                          prefersReducedMotion ? undefined : { y: [0, -8, 0] }
                        }
                        transition={{
                          duration: 1.6,
                          repeat: 3,
                          ease: 'easeInOut',
                        }}
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.05 }}
                        className="text-8xl leading-none select-none"
                        aria-label={t('pairing.tapToOpen')}
                      >
                        🎁
                      </motion.button>
                      <p className="mt-4 text-sm text-gray-500">
                        {t('pairing.tapToOpen')}
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="reveal"
                      initial={{ rotateZ: -20, scale: 0, opacity: 0 }}
                      animate={{ rotateZ: 0, scale: 1, opacity: 1 }}
                      transition={{
                        type: 'spring',
                        stiffness: 220,
                        damping: 18,
                      }}
                    >
                      <h1 className="text-3xl font-bold mb-6 text-center text-red-700">
                        {t('pairing.title')}
                      </h1>
                      <p className="mb-6 text-center text-gray-600">
                        <Trans
                          i18nKey="pairing.assignment"
                          components={{
                            name: (
                              <span className="font-semibold">
                                {assignment[0]}
                              </span>
                            ),
                          }}
                        />
                      </p>

                      <div className="text-8xl font-bold text-center p-6 font-dancing-script">
                        {assignment[1].name}
                      </div>

                      <div className="mt-4 space-y-2 text-gray-700 text-center">
                        {assignment[1].hint && (
                          <p>
                            🎁 {t('rules.hintLabel')}: {assignment[1].hint}
                          </p>
                        )}
                        {assignment[1].address && (
                          <p>
                            📍 {t('pairing.address')}: {assignment[1].address}
                          </p>
                        )}
                        {assignment[1].phone && (
                          <p>
                            📞 {t('pairing.phone')}: {assignment[1].phone}
                          </p>
                        )}
                        {assignment[1].notes && (
                          <p>
                            📝 {t('pairing.notes')}: {assignment[1].notes}
                          </p>
                        )}
                        {assignment[1].wishlistUrl && (
                          <p>
                            🔗{' '}
                            <a
                              href={assignment[1].wishlistUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline"
                            >
                              {t('pairing.wishlistLink')}
                            </a>
                          </p>
                        )}
                      </div>

                      {hasEventInfo && eventInfo && (
                        <div className="mt-6 p-4 bg-gray-50 rounded text-sm text-gray-700 text-center">
                          <h3 className="font-semibold mb-2">
                            {eventInfo.eventName || t('pairing.eventInfoTitle')}
                          </h3>
                          <div className="space-y-1">
                            {eventInfo.eventDate && (
                              <p>
                                {t('settings.eventDate')}:{' '}
                                {formatEventDate(
                                  eventInfo.eventDate,
                                  i18n.language,
                                )}
                              </p>
                            )}
                            {eventInfo.exchangeDeadline && (
                              <p>
                                {t('settings.exchangeDeadline')}:{' '}
                                {formatEventDate(
                                  eventInfo.exchangeDeadline,
                                  i18n.language,
                                )}
                              </p>
                            )}
                            {(eventInfo.budgetMin != null ||
                              eventInfo.budgetMax != null) && (
                              <p>
                                {t('settings.budgetRange')}:{' '}
                                {eventInfo.budgetMin != null &&
                                  formatBudget(
                                    eventInfo.budgetMin,
                                    i18n.language,
                                  )}
                                {eventInfo.budgetMin != null &&
                                  eventInfo.budgetMax != null &&
                                  ' – '}
                                {eventInfo.budgetMax != null &&
                                  formatBudget(
                                    eventInfo.budgetMax,
                                    i18n.language,
                                  )}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {instructions && (
                        <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded text-yellow-800 text-sm">
                          {t('pairing.rulesReminder', { instructions })}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </PostCard>
            )}
          </div>
        </PageTransition>
      </Layout>
    </>
  )
}

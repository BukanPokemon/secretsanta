import "@fontsource/dancing-script/700.css";
import { useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { decryptText } from '../utils/crypto';
import { decryptAssignmentFragment, AssignmentPayload } from '../utils/links';
import { PostCard } from '../components/PostCard';
import { Trans, useTranslation } from 'react-i18next';
import { MenuItem } from '../components/SideMenu';
import { PageTransition } from '../components/PageTransition';
import { ArrowLeft, Info } from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { Layout } from "../components/Layout";
import { ReceiverData } from "../types";

async function loadPairing(hash: string, searchParams: URLSearchParams): Promise<AssignmentPayload> {
  const fragment = hash.startsWith('#') ? hash.slice(1) : hash;
  if (fragment) {
    return decryptAssignmentFragment(fragment);
  }

  // Legacy links (from before assignment data moved into the URL fragment):
  // `from`/`to`/`info` sit in the query string and `to` is encrypted with
  // the old hardcoded key. Keep decrypting these for at least one season so
  // links already sent out don't break.
  if (searchParams.has(`to`)) {
    const from = searchParams.get('from')!;
    const to = searchParams.get('to')!;
    const decrypted = await decryptText(to);
    const info = searchParams.get('info') ?? undefined;

    try {
      const data = JSON.parse(decrypted) as ReceiverData;
      return { from, to: data, info };
    } catch {
      return { from, to: { name: decrypted, hint: undefined } as ReceiverData, info };
    }
  }

  throw new Error(`Missing pairing data`);
}

export function Pairing() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<[string, ReceiverData] | null>(null);
  const [instructions, setInstructions] = useState<string | null>(null);

  useEffect(() => {
    const decryptReceiver = async () => {
      try {
        const payload = await loadPairing(location.hash, searchParams);
        setAssignment([payload.from, payload.to]);
        setInstructions(payload.info ?? null);
      } catch (err) {
        console.error('Decryption error:', err);
        setError(t('pairing.error'));
      } finally {
        setLoading(false);
      }
    };

    decryptReceiver();
  }, [location.hash, searchParams, t]);

  if (error) {
    return (
      <div className="min-h-screen bg-red-700 flex items-center justify-center">
        <div className="text-xl text-white">{error}</div>
      </div>
    );
  }

  const menuItems = [
    <MenuItem key={`back`} to="/" icon={<ArrowLeft weight={`bold`}/>}>
      {t('pairing.startYourOwn')}
    </MenuItem>
  ];

  return (
    <Layout menuItems={menuItems}>
      <PageTransition>
        <div>
          {!loading && assignment && (
            <motion.div
              initial={{ rotateZ: -360, scale: 0 }}
              animate={{ rotateZ: 0, scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ ease: `easeIn`, duration: .6 }}
            >
              <PostCard>
                <h1 className="text-3xl font-bold mb-6 text-center text-red-700">
                  {t('pairing.title')}
                </h1>
                <p className="mb-6 text-center text-gray-600">
                  <Trans
                    i18nKey="pairing.assignment"
                    components={{ name: <span className="font-semibold">{assignment[0]}</span> }}
                  />
                </p>

                <div className="text-8xl font-bold text-center p-6 font-dancing-script">
                  {assignment[1].name}
                </div>

                <div className="mt-4 space-y-2 text-gray-700 text-center">
                  {assignment[1].hint && (
                    <p>🎁 {t('rules.hintLabel')}: {assignment[1].hint}</p>
                  )}
                  {assignment[1].address && (
                    <p>📍 {t('pairing.address')}: {assignment[1].address}</p>
                  )}
                  {assignment[1].phone && (
                    <p>📞 {t('pairing.phone')}: {assignment[1].phone}</p>
                  )}
                  {assignment[1].notes && (
                    <p>📝 {t('pairing.notes')}: {assignment[1].notes}</p>
                  )}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded text-yellow-800 text-sm">
                  {t('pairing.rulesReminder', { instructions: instructions || '' })}
                </div>
              </PostCard>
            </motion.div>
          )}
        </div>
      </PageTransition>
    </Layout>
  );
}

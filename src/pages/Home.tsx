import { useState } from 'react';
import { RulesModal } from '../components/RulesModal';
import { GeneratedPairs, generatePairs, diagnoseInfeasibility } from '../utils/generatePairs';
import { Accordion } from '../components/Accordion';
import { AccordionContainer } from '../components/AccordionContainer';
import { ParticipantsList } from '../components/ParticipantsList';
import { ParticipantsTextView } from '../components/ParticipantsTextView';
import { SecretSantaLinks } from '../components/SecretSantaLinks';
import { Participant, EventMetadata } from '../types';
import { PostCard } from '../components/PostCard';
import { useTranslation } from 'react-i18next';
import { PageTransition } from '../components/PageTransition';
import { Code, Rows } from '@phosphor-icons/react';
import { Settings } from '../components/Settings';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Layout } from '../components/Layout';
import { JsonLd } from '../components/JsonLd';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { useWebAnalytics } from '../hooks/useWebAnalytics';
import { downloadEventBackup, parseEventBackup } from '../utils/eventBackup';
import { buildExampleParticipants } from '../utils/exampleParticipants';
import { REPO_URL, ISSUES_URL, SUPPORT_URL } from '../config/site';

export function Home() {
  const { t, i18n } = useTranslation();
  const [isTextView, setIsTextView] = useState(true);

  useWebAnalytics();

  const lang = i18n.language === 'en' ? 'en' : 'id';
  useDocumentMeta({
    title: t('seo.homeTitle'),
    description: t('seo.homeDescription'),
    path: lang === 'id' ? '/id/' : '/en/',
    lang,
    alternates: [
      { lang: 'id', path: '/id/' },
      { lang: 'en', path: '/en/' },
    ],
    ogImagePath: `/og/${lang}.png`,
  });

  const softwareAppJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Tukar Kado',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any (web browser)',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: t('seo.homeDescription'),
  };

  const [participants, setParticipants] = useLocalStorage<Record<string, Participant>>(
    'secretSantaParticipants',
    {},
    (v) => v
  );
  const [assignments, setAssignments] = useLocalStorage<GeneratedPairs | null>(
    'secretSantaAssignments',
    null,
    (v) => v
  );
  const [instructions, setInstructions] = useLocalStorage<string>('secretSantaInstructions', '');
  const [eventMetadata, setEventMetadata] = useLocalStorage<EventMetadata>(
    'secretSantaEventMetadata',
    {},
    (v) => v
  );

  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [openSection, setOpenSection] = useState<'participants' | 'links' | 'settings'>('participants');

  const handleGeneratePairs = () => {
    const assignments = generatePairs(participants);
    if (!assignments) {
      const reason = diagnoseInfeasibility(participants);
      alert(t(reason.key, 'params' in reason ? reason.params : undefined));
      return;
    }
    setAssignments(assignments);
    setOpenSection('links');
  };

  const handleTryExample = () => {
    const exampleParticipants = buildExampleParticipants();
    setParticipants(exampleParticipants);

    // Compute pairings from the freshly-built example directly, rather than
    // relying on `participants` state (which won't reflect the setParticipants
    // call above until the next render) — this is what makes "click it and
    // see generated pairings" a single action instead of two.
    const generated = generatePairs(exampleParticipants);
    if (generated) {
      setAssignments(generated);
      setOpenSection('links');
    }
  };

  const handleExportEvent = () => {
    downloadEventBackup({ version: 1, participants, assignments, instructions, eventMetadata });
  };

  const handleImportEvent = (file: File) => {
    const hasExistingData = Object.keys(participants).length > 0;
    if (hasExistingData && !confirm(t('settings.importConfirm'))) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = parseEventBackup(String(reader.result));
        setParticipants(backup.participants);
        setAssignments(backup.assignments);
        setInstructions(backup.instructions);
        setEventMetadata(backup.eventMetadata);
      } catch (err) {
        console.error('Failed to import event backup:', err);
        alert(t('settings.importError'));
      }
    };
    reader.readAsText(file);
  };

  const viewModeTabs = (
    <div className="mb-3">
      <div role="tablist" className="flex w-full bg-gray-100 rounded-full p-1 gap-1">
        <button
          type="button"
          role="tab"
          aria-selected={!isTextView}
          onClick={() => setIsTextView(false)}
          className={`flex-1 px-3 py-1.5 rounded-full text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
            !isTextView ? 'bg-green-700 text-white' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Rows size={16} weight="bold" />
          {t('participants.formView')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isTextView}
          onClick={() => setIsTextView(true)}
          className={`flex-1 px-3 py-1.5 rounded-full text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
            isTextView ? 'bg-green-700 text-white' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Code size={16} weight="bold" />
          {t('participants.textView')}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-gray-500">
        {t(isTextView ? 'participants.textViewHelp' : 'participants.formViewHelp')}
      </p>
    </div>
  );

  // Bottom center credits — static, not fixed: a fixed footer on a tall
  // mobile page ends up floating over whatever content is scrolled
  // underneath it and intercepting taps meant for that content. Source/
  // issues link the actual fork (trust signal: the code you're running is
  // checkable); the upstream credit below is a separate, distinct link to
  // the original project it's based on. Rendered via Layout's `footer` slot
  // (not as a sibling of <Layout>) so it's part of the centered block
  // instead of always adding its own height below a full 100vh floor.
  const footer = (
    <div className="text-center text-gray-400 text-sm py-4 space-y-1">
      <div className="space-x-3">
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
          {t('home.viewSource')}
        </a>
        <span aria-hidden="true">·</span>
        <a href={`${REPO_URL}/blob/main/CHANGELOG.md`} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
          {t('home.changelog')}
        </a>
        <span aria-hidden="true">·</span>
        <a href={ISSUES_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
          {t('home.reportIssue')}
        </a>
        <span aria-hidden="true">·</span>
        <a href={SUPPORT_URL} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
          {t('home.sponsor')}
        </a>
      </div>
      <div dangerouslySetInnerHTML={{ __html: t('home.vanity') }} />
    </div>
  );

  return (
    <>
      <PageTransition>
        <JsonLd data={softwareAppJsonLd} />
        {/* Layout with empty top menu */}
        <Layout menuItems={[]} footer={footer}>
          {/* Main content */}
          <div className="lg:flex-[6_6_0%]">
            <PostCard>
              <div className="space-y-4">
                <h1 className="text-xl sm:text-2xl font-bold mb-4 text-red-700">
                  {t('home.title')}
                </h1>
                <div className="space-y-4 text-gray-600">
                  {t('home.explanation', { returnObjects: true }).map((line: string, i: number) => (
                    <p key={i} dangerouslySetInnerHTML={{ __html: line }} />
                  ))}
                </div>
              </div>
            </PostCard>
          </div>

          {/* Side panel */}
          <div className="lg:order-none lg:flex-[5_5_0%]">
            <AccordionContainer>
              <Accordion
                title={t('participants.title')}
                isOpen={openSection === 'participants'}
                onToggle={() => setOpenSection('participants')}
                scrollResetKey={isTextView}
              >
                {viewModeTabs}
                {isTextView ? (
                  <ParticipantsTextView
                    participants={participants}
                    onChangeParticipants={setParticipants}
                    onGeneratePairs={handleGeneratePairs}
                  />
                ) : (
                  <ParticipantsList
                    participants={participants}
                    onChangeParticipants={setParticipants}
                    onOpenRules={(id) => {
                      setSelectedParticipantId(id);
                      setIsRulesModalOpen(true);
                    }}
                    onGeneratePairs={handleGeneratePairs}
                    onTryExample={handleTryExample}
                    hasGeneratedPairs={!!assignments}
                    onParticipantRemoved={() => setAssignments(null)}
                  />
                )}
              </Accordion>

              <Accordion
                title={t('settings.title')}
                isOpen={openSection === 'settings'}
                onToggle={() => setOpenSection('settings')}
              >
                <Settings
                  instructions={instructions}
                  onChangeInstructions={setInstructions}
                  eventMetadata={eventMetadata}
                  onChangeEventMetadata={setEventMetadata}
                  onExportEvent={handleExportEvent}
                  onImportEvent={handleImportEvent}
                />
              </Accordion>

              {assignments && (
                <Accordion
                  title={t('links.title')}
                  isOpen={openSection === 'links'}
                  onToggle={() => setOpenSection('links')}
                >
                  <SecretSantaLinks
                    assignments={assignments}
                    instructions={instructions}
                    eventMetadata={eventMetadata}
                    participants={participants}
                    onGeneratePairs={handleGeneratePairs}
                  />
                </Accordion>
              )}
            </AccordionContainer>
          </div>
        </Layout>
      </PageTransition>

      {isRulesModalOpen && selectedParticipantId && (
        <RulesModal
          isOpen={isRulesModalOpen}
          onClose={() => setIsRulesModalOpen(false)}
          participants={participants}
          participantId={selectedParticipantId}
          onChangeParticipants={setParticipants}
        />
      )}
    </>
  );
}

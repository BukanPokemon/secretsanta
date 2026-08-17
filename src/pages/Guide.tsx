import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { Layout } from '../components/Layout';
import { PageTransition } from '../components/PageTransition';
import { PostCard } from '../components/PostCard';
import { JsonLd } from '../components/JsonLd';
import { MenuItem } from '../components/SideMenu';
import { useDocumentMeta } from '../hooks/useDocumentMeta';
import { loadGuide, loadFaq } from '../utils/guideContent';

export function Guide() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'id';
  const homePath = lang === 'id' ? '/id/' : '/en/';
  const guidePath = lang === 'id' ? '/id/panduan/' : '/en/guide/';

  useDocumentMeta({
    title: t('seo.guideTitle'),
    description: t('seo.guideDescription'),
    path: guidePath,
    lang,
    alternates: [
      { lang: 'id', path: '/id/panduan/' },
      { lang: 'en', path: '/en/guide/' },
    ],
    ogImagePath: `/og/${lang}.png`,
  });

  const guide = loadGuide(lang);
  const faq = loadFaq(lang);

  const howToJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.title,
    description: t('seo.guideDescription'),
    step: guide.sections.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.title,
      text: step.bodyText,
    })),
  };

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answerText },
    })),
  };

  const menuItems = [
    <MenuItem key="back" to={homePath} icon={<ArrowLeft weight="bold" />}>
      {t('guide.backToHome')}
    </MenuItem>
  ];

  return (
    <Layout menuItems={menuItems}>
      <PageTransition>
        <JsonLd data={howToJsonLd} />
        <JsonLd data={faqJsonLd} />

        <div className="lg:flex-[7_7_0%]">
          <PostCard>
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-red-700">
              {guide.title}
            </h1>
            <div className="text-gray-600 mb-6" dangerouslySetInnerHTML={{ __html: guide.introHtml }} />

            <div className="space-y-6">
              {guide.sections.map((step, i) => (
                <div key={i}>
                  <h2 className="text-lg font-semibold text-red-700 mb-1">{step.title}</h2>
                  <div className="text-gray-700" dangerouslySetInnerHTML={{ __html: step.bodyHtml }} />
                </div>
              ))}
            </div>

            <h2 className="text-xl font-bold text-red-700 mt-10 mb-4">{t('guide.faqTitle')}</h2>
            <div className="space-y-4">
              {faq.map((item, i) => (
                <div key={i}>
                  <h3 className="font-semibold text-gray-800">{item.question}</h3>
                  <div className="text-gray-600" dangerouslySetInnerHTML={{ __html: item.answerHtml }} />
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-gray-600 mb-3">{t('guide.ctaText')}</p>
              <Link
                to={homePath}
                className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
              >
                {t('guide.ctaButton')}
              </Link>
            </div>
          </PostCard>
        </div>
      </PageTransition>
    </Layout>
  );
}

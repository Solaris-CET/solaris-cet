import { lazy } from 'react';

import Cookies from '@/pages/legal/Cookies';
import GDPR from '@/pages/legal/GDPR';
import Termeni from '@/pages/legal/Termeni';
import HomePage from '@/pages/HomePage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const ServicesPage = lazy(() => import('@/pages/ServicesPage'));
const ServiceDetailPage = lazy(() => import('@/pages/ServiceDetailPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const TokenCetPage = lazy(() => import('@/pages/TokenCetPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const FaqPage = lazy(() => import('@/pages/FaqPage'));
const ArticlesPage = lazy(() => import('@/pages/ArticlesPage'));
const ArticlePage = lazy(() => import('@/pages/ArticlePage'));
const FinancingHubPage = lazy(() => import('@/pages/FinancingHubPage'));
const FinancingCasaVerde2025Page = lazy(() => import('@/pages/FinancingCasaVerde2025Page'));
const FinancingCasaVerdeBaterii2026Page = lazy(() => import('@/pages/FinancingCasaVerdeBaterii2026Page'));
const FinancingRePowerEuPage = lazy(() => import('@/pages/FinancingRePowerEuPage'));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage'));
const SolarCalculatorPage = lazy(() => import('@/pages/SolarCalculatorPage'));
const ThankYouPage = lazy(() => import('@/pages/ThankYouPage'));
const LegalDocPage = lazy(() => import('@/pages/LegalDocPage'));
const PrivacySettingsPage = lazy(() => import('@/pages/PrivacySettingsPage'));
const LocationPage = lazy(() => import('@/pages/LocationPage'));
const LighthousePage = lazy(() => import('@/pages/LighthousePage'));
const DevelopersPage = lazy(() => import('@/pages/DevelopersPage'));
const DocsPage = lazy(() => import('@/pages/DocsPage'));
const DeveloperConsolePage = lazy(() => import('@/pages/DeveloperConsolePage'));
const CommunityPage = lazy(() => import('@/pages/CommunityPage'));
const ForumPage = lazy(() => import('@/pages/ForumPage'));
const ForumPostPage = lazy(() => import('@/pages/ForumPostPage'));
const RewardsPage = lazy(() => import('@/pages/RewardsPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const WalletPage = lazy(() => import('@/pages/WalletPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const TechnicalAnalysisPage = lazy(() => import('@/pages/TechnicalAnalysisPage'));
const AirdropPage = lazy(() => import('@/pages/AirdropPage'));
const NftsPage = lazy(() => import('@/pages/NftsPage'));
const TxHistoryPage = lazy(() => import('@/pages/TxHistoryPage'));
const AuthPage = lazy(() => import('@/pages/AuthPage'));
const DefiHubPage = lazy(() => import('@/pages/DefiHubPage'));
const EventsPage = lazy(() => import('@/pages/EventsPage'));
const PaidLandingPage = lazy(() => import('@/pages/PaidLandingPage'));
const PrelaunchPage = lazy(() => import('@/pages/PrelaunchPage'));
const ThanksPage = lazy(() => import('@/pages/ThanksPage'));
const CetAiPage = lazy(() => import('@/pages/CetAiPage'));
const ContractPage = lazy(() => import('@/pages/ContractPage'));
const RwaPage = lazy(() => import('@/pages/RwaPage'));
const BrandAssetsPage = lazy(() => import('@/pages/BrandAssetsPage'));
const ResponsibleDisclosurePage = lazy(() => import('@/pages/ResponsibleDisclosurePage'));
const BugBountyPage = lazy(() => import('@/pages/BugBountyPage'));
const ReleaseNotesPage = lazy(() => import('@/pages/ReleaseNotesPage'));
const SurveyPage = lazy(() => import('@/pages/SurveyPage'));

export function Router({ routePath }: { routePath: string }) {
  return (
    <>
      {routePath === '/' ? (
        <HomePage />
      ) : routePath === '/servicii' ? (
        <ServicesPage />
      ) : routePath === '/services' ? (
        <NotFoundPage attemptedPath={routePath} staticRedirectHref="/servicii" />
      ) : routePath === '/servicii/atice-fatade-tabla' ? (
        <ServiceDetailPage slug="atice-si-fatade-tabla" />
      ) : routePath === '/servicii/reparatii-mentenanta' ? (
        <ServiceDetailPage slug="reparatii-si-mentenanta" />
      ) : routePath.startsWith('/servicii/') ? (
        <ServiceDetailPage slug={routePath.replace(/^\/servicii\//, '')} />
      ) : routePath === '/contact' ? (
        <ContactPage />
      ) : routePath === '/calculator' ? (
        <SolarCalculatorPage />
      ) : routePath === '/survey' ? (
        <SurveyPage />
      ) : routePath === '/cere-oferta' ? (
        <ContactPage />
      ) : routePath === '/proiecte' || routePath === '/portofoliu' ? (
        <ProjectsPage />
      ) : routePath === '/portfolio' ? (
        <NotFoundPage attemptedPath={routePath} staticRedirectHref="/proiecte" />
      ) : routePath === '/galerie' ? (
        <ProjectsPage />
      ) : routePath === '/vaslui' ? (
        <LocationPage city="Vaslui" slug="vaslui" />
      ) : routePath === '/bacau' ? (
        <LocationPage city="Bacău" slug="bacau" />
      ) : routePath === '/iasi' ? (
        <LocationPage city="Iași" slug="iasi" />
      ) : routePath === '/galati' ? (
        <LocationPage city="Galați" slug="galati" />
      ) : routePath === '/token-cet' ? (
        <TokenCetPage />
      ) : routePath === '/despre' || routePath === '/about' || routePath === '/despre-noi' ? (
        <AboutPage />
      ) : routePath === '/finantare' ? (
        <FinancingHubPage />
      ) : routePath === '/finantare/casa-verde-2025' ? (
        <FinancingCasaVerde2025Page />
      ) : routePath === '/finantare/casa-verde-baterii-2026' ? (
        <FinancingCasaVerdeBaterii2026Page />
      ) : routePath === '/finantare/repowereu' ? (
        <FinancingRePowerEuPage />
      ) : routePath === '/blog' ? (
        <ArticlesPage />
      ) : routePath.startsWith('/blog/') ? (
        <ArticlePage slug={routePath.replace(/^\/blog\//, '')} />
      ) : routePath === '/multumim' ? (
        <ThankYouPage />
      ) : routePath === '/faq' ? (
        <FaqPage />
      ) : routePath === '/lighthouse' ? (
        <LighthousePage />
      ) : routePath === '/developers' ? (
        <DevelopersPage />
      ) : routePath === '/docs' ? (
        <DocsPage />
      ) : routePath === '/console' ? (
        <DeveloperConsolePage />
      ) : routePath === '/comunitate' ? (
        <CommunityPage />
      ) : routePath === '/forum' ? (
        <ForumPage />
      ) : routePath.startsWith('/forum/') ? (
        <ForumPostPage postId={routePath.replace(/^\/forum\//, '')} />
      ) : routePath === '/recompense' ? (
        <RewardsPage />
      ) : routePath === '/login' ? (
        <LoginPage />
      ) : routePath === '/app' ? (
        <AccountPage />
      ) : routePath === '/wallet' ? (
        <WalletPage />
      ) : routePath === '/settings' ? (
        <SettingsPage />
      ) : routePath === '/analysis' ? (
        <TechnicalAnalysisPage />
      ) : routePath === '/airdrop' ? (
        <AirdropPage />
      ) : routePath === '/nfts' ? (
        <NftsPage />
      ) : routePath === '/tx-history' ? (
        <TxHistoryPage />
      ) : routePath === '/privacy' ? (
        <LegalDocPage doc="privacy" />
      ) : routePath === '/terms' ? (
        <LegalDocPage doc="terms" />
      ) : routePath === '/cookies' ? (
        <LegalDocPage doc="cookies" />
      ) : routePath === '/politica-confidentialitate' ? (
        <LegalDocPage doc="privacy" />
      ) : routePath === '/politica-cookies' ? (
        <LegalDocPage doc="cookies" />
      ) : routePath === '/termeni-si-conditii' ? (
        <LegalDocPage doc="terms" />
      ) : routePath === '/privacy-settings' ? (
        <PrivacySettingsPage />
      ) : routePath === '/gdpr' ? (
        <GDPR />
      ) : routePath === '/termeni' ? (
        <Termeni />
      ) : routePath === '/cookies' ? (
        <Cookies />
      ) : routePath === '/auth' ? (
        <AuthPage />
      ) : routePath === '/defi' ? (
        <DefiHubPage />
      ) : routePath === '/evenimente' ? (
        <EventsPage />
      ) : routePath === '/lp/paid' ? (
        <PaidLandingPage />
      ) : routePath === '/prelaunch' ? (
        <PrelaunchPage />
      ) : routePath === '/thanks' ? (
        <ThanksPage />
      ) : routePath === '/cet-ai' ? (
        <CetAiPage />
      ) : routePath === '/contract' ? (
        <ContractPage />
      ) : routePath === '/rwa' ? (
        <RwaPage />
      ) : routePath === '/brand-assets' ? (
        <BrandAssetsPage />
      ) : routePath === '/responsible-disclosure' ? (
        <ResponsibleDisclosurePage />
      ) : routePath === '/bug-bounty' ? (
        <BugBountyPage />
      ) : routePath === '/release-notes' ? (
        <ReleaseNotesPage />
      ) : (
        <NotFoundPage attemptedPath={routePath} />
      )}
    </>
  );
}

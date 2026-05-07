'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface TutorialOverlayProps {
  isDarkMode: boolean;
  onClose: () => void;
  steps?: TutorialStep[];
  storageKey?: string;
}

interface TutorialStep {
  target: string | null;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'center' | 'left';
  tip?: string;
}

const DASHBOARD_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: null,
    title: 'Bienvenue sur LearnFMPA !',
    description: 'Votre plateforme d\'entraînement aux annales de la Faculté de Médecine et de Pharmacie d\'Agadir. Suivez ce tutoriel interactif pour découvrir les fonctionnalités principales — cliquez sur les éléments mis en surbrillance pour les explorer !',
    position: 'center',
  },
  {
    target: '[data-tutorial="greeting"]',
    title: 'Votre espace personnel',
    description: 'Cet encart vous accueille avec un message personnalisé selon l\'heure de la journée. Il vous rappelle votre objectif : progresser vers l\'excellence !',
    position: 'bottom',
  },
  {
    target: '[data-tutorial="quick-stats"]',
    title: 'Statistiques en un coup d\'œil',
    description: 'Retrouvez ici un résumé instantané : nombre de modules disponibles, total de questions d\'annales, chapitres couverts et années d\'études. Ces chiffres se mettent à jour automatiquement.',
    position: 'bottom',
  },
  {
    target: '[data-tutorial="search"]',
    title: 'Recherche rapide',
    description: 'Tapez un mot-clé dans la barre de recherche pour trouver instantanément un module, un chapitre ou une question spécifique. Les résultats apparaissent en temps réel !',
    position: 'bottom',
    tip: 'Astuce : essayez de taper "pharmacologie" ou un nom de chapitre !',
  },
  {
    target: '[data-tutorial="actions"]',
    title: 'Actions rapides',
    description: 'Accédez directement aux sections importantes : consultez la liste complète des modules pour commencer à vous entraîner, ou consultez votre progression pour suivre vos performances.',
    position: 'left',
  },
  {
    target: '[data-tutorial="modules"]',
    title: 'Modules populaires',
    description: 'Les modules les plus utilisés s\'affichent ici sous forme de cartes. Chaque carte montre le nombre de questions et le nombre de chapitres. Cliquez sur un module pour commencer à réviser !',
    position: 'bottom',
    tip: 'Cliquez sur une carte pour accéder aux questions d\'annales !',
  },
  {
    target: '[data-tutorial="cta"]',
    title: 'C\'est parti !',
    description: 'Vous êtes prêt ! Cliquez sur le bouton vert "Explorer les modules" pour accéder à toutes les annales. Vous pouvez également utiliser la barre de navigation en haut pour accéder aux Modules et à votre Progression. Bon courage !',
    position: 'top',
  },
];

const MODULE_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: null,
    title: 'Bienvenue dans le module !',
    description: 'C\'est ici que vous vous entraînerez aux questions d\'annales. Ce tutoriel interactif vous guidera à travers toutes les fonctionnalités disponibles. Suivez les étapes pour tout comprendre !',
    position: 'center',
  },
  {
    target: '[data-tutorial="module-header"]',
    title: 'En-tête du module',
    description: 'Retrouvez le nom du module et le nombre de questions. Le bouton flèche vous permet de revenir au tableau de bord à tout moment.',
    position: 'bottom',
  },
  {
    target: '[data-tutorial="module-toolbar"]',
    title: 'Barre d\'outils',
    description: 'Plusieurs outils sont à votre disposition : le chronomètre (60s par question), le mode aléatoire pour mélanger les questions, le mode examen pour simuler un vrai concours, le mode GDR pour les réponses du professeur, et le shader pour l\'arrière-plan animé.',
    position: 'bottom',
    tip: 'Le mode examen chronomètre 1h pour 50 questions !',
  },
  {
    target: '[data-tutorial="module-filters"]',
    title: 'Filtres de session',
    description: 'Filtrez les questions par session (année d\'examen). Sélectionnez "Toutes" pour voir toutes les questions, ou choisissez une session spécifique. Le bouton "Non répondues" masque les questions déjà correctement répondues.',
    position: 'bottom',
  },
  {
    target: '[data-tutorial="module-chapters"]',
    title: 'Navigation par sujet',
    description: 'Déroulez cette section pour voir tous les chapitres du module et naviguer directement vers un sujet précis. Cliquez sur un chapitre pour filtrer les questions correspondantes.',
    position: 'bottom',
  },
  {
    target: '[data-tutorial="module-question"]',
    title: 'Question et options',
    description: 'La question s\'affiche en haut avec le numéro et le chapitre. Sélectionnez une ou plusieurs réponses en cliquant dessus, puis appuyez sur "Valider" pour vérifier. Faites un clic droit sur une option pour la barrer (éliminer).',
    position: 'bottom',
    tip: 'Astuce : le clic droit barre les options pour éliminer les mauvaises réponses !',
  },
  {
    target: '[data-tutorial="module-actions"]',
    title: 'Actions et progression',
    description: 'Utilisez "Précédent" et "Suivant" pour naviguer entre les questions. "Valider" vérifie votre réponse, "Passer" passe à la suivante. La barre de progression en bas indique votre avancement dans le module.',
    position: 'top',
  },
  {
    target: '[data-tutorial="module-report"]',
    title: 'Signaler et cours',
    description: 'Signalez une erreur dans une question avec le bouton "Signaler". Si un cours est disponible, le bouton "Cours" ouvre le polycopié directement à la bonne page pour réviser le sujet.',
    position: 'bottom',
    tip: 'Le signalement nous aide à améliorer les questions !',
  },
];

const DASHBOARD_STORAGE_KEY = 'learnfmpa_tutorial_done';
const MODULE_STORAGE_KEY = 'learnfmpa_module_tutorial_done';

export function shouldShowTutorial(): boolean {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem(DASHBOARD_STORAGE_KEY);
}

export function shouldShowModuleTutorial(): boolean {
  if (typeof window === 'undefined') return false;
  return !localStorage.getItem(MODULE_STORAGE_KEY);
}

export function markTutorialDone(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DASHBOARD_STORAGE_KEY, 'true');
}

export function markModuleTutorialDone(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(MODULE_STORAGE_KEY, 'true');
}

export { DASHBOARD_TUTORIAL_STEPS, MODULE_TUTORIAL_STEPS };
export type { TutorialStep };

export default function TutorialOverlay({ isDarkMode, onClose, steps: propSteps, storageKey }: TutorialOverlayProps) {
  const steps = propSteps ?? DASHBOARD_TUTORIAL_STEPS;
  const effectiveStorageKey = storageKey ?? DASHBOARD_STORAGE_KEY;
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const updatePosition = useCallback(() => {
    if (!step.target) return;

    const element = document.querySelector(step.target);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    setSpotlightRect(rect);

    const padding = 12;
    const tooltipWidth = 400;
    const tooltipHeight = tooltipRef.current?.offsetHeight || 250;

    let top = 0;
    let left = 0;

    if (step.position === 'bottom') {
      top = rect.bottom + padding;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else if (step.position === 'top') {
      top = rect.top - tooltipHeight - padding;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else if (step.position === 'left') {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - padding;
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (left + tooltipWidth > vw - 16) left = vw - tooltipWidth - 16;
    if (left < 16) left = 16;
    if (top + tooltipHeight > vh - 16) top = rect.top - tooltipHeight - padding;
    if (top < 16) top = 16;

    if (step.position === 'left' && left < 16) {
      left = rect.right + padding;
    }

    setTooltipPos({ top, left });
  }, [step]);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    updatePosition();

    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updatePosition]);

  useEffect(() => {
    if (step.target) {
      const element = document.querySelector(step.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        const isInViewport = rect.top >= 0 && rect.top < window.innerHeight;
        if (!isInViewport) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => updatePosition(), 400);
        }
      }
    }
  }, [currentStep, step.target, updatePosition]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(effectiveStorageKey, 'true');
      }
      onClose();
    }, 300);
  };

  const goToStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    setIsAnimating(true);
    setSpotlightRect(null);
    setTimeout(() => {
      setCurrentStep(index);
      setIsAnimating(false);
    }, 150);
  };

  const handleNext = () => {
    if (isLastStep) {
      handleClose();
    } else {
      goToStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      goToStep(currentStep - 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose();
    if (e.key === 'ArrowRight' || e.key === 'Enter') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
  };

  const spotlightPadding = 8;
  const borderR = 16;

  const isCenter = step.target === null;

  const stepIndex = currentStep;
  const totalSteps = steps.length;

  return (
    <div
      className={`fixed inset-0 z-[100] transition-all duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Tutoriel LearnFMPA"
    >
      {isCenter && <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />}

      {spotlightRect && !isCenter && !isAnimating && (
        <div
          className="fixed z-[101] pointer-events-none transition-all duration-300"
          style={{
            top: spotlightRect.top - spotlightPadding,
            left: spotlightRect.left - spotlightPadding,
            width: spotlightRect.width + spotlightPadding * 2,
            height: spotlightRect.height + spotlightPadding * 2,
            borderRadius: borderR,
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6)`,
            border: `2px solid ${isDarkMode ? 'rgba(74, 222, 128, 0.6)' : 'rgba(22, 163, 74, 0.5)'}`,
          }}
        />
      )}

      {spotlightRect && !isCenter && !isAnimating && null}

      {isCenter ? (
        <div className={`fixed inset-0 z-[103] flex items-center justify-center p-4 transition-all duration-300 ${isVisible && !isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`h-2 bg-gradient-to-r ${getStepGradient(stepIndex)}`} />

            <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-br from-green-400/20 to-emerald-400/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-br from-teal-400/20 to-green-400/20 rounded-full blur-2xl" />

            <button
              onClick={handleClose}
              className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors z-10 ${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              aria-label="Fermer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="relative p-6 sm:p-8 text-center">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-gradient-to-br ${getStepGradient(stepIndex)} shadow-lg shadow-green-500/30`}>
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3v4m0 0h4m-4 0H8" />
                </svg>
              </div>

              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {step.title}
              </h2>
              <p className={`text-sm sm:text-base leading-relaxed mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {step.description}
              </p>

              <div className="flex items-center justify-center gap-2 mb-6">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? `w-8 bg-gradient-to-r ${getStepGradient(stepIndex)}`
                        : index < currentStep
                          ? (isDarkMode ? 'w-2 bg-green-600' : 'w-2 bg-green-300')
                          : (isDarkMode ? 'w-2 bg-gray-600' : 'w-2 bg-gray-200')
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleNext}
                className={`w-full px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r ${getStepGradient(stepIndex)} hover:opacity-90 transition-all shadow-lg`}
              >
                Commencer la visite guidée
                <svg className="w-4 h-4 inline-block ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>

              <button
                onClick={handleClose}
                className={`mt-3 text-sm ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
              >
                Passer le tutoriel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          ref={tooltipRef}
          className={`fixed z-[103] w-[calc(100%-2rem)] sm:w-auto sm:min-w-[320px] sm:max-w-[400px] rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} ${isVisible && !isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
          style={{ top: tooltipPos.top, left: tooltipPos.left }}
        >
          <div className={`h-1.5 bg-gradient-to-r ${getStepGradient(stepIndex)}`} />

          <button
            onClick={handleClose}
            className={`absolute top-3 right-3 p-1 rounded-lg transition-colors z-10 ${isDarkMode ? 'text-gray-500 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            aria-label="Fermer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-5">
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br ${getStepGradient(stepIndex)} shadow-md`}>
                <span className="text-white text-sm font-bold">{stepIndex}</span>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-1`}>
                  {step.title}
                </h3>
                <p className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {step.description}
                </p>
              </div>
            </div>

            {step.tip && (
              <div className={`mt-3 rounded-lg p-3 border ${isDarkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center gap-2 text-xs">
                  <svg className={`w-3.5 h-3.5 flex-shrink-0 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    {step.tip}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? `w-6 bg-gradient-to-r ${getStepGradient(stepIndex)}`
                      : index < currentStep
                        ? (isDarkMode ? 'w-1.5 bg-green-600' : 'w-1.5 bg-green-300')
                        : (isDarkMode ? 'w-1.5 bg-gray-600' : 'w-1.5 bg-gray-200')
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={handlePrev}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isFirstStep ? 'invisible' : isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <svg className="w-4 h-4 mr-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Précédent
              </button>

              <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {currentStep} / {totalSteps - 1}
              </span>

              <button
                onClick={handleNext}
                className={`px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r ${getStepGradient(stepIndex)} hover:opacity-90 transition-opacity shadow-md`}
              >
                {isLastStep ? "C'est parti !" : 'Suivant'}
                {!isLastStep && (
                  <svg className="w-4 h-4 ml-1 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getStepGradient(index: number): string {
  const gradients = [
    'from-green-500 via-emerald-500 to-teal-500',
    'from-green-500 to-emerald-600',
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-teal-600',
    'from-purple-500 to-indigo-500',
    'from-amber-500 to-orange-500',
    'from-green-500 to-emerald-600',
    'from-rose-500 to-pink-500',
  ];
  return gradients[index % gradients.length];
}
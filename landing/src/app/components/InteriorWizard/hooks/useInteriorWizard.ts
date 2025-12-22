import { useState, useCallback, useEffect } from 'react';
import type { WizardState, Developer, Development, Building, BuildingUnit, Layout, Package, QuoteResult } from '../types';

const STORAGE_KEY = 'interior_wizard_state';
const initialState: WizardState = {
  currentStep: 1, direction: 1, developer: null, development: null,
  building: null, unit: null, layout: null, package: null, quote: null,
};

function canAccessStep(step: number, s: WizardState): boolean {
  if (step === 1) return true;
  if (step === 2) return !!s.developer;
  if (step === 3) return !!s.developer && !!s.development;
  if (step === 4) return !!s.developer && !!s.development && !!s.building;
  if (step === 5 || step === 6) return !!(s.developer && s.development && s.building && s.unit && s.layout);
  if (step === 7) return !!(s.developer && s.development && s.building && s.unit && s.layout && s.package);
  return false;
}

function getCompletedSteps(s: WizardState): number[] {
  const c: number[] = [];
  if (s.developer) c.push(1);
  if (s.development) c.push(2);
  if (s.building) c.push(3);
  if (s.unit) c.push(4);
  if (s.layout) c.push(5);
  if (s.package) c.push(6);
  if (s.quote) c.push(7);
  return c;
}

export interface UseInteriorWizardReturn {
  state: WizardState;
  completedSteps: number[];
  goToStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setDeveloper: (developer: Developer) => void;
  setDevelopment: (development: Development) => void;
  setBuilding: (building: Building) => void;
  setUnit: (unit: BuildingUnit, layout: Layout) => void;
  setPackage: (pkg: Package) => void;
  setQuote: (quote: QuoteResult) => void;
  reset: () => void;
  canGoToStep: (step: number) => boolean;
}

export function useInteriorWizard(): UseInteriorWizardReturn {
  const [state, setState] = useState<WizardState>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as WizardState;
        if (parsed && typeof parsed.currentStep === 'number') return parsed;
      }
    } catch { /* ignore */ }
    return initialState;
  });

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);

  const goToStep = useCallback((step: number) => {
    setState((p) => canAccessStep(step, p) ? { ...p, currentStep: step, direction: step > p.currentStep ? 1 : -1 } : p);
  }, []);

  const nextStep = useCallback(() => {
    setState((p) => { const n = Math.min(p.currentStep + 1, 7); return canAccessStep(n, p) ? { ...p, currentStep: n, direction: 1 } : p; });
  }, []);

  const prevStep = useCallback(() => {
    setState((p) => ({ ...p, currentStep: Math.max(p.currentStep - 1, 1), direction: -1 }));
  }, []);

  const setDeveloper = useCallback((developer: Developer) => {
    setState((p) => ({ ...p, developer, development: null, building: null, unit: null, layout: null, package: null, quote: null }));
  }, []);

  const setDevelopment = useCallback((development: Development) => {
    setState((p) => ({ ...p, development, building: null, unit: null, layout: null, package: null, quote: null }));
  }, []);

  const setBuilding = useCallback((building: Building) => {
    setState((p) => ({ ...p, building, unit: null, layout: null, package: null, quote: null }));
  }, []);

  const setUnit = useCallback((unit: BuildingUnit, layout: Layout) => {
    setState((p) => ({ ...p, unit, layout, package: null, quote: null }));
  }, []);

  const setPackage = useCallback((pkg: Package) => {
    setState((p) => ({ ...p, package: pkg, quote: null }));
  }, []);

  const setQuote = useCallback((quote: QuoteResult) => {
    setState((p) => ({ ...p, quote }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const canGoToStep = useCallback((step: number) => canAccessStep(step, state), [state]);

  return { state, completedSteps: getCompletedSteps(state), goToStep, nextStep, prevStep, setDeveloper, setDevelopment, setBuilding, setUnit, setPackage, setQuote, reset, canGoToStep };
}

export default useInteriorWizard;

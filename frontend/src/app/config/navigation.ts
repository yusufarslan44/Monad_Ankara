import type { RouteLocationRaw } from 'vue-router';
import { BadgeDollarSign, CreditCard, HandCoins, LayoutDashboard, PiggyBank, Sparkles } from 'lucide-vue-next';

export interface NavItem {
  label: string;
  description: string;
  to: RouteLocationRaw;
  icon: typeof LayoutDashboard;
}

export const desktopNavigation: NavItem[] = [
  {
    label: 'Panel',
    description: 'Ana ozet',
    to: '/uygulama/panel',
    icon: LayoutDashboard,
  },
  {
    label: 'Borc Al',
    description: 'Hizli kredi',
    to: '/uygulama/borc-al',
    icon: HandCoins,
  },
  {
    label: 'Odeme',
    description: 'Parcali kapatma',
    to: '/uygulama/odeme',
    icon: CreditCard,
  },
  {
    label: 'Havuz',
    description: 'Likidite kilitle ve faiz kazan',
    to: '/uygulama/havuz',
    icon: PiggyBank,
  },
  {
    label: 'Itibar',
    description: 'Skor ve ritim',
    to: '/uygulama/itibar',
    icon: Sparkles,
  },
  {
    label: 'Gecmis',
    description: 'Akis kaydi',
    to: '/uygulama/gecmis',
    icon: BadgeDollarSign,
  },
];

export const investorNavigation: NavItem[] = [
  {
    label: 'Panel',
    description: 'Yatirimci ozeti',
    to: '/uygulama/panel',
    icon: LayoutDashboard,
  },
  {
    label: 'Havuz',
    description: 'Likidite kilitle ve faiz kazan',
    to: '/uygulama/havuz',
    icon: PiggyBank,
  },
];

export const mobileNavigation = desktopNavigation.slice(0, 4);

export const mobileMoreNavigation = desktopNavigation.slice(4);

const investorAllowedPaths = new Set(['/', '/uygulama', '/uygulama/panel', '/uygulama/havuz']);

export const isInvestorAllowedPath = (path: string) => investorAllowedPaths.has(path);

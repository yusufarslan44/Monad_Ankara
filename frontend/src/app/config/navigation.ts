import type { RouteLocationRaw } from 'vue-router';
import { BadgeDollarSign, CreditCard, HandCoins, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-vue-next';

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
    label: 'Kefalet',
    description: 'Sosyal tampon',
    to: '/uygulama/kefalet',
    icon: ShieldCheck,
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

export const mobileNavigation = desktopNavigation.slice(0, 4);

export const mobileMoreNavigation = desktopNavigation.slice(4);

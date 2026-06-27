export const formatMON = (value: number) =>
  new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatYieldMON = (value: number) => {
  const absoluteValue = Math.abs(value);

  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: absoluteValue >= 1 || absoluteValue === 0 ? 2 : 4,
    maximumFractionDigits: absoluteValue >= 1 ? 2 : 4,
  }).format(value);
};

export const formatPercent = (value: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const formatShortAddress = (address?: string) => {
  if (!address) {
    return 'Bagli degil';
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatRelativeLabel = (label: string) => label;

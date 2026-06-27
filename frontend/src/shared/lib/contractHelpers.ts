import { Interface, parseEther, toBeHex } from 'ethers';
import LendingPoolABI from '../../../../shared/abi/LendingPool.json';

const iface = new Interface(LendingPoolABI);

export const LENDING_POOL_ADDRESS: string =
  (import.meta.env.VITE_LENDING_POOL_ADDRESS as string | undefined) ||
  '0x37431D947061Cc9616A1f16A86016aEb307Cec6a';

export const STUDENT_ID_ADDRESS: string =
  (import.meta.env.VITE_STUDENT_ID_ADDRESS as string | undefined) ||
  '0x92ceCB9d264C647c3627EdD0102E9e1e9677cC95';

export const encodeDeposit = (): string =>
  iface.encodeFunctionData('deposit', []);

export const encodeWithdraw = (amountMON: number): string => {
  const amountWei = parseEther(String(amountMON));
  return iface.encodeFunctionData('withdraw', [amountWei]);
};

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

export const encodeBorrow = (amountMON: number, referrer: string = ZERO_ADDRESS): string => {
  const amountWei = parseEther(String(amountMON));
  return iface.encodeFunctionData('borrow', [amountWei, referrer]);
};

export const encodeRepay = (): string =>
  iface.encodeFunctionData('repay', []);

export const toHexWei = (amountMON: number): string =>
  toBeHex(parseEther(String(amountMON)));

export function formatMoney(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}M`
  }
  if (amount >= 100000) {
    return `${(amount / 100000).toFixed(amount % 100000 === 0 ? 0 : 1)} laki`
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`
  }
  return amount.toString()
}

export function formatMoneyFull(amount: number): string {
  return `TSh ${amount.toLocaleString('en-US')}`
}

export function formatMoneyShort(amount: number): string {
  if (amount >= 1000000) {
    const m = amount / 1000000
    return `TSh ${m.toFixed(m % 1 === 0 ? 0 : 1)}M`
  }
  if (amount >= 1000) {
    const k = amount / 1000
    return `TSh ${k.toFixed(k % 1 === 0 ? 0 : 1)}k`
  }
  return `TSh ${amount}`
}

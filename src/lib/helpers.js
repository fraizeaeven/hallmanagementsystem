import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'

export const formatDate = (date, fmt = 'dd MMM yyyy') => {
  if (!date) return '-'
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? format(d, fmt) : '-'
}

export const formatDateTime = (date) => formatDate(date, 'dd MMM yyyy, hh:mm a')

export const timeAgo = (date) => {
  if (!date) return ''
  const d = typeof date === 'string' ? parseISO(date) : date
  return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : ''
}

export const formatCurrency = (amount, currency = 'MYR') => {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('')
}

export const pluralize = (count, singular, plural) => {
  return `${count} ${count === 1 ? singular : plural || singular + 's'}`
}

export const truncate = (str, maxLen = 80) => {
  if (!str) return ''
  return str.length > maxLen ? `${str.slice(0, maxLen)}...` : str
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export const classNames = (...classes) => classes.filter(Boolean).join(' ')

export const groupBy = (arr, key) =>
  arr.reduce((acc, item) => {
    const k = typeof key === 'function' ? key(item) : item[key]
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})

export const sumBy = (arr, key) =>
  arr.reduce((total, item) => total + (Number(item[key]) || 0), 0)

export const slugify = (text) => {
  if (!text) return ''
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export const generateExcerpt = (content, maxLen = 160) => {
  if (!content) return ''
  const plain = content.replace(/\n+/g, ' ').trim()
  return plain.length > maxLen ? `${plain.slice(0, maxLen)}…` : plain
}

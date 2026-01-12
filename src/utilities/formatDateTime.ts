import { format } from 'date-fns'

type Props = {
  date: string
  format?: string
}

export const formatDateTime = (input: string | Props): string => {
  const dateValue = typeof input === 'string' ? input : input?.date
  const formatFromProps = typeof input === 'string' ? undefined : input?.format

  if (!dateValue) return ''

  const dateFormat = formatFromProps ?? 'dd/MM/yyyy'
  return format(new Date(dateValue), dateFormat)
}

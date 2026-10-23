import type { DefaultServerCellComponentProps } from 'payload'

export const AmountCell = ({ cellData, rowData }: DefaultServerCellComponentProps) => {
  if (cellData == null) return null

  const currency = rowData?.currency ?? 'NGN'
  // Only divide if the value is stored in minor units (kobo). See note below.
  const value = Number(cellData)/100

  return (
    <span>{new Intl.NumberFormat('en-NG', { style: 'currency', currency }).format(value)}</span>
  )
}

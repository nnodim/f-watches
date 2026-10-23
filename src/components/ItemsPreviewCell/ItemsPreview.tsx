'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type PreviewItem = {
  key: string
  name: string
  variant?: string
  quantity: number
  imageUrl?: string
  unitPrice?: string
  lineTotal?: string
}

type Props = {
  orderID: string
  customerEmail?: string | null
  items: PreviewItem[]
}

const MAX_THUMBS = 3
const THUMB = 40

function Thumb({
  item,
  size = THUMB,
  style,
}: {
  item: PreviewItem
  size?: number
  style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: 6,
    objectFit: 'cover',
    // border: '1px solid var(--theme-bg)',
    background: 'var(--theme-elevation-100)',
    flexShrink: 0,
    ...style,
  }

  if (item.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={item.imageUrl} alt={item.name} style={base} />
  }

  return (
    <div
      style={{
        ...base,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.4,
        fontWeight: 600,
        opacity: 0.8,
      }}
    >
      {item.name.charAt(0).toUpperCase()}
    </div>
  )
}

export function ItemsPreview({ orderID, customerEmail, items }: Props) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  const shown = items.slice(0, MAX_THUMBS)
  const extra = items.length - shown.length
  const totalQty = items.reduce((n, i) => n + i.quantity, 0)

  return (
    <>
      <button
        type="button"
        title={`View ${items.length} item${items.length === 1 ? '' : 's'}`}
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'inherit',
        }}
      >
        {shown.map((item, i) => (
          <Thumb key={item.key} item={item} style={{ marginLeft: i === 0 ? 0 : -12 }} />
        ))}
        {extra > 0 && (
          <span
            style={{
              marginLeft: -12,
              width: THUMB,
              height: THUMB,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid var(--theme-bg)',
              background: 'var(--theme-elevation-150)',
            }}
          >
            +{extra}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.55)',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'min(560px, 94vw)',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 10,
                background: 'var(--theme-bg)',
                color: 'var(--theme-text)',
                border: '1px solid var(--theme-elevation-100)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '16px 20px',
                  borderBottom: '1px solid var(--theme-elevation-100)',
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>Order items</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.7 }}>
                    #{orderID.slice(-6)}
                    {customerEmail ? ` · ${customerEmail}` : ''} · {totalQty} unit
                    {totalQty === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 22,
                    lineHeight: 1,
                    cursor: 'pointer',
                    color: 'inherit',
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ overflowY: 'auto', padding: '8px 20px 16px' }}>
                {items.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex',
                      gap: 14,
                      alignItems: 'center',
                      padding: '12px 0',
                      borderBottom: '1px solid var(--theme-elevation-100)',
                    }}
                  >
                    <Thumb
                      item={item}
                      size={72}
                      style={{ border: '1px solid var(--theme-elevation-100)' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      {item.variant && (
                        <div style={{ fontSize: 13, opacity: 0.7 }}>{item.variant}</div>
                      )}
                      <div style={{ fontSize: 13, opacity: 0.7, marginTop: 2 }}>
                        Qty {item.quantity}
                        {item.unitPrice ? ` × ${item.unitPrice}` : ''}
                      </div>
                    </div>
                    {item.lineTotal && (
                      <strong style={{ whiteSpace: 'nowrap' }}>{item.lineTotal}</strong>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}

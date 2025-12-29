import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
  render,
} from '@react-email/components'
import { format } from 'date-fns'
import * as React from 'react'
import { Order, Product, Variant } from '../../payload-types'

interface OrderConfirmationEmailProps {
  order: Order
}

// Helper function to format price
const formatPrice = (amount: number, currency: 'NGN' | 'USD' = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100) // Assuming amount is in kobo/cents
}

// Helper to get product price based on currency
const getProductPrice = (
  product: Product,
  variant: Variant | null | undefined,
  currency: 'NGN' | 'USD' = 'NGN',
): number => {
  if (variant) {
    return currency === 'NGN' ? variant.priceInNGN || 0 : variant.priceInUSD || 0
  }
  return currency === 'NGN' ? product.priceInNGN || 0 : product.priceInUSD || 0
}

// Helper to get variant options display
const getVariantDisplay = (variant: Variant | string | null | undefined): string => {
  if (!variant || typeof variant === 'string') return ''

  if (variant.options && Array.isArray(variant.options)) {
    return variant.options
      .map((opt) => (typeof opt === 'string' ? opt : opt.value))
      .filter(Boolean)
      .join(', ')
  }
  return variant.title || ''
}

export const OrderConfirmationEmail = ({ order }: OrderConfirmationEmailProps) => {
  const currency = order.currency || 'NGN'
  const shippingFee = 0 // Add your shipping calculation logic here

  // Ensure items is a safe array (guard against null/undefined)
  const items = order.items ?? []

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const product = typeof item.product === 'string' ? null : item.product
    const variant = typeof item.variant === 'string' ? null : item.variant

    if (!product) return sum

    const price = getProductPrice(product, variant, currency)
    return sum + price * item.quantity
  }, 0)

  const total = subtotal + shippingFee

  return (
    <Html>
      <Head />
      <Preview>Order Confirmation - Thank you for your purchase!</Preview>

      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section>
            <Row>
              <Column>
                <Img
                  src={`https://res.cloudinary.com/dovnrf0xc/image/upload/v1764507920/F_Watches_Logo__sn3dom.png`}
                  width="300"
                  height="120"
                  alt="Fwatches"
                />
              </Column>

              <Column align="right" style={tableCell}>
                <Text style={heading}>Order Confirmation</Text>
              </Column>
            </Row>
          </Section>

          {/* Order Information */}
          <Section style={informationTable}>
            <Row style={informationTableRow}>
              <Column style={informationTableColumn}>
                <Text style={informationTableLabel}>EMAIL</Text>
                <Link style={informationTableValue}>
                  {order.customerEmail ||
                    (typeof order.customer !== 'string' && order.customer?.email) ||
                    'N/A'}
                </Link>
              </Column>

              <Column style={informationTableColumn}>
                <Text style={informationTableLabel}>ORDER DATE</Text>
                <Text style={informationTableValue}>
                  {format(new Date(order.createdAt), 'dd MMM yyyy')}
                </Text>
              </Column>

              <Column style={informationTableColumn}>
                <Text style={informationTableLabel}>ORDER ID</Text>
                <Link style={informationTableValue}>#{order.id.slice(0, 8).toUpperCase()}</Link>
              </Column>
            </Row>
          </Section>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Section style={shippingSection}>
              <Text style={shippingTitle}>Shipping Address</Text>
              <Text style={shippingText}>
                {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                {order.shippingAddress.company && (
                  <>
                    <br />
                    {order.shippingAddress.company}
                  </>
                )}
                <br />
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && (
                  <>
                    <br />
                    {order.shippingAddress.addressLine2}
                  </>
                )}
                <br />
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.postalCode}
                <br />
                {order.shippingAddress.country}
                {order.shippingAddress.phone && (
                  <>
                    <br />
                    Phone: {order.shippingAddress.phone}
                  </>
                )}
              </Text>
            </Section>
          )}

          {/* Order Summary */}
          <Section style={productTitleTable}>
            <Text style={productsTitle}>Order Summary</Text>
          </Section>

          {/* Product Items */}
          {items.map((item, index) => {
            const product = typeof item.product === 'string' ? null : item.product
            const variant = typeof item.variant === 'string' ? null : item.variant

            if (!product) return null

            // Get product image
            const galleryItem = product.gallery?.[0]
            const image = galleryItem?.image
            const imageUrl = image && typeof image !== 'string' && image.url ? image.url : ''

            const price = getProductPrice(product, variant, currency)
            const itemTotal = price * item.quantity
            const variantDisplay = getVariantDisplay(variant)

            return (
              <React.Fragment key={index}>
                <Section>
                  <Row>
                    <Column style={{ width: '64px' }}>
                      {imageUrl && (
                        <Img
                          src={imageUrl}
                          width="64"
                          height="64"
                          alt={product.title}
                          style={productIcon}
                        />
                      )}
                    </Column>
                    <Column style={{ paddingLeft: '22px' }}>
                      <Text style={productTitle}>{product.title}</Text>
                      {variantDisplay && <Text style={productDescription}>{variantDisplay}</Text>}
                      <Text style={productDescription}>Quantity: {item.quantity}</Text>
                      <Link
                        href={`${process.env.NEXT_PUBLIC_SERVER_URL}/products/${product.slug}`}
                        style={productLink}
                      >
                        View Product
                      </Link>
                    </Column>
                    <Column style={productPriceWrapper} align="right">
                      <Text style={productPrice}>{formatPrice(price, currency)}</Text>
                      {item.quantity > 1 && (
                        <Text style={productDescription}>
                          Total: {formatPrice(itemTotal, currency)}
                        </Text>
                      )}
                    </Column>
                  </Row>
                </Section>
                {index < items.length - 1 && <Hr style={productDivider} />}
              </React.Fragment>
            )
          })}

          {/* Shipping Fee */}
          {shippingFee > 0 && (
            <>
              <Hr style={productPriceLine} />
              <Section>
                <Row>
                  <Column style={{ paddingLeft: '86px' }}>
                    <Text style={productTitle}>Shipping Fee</Text>
                  </Column>
                  <Column style={productPriceWrapper} align="right">
                    <Text style={productPrice}>{formatPrice(shippingFee, currency)}</Text>
                  </Column>
                </Row>
              </Section>
            </>
          )}

          {/* Total */}
          <Hr style={productPriceLine} />
          <Section align="right">
            <Row>
              <Column style={tableCell} align="right">
                <Text style={productPriceTotal}>TOTAL</Text>
              </Column>
              <Column style={productPriceVerticalLine}></Column>
              <Column style={productPriceLargeWrapper}>
                <Text style={productPriceLarge}>{formatPrice(total, currency)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Order Status */}
          <Section style={statusSection}>
            <Text style={statusText}>
              Order Status:{' '}
              <span style={statusBadge}>{order.status?.toUpperCase() || 'PENDING'}</span>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={footerDivider} />
          <Text style={footerText}>
            Thank you for shopping with Fwatches! We&apos;ll send you a shipping confirmation email
            as soon as your order ships.
          </Text>
          <Text style={footerCopyright}>
            Copyright © {new Date().getFullYear()} Fwatches. <br />
            <Link href={process.env.NEXT_PUBLIC_SERVER_URL}>All rights reserved</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const OrderConfirmationEmailHtml = async (props: OrderConfirmationEmailProps) => {
  return await render(<OrderConfirmationEmail {...props} />, {
    pretty: true,
  })
}

// Styles
const main = {
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  backgroundColor: '#f6f6f6',
  padding: '20px',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  width: '600px',
  maxWidth: '100%',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
}

const tableCell = { display: 'table-cell' }

const heading = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0',
}

const informationTable = {
  borderCollapse: 'collapse' as const,
  borderSpacing: '0px',
  backgroundColor: '#f9f9f9',
  borderRadius: '6px',
  fontSize: '12px',
  marginTop: '24px',
  overflow: 'hidden',
}

const informationTableRow = {
  height: '56px',
}

const informationTableColumn = {
  paddingLeft: '20px',
  paddingRight: '20px',
  borderStyle: 'solid',
  borderColor: '#eeeeee',
  borderWidth: '0px 1px 0px 0px',
  height: '56px',
}

const informationTableLabel = {
  color: '#666666',
  fontSize: '10px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 4px 0',
}

const informationTableValue = {
  fontSize: '14px',
  margin: '0',
  padding: '0',
  lineHeight: 1.4,
  color: '#1a1a1a',
}

const shippingSection = {
  marginTop: '32px',
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '6px',
}

const shippingTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 12px 0',
}

const shippingText = {
  fontSize: '13px',
  lineHeight: '1.6',
  color: '#4a4a4a',
  margin: '0',
}

const productTitleTable = {
  margin: '32px 0 20px 0',
  backgroundColor: '#1a1a1a',
  borderRadius: '6px',
  padding: '12px 20px',
}

const productsTitle = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#ffffff',
  margin: '0',
}

const productIcon = {
  margin: '0',
  borderRadius: '8px',
  border: '1px solid #eeeeee',
  objectFit: 'cover' as const,
}

const productTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 4px 0',
}

const productDescription = {
  fontSize: '12px',
  color: '#666666',
  margin: '0 0 4px 0',
  lineHeight: 1.4,
}

const productLink = {
  fontSize: '12px',
  color: '#0066cc',
  textDecoration: 'none',
  fontWeight: '500',
}

const productPrice = {
  fontSize: '14px',
  fontWeight: '600',
  margin: '0',
  color: '#1a1a1a',
}

const productPriceWrapper = {
  display: 'table-cell',
  padding: '0px 20px 0px 0px',
  width: '120px',
  verticalAlign: 'top',
}

const productDivider = {
  margin: '16px 0',
  borderColor: '#eeeeee',
}

const productPriceLine = {
  margin: '24px 0',
  borderColor: '#dddddd',
}

const productPriceTotal = {
  margin: '0',
  color: '#666666',
  fontSize: '12px',
  fontWeight: '600',
  padding: '0px 30px 0px 0px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}

const productPriceVerticalLine = {
  height: '48px',
  borderLeft: '2px solid #eeeeee',
}

const productPriceLarge = {
  margin: '0px 20px 0px 20px',
  fontSize: '24px',
  fontWeight: '700',
  color: '#1a1a1a',
}

const productPriceLargeWrapper = {
  display: 'table-cell',
  width: '120px',
}

const statusSection = {
  marginTop: '32px',
  padding: '16px',
  backgroundColor: '#f0f8ff',
  borderRadius: '6px',
  textAlign: 'center' as const,
}

const statusText = {
  fontSize: '14px',
  color: '#1a1a1a',
  margin: '0',
}

const statusBadge = {
  fontWeight: '700',
  color: '#0066cc',
}

const footerDivider = {
  margin: '40px 0 24px 0',
  borderColor: '#dddddd',
}

const footerText = {
  fontSize: '13px',
  lineHeight: '1.6',
  color: '#666666',
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
}

const footerCopyright = {
  fontSize: '12px',
  textAlign: 'center' as const,
  color: '#999999',
  lineHeight: '1.6',
  margin: '0',
}

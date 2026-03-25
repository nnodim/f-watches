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

interface AdminOrderNotificationEmailProps {
  order: Order
}

export const formatPrice = (amount: number, currency: 'NGN' | 'USD' = 'NGN'): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100)
}

const getProductPrice = (
  product: Product,
  variant: Variant | null | undefined,
  currency: 'NGN' | 'USD' = 'NGN',
  unitPrice?: number | null,
): number => {
  if (typeof unitPrice === 'number') return unitPrice
  if (variant) {
    return currency === 'NGN' ? variant.priceInNGN || 0 : variant.priceInUSD || 0
  }
  return currency === 'NGN' ? product.priceInNGN || 0 : product.priceInUSD || 0
}

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

export const AdminOrderNotificationEmail = ({ order }: AdminOrderNotificationEmailProps) => {
  const currency = order.currency || 'NGN'
  const shippingFee =
    typeof (order as any).shippingFee === 'number' ? (order as any).shippingFee : 0
  const items = order.items ?? []

  const subtotal = items.reduce((sum, item) => {
    const product = typeof item.product === 'string' ? null : item.product
    const variant = typeof item.variant === 'string' ? null : item.variant
    if (!product) return sum
    const price = getProductPrice(product, variant, currency, (item as any)?.unitPrice)
    return sum + price * item.quantity
  }, 0)

  const total = subtotal + shippingFee

  const adminOrderUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/orders/${order.id}`
  const customerEmail =
    order.customerEmail || (typeof order.customer !== 'string' && order.customer?.email) || 'N/A'

  return (
    <Html>
      <Head />
      <Preview>🛒 New Order #{order.id.slice(0, 8).toUpperCase()} — Action Required</Preview>

      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={alertBanner}>
            <Text style={alertText}>🔔 NEW ORDER RECEIVED</Text>
          </Section>

          <Section style={{ padding: '32px 0 16px 0' }}>
            <Row>
              <Column>
                <Img
                  src={`https://res.cloudinary.com/dovnrf0xc/image/upload/v1764507920/F_Watches_Logo__sn3dom.png`}
                  width="300"
                  height="120"
                  alt="Fwatches"
                />
              </Column>
              <Column align="right" style={{ display: 'table-cell' }}>
                <Text style={heading}>Admin Notification</Text>
              </Column>
            </Row>
          </Section>

          {/* Quick Action */}
          <Section style={actionSection}>
            <Text style={actionLabel}>
              A new order has been placed and requires your attention.
            </Text>
            <Link href={adminOrderUrl} style={actionButton}>
              View Order in Admin →
            </Link>
          </Section>

          {/* Order Information */}
          <Section style={informationTable}>
            <Row style={informationTableRow}>
              <Column style={informationTableColumn}>
                <Text style={informationTableLabel}>ORDER ID</Text>
                <Link href={adminOrderUrl} style={informationTableValue}>
                  #{order.id.slice(0, 8).toUpperCase()}
                </Link>
              </Column>

              <Column style={informationTableColumn}>
                <Text style={informationTableLabel}>ORDER DATE</Text>
                <Text style={informationTableValue}>
                  {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
                </Text>
              </Column>

              <Column style={informationTableColumn}>
                <Text style={informationTableLabel}>STATUS</Text>
                <Text style={{ ...informationTableValue, color: '#d97706', fontWeight: '700' }}>
                  {order.status?.toUpperCase() || 'PROCESSING'}
                </Text>
              </Column>
            </Row>
          </Section>

          {/* Customer Info */}
          <Section style={customerSection}>
            <Text style={sectionTitle}>Customer Details</Text>
            <Row>
              <Column style={{ width: '50%' }}>
                <Text style={customerLabel}>Email</Text>
                <Text style={customerValue}>{customerEmail}</Text>
              </Column>
              <Column style={{ width: '50%' }}>
                <Text style={customerLabel}>Customer Type</Text>
                <Text style={customerValue}>
                  {order.customer ? '👤 Registered User' : '🧾 Guest Checkout'}
                </Text>
              </Column>
            </Row>
            {typeof order.customer === 'object' && order.customer && (
              <Row style={{ marginTop: '8px' }}>
                <Column>
                  <Text style={customerLabel}>Customer ID</Text>
                  <Link
                    href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/users/${order.customer.id}`}
                    style={{ ...customerValue, color: '#0066cc' }}
                  >
                    {order.customer.id}
                  </Link>
                </Column>
              </Row>
            )}
          </Section>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <Section style={shippingSection}>
              <Text style={sectionTitle}>Shipping Address</Text>
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
                    📞 {order.shippingAddress.phone}
                  </>
                )}
              </Text>
            </Section>
          )}

          {/* Order Items */}
          <Section style={productTitleTable}>
            <Text style={productsTitle}>Order Items ({items.length})</Text>
          </Section>

          {items.map((item, index) => {
            const product = typeof item.product === 'string' ? null : item.product
            const variant = typeof item.variant === 'string' ? null : item.variant

            if (!product) return null

            const galleryItem = product.gallery?.[0]
            const image = galleryItem?.image
            const imageUrl = image && typeof image !== 'string' && image.url ? image.url : ''

            const price = getProductPrice(product, variant, currency, (item as any)?.unitPrice)
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
                      {variantDisplay && (
                        <Text style={productDescription}>Variant: {variantDisplay}</Text>
                      )}
                      <Text style={productDescription}>Qty: {item.quantity}</Text>
                      <Text style={productDescription}>
                        Unit Price: {formatPrice(price, currency)}
                      </Text>
                      <Link
                        href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin/collections/products/${product.id}`}
                        style={productLink}
                      >
                        View in Admin →
                      </Link>
                    </Column>
                    <Column style={productPriceWrapper} align="right">
                      <Text style={productPrice}>{formatPrice(itemTotal, currency)}</Text>
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
              <Column style={{ display: 'table-cell' }} align="right">
                <Text style={productPriceTotal}>ORDER TOTAL</Text>
              </Column>
              <Column style={productPriceVerticalLine}></Column>
              <Column style={productPriceLargeWrapper}>
                <Text style={productPriceLarge}>{formatPrice(total, currency)}</Text>
              </Column>
            </Row>
          </Section>

          {/* Admin CTA */}
          <Section style={ctaSection}>
            <Text style={ctaTitle}>Ready to fulfill this order?</Text>
            <Link href={adminOrderUrl} style={ctaButton}>
              Manage Order in Admin Panel
            </Link>
          </Section>

          {/* Footer */}
          <Hr style={footerDivider} />
          <Text style={footerText}>
            This is an automated notification from your Fwatches store. Do not reply to this email.
          </Text>
          <Text style={footerCopyright}>
            © {new Date().getFullYear()} Fwatches Admin System. <br />
            <Link href={process.env.NEXT_PUBLIC_SERVER_URL}>Go to Store</Link>
            {' · '}
            <Link href={`${process.env.NEXT_PUBLIC_SERVER_URL}/admin`}>Go to Admin</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const AdminOrderNotificationEmailHtml = async (props: AdminOrderNotificationEmailProps) => {
  return await render(<AdminOrderNotificationEmail {...props} />, {
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
  padding: '0 20px 40px 20px',
  width: '600px',
  maxWidth: '100%',
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
}

const alertBanner = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px 8px 0 0',
  padding: '14px 20px',
  textAlign: 'center' as const,
}

const alertText = {
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '700',
  letterSpacing: '1px',
  margin: '0',
  textTransform: 'uppercase' as const,
}

const heading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0',
}

const actionSection = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fde68a',
  borderRadius: '6px',
  padding: '20px',
  marginBottom: '24px',
  textAlign: 'center' as const,
}

const actionLabel = {
  fontSize: '14px',
  color: '#92400e',
  margin: '0 0 14px 0',
}

const actionButton = {
  display: 'inline-block',
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '600',
  padding: '10px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
}

const informationTable = {
  borderCollapse: 'collapse' as const,
  borderSpacing: '0px',
  backgroundColor: '#f9f9f9',
  borderRadius: '6px',
  fontSize: '12px',
  marginTop: '8px',
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

const customerSection = {
  marginTop: '24px',
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '6px',
}

const sectionTitle = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#1a1a1a',
  margin: '0 0 12px 0',
}

const customerLabel = {
  fontSize: '10px',
  fontWeight: '600',
  color: '#666666',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 2px 0',
}

const customerValue = {
  fontSize: '13px',
  color: '#1a1a1a',
  margin: '0',
}

const shippingSection = {
  marginTop: '16px',
  padding: '20px',
  backgroundColor: '#f9f9f9',
  borderRadius: '6px',
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

const ctaSection = {
  marginTop: '32px',
  padding: '24px',
  backgroundColor: '#1a1a1a',
  borderRadius: '6px',
  textAlign: 'center' as const,
}

const ctaTitle = {
  fontSize: '15px',
  fontWeight: '600',
  color: '#ffffff',
  margin: '0 0 16px 0',
}

const ctaButton = {
  display: 'inline-block',
  backgroundColor: '#ffffff',
  color: '#1a1a1a',
  fontSize: '13px',
  fontWeight: '700',
  padding: '12px 28px',
  borderRadius: '6px',
  textDecoration: 'none',
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

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  render
} from '@react-email/components'

interface EligibleProduct {
  slug?: null | string
  title?: null | string
}

interface WinnerEmailProps {
  code: string
  customerEmail: string
  eligibleProducts: EligibleProduct[]
  expiresAt?: null | string
  raffleTitle: string
  rewardType: 'free-watch' | 'half-off'
}

export const WinnerEmail = ({
  code,
  customerEmail,
  eligibleProducts,
  expiresAt,
  raffleTitle,
  rewardType,
}: WinnerEmailProps) => {
  const rewardLabel = rewardType === 'free-watch' ? 'a free watch' : '50% off a watch'
  const baseURL = process.env.NEXT_PUBLIC_SERVER_URL

  const productNames = eligibleProducts
    .map((p) => p.title?.trim())
    .filter((v): v is string => Boolean(v))

  const productList =
    productNames.length > 0 ? productNames.join(', ') : 'the eligible raffle watch selection'

  const linkedProducts = eligibleProducts.filter(
    (p): p is { slug: string; title?: null | string } => Boolean(p.slug),
  )

  const redemptionDeadline = expiresAt
    ? new Date(expiresAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null

  return (
    <Html>
      <Head />
      <Preview>
        You won {rewardLabel} in {raffleTitle}!
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://res.cloudinary.com/dovnrf0xc/image/upload/v1764507920/F_Watches_Logo__sn3dom.png"
              width="300"
              height="120"
              alt="Fwatches"
              style={logo}
            />
          </Section>

          <Section style={contentSection}>
            <Text style={heading}>You Won!</Text>

            <Text style={paragraph}>
              Congratulations <strong>{customerEmail}</strong> — you were selected as a winner in{' '}
              <strong>{raffleTitle}</strong>!
            </Text>

            <Text style={paragraph}>
              Your reward: <strong>{rewardLabel}</strong>, applicable to{' '}
              <strong>{productList}</strong>.
            </Text>

            {/* Code box */}
            <Section style={codeBox}>
              <Text style={codeLabel}>Your One-Time Discount Code</Text>
              <Text style={codeText}>{code}</Text>
              <Text style={codeSub}>
                {redemptionDeadline ? `Expires ${redemptionDeadline}` : 'Single use only'}
              </Text>
            </Section>

            {/* Eligible products */}
            {linkedProducts.length > 0 && (
              <>
                <Text style={subheading}>Eligible Watches</Text>
                <Section style={productListBox}>
                  {linkedProducts.map((product) => {
                    const label = product.title?.trim() || product.slug
                    const url = `${baseURL}/shop/${product.slug}`
                    return (
                      <Section key={product.slug} style={productItem}>
                        <Link href={url} style={productLink}>
                          {label} →
                        </Link>
                      </Section>
                    )
                  })}
                </Section>
              </>
            )}

            <Hr style={divider} />

            {/* Redemption steps */}
            <Text style={subheading}>How to Redeem</Text>

            {[
              'Visit one of the eligible watch pages and add it to your cart.',
              'Continue to checkout on the Fwatches website.',
              'Enter your winning code exactly as shown above in the discount code field.',
              'Confirm the discount has been applied before completing payment.',
            ].map((step, i) => (
              <Section key={i} style={stepRow}>
                <Section style={stepNumberBox}>
                  <Text style={stepNumber}>{i + 1}</Text>
                </Section>
                <Text style={stepText}>{step}</Text>
              </Section>
            ))}

            <Hr style={divider} />

            {/* Warning */}
            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>Important:</strong> This code is one-time use and non-transferable. If the
                discount does not apply, ensure your cart contains only an eligible raffle watch.
                {redemptionDeadline && (
                  <>
                    {' '}
                    The code will expire on <strong>{redemptionDeadline}</strong>.
                  </>
                )}
              </Text>
            </Section>
          </Section>

          <Section style={footerSection}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Fwatches. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const WinnerEmailHtml = async (props: WinnerEmailProps) => {
  return await render(<WinnerEmail {...props} />, { pretty: true })
}

// Styles
const main = {
  backgroundColor: '#f6f6f6',
  fontFamily: '"Helvetica Neue",Helvetica,Arial,sans-serif',
  padding: '20px',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
}

const logoSection = {
  backgroundColor: '#1a1a1a',
  padding: '40px 20px',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto',
  borderRadius: '12px',
}

const contentSection = {
  padding: '40px 40px 20px',
}

const heading = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 24px',
  textAlign: 'center' as const,
}

const subheading = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#1a1a1a',
  margin: '0 0 16px',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4a4a4a',
  margin: '0 0 16px',
}

const codeBox = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const codeLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#999999',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 12px',
}

const codeText = {
  fontSize: '36px',
  fontWeight: '700',
  color: '#ffffff',
  letterSpacing: '6px',
  margin: '0',
  lineHeight: '1',
}

const codeSub = {
  fontSize: '14px',
  color: '#999999',
  margin: '12px 0 0',
}

const productListBox = {
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  padding: '8px 16px',
  margin: '0 0 24px',
}

const productItem = {
  padding: '8px 0',
  borderBottom: '1px solid #eeeeee',
}

const productLink = {
  fontSize: '15px',
  color: '#1a1a1a',
  textDecoration: 'none',
  fontWeight: '600',
}

const stepRow = {
  display: 'flex' as const,
  alignItems: 'flex-start' as const,
  margin: '0 0 12px',
  gap: '12px',
}

const stepNumberBox = {
  backgroundColor: '#1a1a1a',
  borderRadius: '50%',
  width: '28px',
  height: '28px',
  display: 'inline-flex' as const,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  flexShrink: '0' as unknown as number,
}

const stepNumber = {
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: '700',
  margin: '0',
  lineHeight: '28px',
  textAlign: 'center' as const,
}

const stepText = {
  fontSize: '15px',
  lineHeight: '1.6',
  color: '#4a4a4a',
  margin: '0',
}

const divider = {
  margin: '32px 0',
  borderColor: '#eeeeee',
}

const warningBox = {
  backgroundColor: '#fff3cd',
  border: '1px solid #ffc107',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
}

const warningText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#856404',
  margin: '0',
}

const footerSection = {
  padding: '20px 40px 40px',
  borderTop: '1px solid #eeeeee',
}

const footerText = {
  fontSize: '12px',
  color: '#999999',
  textAlign: 'center' as const,
  margin: '0',
}

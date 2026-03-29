import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  render,
} from '@react-email/components'
import * as React from 'react'

interface RafflePurchaseConfirmationEmailProps {
  confirmationToken: string
  customerEmail: string
  quantity: number
  raffleSlug: string
  raffleTitle: string
}

export const RafflePurchaseConfirmationEmail = ({
  confirmationToken,
  customerEmail,
  quantity,
  raffleSlug,
  raffleTitle,
}: RafflePurchaseConfirmationEmailProps) => {
  const manageURL = `${process.env.NEXT_PUBLIC_SERVER_URL}/raffles/${raffleSlug}/confirmed/${confirmationToken}`

  return (
    <Html>
      <Head />
      <Preview>Your {raffleTitle} ticket is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src={`https://res.cloudinary.com/dovnrf0xc/image/upload/v1764507920/F_Watches_Logo__sn3dom.png`}
              width="300"
              height="120"
              alt="Fwatches"
              style={logo}
            />
          </Section>

          <Section style={contentSection}>
            <Text style={heading}>You&apos;re In! 🎉</Text>

            <Text style={paragraph}>
              Your entry into <strong>{raffleTitle}</strong> has been confirmed for{' '}
              <strong>{customerEmail}</strong>.
            </Text>

            <Section style={ticketBox}>
              <Text style={ticketLabel}>Tickets Purchased</Text>
              <Text style={ticketCount}>{quantity}</Text>
              <Text style={ticketSub}>ticket{quantity === 1 ? '' : 's'}</Text>
            </Section>

            <Text style={paragraph}>
              Track your entry and complete bonus activities to improve your chances:
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={manageURL}>
                Manage My Entry
              </Button>
            </Section>

            <Text style={paragraph}>Or copy and paste this link into your browser:</Text>
            <Link href={manageURL} style={link}>
              {manageURL}
            </Link>

            <Hr style={divider} />

            <Section style={infoBox}>
              <Text style={infoText}>
                <strong>Good luck!</strong> Keep an eye on your inbox — we&apos;ll notify you as
                soon as the winner is announced.
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

export const RafflePurchaseConfirmationEmailHtml = async (
  props: RafflePurchaseConfirmationEmailProps,
) => {
  return await render(<RafflePurchaseConfirmationEmail {...props} />, {
    pretty: true,
  })
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

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#4a4a4a',
  margin: '0 0 16px',
}

const ticketBox = {
  backgroundColor: '#1a1a1a',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 0',
  textAlign: 'center' as const,
}

const ticketLabel = {
  fontSize: '12px',
  fontWeight: '600',
  color: '#999999',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px',
}

const ticketCount = {
  fontSize: '48px',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0',
  lineHeight: '1',
}

const ticketSub = {
  fontSize: '14px',
  color: '#999999',
  margin: '4px 0 0',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  backgroundColor: '#1a1a1a',
  color: '#ffffff',
  padding: '14px 40px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '600',
  display: 'inline-block',
}

const link = {
  color: '#0066cc',
  fontSize: '14px',
  textDecoration: 'none',
  wordBreak: 'break-all' as const,
}

const divider = {
  margin: '32px 0',
  borderColor: '#eeeeee',
}

const infoBox = {
  backgroundColor: '#f0fdf4',
  border: '1px solid #86efac',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
}

const infoText = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#166534',
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

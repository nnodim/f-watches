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

interface VerifyEmailProps {
  token: string
  userEmail: string
}

export const VerifyEmail = ({ token, userEmail }: VerifyEmailProps) => {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/verify-email?token=${token}`

  return (
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
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
            <Text style={heading}>Verify Your Email Address</Text>

            <Text style={paragraph}>
              Thank you for signing up! Please verify your email address to complete your
              registration.
            </Text>

            <Text style={paragraph}>
              We need to verify that <strong>{userEmail}</strong> belongs to you.
            </Text>

            <Section style={buttonSection}>
              <Button style={button} href={verifyUrl}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={paragraph}>Or copy and paste this link into your browser:</Text>
            <Link href={verifyUrl} style={link}>
              {verifyUrl}
            </Link>

            <Hr style={divider} />

            <Text style={footer}>
              If you didn&apos;t create an account with Fwatches, you can safely ignore this email.
            </Text>

            <Text style={footer}>This verification link will expire in 24 hours.</Text>
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

export const VerifyEmailHtml = async (props: VerifyEmailProps) => {
  return await render(<VerifyEmail {...props} />, {
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

const footer = {
  fontSize: '14px',
  lineHeight: '1.6',
  color: '#666666',
  margin: '0 0 12px',
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

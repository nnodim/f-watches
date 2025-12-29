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

interface ForgotPasswordEmailProps {
  token: string
  userEmail: string
}

export const ForgotPasswordEmail = ({ token, userEmail }: ForgotPasswordEmailProps) => {
  const resetUrl = `${process.env.NEXT_PUBLIC_SERVER_URL}/reset-password?token=${token}`

  return (
    <Html>
      <Head />
      <Preview>Reset your password</Preview>
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
            <Text style={heading}>Reset Your Password</Text>

            <Text style={paragraph}>
              We received a request to reset the password for your account associated with{' '}
              <strong>{userEmail}</strong>.
            </Text>

            <Text style={paragraph}>Click the button below to reset your password:</Text>

            <Section style={buttonSection}>
              <Button style={button} href={resetUrl}>
                Reset Password
              </Button>
            </Section>

            <Text style={paragraph}>Or copy and paste this link into your browser:</Text>
            <Link href={resetUrl} style={link}>
              {resetUrl}
            </Link>

            <Hr style={divider} />

            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>Security Notice:</strong> If you didn&apos;t request a password reset,
                please ignore this email or contact support if you have concerns about your account
                security.
              </Text>
            </Section>

            <Text style={footer}>
              This password reset link will expire in 1 hour for security reasons.
            </Text>
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

export const ForgotPasswordEmailHtml = async (props: ForgotPasswordEmailProps) => {
  return await render(<ForgotPasswordEmail {...props} />, {
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

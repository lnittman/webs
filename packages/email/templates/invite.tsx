import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface InviteEmailProps {
  inviterName: string;
  chatTitle: string;
  inviteLink: string;
}

export const InviteEmail = ({
  inviterName,
  chatTitle,
  inviteLink,
}: InviteEmailProps) => {
  const previewText = `${inviterName} has invited you to chat: ${chatTitle}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src="https://example.com/logo.png"
            width="120"
            height="40"
            alt="Webs Logo"
            style={logo}
          />
          <Heading style={heading}>Join a Conversation</Heading>
          <Text style={paragraph}>
            <strong>{inviterName}</strong> has invited you to join a chat: <strong>{chatTitle}</strong>
          </Text>
          <Button href={inviteLink} style={button}>
            View Chat
          </Button>
          <Text style={paragraph}>
            or copy and paste this URL into your browser:{' '}
            <Link href={inviteLink} style={link}>
              {inviteLink}
            </Link>
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            webs - AI conversations that matter
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export const createInviteEmail = ({
  inviterName,
  chatTitle,
  inviteLink,
}: InviteEmailProps) => {
  return (
    <InviteEmail
      inviterName={inviterName}
      chatTitle={chatTitle}
      inviteLink={inviteLink}
    />
  );
};

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
};

const logo = {
  margin: '0 auto 20px',
  display: 'block',
};

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
  color: '#111111',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
  color: '#333333',
};

const button = {
  backgroundColor: '#5850EB',
  borderRadius: '8px',
  color: '#fff',
  fontWeight: '600',
  padding: '12px 24px',
  textAlign: 'center' as const,
  fontSize: '16px',
  textDecoration: 'none',
  display: 'block',
  width: '100%',
  margin: '30px 0',
};

const link = {
  color: '#5850EB',
  textDecoration: 'underline',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '30px 0',
};

const footer = {
  fontSize: '14px',
  color: '#8898aa',
  textAlign: 'center' as const,
  marginTop: '30px',
}; 
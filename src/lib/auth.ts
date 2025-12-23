import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { customSession, jwt } from 'better-auth/plugins';
import { sendEmail } from './utils/email';
import { fetchUserRole } from './utils/fetch-roles';
import { authClient } from './auth-client';
import { da } from 'zod/v4/locales';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum number of connections in the pool
  min: 5, // Minimum number of connections in the pool
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 5000 // Timeout when trying to connect
});

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  database: pool,

  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }, request) => {
      await sendEmail({
        purpose: 'email-verification',
        email: user.email,
        url: `${url}?token=${token}`
      });
    },
    async afterEmailVerification(user, request) {
      // Your custom logic here, e.g., grant access to premium features
      console.log(`${user.email} has been successfully verified!`);
    }
  },
  emailAndPassword: {
    requireEmailVerification: true,

    enabled: true,
    sendResetPassword: async ({ user, url, token }) => {
      await sendEmail({
        purpose: 'reset-password',
        email: user.email,
        url: `${url}?token=${token}`
      });
    },
    onPasswordReset: async ({ user }) => {
      // your logic here
      console.log(`Password for user ${user.email} has been reset.`);
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      getUserInfo: async (token) => {
        // Custom implementation to get user info
        const response = await fetch(
          'https://www.googleapis.com/oauth2/v2/userinfo',
          {
            headers: {
              Authorization: `Bearer ${token.accessToken}`
            }
          }
        );
        const profile = await response.json();
        console.log(profile);
        return {
          user: {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            image: profile.picture,
            emailVerified: profile.verified_email
          },
          data: profile
        };
      }
    }
  },
  plugins: [
    jwt(),
    customSession(async ({ user, session }) => {
      const role = await fetchUserRole(user.id);

      return {
        user: {
          ...user,
          role: role
        },
        session
      };
    })
  ]
});

export type Session = typeof auth.$Infer.Session;

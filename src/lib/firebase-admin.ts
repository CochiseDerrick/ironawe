import 'server-only';
import {cert, getApps, initializeApp, type App} from 'firebase-admin/app';
import {getDatabase, type Database} from 'firebase-admin/database';

/**
 * Server-only Firebase Admin SDK client. This is the ONLY thing in this codebase that's
 * allowed to bypass Realtime Database security rules - it authenticates as a trusted
 * service account rather than as a browser user, which is what lets trusted server code
 * (checkout, the Stripe webhook, order fulfillment) write to paths that are otherwise
 * locked to the admin's own Firebase Auth account.
 *
 * NEVER import this from a "use client" component or anything that could end up in a
 * browser bundle - the `server-only` import above will throw a build error if that happens.
 *
 * Required env vars (server-only, do NOT prefix with NEXT_PUBLIC_):
 *   FIREBASE_CLIENT_EMAIL - from your service account JSON's `client_email`
 *   FIREBASE_PRIVATE_KEY  - from your service account JSON's `private_key` (keep the \n's)
 * Reuses NEXT_PUBLIC_FIREBASE_PROJECT_ID and NEXT_PUBLIC_FIREBASE_DATABASE_URL, which are
 * already public config, not secrets.
 *
 * Get a service account key: Firebase Console -> Project Settings -> Service Accounts ->
 * Generate new private key.
 */

const ADMIN_APP_NAME = 'ironawe-admin';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Service account keys are usually pasted into env files with literal "\n" sequences
// instead of real newlines - normalize that so `cert()` gets a valid PEM key.
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

export const isFirebaseAdminConfigured = Boolean(projectId && databaseURL && clientEmail && privateKey);

function getAdminApp(): App | null {
    if (!isFirebaseAdminConfigured) return null;

    const existing = getApps().find(app => app.name === ADMIN_APP_NAME);
    if (existing) return existing;

    return initializeApp(
        {
            credential: cert({
                projectId,
                clientEmail,
                privateKey,
            }),
            databaseURL,
        },
        ADMIN_APP_NAME
    );
}

const adminApp = getAdminApp();

export const adminDb: Database | null = adminApp ? getDatabase(adminApp) : null;

if (!isFirebaseAdminConfigured) {
    console.warn(
        'Firebase Admin SDK is not configured (missing FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY). ' +
        'Checkout, the Stripe webhook, and order fulfillment will fail until these are set in your environment.'
    );
}

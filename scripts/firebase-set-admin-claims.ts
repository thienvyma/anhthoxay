/**
 * Script to set admin custom claims for a Firebase user
 *
 * Usage:
 *   npx ts-node scripts/firebase-set-admin-claims.ts <email>
 *
 * Example:
 *   npx ts-node scripts/firebase-set-admin-claims.ts admin@example.com
 *
 * Prerequisites:
 *   - Set GOOGLE_APPLICATION_CREDENTIALS env var to service account JSON path
 *   - Or run from a machine with Application Default Credentials
 */

import * as admin from 'firebase-admin';

const PROJECT_ID = 'noithatnhanh-f8f72';

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Usage: npx ts-node scripts/firebase-set-admin-claims.ts <email>');
    console.error('   Example: npx ts-node scripts/firebase-set-admin-claims.ts admin@example.com');
    process.exit(1);
  }

  // Initialize Firebase Admin
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: PROJECT_ID,
    });
  }

  const auth = admin.auth();

  try {
    // Get user by email
    const user = await auth.getUserByEmail(email);
    console.log(`✅ Found user: ${user.uid} (${user.email})`);

    // Set custom claims
    const claims = {
      role: 'ADMIN',
      verificationStatus: 'VERIFIED',
    };

    await auth.setCustomUserClaims(user.uid, claims);
    console.log(`✅ Set custom claims for ${email}:`, claims);

    // Verify claims were set
    const updatedUser = await auth.getUser(user.uid);
    console.log('✅ Verified claims:', updatedUser.customClaims);

    console.log('\n🎉 Done! User can now access admin panel.');
    console.log('   Note: User needs to sign out and sign in again for claims to take effect.');
  } catch (error) {
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/user-not-found') {
      console.error(`❌ User not found: ${email}`);
    } else {
      console.error('❌ Error:', err.message);
    }
    process.exit(1);
  }
}

main();

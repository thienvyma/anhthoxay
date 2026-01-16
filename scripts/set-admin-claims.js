/**
 * Script to set admin custom claims for a Firebase user
 * 
 * This script uses the Firebase Admin SDK with Application Default Credentials.
 * 
 * Prerequisites:
 * 1. Install gcloud CLI: https://cloud.google.com/sdk/docs/install
 * 2. Login: gcloud auth application-default login
 * 3. Set project: gcloud config set project noithatnhanh-f8f72
 * 
 * Usage:
 *   node scripts/set-admin-claims.js <email>
 * 
 * Example:
 *   node scripts/set-admin-claims.js admin@example.com
 */

const admin = require('firebase-admin');

const PROJECT_ID = 'noithatnhanh-f8f72';

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error('❌ Usage: node scripts/set-admin-claims.js <email>');
    console.error('   Example: node scripts/set-admin-claims.js admin@example.com');
    process.exit(1);
  }

  // Initialize Firebase Admin with Application Default Credentials
  if (admin.apps.length === 0) {
    admin.initializeApp({
      projectId: PROJECT_ID,
    });
  }

  const auth = admin.auth();

  try {
    // Get user by email
    console.log(`🔍 Looking for user: ${email}`);
    const user = await auth.getUserByEmail(email);
    console.log(`✅ Found user: ${user.uid} (${user.email})`);
    console.log(`   Current claims:`, user.customClaims || 'none');

    // Set custom claims
    const claims = {
      role: 'ADMIN',
      verificationStatus: 'VERIFIED',
    };

    await auth.setCustomUserClaims(user.uid, claims);
    console.log(`✅ Set custom claims:`, claims);

    // Verify claims were set
    const updatedUser = await auth.getUser(user.uid);
    console.log('✅ Verified claims:', updatedUser.customClaims);

    console.log('\n🎉 Done! User is now an ADMIN.');
    console.log('   Note: User needs to sign out and sign in again for claims to take effect.');
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User not found: ${email}`);
    } else {
      console.error('❌ Error:', error.message);
    }
    process.exit(1);
  }
}

main();

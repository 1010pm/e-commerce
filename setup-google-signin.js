#!/usr/bin/env node

/**
 * INTERACTIVE GUIDE: Find Your Google OAuth Client ID
 * 
 * This guide walks you through finding your Google Client ID
 * and adding it to your .env.local file
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(q) {
  return new Promise(resolve => rl.question(q, resolve));
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🔧 GOOGLE SIGN-IN CLIENT ID SETUP GUIDE 🔧              ║
║                                                              ║
║  Follow these steps to fix Google Sign-In not working:      ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);

  console.log(`
📍 STEP 1: Get Your Client ID from Firebase Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Follow these steps:

1. Open: https://console.firebase.google.com
2. Select your project: "e-commerce-68ee4"
3. Click "Authentication" (left sidebar)
4. Click the "Google" provider (or Settings ⚙️)
5. Look for "Web Client ID" - copy this value

The Client ID looks like:
📋 443222871434-abc123def456.apps.googleusercontent.com

Once you have your Client ID, paste it below:
  `);

  const clientId = await question('\n👉 Paste your Web Client ID here: ');

  if (!clientId || !clientId.includes('.apps.googleusercontent.com')) {
    console.log(`
❌ ERROR: That doesn't look like a valid Client ID.

A valid Client ID looks like:
📋 443222871434-abc123def456.apps.googleusercontent.com

Common mistakes:
- Copied "API Key" instead of "Web Client ID"
- Left extra spaces at beginning/end
- Copied the wrong value

⏸️  Please try again with the correct Client ID.
    `);
    rl.close();
    return;
  }

  console.log(`
✅ Client ID looks valid!

📍 STEP 2: Adding to .env.local
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);

  const envPath = path.join(__dirname, '.env.local');

  try {
    let envContent = fs.readFileSync(envPath, 'utf-8');

    // Check if CLIENT_ID already exists
    if (envContent.includes('REACT_APP_GOOGLE_CLIENT_ID')) {
      console.log(`
⚠️  .env.local already has GOOGLE_CLIENT_ID

Current value:
${envContent.split('\n').find(line => line.includes('REACT_APP_GOOGLE_CLIENT_ID'))}

Do you want to update it? (yes/no)
      `);
      
      const update = await question('👉 Update? (yes/no): ');
      
      if (update.toLowerCase() === 'yes') {
        envContent = envContent.replace(
          /REACT_APP_GOOGLE_CLIENT_ID=.*/,
          `REACT_APP_GOOGLE_CLIENT_ID=${clientId}`
        );
      } else {
        console.log('✅ Keeping existing value');
        rl.close();
        return;
      }
    } else {
      // Add new line
      if (!envContent.endsWith('\n')) {
        envContent += '\n';
      }
      envContent += `\n# Google OAuth Configuration (Required for Google Sign-In)\nREACT_APP_GOOGLE_CLIENT_ID=${clientId}\n`;
    }

    fs.writeFileSync(envPath, envContent);
    
    console.log(`
✅ SUCCESS! Client ID added to .env.local

📍 STEP 3: Restart Your Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Stop the server:
   Press Ctrl+C in your terminal

2. Start the server:
   npm start

3. Test Google Sign-In:
   - Go to your login page
   - Click "Continue with Google"
   - You should see the Google popup!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ That's it! Google Sign-In should now work perfectly!

📝 Added to .env.local:
   REACT_APP_GOOGLE_CLIENT_ID=${clientId}
    `);

  } catch (error) {
    console.log(`
❌ ERROR: Could not find .env.local file

Please make sure you're in the project root directory:
📁 c:\\Users\\user\\Desktop\\projects\\e-commerce\\e-commerce

Then run:
   node setup-google-signin.js
    `);
  }

  rl.close();
}

main().catch(console.error);

#!/usr/bin/env node

/**
 * Simple User Creation Script
 * Usage: node create-user.js
 *
 * This script provides an interactive CLI to create users with roles and organizations.
 */

const readline = require('readline');
const https = require('https');
const http = require('http');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function makeRequest(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify(data));
    req.end();
  });
}

function generatePassword() {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const digits = '0123456789';
  const special = '!@#$%^&*';

  const getRandomChar = (str) => str[Math.floor(Math.random() * str.length)];

  let password = '';
  password += getRandomChar(uppercase);
  password += getRandomChar(uppercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(lowercase);
  password += getRandomChar(digits);
  password += getRandomChar(digits);
  password += getRandomChar(digits);
  password += getRandomChar(digits);
  password += getRandomChar(special);
  password += getRandomChar(special);

  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function main() {
  console.log('\n🎯 Create New User\n');

  const email = await question('📧 Email address: ');
  const firstName = await question('👤 First name: ');
  const lastName = await question('👤 Last name: ');

  console.log('\n📋 Available Roles:');
  console.log('   1. SUPER_ADMIN  - SaaS platform administrator (manually assigned)');
  console.log('   2. ADMIN        - Organization administrator');
  console.log('   3. MEMBER       - Standard team member');
  console.log('   4. VIEWER       - Read-only access');

  let roleInput = await question('\n🔐 Select role (1-4) [default: 2]: ');
  if (!roleInput) roleInput = '2';

  const roleMap = {
    '1': 'SUPER_ADMIN',
    '2': 'ADMIN',
    '3': 'MEMBER',
    '4': 'VIEWER',
  };

  const role = roleMap[roleInput] || 'ADMIN';

  const passwordChoice = await question(
    '\n🔑 Generate secure password? (y/n) [default: y]: '
  );
  let password;

  if (passwordChoice.toLowerCase() === 'n') {
    password = await question('Enter password: ');
  } else {
    password = generatePassword();
    console.log(`Generated password: ${password}`);
  }

  console.log('\n🏢 Organization:');
  const orgChoice = await question(
    'Create new organization? (y/n) [default: n]: '
  );

  let organizationName;
  let organizationSlug;

  if (orgChoice.toLowerCase() === 'y') {
    organizationName = await question('Organization name: ');
    organizationSlug = organizationName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    const slugConfirm = await question(
      `Slug will be: "${organizationSlug}" (ok? y/n): `
    );
    if (slugConfirm.toLowerCase() === 'n') {
      organizationSlug = await question('Enter slug: ');
    }
  }

  console.log('\n⏳ Creating user via API...\n');

  try {
    // Call the API endpoint to create user
    const apiData = {
      email,
      firstName,
      lastName,
      password,
      role,
      ...(organizationName && { organizationName, organizationSlug }),
    };

    const response = await makeRequest('POST', '/api/admin/create-user', apiData);

    if (response.status === 201 || response.status === 200) {
      const user = response.data.data || response.data;
      const org = user.organization || {};

      console.log('✅ User created successfully!\n');
      console.log('═══════════════════════════════════════');
      console.log('📋 User Details:');
      console.log('═══════════════════════════════════════');
      console.log(`   Email:        ${user.email}`);
      console.log(`   Name:         ${user.firstName} ${user.lastName}`);
      console.log(`   Password:     ${password}`);
      console.log(`   Role:         ${user.role}`);
      console.log(`   Organization: ${org.name || 'Default'}`);
      console.log(`   Verified:     ✅ Yes`);
      console.log('═══════════════════════════════════════\n');

      console.log('🎯 Next steps:');
      console.log(`   1. Go to: http://localhost:3000/login`);
      console.log(`   2. Login with:`);
      console.log(`      Email:    ${user.email}`);
      console.log(`      Password: ${password}`);

      if (role === 'SUPER_ADMIN') {
        console.log(`\n⚠️  This is a SUPER_ADMIN account!`);
        console.log(`   You can manage inscription requests at:`);
        console.log(`   http://localhost:3000/admin/inscriptions`);
      }

      console.log();
    } else {
      console.log('❌ Error creating user:\n');
      console.log(`Status: ${response.status}\n`);

      if (response.data && typeof response.data === 'object') {
        if (response.data.error) {
          console.log(`Error: ${response.data.error}`);
        }
        if (response.data.details) {
          console.log(`Details: ${response.data.details}`);
        }
        if (response.data.type) {
          console.log(`Type: ${response.data.type}`);
        }
        if (response.data.received) {
          console.log('\nReceived fields:');
          console.log(JSON.stringify(response.data.received, null, 2));
        }

        console.log('\nFull response:');
        console.log(JSON.stringify(response.data, null, 2));
      } else {
        console.log(JSON.stringify(response.data, null, 2));
      }

      console.log('\n⚠️  Make sure:');
      console.log('   1. Development server is running (npm run dev)');
      console.log('   2. Database is properly configured in .env.local');
      console.log('   3. DATABASE_URL is set correctly');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log(
      '\n⚠️  Make sure the development server is running (npm run dev)'
    );
  } finally {
    rl.close();
  }
}

main();

#!/usr/bin/env node

// ask for user email
// and ask for automatic password generation or manual password entry
// then update the user password in the database with the new password

const readline = require("readline");
const https = require("https");
const http = require("http");

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
			hostname: "localhost",
			port: 3000,
			path: path,
			method: method,
			headers: {
				"Content-Type": "application/json",
			},
		};

		const req = http.request(options, (res) => {
			let body = "";
			res.on("data", (chunk) => {
				body += chunk;
			});
			res.on("end", () => {
				try {
					const parsed = JSON.parse(body);
					resolve({ status: res.statusCode, data: parsed });
				} catch (e) {
					resolve({ status: res.statusCode, data: body });
				}
			});
		});

		req.on("error", reject);
		req.write(JSON.stringify(data));
		req.end();
	});
}

function generatePassword() {
	const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const lowercase = "abcdefghijklmnopqrstuvwxyz";
	const digits = "0123456789";
	const special = "!@#$%^&*";

	const getRandomChar = (str) => str[Math.floor(Math.random() * str.length)];

	let password = "";
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

	return password
		.split("")
		.sort(() => Math.random() - 0.5)
		.join("");
}

async function main() {
	console.log("\n🎯 Set User Password\n");

	const email = await question("📧 Email address: ");

	const passwordChoice = await question(
		"\n🔑 Generate secure password? (y/n) [default: y]: ",
	);
	let password;

	if (passwordChoice.toLowerCase() === "n") {
		password = await question("Enter password: ");
	} else {
		password = generatePassword();
		console.log(`Generated password: ${password}`);
	}

	try {
		// Call the API endpoint to create user
		const apiData = {
			email,
			password,
		};

		const response = await makeRequest(
			"POST",
			"/api/admin/change-password",
			apiData,
		);

		if (response.status === 201 || response.status === 200) {
			const user = response.data.data || response.data;
			const org = user.organization || {};

			console.log("✅ User Password changed successfully!\n");
			console.log("═══════════════════════════════════════");
			console.log("📋 User Details:");
			console.log("═══════════════════════════════════════");
			console.log(`   Email:        ${user.email}`);
			console.log(`   Name:         ${user.firstName} ${user.lastName}`);
			console.log(`   Password:     ${password}`);
			console.log(`   Role:         ${user.role}`);
			console.log(`   Organization: ${org.name || "Default"}`);
			console.log(`   Verified:     ✅ Yes`);
			console.log("═══════════════════════════════════════\n");

			console.log("🎯 Next steps:");
			console.log(`   1. Go to: http://localhost:3000/login`);
			console.log(`   2. Login with:`);
			console.log(`      Email:    ${user.email}`);
			console.log(`      Password: ${password}`);

			if (role === "SUPER_ADMIN") {
				console.log(`\n⚠️  This is a SUPER_ADMIN account!`);
				console.log(`   You can manage inscription requests at:`);
				console.log(`   http://localhost:3000/admin/inscriptions`);
			}

			console.log();
		} else {
			console.log("❌ Error changing user password:\n");
			console.log(`Status: ${response.status}\n`);

			if (response.data && typeof response.data === "object") {
				console.log("\nFull response:");
				console.log(JSON.stringify(response.data, null, 2));
			} else {
				console.log(JSON.stringify(response.data, null, 2));
			}

			console.log("\n⚠️  Make sure:");
			console.log("   1. Development server is running (npm run dev)");
			console.log("   2. Database is properly configured in .env.local");
			console.log("   3. DATABASE_URL is set correctly");
		}
	} catch (error) {
		console.error("❌ Error:", error.message);
		console.log(
			"\n⚠️  Make sure the development server is running (npm run dev)",
		);
	} finally {
		rl.close();
	}
}

main();

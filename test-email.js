const nodemailer = require('nodemailer');
require('dotenv').config(); // Charge le fichier .env

async function testEmail() {
  // Récupération des variables (identiques à celles de src/lib/email.ts)
  const host = process.env.MAIL_HOST || process.env.EMAIL_SMTP_HOST || 'localhost';
  const port = parseInt(process.env.MAIL_PORT || process.env.EMAIL_SMTP_PORT || '587');
  const user = process.env.MAIL_USERNAME || process.env.EMAIL_SMTP_USER;
  const pass = process.env.MAIL_PASSWORD || process.env.EMAIL_SMTP_PASS;
  const from = process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM_ADDRESS || 'test@example.com';
  
  const isSecure = process.env.MAIL_ENCRYPTION === 'ssl' || port === 465;

  console.log('--- Configuration de test ---');
  console.log(`Host: ${host}`);
  console.log(`Port: ${port}`);
  console.log(`Pass : ${pass}`);
  console.log(`Secure: ${isSecure}`);
  console.log(`User: ${user}`);
  console.log(`From: ${from}`);
  console.log('-----------------------------');

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: false // Permet de tester même avec des certificats auto-signés
    }
  });

  try {
    console.log('Vérification de la connexion au serveur SMTP...');
    await transporter.verify();
    console.log('✅ Connexion réussie !');

    console.log('Envoi de l\'email de test...');
    const info = await transporter.sendMail({
      from: `"Test Panoramate" <${from}>`,
      to: from, // S'envoie à soi-même pour le test
      subject: 'Test de configuration Email Panoramate',
      text: 'Si vous recevez cet email, votre configuration SMTP est correcte.',
      html: '<h1>Succès !</h1><p>Votre configuration SMTP fonctionne parfaitement.</p>'
    });

    console.log('✅ Email envoyé avec succès !');
    console.log('ID du message :', info.messageId);
  } catch (error) {
    console.error('❌ Erreur lors du test :');
    console.error(error);
  }
}

testEmail();

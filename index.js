// Backend sécurisé pour formulaire de contact
const fs = require('fs');
const path = require('path');

// Charger les variables d'environnement depuis .env.json
let envConfig = {};
try {
  const envPath = path.join(__dirname, '.env.json');
  if (fs.existsSync(envPath)) {
    envConfig = JSON.parse(fs.readFileSync(envPath, 'utf8'));
    Object.keys(envConfig).forEach(key => {
      process.env[key] = envConfig[key];
    });
  }
} catch (error) {
  console.error('Erreur lors du chargement de .env.json:', error);
}

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Route de test simple
app.get('/test', (req, res) => {
  res.json({ message: 'Backend fonctionne correctement !' });
});

// Route pour le formulaire de contact
app.post('/contact', async (req, res) => {
  console.log('Requête reçue:', req.body); // Debug
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
  }

  try {
    console.log('Configuration email:', {
      user: process.env.MAIL_USER,
      to: process.env.MAIL_TO || process.env.MAIL_USER
    });
    
    // Configurer le transporteur SMTP (exemple avec Gmail)
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Préparer l'email
    let mailOptions = {
      from: email,
      to: process.env.MAIL_TO || process.env.MAIL_USER,
      subject: `Nouveau message de contact de ${name}`,
      text: `Nom: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    console.log('Tentative d\'envoi d\'email...');
    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    console.log('Email envoyé avec succès !');
    res.json({ success: true, message: 'Message envoyé avec succès !' });
  } catch (error) {
    console.error('Erreur email détaillée:', error); // Debug
    res.status(500).json({ error: "Erreur lors de l'envoi de l'email: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur backend contact démarré sur http://localhost:${PORT}`);
}); 
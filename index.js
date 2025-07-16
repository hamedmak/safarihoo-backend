// Backend sécurisé pour formulaire de contact
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch'); // Ajouté pour DeepSeek

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

// === ROUTE AI RESEARCH (DeepSeek) ===
app.post('/ai-research', async (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question manquante.' });
  }
  // Prompt enrichi pour guider l'IA à inclure les liens d'affiliation
  const prompt = `Réponds à la question suivante de façon structurée (listes, tableaux, conseils). Pour chaque recommandation d’hôtel, d’activité ou de vol, utilise les liens d’affiliation suivants si possible :\n- Hôtels : https://hotellook.tpm.li/b7olhaGZ\n- Vols : https://aviasales.tpm.li/LrJL8WFF\n- Activités : https://wegotrip.tpm.li/MiJxBGR8\nSi tu proposes un hôtel à Bali, ajoute le lien d’affiliation hôtel. Si tu proposes un vol, ajoute le lien vol, etc.\nQuestion utilisateur : ${question}`;
  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Tu es un assistant de voyage qui répond toujours avec des listes, tableaux, liens d’affiliation et conseils pratiques.' },
          { role: 'user', content: prompt }
        ]
      })
    });
    const data = await response.json();
    console.log('Réponse DeepSeek brute:', JSON.stringify(data)); // Ajout debug
    if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      res.json({ success: true, answer: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: "Réponse inattendue de l'API DeepSeek." });
    }
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de l'appel à DeepSeek: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Serveur backend contact démarré sur http://localhost:${PORT}`);
}); 
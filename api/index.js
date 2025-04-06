const express = require("express");
const path = require("path");
const serverless = require("serverless-http");

const app = express();

// Définir le moteur de rendu pour les fichiers EJS
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src/views/pages"));

// Servir les fichiers statiques
app.use(express.static(path.join(process.cwd(), "public"))); // Utiliser process.cwd()

// Routes
app.get("/", (req, res) => {
  res.render("loading");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/nouvelle_commande", (req, res) => {
  // Calculer les chemins absolus à transmettre à la vue
  const headerPath = path.join(process.cwd(), 'src/views/components/header');
  const menuPath = path.join(process.cwd(), 'src/views/components/menu');

  res.render("serveur/nouvelle_commande", {
    utilisateur: {
      nom: "Paul BOAKE",
      role: "serveur"
    },
    headerPath: headerPath,
    menuPath: menuPath
  });
});

// Exporter la fonction pour Vercel
module.exports = app;
module.exports.handler = serverless(app);

const express = require("express");
const path = require("path");
const serverless = require("serverless-http");

const app = express();

// Définir le moteur de rendu pour les fichiers EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../src/views/pages"));

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.get("/", (req, res) => {
  res.render("loading");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/nouvelle_commande", (req, res) => {
  res.render("serveur/nouvelle_commande", {
    utilisateur: {
      nom: "Paul BOAKE",
      role: "serveur"
    }
  });
});

// Exporter la fonction pour Vercel
module.exports = app;
module.exports.handler = serverless(app);

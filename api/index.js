const express = require("express");
const path = require("path");
const serverless = require("serverless-http");

const app = express();

// Définir le moteur de rendu pour les fichiers EJS
app.set("view engine", "ejs");
app.set("views", [
    path.join(__dirname, "../src/views/pages"),
    path.join(__dirname, "../src/views")  // Ajouter le répertoire parent
  ]);

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


app.get("/commandes_attente", (req, res) => {
  res.render("serveur/commandes_attente", {
    utilisateur: {
      nom: "Paul BOAKE",
      role: "serveur"
    }
  });
});

app.get("/ajout_depense", (req, res) => {
  res.render("caissiere/ajout_depense", {
    utilisateur: {
      nom: "Paul BOAKE",
      role: "caissière"
    }
  });
});

app.get("/point_journee", (req, res) => {
  res.render("caissiere/point_journee", {
    utilisateur: {
      nom: "Paul BOAKE",
      role: "caissière"
    }
  });
});


app.get("/finaliser_commande", (req, res) => {
  res.render("caissiere/finaliser_commande", {
    utilisateur: {
      nom: "Paul BOAKE",
      role: "caissière"
    }
  });
});



// Exporter la fonction pour Vercel
module.exports = app;
module.exports.handler = serverless(app);

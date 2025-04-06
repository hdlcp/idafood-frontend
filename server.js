const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Définir le moteur de rendu pour les fichiers EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views/pages"));
// Servir les fichiers statiques (images, CSS, JS, etc.)
app.use(express.static(path.join(__dirname, "public")));


// Route pour la page de chargement
app.get("/", (req, res) => {
  res.render("loading");
});
// Route pour afficher la page de connexion
app.get("/login", (req, res) => {
    res.render("login"); // Affiche le fichier login.ejs
});
// Route pour afficher la page nouvelle commande

// Route pour afficher la page nouvelle commande
app.get('/nouvelle_commande', (req, res) => {
  res.render('serveur/nouvelle_commande', {
    utilisateur: {
      nom: "Paul BOAKE",
      role: "serveur"
    }
  });
});


// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

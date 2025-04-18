const express = require("express");
const path = require("path");
const serverless = require("serverless-http");
const axios = require("axios");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();

// Middlewares pour parser les requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration des sessions
app.use(session({
  secret: 'idafood_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// URL du backend
const API_URL = "https://idafoodback.onrender.com";
const API_URL_USER = "https://idafoodback.onrender.com/api/user";

// Définir le moteur de rendu pour les fichiers EJS
app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "../src/views/pages"),
  path.join(__dirname, "../src/views")
]);

// Servir les fichiers statiques
app.use(express.static(path.join(__dirname, "../public")));

// Middleware pour vérifier l'authentification
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Routes publiques
app.get("/", (req, res) => {
  res.render("loading");
});

app.get("/login", (req, res) => {
  // Passer un objet avec error à null par défaut
  res.render("login", { error: null });
});

// Route pour traiter le login
app.post("/login", async (req, res) => {
  try {
    const { username, password, role } = req.body;
    
    // Validation côté serveur
    if (!username || !password || !role) {
      return res.render("login", { error: "Veuillez remplir tous les champs" });
    }
    
    // Mapper les rôles correctement
    const roleMapping = {
      'boss': 'boss',
      'caissiere': 'caissiere',
      'cuisiniere': 'cuisiniere',
      'serveur': 'serveur'
    };
    
    const mappedRole = roleMapping[role] || role;
    
    // Appel à l'API de login
    const response = await axios.post(`${API_URL_USER}/login`, {
      nom: username,
      password: password,
      role: mappedRole
    });
    
    // Si la requête réussit, stocker les informations dans la session
    if (response.data.success) {
      req.session.user = response.data.data.user;
      req.session.token = response.data.data.token;
      
      // Rediriger selon le rôle
      switch(mappedRole) {
        case 'boss':
          return res.redirect('/employes');
        case 'caissiere':
          return res.redirect('/point_journee');
        case 'cuisiniere':
          return res.redirect('/commande_totale');
        case 'serveur':
          return res.redirect('/nouvelle_commande');
        default:
          return res.redirect('/');
      }
    } else {
      // En cas d'erreur de login
      return res.render("login", { error: response.data.message });
    }
  } catch (error) {
    console.error('Erreur de login:', error.response?.data?.message || error.message);
    
    // Gérer les différents types d'erreurs
    let errorMessage = "Erreur de connexion au serveur";
    if (error.response) {
      errorMessage = error.response.data.message || "Erreur d'authentification";
    }
    
    return res.render("login", { error: errorMessage });
  }
});

// Route de déconnexion
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Routes protégées - Administrateur
app.get("/employes", requireLogin, (req, res) => {
  res.render("administrateur/employes", {
    utilisateur: req.session.user
  });
});

app.get("/point_de_journee", requireLogin, (req, res) => {
  res.render("administrateur/point_de_journee", {
    utilisateur: req.session.user
  });
});

app.get("/point_general", requireLogin, (req, res) => {
  res.render("administrateur/point_general", {
    utilisateur: req.session.user
  });
});

// Routes protégées - Caissière
app.get("/ajout_depense", requireLogin, (req, res) => {
  res.render("caissiere/ajout_depense", {
    utilisateur: req.session.user
  });
});

app.get("/point_journee", requireLogin, (req, res) => {
  res.render("caissiere/point_journee", {
    utilisateur: req.session.user
  });
});

app.get("/finaliser_commande", requireLogin, (req, res) => {
  res.render("caissiere/finaliser_commande", {
    utilisateur: req.session.user
  });
});

// Routes protégées - Serveur
app.get("/nouvelle_commande", requireLogin, (req, res) => {
  res.render("serveur/nouvelle_commande", {
    utilisateur: req.session.user
  });
});

app.get("/commandes_attente", requireLogin, (req, res) => {
  res.render("serveur/commandes_attente", {
    utilisateur: req.session.user
  });
});

// Routes protégées - Cuisinière
app.get("/commande_totale", requireLogin, (req, res) => {
  res.render("cuisiniere/commande_totale", {
    utilisateur: req.session.user,
    commandes: [
      {
        serveur: "Thomas BONO",
        articles: [
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 }
        ],
        total: 20000,
        commentaire: "table 1, couple marié avec enfant, pas trop de sel"
      },
      {
        serveur: "Thomas BONO",
        articles: [
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 }
        ],
        total: 20000,
        commentaire: "table 1, couple marié avec enfant, pas trop de sel"
      },
      {
        serveur: "Thomas BONO",
        articles: [
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 }
        ],
        total: 20000,
        commentaire: "table 1, couple marié avec enfant, pas trop de sel"
      },
      {
        serveur: "Thomas BONO",
        articles: [
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 },
          { nom: "Salade mixte", prix: 3500 }
        ],
        total: 20000,
        commentaire: "table 1, couple marié avec enfant, pas trop de sel"
      }
    ]
  });
});

// Exporter la fonction pour Vercel
module.exports = app;
module.exports.handler = serverless(app);
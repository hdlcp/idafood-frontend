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



// Serveur
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



// Caissière
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


// Administrateur
app.get("/employes", (req, res) => {
  res.render("administrateur/employes", {
    utilisateur: {
      nom: "Ida food",
      role: "administrateur"
    }
  });
});
app.get("/point_de_journee", (req, res) => {
  res.render("administrateur/point_de_journee", {
    utilisateur: {
      nom: "Ida food",
      role: "administrateur"
    }
  });
});
app.get("/point_general", (req, res) => {
  res.render("administrateur/point_general", {
    utilisateur: {
      nom: "Ida food",
      role: "administrateur"
    }
  });
});

 //cuisinière
 app.get("/commande_totale", (req, res) => {
  res.render("cuisiniere/commande_totale", {
    utilisateur: {
      nom: "Justine OKO",
      role: "cuisinière"
    },
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

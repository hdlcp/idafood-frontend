const express = require("express");
const path = require("path");
const serverless = require("serverless-http");
const axios = require("axios");
const bodyParser = require("body-parser");
const session = require("express-session");
const MemoryStore = require('memorystore')(session);

const app = express();

// Configuration pour environnement serverless (Vercel)
app.set('trust proxy', 1);

// Middlewares pour parser les requêtes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configuration des sessions avec store externe pour environnement serverless
app.use(session({
  secret: 'idafood_secret_key',
  resave: false,
  saveUninitialized: false,
  store: new MemoryStore({
    checkPeriod: 86400000 // Purge expired entries every 24h
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 24 heures
  }
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

// Middleware pour vérifier l'authentification - MODIFIÉ
const requireLogin = (req, res, next) => {
  if (!req.session.user) {
    console.log("Session non trouvée, redirection vers login");
    return res.redirect('/login');
  }
  
  if (!req.session.token) {
    console.log("Token non trouvé dans la session, redirection vers login");
    return res.redirect('/login');
  }
  
  console.log("Session trouvée, utilisateur:", req.session.user.nom);
  next();
};

// Middleware de debug pour tracer les sessions
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] Route: ${req.path}, Session: ${req.session?.user ? 'Authentifiée' : 'Non-authentifiée'}`);
  next();
});

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
    console.log("Tentative de connexion:", { username, role });
    
    // Validation côté serveur
    if (!username || !password || !role) {
      console.log("Validation échouée: champs manquants");
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
    console.log(`Appel API à ${API_URL_USER}/login`);
    const response = await axios.post(`${API_URL_USER}/login`, {
      nom: username,
      password: password,
      role: mappedRole
    });
    
    // Si la requête réussit, stocker les informations dans la session
    if (response.data.success) {
      console.log("Login réussi:", response.data.data.user.nom);
      
      // Stocker explicitement les données dans la session
      req.session.user = response.data.data.user;
      req.session.token = response.data.data.token;
      
      // S'assurer que la session est sauvegardée avant la redirection
      req.session.save((err) => {
        if (err) {
          console.error("Erreur lors de la sauvegarde de la session:", err);
          return res.render("login", { error: "Erreur de session, veuillez réessayer" });
        }
        
        console.log("Session sauvegardée, redirection selon le rôle:", mappedRole);
        
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
      });
    } else {
      // En cas d'erreur de login
      console.log("Réponse API: échec de l'authentification");
      return res.render("login", { error: response.data.message });
    }
  } catch (error) {
    console.error('Erreur de login:', error.response?.data?.message || error.message);
    
    // Logging détaillé pour debug
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Request sent but no response received', error.request);
    } else {
      console.error('Error setting up request', error.message);
    }
    
    // Gérer les différents types d'erreurs
    let errorMessage = "Erreur de connexion au serveur";
    if (error.response) {
      errorMessage = error.response.data.message || "Erreur d'authentification";
    }
    
    return res.render("login", { error: errorMessage });
  }
});

// Route de déconnexion - MODIFIÉ
app.get("/logout", (req, res) => {
  console.log("Déconnexion utilisateur:", req.session.user?.nom || "Inconnu");
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion:", err);
    }
    res.redirect('/login');
  });
});

// Routes protégées - Administrateur
app.get("/employes", requireLogin, (req, res) => {
  res.render("administrateur/employes", {
    utilisateur: req.session.user,
    token: req.session.token  // Ajoutez cette ligne pour passer le token
  });
});

app.get("/point_de_journee", requireLogin, (req, res) => {
  res.render("administrateur/point_de_journee", {
    utilisateur: req.session.user,
    token: req.session.token  // Ajoutez cette ligne pour passer le token
  });
});

app.get("/point_general", requireLogin, (req, res) => {
  res.render("administrateur/point_general", {
    utilisateur: req.session.user,
    token: req.session.token  // Ajoutez cette ligne pour passer le token
  });
});

// Routes protégées - Caissière
app.get("/ajout_depense", requireLogin, (req, res) => {
  res.render("caissiere/ajout_depense", {
    utilisateur: req.session.user,
    token: req.session.token  // Ajoutez cette ligne pour passer le token
  });
});

app.get("/point_journee", requireLogin, (req, res) => {
  res.render("caissiere/point_journee", {
    utilisateur: req.session.user,
    token: req.session.token  // Ajoutez cette ligne pour passer le token
  });
});

app.get("/finaliser_commande", requireLogin, (req, res) => {
  res.render("caissiere/finaliser_commande", {
    utilisateur: req.session.user,
    token: req.session.token  // Ajoutez cette ligne pour passer le token
  });
});

// Proxy pour récupérer le menu
app.get("/api/menu-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/menu/categorie_menu`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de récupération du menu:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour envoyer une commande
app.post("/api/order-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/api/order`, req.body, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur d'envoi de commande:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour récupérer les commandes non servies du serveur connecté
app.get("/api/unserved-orders-proxy", requireLogin, async (req, res) => {
  try {
    console.log("Tentative de récupération des commandes non servies");
    console.log("Token utilisé:", req.session.token ? "Token présent" : "Token absent");
    
    const response = await axios.get(`${API_URL}/api/order/my/unserved`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    console.log("Réponse API commandes:", response.status);
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de récupération des commandes:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Données d'erreur:", error.response.data);
    } else {
      console.error("Erreur sans réponse:", error.message);
    }
    
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour marquer une commande comme servie
app.put("/api/mark-served-proxy/:orderId", requireLogin, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const response = await axios.put(`${API_URL}/api/order/${orderId}/serve`, {}, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur lors du marquage de la commande:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour supprimer une commande
app.delete("/api/delete-order-proxy/:orderId", requireLogin, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const response = await axios.delete(`${API_URL}/api/order/${orderId}`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur lors de la suppression de la commande:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Routes protégées - Serveur
app.get("/nouvelle_commande", requireLogin, (req, res) => {
  res.render("serveur/nouvelle_commande", {
    utilisateur: req.session.user,
    token: req.session.token  // Ajoutez cette ligne pour passer le token
  });
});

app.get("/commandes_attente", requireLogin, (req, res) => {
  res.render("serveur/commandes_attente", {
    utilisateur: req.session.user,
    token: req.session.token  // Ajoutez cette ligne pour passer le token
  });
});

// Proxy pour vérifier si une page de journée est active
app.get("/api/page-journee-active-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/page_journee/active`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de vérification de page active:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour ouvrir une page de journée
app.post("/api/page-journee-open-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/api/page_journee/open`, {}, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur d'ouverture de page journée:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour fermer une page de journée
app.put("/api/page-journee-close-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.put(`${API_URL}/api/page_journee/close`, {}, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de fermeture de page journée:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour obtenir les statistiques des commandes
app.get("/api/order-stats-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/order/stats`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de récupération des stats de commande:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour obtenir les statistiques des achats
app.get("/api/purchase-stats-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/purchase/stats`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de récupération des stats d'achats:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour lister les dépenses
app.get("/api/purchase-list-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/purchase`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de récupération des dépenses:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour créer une dépense
app.post("/api/purchase-create-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.post(`${API_URL}/api/purchase`, req.body, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de création de dépense:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour supprimer une dépense
app.delete("/api/purchase-delete-proxy/:id", requireLogin, async (req, res) => {
  try {
    const purchaseId = req.params.id;
    const response = await axios.delete(`${API_URL}/api/purchase/${purchaseId}`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de suppression de dépense:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});
// Proxy pour récupérer toutes les commandes non payées
app.get("/api/unpaid-orders-all-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/order/unpaid/all`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de récupération des commandes non payées:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour récupérer toutes les commandes payées
app.get("/api/paid-orders-proxy", requireLogin, async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/api/order/paid/all`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de récupération des commandes payées:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour marquer une commande comme payée
app.put("/api/pay-order-proxy/:orderId", requireLogin, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const response = await axios.put(`${API_URL}/api/order/${orderId}/pay`, req.body, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur lors du paiement de la commande:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Routes protégées - Cuisinière
// Routes protégées - Cuisinière
app.get("/commande_totale", requireLogin, async (req, res) => {
  try {
    // Appel à l'API pour récupérer les commandes non servies
    const response = await axios.get(`${API_URL}/api/order/unserved/all`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      }
    });
    
    // Si la requête réussit
    if (response.data.success) {
      res.render("cuisiniere/commande_totale", {
        utilisateur: req.session.user,
        token: req.session.token,
        commandes: response.data.data  // Passer les données récupérées
      });
    } else {
      // En cas d'erreur dans la réponse de l'API
      res.render("cuisiniere/commande_totale", {
        utilisateur: req.session.user,
        token: req.session.token,
        commandes: [],  // Tableau vide en cas d'erreur
        error: response.data.message
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des commandes:", error.response?.data || error.message);
    res.render("cuisiniere/commande_totale", {
      utilisateur: req.session.user,
      token: req.session.token,
      commandes: [],  // Tableau vide en cas d'erreur
      error: "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour obtenir les statistiques des commandes par date
app.get("/api/order-stats-date-proxy", requireLogin, async (req, res) => {
  try {
    // Transférer tous les paramètres de requête
    const response = await axios.get(`${API_URL}/api/order/stats/date`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      },
      params: req.query // Transmettre tous les paramètres de type, date, etc.
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de récupération des stats de commande par date:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// Proxy pour obtenir les statistiques des achats par date
app.get("/api/purchase-stats-date-proxy", requireLogin, async (req, res) => {
  try {
    // Transférer tous les paramètres de requête
    const response = await axios.get(`${API_URL}/api/purchase/stats/date`, {
      headers: {
        Authorization: `Bearer ${req.session.token}`
      },
      params: req.query // Transmettre tous les paramètres de type, date, etc.
    });
    
    res.json(response.data);
  } catch (error) {
    console.error("Erreur de récupération des stats d'achats par date:", error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      message: error.response?.data?.message || "Erreur de connexion au serveur"
    });
  }
});

// NOUVELLE ROUTE: Vérification de l'état d'authentification
app.get("/api/auth-status", (req, res) => {
  return res.json({
    authenticated: !!req.session.user && !!req.session.token,
    userName: req.session.user?.nom || null,
    role: req.session.user?.role || null
  });
});

// Debug endpoint - pour vérifier l'état de la session
app.get("/debug-session", (req, res) => {
  return res.json({
    sessionExists: !!req.session,
    authenticated: !!req.session.user,
    sessionData: req.session || 'No session data'
  });
});

// Exporter la fonction pour Vercel
module.exports = app;
module.exports.handler = serverless(app);
// Ce script peut être inclus dans les pages principales pour vérifier l'authentification
document.addEventListener('DOMContentLoaded', async () => {
    try {
      // Vérifier l'état de l'authentification au chargement de la page
      const response = await fetch('/api/auth-status');
      const authData = await response.json();
      
      if (!authData.authenticated) {
        console.warn('Session expirée ou invalide, redirection vers login...');
        window.location.href = '/login';
      } else {
        console.log(`Authentifié en tant que: ${authData.userName} (${authData.role})`);
      }
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'authentification:', error);
    }
  });
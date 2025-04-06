// Fonction pour charger les données depuis l'API
async function loadData() {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      displayProducts(data);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      document.getElementById('products').innerHTML = 
        '<p class="text-red-500">Erreur lors du chargement des produits. Veuillez réessayer plus tard.</p>';
    }
  }
  
  // Fonction pour afficher les produits
  function displayProducts(products) {
    const productsContainer = document.getElementById('products');
    
    if (!products || products.length === 0) {
      productsContainer.innerHTML = '<p>Aucun produit disponible pour le moment.</p>';
      return;
    }
    
    const productsHTML = products.map(product => `
      <div class="bg-white rounded-lg shadow-md p-4">
        <h3 class="text-xl font-semibold mb-2">${product.name}</h3>
        <p class="text-gray-600">${product.description}</p>
        <p class="text-blue-600 font-bold mt-2">${product.price} €</p>
        <button class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700">
          Ajouter au panier
        </button>
      </div>
    `).join('');
    
    productsContainer.innerHTML = productsHTML;
  }
  
  // Charger les données au chargement de la page
  document.addEventListener('DOMContentLoaded', () => {
    loadData();
  });
  const platsAjoutes = {};
  const commandeContainer = document.getElementById("commande");
  const totalElement = document.getElementById("total");
  const submitBtn = document.getElementById("submit-btn");

  // Quand on clique sur le bouton "+"
  document.querySelectorAll(".add-plat-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const nom = btn.getAttribute("data-nom");
      const prix = parseInt(btn.getAttribute("data-prix"));

      if (!platsAjoutes[nom]) {
        platsAjoutes[nom] = { quantite: 1, prix };
      } else {
        platsAjoutes[nom].quantite += 1;
      }

      renderCommande();
    });
  });

  // Fonction d'affichage des articles ajoutés
  function renderCommande() {
    commandeContainer.innerHTML = "";
    let total = 0;
    let hasItem = false;

    for (const nom in platsAjoutes) {
      const item = platsAjoutes[nom];
      total += item.quantite * item.prix;
      hasItem = true;

      const row = document.createElement("div");
      row.className = "flex justify-between items-center bg-white p-3 rounded-xl mb-2 shadow";

      row.innerHTML = `
        <div class="text-left">
          <p class="font-bold text-sm">${nom}</p>
          <p class="text-xs">${item.prix} FCFA</p>
        </div>
        <div class="flex items-center space-x-2">
          <button onclick="decrement('${nom}')" class="bg-gray-300 w-6 h-6 flex justify-center items-center rounded-full text-black">-</button>
          <span class="font-semibold text-sm">${item.quantite}</span>
          <button onclick="increment('${nom}')" class="bg-gray-300 w-6 h-6 flex justify-center items-center rounded-full text-black">+</button>
          <button onclick="supprimer('${nom}')" class="text-red-500 text-lg"><i class="fas fa-times"></i></button>
        </div>
      `;
      commandeContainer.appendChild(row);
    }

    totalElement.innerText = total.toLocaleString();
    submitBtn.disabled = !hasItem;
  }

  function increment(nom) {
    platsAjoutes[nom].quantite++;
    renderCommande();
  }

  function decrement(nom) {
    if (platsAjoutes[nom].quantite > 1) {
      platsAjoutes[nom].quantite--;
    } else {
      delete platsAjoutes[nom];
    }
    renderCommande();
  }

  function supprimer(nom) {
    delete platsAjoutes[nom];
    renderCommande();
  }

  // Fonction quand on appuie sur "Passer la commande"
  submitBtn.addEventListener("click", () => {
    const motif = document.getElementById("motif").value;

    const commande = {
      plats: [],
      commentaire: motif.trim(),
    };

    for (const nom in platsAjoutes) {
      commande.plats.push({
        nom,
        quantite: platsAjoutes[nom].quantite,
        prix_unitaire: platsAjoutes[nom].prix,
      });
    }

    console.log("Commande prête à envoyer au back-end :", commande);

    // Exemple pour le back-end plus tard :
    // fetch('/api/commande', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(commande)
    // });
  });
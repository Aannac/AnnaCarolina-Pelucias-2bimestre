let products = [];
let editId = null;
let editImage = null;
let deleteId = null;

// Verificação de autenticação - apenas gerentes podem aceder
function verificarAutenticacao() {
  const usuarioLogado = localStorage.getItem("usuarioLogado");
  
  if (!usuarioLogado) {
    showAlert("Acesso negado! É necessário fazer login para aceder a esta página.");
    window.location.href = "../login/login.html";
    return false;
  }
  
  try {
    const usuario = JSON.parse(usuarioLogado);
    if (usuario.tipo !== "gerente") {
      showAlert("Acesso negado! Apenas gerentes podem aceder ao sistema CRUD.");
      window.location.href = "../Index.html";
      return false;
    }
    return true;
  } catch (error) {
    showAlert("Erro na autenticação. Por favor, faça login novamente.");
    localStorage.removeItem("usuarioLogado");
    window.location.href = "../login/login.html";
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Verificar autenticação antes de carregar a página
  if (!verificarAutenticacao()) {
    return;
  }
  
  loadProducts();
  document.getElementById("product-form").addEventListener("submit", handleFormSubmit);
});

async function loadProducts() {
  const res = await fetch("/api/products");
  products = await res.json();
  filterProducts();
  updateStats();
}

async function handleFormSubmit(e) {
  e.preventDefault();

  const name = document.getElementById("product-name").value.trim();
  const price = parseFloat(document.getElementById("product-price").value);
  const imageInput = document.getElementById("product-image");
  const file = imageInput.files[0];

  if (!name || isNaN(price)) {
    showAlert("Preencha corretamente os campos obrigatórios.");
    return;
  }

  const formData = new FormData();
  formData.append("name", name);
  formData.append("price", price);
  if (file) {
    formData.append("imagem", file);
  } else if (editImage) {
    // Se não houver novo arquivo, mas houver uma imagem existente (para edição)
    formData.append("image", editImage); 
  }

  if (editId !== null) {
    // Se estiver editando, adicione o ID e a imagem atual (se não houver nova)
    await fetch(`/api/products/${editId}`, {
      method: "PUT",
      body: formData // FormData é usado para enviar arquivos
    });
    showAlert("Produto atualizado com sucesso!");
  } else {
    await fetch(`/api/products`, {
      method: "POST",
      body: formData // FormData é usado para enviar arquivos
    });
    showAlert("Produto adicionado com sucesso!");
  }

  resetForm();
  await loadProducts();
}

function editProduct(id) {
  const prod = products.find(p => p.id === id);
  if (prod) {
    document.getElementById("product-name").value = prod.name;
    document.getElementById("product-price").value = prod.price;
    editId = id;
    editImage = prod.image; // Salva o nome da imagem existente
    document.getElementById("form-title").textContent = "✏️ Editar Produto";
    document.getElementById("submit-btn").textContent = "💾 Salvar Alterações";
    document.getElementById("cancel-btn").style.display = "inline-block";
  }
}

function cancelEdit() {
  resetForm();
}

function resetForm() {
  document.getElementById("product-form").reset();
  editId = null;
  editImage = null;
  document.getElementById("form-title").textContent = "➕ Adicionar Novo Produto";
  document.getElementById("submit-btn").textContent = "➕ Adicionar Produto";
  document.getElementById("cancel-btn").style.display = "none";
}

function deleteProduct(id) {
  deleteId = id;
  document.getElementById("confirm-modal").style.display = "block";
}

async function confirmDelete() {
  await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
  deleteId = null;
  closeConfirmModal();
  showAlert("Produto excluído com sucesso!");
  await loadProducts();
}

function closeConfirmModal() {
  document.getElementById("confirm-modal").style.display = "none";
}

function filterProducts() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const sortBy = document.getElementById("sort-by").value;

  let filtered = products.filter(p =>
    p.name.toLowerCase().includes(search)
  );

  switch (sortBy) {
    case "name": filtered.sort((a, b) => a.name.localeCompare(b.name)); break;
    case "price-asc": filtered.sort((a, b) => a.price - b.price); break;
    case "price-desc": filtered.sort((a, b) => b.price - a.price); break;
    case "id": filtered.sort((a, b) => a.id - b.id); break;
  }

  renderTable(filtered);
}

function renderTable(data) {
  const tbody = document.getElementById("products-tbody");
  tbody.innerHTML = "";

  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">Nenhum produto encontrado.</td></tr>`;
    return;
  }

  data.forEach(p => {
    const tr = document.createElement("tr");
    // Ajusta o caminho da imagem para o diretório 'imagem/'
    const imageUrl = p.image ? `/imagem/${p.image}` : ""; 
    tr.innerHTML = `
      <td>${p.id}</td>
      <td>${p.image ? `<img src="${imageUrl}" alt="" style="max-width: 80px;">` : "Sem imagem"}</td>
      <td>${p.name}</td>
      <td>R$ ${p.price.toFixed(2)}</td>
      <td>
        <button class="btn btn-secondary" onclick="editProduct(${p.id})">✏️</button>
        <button class="btn btn-danger" onclick="deleteProduct(${p.id})">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

function updateStats() {
  const total = products.length;
  const prices = products.map(p => p.price);
  const avg = prices.length ? prices.reduce((a, b) => a + b) / prices.length : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const min = prices.length ? Math.min(...prices) : 0;

  document.getElementById("total-products").textContent = total;
  document.getElementById("avg-price").textContent = `R$ ${avg.toFixed(2)}`;
  document.getElementById("most-expensive").textContent = `R$ ${max.toFixed(2)}`;
  document.getElementById("cheapest").textContent = `R$ ${min.toFixed(2)}`;
}

function showAlert(message) {
  const container = document.getElementById("alerts-container");
  const alert = document.createElement("div");
  alert.className = "alert";
  alert.textContent = message;
  container.appendChild(alert);
  setTimeout(() => alert.remove(), 3000);
}



function carregarUsuarios() {
  fetch("/api/usuarios")
    .then(res => res.json())
    .then(usuarios => {
      const lista = document.getElementById("listaUsuarios");
      lista.innerHTML = "";

      usuarios.forEach(u => {
        const li = document.createElement("li");
        li.innerHTML = `
          <strong>${u.Nome}</strong> (${u.Email}) - ${u.Tipo}
          ${u.Tipo === "cliente" ? `<button onclick="promover(\'${u.Email}\')">Promover a gerente</button>` : `<button onclick="rebaixar(\'${u.Email}\')">Rebaixar a cliente</button>`}
        `;
        lista.appendChild(li);
      });
    });
}

function promover(email) {
  fetch("/api/promover", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      showAlert(data.message);
      carregarUsuarios();
    });
}

// Carregar usuários ao abrir o CRUD
window.addEventListener("DOMContentLoaded", carregarUsuarios);


function rebaixar(email) {
  fetch("/api/rebaixar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  })
    .then(res => res.json())
    .then(data => {
      showAlert(data.message);
      carregarUsuarios();
    });
}



// Função para carregar usuários do CSV
const csvUploadForm = document.getElementById("csv-upload-form");
if (csvUploadForm) {
  csvUploadForm.addEventListener("submit", async function(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById("csv-file");
    const file = fileInput.files[0];
    
    if (!file) {
      showAlert("Por favor, selecione um arquivo CSV");
      return;
    }
    
    const formData = new FormData();
    formData.append("csvFile", file);
    
    try {
      const response = await fetch("/api/carregar-usuarios-csv", {
        method: "POST",
        body: formData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showAlert(result.message);
        if (result.erros && result.erros.length > 0) {
          console.log("Erros encontrados:", result.erros);
          showAlert(`Atenção: ${result.erros.length} erros encontrados. Verifique o console para detalhes.`);
        }
        carregarUsuarios(); // Recarregar a lista de usuários
        fileInput.value = ""; // Limpar o input
      } else {
        showAlert(`Erro: ${result.error}`);
      }
    } catch (error) {
      showAlert("Erro ao carregar arquivo CSV");
      console.error("Erro:", error);
    }
  });
}



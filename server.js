const express = require("express");
const fs = require("fs");
const path = require("path");
const csvParser = require("csv-parser");
const multer = require("multer");
const cookieParser = require("cookie-parser"); // Adicionado para gerenciar cookies

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cookieParser()); // Middleware para parsing de cookies

app.use((req, res, next) => {
  const allowedOrigins = ["http://127.0.0.1:5500", "http://localhost:3000"]; // no vscode, após executar (live server), olhar no canto inferior direito qual porta está sendo usada (ajustar se necessário)
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Credentials", "true"); // Necessário para cookies
  next();
});

// Servir arquivos estáticos
app.use("/", express.static(path.join(__dirname)));
app.use("/crud", express.static(path.join(__dirname, "crud")));
app.use("/imagem", express.static(path.join(__dirname, "imagem"))); // Adicionado para servir imagens

// Arquivo CSV de produtos
const CSV_FILE = path.join(__dirname, "crud", "pelucias.csv");

// Arquivo CSV de usuários
const USERS_CSV = path.join(__dirname, "usuarios.csv");

// Criar cabeçalho de usuários.csv se não existir
if (!fs.existsSync(USERS_CSV)) {
  fs.writeFileSync(USERS_CSV, "Nome,Email,Senha,Tipo\n", "utf8");
}

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "imagem");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // O nome do arquivo será definido no POST /api/products, após o ID ser gerado
    cb(null, file.originalname); // Temporariamente, manter o nome original
  },
});

const upload = multer({ storage });

// Rota para upload de imagem (agora apenas salva temporariamente, o renomeio final será no /api/products)
app.post("/api/upload-imagem", upload.single("imagem"), (req, res) => {
  if (req.file) {
    res.json({ sucesso: true, filename: req.file.filename, tempPath: req.file.path });
  } else {
    res.status(400).json({ sucesso: false, mensagem: "Erro no upload: Nenhuma imagem recebida ou erro desconhecido." });
  }
});

app.post("/api/rename-image", (req, res) => {
  const { oldFilename, newFilename } = req.body;
  const oldPath = path.join(__dirname, "imagem", oldFilename);
  const newPath = path.join(__dirname, "imagem", newFilename);

  if (!fs.existsSync(oldPath)) {
    return res.status(404).json({ sucesso: false, mensagem: "Imagem original não encontrada." });
  }

  fs.rename(oldPath, newPath, (err) => {
    if (err) {
      console.error("Erro ao renomear imagem:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao renomear imagem." });
    }
    res.json({ sucesso: true, mensagem: "Imagem renomeada com sucesso.", oldFilename, newFilename });
  });
});

// ===============================
// CRUD DE PRODUTOS
// ===============================

function readCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    if (!fs.existsSync(CSV_FILE)) {
      fs.writeFileSync(CSV_FILE, 'id,name,price,image\n', 'utf8');
    }
    fs.createReadStream(CSV_FILE)
      .on("error", (err) => reject(err))
      .pipe(csvParser())
      .on("data", (data) => {
        results.push({
          id: parseInt(data.id),
          name: data.name,
          price: parseFloat(data.price),
          image: data.image,
        });
      })
      .on("end", () => resolve(results));
  });
}

function writeCSV(products) {
  const header = "id,name,price,image\n";
  const rows = products.map((p) => `${p.id},"${p.name}",${p.price},"${p.image}"`).join("\n");
  fs.writeFileSync(CSV_FILE, header + rows);
}

app.get("/api/products", async (req, res) => {
  console.log("rota api/products -- GET");
  const products = await readCSV();
  res.json(products);
});

app.post("/api/products", upload.single("imagem"), async (req, res) => {
  console.log("rota api/products -- POST");
  const products = await readCSV();
  const { name, price } = req.body; // 'image' não vem mais do req.body diretamente
  const newId = products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;

  let imageName = "";
  if (req.file) {
    const oldPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const newFileName = `${newId}${ext}`;
    const newPath = path.join(req.file.destination, newFileName);

    try {
      fs.renameSync(oldPath, newPath); // Usar Sync para garantir que o arquivo seja renomeado antes de escrever no CSV
      imageName = newFileName;
      console.log(`Imagem '${newFileName}' salva e renomeada com sucesso.`);
    } catch (err) {
      console.error("Erro ao renomear imagem após upload:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao renomear imagem após upload." });
    }
  }

  const newProduct = { id: newId, name, price: parseFloat(price), image: imageName };
  products.push(newProduct);
  writeCSV(products);
  res.json({ message: "Produto adicionado com sucesso", product: newProduct });
});

app.put("/api/products/:id", upload.single("imagem"), async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price, image: currentImage } = req.body; // currentImage é o nome da imagem já existente

  let products = await readCSV();
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }

  let updatedImageName = currentImage; // Mantém a imagem atual por padrão

  if (req.file) {
    // Se uma nova imagem foi enviada, renomeia e atualiza
    const oldPath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();
    const newFileName = `${id}${ext}`;
    const newPath = path.join(req.file.destination, newFileName);

    try {
      // Remove a imagem antiga se existir e for diferente da nova
      if (products[index].image && products[index].image !== newFileName) {
        const oldImagePath = path.join(__dirname, 'imagem', products[index].image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
          console.log(`Imagem antiga '${products[index].image}' removida.`);
        }
      }
      fs.renameSync(oldPath, newPath);
      updatedImageName = newFileName;
      console.log(`Imagem '${newFileName}' atualizada e renomeada com sucesso.`);
    } catch (err) {
      console.error("Erro ao renomear/atualizar imagem:", err);
      return res.status(500).json({ sucesso: false, mensagem: "Erro ao renomear/atualizar imagem." });
    }
  }

  products[index] = { ...products[index], name, price: parseFloat(price), image: updatedImageName, id: id }; // Garante que o ID não seja alterado
  writeCSV(products);
  res.json({ message: "Produto atualizado com sucesso", product: products[index] });
});

app.delete("/api/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);

  let products = await readCSV();
  const initialLength = products.length;
  const productToDelete = products.find(p => p.id === id);

  products = products.filter((p) => p.id !== id);

  if (products.length === initialLength) {
    return res.status(404).json({ error: "Produto não encontrado" });
  }

  // Remove a imagem associada ao produto excluído
  if (productToDelete && productToDelete.image) {
    const imagePath = path.join(__dirname, 'imagem', productToDelete.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`Imagem '${productToDelete.image}' removida.`);
    }
  }

  writeCSV(products);
  res.json({ message: "Produto excluído com sucesso" });
});

// ===============================
// CADASTRO DE USUÁRIOS
// ===============================

app.post("/api/cadastrar", (req, res) => {
  const { name, email, password } = req.body;
  const tipo = "cliente"; // padrão

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Dados incompletos" });
  }

  const linha = `"${name}","${email}","${password}","${tipo}"\n`;
  fs.appendFile(USERS_CSV, linha, (err) => {
    if (err) {
      console.error("Erro ao salvar usuário:", err);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
    
    // Definir cookie de aceitação de cookies quando o usuário se cadastra
    // (assumindo que ao aceitar os termos, ele também aceita os cookies)
    console.log(`Usuário ${name} cadastrado e cookies aceitos automaticamente`);
    res.cookie('cookiesAceitos', 'true', {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano
      httpOnly: false, // Permite acesso via JavaScript no frontend
      sameSite: 'None',
      secure: false // Mudar para true em produção com HTTPS
    });
    
    res.status(200).json({ 
      message: "Usuário cadastrado com sucesso!",
      cookiesAceitos: true 
    });
  });
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const users = [];

  fs.createReadStream(USERS_CSV)
    .pipe(csvParser())
    .on("data", (data) => {
      users.push(data);
    })
    .on("end", () => {
      const user = users.find((u) => u.Email === email && u.Senha === password);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const usuario = {
        nome: user.Nome,
        email: user.Email,
        tipo: user.Tipo,
      };

      // Definir cookie de usuário logado
      console.log(`Login bem sucedido para ${user.Nome.toUpperCase()}`);
      res.cookie('usuarioLogado', 'true', {
        maxAge: 900000, // 15 minutos
        httpOnly: true,
        sameSite: 'None',
        secure: false // Mudar para true em produção com HTTPS
      });

      if (user.Tipo === "gerente") {
        return res.status(200).json({
          redirect: "/crud/crud.html",
          usuario: usuario,
        });
      } else {
        return res.status(200).json({
          redirect: "/Index.html",
          usuario: usuario,
        });
      }
    });
});

// Rota para verificar se os cookies foram aceitos
app.get("/api/check-cookies", (req, res) => {
  const cookiesAceitos = req.cookies.cookiesAceitos === 'true';
  res.json({ cookiesAceitos });
});

// Rota para aceitar cookies manualmente (caso necessário)
app.post("/api/aceitar-cookies", (req, res) => {
  res.cookie('cookiesAceitos', 'true', {
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 ano
    httpOnly: false,
    sameSite: 'None',
    secure: false // Mudar para true em produção com HTTPS
  });
  
  res.json({ 
    message: "Cookies aceitos com sucesso!",
    cookiesAceitos: true 
  });
});

app.get("/api/usuarios", (req, res) => {
  const users = [];
  fs.createReadStream(USERS_CSV)
    .pipe(csvParser())
    .on("data", (data) => users.push(data))
    .on("end", () => res.json(users));
});

app.post("/api/promover", (req, res) => {
  const { email } = req.body;
  const users = [];

  fs.createReadStream(USERS_CSV)
    .pipe(csvParser())
    .on("data", (data) => users.push(data))
    .on("end", () => {
      const userIndex = users.findIndex((u) => u.Email === email);
      if (userIndex === -1) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      users[userIndex].Tipo = "gerente";

      const header = "Nome,Email,Senha,Tipo\n";
      const linhas = users.map((u) => `"${u.Nome}","${u.Email}","${u.Senha}","${u.Tipo}"`).join("\n");
      fs.writeFileSync(USERS_CSV, header + linhas);

      res.json({ message: "Usuário promovido a gerente!" });
    });
});

// ===============================

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

app.post("/api/rebaixar", (req, res) => {
  const { email } = req.body;
  const users = [];

  fs.createReadStream(USERS_CSV)
    .pipe(csvParser())
    .on("data", (data) => users.push(data))
    .on("end", () => {
      const userIndex = users.findIndex((u) => u.Email === email);
      if (userIndex === -1) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      users[userIndex].Tipo = "cliente";

      const header = "Nome,Email,Senha,Tipo\n";
      const linhas = users.map((u) => `"${u.Nome}","${u.Email}","${u.Senha}","${u.Tipo}"`).join("\n");
      fs.writeFileSync(USERS_CSV, header + linhas);

      res.json({ message: "Usuário rebaixado para cliente!" });
    });
});

app.post("/api/carregar-usuarios-csv", upload.single("csvFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nenhum arquivo enviado" });
  }

  const csvContent = req.file.buffer.toString("utf8");
  const lines = csvContent.split("\n");

  if (lines.length < 2) {
    return res.status(400).json({ error: "Arquivo CSV deve ter pelo menos uma linha de dados" });
  }

  // Verificar se o cabeçalho está correto
  const header = lines[0].trim().toLowerCase();
  if (!header.includes("nome") || !header.includes("email") || !header.includes("senha")) {
    return res.status(400).json({ error: "CSV deve conter as colunas: Nome, Email, Senha" });
  }

  let usuariosAdicionados = 0;
  let erros = [];

  // Processar cada linha do CSV
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const parts = line.split(",").map((part) => part.replace(/"/g, "").trim());

      if (parts.length < 3) {
        erros.push(`Linha ${i + 1}: Dados incompletos`);
        continue;
      }

      const [nome, email, senha, tipo = "cliente"] = parts;

      if (!nome || !email || !senha) {
        erros.push(`Linha ${i + 1}: Campos obrigatórios em branco`);
        continue;
      }

      // Verificar se o usuário já existe
      const existingUsers = [];
      if (fs.existsSync(USERS_CSV)) {
        const content = fs.readFileSync(USERS_CSV, "utf8");
        const userLines = content.split("\n");
        for (let j = 1; j < userLines.length; j++) {
          if (userLines[j].trim()) {
            const userParts = userLines[j].split(",").map((p) => p.replace(/"/g, "").trim());
            if (userParts[1] === email) {
              erros.push(`Linha ${i + 1}: Email ${email} já existe`);
              continue;
            }
          }
        }
      }

      // Adicionar usuário
      const linha = `"${nome}","${email}","${senha}","${tipo}"\n`;
      fs.appendFileSync(USERS_CSV, linha);
      usuariosAdicionados++;
    } catch (error) {
      erros.push(`Linha ${i + 1}: Erro ao processar - ${error.message}`);
    }
  }

  res.json({
    message: `${usuariosAdicionados} usuários carregados com sucesso`,
    usuariosAdicionados,
    erros: erros.length > 0 ? erros : null,
  });
});

// ===============================
// FAVORITOS
// ===============================

const FAVORITES_CSV = path.join(__dirname, "favoritos.csv");

// Função para ler favoritos do CSV
function readFavoritesCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(FAVORITES_CSV)
      .on("error", (err) => reject(err))
      .pipe(csvParser())
      .on("data", (data) => results.push(data))
      .on("end", () => resolve(results));
  });
}

// Função para escrever favoritos no CSV
function writeFavoritesCSV(favorites) {
  const header = "email,produto_id\n";
  const rows = favorites.map((f) => `${f.email},${f.produto_id}`).join("\n");
  fs.writeFileSync(FAVORITES_CSV, header + rows);
}

// Rota para adicionar um produto aos favoritos
app.post("/api/favorites/add", async (req, res) => {
  const { email, produto_id } = req.body;

  if (!email || !produto_id) {
    return res.status(400).json({ error: "Email e ID do produto são obrigatórios." });
  }

  let favorites = await readFavoritesCSV();
  const exists = favorites.some((f) => f.email === email && parseInt(f.produto_id) === parseInt(produto_id));

  if (exists) {
    return res.status(409).json({ message: "Produto já está nos favoritos." });
  }

  favorites.push({ email, produto_id: parseInt(produto_id) });
  writeFavoritesCSV(favorites);
  res.status(200).json({ message: "Produto adicionado aos favoritos com sucesso!" });
});

// Rota para remover um produto dos favoritos
app.post("/api/favorites/remove", async (req, res) => {
  const { email, produto_id } = req.body;

  if (!email || !produto_id) {
    return res.status(400).json({ error: "Email e ID do produto são obrigatórios." });
  }

  let favorites = await readFavoritesCSV();
  const initialLength = favorites.length;
  favorites = favorites.filter((f) => !(f.email === email && parseInt(f.produto_id) === parseInt(produto_id)));

  if (favorites.length === initialLength) {
    return res.status(404).json({ error: "Produto não encontrado nos favoritos." });
  }

  writeFavoritesCSV(favorites);
  res.status(200).json({ message: "Produto removido dos favoritos com sucesso!" });
});

// Rota para obter os favoritos de um usuário
app.get("/api/favorites/:email", async (req, res) => {
  const email = req.params.email;

  if (!email) {
    return res.status(400).json({ error: "Email do usuário é obrigatório." });
  }

  const allFavorites = await readFavoritesCSV();
  const userFavorites = allFavorites.filter((f) => f.email === email).map((f) => parseInt(f.produto_id));

  const products = await readCSV(); // Ler todos os produtos
  const favoriteProducts = userFavorites.map(favId => products.find(p => p.id === favId)).filter(Boolean); // Encontrar produtos favoritos

  res.status(200).json({ favorites: favoriteProducts });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ sucesso: false, mensagem: err.message });
  } else if (err) {
    return res.status(500).json({ sucesso: false, mensagem: "Erro interno do servidor." });
  }
  next();
});



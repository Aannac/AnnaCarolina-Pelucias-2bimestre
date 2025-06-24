const express = require('express');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const multer = require('multer');
const upload = multer();

const app = express();
const PORT = 3000;

app.use(express.json());

app.use((req, res, next) => {
  const allowedOrigins = ['http://127.0.0.1:5500', 'http://localhost:3000'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Servir arquivos estáticos
app.use('/', express.static(path.join(__dirname)));
app.use('/crud', express.static(path.join(__dirname, 'crud')));

// Arquivo CSV de produtos
const CSV_FILE = path.join(__dirname, 'crud', 'pelucias.csv');

// Arquivo CSV de usuários
const USERS_CSV = path.join(__dirname, 'usuarios.csv');

// Criar cabeçalho de usuários.csv se não existir
if (!fs.existsSync(USERS_CSV)) {
  fs.writeFileSync(USERS_CSV, 'Nome,Email,Senha,Tipo\n', 'utf8');
}


// ===============================
// CRUD DE PRODUTOS
// ===============================

function readCSV() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(CSV_FILE)
      .on('error', (err) => reject(err))
      .pipe(csvParser())
      .on('data', (data) => {
        results.push({
          id: parseInt(data.id),
          name: data.name,
          price: parseFloat(data.price),
          image: data.image
        });
      })
      .on('end', () => resolve(results));
  });
}

function writeCSV(products) {
  const header = 'id,name,price,image\n';
  const rows = products.map(p => `${p.id},"${p.name}",${p.price},"${p.image}"`).join('\n');
  fs.writeFileSync(CSV_FILE, header + rows);
}

app.get('/api/products', async (req, res) => {
  const products = await readCSV();
  res.json(products);
});

app.post('/api/products', upload.none(), async (req, res) => {
  const products = await readCSV();
  const { name, price, image } = req.body;
  const newId = products.length > 0 ? products[products.length - 1].id + 1 : 1;
  const newProduct = { id: newId, name, price: parseFloat(price), image };
  products.push(newProduct);
  writeCSV(products);
  res.json({ message: 'Produto adicionado com sucesso', product: newProduct });
});

// ===============================
// CADASTRO DE USUÁRIOS
// ===============================

app.post('/api/cadastrar', (req, res) => {
  const { name, email, password } = req.body;
  const tipo = 'cliente'; // padrão

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  const linha = `"${name}","${email}","${password}","${tipo}"\n`;
  fs.appendFile(USERS_CSV, linha, (err) => {
    if (err) {
      console.error('Erro ao salvar usuário:', err);
      return res.status(500).json({ error: 'Erro interno no servidor' });
    }
    res.status(200).json({ message: 'Usuário cadastrado com sucesso!' });
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = [];

  fs.createReadStream(USERS_CSV)
    .pipe(csvParser())
    .on('data', (data) => {
      users.push(data);
    })
    .on('end', () => {
      const user = users.find(u => u.Email === email && u.Senha === password);
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas' });
      }

      const tipo = user.Tipo?.toLowerCase();
      if (tipo === 'gerente') {
        return res.status(200).json({ redirect: './crud/crud.html', nome: user.Nome });
      } else {
        return res.status(200).json({ redirect: './index.html', nome: user.Nome });
      }
    });
});
app.get('/api/usuarios', (req, res) => {
  const users = [];
  fs.createReadStream(USERS_CSV)
    .pipe(csvParser())
    .on('data', (data) => users.push(data))
    .on('end', () => res.json(users));
});

app.post('/api/promover', (req, res) => {
  const { email } = req.body;
  const users = [];

  fs.createReadStream(USERS_CSV)
    .pipe(csvParser())
    .on('data', (data) => users.push(data))
    .on('end', () => {
      const userIndex = users.findIndex(u => u.Email === email);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      users[userIndex].Tipo = 'gerente';

      const header = 'Nome,Email,Senha,Tipo\n';
      const linhas = users.map(u => `"${u.Nome}","${u.Email}","${u.Senha}","${u.Tipo}"`).join('\n');
      fs.writeFileSync(USERS_CSV, header + linhas);

      res.json({ message: 'Usuário promovido a gerente!' });
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
      const linhas = users
        .map((u) => `"${u.Nome}","${u.Email}","${u.Senha}","${u.Tipo}"`)
        .join("\n");
      fs.writeFileSync(USERS_CSV, header + linhas);

      res.json({ message: "Usuário rebaixado para cliente!" });
    });
});



app.post('/api/carregar-usuarios-csv', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado' });
  }

  const csvContent = req.file.buffer.toString('utf8');
  const lines = csvContent.split('\n');
  
  if (lines.length < 2) {
    return res.status(400).json({ error: 'Arquivo CSV deve ter pelo menos uma linha de dados' });
  }

  // Verificar se o cabeçalho está correto
  const header = lines[0].trim().toLowerCase();
  if (!header.includes('nome') || !header.includes('email') || !header.includes('senha')) {
    return res.status(400).json({ error: 'CSV deve conter as colunas: Nome, Email, Senha' });
  }

  let usuariosAdicionados = 0;
  let erros = [];

  // Processar cada linha do CSV
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const parts = line.split(',').map(part => part.replace(/"/g, '').trim());
      
      if (parts.length < 3) {
        erros.push(`Linha ${i + 1}: Dados incompletos`);
        continue;
      }

      const [nome, email, senha, tipo = 'cliente'] = parts;
      
      if (!nome || !email || !senha) {
        erros.push(`Linha ${i + 1}: Campos obrigatórios em branco`);
        continue;
      }

      // Verificar se o usuário já existe
      const existingUsers = [];
      if (fs.existsSync(USERS_CSV)) {
        const content = fs.readFileSync(USERS_CSV, 'utf8');
        const userLines = content.split('\n');
        for (let j = 1; j < userLines.length; j++) {
          if (userLines[j].trim()) {
            const userParts = userLines[j].split(',').map(p => p.replace(/"/g, '').trim());
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
    erros: erros.length > 0 ? erros : null
  });
});


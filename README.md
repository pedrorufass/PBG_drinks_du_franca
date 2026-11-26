# Drinks du França

Bem-vindo ao **PBG Drinks du França**!

O PBG Drinks du França é um projeto de aplicação web voltado para a comercialização de bebidas, desenvolvido para proporcionar uma experiência de navegação simples e intuitiva, permitindo que os usuários conheçam o catálogo de produtos, realizem cadastros, façam login e gerenciem suas compras.

O sistema também conta com uma área administrativa para auxiliar no gerenciamento da plataforma.

## &#x20;Funcionalidades

- **Catálogo de produtos:** visualização dos produtos disponíveis.
- **Cadastro de usuários:** criação de contas na plataforma.
- **Login:** autenticação e acesso dos usuários.
- **Carrinho de compras:** seleção e organização dos produtos desejados.
- **Gerenciamento de compras:** acompanhamento das compras realizadas.
- **Painel administrativo:** gerenciamento de produtos e informações da plataforma.
- **Integração com banco de dados:** armazenamento e gerenciamento das informações.
- **Cache:** utilização do Redis para otimização de consultas.

## 🛠️ Tecnologias utilizadas

O projeto utiliza as seguintes tecnologias:

- **HTML5:** estruturação das páginas.
- **CSS3:** estilização e organização visual.
- **JavaScript:** funcionalidades e interatividade.
- **Node.js:** execução do servidor.
- **MongoDB:** armazenamento de dados.
- **Redis:** gerenciamento de cache.
- **Supabase:** integração com serviços de autenticação.

## &#x20;Estrutura do projeto

```text
PBG_drinks_du_franca/
│
├── img/                # Imagens utilizadas no projeto
├── .env.example        # Exemplo de configuração das variáveis
├── .gitignore          # Arquivos ignorados pelo Git
│
├── index.html          # Página inicial
├── login.html          # Página de login
├── cadastro.html       # Página de cadastro
├── carrinho.html       # Carrinho de compras
├── admin.html          # Painel administrativo
├── admin-login.html    # Login administrativo
│
├── style.css           # Estilos da aplicação
├── script.js           # Scripts da página inicial
├── login.js            # Funcionalidades de login
├── cadastro.js         # Funcionalidades de cadastro
├── carrinho.js         # Funcionalidades do carrinho
├── admin.js            # Funcionalidades administrativas
├── admin-login.js      # Autenticação administrativa
├── auth.js             # Integração de autenticação
├── catalogo.js         # Catálogo de produtos
├── commerce.js         # Funcionalidades comerciais
├── compras.js          # Gerenciamento de compras
├── config.js           # Configurações da aplicação
│
├── server.js           # Servidor e integração com serviços
├── package.json        # Dependências e scripts
└── package-lock.json   # Controle das dependências
```

## ⚙️ Como executar o projeto

### 1. Pré-requisitos

Antes de iniciar, é necessário ter instalado:

- [Node.js](https://nodejs.org/)
- [MongoDB](https://www.mongodb.com/)
- [Redis](https://redis.io/) (opcional)
- Uma conta e projeto configurado no [Supabase](https://supabase.com/).

### 2. Clone o repositório

```bash
git clone https://github.com/pedrorufass/PBG_drinks_du_franca.git
```

### 3. Entre na pasta do projeto

```bash
cd PBG_drinks_du_franca
```

### 4. Instale as dependências

```bash
npm install
```

### 5. Configure as variáveis de ambiente

Crie um arquivo chamado `.env` na raiz do projeto, utilizando o `.env.example` como referência.

Configure as credenciais necessárias:

```env
MONGODB_URI=sua_conexao_mongodb

SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_chave_supabase

REDIS_URL=sua_url_redis

PORT=8000
```

**Importante:** substitua os valores de exemplo pelas suas próprias credenciais. Nunca compartilhe ou publique o arquivo `.env`.

### 6. Inicie o servidor

```bash
npm start
```

O servidor será iniciado na porta 8000, salvo se outra porta estiver configurada.

## Desenvolvedores

| Responsabilidade | Integrante       |
| ---------------- | ---------------- |
| Criador          | **Artur França** |
| Auxiliar         | **Pedro Rufino** |

## 📌 Considerações finais

O PBG Drinks du França foi desenvolvido com o objetivo de aplicar conhecimentos de desenvolvimento web, integração de banco de dados, programação JavaScript e construção de aplicações, como parte do trabalho da matéria projeto de Banco de dados

LINK DO VÍDEO:&#x20;





---

**PBG Drinks du França**
*Projeto de desenvolvimento de software.*

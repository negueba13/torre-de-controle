# Torre de Controle Operacional - Cobrança Alto & Leste

Sistema de triagem operacional Sabesp com Motor de Execuções, Motor de Pendências, Higienizador Matemático de PDEs, Radar Anti-Retrabalho, SLAs Restabelecimento/Piso e Faturamento com Sucesso Diário.

---

## 🚀 Como Rodar no VS Code (Passo a Passo)

### 1. Pré-requisitos
Certifique-se de ter instalado no seu computador:
- **[Node.js](https://nodejs.org/)** (Recomendado: versão LTS 18, 20 ou superior)
- **[Visual Studio Code](https://code.visualstudio.com/)**

---

### 2. Abrir o Projeto no VS Code
1. Abra o **VS Code**.
2. Vá em **File > Open Folder...** (ou `Ctrl + K, Ctrl + O`).
3. Selecione a pasta onde os arquivos do projeto foram extraídos.

---

### 3. Instalar as Dependências
Abra o terminal integrado do VS Code (`Ctrl + '` ou menu **Terminal > New Terminal**) e execute:

```bash
npm install
```

---

### 4. Configurar as Variáveis de Ambiente (Opcional)
Crie um arquivo chamado `.env` na raiz do projeto (se quiser usar integrações de IA com Gemini, copie do `.env.example`):

```bash
cp .env.example .env
```

---

### 5. Iniciar a Aplicação
No terminal do VS Code, execute:

```bash
npm run dev
```

Você verá a saída informando o link local:
```
  VITE v8.3.0  ready in ... ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://...:3000/
```

Segure `Ctrl` e clique no link `http://localhost:3000/` no terminal (ou abra no seu navegador). O sistema já estará funcionando com 100% dos recursos!

---

### Uso durante troca ou queda de Wi-Fi
Os dados da sessão são preservados no armazenamento local do navegador. Se a conexão cair, o painel continua disponível neste dispositivo e tenta sincronizar novamente quando a rede voltar. A sincronização entre dispositivos depende de o servidor continuar acessível.

Ao abrir o painel em outro dispositivo pelo endereço `Network` do terminal, esse endereço depende da rede atual do computador. Ao trocar de Wi-Fi, o IP pode mudar ou a nova rede pode bloquear o acesso; para acesso contínuo entre redes, use um endereço publicado e estável.

### Publicação no Vercel e sessão compartilhada

A rota `api/shared_state.ts` é publicada pelo Vercel como uma Serverless Function em `/api/shared_state`. O frontend usa uma URL relativa (`/api/shared_state`), portanto não precisa de uma URL de produção codificada.

O estado compartilhado é armazenado no Redis do Upstash. Crie uma base Redis pelo Vercel Marketplace e configure estas variáveis de ambiente no projeto Vercel (Production e Preview, conforme necessário):

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Depois de salvar as variáveis, faça um novo deploy. A função limita o estado compartilhado a 4 MB para respeitar o limite de payload do ambiente serverless. Para desenvolvimento local, `npm run dev` continua usando o endpoint local do `server.ts`.

## 🛠️ Scripts Disponíveis

- `npm run dev`: Inicia o servidor local de desenvolvimento na porta 3000.
- `npm run build`: Compila e gera os arquivos otimizados para produção na pasta `dist`.
- `npm run preview`: Visualiza o build de produção localmente.
- `npm run lint`: Checagem de tipagem TypeScript sem gerar arquivos.

---

## 💡 Dicas de Produtividade no VS Code
Recomendamos as seguintes extensões para o VS Code:
- **Tailwind CSS IntelliSense** (autocompletar classes de estilo)
- **ESLint** e **Prettier** (formatação automática)
- **TypeScript and JavaScript Language Features** (já vem nativo)

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

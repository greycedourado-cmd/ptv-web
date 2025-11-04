# 📦 Frontend Estático - #ParaTodosVerem

## 🎯 Visão Geral

Este é o frontend estático da aplicação #ParaTodosVerem, projetado para ser hospedado fora do GCP (GitHub Pages, Netlify, Vercel, etc.) para contornar a Organization Policy.

## 📁 Estrutura

```
frontend-static/
├── index.html              # Página de login
├── dashboard.html          # Dashboard principal
├── app.js                  # Lógica JavaScript (autenticação e API)
├── auth/
│   └── callback.html       # Callback OAuth2
└── README.md              # Este arquivo
```

## 🚀 Deploy

### **Opção 1: GitHub Pages**

1. Crie um repositório no GitHub
2. Faça upload dos arquivos
3. Ative GitHub Pages nas configurações do repositório
4. URL resultante: `https://[seu-usuario].github.io/[nome-repo]`

### **Opção 2: Netlify**

1. Acesse: https://www.netlify.com/
2. Arraste a pasta `frontend-static` para o Netlify
3. URL resultante: `https://[nome-random].netlify.app`

### **Opção 3: Vercel**

1. Instale Vercel CLI: `npm i -g vercel`
2. Execute: `vercel` na pasta `frontend-static`
3. URL resultante: `https://[nome-random].vercel.app`

## ⚙️ Configuração

### **1. Atualizar OAuth2 Client no Google Cloud Console**

1. Acesse: https://console.cloud.google.com/apis/credentials
2. Selecione o OAuth Client ID: `486467427429-esnr1m7qtld28li8m7f3at3lasc75dme`
3. Adicione em **Authorized JavaScript origins:**
   ```
   https://[seu-dominio].github.io
   https://[seu-dominio].netlify.app
   https://[seu-dominio].vercel.app
   ```
4. Adicione em **Authorized redirect URIs:**
   ```
   https://[seu-dominio].github.io/auth/callback.html
   https://[seu-dominio].netlify.app/auth/callback.html
   https://[seu-dominio].vercel.app/auth/callback.html
   ```

### **2. Atualizar CORS no Backend**

No arquivo `gcp-project/ptv-api/main.py`, atualize `ALLOWED_ORIGINS`:

```python
ALLOWED_ORIGINS = [
    "https://[seu-dominio].github.io",
    "https://[seu-dominio].netlify.app",
    "https://[seu-dominio].vercel.app",
    # Adicione outros domínios conforme necessário
]
```

Depois, faça o deploy do backend atualizado.

## 🔧 Personalização

### **Alterar URL da API**

No arquivo `app.js`, atualize:

```javascript
const API_URL = "https://ptv-api-7oaetpyoxq-uc.a.run.app";
```

### **Alterar Client ID**

No arquivo `app.js` e `index.html`, atualize:

```javascript
const CLIENT_ID = "486467427429-esnr1m7qtld28li8m7f3at3lasc75dme.apps.googleusercontent.com";
```

## ✅ Teste Local

1. Instale um servidor HTTP simples:
   ```bash
   # Python 3
   python3 -m http.server 8000
   
   # Node.js
   npx http-server
   ```

2. Acesse: `http://localhost:8000`

3. **Nota:** OAuth2 pode não funcionar em `localhost`. Use `127.0.0.1` ou configure no OAuth Client.

## 🔒 Segurança

- ✅ Tokens armazenados em `localStorage` (temporário)
- ✅ Validação de domínio @g.globo no frontend e backend
- ✅ Tokens expiram automaticamente
- ✅ HTTPS obrigatório em produção

## 📝 Funcionalidades

- ✅ Login com Google (domínio @g.globo)
- ✅ Upload de imagens
- ✅ Transcrição com Google Gemini
- ✅ Copiar texto
- ✅ Enviar por email (Outlook Web)

## 🐛 Troubleshooting

### **Erro: "Token inválido"**
- Verifique se o Client ID está correto
- Verifique se o domínio está autorizado no OAuth Client
- Verifique se o token não expirou

### **Erro: "CORS error"**
- Verifique se o domínio está em `ALLOWED_ORIGINS` no backend
- Faça o deploy do backend atualizado

### **Erro: "Domínio não autorizado"**
- Verifique se está usando conta @g.globo
- Verifique se o OAuth Client tem `hosted_domain: g.globo`

## 📚 Documentação Completa

Veja `SOLUCAO_FRONTEND_ESTATICO.md` para documentação completa.

---

**Desenvolvido para #ParaTodosVerem** 🚀


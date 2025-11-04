// Configuração
const API_URL = "https://ptv-api-7oaetpyoxq-uc.a.run.app";
const CLIENT_ID = "486467427429-esnr1m7qtld28li8m7f3at3lasc75dme.apps.googleusercontent.com";
const AUDIENCE = API_URL; // Audience deve ser a URL do Cloud Run

// Função para gerar nonce
function generateNonce() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Função para obter ID Token com audience do Cloud Run
function getIDTokenWithAudience() {
    return new Promise((resolve, reject) => {
        // Verificar se já temos token válido
        const storedToken = localStorage.getItem('id_token');
        const tokenExpiry = localStorage.getItem('id_token_expiry');
        
        if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
            resolve(storedToken);
            return;
        }
        
        // Usar GIS para obter credencial inicial
        google.accounts.id.initialize({
            client_id: CLIENT_ID,
            callback: (response) => {
                // Temos o ID Token do GIS, mas precisa ter audience do Cloud Run
                // Vamos usar o fluxo OAuth2 completo
                initiateOAuth2Flow();
            },
            auto_select: false,
            hosted_domain: "g.globo"
        });
        
        // Iniciar o fluxo OAuth2
        initiateOAuth2Flow();
    });
}

// Função para iniciar fluxo OAuth2 com audience
function initiateOAuth2Flow() {
    const nonce = generateNonce();
    const state = generateNonce();
    
    // Armazenar state e nonce para validação
    sessionStorage.setItem('oauth_state', state);
    sessionStorage.setItem('oauth_nonce', nonce);
    
    // Construir URL OAuth2 com response_type=id_token
    // Usar caminho relativo para funcionar em GitHub Pages
    const basePath = window.location.pathname.replace(/\/[^/]*$/, '') || '';
    const redirectUri = window.location.origin + basePath + '/auth/callback.html';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${encodeURIComponent(CLIENT_ID)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=id_token&` +
        `scope=openid%20email%20profile&` +
        `nonce=${encodeURIComponent(nonce)}&` +
        `state=${encodeURIComponent(state)}&` +
        `hd=g.globo`;
    
    // Redirecionar para Google
    window.location.href = authUrl;
}

// Função para processar callback OAuth2
function handleOAuthCallback() {
    const hash = window.location.hash.substring(1);
    if (!hash) {
        console.log('Nenhum hash encontrado, não é callback');
        return;
    }
    
    const params = new URLSearchParams(hash);
    const idToken = params.get('id_token');
    const state = params.get('state');
    const storedState = sessionStorage.getItem('oauth_state');
    
    if (!idToken) {
        console.error('Token não recebido no callback');
        if (window.location.pathname.includes('callback.html')) {
            const basePath = window.location.pathname.replace(/\/auth\/callback\.html$/, '') || '';
            document.body.innerHTML = `<div style="text-align:center;padding:40px;"><p>Erro: Token não recebido. <a href="${basePath}/index.html">Voltar ao login</a></p></div>`;
        }
        return;
    }
    
    if (state && storedState && state !== storedState) {
        console.error('State inválido');
            if (window.location.pathname.includes('callback.html')) {
                const basePath = window.location.pathname.replace(/\/auth\/callback\.html$/, '') || '';
                document.body.innerHTML = `<div style="text-align:center;padding:40px;"><p>Erro: State inválido. <a href="${basePath}/index.html">Voltar ao login</a></p></div>`;
            }
        return;
    }
    
    // Decodificar token para verificar expiração
    try {
        const payload = JSON.parse(atob(idToken.split('.')[1]));
        const expiry = payload.exp * 1000; // Converter para milissegundos
        
        // Armazenar token
        localStorage.setItem('id_token', idToken);
        localStorage.setItem('id_token_expiry', expiry.toString());
        localStorage.setItem('user_email', payload.email);
        localStorage.setItem('user_name', payload.name || '');
        
        // Verificar domínio
        if (!payload.email || !payload.email.endsWith('@g.globo')) {
            console.error('Domínio não autorizado:', payload.email);
            localStorage.removeItem('id_token');
            if (window.location.pathname.includes('callback.html')) {
                const basePath = window.location.pathname.replace(/\/auth\/callback\.html$/, '') || '';
                document.body.innerHTML = `<div style="text-align:center;padding:40px;"><p>Erro: Acesso restrito a usuários @g.globo. <a href="${basePath}/index.html">Voltar ao login</a></p></div>`;
            }
            return;
        }
        
        // Limpar state
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_nonce');
        
        // Redirecionar para dashboard (usar caminho relativo)
        const basePath = window.location.pathname.replace(/\/auth\/callback\.html$/, '') || '';
        window.location.href = basePath + '/dashboard.html';
    } catch (error) {
        console.error('Erro ao processar token:', error);
        if (window.location.pathname.includes('callback.html')) {
            const basePath = window.location.pathname.replace(/\/auth\/callback\.html$/, '') || '';
            document.body.innerHTML = `<div style="text-align:center;padding:40px;"><p>Erro ao processar autenticação. <a href="${basePath}/index.html">Voltar ao login</a></p></div>`;
        }
    }
}

// Função para obter ID Token (com fallback para OAuth2 flow)
async function getIDToken() {
    const storedToken = localStorage.getItem('id_token');
    const tokenExpiry = localStorage.getItem('id_token_expiry');
    
    if (storedToken && tokenExpiry && Date.now() < parseInt(tokenExpiry)) {
        return storedToken;
    }
    
    // Token expirado ou não existe, iniciar novo fluxo
    initiateOAuth2Flow();
    throw new Error('Token expirado, redirecionando para login...');
}

// Função para chamar API
async function callAPI(endpoint, method = 'GET', body = null) {
    const idToken = await getIDToken();
    
    if (!idToken) {
        // Fluxo OAuth2 em andamento, aguardar
        return null;
    }
    
    const headers = {
        'Authorization': `Bearer ${idToken}`,
    };
    
    if (body instanceof FormData) {
        // FormData não precisa Content-Type
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body,
        });
        return response;
    } else {
        headers['Content-Type'] = 'application/json';
        const response = await fetch(`${API_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null,
        });
        return response;
    }
}

// Função para transcrever imagem
async function transcreverImagem(file) {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await callAPI('/transcrever', 'POST', formData);
    
    if (!response) {
        throw new Error('Autenticação em andamento');
    }
    
    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `Erro ${response.status}`);
    }
    
    return await response.json();
}

// Função para mostrar erro
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    
    if (errorDiv && errorText) {
        errorText.textContent = message;
        errorDiv.classList.remove('hidden');
    } else {
        alert(message);
    }
}

// Handler para GIS Credential Response (fallback)
function handleCredentialResponse(response) {
    // Este é o token do GIS, mas não tem audience customizado
    // Vamos usar o fluxo OAuth2 completo
    initiateOAuth2Flow();
}

// Verificar se estamos no callback
if (window.location.pathname.includes('auth/callback.html') || window.location.hash.includes('id_token')) {
    // Aguardar DOM carregar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', handleOAuthCallback);
    } else {
        handleOAuthCallback();
    }
}

// Exportar funções para uso global
window.getIDToken = getIDToken;
window.callAPI = callAPI;
window.transcreverImagem = transcreverImagem;
window.handleCredentialResponse = handleCredentialResponse;


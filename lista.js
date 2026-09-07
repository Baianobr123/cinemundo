// ==========================================
// 1. CONFIGURAÇÃO DOS SERVIDORES (XTREAM)
// ==========================================
const XTREAM_SERVIDORES = {
    servidor1: {
        nome: "Servidor 1",
        server: "http://xewte.top:80", 
        username: "20264972071740",     
        password: "185660543698"       
    },
    servidor2: {
        nome: "Servidor 2",
        server: "http://p2toptz.pro:80", 
        username: "111111",     
        password: "222222"       
    },
    servidor3: {
        nome: "Servidor 3 (Estável)",
        server: "/api-xtream",
        rawServer: "http://digitalbr.cloud",
        username: "06858757",     
        password: "70745896"       
    }
};

let XTREAM_CONFIG = XTREAM_SERVIDORES.servidor3;
let dadosGlobais = [];

// Chave Pública do TMDB
const TMDB_API_KEY = "15d2fb6fe615161b361a1200155b410f";

// ==========================================
// 2. BUSCAR DADOS DO SERVIDOR (API)
// ==========================================
async function carregarDadosXtream() {
    const server = XTREAM_CONFIG.server;
    const rawServer = XTREAM_CONFIG.rawServer || server;
    const username = XTREAM_CONFIG.username;
    const password = XTREAM_CONFIG.password;
    
    const baseUrl = `${server}/player_api.php?username=${username}&password=${password}`;
    let baseLista = [];

    const termosProibidos = ["xxx", "adulto", "porn", "sexy", "erotico", "hentai", "18+", "playboy", "venus", "redlight"];
    const capaPadrao = "https://images.tmdb.org/t/p/w500/orS79T06mX6Zmdorv5g7Zf7fV4B.jpg";

    function ehValido(nome, grupo) {
        if (!nome) return false;
        const nLow = nome.toLowerCase();
        const gLow = (grupo || "").toLowerCase();
        return !termosProibidos.some(t => nLow.includes(t) || gLow.includes(t));
    }

    function limparNome(nome) {
        return nome ? nome.replace(/^[^\s|]+\s*\|\s*/gi, "").trim() : "";
    }

    try {
        // 1. CARREGAR CANAIS AO VIVO
        const catLiveMap = {};
        const resCatLive = await fetch(`${baseUrl}&action=get_live_categories`);
        if (resCatLive.ok) {
            const cats = await resCatLive.json();
            if (Array.isArray(cats)) cats.forEach(c => catLiveMap[c.category_id] = c.category_name);
        }

        const resLive = await fetch(`${baseUrl}&action=get_live_streams`);
        if (resLive.ok) {
            const liveData = await resLive.json();
            if (Array.isArray(liveData)) {
                liveData.forEach((item, index) => {
                    const grupo = catLiveMap[item.category_id] || "TV ao Vivo";
                    if (ehValido(item.name, grupo)) {
                        let tipo = "tv";
                        if (grupo.toLowerCase().includes("24h") || item.name.toLowerCase().includes("24h")) {
                            tipo = "24h";
                        }
                        baseLista.push({
                            id_global: `tv_${item.stream_id || index}`,
                            stream_id: item.stream_id,
                            nome: limparNome(item.name),
                            logo: item.stream_icon && item.stream_icon.startsWith("http") ? item.stream_icon : capaPadrao,
                            group: grupo,
                            url: `${server}/live/${username}/${password}/${item.stream_id}.m3u8`,
                            tipoOriginal: tipo
                        });
                    }
                });
            }
        }

        // 2. CARREGAR FILMES
        const catMoviesMap = {};
        const resCatMovies = await fetch(`${baseUrl}&action=get_vod_categories`);
        if (resCatMovies.ok) {
            const cats = await resCatMovies.json();
            if (Array.isArray(cats)) cats.forEach(c => catMoviesMap[c.category_id] = c.category_name);
        }

        const resMovies = await fetch(`${baseUrl}&action=get_vod_streams`);
        if (resMovies.ok) {
            const moviesData = await resMovies.json();
            if (Array.isArray(moviesData)) {
                moviesData.forEach((item, index) => {
                    const grupo = catMoviesMap[item.category_id] || "Filmes";
                    if (ehValido(item.name, grupo)) {
                        baseLista.push({
                            id_global: `movie_${item.stream_id || index}`,
                            stream_id: item.stream_id,
                            nome: limparNome(item.name),
                            logo: item.stream_icon && item.stream_icon.startsWith("http") ? item.stream_icon : capaPadrao,
                            group: grupo,
                            url: `${server}/movie/${username}/${password}/${item.stream_id}.${item.container_extension || 'mp4'}`,
                            tipoOriginal: "filme"
                        });
                    }
                });
            }
        }

        // 3. CARREGAR SÉRIES
        const catSeriesMap = {};
        const resCatSeries = await fetch(`${baseUrl}&action=get_series_categories`);
        if (resCatSeries.ok) {
            const cats = await resCatSeries.json();
            if (Array.isArray(cats)) cats.forEach(c => catSeriesMap[c.category_id] = c.category_name);
        }

        const resSeries = await fetch(`${baseUrl}&action=get_series`);
        if (resSeries.ok) {
            const seriesData = await resSeries.json();
            if (Array.isArray(seriesData)) {
                seriesData.forEach((item, index) => {
                    const grupo = catSeriesMap[item.category_id] || "Séries";
                    if (ehValido(item.name, grupo)) {
                        let tipo = "series";
                        const gLow = grupo.toLowerCase();
                        const nLow = item.name.toLowerCase();
                        
                        if (gLow.includes("anime") || gLow.includes("crunchyroll") || nLow.includes("anime")) {
                            tipo = "anime";
                        }
                        baseLista.push({
                            id_global: `series_${item.series_id || index}`,
                            series_id: item.series_id,
                            nome: limparNome(item.name),
                            logo: item.cover && item.cover.startsWith("http") ? item.cover : capaPadrao,
                            group: grupo,
                            url: `${server}/series/${username}/${password}/${item.series_id}.m3u8`,
                            tipoOriginal: tipo
                        });
                    }
                });
            }
        }
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }

    dadosGlobais = baseLista;
    renderizarTela(); // Desenha na tela assim que carregar
    return baseLista;
}

// ==========================================
// 3. DESENHAR CARDS NA TELA E PLAYER
// ==========================================
function renderizarTela() {
    // Procura a div onde o conteúdo deve ser desenhado
    let container = document.getElementById("conteudo-principal") || document.querySelector("main") || document.body;

    if (dadosGlobais.length === 0) {
        return;
    }

    // Agrupa por categoria
    const grupos = {};
    dadosGlobais.forEach(item => {
        const g = item.group || "Geral";
        if (!grupos[g]) grupos[g] = [];
        grupos[g].push(item);
    });

    let html = '<div style="padding: 20px;">';

    Object.keys(grupos).forEach(grupoNome => {
        html += `
            <div style="margin-bottom: 30px;">
                <h2 style="color: #e50914; font-family: sans-serif; border-left: 4px solid #e50914; padding-left: 10px; margin-bottom: 15px;">${grupoNome}</h2>
                <div style="display: flex; flex-wrap: wrap; gap: 15px;">
        `;

        grupos[grupoNome].slice(0, 30).forEach(item => {
            const logoUrl = item.logo || "https://images.tmdb.org/t/p/w500/orS79T06mX6Zmdorv5g7Zf7fV4B.jpg";
            html += `
                <div onclick="tocarMidia('${item.url}', '${item.nome}')" style="cursor: pointer; width: 130px; text-align: center; background: #181818; padding: 8px; border-radius: 8px;">
                    <img src="${logoUrl}" alt="${item.nome}" onerror="this.src='https://images.tmdb.org/t/p/w500/orS79T06mX6Zmdorv5g7Zf7fV4B.jpg'" style="width: 100%; height: 180px; object-fit: cover; border-radius: 6px;">
                    <p style="color: #fff; font-size: 12px; margin-top: 8px; font-family: sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.nome}</p>
                </div>
            `;
        });

        html += `
                </div>
            </div>
        `;
    });

    html += '</div>';
    
    // Cria div do Player Modal caso não exista
    if (!document.getElementById("modal-player-container")) {
        const modal = document.createElement("div");
        modal.id = "modal-player-container";
        modal.style.cssText = "display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:99999; align-items:center; justify-content:center;";
        document.body.appendChild(modal);
    }

    container.innerHTML = html;
}

// Player de vídeo
window.tocarMidia = function(url, nome) {
    const modal = document.getElementById("modal-player-container");
    if (!modal) return;

    modal.innerHTML = `
        <div style="position: relative; width: 90%; max-width: 800px; background: #000; padding: 20px; border-radius: 10px; border: 1px solid #333;">
            <button onclick="fecharPlayer()" style="position: absolute; top: 10px; right: 10px; background: #e50914; color: #fff; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">X Fechar</button>
            <h3 style="color: #fff; font-family: sans-serif; margin-bottom: 15px; font-size: 16px;">${nome}</h3>
            <video controls autoplay style="width: 100%; max-height: 450px; background: #000;">
                <source src="${url}" type="application/x-mpegURL">
                Seu navegador não suporta a reprodução deste vídeo.
            </video>
        </div>
    `;
    modal.style.display = "flex";
};

window.fecharPlayer = function() {
    const modal = document.getElementById("modal-player-container");
    if (modal) {
        modal.style.display = "none";
        modal.innerHTML = "";
    }
};

// Executa automaticamente ao carregar o site
document.addEventListener("DOMContentLoaded", () => {
    carregarDadosXtream();
});

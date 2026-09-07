// ==========================================
// CONFIGURAÇÃO DOS SERVIDORES (MÚLTIPLOS)
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
        server: "https://digitalbr.cloud",
        username: "06858757",     
        password: "70745896"       
    },
    servidor4: {
        nome: "Servidor 4",
        server: "http://45.12.1.96:80", 
        username: "001062",     
        password: "vymrux"       
    },
    servidor5: {
        nome: "Servidor 5",
        server: "http://phs.lat", 
        username: "243588267208",     
        password: "991"       
    }
};

let XTREAM_CONFIG = XTREAM_SERVIDORES.servidor1;

const PROXY_CORS = "https://cinemundo-proxy.onrender.com/proxy?url=";

function criarUrlProxy(url) {
    if (window.location.protocol === 'https:' && url.startsWith('http:')) {
        return PROXY_CORS + encodeURIComponent(url);
    }
    // Força o proxy do Render em links http para evitar bloqueio misto no GitHub Pages
    if (url.startsWith('http://')) {
        return PROXY_CORS + encodeURIComponent(url);
    }
    return url;
}

async function carregarDadosXtream() {
    const server = XTREAM_CONFIG.server;
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
        // 1. Carregar Canais ao Vivo
        const catLiveMap = {};
        const resCatLive = await fetch(criarUrlProxy(`${baseUrl}&action=get_live_categories`));
        if (resCatLive.ok) {
            const cats = await resCatLive.json();
            if (Array.isArray(cats)) cats.forEach(c => catLiveMap[c.category_id] = c.category_name);
        }

        const resLive = await fetch(criarUrlProxy(`${baseUrl}&action=get_live_streams`));
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
                        const urlOriginal = `${server}/live/${username}/${password}/${item.stream_id}.m3u8`;
                        baseLista.push({
                            id_global: `tv_${item.stream_id || index}`,
                            nome: limparNome(item.name),
                            logo: item.stream_icon && item.stream_icon.startsWith('http') ? item.stream_icon : capaPadrao,
                            group: grupo,
                            url: criarUrlProxy(urlOriginal),
                            tipoOriginal: tipo
                        });
                    }
                });
            }
        }

        // 2. Carregar Filmes (VOD)
        const catMoviesMap = {};
        const resCatMovies = await fetch(criarUrlProxy(`${baseUrl}&action=get_vod_categories`));
        if (resCatMovies.ok) {
            const cats = await resCatMovies.json();
            if (Array.isArray(cats)) cats.forEach(c => catMoviesMap[c.category_id] = c.category_name);
        }

        const resMovies = await fetch(criarUrlProxy(`${baseUrl}&action=get_vod_streams`));
        if (resMovies.ok) {
            const moviesData = await resMovies.json();
            if (Array.isArray(moviesData)) {
                moviesData.forEach((item, index) => {
                    const grupo = catMoviesMap[item.category_id] || "Filmes";
                    if (ehValido(item.name, grupo)) {
                        const urlOriginal = `${server}/movie/${username}/${password}/${item.stream_id}.${item.container_extension || 'mp4'}`;
                        baseLista.push({
                            id_global: `movie_${item.stream_id || index}`,
                            nome: limparNome(item.name),
                            logo: item.stream_icon && item.stream_icon.startsWith('http') ? item.stream_icon : capaPadrao,
                            group: grupo,
                            url: criarUrlProxy(urlOriginal),
                            tipoOriginal: "filme"
                        });
                    }
                });
            }
        }

        // 3. Carregar Séries
        const catSeriesMap = {};
        const resCatSeries = await fetch(criarUrlProxy(`${baseUrl}&action=get_series_categories`));
        if (resCatSeries.ok) {
            const cats = await resCatSeries.json();
            if (Array.isArray(cats)) cats.forEach(c => catSeriesMap[c.category_id] = c.category_name);
        }

        const resSeries = await fetch(criarUrlProxy(`${baseUrl}&action=get_series`));
        if (resSeries.ok) {
            const seriesData = await resSeries.json();
            if (Array.isArray(seriesData)) {
                seriesData.forEach((item, index) => {
                    const grupo = catSeriesMap[item.category_id] || "Séries";
                    if (ehValido(item.name, grupo)) {
                        let tipo = "series";
                        const gLow = grupo.toLowerCase();
                        const nLow = item.name.toLowerCase();
                        
                        if (gLow.includes("anime") || gLow.includes("crunchyroll") || gLow.includes("otaku") || gLow.includes("desenho") || gLow.includes("animation") || nLow.includes("anime")) {
                            tipo = "anime";
                        }
                        const urlOriginal = `${server}/series/${username}/${password}/${item.series_id}`;
                        baseLista.push({
                            id_global: `series_${item.series_id || index}`,
                            series_id: item.series_id,
                            nome: limparNome(item.name),
                            logo: item.cover && item.cover.startsWith('http') ? item.cover : capaPadrao,
                            group: grupo,
                            url: criarUrlProxy(urlOriginal),
                            tipoOriginal: tipo
                        });
                    }
                });
            }
        }
    } catch (e) {
        console.error("Erro geral na sincronização:", e);
    }
    return baseLista;
}

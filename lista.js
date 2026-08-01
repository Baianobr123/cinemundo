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
        server: "http://plutovip.eu:8880", 
        username: "08845085",     
        password: "02578172"       
    },
    servidor4: {
        nome: "Servidor 4",
        server: "http://gftv.club:80", 
        username: "39y14c62",     
        password: "wzs10r"       
    },
    servidor5: {
        nome: "Servidor 5",
        server: "http://phs.lat", 
        username: "243588267208",     
        password: "991"       
    }
};

// Define o Servidor 3 como inicial por ser o mais estável
let XTREAM_CONFIG = XTREAM_SERVIDORES.servidor3;

// ==========================================
// MOTOR DE BUSCA E INTEGRAÇÃO DE CATEGORIAS
// ==========================================
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
        // 1. CARREGAR CANAIS (LIVE STREAM)
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
                            nome: limparNome(item.name),
                            logo: item.stream_icon && item.stream_icon.startsWith('http') ? item.stream_icon : capaPadrao,
                            group: grupo,
                            url: `${server}/live/${username}/${password}/${item.stream_id}.m3u8`,
                            tipoOriginal: tipo
                        });
                    }
                });
            }
        }

        // 2. CARREGAR FILMES (VOD MOVIES)
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
                            nome: limparNome(item.name),
                            logo: item.stream_icon && item.stream_icon.startsWith('http') ? item.stream_icon : capaPadrao,
                            group: grupo,
                            url: `${server}/movie/${username}/${password}/${item.stream_id}.${item.container_extension || 'mp4'}`,
                            tipoOriginal: "filme"
                        });
                    }
                });
            }
        }

        // 3. CARREGAR SÉRIES E ANIMES
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
                        
                        if (gLow.includes("anime") || gLow.includes("crunchyroll") || gLow.includes("otaku") || gLow.includes("desenho") || gLow.includes("animation") || nLow.includes("anime")) {
                            tipo = "anime";
                        }
                        baseLista.push({
                            id_global: `series_${item.series_id || index}`,
                            series_id: item.series_id, // Guarda o ID real da série
                            nome: limparNome(item.name),
                            logo: item.cover && item.cover.startsWith('http') ? item.cover : capaPadrao,
                            group: grupo,
                            url: `${server}/series/${username}/${password}/${item.series_id}.m3u8`,
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
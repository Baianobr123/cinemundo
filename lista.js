// ==========================================
// CONFIGURAÇÃO DOS SERVIDORES
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
        username: "06858757",     
        password: "70745896"       
    }
};

let XTREAM_CONFIG = XTREAM_SERVIDORES.servidor3;

// TMDB Integração
const TMDB_API_KEY = "15d2fb6fe615161b361a1200155b410f";

async function buscarInfoTMDB(nome, tipo = "movie") {
    try {
        const nomeLimpo = encodeURIComponent(nome.replace(/\b(4k|1080p|720p|dublado|legendado|hd)\b/gi, "").trim());
        const url = `https://api.themoviedb.org/3/search/${tipo}?api_key=${TMDB_API_KEY}&query=${nomeLimpo}&language=pt-BR`;
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
                const item = data.results[0];
                return {
                    sinopse: item.overview || "Sem sinopse disponível.",
                    capa: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
                    backdrop: item.backdrop_path ? `https://image.tmdb.org/t/p/w1280${item.backdrop_path}` : null
                };
            }
        }
    } catch (e) {
        console.error("Erro no TMDB:", e);
    }
    return null;
}

// ==========================================
// BUSCA E PADRONIZAÇÃO DE DADOS
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
                            logo: item.stream_icon ? item.stream_icon : capaPadrao,
                            group: grupo,
                            categoria: grupo,
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
                            logo: item.stream_icon ? item.stream_icon : capaPadrao,
                            group: grupo,
                            categoria: grupo,
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
                            logo: item.cover ? item.cover : capaPadrao,
                            group: grupo,
                            categoria: grupo,
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
    return baseLista;
}

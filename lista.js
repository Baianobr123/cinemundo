// ==========================================
// CONFIGURAÇÃO DOS SERVIDORES (MÚLTIPLOS)
// ==========================================
const XTREAM_SERVIDORES = {
    servidor1: {
        nome: "Servidor 1",
        server: "http://airloo.xyz:8880", 
        username: "516965862",     
        password: "421230446"       
    }
};

let XTREAM_CONFIG = XTREAM_SERVIDORES.servidor1;

// NOVO PROXY (Mais rápido e confiável para GitHub Pages)
const PROXY_CORS = "https://api.allorigins.win/raw?url=";

function criarUrlProxy(url) {
    return PROXY_CORS + encodeURIComponent(url);
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

    async function fetchProxy(url) {
        try {
            const res = await fetch(criarUrlProxy(url));
            if (res.ok) return await res.json();
        } catch (e) {
            console.warn("Erro na requisição:", url);
        }
        return [];
    }

    try {
        // 1. TV
        const catLive = await fetchProxy(`${baseUrl}&action=get_live_categories`);
        const mapLive = {};
        if (Array.isArray(catLive)) catLive.forEach(c => mapLive[c.category_id] = c.category_name);

        const liveData = await fetchProxy(`${baseUrl}&action=get_live_streams`);
        if (Array.isArray(liveData)) {
            liveData.forEach((item, index) => {
                const grupo = mapLive[item.category_id] || "TV ao Vivo";
                if (ehValido(item.name, grupo)) {
                    let tipo = (grupo.toLowerCase().includes("24h") || item.name.toLowerCase().includes("24h")) ? "24h" : "tv";
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

        // 2. FILMES
        const catVod = await fetchProxy(`${baseUrl}&action=get_vod_categories`);
        const mapVod = {};
        if (Array.isArray(catVod)) catVod.forEach(c => mapVod[c.category_id] = c.category_name);

        const vodData = await fetchProxy(`${baseUrl}&action=get_vod_streams`);
        if (Array.isArray(vodData)) {
            vodData.forEach((item, index) => {
                const grupo = mapVod[item.category_id] || "Filmes";
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

        // 3. SÉRIES
        const catSer = await fetchProxy(`${baseUrl}&action=get_series_categories`);
        const mapSer = {};
        if (Array.isArray(catSer)) catSer.forEach(c => mapSer[c.category_id] = c.category_name);

        const serData = await fetchProxy(`${baseUrl}&action=get_series`);
        if (Array.isArray(serData)) {
            serData.forEach((item, index) => {
                const grupo = mapSer[item.category_id] || "Séries";
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

    } catch (e) {
        console.error("Erro geral na sincronização:", e);
    }
    return baseLista;
}

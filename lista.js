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
        nome: "Servidor 3",
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
        username: "24354647",     
        password: "35724930"       
    },
	servidor6: {
        nome: "Servidor 6",
        server: "http://abacateira.xyz:80", 
        username: "Zirleitv",     
        password: "1479YZMUwauz"       
    },
	servidor7: {
        nome: "Servidor 7",
        server: "http://flayto.click", 
        username: "PitagorasB",     
        password: "85484727"       
    }
};

let XTREAM_CONFIG = XTREAM_SERVIDORES.servidor1;

// CHAVE DO TMDB QUE JÁ ESTAVA CONFIGURADA POR TI
const TMDB_KEY = "3d76e73c4d7ec9f5a0be5fb5c414dfdb";

// ==========================================
// MOTOR DE BUSCA E INTEGRAÇÃO DE CATEGORIAS
// ==========================================
async function carregarDadosXtream() {
    const { server, username, password } = XTREAM_CONFIG;
    
    // DEFINIÇÃO DO PROXY PARA EVITAR CONTEÚDO MISTO (HTTPS/HTTP) NO GITHUB PAGES
    const proxyUrl = "https://api.allorigins.win/raw?url=";
    const targetUrl = `${server}/player_api.php?username=${username}&password=${password}`;
    const baseUrl = window.location.protocol === "https:" ? `${proxyUrl}${encodeURIComponent(targetUrl)}` : targetUrl;

    let baseLista = [];
    const termosProibidos = ["xxx", "adulto", "porn", "sexy", "erotico", "hentai", "18+", "playboy", "venus", "redlight"];
    const capaPadrao = "https://images.tmdb.org/t/p/w500/orS79T06mX6Zmdorv5g7Zf7fV4B.jpg";

    function ehValido(nome, grupo) {
        const n = (nome || "").toLowerCase();
        const g = (grupo || "").toLowerCase();
        return !termosProibidos.some(termo => n.includes(termo) || g.includes(termo));
    }

    function limparNome(nomeOriginal) {
        if (!nomeOriginal) return "Sem Nome";
        return nomeOriginal.replace(/\.[^/.]+$/, "").replace(/_/g, " ").replace(/-/g, " ").trim();
    }

    async function obterCategorias(action) {
        let mapa = {};
        try {
            const URLAction = window.location.protocol === "https:" 
                ? `${proxyUrl}${encodeURIComponent(`${server}/player_api.php?username=${username}&password=${password}&action=${action}`)}`
                : `${server}/player_api.php?username=${username}&password=${password}&action=${action}`;
                
            const res = await fetch(URLAction);
            if (res.ok) {
                const dados = await res.json();
                if (Array.isArray(dados)) {
                    dados.forEach(c => { mapa[c.category_id] = c.category_name; });
                }
            }
        } catch(e){}
        return mapa;
    }

    try {
        const catLiveMap = await obterCategorias("get_live_categories");
        const catVodMap = await obterCategorias("get_vod_categories");
        const catSeriesMap = await obterCategorias("get_series_categories");

        // 1. CARREGAR CANAIS AO VIVO
        const URLLive = window.location.protocol === "https:" ? `${baseUrl}&action=get_live_streams` : `${targetUrl}&action=get_live_streams`;
        const resLive = await fetch(URLLive);
        if (resLive.ok) {
            const liveData = await resLive.json();
            if (Array.isArray(liveData)) {
                liveData.forEach(item => {
                    const grupo = catLiveMap[item.category_id] || "Canais de TV";
                    if (ehValido(item.name, grupo)) {
                        let tipo = "tv";
                        if (grupo.toLowerCase().includes("24h") || item.name.toLowerCase().includes("24h")) {
                            tipo = "24h";
                        }
                        baseLista.push({
                            id_unico: `live_${item.stream_id}`,
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

        // 2. CARREGAR FILMES (VOD)
        const URLMovies = window.location.protocol === "https:" ? `${baseUrl}&action=get_vod_streams` : `${targetUrl}&action=get_vod_streams`;
        const resMovies = await fetch(URLMovies);
        if (resMovies.ok) {
            const moviesData = await resMovies.json();
            if (Array.isArray(moviesData)) {
                moviesData.forEach(item => {
                    const grupo = catVodMap[item.category_id] || "Filmes";
                    if (ehValido(item.name, grupo)) {
                        let tipo = "filme";
                        if (grupo.toLowerCase().includes("anime") || item.name.toLowerCase().includes("anime")) {
                            tipo = "anime";
                        }
                        
                        const nomeLimpo = limparNome(item.name);
                        const capaProvisoria = item.stream_icon && item.stream_icon.startsWith('http') ? item.stream_icon : capaPadrao;

                        baseLista.push({
                            id_unico: `movie_${item.stream_id}`,
                            nome: nomeLimpo,
                            logo: capaProvisoria,
                            group: grupo,
                            url: `${server}/movie/${username}/${password}/${item.stream_id}.${item.container_extension || 'mp4'}`,
                            tipoOriginal: tipo
                        });
                    }
                });
            }
        }

        // 3. CARREGAR SÉRIES E ANIMES
        const URLSeries = window.location.protocol === "https:" ? `${baseUrl}&action=get_series` : `${targetUrl}&action=get_series`;
        const resSeries = await fetch(URLSeries);
        if (resSeries.ok) {
            const seriesData = await resSeries.json();
            if (Array.isArray(seriesData)) {
                seriesData.forEach(item => {
                    const grupo = catSeriesMap[item.category_id] || "Séries";
                    if (ehValido(item.name, grupo)) {
                        let tipo = "series";
                        const gLow = grupo.toLowerCase();
                        const nLow = item.name.toLowerCase();
                        
                        if (gLow.includes("anime") || gLow.includes("crunchyroll") || gLow.includes("otaku") || gLow.includes("desenho") || gLow.includes("animation") || nLow.includes("anime") || nLow.includes("legendado") || nLow.includes("dublado")) {
                            tipo = "anime";
                        }

                        const nomeLimpo = limparNome(item.name);
                        const capaProvisoria = item.cover && item.cover.startsWith('http') ? item.cover : capaPadrao;

                        baseLista.push({
                            id_unico: `series_${item.series_id}`,
                            nome: nomeLimpo,
                            logo: capaProvisoria,
                            group: grupo,
                            url: `${server}/series/${username}/${password}/${item.series_id}.m3u8`,
                            tipoOriginal: tipo
                        });
                    }
                });
            }
        }

        // DISPARA AS CAPAS DO TMDB EM SEGUNDO PLANO LOGO DEPOIS DO CARREGAMENTO
        if (TMDB_KEY) {
            setTimeout(() => otimizarCapasComTMDB(baseLista), 50);
        }

    } catch (e) {
        console.error("Erro geral na sincronização:", e);
    }
    return baseLista;
}

// INTEGRAÇÃO ASSÍNCRONA E INDEPENDENTE COM O TMDB QUE JÁ TINHAS
async function otimizarCapasComTMDB(lista) {
    // Processa os itens em blocos paralelos para ser ultra rápido
    const chunk = 5;
    for (let i = 0; i < lista.length; i += chunk) {
        const partes = lista.slice(i, i + chunk);
        await Promise.all(partes.map(async (item) => {
            if (item.tipoOriginal === 'tv' || item.tipoOriginal === '24h') return;
            
            let termoBusca = item.nome
                .replace(/^[^\s|]+\s*\|\s*/gi, "") 
                .replace(/\b(globoplay|netflix|prime|disney|hbo|apple|max|paramount|crunchyroll)\b/gi, "") 
                .replace(/\b(dublado|legendado|multi|4k|fhd|hd|720p|1080p|h264|x264|temporada|episodio|completa|sd|202[0-9]|201[0-9])\b/gi, "") 
                .replace(/\s+/g, " ") 
                .trim();

            if (!termoBusca) termoBusca = item.nome;
            const tipoEndpoint = (item.tipoOriginal === 'series' || item.tipoOriginal === 'anime') ? 'tv' : 'movie';

            try {
                const res = await fetch(`https://api.themoviedb.org/3/search/${tipoEndpoint}?api_key=${TMDB_KEY}&query=${encodeURIComponent(termoBusca)}&language=pt-BR`);
                if (res.ok) {
                    const dados = await res.json();
                    if (dados.results && dados.results.length > 0 && dados.results[0].poster_path) {
                        const novaCapa = `https://image.tmdb.org/t/p/w500${dados.results[0].poster_path}`;
                        
                        item.logo = novaCapa;

                        const imgElemento = document.querySelector(`[data-id-capa="${item.id_unico}"]`);
                        if (imgElemento) {
                            imgElemento.src = novaCapa;
                        }
                    }
                }
            } catch(e){}
        }));
        await new Promise(r => setTimeout(r, 150)); // Evita bloqueio de IP por excesso de requisições por segundo
    }
}

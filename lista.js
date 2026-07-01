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
const TMDB_KEY = "fd4dee61e7ac687a4a825cfd6f2f809c";

// ==========================================
// MOTOR DE REQUISIÇÃO WEB COMPATÍVEL (HTTPS)
// ==========================================
async function fetchSeguro(url) {
    // Se estiver online no GitHub (HTTPS), usa um gateway de criptografia para não dar erro
    const urlFinal = window.location.protocol === "https:" 
        ? `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
        : url;

    try {
        const res = await fetch(urlFinal);
        if (res.ok) {
            const dados = await res.json();
            return dados.contents ? JSON.parse(dados.contents) : dados;
        }
    } catch (e) {
        console.error("Erro na requisição externa.");
    }
    return null;
}

async function carregarDadosXtream() {
    const { server, username, password } = XTREAM_CONFIG;
    const baseUrl = `${server}/player_api.php?username=${username}&password=${password}`;
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

    try {
        const dadosCatLive = await fetchSeguro(`${baseUrl}&action=get_live_categories`);
        const catLiveMap = {};
        if (Array.isArray(dadosCatLive)) dadosCatLive.forEach(c => { catLiveMap[c.category_id] = c.category_name; });

        const dadosCatVod = await fetchSeguro(`${baseUrl}&action=get_vod_categories`);
        const catVodMap = {};
        if (Array.isArray(dadosCatVod)) dadosCatVod.forEach(c => { catVodMap[c.category_id] = c.category_name; });

        const dadosCatSeries = await fetchSeguro(`${baseUrl}&action=get_series_categories`);
        const catSeriesMap = {};
        if (Array.isArray(dadosCatSeries)) dadosCatSeries.forEach(c => { catSeriesMap[c.category_id] = c.category_name; });

        // 1. CANAIS
        const liveData = await fetchSeguro(`${baseUrl}&action=get_live_streams`);
        if (Array.isArray(liveData)) {
            liveData.forEach(item => {
                const grupo = catLiveMap[item.category_id] || "Canais de TV";
                if (ehValido(item.name, grupo)) {
                    let tipo = "tv";
                    if (grupo.toLowerCase().includes("24h") || item.name.toLowerCase().includes("24h")) tipo = "24h";
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

        // 2. FILMES
        const moviesData = await fetchSeguro(`${baseUrl}&action=get_vod_streams`);
        if (Array.isArray(moviesData)) {
            moviesData.forEach(item => {
                const grupo = catVodMap[item.category_id] || "Filmes";
                if (ehValido(item.name, grupo)) {
                    let tipo = "filme";
                    if (grupo.toLowerCase().includes("anime") || item.name.toLowerCase().includes("anime")) tipo = "anime";
                    baseLista.push({
                        id_unico: `movie_${item.stream_id}`,
                        nome: limparNome(item.name),
                        logo: item.stream_icon && item.stream_icon.startsWith('http') ? item.stream_icon : capaPadrao,
                        group: grupo,
                        url: `${server}/movie/${username}/${password}/${item.stream_id}.${item.container_extension || 'mp4'}`,
                        tipoOriginal: tipo
                    });
                }
            });
        }

        // 3. SÉRIES
        const seriesData = await fetchSeguro(`${baseUrl}&action=get_series`);
        if (Array.isArray(seriesData)) {
            seriesData.forEach(item => {
                const grupo = catSeriesMap[item.category_id] || "Séries";
                if (ehValido(item.name, grupo)) {
                    let tipo = "series";
                    if (grupo.toLowerCase().includes("anime") || item.name.toLowerCase().includes("anime")) tipo = "anime";
                    baseLista.push({
                        id_unico: `series_${item.series_id}`,
                        nome: limparNome(item.name),
                        logo: item.cover && item.cover.startsWith('http') ? item.cover : capaPadrao,
                        group: grupo,
                        url: `${server}/series/${username}/${password}/${item.series_id}.m3u8`,
                        tipoOriginal: tipo
                    });
                }
            });
        }

        if (TMDB_KEY && baseLista.length > 0) {
            setTimeout(() => processarCapasEmSegundoPlano(baseLista), 50);
        }

    } catch (e) {
        console.error("Erro na sincronização:", e);
    }
    return baseLista;
}

async function processarCapasEmSegundoPlano(lista) {
    const itensParaBuscar = lista.filter(item => item.tipoOriginal !== 'tv' && item.tipoOriginal !== '24h');
    const tamanhoBloco = 3;
    for (let i = 0; i < itensParaBuscar.length; i += tamanhoBloco) {
        const bloco = itensParaBuscar.slice(i, i + tamanhoBloco);
        await Promise.all(bloco.map(async (item) => {
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
                        if (imgElemento) imgElemento.src = novaCapa;
                    }
                }
            } catch(e){}
        }));
        await new Promise(r => setTimeout(r, 100));
    }
}
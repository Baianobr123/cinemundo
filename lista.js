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
        console.error("Erro TMDB:", e);
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
        // 1. CANAIS AO VIVO
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
                        let tipoGeral = "tv";
                        if (grupo.toLowerCase().includes("24h") || item.name.toLowerCase().includes("24h")) tipoGeral = "24h";
                        const img = item.stream_icon ? item.stream_icon : capaPadrao;
                        const nomeTratado = limparNome(item.name);
                        
                        baseLista.push({
                            id: item.stream_id || index,
                            id_global: `tv_${item.stream_id || index}`,
                            stream_id: item.stream_id,
                            nome: nomeTratado,
                            name: nomeTratado,
                            title: nomeTratado,
                            logo: img,
                            stream_icon: img,
                            icon: img,
                            cover: img,
                            poster: img,
                            group: grupo,
                            categoria: grupo,
                            category_name: grupo,
                            category_id: item.category_id,
                            url: `${server}/live/${username}/${password}/${item.stream_id}.m3u8`,
                            stream_url: `${server}/live/${username}/${password}/${item.stream_id}.m3u8`,
                            tipoOriginal: tipoGeral,
                            type: tipoGeral
                        });
                    }
                });
            }
        }

        // 2. FILMES
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
                        const img = item.stream_icon ? item.stream_icon : capaPadrao;
                        const nomeTratado = limparNome(item.name);
                        const ext = item.container_extension || 'mp4';

                        baseLista.push({
                            id: item.stream_id || index,
                            id_global: `movie_${item.stream_id || index}`,
                            stream_id: item.stream_id,
                            nome: nomeTratado,
                            name: nomeTratado,
                            title: nomeTratado,
                            logo: img,
                            stream_icon: img,
                            icon: img,
                            cover: img,
                            poster: img,
                            group: grupo,
                            categoria: grupo,
                            category_name: grupo,
                            category_id: item.category_id,
                            url: `${server}/movie/${username}/${password}/${item.stream_id}.${ext}`,
                            stream_url: `${server}/movie/${username}/${password}/${item.stream_id}.${ext}`,
                            tipoOriginal: "filme",
                            type: "filme"
                        });
                    }
                });
            }
        }

        // 3. SÉRIES
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
                        let tipoGeral = "series";
                        const gLow = grupo.toLowerCase();
                        const nLow = item.name.toLowerCase();
                        if (gLow.includes("anime") || gLow.includes("crunchyroll") || nLow.includes("anime")) tipoGeral = "anime";

                        const img = item.cover ? item.cover : capaPadrao;
                        const nomeTratado = limparNome(item.name);

                        baseLista.push({
                            id: item.series_id || index,
                            id_global: `series_${item.series_id || index}`,
                            series_id: item.series_id,
                            nome: nomeTratado,
                            name: nomeTratado,
                            title: nomeTratado,
                            logo: img,
                            stream_icon: img,
                            icon: img,
                            cover: img,
                            poster: img,
                            group: grupo,
                            categoria: grupo,
                            category_name: grupo,
                            category_id: item.category_id,
                            url: `${server}/series/${username}/${password}/${item.series_id}.m3u8`,
                            stream_url: `${server}/series/${username}/${password}/${item.series_id}.m3u8`,
                            tipoOriginal: tipoGeral,
                            type: tipoGeral
                        });
                    }
                });
            }
        }
    } catch (e) {
        console.error("Erro ao carregar dados:", e);
    }

    window.listaCompletaSite = baseLista;
    window.baseLista = baseLista;
    return baseLista;
}

// Intercepta os cliques no seu layout para desenhar os cards na tela
document.addEventListener("click", function (e) {
    const cardCat = e.target.closest(".card-categoria, [onclick*='abrirCategoria']");
    if (cardCat) {
        const tituloEl = cardCat.querySelector("h3, .title, strong") || cardCat;
        const nomeCategoria = tituloEl.innerText.split("\n")[0].trim();
        
        setTimeout(() => {
            renderizarCardsCustom(nomeCategoria);
        }, 50);
    }
});

function renderizarCardsCustom(nomeCategoria) {
    const container = document.querySelector("#conteudo-principal, #grid-conteudo, main, .content") || document.body;
    const lista = window.listaCompletaSite || window.baseLista || [];
    
    // Filtra pelo nome exato da categoria clicada
    const itens = lista.filter(item => item.group === nomeCategoria || item.categoria === nomeCategoria);
    
    // Procura o container onde a lista vazia estava aparecendo
    const areaCards = container.querySelector(".grid-cards, #cards-container, .lista-itens") || container;

    if (itens.length > 0) {
        let htmlCards = `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 15px; padding: 20px;">`;
        itens.forEach(item => {
            htmlCards += `
                <div class="card-item" onclick="window.open('${item.url}', '_blank')" style="background: #121829; border-radius: 8px; overflow: hidden; cursor: pointer; text-align: center;">
                    <img src="${item.logo}" alt="${item.nome}" style="width: 100%; height: 210px; object-fit: cover;" onerror="this.src='https://images.tmdb.org/t/p/w500/orS79T06mX6Zmdorv5g7Zf7fV4B.jpg';">
                    <div style="padding: 8px; color: #fff; font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.nome}</div>
                </div>
            `;
        });
        htmlCards += `</div>`;
        areaCards.innerHTML = htmlCards;
    }
}

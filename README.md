

<div align="center">
  <img src="https://img.shields.io/badge/UI%2FUX-Spotify_Clone-1ED760?style=for-the-badge&logo=spotify&logoColor=white" alt="Spotify UI" />
  <img src="https://img.shields.io/badge/Data_API-Apple_Music-FA243C?style=for-the-badge&logo=apple-music&logoColor=white" alt="Apple Music API" />
  <img src="https://img.shields.io/badge/Audio-Web_Audio_API-blue?style=for-the-badge&logo=w3c&logoColor=white" alt="Web Audio API" />
</div>

# 🎧 Spotify Clone (Hybrid Edition)

> Um player de música web sofisticado que une a performance de arquivos locais com a riqueza de metadados da Apple Music API, apresentando um visualizador de áudio em tempo real.

![Preview do Projeto](https://via.placeholder.com/1200x600?text=Spotify+Clone+Preview+Dashboard)
*(Substitua este link por um print real ou GIF do seu projeto rodando)*

## 📖 Sobre o Projeto

Este projeto é uma recriação funcional da interface do Spotify Web, focada em **experiência do usuário (UX)** e **manipulação avançada de áudio**.

Diferente de clones comuns que apenas tocam prévias de APIs, este é um **Player Híbrido**: ele toca arquivos MP3 de alta qualidade armazenados localmente, mas busca capas, artistas e nomes em tempo real na **iTunes Search API**. Isso garante zero latência no áudio e uma interface sempre bonita e atualizada.

## ✨ Funcionalidades Principais

### 🎨 Interface & UX
* **Layout "Split View" (70/30):** Design moderno onde a lista de reprodução ocupa 70% da tela e o painel de "Tocando Agora" (com capa gigante e visualizador) ocupa os 30% restantes na direita.
* **Dark Mode Nativo:** Paleta de cores fiel ao Spotify (`#1DB954`, `#121212`).
* **Sidebar Dinâmica:** As playlists são geradas automaticamente via JavaScript, sem necessidade de editar HTML.
* **Responsividade:** Ajustes finos de scroll, flexbox e grid.

### 🔊 Áudio & Tecnologia
* **Web Audio API Visualizer:** Um VU Meter (Espectro de Áudio) desenhado em `Canvas` que reage em tempo real às frequências da música (Bass/Treble), com estilo digital retrô (Verde para níveis normais, Vermelho para picos).
* **Smart Shuffle (Fisher-Yates):** Algoritmo de embaralhamento real que garante que nenhuma música se repita até que a lista acabe.
* **Hybrid Data Fetching:**
    * *Áudio:* Carregado do File System local.
    * *Metadados:* Buscados assincronamente na iTunes API baseados em query strings.
* **Controle de Sessão:** Sistema inteligente que cancela requisições de imagens antigas se o usuário trocar de playlist rapidamente, economizando dados e evitando bugs visuais.

### 🚀 Navegação
* **Busca Contextual:** A barra de busca filtra sua biblioteca local (`songs.js`). Ao clicar em um resultado, o player monta uma fila de reprodução com a playlist de origem daquela música.
* **Encerramento Elegante:** Ao fim da playlist, um Modal customizado aparece e um som de encerramento (`end.mp3`) é tocado via instância de áudio isolada.

## 🛠️ Tecnologias Utilizadas

* **Frontend:** HTML5 (Semântico), CSS3 (Variáveis, Animations, Flexbox).
* **Lógica:** JavaScript (ES6+, Async/Await, Fetch API).
* **API Externa:** iTunes Search API (Apple).
* **Multimídia:** HTML5 Audio Element + Web Audio API (AnalyserNode).

## 📂 Estrutura do Projeto

```bash
/spotify-clone
│
├── index.html        # Estrutura principal e Modal
├── style.css         # Estilos, Layout 70/30, VU Meter
├── script.js         # Lógica Core, Player, API Fetch, Canvas
├── playlists.js      # Banco de dados das Playlists (IDs e Capas)
├── songs.js          # Mapeamento (Nome do Arquivo <-> Termo de Busca)
│
├── /mp3              # Seus arquivos de áudio (ex: 3350001.mp3)
└── /assets           # Sons de sistema (end.mp3) e imagens locais
````

## 🚀 Como Executar

Devido às políticas de segurança dos navegadores modernos (CORS) necessárias para o **Visualizador de Áudio** e a **API Fetch**, este projeto **não funciona** clicando diretamente no arquivo `.html`.

### Passo a Passo:

1.  **Clone ou Baixe** este repositório.
2.  **Adicione suas Músicas:**
      * Coloque seus arquivos `.mp3` na pasta `/mp3`.
      * Certifique-se de que os nomes dos arquivos correspondam aos IDs no arquivo `songs.js`.
3.  **Inicie um Servidor Local:**
      * **VS Code (Recomendado):** Instale a extensão *Live Server*, clique com o botão direito no `index.html` e selecione **"Open with Live Server"**.
      * Ou via Python: `python -m http.server`
      * Ou via Node: `npx serve`

## 🎵 Playlists Inclusas (Demo)

O projeto já vem configurado com 18 playlists temáticas mapeadas:

1.  **Picadilly Hits** (Clássicos)
2.  **Road Trip** (Viagem)
3.  **Whiskey** (Rock Clássico/Blues)
4.  **Sunny** (Vibe de Verão)
5.  **Femme** (Vozes Femininas)
6.  **Garagem** (Rock Nacional/Gaúcho)
7.  **Hollywood** (Temas de Filmes 80s)
8.  **Oldies** (Anos 50/60)
9.  **Ballads** (Românticas)
10. **Rails** (Folk/Pop Rock)
11. **POP Hits** (Pop Moderno)
12. **2007** (Hits daquele ano)
13. **Comerciais** (Clássicos da TV)
14. **Summertime** (Surf Music/Oldies)
15. **Sertanejo** (Modão e Universitário)
16. **Pagode 90** (Clássicos do Pagode)
17. **Churrasco** (Samba e Pagode)
18. **Saloon** (Country Classic)

## 📝 Como adicionar novas músicas

O sistema usa um mapeamento inteligente em `songs.js`.

1.  Adicione o arquivo MP3 na pasta `/mp3` (ex: `99999.mp3`).
2.  No `songs.js`, adicione o objeto:
  
    {
        file: "99999", // Nome do arquivo sem .mp3
        query: "Nome do Artista Nome da Musica", // O que buscar na Apple para a capa
        playlistId: 1 // ID da playlist onde ela vai aparecer
    }
 
3.  O Player fará o resto automaticamente (buscará capa, nome oficial e duração).

-----

Desenvolvido com 💚 e muito código.



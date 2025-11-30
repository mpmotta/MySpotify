# 🎵 Spotify Clone (Hybrid Player)

Um player de música web moderno que combina a velocidade de arquivos **MP3 locais** com a riqueza de metadados da **iTunes Search API**.

Este projeto simula a interface do Spotify (Dark Mode), oferecendo uma experiência de Single Page Application (SPA) sem o uso de frameworks, apenas HTML, CSS e JavaScript puro.

![Preview do Projeto](https://via.placeholder.com/800x400?text=Spotify+Clone+Preview)
*(Substitua este link por um print real do seu projeto depois)*

## ✨ Funcionalidades

* **🎧 Reprodução Híbrida:** Toca arquivos MP3 armazenados localmente na pasta `/mp3`, mas busca Capa, Artista e Nome da Música em tempo real na API da Apple Music.
* **🔍 Busca Global:** Pesquise qualquer música na base de dados da Apple. (Resultados da busca tocam prévias de 30s direto da API).
* **🔀 Modo Aleatório (Shuffle):** Algoritmo para embaralhar a fila de reprodução.
* **📱 Layout Responsivo:**
    * **Home:** Grid de Playlists.
    * **Playlist View:** Layout "Split View" (Lista na esquerda, Capa gigante e info na direita).
* **🎨 UI/UX:**
    * Design Dark Mode fiel ao original.
    * Animações de Fade-in e Zoom.
    * Barra de progresso e controle de volume funcionais.
    * Lazy Loading para evitar bloqueios de API.

## 🛠️ Tecnologias

* **HTML5** (Semântico)
* **CSS3** (Flexbox, Grid, Variáveis CSS, Animações)
* **JavaScript (ES6+)** (Async/Await, Fetch API, Audio API)
* **API:** iTunes Search API (Apple)

## 🚀 Como Rodar o Projeto

⚠️ **IMPORTANTE:** Devido às políticas de segurança dos navegadores (CORS), este projeto **não funciona** se você apenas clicar duas vezes no `index.html`. Você precisa de um servidor local.

### Pré-requisitos
* Um navegador moderno (Chrome, Edge, Firefox).
* Arquivos MP3 renomeados conforme os IDs configurados.

### Passo a Passo

1.  **Clone o repositório** (ou baixe os arquivos):
    ```bash
    git clone [https://github.com/SEU-USUARIO/spotify-clone.git](https://github.com/SEU-USUARIO/spotify-clone.git)
    ```

2.  **Organize os arquivos de áudio:**
    Coloque seus arquivos `.mp3` na pasta `mp3/`. O nome do arquivo deve corresponder ao ID configurado no arquivo `songs.js`.

3.  **Inicie um Servidor Local:**
    * **Opção A (VS Code - Recomendado):** Instale a extensão **Live Server**, clique com o botão direito no `index.html` e escolha "Open with Live Server".
    * **Opção B (Python):** Abra o terminal na pasta do projeto e rode `python -m http.server`.
    * **Opção C (Node):** Use `npx serve`.

## 📂 Estrutura de Dados

O projeto separa a lógica dos dados para facilitar a manutenção.

### 1. `playlists.js`
Define as categorias que aparecem na tela inicial.
```javascript
const playlistsData = [
    {
        id: 1,
        title: "Nome da Playlist",
        cover: "url_da_imagem_ou_caminho_local.jpg"
    }
];

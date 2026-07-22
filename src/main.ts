import './style.css'
import {cardById, chanceCards, communityCards, type CardDeck, type CardEffect} from './cards'
import {
  addPlayer,
  board,
  buildAsset,
  buildOption,
  buyAsset,
  closeAuction,
  createDemoGame,
  createLobby,
  declareBankruptcy,
  formatRupiah,
  JAIL_FINE,
  minimumAuctionBid,
  mortgageAsset,
  movementPath,
  ownsCompleteGroup,
  payJailFine,
  passAsset,
  placeBid,
  proposeTrade,
  redeemMortgage,
  removePlayer,
  rentForAsset,
  respondTrade,
  resolveCard,
  rollDice,
  sellBuilding,
  startGame,
  useJailCard,
  type GameIntent,
  type GameState,
} from './game'
import {connectRoom, normalizeRoomCode, roomCode, type NetworkSession, type RoomGameId, type RoomIntent} from './network'
import {faqItems, publicPages, publicPageSlugs, type PublicPageSlug} from './site-content'
import {createArrowGame, hintArrow, isArrowFree, releaseArrow, type ArrowGameState} from './arrow-game'
import {arrowGameScreen, drawArrowBoard} from './arrow-view'
import {gameById, gameCard, gameCatalog, type GameId} from './game-catalog'
import {copyIcon, escapeHtml, initial, logoMark} from './ui'
import {addSnakesPlayer, createSnakesDemo, createSnakesLobby, isSnakesState, removeSnakesPlayer, rollSnakes, setSnakesMap, snakeMapIds, startSnakes, type SnakeMapId, type SnakesIntent, type SnakesState} from './snakes-game'
import {snakesGameScreen, snakesLobbyScreen} from './snakes-view'
import {addLudoPlayer, createLudoDemo, createLudoLobby, isLudoState, ludoColors, moveLudoToken, movableLudoTokens, removeLudoPlayer, rollLudo, setLudoColor, startLudo, type LudoColor, type LudoIntent, type LudoState} from './ludo-game'
import {ludoGameScreen, ludoLobbyScreen} from './ludo-view'

const app = document.querySelector<HTMLDivElement>('#app')!
let game: GameState | null = null
let arrowGame: ArrowGameState | null = null
let snakesGame: SnakesState | null = null
let ludoGame: LudoState | null = null
let network: NetworkSession | null = null
let localPeerId = ''
let activeRoomCode = ''
let isHost = false
let isDemo = false
const requestedGameId = new URLSearchParams(location.search).get('game')
let selectedGameId: GameId = gameCatalog.some((item) => item.id === requestedGameId) ? requestedGameId as GameId : 'monopoly'
let activeGameId: RoomGameId = 'monopoly'
let view: 'home' | 'lobby' | 'game' | 'arrow-game' | 'snakes-lobby' | 'snakes-game' | 'ludo-lobby' | 'ludo-game' = 'home'
let homeNotice = ''
let toastTimer = 0
let isAnimatingPawn = false
let lastAnimatedRollSequence = -1
let lastAnimatedSnakesMoveSequence = -1
let lastAnimatedLudoMoveSequence = -1
let auctionClock = 0
let joinTimer = 0

render()
if (['localhost', '127.0.0.1'].includes(location.hostname) && new URLSearchParams(location.search).has('demo')) openDemo()
window.addEventListener('hashchange', () => {
  if (!game && !arrowGame && !snakesGame && !ludoGame && view === 'home') render()
})

function render() {
  if (view === 'home') {
    const publicPage = publicPageFromHash()
    if (publicPage) renderPublicPage(publicPage)
    else renderHome()
  }
  else if (view === 'lobby') renderLobby()
  else if (view === 'game') renderGame()
  else if (view === 'arrow-game') renderArrowGame()
  else if (view === 'snakes-lobby') renderSnakesLobby()
  else if (view === 'snakes-game') renderSnakesGame()
  else if (view === 'ludo-lobby') renderLudoLobby()
  else renderLudoGame()
}

function renderHome() {
  lastAnimatedRollSequence = -1
  updateDocumentMeta()
  const selectedGame = gameById(selectedGameId)
  const isSolo = selectedGame.mode === 'solo'
  app.innerHTML = `
    ${publicHeader()}

    <main id="main-content" class="home-layout">
      <section class="hero-panel" aria-labelledby="hero-title">
        <p class="eyebrow">MINI GAME BROWSER</p>
        <h1 id="hero-title">Main bareng.<br><span>Tanpa ribet.</span></h1>
        <p class="hero-copy">Pilih permainan solo atau buat room bersama teman, langsung dari browser tanpa akun dan penyimpanan permanen.</p>
        <div class="feature-row" aria-label="Fitur utama">
          <span>Solo dan multipemain</span>
          <span>Langsung di browser</span>
          <span>Data sementara</span>
        </div>
        <div class="game-fan" aria-label="Koleksi Mini Games Coop">
          ${gameCatalog.map((item, index) => gameCard(item, index, item.id === selectedGameId)).join('')}
        </div>
      </section>

      <section class="join-panel" id="selected-game" aria-labelledby="join-title">
        <div>
          <p class="step-label">Game terpilih / ${selectedGame.name}</p>
          <h2 id="join-title">${isSolo ? 'Mulai puzzle' : 'Masuk ke meja'}</h2>
          <p class="muted">${selectedGame.description}</p>
        </div>

        ${homeNotice ? `<p class="notice" role="alert">${escapeHtml(homeNotice)}</p>` : ''}

        ${isSolo ? `
          <div class="solo-start">
            <button class="button button-primary" type="button" id="start-solo">Mulai Arrow Puzzle</button>
            <p>Level dimulai dari awal setiap kali halaman dimuat ulang.</p>
          </div>
        ` : `<form id="room-form" novalidate>
          <button class="button button-primary" type="button" id="create-room">Buat room ${selectedGame.name}</button>

          <div class="divider"><span>atau gabung teman</span></div>

          <div class="field">
            <label for="room-code">Kode room</label>
            <input id="room-code" name="room" class="code-input" maxlength="16" autocomplete="off" placeholder="ABCD2345" spellcheck="false" />
          </div>

          <button class="button button-secondary" type="submit" id="join-room">Gabung room</button>
          <button class="text-button" type="button" id="open-demo">Coba demo ${selectedGame.name}</button>
          <p id="form-error" class="form-error" role="alert"></p>
        </form>`}

        <ol class="steps" aria-label="Cara bermain">
          ${isSolo ? `
            <li><span>1</span><p><strong>Baca arah</strong><small>Cari jalur yang tidak terhalang.</small></p></li>
            <li><span>2</span><p><strong>Lepaskan panah</strong><small>Ketuk panah yang dapat keluar.</small></p></li>
            <li><span>3</span><p><strong>Bersihkan papan</strong><small>Simpan tiga nyawa sampai akhir.</small></p></li>
          ` : `
            <li><span>1</span><p><strong>Buat kode</strong><small>Host membuat meja permainan.</small></p></li>
            <li><span>2</span><p><strong>Undang teman</strong><small>Bagikan satu kode room.</small></p></li>
            <li><span>3</span><p><strong>Main langsung</strong><small>Data bergerak antar-browser.</small></p></li>
          `}
        </ol>
      </section>
    </main>

    ${homeSupport()}
    ${publicFooter()}

    ${isSolo ? '' : `<dialog class="asset-dialog name-dialog" id="name-dialog" aria-labelledby="name-dialog-title">
      <form id="name-form" novalidate>
        <p class="step-label" id="name-dialog-mode">Buat room baru</p>
        <h2 id="name-dialog-title">Nama pemain</h2>
        <p class="muted">Nama ini hanya tampil selama permainan.</p>
        <div class="field">
          <label for="player-name">Nama kamu</label>
          <input id="player-name" name="name" maxlength="20" autocomplete="nickname" placeholder="Contoh: Raka" required />
          <p class="field-hint">Maksimal 20 karakter.</p>
          <p id="name-error" class="form-error" role="alert"></p>
        </div>
        <div class="name-dialog-actions">
          <button class="button button-secondary" type="button" id="cancel-name">Batal</button>
          <button class="button button-primary" type="submit" id="confirm-name">Buat room</button>
        </div>
      </form>
    </dialog>`}
  `

  document.querySelectorAll<HTMLButtonElement>('[data-select-game]').forEach((button) => button.addEventListener('click', () => {
    selectedGameId = button.dataset.selectGame as GameId
    renderHome()
    document.querySelector<HTMLElement>(gameById(selectedGameId).mode === 'solo' ? '#start-solo' : '#create-room')?.focus({preventScroll: true})
  }))

  if (isSolo) {
    document.querySelector('#start-solo')?.addEventListener('click', startArrowGame)
    return
  }

  let pendingHost = true
  const nameDialog = document.querySelector<HTMLDialogElement>('#name-dialog')!
  const nameInput = document.querySelector<HTMLInputElement>('#player-name')!
  const codeInput = document.querySelector<HTMLInputElement>('#room-code')!
  const formError = document.querySelector<HTMLParagraphElement>('#form-error')!
  const nameError = document.querySelector<HTMLParagraphElement>('#name-error')!
  const openNameDialog = (host: boolean) => {
    const code = normalizeRoomCode(codeInput.value)
    if (!host && code.length < 8) {
      formError.textContent = 'Kode room minimal 8 karakter.'
      codeInput.focus()
      return
    }
    pendingHost = host
    formError.textContent = ''
    nameError.textContent = ''
    document.querySelector('#name-dialog-mode')!.textContent = host ? `Buat room ${selectedGame.name}` : `Gabung ${selectedGame.name}`
    document.querySelector('#confirm-name')!.textContent = host ? 'Buat room' : 'Gabung room'
    nameDialog.showModal()
    nameInput.focus()
  }
  document.querySelector<HTMLFormElement>('#room-form')!.addEventListener('submit', (event) => {
    event.preventDefault()
    openNameDialog(false)
  })
  codeInput.addEventListener('input', () => (codeInput.value = normalizeRoomCode(codeInput.value)))
  document.querySelector('#create-room')!.addEventListener('click', () => openNameDialog(true))
  document.querySelector('#cancel-name')!.addEventListener('click', () => nameDialog.close())
  document.querySelector<HTMLFormElement>('#name-form')!.addEventListener('submit', (event) => {
    event.preventDefault()
    const name = nameInput.value.trim()
    if (!name || name.length > 20) {
      nameError.textContent = 'Masukkan nama 1-20 karakter.'
      nameInput.focus()
      return
    }
    nameDialog.close()
    startOnline(pendingHost, name, codeInput.value)
  })
  document.querySelector('#open-demo')!.addEventListener('click', openDemo)
}

function startArrowGame() {
  arrowGame = createArrowGame()
  game = null
  snakesGame = null
  ludoGame = null
  network = null
  homeNotice = ''
  view = 'arrow-game'
  render()
  window.scrollTo({top: 0, behavior: 'auto'})
}

function renderArrowGame() {
  if (!arrowGame) return startArrowGame()
  updateDocumentMeta('Arrow Puzzle - Mini Games Coop', 'Game puzzle solo sementara yang dimainkan langsung dari browser.')
  app.innerHTML = arrowGameScreen(arrowGame)
  drawArrowBoard(arrowGame)
  bindLeaveButtons()

  document.querySelectorAll<HTMLButtonElement>('[data-arrow-id]').forEach((button) => button.addEventListener('click', () => {
    const id = button.dataset.arrowId!
    if (!arrowGame) return
    if (!isArrowFree(arrowGame, id)) {
      arrowGame = releaseArrow(arrowGame, id)
      renderArrowGame()
      return
    }
    button.classList.add('is-releasing')
    document.querySelectorAll<HTMLButtonElement>('[data-arrow-id]').forEach((arrowButton) => (arrowButton.disabled = true))
    window.setTimeout(() => {
      if (!arrowGame) return
      arrowGame = releaseArrow(arrowGame, id)
      renderArrowGame()
    }, reducedMotion() ? 0 : 220)
  }))
  document.querySelector('#hint-arrow')?.addEventListener('click', () => {
    if (!arrowGame) return
    arrowGame = hintArrow(arrowGame)
    renderArrowGame()
  })
  document.querySelectorAll('[data-restart-arrow]').forEach((button) => button.addEventListener('click', () => {
    if (!arrowGame) return
    arrowGame = createArrowGame(arrowGame.level)
    renderArrowGame()
  }))
  document.querySelector('#next-arrow-level')?.addEventListener('click', () => {
    if (!arrowGame) return
    arrowGame = createArrowGame(arrowGame.level + 1)
    renderArrowGame()
  })
}

function publicPageFromHash(): PublicPageSlug | null {
  const slug = location.hash.slice(1) as PublicPageSlug
  return publicPageSlugs.includes(slug) ? slug : null
}

function publicHeader(active?: PublicPageSlug) {
  const links: Array<[PublicPageSlug, string]> = [
    ['tentang', 'Game'],
    ['cara-bermain', 'Cara bermain'],
    ['faq', 'FAQ'],
  ]
  return `<header class="site-header public-header">
    <a class="brand" href="#" aria-label="Mini Games Coop, halaman utama">
      ${logoMark()}
      <span>Mini Games Coop</span>
    </a>
    <nav class="public-nav" aria-label="Navigasi informasi">
      ${links.map(([slug, label]) => `<a href="#${slug}" ${active === slug ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
    </nav>
    <span class="status-chip"><span class="status-dot"></span> Data sementara</span>
  </header>`
}

function homeSupport() {
  return `<div class="public-shell home-support">
    <aside class="ad-slot" data-ad-placement="home-content" aria-label="Iklan"></aside>

    <section class="support-intro" aria-labelledby="support-title">
      <div>
        <p class="step-label">Informasi situs</p>
        <h2 id="support-title">Main dengan lebih yakin</h2>
        <p>Pelajari cara kerja room, data sesi, aturan dasar, dan kanal bantuan sebelum mengundang teman.</p>
      </div>
      <div class="support-links">
        <a href="#cara-bermain"><strong>Cara bermain</strong><span>Alur room dan aturan inti</span></a>
        <a href="#tentang"><strong>Koleksi game</strong><span>Game yang tersedia dan prinsip produk</span></a>
        <a href="#privasi"><strong>Privasi</strong><span>Data, WebRTC, cookie, dan iklan</span></a>
        <a href="#kontak"><strong>Kontak</strong><span>Laporan bug dan permintaan privasi</span></a>
      </div>
    </section>

    <section class="faq-preview" aria-labelledby="faq-preview-title">
      <div class="section-copy">
        <h2 id="faq-preview-title">Pertanyaan umum</h2>
        <p>Jawaban cepat sebelum room dimulai.</p>
      </div>
      <div class="faq-list">
        ${faqItems.slice(0, 4).map(faqItem).join('')}
      </div>
      <a class="inline-link" href="#faq">Lihat semua FAQ</a>
    </section>
  </div>`
}

function renderPublicPage(slug: PublicPageSlug) {
  const page = publicPages[slug]
  updateDocumentMeta(page.title, page.description)
  app.innerHTML = `
    ${publicHeader(slug)}
    <main id="main-content" class="public-page public-shell">
      <a class="back-link" href="#">Kembali ke permainan</a>
      <header class="public-page-intro">
        <p class="step-label">Mini Games Coop</p>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.description)}</p>
      </header>

      <aside class="ad-slot" data-ad-placement="information-content" aria-label="Iklan"></aside>

      ${slug === 'faq'
        ? `<section class="public-content-section" aria-labelledby="all-faq-title">
            <h2 id="all-faq-title">Jawaban yang sering dicari</h2>
            <div class="faq-list">${faqItems.map(faqItem).join('')}</div>
          </section>`
        : page.sections.map(publicSection).join('')}

      ${page.action
        ? `<div class="public-action"><a class="button button-primary" href="${escapeHtml(page.action.href)}" ${page.action.external ? 'target="_blank" rel="noreferrer"' : ''}>${escapeHtml(page.action.label)}</a></div>`
        : ''}
    </main>
    ${publicFooter()}
  `
  window.scrollTo({top: 0, behavior: reducedMotion() ? 'auto' : 'smooth'})
}

function publicSection(section: (typeof publicPages)[PublicPageSlug]['sections'][number]) {
  return `<section class="public-content-section">
    <h2>${escapeHtml(section.heading)}</h2>
    ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}
    ${section.bullets ? `<ul>${section.bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>` : ''}
  </section>`
}

function faqItem(item: (typeof faqItems)[number]) {
  return `<details class="faq-item">
    <summary>${escapeHtml(item.question)}</summary>
    <p>${escapeHtml(item.answer)}</p>
  </details>`
}

function publicFooter() {
  return `<footer class="site-footer">
    <div>
      <a class="brand" href="#">${logoMark()}<span>Mini Games Coop</span></a>
      <p>Koleksi mini game solo dan P2P yang dimainkan langsung dari browser.</p>
    </div>
    <nav aria-label="Navigasi footer">
      <a href="#tentang">Tentang</a>
      <a href="#cara-bermain">Cara bermain</a>
      <a href="#faq">FAQ</a>
      <a href="#kontak">Kontak</a>
      <a href="#privasi">Privasi</a>
      <a href="#ketentuan">Ketentuan</a>
    </nav>
    <p class="footer-note">© ${new Date().getFullYear()} Mini Games Coop. Dibuat untuk hiburan bersama.</p>
  </footer>`
}

function updateDocumentMeta(title = 'Mini Games Coop - Main Langsung dari Browser', description = 'Koleksi mini game solo dan P2P sementara tanpa akun dan database.') {
  document.title = title
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', description)
}

function renderLobby() {
  const players = game?.players ?? []
  const ready = isHost && players.length >= 2
  app.innerHTML = `
    <header class="site-header compact-header">
      <a class="brand" href="#" data-leave>${logoMark()}<span>Mini Games Coop</span></a>
      <button class="button button-quiet button-small" type="button" data-leave>Keluar</button>
    </header>
    <main id="main-content" class="lobby-shell">
      <section class="lobby-card">
        <p class="eyebrow">ROOM PRIVATE</p>
        <h1>${game ? 'Meja hampir siap' : 'Mencari host…'}</h1>
        <p class="muted">Bagikan kode ini hanya kepada pemain yang ingin kamu undang.</p>

        <div class="room-code-card">
          <div><span>Kode room</span><strong>${escapeHtml(activeRoomCode)}</strong></div>
          <button class="icon-button" type="button" id="copy-code" aria-label="Salin kode room">${copyIcon()}</button>
        </div>

        ${
          game
            ? `<div class="lobby-list" aria-label="Daftar pemain">
                ${players
                  .map(
                    (player, index) => `
                      <div class="lobby-player">
                        <span class="player-avatar pawn-${index}">${initial(player.name)}</span>
                        <div><strong>${escapeHtml(player.name)}</strong><small>${player.id === game?.hostId ? 'Host meja' : 'Siap bermain'}</small></div>
                        <span class="ready-mark">Siap</span>
                      </div>`,
                  )
                  .join('')}
              </div>`
            : `<div class="connecting-state"><span class="spinner"></span><p>Menemukan peer melalui jaringan Nostr…</p></div>`
        }

        <div class="lobby-actions">
          ${
            isHost
              ? `<button class="button button-primary" id="start-game" type="button" ${ready ? '' : 'disabled'}>Mulai permainan</button>
                 <p class="field-hint">${ready ? `${players.length} pemain siap.` : 'Minimal dua pemain untuk mulai.'}</p>`
              : `<p class="waiting-note"><span class="status-dot"></span> Menunggu host memulai permainan…</p>`
          }
        </div>
      </section>
    </main>
  `

  bindLeaveButtons()
  document.querySelector('#copy-code')?.addEventListener('click', copyRoomCode)
  document.querySelector('#start-game')?.addEventListener('click', () => applyIntent({type: 'START_GAME'}, localPeerId))
}

function renderSnakesLobby() {
  app.innerHTML = snakesLobbyScreen(snakesGame, activeRoomCode, isHost, localPeerId)
  bindLeaveButtons()
  document.querySelector('#copy-code')?.addEventListener('click', copyRoomCode)
  document.querySelectorAll<HTMLButtonElement>('[data-snake-map]').forEach((button) => button.addEventListener('click', () => {
    const mapId = button.dataset.snakeMap as SnakeMapId
    if (snakeMapIds.includes(mapId)) requestSnakesIntent({type: 'SNAKES_SET_MAP', mapId})
  }))
  document.querySelector('#start-snakes')?.addEventListener('click', () => requestSnakesIntent({type: 'SNAKES_START'}))
}

function renderSnakesGame() {
  if (!snakesGame) {
    view = 'snakes-lobby'
    return renderSnakesLobby()
  }
  const canRoll = snakesGame.phase === 'playing' && (isDemo || snakesGame.currentPlayerId === localPeerId)
  const moveSequence = snakesGame.lastMove?.sequence ?? -1
  const animateMove = moveSequence > lastAnimatedSnakesMoveSequence
  app.innerHTML = snakesGameScreen(snakesGame, activeRoomCode || 'DEMO', canRoll, isDemo, animateMove)
  lastAnimatedSnakesMoveSequence = Math.max(lastAnimatedSnakesMoveSequence, moveSequence)
  bindLeaveButtons()
  document.querySelector<HTMLButtonElement>('#roll-snakes')?.addEventListener('click', (event) => {
    const button = event.currentTarget as HTMLButtonElement
    button.disabled = true
    button.textContent = 'Mengirim lemparan...'
    requestSnakesIntent({type: 'SNAKES_ROLL'}, snakesGame?.currentPlayerId ?? localPeerId)
  })
}

function renderLudoLobby() {
  app.innerHTML = ludoLobbyScreen(ludoGame, activeRoomCode, isHost, localPeerId)
  bindLeaveButtons()
  document.querySelector('#copy-code')?.addEventListener('click', copyRoomCode)
  document.querySelectorAll<HTMLButtonElement>('[data-ludo-color]').forEach((button) => button.addEventListener('click', () => {
    const color = button.dataset.ludoColor as LudoColor
    if (ludoColors.includes(color)) requestLudoIntent({type: 'LUDO_SET_COLOR', color})
  }))
  document.querySelector('#start-ludo')?.addEventListener('click', () => requestLudoIntent({type: 'LUDO_START'}))
}

function renderLudoGame() {
  if (!ludoGame) {
    view = 'ludo-lobby'
    return renderLudoLobby()
  }
  const localTurn = isDemo || ludoGame.currentPlayerId === localPeerId
  const canRoll = ludoGame.phase === 'playing' && localTurn && ludoGame.pendingRoll === null
  const canChoose = ludoGame.phase === 'playing' && localTurn && ludoGame.pendingRoll !== null
  const movable = ludoGame.currentPlayerId ? movableLudoTokens(ludoGame, ludoGame.currentPlayerId) : []
  const moveSequence = ludoGame.lastMove?.sequence ?? -1
  const animateMove = moveSequence > lastAnimatedLudoMoveSequence
  app.innerHTML = ludoGameScreen(ludoGame, activeRoomCode || 'DEMO', canRoll, canChoose, movable, isDemo, animateMove)
  lastAnimatedLudoMoveSequence = Math.max(lastAnimatedLudoMoveSequence, moveSequence)
  bindLeaveButtons()
  document.querySelector<HTMLButtonElement>('#roll-ludo')?.addEventListener('click', (event) => {
    const button = event.currentTarget as HTMLButtonElement
    button.disabled = true
    button.textContent = 'Mengirim lemparan...'
    requestLudoIntent({type: 'LUDO_ROLL'}, ludoGame?.currentPlayerId ?? localPeerId)
  })
  document.querySelectorAll<HTMLButtonElement>('[data-ludo-token]').forEach((button) => button.addEventListener('click', () => {
    requestLudoIntent({type: 'LUDO_MOVE', tokenIndex: Number(button.dataset.ludoToken)}, ludoGame?.currentPlayerId ?? localPeerId)
  }))
}

function renderGame() {
  if (!game) {
    view = 'lobby'
    renderLobby()
    return
  }

  const currentGame = game
  const currentPlayer = currentGame.players.find((player) => player.id === currentGame.currentPlayerId)
  const pendingPurchase = currentGame.pendingPurchase
  const purchaseCell = pendingPurchase ? board[pendingPurchase.position] : null
  const canHandlePurchase = Boolean(pendingPurchase && (isDemo || pendingPurchase.playerId === localPeerId))
  const buyer = pendingPurchase ? currentGame.players.find((player) => player.id === pendingPurchase.playerId) : null
  const canBuy = Boolean(canHandlePurchase && purchaseCell?.price && buyer && buyer.balance >= purchaseCell.price)
  const localTurn = isDemo || currentGame.currentPlayerId === localPeerId
  const canRoll = !isAnimatingPawn && !currentGame.pendingCard && !pendingPurchase && !currentGame.auction && !currentGame.debt && !currentGame.pendingTrade && currentGame.phase === 'playing' && localTurn
  const canTrade = canRoll && currentGame.players.filter((player) => !player.bankrupt).length > 1
  const lastRoll = currentGame.lastRoll ?? [null, null]
  const rollSequence = currentGame.lastRollSequence ?? -1
  const animateDice = rollSequence > lastAnimatedRollSequence
  const rollLabel = isAnimatingPawn ? 'Pion bergerak...' : currentGame.pendingCard ? 'Selesaikan kartu' : currentGame.auction ? 'Lelang berlangsung' : currentGame.debt ? 'Selesaikan utang' : currentGame.pendingTrade ? 'Trade berlangsung' : currentPlayer?.inJail && canRoll ? 'Coba dadu kembar' : canRoll ? 'Lempar dadu' : 'Menunggu giliran'

  app.innerHTML = `
    <header class="game-header">
      <a class="brand" href="#" data-leave>${logoMark()}<span>Mini Games Coop</span></a>
      <div class="game-meta">
        <span class="live-badge"><span class="status-dot"></span>${isDemo ? 'Mode demo' : 'Room aktif'}</span>
        <span class="room-mini">${escapeHtml(activeRoomCode || 'DEMO')}</span>
      </div>
      <button class="button button-quiet button-small" type="button" data-leave>Keluar</button>
    </header>

    <main id="main-content" class="game-layout">
      <aside class="side-column players-column" aria-label="Informasi pemain">
        <section class="panel">
          <div class="panel-heading"><p class="step-label">Pemain</p><span>${currentGame.players.length}/6</span></div>
          <div class="player-list">
            ${currentGame.players.map((player, index) => playerRow(player, index, player.id === currentGame.currentPlayerId)).join('')}
          </div>
        </section>

        <section class="panel card-panel">
          <div class="panel-heading"><p class="step-label">Kartu kota</p><span>2 tumpukan</span></div>
          <div class="dummy-cards">
            <button type="button" class="dummy-card chance-card" data-deck="chance" aria-haspopup="dialog" aria-controls="deck-dialog">
              <span class="card-symbol">?</span><strong>Kesempatan</strong><small>${currentGame.chanceDeck.length} kartu tersisa</small>
            </button>
            <button type="button" class="dummy-card community-card" data-deck="community" aria-haspopup="dialog" aria-controls="deck-dialog">
              <span class="chest-mark" aria-hidden="true"></span><strong>Dana Umum</strong><small>${currentGame.communityDeck.length} kartu tersisa</small>
            </button>
          </div>
        </section>
      </aside>

      <section class="panel mobile-turn-panel" aria-label="Kontrol giliran">
        <p class="step-label">Giliran sekarang</p>
        <div class="turn-owner">
          <span class="player-avatar pawn-${Math.max(0, currentGame.players.findIndex((player) => player.id === currentPlayer?.id))}">${initial(currentPlayer?.name ?? '-')}</span>
          <div><strong>${escapeHtml(currentPlayer?.name ?? 'Selesai')}</strong><small>${currentPlayer ? formatRupiah(currentPlayer.balance) : ''}</small></div>
        </div>
        <p class="mobile-roll-result" role="status">${lastRoll[0] === null ? 'Dadu belum dilempar' : `Dadu ${lastRoll[0]} + ${lastRoll[1]}`}</p>
        <button class="button button-primary mobile-turn-action" type="button" data-roll-dice ${canRoll ? '' : 'disabled'}>${rollLabel}</button>
        <div class="quick-actions">
          <button type="button" data-buy-asset ${canBuy ? '' : 'disabled'}>Beli aset</button>
          <button type="button" data-pass-asset ${canHandlePurchase ? '' : 'disabled'}>Lelang</button>
          <button type="button" data-mobile-trade ${canTrade ? '' : 'disabled'}>Trade</button>
        </div>
        <p class="field-hint">${pendingPurchase
          ? `${escapeHtml(buyer?.name ?? 'Pemain')} dapat membeli ${escapeHtml(purchaseCell?.name ?? 'aset')} seharga ${formatRupiah(purchaseCell?.price ?? 0)}. Lewati untuk membuka lelang.`
          : 'Geser papan untuk melihat petak. Ketuk aset milikmu untuk mengelolanya.'}</p>
        ${currentPlayer?.inJail && localTurn && !currentGame.auction && !currentGame.debt && !currentGame.pendingTrade ? jailActions(currentGame, currentPlayer.id) : ''}
      </section>

      <section class="board-wrap" aria-label="Papan permainan Kota Raya">
        <div class="board" aria-busy="${isAnimatingPawn}">
          ${board.map((cell, index) => boardCell(cell, index)).join('')}
          <div class="board-center">
            <svg class="center-map" viewBox="0 0 320 116" aria-hidden="true">
              <path d="M18 61 52 48l35 7 27-17 38 9 25-22 24 23 43-8 21 18-36 10-31-8-29 20-46-9-35 14-32-8Z"/>
              <path d="m118 88 21-8 18 9-16 9Zm92-3 31-9 24 8-19 12Z"/>
            </svg>
            <p class="eyebrow">KOTA RAYA</p>
            <h1>Bangun kotamu</h1>
            <p class="board-subtitle">NUSANTARA</p>
            <div class="center-cards" aria-hidden="true">
              <span class="center-card center-chance"><span class="center-card-face">?<small>Kesempatan</small></span></span>
              <span class="center-card center-community"><span class="center-card-face"><i class="chest-mark"></i><small>Dana Umum</small></span></span>
            </div>
            <p class="turn-copy">${currentPlayer ? `Giliran ${escapeHtml(currentPlayer.name)}` : 'Permainan selesai'}</p>
            <div class="dice-row" role="status" aria-live="polite" aria-label="Hasil dadu terakhir">
              ${dieView(lastRoll[0], 0, animateDice)}
              ${dieView(lastRoll[1], 1, animateDice)}
            </div>
            ${pendingPurchase ? `
              <div class="center-purchase-actions" aria-label="Keputusan pembelian ${escapeHtml(purchaseCell?.name ?? 'aset')}">
                <button class="button button-primary" type="button" data-buy-asset ${canBuy ? '' : 'disabled'}>Beli aset</button>
                <button class="button button-secondary" type="button" data-pass-asset ${canHandlePurchase ? '' : 'disabled'}>Lewati, lelang</button>
              </div>
            ` : `
              <button class="button button-primary roll-button" type="button" data-roll-dice ${canRoll ? '' : 'disabled'}>
                ${rollLabel}
              </button>
            `}
            ${currentPlayer?.inJail && localTurn && !currentGame.auction && !currentGame.debt && !currentGame.pendingTrade ? jailActions(currentGame, currentPlayer.id) : ''}
            <p class="prototype-note">Klik aset milikmu untuk mengelola properti</p>
          </div>
        </div>
      </section>

      <aside class="side-column action-column" aria-label="Kontrol permainan">
        <section class="panel turn-panel">
          <p class="step-label">Giliran sekarang</p>
          <div class="turn-owner">
            <span class="player-avatar pawn-${Math.max(0, currentGame.players.findIndex((player) => player.id === currentPlayer?.id))}">${initial(currentPlayer?.name ?? '-')}</span>
            <div><strong>${escapeHtml(currentPlayer?.name ?? 'Selesai')}</strong><small>${currentPlayer ? formatRupiah(currentPlayer.balance) : ''}</small></div>
          </div>
          <div class="quick-actions">
            <button type="button" data-buy-asset ${canBuy ? '' : 'disabled'}>Beli aset</button>
            <button type="button" data-pass-asset ${canHandlePurchase ? '' : 'disabled'}>Lelang</button>
            <button type="button" id="open-trade" ${canTrade ? '' : 'disabled'}>Trade</button>
          </div>
          <p class="field-hint">${pendingPurchase
            ? `${escapeHtml(buyer?.name ?? 'Pemain')} dapat membeli ${escapeHtml(purchaseCell?.name ?? 'aset')} seharga ${formatRupiah(purchaseCell?.price ?? 0)}. Lewati untuk membuka lelang.`
            : 'Klik tanah milikmu saat giliran untuk membeli bangunan.'}</p>

        </section>

        <section class="panel">
          <div class="panel-heading"><p class="step-label">Stok bangunan</p><span>Bank</span></div>
          <div class="building-preview">
            <div><span class="house-shape" aria-hidden="true"></span><strong>Rumah</strong><small>${currentGame.buildingSupply.houses} tersisa</small></div>
            <div><span class="hotel-shape" aria-hidden="true"></span><strong>Hotel</strong><small>${currentGame.buildingSupply.hotels} tersisa</small></div>
          </div>
        </section>

        <section class="panel activity-panel">
          <div class="panel-heading"><p class="step-label">Aktivitas</p><span>#${currentGame.sequence}</span></div>
          <ol>${currentGame.log.slice().reverse().map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ol>
        </section>
      </aside>
    </main>

    <dialog id="asset-dialog" class="asset-dialog">
      <div id="asset-dialog-content"></div>
      <form method="dialog"><button class="button button-secondary" value="close">Tutup</button></form>
    </dialog>
    <dialog id="deck-dialog" class="asset-dialog deck-dialog" aria-labelledby="deck-dialog-title">
      <div id="deck-dialog-content"></div>
    </dialog>
    <dialog id="trade-dialog" class="asset-dialog trade-dialog">
      <div id="trade-dialog-content">${tradeForm(currentGame)}</div>
      <form method="dialog"><button class="button button-secondary" value="close">Batal</button></form>
    </dialog>
    ${currentGame.pendingCard ? pendingCardOverlay(currentGame) : ''}
    ${currentGame.auction ? auctionOverlay(currentGame) : ''}
    ${currentGame.pendingTrade ? tradeOverlay(currentGame) : ''}
    ${currentGame.debt ? debtOverlay(currentGame) : ''}
    ${currentGame.phase === 'finished' ? resultOverlay(currentGame) : ''}
  `

  if (animateDice) lastAnimatedRollSequence = rollSequence

  bindLeaveButtons()
  document.querySelectorAll('[data-roll-dice]').forEach((button) => button.addEventListener('click', requestRoll))
  document.querySelectorAll<HTMLButtonElement>('[data-cell]').forEach((cell) =>
    cell.addEventListener('click', () => openAsset(Number(cell.dataset.cell))),
  )
  document.querySelectorAll<HTMLButtonElement>('[data-deck]').forEach((card) =>
    card.addEventListener('click', () => openDeck(card.dataset.deck as CardDeck)),
  )
  document.querySelector('#resolve-card')?.addEventListener('click', requestResolveCard)
  document.querySelectorAll('[data-buy-asset]').forEach((button) => button.addEventListener('click', requestBuyAsset))
  document.querySelectorAll('[data-pass-asset]').forEach((button) => button.addEventListener('click', requestPassAsset))
  document.querySelectorAll('[data-pay-jail]').forEach((button) => button.addEventListener('click', () => sendCurrentIntent({type: 'PAY_JAIL_FINE'})))
  document.querySelectorAll<HTMLButtonElement>('[data-jail-card]').forEach((button) => button.addEventListener('click', () => sendCurrentIntent({type: 'USE_JAIL_CARD', deck: button.dataset.jailCard as 'chance' | 'community'})))
  document.querySelector('#open-trade')?.addEventListener('click', () => document.querySelector<HTMLDialogElement>('#trade-dialog')?.showModal())
  document.querySelector('[data-mobile-trade]')?.addEventListener('click', () => document.querySelector<HTMLDialogElement>('#trade-dialog')?.showModal())
  document.querySelector('#send-trade')?.addEventListener('click', requestTrade)
  document.querySelector('#accept-trade')?.addEventListener('click', () => sendCurrentIntent({type: 'RESPOND_TRADE', accept: true}, currentGame.pendingTrade?.toId))
  document.querySelector('#reject-trade')?.addEventListener('click', () => sendCurrentIntent({type: 'RESPOND_TRADE', accept: false}, currentGame.pendingTrade?.toId))
  document.querySelector('#place-bid')?.addEventListener('click', requestBid)
  document.querySelector('#declare-bankruptcy')?.addEventListener('click', () => sendCurrentIntent({type: 'DECLARE_BANKRUPTCY'}, currentGame.debt?.playerId))
  startAuctionClock()
  centerActiveCellOnMobile(currentGame)
  const resolveButton = document.querySelector<HTMLButtonElement>('#resolve-card')
  if (resolveButton?.disabled === false && !isAnimatingPawn) resolveButton.focus()
}

function centerActiveCellOnMobile(state: GameState) {
  if (!window.matchMedia('(max-width: 560px)').matches) return
  const position = state.players.find((player) => player.id === state.currentPlayerId)?.position
  const wrap = document.querySelector<HTMLElement>('.board-wrap')
  const cell = position === undefined ? null : document.querySelector<HTMLElement>(`[data-cell="${position}"]`)
  if (!wrap || !cell) return
  requestAnimationFrame(() => {
    wrap.scrollLeft = cell.offsetLeft - (wrap.clientWidth - cell.clientWidth) / 2
  })
}

function startOnline(host: boolean, rawName: string, rawCode: string) {
  if (selectedGameId === 'arrow-puzzle') return startArrowGame()
  const name = rawName.trim()
  const code = host ? roomCode() : normalizeRoomCode(rawCode)
  const error = document.querySelector<HTMLParagraphElement>('#form-error')

  if (!name || name.length > 20) {
    if (error) error.textContent = 'Masukkan nama 1-20 karakter.'
    document.querySelector<HTMLInputElement>('#player-name')?.focus()
    return
  }
  if (!host && code.length < 8) {
    if (error) error.textContent = 'Kode room minimal 8 karakter.'
    document.querySelector<HTMLInputElement>('#room-code')?.focus()
    return
  }

  activeRoomCode = code
  activeGameId = selectedGameId
  isHost = host
  isDemo = false
  homeNotice = ''
  network = connectRoom(code, name, activeGameId, {
    onHello: (peerName, peerId) => {
      if (!isHost) return
      if (activeGameId === 'ludo' && ludoGame) {
        const next = addLudoPlayer(ludoGame, peerId, peerName)
        if (next === ludoGame) return
        ludoGame = next
        publishState()
        render()
        return
      }
      if (activeGameId === 'snakes-ladders' && snakesGame) {
        const next = addSnakesPlayer(snakesGame, peerId, peerName)
        if (next === snakesGame) return
        snakesGame = next
        publishState()
        render()
        return
      }
      if (game) {
        const next = addPlayer(game, peerId, peerName)
        if (next !== game) {
          game = next
          publishState()
          render()
        }
      }
    },
    onIntent: (intent, peerId) => {
      if (!isHost) return
      if (isSnakesIntent(intent)) applySnakesIntent(intent, peerId)
      else if (isLudoIntent(intent)) applyLudoIntent(intent, peerId)
      else applyIntent(intent, peerId)
    },
    onSnapshot: (snapshot, peerId) => {
      if (isHost || snapshot.hostId !== peerId) return
      window.clearTimeout(joinTimer)
      if (isLudoState(snapshot)) {
        if (ludoGame && snapshot.sequence < ludoGame.sequence) return
        ludoGame = snapshot
        snakesGame = null
        game = null
        view = snapshot.phase === 'lobby' ? 'ludo-lobby' : 'ludo-game'
        render()
        return
      }
      if (isSnakesState(snapshot)) {
        if (snakesGame && snapshot.sequence < snakesGame.sequence) return
        snakesGame = snapshot
        game = null
        view = snapshot.phase === 'lobby' ? 'snakes-lobby' : 'snakes-game'
        render()
        return
      }
      if (game && snapshot.sequence < game.sequence) return
      const move = game ? pawnMoveBetween(game, snapshot) : null
      const origin = move ? pawnScreenPoint(move.playerIndex) : null
      isAnimatingPawn = Boolean(move) && !reducedMotion()
      game = snapshot
      view = snapshot.phase === 'lobby' ? 'lobby' : 'game'
      render()
      if (move) void animatePawnMove(move, origin)
    },
    onPeerJoin: (_peerId, reconnected) => {
      if (isHost) publishState()
      showToast(reconnected ? 'Peer tersambung kembali.' : 'Peer tersambung.')
    },
    onPeerDisconnect: () => showToast('Koneksi peer terputus. Mencoba sambung ulang…'),
    onPeerLeave: (peerId) => {
      const hostId = ludoGame?.hostId ?? snakesGame?.hostId ?? game?.hostId
      if (!hostId) return
      if (!isHost && peerId === hostId) {
        void leaveToHome('Host meninggalkan permainan.')
        return
      }
      if (isHost && activeGameId === 'ludo' && ludoGame) {
        ludoGame = removeLudoPlayer(ludoGame, peerId)
        publishState()
        render()
      } else if (isHost && activeGameId === 'snakes-ladders' && snakesGame) {
        snakesGame = removeSnakesPlayer(snakesGame, peerId)
        publishState()
        render()
      } else if (isHost && game) {
        game = removePlayer(game, peerId)
        publishState()
        render()
      }
    },
    onError: (message) => showToast(message),
  })
  localPeerId = network.selfId
  game = activeGameId === 'monopoly' && host ? createLobby(localPeerId, name) : null
  snakesGame = activeGameId === 'snakes-ladders' && host ? createSnakesLobby(localPeerId, name) : null
  ludoGame = activeGameId === 'ludo' && host ? createLudoLobby(localPeerId, name) : null
  window.clearTimeout(joinTimer)
  if (!host) joinTimer = window.setTimeout(() => {
    if (!game && !snakesGame && !ludoGame && !isHost) void leaveToHome('Room tidak ditemukan atau koneksi P2P melewati batas waktu.')
  }, 15_000)
  view = activeGameId === 'snakes-ladders' ? 'snakes-lobby' : activeGameId === 'ludo' ? 'ludo-lobby' : 'lobby'
  render()
  window.scrollTo({top: 0, behavior: 'auto'})
}

function openDemo() {
  if (selectedGameId === 'arrow-puzzle') return startArrowGame()
  activeGameId = selectedGameId
  if (activeGameId === 'ludo') {
    ludoGame = createLudoDemo()
    snakesGame = null
    game = null
    localPeerId = 'demo-0'
    activeRoomCode = 'DEMO'
    isHost = true
    isDemo = true
    view = 'ludo-game'
    render()
    window.scrollTo({top: 0, behavior: 'auto'})
    return
  }
  if (activeGameId === 'snakes-ladders') {
    snakesGame = createSnakesDemo()
    ludoGame = null
    game = null
    localPeerId = 'demo-0'
    activeRoomCode = 'DEMO'
    isHost = true
    isDemo = true
    view = 'snakes-game'
    render()
    window.scrollTo({top: 0, behavior: 'auto'})
    return
  }
  game = createDemoGame()
  snakesGame = null
  ludoGame = null
  localPeerId = 'demo-0'
  activeRoomCode = 'DEMO'
  isHost = true
  isDemo = true
  view = 'game'
  render()
  window.scrollTo({top: 0, behavior: 'auto'})
}

function isSnakesIntent(intent: RoomIntent): intent is SnakesIntent {
  return intent.type.startsWith('SNAKES_')
}

function isLudoIntent(intent: RoomIntent): intent is LudoIntent {
  return intent.type.startsWith('LUDO_')
}

function applySnakesIntent(intent: SnakesIntent, requesterId: string) {
  if (!snakesGame) return
  const before = snakesGame
  if (intent.type === 'SNAKES_SET_MAP') snakesGame = setSnakesMap(snakesGame, requesterId, intent.mapId)
  else if (intent.type === 'SNAKES_START') snakesGame = startSnakes(snakesGame, requesterId)
  else snakesGame = rollSnakes(snakesGame, requesterId)
  if (snakesGame === before) return
  view = snakesGame.phase === 'lobby' ? 'snakes-lobby' : 'snakes-game'
  publishState()
  render()
}

function requestSnakesIntent(intent: SnakesIntent, demoRequesterId = localPeerId) {
  if (!snakesGame) return
  if (isDemo || isHost) applySnakesIntent(intent, demoRequesterId)
  else void network?.sendIntent(intent).catch(() => showToast('Aksi gagal dikirim. Coba lagi.'))
}

function applyLudoIntent(intent: LudoIntent, requesterId: string) {
  if (!ludoGame) return
  const before = ludoGame
  if (intent.type === 'LUDO_SET_COLOR') ludoGame = setLudoColor(ludoGame, requesterId, intent.color)
  else if (intent.type === 'LUDO_START') ludoGame = startLudo(ludoGame, requesterId)
  else if (intent.type === 'LUDO_ROLL') ludoGame = rollLudo(ludoGame, requesterId)
  else ludoGame = moveLudoToken(ludoGame, requesterId, intent.tokenIndex)
  if (ludoGame === before) return
  view = ludoGame.phase === 'lobby' ? 'ludo-lobby' : 'ludo-game'
  publishState()
  render()
}

function requestLudoIntent(intent: LudoIntent, demoRequesterId = localPeerId) {
  if (!ludoGame) return
  if (isDemo || isHost) applyLudoIntent(intent, demoRequesterId)
  else void network?.sendIntent(intent).catch(() => showToast('Aksi gagal dikirim. Coba lagi.'))
}

function applyIntent(intent: GameIntent, requesterId: string) {
  if (!game) return
  const before = game
  let next: GameState
  switch (intent.type) {
    case 'START_GAME': next = startGame(game, requesterId); break
    case 'ROLL_DICE': next = rollDice(game, requesterId); break
    case 'RESOLVE_CARD': next = resolveCard(game, requesterId); break
    case 'BUY_ASSET': next = buyAsset(game, requesterId); break
    case 'PASS_ASSET': next = passAsset(game, requesterId); break
    case 'BUILD': next = buildAsset(game, requesterId, intent.position); break
    case 'SELL_BUILDING': next = sellBuilding(game, requesterId, intent.position); break
    case 'MORTGAGE': next = mortgageAsset(game, requesterId, intent.position); break
    case 'REDEEM_MORTGAGE': next = redeemMortgage(game, requesterId, intent.position); break
    case 'PLACE_BID': next = placeBid(game, requesterId, intent.amount); break
    case 'CLOSE_AUCTION': next = closeAuction(game, requesterId); break
    case 'PAY_JAIL_FINE': next = payJailFine(game, requesterId); break
    case 'USE_JAIL_CARD': next = useJailCard(game, requesterId, intent.deck); break
    case 'PROPOSE_TRADE': next = proposeTrade(game, requesterId, intent.offer); break
    case 'RESPOND_TRADE': next = respondTrade(game, requesterId, intent.accept); break
    case 'DECLARE_BANKRUPTCY': next = declareBankruptcy(game, requesterId); break
  }
  if (next === before) return
  const move = pawnMoveBetween(before, next)
  const origin = move ? pawnScreenPoint(move.playerIndex) : null
  isAnimatingPawn = Boolean(move) && !reducedMotion()
  game = next
  view = game.phase === 'lobby' ? 'lobby' : 'game'
  publishState()
  render()
  if (move) void animatePawnMove(move, origin)
}

function requestRoll() {
  if (!game?.currentPlayerId || game.pendingCard || game.pendingPurchase || isAnimatingPawn) return
  if (isDemo) {
    applyIntent({type: 'ROLL_DICE'}, game.currentPlayerId)
  } else if (isHost) {
    applyIntent({type: 'ROLL_DICE'}, localPeerId)
  } else {
    void network?.sendIntent({type: 'ROLL_DICE'}).catch(() => showToast('Aksi gagal dikirim. Coba lagi.'))
  }
}

function requestBuyAsset() {
  if (!game?.pendingPurchase || isAnimatingPawn) return
  sendEconomyIntent({type: 'BUY_ASSET'}, game.pendingPurchase.playerId)
}

function requestPassAsset() {
  if (!game?.pendingPurchase || isAnimatingPawn) return
  sendEconomyIntent({type: 'PASS_ASSET'}, game.pendingPurchase.playerId)
}

function requestBuild(position: number) {
  if (!game?.currentPlayerId || isAnimatingPawn) return
  sendEconomyIntent({type: 'BUILD', position}, game.currentPlayerId)
}

function sendEconomyIntent(intent: GameIntent, demoRequesterId: string) {
  if (isDemo) applyIntent(intent, demoRequesterId)
  else if (isHost) applyIntent(intent, localPeerId)
  else void network?.sendIntent(intent).catch(() => showToast('Aksi ekonomi gagal dikirim. Coba lagi.'))
}

function sendCurrentIntent(intent: GameIntent, demoRequesterId = game?.currentPlayerId ?? '') {
  if (!game) return
  if (isDemo) applyIntent(intent, demoRequesterId)
  else if (isHost) applyIntent(intent, localPeerId)
  else void network?.sendIntent(intent).catch(() => showToast('Aksi gagal dikirim. Coba lagi.'))
}

function requestBid() {
  const input = document.querySelector<HTMLInputElement>('#bid-amount')
  const amount = Number(input?.value)
  if (!Number.isSafeInteger(amount)) return showToast('Masukkan nominal tawaran yang valid.')
  sendCurrentIntent({type: 'PLACE_BID', amount}, isDemo ? localPeerId : undefined)
}

function requestTrade() {
  if (!game?.currentPlayerId) return
  const value = (id: string) => document.querySelector<HTMLInputElement | HTMLSelectElement>(`#${id}`)?.value ?? ''
  const optionalNumber = (id: string) => value(id) === '' ? null : Number(value(id))
  const toId = value('trade-player')
  const offer = {
    toId,
    cashFrom: Math.max(0, Number(value('trade-cash-from')) || 0),
    cashTo: Math.max(0, Number(value('trade-cash-to')) || 0),
    assetFrom: optionalNumber('trade-asset-from'),
    assetTo: optionalNumber('trade-asset-to'),
    jailCardFrom: (value('trade-card-from') || null) as 'chance' | 'community' | null,
    jailCardTo: (value('trade-card-to') || null) as 'chance' | 'community' | null,
  }
  const target = game.players.find((player) => player.id === toId)
  if (offer.assetTo !== null && game.assets.find((asset) => asset.position === offer.assetTo)?.ownerId !== toId) return showToast('Aset yang diminta harus milik pemain yang dipilih.')
  if (offer.jailCardTo && (!target || target.jailFreeCards[offer.jailCardTo] < 1)) return showToast('Pemain itu tidak memiliki kartu yang kamu minta.')
  document.querySelector<HTMLDialogElement>('#trade-dialog')?.close()
  sendCurrentIntent({type: 'PROPOSE_TRADE', offer}, game.currentPlayerId)
}

function startAuctionClock() {
  window.clearInterval(auctionClock)
  if (!game?.auction) return
  const tick = () => {
    if (!game?.auction) return window.clearInterval(auctionClock)
    const remaining = Math.max(0, game.auction.endsAt - Date.now())
    const output = document.querySelector<HTMLElement>('#auction-time')
    if (output) output.textContent = `${Math.ceil(remaining / 1000)} detik`
    if (remaining === 0 && isHost) {
      window.clearInterval(auctionClock)
      applyIntent({type: 'CLOSE_AUCTION'}, game.hostId)
    }
  }
  tick()
  auctionClock = window.setInterval(tick, 250)
}

function requestResolveCard() {
  if (!game?.pendingCard || isAnimatingPawn) return
  if (isDemo) {
    applyIntent({type: 'RESOLVE_CARD'}, game.pendingCard.playerId)
  } else if (isHost) {
    applyIntent({type: 'RESOLVE_CARD'}, localPeerId)
  } else {
    void network?.sendIntent({type: 'RESOLVE_CARD'}).catch(() => showToast('Efek kartu gagal dikirim. Coba lagi.'))
  }
}

type PawnMove = {playerIndex: number; from: number; to: number; directToJail: boolean; backward: boolean}
type ScreenPoint = {x: number; y: number}

function pawnScreenPoint(playerIndex: number): ScreenPoint | null {
  const pawn = document.querySelector<HTMLElement>(`[data-pawn-index="${playerIndex}"]`)
  if (!pawn) return null
  const rect = pawn.getBoundingClientRect()
  return {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2}
}

function pawnMoveBetween(before: GameState, after: GameState): PawnMove | null {
  const playerIndex = after.players.findIndex((player) => {
    const previous = before.players.find((item) => item.id === player.id)
    return previous && previous.position !== player.position
  })
  if (playerIndex < 0) return null

  const player = after.players[playerIndex]
  const previous = before.players.find((item) => item.id === player.id)!
  return {
    playerIndex,
    from: previous.position,
    to: player.position,
    directToJail: after.log.at(-1)?.includes('masuk Penjara') ?? false,
    backward: after.log.at(-1)?.includes('Mundur tiga petak') ?? false,
  }
}

async function animatePawnMove(move: PawnMove, origin: ScreenPoint | null) {
  if (reducedMotion()) {
    if (move.directToJail) showToast('Pion masuk Penjara.')
    isAnimatingPawn = false
    updateRollButton()
    revealPendingCard()
    return
  }

  const pawn = document.querySelector<HTMLElement>(`[data-pawn-index="${move.playerIndex}"]`)
  if (!pawn) {
    isAnimatingPawn = false
    updateRollButton()
    revealPendingCard()
    return
  }

  const positions = move.backward
    ? Array.from({length: (move.from - move.to + board.length) % board.length + 1}, (_, index) => (move.from - index + board.length) % board.length)
    : movementPath(move.from, move.to, move.directToJail)
  const distance = positions.length - 1
  const pawnRect = pawn.getBoundingClientRect()
  const target = {x: pawnRect.left + pawnRect.width / 2, y: pawnRect.top + pawnRect.height / 2}
  const targetCellRect = document.querySelector<HTMLElement>(`[data-cell="${move.to}"]`)!.getBoundingClientRect()
  const anchor = {
    x: (target.x - targetCellRect.left) / targetCellRect.width,
    y: (target.y - targetCellRect.top) / targetCellRect.height,
  }
  const points = positions.map((position, index) => {
    if (index === 0 && origin) return origin
    if (index === positions.length - 1) return target
    const rect = document.querySelector<HTMLElement>(`[data-cell="${position}"]`)!.getBoundingClientRect()
    return {x: rect.left + rect.width * anchor.x, y: rect.top + rect.height * anchor.y}
  })
  const frames: Keyframe[] = []
  const segments = Math.max(1, points.length - 1)

  points.forEach((point, index) => {
    if (index > 0) {
      const previous = points[index - 1]
      frames.push({
        offset: (index - 0.5) / segments,
        transform: `translate3d(${(previous.x + point.x) / 2 - target.x}px, ${(previous.y + point.y) / 2 - target.y}px, 34px) rotateX(-22deg) rotateY(-16deg) rotateZ(${index * (move.backward ? -18 : 18)}deg) scale(1.28)`,
        filter: 'drop-shadow(0 16px 7px rgba(0,0,0,.5)) brightness(1.12)',
      })
    }
    frames.push({
      offset: index / segments,
      transform: `translate3d(${point.x - target.x}px, ${point.y - target.y}px, 4px) rotateX(-10deg) rotateY(-16deg) rotateZ(0deg) scale(1)`,
      filter: 'drop-shadow(0 3px 2px rgba(0,0,0,.55)) brightness(1)',
    })
  })

  pawn.classList.add('is-moving')
  pawn.style.transform = String(frames[0].transform)
  pawn.style.filter = String(frames[0].filter)

  // Pion sudah berada di koordinat lamanya sebelum browser sempat menggambar state baru.
  await new Promise((resolve) => window.setTimeout(resolve, 620))
  const animation = pawn.animate(frames, {
    duration: move.directToJail ? 900 : Math.min(2_600, Math.max(700, distance * 210)),
    easing: 'cubic-bezier(.22,.74,.22,1)',
    fill: 'both',
  })

  try {
    await animation.finished
    pawn.style.removeProperty('transform')
    pawn.style.removeProperty('filter')
    animation.cancel()
    if (move.directToJail) {
      const jailCell = document.querySelector<HTMLElement>(`[data-cell="${move.to}"]`)
      showToast('Pion masuk Penjara!')
      jailCell?.classList.add('is-jail-arrival')
      await new Promise((resolve) => window.setTimeout(resolve, 780))
      jailCell?.classList.remove('is-jail-arrival')
    }
  } catch {
    // Animasi boleh dibatalkan oleh render atau navigasi berikutnya.
  } finally {
    animation.cancel()
    pawn.classList.remove('is-moving')
    pawn.style.removeProperty('transform')
    pawn.style.removeProperty('filter')
    isAnimatingPawn = false
    updateRollButton()
    revealPendingCard()
  }
}

function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function updateRollButton() {
  const buttons = document.querySelectorAll<HTMLButtonElement>('[data-roll-dice]')
  if (!buttons.length || !game) return
  const currentGame = game
  const canRoll = !isAnimatingPawn && !currentGame.pendingCard && !currentGame.pendingPurchase && !currentGame.auction && !currentGame.debt && !currentGame.pendingTrade && currentGame.phase === 'playing' && (isDemo || currentGame.currentPlayerId === localPeerId)
  buttons.forEach((button) => {
    button.disabled = !canRoll
    button.textContent = isAnimatingPawn ? 'Pion bergerak...' : currentGame.pendingCard ? 'Selesaikan kartu' : currentGame.pendingPurchase ? 'Pilih beli atau lelang' : currentGame.auction ? 'Lelang berlangsung' : currentGame.debt ? 'Selesaikan utang' : currentGame.pendingTrade ? 'Trade berlangsung' : canRoll ? 'Lempar dadu' : 'Menunggu giliran'
  })
}

function dieView(value: number | null, index: number, animate: boolean) {
  if (value === null) return `<span class="die die-empty" aria-label="Dadu ${index + 1} belum dilempar">-</span>`

  const rotations: Record<number, [number, number]> = {
    1: [0, 0],
    2: [0, -90],
    3: [-90, 0],
    4: [90, 0],
    5: [0, 90],
    6: [0, 180],
  }
  const [rotateX, rotateY] = rotations[value]

  return `
    <span class="die-scene ${animate ? 'is-rolling' : ''} die-${index + 1}" aria-label="Dadu ${index + 1}: ${value}">
      <span class="die-cube" style="--die-rx:${rotateX}deg;--die-ry:${rotateY}deg" aria-hidden="true">
        ${dieFace(1, 'front')}
        ${dieFace(2, 'right')}
        ${dieFace(3, 'top')}
        ${dieFace(4, 'bottom')}
        ${dieFace(5, 'left')}
        ${dieFace(6, 'back')}
      </span>
    </span>`
}

function dieFace(value: number, side: string) {
  const pipPositions: Record<number, number[]> = {
    1: [5],
    2: [1, 9],
    3: [1, 5, 9],
    4: [1, 3, 7, 9],
    5: [1, 3, 5, 7, 9],
    6: [1, 3, 4, 6, 7, 9],
  }
  return `<span class="die-face face-${side}">${pipPositions[value].map((position) => `<i class="pip pip-${position}"></i>`).join('')}</span>`
}

function publishState() {
  if (!isHost || isDemo) return
  const state = activeGameId === 'ludo' ? ludoGame : activeGameId === 'snakes-ladders' ? snakesGame : game
  if (!state) return
  void network?.sendSnapshot(state).catch(() => showToast('Sinkronisasi tertunda.'))
}

async function leaveToHome(message = '') {
  window.clearTimeout(joinTimer)
  window.clearInterval(auctionClock)
  await network?.leave().catch(() => undefined)
  isAnimatingPawn = false
  lastAnimatedSnakesMoveSequence = -1
  lastAnimatedLudoMoveSequence = -1
  network = null
  game = null
  arrowGame = null
  snakesGame = null
  ludoGame = null
  view = 'home'
  isHost = false
  isDemo = false
  homeNotice = message
  render()
}

function bindLeaveButtons() {
  document.querySelectorAll('[data-leave]').forEach((button) =>
    button.addEventListener('click', (event) => {
      event.preventDefault()
      const message = view === 'arrow-game' ? 'Keluar dari game? Progres sesi ini akan hilang.' : 'Keluar dari room? Permainan ini tidak dapat dipulihkan.'
      if (!isDemo && !window.confirm(message)) return
      void leaveToHome()
    }),
  )
}

async function copyRoomCode() {
  try {
    await navigator.clipboard.writeText(activeRoomCode)
    showToast('Kode room disalin.')
  } catch {
    showToast(`Kode room: ${activeRoomCode}`)
  }
}

function boardCell(cell: (typeof board)[number], index: number) {
  const {row, column} = boardPosition(index)
  const players = game?.players.filter((player) => !player.bankrupt && player.position === index) ?? []
  const price = cell.price ? formatRupiah(cell.price).replace('Rp', 'Rp ') : ''
  const asset = game?.assets.find((item) => item.position === index)
  const owner = asset?.ownerId ? game?.players.find((player) => player.id === asset.ownerId) : null
  const completeGroup = Boolean(owner && cell.group && game && ownsCompleteGroup(game, owner.id, cell.group))
  const building = asset?.hotel
    ? '<span class="mini-hotel" aria-hidden="true"></span>'
    : Array.from({length: asset?.houses ?? 0}, () => '<span class="mini-house" aria-hidden="true"></span>').join('')
  const symbol = cell.type === 'chance' ? '<b class="cell-symbol">?</b>' : cell.type === 'community' ? '<b class="cell-symbol chest">▣</b>' : ''
  const side = index > 10 && index < 20 ? 'side-left' : index > 30 ? 'side-right' : index > 20 && index < 30 ? 'side-top' : 'side-bottom'
  const ownerLabel = owner ? `, milik ${owner.name}${completeGroup ? ', kompleks lengkap' : ''}` : ''
  const buildingLabel = asset?.hotel ? ', satu hotel' : asset?.houses ? `, ${asset.houses} rumah` : ''

  return `
    <button
      type="button"
      class="board-cell ${side} ${cell.type} ${cell.group ? `group-${cell.group}` : ''} ${owner ? 'is-owned' : ''} ${asset?.mortgaged ? 'is-mortgaged' : ''} ${completeGroup ? 'is-complete-group' : ''}"
      style="grid-row:${row};grid-column:${column}${owner ? `;--owner-color:${owner.color}` : ''}"
      data-cell="${index}"
      aria-label="${escapeHtml(cell.name)}${price ? `, harga ${escapeHtml(price)}` : ''}${escapeHtml(ownerLabel)}${escapeHtml(buildingLabel)}"
    >
      ${cell.group ? '<span class="property-strip"></span>' : ''}
      ${owner ? `<span class="owner-block" title="Milik ${escapeHtml(owner.name)}${completeGroup ? ' · Kompleks lengkap' : ''}" aria-hidden="true"><b>${initial(owner.name)}</b></span>` : ''}
      <span class="cell-body">
        ${symbol}
        <span class="cell-name">${escapeHtml(cell.name)}</span>
        ${price ? `<span class="cell-price">${escapeHtml(price)}</span>` : ''}
      </span>
      <span class="cell-assets">${building}</span>
      <span class="pawn-stack">${players.map((player) => {
        const playerIndex = game!.players.indexOf(player)
        return `<i class="pawn pawn-${playerIndex}" data-pawn-index="${playerIndex}" title="${escapeHtml(player.name)}"></i>`
      }).join('')}</span>
    </button>`
}

function boardPosition(index: number) {
  if (index === 0) return {row: 11, column: 11}
  if (index < 10) return {row: 11, column: 11 - index}
  if (index === 10) return {row: 11, column: 1}
  if (index < 20) return {row: 21 - index, column: 1}
  if (index === 20) return {row: 1, column: 1}
  if (index < 30) return {row: 1, column: index - 19}
  if (index === 30) return {row: 1, column: 11}
  return {row: index - 29, column: 11}
}

function playerRow(player: GameState['players'][number], index: number, active: boolean) {
  const jailCards = player.jailFreeCards.chance + player.jailFreeCards.community
  return `
    <div class="player-row ${active ? 'is-active' : ''} ${player.bankrupt ? 'is-bankrupt' : ''}">
      <span class="player-avatar pawn-${index}">${initial(player.name)}</span>
      <div><strong>${escapeHtml(player.name)}</strong><small>${formatRupiah(player.balance)}</small></div>
      ${jailCards ? `<span class="inventory-tag" title="Kartu Bebas Penjara">Bebas ${jailCards}</span>` : ''}
      ${player.inJail ? '<span class="inventory-tag jail-tag">Penjara</span>' : ''}
      ${player.bankrupt ? '<span class="inventory-tag">Bangkrut</span>' : ''}
      ${active ? '<span class="turn-tag">Giliran</span>' : ''}
    </div>`
}

function jailActions(state: GameState, playerId: string) {
  const player = state.players.find((item) => item.id === playerId)
  if (!player) return ''
  return `<div class="jail-actions" aria-label="Pilihan keluar dari Penjara">
    <p>Percobaan dadu ${player.jailAttempts}/3</p>
    <button class="button button-secondary" data-pay-jail type="button" ${player.balance >= JAIL_FINE ? '' : 'disabled'}>Bayar ${formatRupiah(JAIL_FINE)}</button>
    ${(['chance', 'community'] as const).map((deck) => player.jailFreeCards[deck] ? `<button class="button button-secondary" data-jail-card="${deck}" type="button">Pakai kartu ${deck === 'chance' ? 'Kesempatan' : 'Dana Umum'}</button>` : '').join('')}
  </div>`
}

function auctionOverlay(state: GameState) {
  const auction = state.auction!
  const bidder = auction.highestBidderId ? state.players.find((player) => player.id === auction.highestBidderId) : null
  const actor = state.players.find((player) => player.id === localPeerId)
  const minimum = minimumAuctionBid(auction)
  const canBid = Boolean((isDemo || actor) && !actor?.bankrupt)
  return `<div class="flow-overlay" role="dialog" aria-modal="true" aria-labelledby="auction-title">
    <section class="flow-card auction-card">
      <p class="eyebrow">LELANG TERBUKA</p>
      <h2 id="auction-title">${escapeHtml(board[auction.position].name)}</h2>
      <p class="flow-amount">${auction.highestBid ? formatRupiah(auction.highestBid) : 'Belum ada tawaran'}</p>
      <p class="muted">${bidder ? `Tertinggi oleh ${escapeHtml(bidder.name)}` : `Mulai dari ${formatRupiah(minimum)}`}</p>
      <strong id="auction-time" class="auction-time">15 detik</strong>
      <div class="bid-controls">
        <label for="bid-amount">Tawaranmu</label>
        <input id="bid-amount" type="number" inputmode="numeric" min="${minimum}" step="10000" value="${minimum}" ${canBid ? '' : 'disabled'}>
        <button class="button button-primary" id="place-bid" type="button" ${canBid ? '' : 'disabled'}>Pasang tawaran</button>
      </div>
    </section>
  </div>`
}

function tradeForm(state: GameState) {
  const fromId = isDemo ? state.currentPlayerId : localPeerId
  const from = state.players.find((player) => player.id === fromId)
  if (!from) return '<p>Trade belum tersedia.</p>'
  const others = state.players.filter((player) => player.id !== from.id && !player.bankrupt)
  const ownAssets = state.assets.filter((asset) => asset.ownerId === from.id)
  const assetOptions = (assets: typeof state.assets) => `<option value="">Tanpa aset</option>${assets.map((asset) => `<option value="${asset.position}">${escapeHtml(board[asset.position].name)}${asset.mortgaged ? ' (hipotek)' : ''}</option>`).join('')}`
  const cardOptions = (player: typeof from) => `<option value="">Tanpa kartu</option>${player.jailFreeCards.chance ? '<option value="chance">Bebas Penjara · Kesempatan</option>' : ''}${player.jailFreeCards.community ? '<option value="community">Bebas Penjara · Dana Umum</option>' : ''}`
  return `<p class="eyebrow">NEGOSIASI</p><h2>Buat tawaran trade</h2>
    <div class="trade-grid">
      <label>Dengan pemain<select id="trade-player">${others.map((player) => `<option value="${player.id}">${escapeHtml(player.name)}</option>`).join('')}</select></label>
      <label>Uang yang kamu beri<input id="trade-cash-from" type="number" min="0" step="10000" value="0"></label>
      <label>Aset yang kamu beri<select id="trade-asset-from">${assetOptions(ownAssets)}</select></label>
      <label>Kartu yang kamu beri<select id="trade-card-from">${cardOptions(from)}</select></label>
      <label>Uang yang kamu minta<input id="trade-cash-to" type="number" min="0" step="10000" value="0"></label>
      <label>Aset yang kamu minta<select id="trade-asset-to"><option value="">Pilih pemain dahulu</option>${state.assets.filter((asset) => others.some((player) => player.id === asset.ownerId)).map((asset) => `<option value="${asset.position}">${escapeHtml(board[asset.position].name)} · ${escapeHtml(state.players.find((player) => player.id === asset.ownerId)?.name ?? '')}</option>`).join('')}</select></label>
      <label>Kartu yang kamu minta<select id="trade-card-to"><option value="">Tanpa kartu</option><option value="chance">Bebas Penjara · Kesempatan</option><option value="community">Bebas Penjara · Dana Umum</option></select></label>
    </div>
    <button class="button button-primary" id="send-trade" type="button">Kirim tawaran</button>`
}

function tradeOverlay(state: GameState) {
  const trade = state.pendingTrade!
  const from = state.players.find((player) => player.id === trade.fromId)
  const to = state.players.find((player) => player.id === trade.toId)
  const canRespond = isDemo || trade.toId === localPeerId
  const detail = [
    trade.cashFrom ? `${from?.name} memberi ${formatRupiah(trade.cashFrom)}` : '',
    trade.assetFrom !== null ? `${from?.name} memberi ${board[trade.assetFrom].name}` : '',
    trade.jailCardFrom ? `${from?.name} memberi kartu Bebas Penjara` : '',
    trade.cashTo ? `${to?.name} memberi ${formatRupiah(trade.cashTo)}` : '',
    trade.assetTo !== null ? `${to?.name} memberi ${board[trade.assetTo].name}` : '',
    trade.jailCardTo ? `${to?.name} memberi kartu Bebas Penjara` : '',
  ].filter(Boolean)
  return `<div class="flow-overlay" role="dialog" aria-modal="true" aria-labelledby="trade-title"><section class="flow-card">
    <p class="eyebrow">TAWARAN TRADE</p><h2 id="trade-title">${escapeHtml(from?.name ?? '')} ↔ ${escapeHtml(to?.name ?? '')}</h2>
    <ul class="trade-summary">${detail.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    ${canRespond ? '<div class="flow-actions"><button class="button button-primary" id="accept-trade" type="button">Terima</button><button class="button button-secondary" id="reject-trade" type="button">Tolak</button></div>' : `<p class="muted">Menunggu jawaban ${escapeHtml(to?.name ?? 'pemain')}.</p>`}
  </section></div>`
}

function debtOverlay(state: GameState) {
  const debt = state.debt!
  const player = state.players.find((item) => item.id === debt.playerId)
  const canRespond = isDemo || debt.playerId === localPeerId
  const liquidatable = state.assets.some((asset) => asset.ownerId === debt.playerId && (asset.hotel || asset.houses > 0 || !asset.mortgaged))
  return `<div class="flow-overlay flow-overlay-soft" role="dialog" aria-modal="true" aria-labelledby="debt-title"><section class="flow-card debt-card">
    <p class="eyebrow">SALDO MINUS</p><h2 id="debt-title">${escapeHtml(player?.name ?? 'Pemain')} berutang ${formatRupiah(Math.abs(player?.balance ?? 0))}</h2>
    <p class="muted">Klik properti untuk menjual bangunan atau menghipotekkan aset. Permainan lanjut otomatis saat saldo kembali nol atau lebih.</p>
    <button class="button button-secondary danger-button" id="declare-bankruptcy" type="button" ${canRespond && !liquidatable ? '' : 'disabled'}>Nyatakan bangkrut</button>
    ${liquidatable ? '<p class="field-hint">Likuidasi semua aset yang masih tersedia sebelum menyerah.</p>' : ''}
  </section></div>`
}

function resultOverlay(state: GameState) {
  const winner = state.players.find((player) => player.id === state.winnerId)
  return `<div class="flow-overlay" role="dialog" aria-modal="true" aria-labelledby="winner-title"><section class="flow-card result-card">
    <p class="eyebrow">PERMAINAN SELESAI</p><h2 id="winner-title">${escapeHtml(winner?.name ?? 'Pemain')} menguasai Kota Raya!</h2>
    <p class="flow-amount">${formatRupiah(winner?.balance ?? 0)}</p>
    <button class="button button-primary" type="button" data-leave>Kembali ke beranda</button>
  </section></div>`
}

const cardEffectLabels: Record<CardEffect['kind'], string> = {
  money: 'Saldo',
  move: 'Pindah petak',
  relative: 'Langkah',
  nearest: 'Tujuan terdekat',
  each: 'Antarpemain',
  repairs: 'Properti',
  jail: 'Penjara',
  'jail-free': 'Kartu simpanan',
}

function openDeck(deck: CardDeck) {
  if (!game) return
  const isChance = deck === 'chance'
  const cards = isChance ? chanceCards : communityCards
  const remaining = isChance ? game.chanceDeck.length : game.communityDeck.length
  const deckName = isChance ? 'Kesempatan' : 'Dana Umum'
  const symbol = isChance ? '<span class="card-symbol">?</span>' : '<span class="chest-mark" aria-hidden="true"></span>'
  const description = isChance
    ? 'Kartu dinamis yang dapat memindahkan pion, memberi hadiah, atau membawa risiko.'
    : 'Kartu finansial yang umumnya langsung menambah atau mengurangi saldo pemain.'
  const dialog = document.querySelector<HTMLDialogElement>('#deck-dialog')!
  const content = document.querySelector<HTMLDivElement>('#deck-dialog-content')!

  dialog.classList.toggle('deck-dialog-chance', isChance)
  dialog.classList.toggle('deck-dialog-community', !isChance)
  content.innerHTML = `
    <div class="deck-dialog-heading">
      <div class="deck-dialog-title">
        <span class="deck-dialog-mark" aria-hidden="true">${symbol}</span>
        <div><p class="eyebrow">KATALOG KARTU</p><h2 id="deck-dialog-title">${deckName}</h2></div>
      </div>
      <form method="dialog"><button class="button button-secondary deck-dialog-close" value="close">Tutup</button></form>
    </div>
    <p class="deck-dialog-copy">${description} <strong>${remaining} dari ${cards.length}</strong> kartu sedang berada di tumpukan. Urutan undian tetap rahasia.</p>
    <ol class="deck-detail-list">
      ${cards.map((card, index) => `
        <li class="deck-detail-card">
          <span class="deck-detail-number" aria-hidden="true">${String(index + 1).padStart(2, '0')}</span>
          <div>
            <span class="deck-effect-tag">${cardEffectLabels[card.effect.kind]}</span>
            <h3>${escapeHtml(card.title)}</h3>
            <p>${escapeHtml(card.text)}</p>
          </div>
        </li>`).join('')}
    </ol>`
  dialog.showModal()
}

function pendingCardOverlay(state: GameState) {
  const pending = state.pendingCard!
  const card = cardById(pending.cardId)
  if (!card) return ''
  const player = state.players.find((item) => item.id === pending.playerId)
  const canResolve = isDemo || pending.playerId === localPeerId
  const deckName = pending.deck === 'chance' ? 'Kesempatan' : 'Dana Umum'
  const symbol = pending.deck === 'chance' ? '<span class="drawn-card-symbol">?</span>' : '<span class="chest-mark" aria-hidden="true"></span>'
  return `
    <div class="card-reveal-overlay ${isAnimatingPawn ? 'is-waiting' : ''}" role="dialog" aria-modal="true" aria-hidden="${isAnimatingPawn}" aria-labelledby="drawn-card-title">
      <article class="drawn-card drawn-card-${pending.deck}">
        <p class="drawn-card-kicker">${deckName} · ${escapeHtml(player?.name ?? 'Pemain')}</p>
        <div class="drawn-card-art" aria-hidden="true">${symbol}</div>
        <h2 id="drawn-card-title">${escapeHtml(card.title)}</h2>
        <p class="drawn-card-copy">${escapeHtml(card.text)}</p>
        <button class="button button-primary drawn-card-action" id="resolve-card" type="button" ${canResolve && !isAnimatingPawn ? '' : 'disabled'}>
          ${canResolve ? 'Jalankan efek' : `Menunggu ${escapeHtml(player?.name ?? 'pemain')}`}
        </button>
      </article>
    </div>`
}

function showPendingCard(overlay: HTMLElement) {
  const wasWaiting = overlay.classList.contains('is-waiting')
  overlay.classList.remove('is-waiting')
  overlay.setAttribute('aria-hidden', 'false')
  if (!wasWaiting) return
  const button = document.querySelector<HTMLButtonElement>('#resolve-card')
  if (button && (game?.pendingCard?.playerId === localPeerId || isDemo)) {
    button.disabled = false
    button.focus()
  }
}

function revealPendingCard() {
  const overlay = document.querySelector<HTMLElement>('.card-reveal-overlay')
  if (!overlay || !overlay.classList.contains('is-waiting')) return
  if (reducedMotion()) return showPendingCard(overlay)

  const deck = game?.pendingCard?.deck
  const source = document.querySelector<HTMLElement>(deck === 'chance' ? '.center-chance' : '.center-community')
  const target = document.querySelector<HTMLElement>('.drawn-card')
  if (!deck || !source || !target || document.querySelector('.flying-draw-card')) return showPendingCard(overlay)

  const from = source.getBoundingClientRect()
  const to = target.getBoundingClientRect()
  const flying = source.cloneNode(true) as HTMLElement
  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const scale = Math.min(3, Math.max(1.9, (to.width / from.width) * 0.7))

  flying.classList.add('flying-draw-card', `flying-draw-card-${deck}`)
  flying.setAttribute('aria-hidden', 'true')
  Object.assign(flying.style, {
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
  })
  document.body.append(flying)
  source.classList.add('is-drawing')

  const revealTimer = window.setTimeout(() => showPendingCard(overlay), 240)
  const animation = flying.animate(
    [
      {transform: 'translate3d(0, 0, 0) rotateY(0) rotateZ(0) scale(1)', opacity: 1},
      {offset: 0.38, transform: `translate3d(${dx * 0.28}px, ${dy * 0.2 - 18}px, 40px) rotateY(0) rotateZ(-6deg) scale(1.12)`, opacity: 1},
      {offset: 0.76, transform: `translate3d(${dx * 0.82}px, ${dy * 0.78}px, 70px) rotateY(96deg) rotateZ(4deg) scale(${scale * 0.82})`, opacity: 0.88},
      {transform: `translate3d(${dx}px, ${dy}px, 0) rotateY(180deg) rotateZ(0) scale(${scale})`, opacity: 0},
    ],
    {duration: 380, easing: 'cubic-bezier(.2,.82,.24,1)', fill: 'both'},
  )

  const cleanUp = () => {
    window.clearTimeout(revealTimer)
    showPendingCard(overlay)
    source.classList.remove('is-drawing')
    flying.remove()
  }
  void animation.finished.then(cleanUp, cleanUp)
}

function openAsset(index: number) {
  if (!game) return
  const cell = board[index]
  const asset = game.assets.find((item) => item.position === index)
  const owner = asset?.ownerId ? game.players.find((player) => player.id === asset.ownerId) : null
  const completeGroup = Boolean(owner && cell.group && ownsCompleteGroup(game, owner.id, cell.group))
  const rent = asset?.ownerId ? rentForAsset(game, index) : 0
  const actingPlayerId = isDemo ? game.currentPlayerId ?? '' : localPeerId
  const option = buildOption(game, actingPlayerId, index)
  const ownsAsset = owner?.id === actingPlayerId
  const isDebtOwner = game.debt?.playerId === actingPlayerId
  const isActingTurn = game.currentPlayerId === actingPlayerId && !game.pendingCard && !game.pendingPurchase && !game.auction && !game.pendingTrade
  const canBuild = ownsAsset && isActingTurn && !game.debt && option.allowed
  const canSell = Boolean(ownsAsset && isActingTurn && (asset?.hotel || asset?.houses))
  const groupHasBuildings = Boolean(cell.group && game.assets.some((item) => board[item.position].group === cell.group && (item.hotel || item.houses)))
  const canMortgage = Boolean(ownsAsset && isActingTurn && !asset?.mortgaged && !groupHasBuildings)
  const redeemPrice = Math.ceil((cell.price ?? 0) * .55)
  const canRedeem = Boolean(ownsAsset && isActingTurn && !isDebtOwner && asset?.mortgaged && (game.players.find((player) => player.id === actingPlayerId)?.balance ?? 0) >= redeemPrice)
  const buildingStatus = asset?.hotel ? '1 hotel' : asset?.houses ? `${asset.houses} rumah` : 'Belum ada bangunan'
  const dialog = document.querySelector<HTMLDialogElement>('#asset-dialog')!
  const content = document.querySelector<HTMLDivElement>('#asset-dialog-content')!
  content.innerHTML = `
    <p class="eyebrow">PETAK ${index}</p>
    <h2>${escapeHtml(cell.name)}</h2>
    <p class="muted">${cell.price ? `Harga ${escapeHtml(formatRupiah(cell.price))}.` : 'Petak khusus pada papan Kota Raya.'}</p>
    <div class="certificate-preview ${cell.group ? `group-${cell.group}` : ''} ${completeGroup ? 'is-complete-group' : ''}" ${owner ? `style="--owner-color:${owner.color}"` : ''}>
      <span class="property-strip"></span>
      <strong>Sertifikat digital</strong>
      <div class="asset-facts">
        <span>Pemilik<strong>${owner ? escapeHtml(owner.name) : 'Belum dimiliki'}</strong></span>
        <span>Bangunan<strong>${buildingStatus}</strong></span>
        ${asset?.mortgaged ? '<span>Status<strong>Digadaikan</strong></span>' : ''}
        ${rent ? `<span>Sewa saat ini<strong>${formatRupiah(rent)}</strong></span>` : ''}
      </div>
      ${completeGroup ? '<p class="complete-group-label">Kompleks lengkap · sewa dasar 2×</p>' : ''}
      ${ownsAsset && cell.type === 'land' ? `
        <button class="button button-primary asset-build-button" id="build-asset" type="button" ${canBuild ? '' : 'disabled'}>
          ${option.label} · ${formatRupiah(option.price)}
        </button>
        ${canBuild ? '' : `<p class="build-reason">${escapeHtml(isActingTurn ? option.reason : 'Bangun saat giliranmu sebelum melempar dadu.')}</p>`}
      ` : ''}
      ${ownsAsset && cell.price ? `<div class="asset-manage-actions">
        ${asset?.hotel || asset?.houses ? `<button class="button button-secondary" id="sell-building" type="button" ${canSell ? '' : 'disabled'}>Jual ${asset.hotel ? 'hotel' : 'rumah'} · ${formatRupiah(((cell.group ? ({brown: 50_000, sky: 50_000, pink: 100_000, orange: 100_000, red: 150_000, yellow: 150_000, green: 200_000, navy: 200_000} as Record<string, number>)[cell.group] : 0) ?? 0) / 2)}</button>` : ''}
        ${asset?.mortgaged
          ? `<button class="button button-secondary" id="redeem-mortgage" type="button" ${canRedeem ? '' : 'disabled'}>Tebus · ${formatRupiah(redeemPrice)}</button>`
          : `<button class="button button-secondary" id="mortgage-asset" type="button" ${canMortgage ? '' : 'disabled'}>Hipotek · ${formatRupiah((cell.price ?? 0) / 2)}</button>`}
      </div>` : ''}
    </div>`
  document.querySelector('#build-asset')?.addEventListener('click', () => {
    dialog.close()
    requestBuild(index)
  })
  document.querySelector('#sell-building')?.addEventListener('click', () => { dialog.close(); sendEconomyIntent({type: 'SELL_BUILDING', position: index}, actingPlayerId) })
  document.querySelector('#mortgage-asset')?.addEventListener('click', () => { dialog.close(); sendEconomyIntent({type: 'MORTGAGE', position: index}, actingPlayerId) })
  document.querySelector('#redeem-mortgage')?.addEventListener('click', () => { dialog.close(); sendEconomyIntent({type: 'REDEEM_MORTGAGE', position: index}, actingPlayerId) })
  dialog.showModal()
}

function showToast(message: string) {
  const toast = document.querySelector<HTMLDivElement>('#toast')!
  toast.textContent = message
  toast.classList.add('is-visible')
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3500)
}

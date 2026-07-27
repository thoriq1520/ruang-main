import {board, formatRupiah, JAIL_FINE, minimumAuctionBid, ownsCompleteGroup, type GameState} from './game'
import {escapeHtml, initial} from '../../shared/ui'

export function monopolyBoardCell(state: GameState, index: number) {
  const cell = board[index]
  const {row, column} = boardPosition(index)
  const players = state.players.filter((player) => !player.bankrupt && player.position === index)
  const price = cell.price ? formatRupiah(cell.price).replace('Rp', 'Rp ') : ''
  const asset = state.assets.find((item) => item.position === index)
  const owner = asset?.ownerId ? state.players.find((player) => player.id === asset.ownerId) : null
  const completeGroup = Boolean(owner && cell.group && ownsCompleteGroup(state, owner.id, cell.group))
  const building = asset?.hotel
    ? '<span class="mini-hotel" aria-hidden="true"></span>'
    : Array.from({length: asset?.houses ?? 0}, () => '<span class="mini-house" aria-hidden="true"></span>').join('')
  const symbol = cell.type === 'chance' ? '<b class="cell-symbol">?</b>' : cell.type === 'community' ? '<b class="cell-symbol chest">▣</b>' : ''
  const side = index > 10 && index < 20 ? 'side-left' : index > 30 ? 'side-right' : index > 20 && index < 30 ? 'side-top' : 'side-bottom'
  const ownerLabel = owner ? `, milik ${owner.name}${completeGroup ? ', kompleks lengkap' : ''}` : ''
  const buildingLabel = asset?.hotel ? ', satu hotel' : asset?.houses ? `, ${asset.houses} rumah` : ''

  return `<button type="button" class="board-cell ${side} ${cell.type} ${cell.group ? `group-${cell.group}` : ''} ${owner ? 'is-owned' : ''} ${asset?.mortgaged ? 'is-mortgaged' : ''} ${completeGroup ? 'is-complete-group' : ''}" style="grid-row:${row};grid-column:${column}${owner ? `;--owner-color:${owner.color}` : ''}" data-cell="${index}" aria-label="${escapeHtml(cell.name)}${price ? `, harga ${escapeHtml(price)}` : ''}${escapeHtml(ownerLabel)}${escapeHtml(buildingLabel)}">
    ${cell.group ? '<span class="property-strip"></span>' : ''}
    ${owner ? `<span class="owner-block" title="Milik ${escapeHtml(owner.name)}${completeGroup ? ' · Kompleks lengkap' : ''}" aria-hidden="true"><b>${initial(owner.name)}</b></span>` : ''}
    <span class="cell-body">${symbol}<span class="cell-name">${escapeHtml(cell.name)}</span>${price ? `<span class="cell-price">${escapeHtml(price)}</span>` : ''}</span>
    <span class="cell-assets">${building}</span>
    <span class="pawn-stack">${players.map((player) => {
      const playerIndex = state.players.indexOf(player)
      return `<i class="pawn pawn-${playerIndex}" data-pawn-index="${playerIndex}" title="${escapeHtml(player.name)}"></i>`
    }).join('')}</span>
  </button>`
}

export function boardPosition(index: number) {
  if (index === 0) return {row: 11, column: 11}
  if (index < 10) return {row: 11, column: 11 - index}
  if (index === 10) return {row: 11, column: 1}
  if (index < 20) return {row: 21 - index, column: 1}
  if (index === 20) return {row: 1, column: 1}
  if (index < 30) return {row: 1, column: index - 19}
  if (index === 30) return {row: 1, column: 11}
  return {row: index - 29, column: 11}
}

export function monopolyPlayerRow(player: GameState['players'][number], index: number, active: boolean) {
  const jailCards = player.jailFreeCards.chance + player.jailFreeCards.community
  return `<div class="player-row ${active ? 'is-active' : ''} ${player.bankrupt ? 'is-bankrupt' : ''}">
    <span class="player-avatar pawn-${index}">${initial(player.name)}</span>
    <div><strong>${escapeHtml(player.name)}</strong><small>${formatRupiah(player.balance)}</small></div>
    ${jailCards ? `<span class="inventory-tag" title="Kartu Bebas Penjara">Bebas ${jailCards}</span>` : ''}
    ${player.inJail ? '<span class="inventory-tag jail-tag">Penjara</span>' : ''}
    ${player.bankrupt ? '<span class="inventory-tag">Bangkrut</span>' : ''}
    ${active ? '<span class="turn-tag">Giliran</span>' : ''}
  </div>`
}

export function jailActions(state: GameState, playerId: string) {
  const player = state.players.find((item) => item.id === playerId)
  if (!player) return ''
  return `<div class="jail-actions" aria-label="Pilihan keluar dari Penjara"><p>Percobaan dadu ${player.jailAttempts}/3</p><button class="button button-secondary" data-pay-jail type="button" ${player.balance >= JAIL_FINE ? '' : 'disabled'}>Bayar ${formatRupiah(JAIL_FINE)}</button>${(['chance', 'community'] as const).map((deck) => player.jailFreeCards[deck] ? `<button class="button button-secondary" data-jail-card="${deck}" type="button">Pakai kartu ${deck === 'chance' ? 'Kesempatan' : 'Dana Umum'}</button>` : '').join('')}</div>`
}

export function auctionOverlay(state: GameState, localPeerId: string, demo: boolean) {
  const auction = state.auction!
  const bidder = auction.highestBidderId ? state.players.find((player) => player.id === auction.highestBidderId) : null
  const actor = state.players.find((player) => player.id === localPeerId)
  const minimum = minimumAuctionBid(auction)
  const canBid = Boolean((demo || actor) && !actor?.bankrupt)
  return `<div class="flow-overlay" role="dialog" aria-modal="true" aria-labelledby="auction-title"><section class="flow-card auction-card"><p class="eyebrow">LELANG TERBUKA</p><h2 id="auction-title">${escapeHtml(board[auction.position].name)}</h2><p class="flow-amount">${auction.highestBid ? formatRupiah(auction.highestBid) : 'Belum ada tawaran'}</p><p class="muted">${bidder ? `Tertinggi oleh ${escapeHtml(bidder.name)}` : `Mulai dari ${formatRupiah(minimum)}`}</p><strong id="auction-time" class="auction-time">15 detik</strong><div class="bid-controls"><label for="bid-amount">Tawaranmu</label><input id="bid-amount" type="number" inputmode="numeric" min="${minimum}" step="10000" value="${minimum}" ${canBid ? '' : 'disabled'}><button class="button button-primary" id="place-bid" type="button" ${canBid ? '' : 'disabled'}>Pasang tawaran</button></div></section></div>`
}

export function tradeForm(state: GameState, localPeerId: string, demo: boolean) {
  const fromId = demo ? state.currentPlayerId : localPeerId
  const from = state.players.find((player) => player.id === fromId)
  if (!from) return '<p>Trade belum tersedia.</p>'
  const others = state.players.filter((player) => player.id !== from.id && !player.bankrupt)
  const ownAssets = state.assets.filter((asset) => asset.ownerId === from.id)
  const assetOptions = (assets: typeof state.assets) => `<option value="">Tanpa aset</option>${assets.map((asset) => `<option value="${asset.position}">${escapeHtml(board[asset.position].name)}${asset.mortgaged ? ' (hipotek)' : ''}</option>`).join('')}`
  const cardOptions = (player: typeof from) => `<option value="">Tanpa kartu</option>${player.jailFreeCards.chance ? '<option value="chance">Bebas Penjara · Kesempatan</option>' : ''}${player.jailFreeCards.community ? '<option value="community">Bebas Penjara · Dana Umum</option>' : ''}`
  return `<p class="eyebrow">NEGOSIASI</p><h2>Buat tawaran trade</h2><div class="trade-grid"><label>Dengan pemain<select id="trade-player">${others.map((player) => `<option value="${player.id}">${escapeHtml(player.name)}</option>`).join('')}</select></label><label>Uang yang kamu beri<input id="trade-cash-from" type="number" min="0" step="10000" value="0"></label><label>Aset yang kamu beri<select id="trade-asset-from">${assetOptions(ownAssets)}</select></label><label>Kartu yang kamu beri<select id="trade-card-from">${cardOptions(from)}</select></label><label>Uang yang kamu minta<input id="trade-cash-to" type="number" min="0" step="10000" value="0"></label><label>Aset yang kamu minta<select id="trade-asset-to"><option value="">Pilih pemain dahulu</option>${state.assets.filter((asset) => others.some((player) => player.id === asset.ownerId)).map((asset) => `<option value="${asset.position}">${escapeHtml(board[asset.position].name)} · ${escapeHtml(state.players.find((player) => player.id === asset.ownerId)?.name ?? '')}</option>`).join('')}</select></label><label>Kartu yang kamu minta<select id="trade-card-to"><option value="">Tanpa kartu</option><option value="chance">Bebas Penjara · Kesempatan</option><option value="community">Bebas Penjara · Dana Umum</option></select></label></div><button class="button button-primary" id="send-trade" type="button">Kirim tawaran</button>`
}

export function tradeOverlay(state: GameState, localPeerId: string, demo: boolean) {
  const trade = state.pendingTrade!
  const from = state.players.find((player) => player.id === trade.fromId)
  const to = state.players.find((player) => player.id === trade.toId)
  const canRespond = demo || trade.toId === localPeerId
  const detail = [
    trade.cashFrom ? `${from?.name} memberi ${formatRupiah(trade.cashFrom)}` : '',
    trade.assetFrom !== null ? `${from?.name} memberi ${board[trade.assetFrom].name}` : '',
    trade.jailCardFrom ? `${from?.name} memberi kartu Bebas Penjara` : '',
    trade.cashTo ? `${to?.name} memberi ${formatRupiah(trade.cashTo)}` : '',
    trade.assetTo !== null ? `${to?.name} memberi ${board[trade.assetTo].name}` : '',
    trade.jailCardTo ? `${to?.name} memberi kartu Bebas Penjara` : '',
  ].filter(Boolean)
  return `<div class="flow-overlay" role="dialog" aria-modal="true" aria-labelledby="trade-title"><section class="flow-card"><p class="eyebrow">TAWARAN TRADE</p><h2 id="trade-title">${escapeHtml(from?.name ?? '')} ↔ ${escapeHtml(to?.name ?? '')}</h2><ul class="trade-summary">${detail.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>${canRespond ? '<div class="flow-actions"><button class="button button-primary" id="accept-trade" type="button">Terima</button><button class="button button-secondary" id="reject-trade" type="button">Tolak</button></div>' : `<p class="muted">Menunggu jawaban ${escapeHtml(to?.name ?? 'pemain')}.</p>`}</section></div>`
}

export function debtOverlay(state: GameState, localPeerId: string, demo: boolean) {
  const debt = state.debt!
  const player = state.players.find((item) => item.id === debt.playerId)
  const canRespond = demo || debt.playerId === localPeerId
  const liquidatable = state.assets.some((asset) => asset.ownerId === debt.playerId && (asset.hotel || asset.houses > 0 || !asset.mortgaged))
  return `<div class="flow-overlay flow-overlay-soft" role="dialog" aria-modal="true" aria-labelledby="debt-title"><section class="flow-card debt-card"><p class="eyebrow">SALDO MINUS</p><h2 id="debt-title">${escapeHtml(player?.name ?? 'Pemain')} berutang ${formatRupiah(Math.abs(player?.balance ?? 0))}</h2><p class="muted">Klik properti untuk menjual bangunan atau menghipotekkan aset. Permainan lanjut otomatis saat saldo kembali nol atau lebih.</p><button class="button button-secondary danger-button" id="declare-bankruptcy" type="button" ${canRespond && !liquidatable ? '' : 'disabled'}>Nyatakan bangkrut</button>${liquidatable ? '<p class="field-hint">Likuidasi semua aset yang masih tersedia sebelum menyerah.</p>' : ''}</section></div>`
}

export function resultOverlay(state: GameState) {
  const winner = state.players.find((player) => player.id === state.winnerId)
  return `<div class="flow-overlay" role="dialog" aria-modal="true" aria-labelledby="winner-title"><section class="flow-card result-card"><p class="eyebrow">PERMAINAN SELESAI</p><h2 id="winner-title">${escapeHtml(winner?.name ?? 'Pemain')} menguasai Kota Raya!</h2><p class="flow-amount">${formatRupiah(winner?.balance ?? 0)}</p><button class="button button-primary" type="button" data-leave>Kembali ke beranda</button></section></div>`
}

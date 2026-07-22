import {cardById, chanceCards, communityCards, type CardDeck} from './cards.ts'

export const START_BALANCE = 1_500_000
export const START_BONUS = 200_000
export const BOARD_SIZE = 40
export const JAIL_POSITION = 10
export const JAIL_FINE = 50_000
export const AUCTION_DURATION = 15_000
export const AUCTION_MIN_BID = 10_000

export type Player = {
  id: string
  name: string
  color: string
  balance: number
  position: number
  houses: number
  hotels: number
  jailFreeCards: Record<CardDeck, number>
  inJail: boolean
  jailAttempts: number
  bankrupt: boolean
}

export type GamePhase = 'lobby' | 'playing' | 'finished'
export type PendingCard = {deck: CardDeck; cardId: string; playerId: string; nextPlayerId: string | null}
export type AssetState = {position: number; ownerId: string | null; houses: number; hotel: boolean; mortgaged: boolean}
export type PendingPurchase = {playerId: string; position: number; nextPlayerId: string | null}
export type AuctionState = {
  position: number
  highestBid: number
  highestBidderId: string | null
  endsAt: number
  nextPlayerId: string | null
  queue: number[]
}
export type DebtState = {playerId: string; creditorId: string | null; resumePlayerId: string | null}
export type TradeOffer = {
  id: string
  fromId: string
  toId: string
  cashFrom: number
  cashTo: number
  assetFrom: number | null
  assetTo: number | null
  jailCardFrom: CardDeck | null
  jailCardTo: CardDeck | null
}

export type GameState = {
  phase: GamePhase
  sequence: number
  hostId: string
  players: Player[]
  currentPlayerId: string | null
  lastRoll: [number, number] | null
  lastRollSequence: number | null
  consecutiveDoubles: number
  winnerId: string | null
  chanceDeck: string[]
  communityDeck: string[]
  pendingCard: PendingCard | null
  pendingPurchase: PendingPurchase | null
  auction: AuctionState | null
  debt: DebtState | null
  pendingTrade: TradeOffer | null
  assets: AssetState[]
  buildingSupply: {houses: number; hotels: number}
  log: string[]
}

export type GameIntent =
  | {type: 'START_GAME'}
  | {type: 'ROLL_DICE'}
  | {type: 'RESOLVE_CARD'}
  | {type: 'BUY_ASSET'}
  | {type: 'PASS_ASSET'}
  | {type: 'BUILD'; position: number}
  | {type: 'SELL_BUILDING'; position: number}
  | {type: 'MORTGAGE'; position: number}
  | {type: 'REDEEM_MORTGAGE'; position: number}
  | {type: 'PLACE_BID'; amount: number}
  | {type: 'CLOSE_AUCTION'}
  | {type: 'PAY_JAIL_FINE'}
  | {type: 'USE_JAIL_CARD'; deck: CardDeck}
  | {type: 'PROPOSE_TRADE'; offer: Omit<TradeOffer, 'id' | 'fromId'>}
  | {type: 'RESPOND_TRADE'; accept: boolean}
  | {type: 'DECLARE_BANKRUPTCY'}

export type BoardCell = {
  name: string
  type: 'corner' | 'land' | 'chance' | 'community' | 'tax' | 'station' | 'utility'
  price?: number
  group?: string
}

const PLAYER_COLORS = ['#ffcc4d', '#7dd3fc', '#fb7185', '#c4b5fd', '#6ee7b7', '#fdba74']

export const board: BoardCell[] = [
  {name: 'START', type: 'corner'}, {name: 'Kampung Pelangi', type: 'land', price: 60_000, group: 'brown'},
  {name: 'Dana Umum', type: 'community'}, {name: 'Taman Sari', type: 'land', price: 60_000, group: 'brown'},
  {name: 'Pajak Kota', type: 'tax'}, {name: 'Stasiun Utara', type: 'station', price: 200_000},
  {name: 'Kota Lama', type: 'land', price: 100_000, group: 'sky'}, {name: 'Kesempatan', type: 'chance'},
  {name: 'Pasar Seni', type: 'land', price: 100_000, group: 'sky'}, {name: 'Bukit Indah', type: 'land', price: 120_000, group: 'sky'},
  {name: 'Penjara / Transit', type: 'corner'}, {name: 'Kebun Raya', type: 'land', price: 140_000, group: 'pink'},
  {name: 'PLN Nusantara', type: 'utility', price: 150_000}, {name: 'Danau Biru', type: 'land', price: 140_000, group: 'pink'},
  {name: 'Candi Emas', type: 'land', price: 160_000, group: 'pink'}, {name: 'Stasiun Timur', type: 'station', price: 200_000},
  {name: 'Pantai Selatan', type: 'land', price: 180_000, group: 'orange'}, {name: 'Dana Umum', type: 'community'},
  {name: 'Pulau Rempah', type: 'land', price: 180_000, group: 'orange'}, {name: 'Teluk Damai', type: 'land', price: 200_000, group: 'orange'},
  {name: 'Taman Kota', type: 'corner'}, {name: 'Hutan Pinus', type: 'land', price: 220_000, group: 'red'},
  {name: 'Kesempatan', type: 'chance'}, {name: 'Lembah Hijau', type: 'land', price: 220_000, group: 'red'},
  {name: 'Puncak Aruna', type: 'land', price: 240_000, group: 'red'}, {name: 'Stasiun Selatan', type: 'station', price: 200_000},
  {name: 'Kota Batik', type: 'land', price: 260_000, group: 'yellow'}, {name: 'Kota Hujan', type: 'land', price: 260_000, group: 'yellow'},
  {name: 'PDAM Nusantara', type: 'utility', price: 150_000}, {name: 'Kota Pahlawan', type: 'land', price: 280_000, group: 'yellow'},
  {name: 'Menuju Penjara', type: 'corner'}, {name: 'Nusa Kencana', type: 'land', price: 300_000, group: 'green'},
  {name: 'Metro Jaya', type: 'land', price: 300_000, group: 'green'}, {name: 'Dana Umum', type: 'community'},
  {name: 'Kota Seribu', type: 'land', price: 320_000, group: 'green'}, {name: 'Stasiun Barat', type: 'station', price: 200_000},
  {name: 'Kesempatan', type: 'chance'}, {name: 'Cakrawala', type: 'land', price: 350_000, group: 'navy'},
  {name: 'Pajak Mewah', type: 'tax'}, {name: 'Garuda Heights', type: 'land', price: 400_000, group: 'navy'},
]

const LAND_RENTS: Record<number, [number, number, number, number, number, number]> = {
  1: [2, 10, 30, 90, 160, 250], 3: [4, 20, 60, 180, 320, 450],
  6: [6, 30, 90, 270, 400, 550], 8: [6, 30, 90, 270, 400, 550], 9: [8, 40, 100, 300, 450, 600],
  11: [10, 50, 150, 450, 625, 750], 13: [10, 50, 150, 450, 625, 750], 14: [12, 60, 180, 500, 700, 900],
  16: [14, 70, 200, 550, 750, 950], 18: [14, 70, 200, 550, 750, 950], 19: [16, 80, 220, 600, 800, 1_000],
  21: [18, 90, 250, 700, 875, 1_050], 23: [18, 90, 250, 700, 875, 1_050], 24: [20, 100, 300, 750, 925, 1_100],
  26: [22, 110, 330, 800, 975, 1_150], 27: [22, 110, 330, 800, 975, 1_150], 29: [24, 120, 360, 850, 1_025, 1_200],
  31: [26, 130, 390, 900, 1_100, 1_275], 32: [26, 130, 390, 900, 1_100, 1_275], 34: [28, 150, 450, 1_000, 1_200, 1_400],
  37: [35, 175, 500, 1_100, 1_300, 1_500], 39: [50, 200, 600, 1_400, 1_700, 2_000],
}

const HOUSE_PRICES: Record<string, number> = {brown: 50_000, sky: 50_000, pink: 100_000, orange: 100_000, red: 150_000, yellow: 150_000, green: 200_000, navy: 200_000}

export const formatRupiah = (value: number) => new Intl.NumberFormat('id-ID', {style: 'currency', currency: 'IDR', maximumFractionDigits: 0}).format(value)

export function movementPath(from: number, to: number, direct = false) {
  if (direct) return [from, to]
  const distance = (to - from + BOARD_SIZE) % BOARD_SIZE
  return Array.from({length: distance + 1}, (_, index) => (from + index) % BOARD_SIZE)
}

export function createLobby(hostId: string, hostName: string): GameState {
  return {
    phase: 'lobby', sequence: 0, hostId, players: [createPlayer(hostId, hostName, 0)], currentPlayerId: null,
    lastRoll: null, lastRollSequence: null, consecutiveDoubles: 0, winnerId: null,
    chanceDeck: shuffled(chanceCards.map((card) => card.id)), communityDeck: shuffled(communityCards.map((card) => card.id)),
    pendingCard: null, pendingPurchase: null, auction: null, debt: null, pendingTrade: null,
    assets: board.flatMap((cell, position) => cell.price ? [{position, ownerId: null, houses: 0, hotel: false, mortgaged: false}] : []),
    buildingSupply: {houses: 32, hotels: 12}, log: [`${hostName} membuat room.`],
  }
}

export function addPlayer(state: GameState, id: string, name: string): GameState {
  if (state.phase !== 'lobby' || state.players.some((player) => player.id === id) || state.players.length >= 6) return state
  return {...state, sequence: state.sequence + 1, players: [...state.players, createPlayer(id, name, state.players.length)], log: addLog(state.log, `${name} bergabung.`)}
}

export function removePlayer(state: GameState, id: string): GameState {
  const player = state.players.find((item) => item.id === id)
  if (!player) return state
  if (state.phase === 'lobby') return {...state, sequence: state.sequence + 1, players: state.players.filter((item) => item.id !== id), log: addLog(state.log, `${player.name} meninggalkan room.`)}
  const returned = state.assets.filter((asset) => asset.ownerId === id)
  const assets = state.assets.map((asset) => asset.ownerId === id ? {...asset, ownerId: null, houses: 0, hotel: false, mortgaged: false} : asset)
  const players = syncBuildingCounts(state.players.map((item) => item.id === id ? {...item, bankrupt: true} : item), assets)
  return finishIfNeeded({
    ...state, sequence: state.sequence + 1, players, assets,
    buildingSupply: {houses: state.buildingSupply.houses + returned.reduce((sum, asset) => sum + asset.houses, 0), hotels: state.buildingSupply.hotels + returned.filter((asset) => asset.hotel).length},
    currentPlayerId: state.currentPlayerId === id ? nextPlayerId(players, players.findIndex((item) => item.id === id)) : state.currentPlayerId,
    pendingPurchase: state.pendingPurchase?.playerId === id ? null : state.pendingPurchase,
    pendingCard: state.pendingCard?.playerId === id ? null : state.pendingCard,
    pendingTrade: state.pendingTrade && (state.pendingTrade.fromId === id || state.pendingTrade.toId === id) ? null : state.pendingTrade,
    auction: state.auction?.highestBidderId === id ? {...state.auction, highestBid: 0, highestBidderId: null} : state.auction,
    debt: state.debt?.playerId === id ? null : state.debt,
    log: addLog(state.log, `${player.name} keluar dan dinyatakan bangkrut.`),
  })
}

export function startGame(state: GameState, requesterId: string): GameState {
  if (state.phase !== 'lobby' || requesterId !== state.hostId || state.players.length < 2) return state
  return {...state, phase: 'playing', sequence: state.sequence + 1, currentPlayerId: state.players[0].id, log: addLog(state.log, 'Permainan dimulai.')}
}

export function rollDice(state: GameState, requesterId: string, dice: [number, number] = [secureDie(), secureDie()]): GameState {
  if (!canAct(state, requesterId) || !validDice(dice)) return state
  const playerIndex = state.players.findIndex((player) => player.id === requesterId)
  const player = state.players[playerIndex]
  const isDouble = dice[0] === dice[1]
  if (player.inJail) return rollFromJail(state, playerIndex, dice, isDouble)

  const doubles = isDouble ? state.consecutiveDoubles + 1 : 0
  if (doubles === 3) {
    const players = state.players.map((item, index) => index === playerIndex ? jailPlayer(item) : item)
    return {...state, sequence: state.sequence + 1, players, currentPlayerId: nextPlayerId(players, playerIndex), lastRoll: dice, lastRollSequence: state.sequence + 1, consecutiveDoubles: 0, log: addLog(state.log, `${player.name} mendapat tiga dadu kembar dan masuk Penjara.`)}
  }

  const steps = dice[0] + dice[1]
  const rawPosition = player.position + steps
  const position = rawPosition % BOARD_SIZE
  const passedStart = rawPosition >= BOARD_SIZE
  const players = state.players.map((item, index) => index === playerIndex ? {...item, position, balance: item.balance + (passedStart ? START_BONUS : 0)} : item)
  const nextTurn = isDouble ? player.id : nextPlayerId(players, playerIndex)
  const nextState: GameState = {...state, sequence: state.sequence + 1, players, currentPlayerId: nextTurn, lastRoll: dice, lastRollSequence: state.sequence + 1, consecutiveDoubles: doubles, log: addLog(state.log, `${player.name} melempar ${dice[0]} + ${dice[1]} dan tiba di ${board[position].name}${passedStart ? ' (+Rp200.000)' : ''}.`)}
  return queueOrSettle(nextState, player.id, nextTurn, steps)
}

export function resolveCard(state: GameState, requesterId: string): GameState {
  const pending = state.pendingCard
  if (state.phase !== 'playing' || !pending || pending.playerId !== requesterId || state.auction || state.debt) return state
  const card = cardById(pending.cardId)
  const playerIndex = state.players.findIndex((player) => player.id === requesterId)
  if (!card || playerIndex < 0) return state
  const players = state.players.map((player) => ({...player, jailFreeCards: {...player.jailFreeCards}}))
  const player = players[playerIndex]
  const deck = pending.deck === 'chance' ? state.chanceDeck : state.communityDeck
  const returnedDeck = card.effect.kind === 'jail-free' ? deck : [...deck, card.id]
  let moved = false
  let sentToJail = false
  let rentMultiplier = 1
  let utilityRate: number | undefined
  let cardCreditorId: string | null = null

  switch (card.effect.kind) {
    case 'money': player.balance += card.effect.amount; break
    case 'move': {
      const bonus = card.effect.collectStart && (card.effect.to === 0 || card.effect.to < player.position) ? START_BONUS : 0
      player.position = card.effect.to; player.balance += bonus; moved = true; break
    }
    case 'relative': player.position = (player.position + card.effect.steps + BOARD_SIZE) % BOARD_SIZE; moved = true; break
    case 'nearest': {
      const destination = nearestPosition(player.position, card.effect.target)
      if (destination < player.position) player.balance += START_BONUS
      player.position = destination; moved = true; rentMultiplier = card.effect.rentMultiplier ?? 1; utilityRate = card.effect.utilityRate; break
    }
    case 'each': {
      const amount = card.effect.amount
      players.forEach((other, index) => { if (index !== playerIndex && !other.bankrupt) {other.balance -= amount; player.balance += amount} })
      if (amount > 0) cardCreditorId = player.id
      break
    }
    case 'repairs': player.balance -= player.houses * card.effect.house + player.hotels * card.effect.hotel; break
    case 'jail-free': player.jailFreeCards[pending.deck] += 1; break
    case 'jail': Object.assign(player, jailPlayer(player)); moved = true; sentToJail = true; break
  }

  let nextState: GameState = {
    ...state, sequence: state.sequence + 1, players,
    currentPlayerId: sentToJail ? nextPlayerId(players, playerIndex) : pending.nextPlayerId,
    consecutiveDoubles: sentToJail ? 0 : state.consecutiveDoubles,
    chanceDeck: pending.deck === 'chance' ? returnedDeck : state.chanceDeck,
    communityDeck: pending.deck === 'community' ? returnedDeck : state.communityDeck,
    pendingCard: null,
    log: addLog(state.log, sentToJail ? `${player.name} menarik ${card.title} dan masuk Penjara.` : `${player.name} menjalankan kartu ${card.title}: ${card.text}`),
  }
  if (moved && !sentToJail) nextState = queueOrSettle(nextState, player.id, pending.nextPlayerId, diceTotal(state), rentMultiplier, utilityRate)
  return openDebt(nextState, pending.nextPlayerId, cardCreditorId)
}

export function buyAsset(state: GameState, requesterId: string): GameState {
  const pending = state.pendingPurchase
  if (state.phase !== 'playing' || !pending || pending.playerId !== requesterId || state.currentPlayerId !== requesterId || state.auction || state.debt) return state
  const asset = state.assets.find((item) => item.position === pending.position)
  const cell = board[pending.position]
  const playerIndex = state.players.findIndex((player) => player.id === requesterId)
  if (!asset || asset.ownerId || !cell.price || playerIndex < 0 || state.players[playerIndex].balance < cell.price) return state
  const players = state.players.map((player, index) => index === playerIndex ? {...player, balance: player.balance - cell.price!} : player)
  return {...state, sequence: state.sequence + 1, players, assets: state.assets.map((item) => item.position === pending.position ? {...item, ownerId: requesterId} : item), currentPlayerId: pending.nextPlayerId, pendingPurchase: null, log: addLog(state.log, `${players[playerIndex].name} membeli ${cell.name} seharga ${formatRupiah(cell.price)}.`)}
}

export function passAsset(state: GameState, requesterId: string): GameState {
  const pending = state.pendingPurchase
  if (state.phase !== 'playing' || !pending || pending.playerId !== requesterId || state.currentPlayerId !== requesterId || state.auction || state.debt) return state
  return {...state, sequence: state.sequence + 1, pendingPurchase: null, auction: newAuction(pending.position, pending.nextPlayerId), log: addLog(state.log, `${playerName(state, requesterId)} melewati ${board[pending.position].name}; lelang dibuka.`)}
}

export function minimumAuctionBid(auction: AuctionState) {
  return auction.highestBid
    ? auction.highestBid + AUCTION_MIN_BID
    : board[auction.position].price ?? AUCTION_MIN_BID
}

export function placeBid(state: GameState, requesterId: string, amount: number): GameState {
  const auction = state.auction
  const player = state.players.find((item) => item.id === requesterId)
  const minimum = auction ? minimumAuctionBid(auction) : AUCTION_MIN_BID
  if (!auction || !player || player.bankrupt || !Number.isSafeInteger(amount) || amount < minimum || amount > player.balance || Date.now() >= auction.endsAt) return state
  return {...state, sequence: state.sequence + 1, auction: {...auction, highestBid: amount, highestBidderId: requesterId}, log: addLog(state.log, `${player.name} menawar ${formatRupiah(amount)} untuk ${board[auction.position].name}.`)}
}

export function closeAuction(state: GameState, requesterId: string, now = Date.now()): GameState {
  const auction = state.auction
  if (!auction || requesterId !== state.hostId || now < auction.endsAt) return state
  let players = state.players
  let assets = state.assets
  let message = `${board[auction.position].name} tidak terjual.`
  if (auction.highestBidderId) {
    const winner = players.find((player) => player.id === auction.highestBidderId)
    if (winner && winner.balance >= auction.highestBid) {
      players = players.map((player) => player.id === winner.id ? {...player, balance: player.balance - auction.highestBid} : player)
      assets = assets.map((asset) => asset.position === auction.position ? {...asset, ownerId: winner.id, mortgaged: false} : asset)
      message = `${winner.name} memenangkan ${board[auction.position].name} seharga ${formatRupiah(auction.highestBid)}.`
    }
  }
  const [nextPosition, ...queue] = auction.queue
  return {...state, sequence: state.sequence + 1, players, assets, currentPlayerId: nextPosition === undefined ? auction.nextPlayerId : state.currentPlayerId, auction: nextPosition === undefined ? null : {...newAuction(nextPosition, auction.nextPlayerId), queue}, log: addLog(state.log, message)}
}

export type BuildOption = {allowed: boolean; label: 'Beli rumah' | 'Bangun hotel'; price: number; reason: string}
export function buildOption(state: GameState, playerId: string, position: number): BuildOption {
  const cell = board[position]
  const asset = state.assets.find((item) => item.position === position)
  const price = cell?.group ? HOUSE_PRICES[cell.group] ?? 0 : 0
  const label = asset?.houses === 4 ? 'Bangun hotel' : 'Beli rumah'
  if (!cell?.group || cell.type !== 'land' || !asset || asset.ownerId !== playerId) return {allowed: false, label, price, reason: 'Tanah ini bukan milikmu.'}
  if (!ownsCompleteGroup(state, playerId, cell.group)) return {allowed: false, label, price, reason: 'Kuasai seluruh kompleks warna ini terlebih dahulu.'}
  const groupAssets = groupAssetsFor(state, cell.group)
  const level = buildingLevel(asset)
  if (groupAssets.some((item) => item.mortgaged)) return {allowed: false, label, price, reason: 'Lunasi hipotek di kompleks ini dahulu.'}
  if (asset.hotel) return {allowed: false, label: 'Bangun hotel', price, reason: 'Tanah ini sudah memiliki hotel.'}
  if (level !== Math.min(...groupAssets.map(buildingLevel))) return {allowed: false, label, price, reason: 'Bangun merata pada tanah lain di kompleks ini.'}
  if ((state.players.find((player) => player.id === playerId)?.balance ?? 0) < price) return {allowed: false, label, price, reason: 'Saldo tidak cukup.'}
  if (level < 4 && state.buildingSupply.houses < 1) return {allowed: false, label, price, reason: 'Stok rumah bank habis.'}
  if (level === 4 && state.buildingSupply.hotels < 1) return {allowed: false, label: 'Bangun hotel', price, reason: 'Stok hotel bank habis.'}
  return {allowed: true, label, price, reason: ''}
}

export function buildAsset(state: GameState, requesterId: string, position: number): GameState {
  if (!canManageAssets(state, requesterId) || state.debt) return state
  const option = buildOption(state, requesterId, position)
  if (!option.allowed) return state
  const asset = state.assets.find((item) => item.position === position)!
  const buildsHotel = asset.houses === 4
  const assets = state.assets.map((item) => item.position === position ? {...item, houses: buildsHotel ? 0 : item.houses + 1, hotel: buildsHotel} : item)
  const players = syncBuildingCounts(state.players.map((player) => player.id === requesterId ? {...player, balance: player.balance - option.price} : player), assets)
  return {...state, sequence: state.sequence + 1, players, assets, buildingSupply: {houses: state.buildingSupply.houses + (buildsHotel ? 4 : -1), hotels: state.buildingSupply.hotels - (buildsHotel ? 1 : 0)}, log: addLog(state.log, `${playerName(state, requesterId)} ${buildsHotel ? 'membangun hotel' : 'membeli rumah'} di ${board[position].name}.`)}
}

export function sellBuilding(state: GameState, requesterId: string, position: number): GameState {
  if (!canManageAssets(state, requesterId, true)) return state
  const asset = state.assets.find((item) => item.position === position)
  const group = board[position]?.group
  if (!asset || asset.ownerId !== requesterId || !group || (!asset.hotel && asset.houses < 1)) return state
  const groupAssets = groupAssetsFor(state, group)
  if (buildingLevel(asset) !== Math.max(...groupAssets.map(buildingLevel))) return state
  if (asset.hotel && state.buildingSupply.houses < 4) return state
  const assets = state.assets.map((item) => item.position === position ? {...item, hotel: false, houses: item.hotel ? 4 : item.houses - 1} : item)
  const refund = (HOUSE_PRICES[group] ?? 0) / 2
  const players = syncBuildingCounts(state.players.map((player) => player.id === requesterId ? {...player, balance: player.balance + refund} : player), assets)
  const next = {...state, sequence: state.sequence + 1, players, assets, buildingSupply: {houses: state.buildingSupply.houses + (asset.hotel ? -4 : 1), hotels: state.buildingSupply.hotels + (asset.hotel ? 1 : 0)}, log: addLog(state.log, `${playerName(state, requesterId)} menjual ${asset.hotel ? 'hotel' : 'rumah'} di ${board[position].name}.`)}
  return clearPaidDebt(next)
}

export function mortgageAsset(state: GameState, requesterId: string, position: number): GameState {
  if (!canManageAssets(state, requesterId, true)) return state
  const asset = state.assets.find((item) => item.position === position)
  const cell = board[position]
  if (!asset || asset.ownerId !== requesterId || asset.mortgaged || !cell.price) return state
  if (cell.group && groupAssetsFor(state, cell.group).some((item) => item.hotel || item.houses > 0)) return state
  const value = Math.floor(cell.price / 2)
  const next = {...state, sequence: state.sequence + 1, assets: state.assets.map((item) => item.position === position ? {...item, mortgaged: true} : item), players: state.players.map((player) => player.id === requesterId ? {...player, balance: player.balance + value} : player), log: addLog(state.log, `${playerName(state, requesterId)} menghipotekkan ${cell.name} senilai ${formatRupiah(value)}.`)}
  return clearPaidDebt(next)
}

export function redeemMortgage(state: GameState, requesterId: string, position: number): GameState {
  if (!canManageAssets(state, requesterId)) return state
  const asset = state.assets.find((item) => item.position === position)
  const cell = board[position]
  const price = Math.ceil((cell.price ?? 0) * .55)
  const player = state.players.find((item) => item.id === requesterId)
  if (!asset || asset.ownerId !== requesterId || !asset.mortgaged || !player || player.balance < price) return state
  return {...state, sequence: state.sequence + 1, assets: state.assets.map((item) => item.position === position ? {...item, mortgaged: false} : item), players: state.players.map((item) => item.id === requesterId ? {...item, balance: item.balance - price} : item), log: addLog(state.log, `${player.name} menebus hipotek ${cell.name} seharga ${formatRupiah(price)}.`)}
}

export function payJailFine(state: GameState, requesterId: string): GameState {
  const player = state.players.find((item) => item.id === requesterId)
  if (!canAct(state, requesterId) || !player?.inJail || player.balance < JAIL_FINE) return state
  return {...state, sequence: state.sequence + 1, players: state.players.map((item) => item.id === requesterId ? {...item, balance: item.balance - JAIL_FINE, inJail: false, jailAttempts: 0} : item), log: addLog(state.log, `${player.name} membayar denda Penjara ${formatRupiah(JAIL_FINE)}.`)}
}

export function useJailCard(state: GameState, requesterId: string, deck: CardDeck): GameState {
  const player = state.players.find((item) => item.id === requesterId)
  if (!canAct(state, requesterId) || !player?.inJail || player.jailFreeCards[deck] < 1) return state
  const cardId = deck === 'chance' ? 'chance-jail-free' : 'community-jail-free'
  return {...state, sequence: state.sequence + 1, players: state.players.map((item) => item.id === requesterId ? {...item, inJail: false, jailAttempts: 0, jailFreeCards: {...item.jailFreeCards, [deck]: item.jailFreeCards[deck] - 1}} : item), chanceDeck: deck === 'chance' ? [...state.chanceDeck, cardId] : state.chanceDeck, communityDeck: deck === 'community' ? [...state.communityDeck, cardId] : state.communityDeck, log: addLog(state.log, `${player.name} memakai kartu Bebas Penjara.`)}
}

export function proposeTrade(state: GameState, requesterId: string, offer: Omit<TradeOffer, 'id' | 'fromId'>): GameState {
  const trade: TradeOffer = {...offer, id: `${state.sequence + 1}-${requesterId}`, fromId: requesterId}
  if (!canAct(state, requesterId) || !validTrade(state, trade)) return state
  return {...state, sequence: state.sequence + 1, pendingTrade: trade, log: addLog(state.log, `${playerName(state, requesterId)} mengirim tawaran trade kepada ${playerName(state, trade.toId)}.`)}
}

export function respondTrade(state: GameState, requesterId: string, accept: boolean): GameState {
  const trade = state.pendingTrade
  if (!trade || trade.toId !== requesterId) return state
  if (!accept || !validTrade(state, trade)) return {...state, sequence: state.sequence + 1, pendingTrade: null, log: addLog(state.log, `${playerName(state, requesterId)} menolak tawaran trade.`)}
  let players = state.players.map((player) => ({...player, jailFreeCards: {...player.jailFreeCards}}))
  const from = players.find((player) => player.id === trade.fromId)!
  const to = players.find((player) => player.id === trade.toId)!
  from.balance += trade.cashTo - trade.cashFrom; to.balance += trade.cashFrom - trade.cashTo
  if (trade.jailCardFrom) {from.jailFreeCards[trade.jailCardFrom] -= 1; to.jailFreeCards[trade.jailCardFrom] += 1}
  if (trade.jailCardTo) {to.jailFreeCards[trade.jailCardTo] -= 1; from.jailFreeCards[trade.jailCardTo] += 1}
  const assets = state.assets.map((asset) => asset.position === trade.assetFrom ? {...asset, ownerId: trade.toId} : asset.position === trade.assetTo ? {...asset, ownerId: trade.fromId} : asset)
  players = syncBuildingCounts(players, assets)
  return {...state, sequence: state.sequence + 1, players, assets, pendingTrade: null, log: addLog(state.log, `Trade ${from.name} dan ${to.name} selesai.`)}
}

export function declareBankruptcy(state: GameState, requesterId: string): GameState {
  const debt = state.debt
  const debtor = state.players.find((player) => player.id === requesterId)
  if (!debt || debt.playerId !== requesterId || !debtor || canLiquidate(state, requesterId)) return state
  const owned = state.assets.filter((asset) => asset.ownerId === requesterId)
  let assets = state.assets
  let players = state.players.map((player) => ({...player, jailFreeCards: {...player.jailFreeCards}}))
  let auction: AuctionState | null = null
  if (debt.creditorId && players.some((player) => player.id === debt.creditorId && !player.bankrupt)) {
    assets = assets.map((asset) => asset.ownerId === requesterId ? {...asset, ownerId: debt.creditorId} : asset)
    const creditor = players.find((player) => player.id === debt.creditorId)!
    creditor.jailFreeCards.chance += debtor.jailFreeCards.chance
    creditor.jailFreeCards.community += debtor.jailFreeCards.community
  } else {
    assets = assets.map((asset) => asset.ownerId === requesterId ? {...asset, ownerId: null, mortgaged: false} : asset)
    const positions = owned.map((asset) => asset.position)
    if (positions.length) auction = {...newAuction(positions[0], debt.resumePlayerId), queue: positions.slice(1)}
  }
  players = syncBuildingCounts(players.map((player) => player.id === requesterId ? {...player, bankrupt: true, balance: 0, jailFreeCards: {chance: 0, community: 0}} : player), assets)
  const next = finishIfNeeded({...state, sequence: state.sequence + 1, players, assets, debt: null, auction, currentPlayerId: auction ? requesterId : debt.resumePlayerId, consecutiveDoubles: 0, log: addLog(state.log, `${debtor.name} dinyatakan bangkrut.`)})
  return next
}

export function ownsCompleteGroup(state: GameState, playerId: string, group: string) {
  const positions = board.flatMap((cell, position) => cell.group === group ? [position] : [])
  return positions.length > 0 && positions.every((position) => state.assets.find((asset) => asset.position === position)?.ownerId === playerId)
}

export function rentForAsset(state: GameState, position: number, rollTotal = diceTotal(state), rentMultiplier = 1, utilityRate?: number) {
  const cell = board[position]
  const asset = state.assets.find((item) => item.position === position)
  if (!cell?.price || !asset?.ownerId || asset.mortgaged) return 0
  if (cell.type === 'land') {
    const level = buildingLevel(asset)
    const rent = (LAND_RENTS[position]?.[level] ?? 0) * 1_000
    return (level === 0 && cell.group && ownsCompleteGroup(state, asset.ownerId, cell.group) ? rent * 2 : rent) * rentMultiplier
  }
  const ownedTypeCount = state.assets.filter((item) => item.ownerId === asset.ownerId && !item.mortgaged && board[item.position].type === cell.type).length
  if (cell.type === 'station') return 25_000 * (2 ** (ownedTypeCount - 1)) * rentMultiplier
  if (cell.type === 'utility') return rollTotal * (utilityRate ?? (ownedTypeCount === 2 ? 10_000 : 4_000))
  return 0
}

export function createDemoGame(): GameState {
  const state = ['Raka', 'Sari', 'Bima', 'Naya'].reduce((current, name, index) => index === 0 ? current : addPlayer(current, `demo-${index}`, name), createLobby('demo-0', 'Raka'))
  const started = startGame(state, 'demo-0')
  return {...started, players: started.players.map((player) => player.id === 'demo-0' ? {...player, balance: 1_280_000, houses: 2} : player), assets: started.assets.map((asset) => asset.position === 1 || asset.position === 3 ? {...asset, ownerId: 'demo-0', houses: 1} : asset.position === 5 ? {...asset, ownerId: 'demo-1'} : asset), buildingSupply: {houses: 30, hotels: 12}}
}

function createPlayer(id: string, name: string, index: number): Player {
  return {id, name: name.trim().slice(0, 20), color: PLAYER_COLORS[index % PLAYER_COLORS.length], balance: START_BALANCE, position: 0, houses: 0, hotels: 0, jailFreeCards: {chance: 0, community: 0}, inJail: false, jailAttempts: 0, bankrupt: false}
}

function canAct(state: GameState, requesterId: string) {
  return state.phase === 'playing' && state.currentPlayerId === requesterId && !state.pendingCard && !state.pendingPurchase && !state.auction && !state.debt && !state.pendingTrade && !state.players.find((player) => player.id === requesterId)?.bankrupt
}

function canManageAssets(state: GameState, requesterId: string, allowDebt = false) {
  if (state.phase !== 'playing' || state.pendingCard || state.pendingPurchase || state.auction || state.pendingTrade) return false
  if (state.debt) return allowDebt && state.debt.playerId === requesterId
  return state.currentPlayerId === requesterId
}

function rollFromJail(state: GameState, playerIndex: number, dice: [number, number], isDouble: boolean): GameState {
  const player = state.players[playerIndex]
  if (isDouble) {
    const moved = movePlayer(state, playerIndex, dice[0] + dice[1], {...player, inJail: false, jailAttempts: 0})
    const nextTurn = nextPlayerId(moved.players, playerIndex)
    const next = {...moved, sequence: state.sequence + 1, lastRoll: dice, lastRollSequence: state.sequence + 1, currentPlayerId: nextTurn, consecutiveDoubles: 0, log: addLog(state.log, `${player.name} mendapat dadu kembar dan bebas dari Penjara.`)}
    return queueOrSettle(next, player.id, nextTurn, dice[0] + dice[1])
  }
  if (player.jailAttempts < 2) {
    const players = state.players.map((item, index) => index === playerIndex ? {...item, jailAttempts: item.jailAttempts + 1} : item)
    return {...state, sequence: state.sequence + 1, players, lastRoll: dice, lastRollSequence: state.sequence + 1, currentPlayerId: nextPlayerId(players, playerIndex), consecutiveDoubles: 0, log: addLog(state.log, `${player.name} gagal mendapat dadu kembar di Penjara (${player.jailAttempts + 1}/3).`)}
  }
  const fined = {...player, balance: player.balance - JAIL_FINE, inJail: false, jailAttempts: 0}
  const moved = movePlayer(state, playerIndex, dice[0] + dice[1], fined)
  const nextTurn = nextPlayerId(moved.players, playerIndex)
  const next = {...moved, sequence: state.sequence + 1, lastRoll: dice, lastRollSequence: state.sequence + 1, currentPlayerId: nextTurn, consecutiveDoubles: 0, log: addLog(state.log, `${player.name} gagal tiga kali, membayar ${formatRupiah(JAIL_FINE)}, lalu bergerak.`)}
  return openDebt(queueOrSettle(next, player.id, nextTurn, dice[0] + dice[1]), nextTurn, null)
}

function movePlayer(state: GameState, playerIndex: number, steps: number, base: Player) {
  const rawPosition = base.position + steps
  const players = state.players.map((player, index) => index === playerIndex ? {...base, position: rawPosition % BOARD_SIZE, balance: base.balance + (rawPosition >= BOARD_SIZE ? START_BONUS : 0)} : player)
  return {...state, players}
}

function queueOrSettle(state: GameState, playerId: string, nextTurn: string | null, rollTotal: number, rentMultiplier = 1, utilityRate?: number): GameState {
  const player = state.players.find((item) => item.id === playerId)
  if (!player) return state
  const type = board[player.position].type
  return type === 'chance' || type === 'community' ? queueCard(state, type, playerId, nextTurn) : settleLanding(state, playerId, nextTurn, rollTotal, rentMultiplier, utilityRate)
}

function settleLanding(state: GameState, playerId: string, nextTurn: string | null, rollTotal: number, rentMultiplier = 1, utilityRate?: number): GameState {
  const player = state.players.find((item) => item.id === playerId)
  if (!player) return state
  const cell = board[player.position]
  if (player.position === 30) {
    const players = state.players.map((item) => item.id === playerId ? jailPlayer(item) : item)
    return {...state, players, currentPlayerId: nextPlayerId(players, players.findIndex((item) => item.id === playerId)), consecutiveDoubles: 0, log: addLog(state.log, `${player.name} mendarat di Menuju Penjara.`)}
  }
  if (cell.type === 'tax') {
    const tax = player.position === 4 ? 200_000 : 100_000
    const taxed = {...state, players: state.players.map((item) => item.id === playerId ? {...item, balance: item.balance - tax} : item), log: addLog(state.log, `${player.name} membayar ${cell.name} ${formatRupiah(tax)}.`)}
    return openDebt(taxed, nextTurn, null)
  }
  const asset = state.assets.find((item) => item.position === player.position)
  if (!cell.price || !asset) return state
  if (!asset.ownerId) return {...state, currentPlayerId: playerId, pendingPurchase: {playerId, position: player.position, nextPlayerId: nextTurn}}
  if (asset.ownerId === playerId) return state
  const rent = rentForAsset(state, player.position, rollTotal, rentMultiplier, utilityRate)
  const owner = state.players.find((item) => item.id === asset.ownerId)
  if (!owner || rent <= 0) return state
  const paid = {...state, players: state.players.map((item) => item.id === playerId ? {...item, balance: item.balance - rent} : item.id === owner.id ? {...item, balance: item.balance + rent} : item), log: addLog(state.log, `${player.name} membayar sewa ${formatRupiah(rent)} kepada ${owner.name} untuk ${cell.name}.`)}
  return openDebt(paid, nextTurn, owner.id)
}

function openDebt(state: GameState, resumePlayerId: string | null, creditorId: string | null): GameState {
  if (state.debt) return state
  const debtor = state.players.find((player) => !player.bankrupt && player.balance < 0)
  return debtor ? {...state, currentPlayerId: debtor.id, pendingPurchase: state.pendingPurchase?.playerId === debtor.id ? null : state.pendingPurchase, debt: {playerId: debtor.id, creditorId: debtor.id === creditorId ? null : creditorId, resumePlayerId}} : state
}

function clearPaidDebt(state: GameState): GameState {
  if (!state.debt) return state
  const debtor = state.players.find((player) => player.id === state.debt?.playerId)
  return debtor && debtor.balance >= 0 ? {...state, currentPlayerId: state.debt.resumePlayerId, debt: null} : state
}

function canLiquidate(state: GameState, playerId: string) {
  return state.assets.some((asset) => asset.ownerId === playerId && (asset.hotel || asset.houses > 0 || !asset.mortgaged))
}

function validTrade(state: GameState, trade: TradeOffer) {
  if (trade.fromId === trade.toId || !state.players.some((player) => player.id === trade.toId && !player.bankrupt)) return false
  if (![trade.cashFrom, trade.cashTo].every((value) => Number.isSafeInteger(value) && value >= 0)) return false
  const from = state.players.find((player) => player.id === trade.fromId)
  const to = state.players.find((player) => player.id === trade.toId)
  if (!from || !to || from.balance < trade.cashFrom || to.balance < trade.cashTo) return false
  if (!validTradeAsset(state, trade.assetFrom, trade.fromId) || !validTradeAsset(state, trade.assetTo, trade.toId)) return false
  if (trade.jailCardFrom && from.jailFreeCards[trade.jailCardFrom] < 1) return false
  if (trade.jailCardTo && to.jailFreeCards[trade.jailCardTo] < 1) return false
  return trade.cashFrom + trade.cashTo > 0 || trade.assetFrom !== null || trade.assetTo !== null || trade.jailCardFrom !== null || trade.jailCardTo !== null
}

function validTradeAsset(state: GameState, position: number | null, ownerId: string) {
  if (position === null) return true
  const asset = state.assets.find((item) => item.position === position)
  if (!asset || asset.ownerId !== ownerId) return false
  const group = board[position].group
  return !group || !groupAssetsFor(state, group).some((item) => item.hotel || item.houses > 0)
}

function queueCard(state: GameState, deck: CardDeck, playerId: string, nextPlayerId: string | null): GameState {
  const cards = deck === 'chance' ? state.chanceDeck : state.communityDeck
  const [cardId, ...remaining] = cards
  if (!cardId) return state
  return {...state, currentPlayerId: playerId, chanceDeck: deck === 'chance' ? remaining : state.chanceDeck, communityDeck: deck === 'community' ? remaining : state.communityDeck, pendingCard: {deck, cardId, playerId, nextPlayerId}}
}

function newAuction(position: number, nextPlayerId: string | null): AuctionState {
  return {position, highestBid: 0, highestBidderId: null, endsAt: Date.now() + AUCTION_DURATION, nextPlayerId, queue: []}
}

function jailPlayer(player: Player): Player { return {...player, position: JAIL_POSITION, inJail: true, jailAttempts: 0} }
function groupAssetsFor(state: GameState, group: string) { return state.assets.filter((item) => board[item.position].group === group) }
function buildingLevel(asset: AssetState) { return asset.hotel ? 5 : asset.houses }
function diceTotal(state: GameState) { return (state.lastRoll?.[0] ?? 0) + (state.lastRoll?.[1] ?? 0) }
function playerName(state: GameState, id: string) { return state.players.find((player) => player.id === id)?.name ?? 'Pemain' }

function syncBuildingCounts(players: Player[], assets: AssetState[]) {
  return players.map((player) => ({...player, houses: assets.filter((asset) => asset.ownerId === player.id).reduce((sum, asset) => sum + asset.houses, 0), hotels: assets.filter((asset) => asset.ownerId === player.id && asset.hotel).length}))
}

function finishIfNeeded(state: GameState): GameState {
  const active = state.players.filter((player) => !player.bankrupt)
  return active.length === 1 ? {...state, phase: 'finished', winnerId: active[0].id, currentPlayerId: null, auction: null, debt: null, pendingTrade: null} : state
}

function nearestPosition(from: number, target: 'station' | 'utility') {
  for (let offset = 1; offset <= BOARD_SIZE; offset += 1) { const position = (from + offset) % BOARD_SIZE; if (board[position].type === target) return position }
  return from
}

function nextPlayerId(players: Player[], currentIndex: number) {
  for (let offset = 1; offset <= players.length; offset += 1) { const player = players[(currentIndex + offset) % players.length]; if (player && !player.bankrupt) return player.id }
  return null
}

function validDice(dice: [number, number]) { return dice.every((value) => Number.isInteger(value) && value >= 1 && value <= 6) }
function secureDie() { return randomInt(6) + 1 }
function shuffled(values: string[]) { const result = [...values]; for (let index = result.length - 1; index > 0; index -= 1) { const swapIndex = randomInt(index + 1); [result[index], result[swapIndex]] = [result[swapIndex], result[index]] } return result }
function randomInt(max: number) { const bytes = new Uint32Array(1); crypto.getRandomValues(bytes); return bytes[0] % max }
function addLog(log: string[], message: string) { return [...log.slice(-9), message] }

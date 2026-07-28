import assert from 'node:assert/strict'
import test from 'node:test'
import {
  addPlayer,
  board,
  buildAsset,
  buildOption,
  buyAsset,
  closeAuction,
  createLobby,
  declareBankruptcy,
  JAIL_POSITION,
  movementPath,
  mortgageAsset,
  passAsset,
  placeBid,
  proposeTrade,
  respondTrade,
  resolveCard,
  rentForAsset,
  rollDice,
  sellBuilding,
  START_BALANCE,
  START_BONUS,
  startGame,
  useJailCard,
} from './game.ts'

test('jalur pion mengikuti petak, melewati START, dan mendukung perpindahan langsung', () => {
  assert.deepEqual(movementPath(38, 2), [38, 39, 0, 1, 2])
  assert.deepEqual(movementPath(7, JAIL_POSITION, true), [7, JAIL_POSITION])
})

test('giliran, bonus START, dadu kembar, dan hukuman tiga kembar', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')

  state = {
    ...state,
    assets: state.assets.map((asset) => asset.position === 1 || asset.position === 3 ? {...asset, ownerId: 'host'} : asset),
    players: state.players.map((player) => (player.id === 'host' ? {...player, position: 37} : player)),
  }
  state = rollDice(state, 'host', [2, 2])
  assert.equal(state.players[0].position, 1)
  assert.equal(state.players[0].balance, START_BALANCE + START_BONUS)
  assert.equal(state.currentPlayerId, 'host')

  state = rollDice(state, 'host', [1, 1])
  state = rollDice(state, 'host', [3, 3])
  assert.equal(state.players[0].position, JAIL_POSITION)
  assert.equal(state.currentPlayerId, 'peer')
  assert.equal(state.consecutiveDoubles, 0)
})

test('aset dapat dibeli saat mendarat dan sewa berpindah ke pemilik', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')
  state = {...state, players: state.players.map((player) => player.id === 'host' ? {...player, position: 39} : player)}

  state = rollDice(state, 'host', [1, 1])
  assert.equal(state.pendingPurchase?.position, 1)
  assert.equal(state.lastRollSequence, state.sequence)
  const rollSequence = state.lastRollSequence
  assert.equal(buyAsset(state, 'peer'), state)
  state = buyAsset(state, 'host')
  assert.equal(state.lastRollSequence, rollSequence)
  assert.equal(state.assets.find((asset) => asset.position === 1)?.ownerId, 'host')
  assert.equal(state.players[0].balance, START_BALANCE + START_BONUS - 60_000)

  state = {
    ...state,
    currentPlayerId: 'peer',
    consecutiveDoubles: 0,
    players: state.players.map((player) => player.id === 'peer' ? {...player, position: 39} : player),
  }
  const hostBalance = state.players[0].balance
  state = rollDice(state, 'peer', [1, 1])
  assert.equal(state.pendingPurchase, null)
  assert.equal(state.players[0].balance, hostBalance + 2_000)
  assert.equal(state.players[1].balance, START_BALANCE + START_BONUS - 2_000)
})

test('kompleks lengkap membangun merata sampai hotel dan memperkuat sewa', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')
  state = {...state, assets: state.assets.map((asset) => asset.position === 1 || asset.position === 3 ? {...asset, ownerId: 'host'} : asset)}

  assert.equal(rentForAsset(state, 1), 4_000)
  state = buildAsset(state, 'host', 1)
  assert.equal(buildOption(state, 'host', 1).allowed, false)
  assert.equal(buildAsset(state, 'host', 1), state)
  state = buildAsset(state, 'host', 3)
  for (let level = 2; level <= 4; level += 1) {
    state = buildAsset(state, 'host', 1)
    state = buildAsset(state, 'host', 3)
  }

  assert.equal(state.players[0].houses, 8)
  state = buildAsset(state, 'host', 1)
  const hotelAsset = state.assets.find((asset) => asset.position === 1)!
  assert.equal(hotelAsset.hotel, true)
  assert.equal(hotelAsset.houses, 0)
  assert.equal(state.players[0].houses, 4)
  assert.equal(state.players[0].hotels, 1)
  assert.deepEqual(state.buildingSupply, {houses: 28, hotels: 11})
  assert.equal(rentForAsset(state, 1), 250_000)
})

test('kartu biasa menahan giliran, menjalankan efek, lalu kembali ke bawah deck', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  assert.equal(state.chanceDeck.length, 16)
  assert.equal(state.communityDeck.length, 16)
  state = startGame(state, 'host')
  state = {
    ...state,
    chanceDeck: ['chance-dividend', ...state.chanceDeck.filter((id) => id !== 'chance-dividend')],
    players: state.players.map((player) => (player.id === 'host' ? {...player, position: 1} : player)),
  }

  state = rollDice(state, 'host', [1, 5])
  assert.equal(state.pendingCard?.cardId, 'chance-dividend')
  assert.equal(state.currentPlayerId, 'host')
  assert.equal(state.players[0].balance, START_BALANCE)

  state = resolveCard(state, 'host')
  assert.equal(state.pendingCard, null)
  assert.equal(state.currentPlayerId, 'peer')
  assert.equal(state.players[0].balance, START_BALANCE + 50_000)
  assert.equal(state.chanceDeck.at(-1), 'chance-dividend')
})

test('kartu bebas penjara masuk inventory dan tidak kembali ke deck', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')
  state = {
    ...state,
    chanceDeck: ['chance-jail-free', ...state.chanceDeck.filter((id) => id !== 'chance-jail-free')],
    players: state.players.map((player) => (player.id === 'host' ? {...player, position: 1} : player)),
  }

  state = resolveCard(rollDice(state, 'host', [1, 5]), 'host')
  assert.equal(state.players[0].jailFreeCards.chance, 1)
  assert.equal(state.chanceDeck.length, 15)
  assert.equal(state.chanceDeck.includes('chance-jail-free'), false)
})

test('transfer ulang tahun mencatat penarik kartu sebagai kreditur jika lawan minus', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')
  state = {
    ...state,
    communityDeck: ['community-birthday', ...state.communityDeck.filter((id) => id !== 'community-birthday')],
    players: state.players.map((player) => player.id === 'peer' ? {...player, balance: 5_000} : player),
  }
  state = resolveCard(rollDice(state, 'host', [1, 1]), 'host')
  assert.equal(state.players.find((player) => player.id === 'peer')?.balance, -5_000)
  assert.equal(state.debt?.creditorId, 'host')
})

test('mundur tiga petak dapat memicu kartu Dana Umum berikutnya', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')
  state = {
    ...state,
    chanceDeck: ['chance-back-three', ...state.chanceDeck.filter((id) => id !== 'chance-back-three')],
    communityDeck: ['community-inheritance', ...state.communityDeck.filter((id) => id !== 'community-inheritance')],
    players: state.players.map((player) => (player.id === 'host' ? {...player, position: 30} : player)),
  }

  state = resolveCard(rollDice(state, 'host', [3, 3]), 'host')
  assert.equal(state.players[0].position, 33)
  assert.equal(state.pendingCard?.cardId, 'community-inheritance')
  assert.equal(state.currentPlayerId, 'host')
})

test('pajak, menuju penjara, tiga percobaan, dan kartu bebas penjara berjalan', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')
  state = {...state, players: state.players.map((player) => player.id === 'host' ? {...player, position: 2} : player)}
  state = rollDice(state, 'host', [1, 1])
  assert.equal(state.players[0].balance, START_BALANCE - 200_000)

  state = {...state, currentPlayerId: 'host', consecutiveDoubles: 0, players: state.players.map((player) => player.id === 'host' ? {...player, position: 28} : player)}
  state = rollDice(state, 'host', [1, 1])
  assert.equal(state.players[0].inJail, true)
  assert.equal(state.players[0].position, JAIL_POSITION)

  state = {...state, currentPlayerId: 'host', players: state.players.map((player) => player.id === 'host' ? {...player, jailFreeCards: {chance: 1, community: 0}} : player)}
  state = useJailCard(state, 'host', 'chance')
  assert.equal(state.players[0].inJail, false)
  assert.equal(state.players[0].jailFreeCards.chance, 0)
  assert.equal(state.chanceDeck.at(-1), 'chance-jail-free')

  state = {...state, currentPlayerId: 'host', players: state.players.map((player) => player.id === 'host' ? {...player, position: JAIL_POSITION, inJail: true, jailAttempts: 2, balance: 40_000} : player)}
  state = rollDice(state, 'host', [1, 2])
  assert.equal(state.players[0].inJail, false)
  assert.equal(state.players[0].balance, -10_000)
  assert.equal(state.debt?.playerId, 'host')
})

test('aset yang dilewati masuk lelang dan penawar tertinggi menjadi pemilik', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')
  state = {...state, players: state.players.map((player) => player.id === 'host' ? {...player, position: 39} : player)}
  state = rollDice(state, 'host', [1, 1])
  state = passAsset(state, 'host')
  assert.equal(state.auction?.position, 1)
  const openingBid = board[1].price!
  state = placeBid(state, 'peer', openingBid - 10_000)
  assert.equal(state.auction?.highestBid, 0)
  state = placeBid(state, 'peer', openingBid)
  assert.equal(state.auction?.highestBid, openingBid)
  state = closeAuction(state, 'host', Number.POSITIVE_INFINITY)
  assert.equal(state.assets.find((asset) => asset.position === 1)?.ownerId, 'peer')
  assert.equal(state.players[1].balance, START_BALANCE - openingBid)
})

test('bangunan dapat dijual, aset dapat dihipotek, dan sewa berhenti', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')
  state = {...state, assets: state.assets.map((asset) => asset.position === 1 || asset.position === 3 ? {...asset, ownerId: 'host'} : asset)}
  state = buildAsset(state, 'host', 1)
  const afterBuild = state.players[0].balance
  state = sellBuilding(state, 'host', 1)
  assert.equal(state.players[0].balance, afterBuild + 25_000)
  state = mortgageAsset(state, 'host', 1)
  assert.equal(state.assets.find((asset) => asset.position === 1)?.mortgaged, true)
  assert.equal(rentForAsset(state, 1), 0)
})

test('trade memindahkan uang, properti, dan kartu bebas penjara secara atomik', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')
  state = {
    ...state,
    assets: state.assets.map((asset) => asset.position === 1 ? {...asset, ownerId: 'host'} : asset.position === 5 ? {...asset, ownerId: 'peer'} : asset),
    players: state.players.map((player) => player.id === 'host' ? {...player, jailFreeCards: {chance: 1, community: 0}} : player),
  }
  state = proposeTrade(state, 'host', {toId: 'peer', cashFrom: 20_000, cashTo: 10_000, assetFrom: 1, assetTo: 5, jailCardFrom: 'chance', jailCardTo: null})
  assert.ok(state.pendingTrade)
  state = respondTrade(state, 'peer', true)
  assert.equal(state.assets.find((asset) => asset.position === 1)?.ownerId, 'peer')
  assert.equal(state.assets.find((asset) => asset.position === 5)?.ownerId, 'host')
  assert.equal(state.players[1].jailFreeCards.chance, 1)
  assert.equal(state.players[0].balance, START_BALANCE - 10_000)
})

test('utang yang tak bisa dilikuidasi berakhir bangkrut dan menentukan pemenang', () => {
  let state = addPlayer(createLobby('host', 'Thoriq'), 'peer', 'Sari')
  state = startGame(state, 'host')
  state = {
    ...state,
    currentPlayerId: 'host',
    debt: {playerId: 'host', creditorId: 'peer', resumePlayerId: 'peer'},
    players: state.players.map((player) => player.id === 'host' ? {...player, balance: -50_000} : player),
    assets: state.assets.map((asset) => asset.position === 1 ? {...asset, ownerId: 'host', mortgaged: true} : asset),
  }
  state = declareBankruptcy(state, 'host')
  assert.equal(state.players[0].bankrupt, true)
  assert.equal(state.assets.find((asset) => asset.position === 1)?.ownerId, 'peer')
  assert.equal(state.phase, 'finished')
  assert.equal(state.winnerId, 'peer')
})

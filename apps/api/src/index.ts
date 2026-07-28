import {createApp} from './app'
import {config} from './config'

const app = createApp()
app.listen(config.port)
console.log(`Ruang Main API aktif di http://localhost:${config.port}`)

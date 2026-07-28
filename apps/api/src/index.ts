import {app} from './app'
import {config} from './config'

app.listen(config.port)
console.log(`Ruang Main API aktif di http://localhost:${config.port}`)

const bcrypt = require('bcryptjs')
const PIN = '1234' // Cambia esto por tu PIN deseado

bcrypt.hash(PIN, 10).then(hash => {
  console.log('\n✅ Hash generado para PIN:', PIN)
  console.log('\nPega esto en .env.local:')
  console.log(`DASHBOARD_PIN_HASH="${hash}"`)
  console.log('\nVerificando...')
  return bcrypt.compare(PIN, hash).then(ok => {
    console.log('Verificación:', ok ? '✅ VÁLIDO' : '❌ INVÁLIDO')
  })
})

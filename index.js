const fb = require('facebook-chat-api')
const log = require('npmlog')

const config = require(process.env.NODE_ENV === 'docker' ? '/config/config.json' : './config.json')
fb(config.login, { listenEvents: true }, (err, api) => {
  if (err) return log.error('dontkick', err)
  api.listen((err, message) => {
    if (err) return log.error('dontkick', err)
    if (!message) return log.info('dontkick', 'no message')
    if (message.type !== 'event') return log.info('dontkick', 'type is not event')
    if (message.logMessageType !== 'log:unsubscribe') return log.info('dontkick', 'event type is not log:unsubscribe')
    if (!message.author) return log.info('dontkick', 'there is no author')
    if (config.threads.length > 0 && !config.threads.includes(message.threadID)) return log.info('dontkick', 'threads array is not empty and thread is not in there')
    if (config.people.length > 0 && !config.people.includes(message.author)) return log.info('dontkick', 'people array is not empty and person is not in there')

    log.info('dontkick', message)

    var removedPerson = message.logMessageData.leftParticipantFbId

    log.info('dontkick', 'Adding', removedPerson, 'back to the', message.threadID)
    api.addUserToGroup(removedPerson, message.threadID, (err) => {
      if (err) return log.error('dontkick', err)
      if (config.removeMessage) log.info('dontkick', 'Sending message', config.removeMessage, 'to', message.threadID)
      if (config.removeMessage) {
        api.sendMessage(config.removeMessage, message.threadID, (err) => {
          if (err) return log.error('dontkick', err)
          log.info('dontkick', 'Removing', message.author, 'from', message.threadID)
          api.removeUserFromGroup(message.author, message.threadID, err => err ? log.error('dontkick', err) : '')
        })
      }
    })
  })
})

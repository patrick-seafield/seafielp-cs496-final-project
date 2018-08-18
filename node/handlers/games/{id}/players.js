const db = require('../../../lib/azureDB')

function get(req, res, next) {
    db.getCharactersForGame(req.params.id, function (error, result) {
        res.json(result.map(db.entityResolver))
    })
}

module.exports = {
    get: get
}
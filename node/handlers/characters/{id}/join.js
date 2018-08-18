const db = require('../../../lib/azureDB')

function put(req, res, next) {
    db.joinGame(req.params.id, req.body.GameRowKey, function (error, result) {
        if (error) {
            next(error)
        }
        res.json(result)
    })
}

module.exports = {
    put: put
}
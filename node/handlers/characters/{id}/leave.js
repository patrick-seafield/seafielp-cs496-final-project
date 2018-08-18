const db = require('../../../lib/azureDB')

function put(req, res, next) {
    db.leaveGame(req.params.id, function (error, result) {
        if (error) {
            next(error)
        }
        res.json(result)
    })
}

module.exports = {
    put: put
}
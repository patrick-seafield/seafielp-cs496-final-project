const db = require('../../lib/azureDB')

function get(req, res, next) {
    db.getGame(req.params.id, function(error, result) {
        if (error) {
            next(error)
        }
        res.json(result)
    })
}

function update(req, res, next) {
    db.saveGame(req.body, function (error, result) {
        if (error) {
            next(error)
        }
        res.json(result)
    })
}

function deleteGame(req, res, next) {
    db.deleteGame(req.params.id, function(error, response) {
        if (error) {
            next(error)
        }
        res.json(response.isSuccessful ? "OK" : "ERROR!")
    })
}

module.exports = {
    get: get,
    put: update,
    patch: update,
    delete: deleteGame
}
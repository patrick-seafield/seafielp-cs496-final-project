const db = require('../../lib/azureDB')

function get(req, res, next) {
    db.getCharacter(req.params.id, function(error, result) {
        if (error) {
            next(error)
        }
        res.json(result)
    })
}


function update(req, res, next) {
    db.saveCharacter(req.body, function (error, result) {
        if (error) {
            next(error)
        }
        res.json(result)
    })
}

function deleteChar(req, res, next) {
    db.deleteCharacter(req.params.id, function(error, response) {
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
    delete: deleteChar
}
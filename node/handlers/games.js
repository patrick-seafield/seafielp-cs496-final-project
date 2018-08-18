const db = require('../lib/azureDB')
const uuidv4 = require('uuid/v4')


function post(req, res, next) {
    const g = Object.assign({}, req.body, { RowKey: uuidv4() })

    db.saveGame(g, function(error, result) {
        if (error) {
            next(error)
        }

        res.json(result)
    })
}

function get(req, res, next) {
    db.getAllGames(function (error, result){
        if (error) {
            next(error)
        }

        res.json(result)
    })
}


module.exports = {
    post: post,
    get: get
}
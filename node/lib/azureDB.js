const storage = require('azure-storage')
const connectionString = "DefaultEndpointsProtocol=https;AccountName=cs496-final-project-seafielp;AccountKey=IAEGyabsKz5EpWgkxMF48zydTbvYphEsQp9usYpvvgGQScrf5T2slZebrhw6XUIZdwabXXq3osAhHtImEDeWdQ==;TableEndpoint=https://cs496-final-project-seafielp.table.cosmosdb.azure.com:443/;"
const storageClient = storage.createTableService(connectionString)

const TableQuery = storage.TableQuery
const TableBatch = storage.TableBatch
const TableUtilities = storage.TableUtilities;
const eg = TableUtilities.entityGenerator;

const CHARACTER_TABLE = 'characters'
const GAME_TABLE = 'games'

const entityResolver = function (entity) {
    var resolvedEntity = {};

    for (key in entity) {
        if (key !== "PartitionKey" && key !== "Timestamp") {
            resolvedEntity[key] = entity[key]._;
        }
    }
    return resolvedEntity;
}

/////////////
// Characters

function saveCharacter(username, c, callback) {
    const character = {
        PartitionKey: eg.String('partition1'),
        RowKey: eg.String(c.RowKey),
        username: eg.String(username),
        name: eg.String(c.name || ''),
        level: eg.Int32(c.level || 1),
        playerClass: eg.String(c.playerClass || ''),
        experience: eg.Int32(c.experience || 0),
        currentGame: eg.String(c.currentGame)
    }
    storageClient.insertOrMergeEntity(CHARACTER_TABLE, character, {
        echoContent: true, // Doesn't work. Result doesn't contain any character data.
        payloadFormat: TableUtilities.PayloadFormat.NO_METADATA, // Doesn't work. The only thing returned IS metadata.
        entityResolver: entityResolver // Can't confirm if it works because nothing is returned!
    }, function (error, result) {
        if (error) {
            callback(error, result)
        }
        storageClient.retrieveEntity(CHARACTER_TABLE, 'partition1', c.RowKey, {
            payloadFormat: TableUtilities.PayloadFormat.NO_METADATA
        }, function (error, result) {
            callback(error, entityResolver(result))
        })
    })
}

function getAllCharacters(username, callback) {
    const tq = new TableQuery().where(TableQuery.stringFilter(
            'username',
            TableUtilities.QueryComparisons.EQUAL,
            username
        )
    )

    storageClient.queryEntities(CHARACTER_TABLE, tq, null, function (error, result) {

        if (!error && result.entries) {
            const entries = result.entries.map(entityResolver)
            callback(error, entries)
        } else {
            callback(error)
        }
    })
}

function updateCharacters(characters, callback) {
    let batch = new TableBatch()

    for (let i = 0; i < characters.length; i++) {
        process.stdout.write("Adding character to batch: " + JSON.stringify(characters[i]) + "\n")
        batch.mergeEntity(characters[i])
    }

    storageClient.executeBatch(CHARACTER_TABLE, batch, function (error, result) {
        if (error) {
            callback(error)
        }
        callback(error, result.entries)
    })
}

function getCharacter(RowKey, callback) {
    storageClient.retrieveEntity(CHARACTER_TABLE, 'partition1', RowKey, function (error, result) {
        callback(error, entityResolver(result))
    })
}

function deleteCharacter(RowKey, callback) {
    const c = {
        PartitionKey: eg.String('partition1'),
        RowKey: eg.String(RowKey)
    }
    storageClient.deleteEntity(CHARACTER_TABLE, c, callback)
}

///////////////
// Games

function saveGame(g, callback) {
    const game = {
        PartitionKey: eg.String('partition1'),
        RowKey: eg.String(g.RowKey),
        title: eg.String(g.title || ''),
        levelMin: eg.Int32(g.levelMin || 1),
        levelMax: eg.Int32(g.levelMax || 24),
        experience: eg.Int32(g.experienceReward || 0),
        completed: eg.Boolean(g.completed || false)
    }
    storageClient.insertOrMergeEntity(GAME_TABLE, game, {
        echoContent: true, // Doesn't work. Result doesn't contain any character data.
        payloadFormat: TableUtilities.PayloadFormat.NO_METADATA, // Doesn't work. The only thing returned IS metadata.
        entityResolver: entityResolver // Can't confirm if it works because nothing is returned!
    }, function (error, result) {
        if (error) {
            callback(error, result)
        }
        storageClient.retrieveEntity(GAME_TABLE, 'partition1', g.RowKey, {
            payloadFormat: TableUtilities.PayloadFormat.NO_METADATA
        }, function (error, result) {
            callback(error, entityResolver(result))
        })
    })
}

function getAllGames(callback) {
    storageClient.queryEntities(GAME_TABLE, null, null, function (error, result) {

        if (!error && result.entries) {
            const entries = result.entries.map(entityResolver)
            callback(error, entries)
        } else {
            callback(error)
        }
    })
}

function getGame(RowKey, callback) {
    storageClient.retrieveEntity(GAME_TABLE, 'partition1', RowKey, function (error, result) {
        callback(error, entityResolver(result))
    })
}

function deleteGame(RowKey, callback) {
    const g = {
        PartitionKey: eg.String('partition1'),
        RowKey: eg.String(RowKey)
    }
    storageClient.deleteEntity(GAME_TABLE, g, callback)
}

function joinGame(CharacterRowKey, GameRowKey, callback) {
    getCharacter(CharacterRowKey, function (error, c) {
        if (error) {
            callback(error)
        }
        const character = Object.assign({}, c, { currentGame: GameRowKey })
        saveCharacter(character, callback)
    })
}

function leaveGame(CharacterRowKey, callback) {
    getCharacter(CharacterRowKey, function (error, c) {
        if (error) {
            callback(error)
        }
        const character = Object.assign({}, c, { currentGame: "" })
        saveCharacter(character, callback)
    })
}

function getCharactersForGame(GameRowKey, callback) {
    const tq = new TableQuery().where(TableQuery.stringFilter(
        'currentGame',
        TableUtilities.QueryComparisons.EQUAL,
        GameRowKey
    ))
    storageClient.queryEntities(CHARACTER_TABLE, tq, null, function (error, result) {
        if (error) {
            callback(error)
        }
        callback(error, result.entries)
    })
}


function completeGame(GameRowKey, callback) {
    getGame(GameRowKey, function (error, game) {
        if (error) {
            callback(error)
        }

        // We can't complete a game that's already completed!
        if (game.completed) {
            return game
        }

        const gainedExp = game.experienceReward

        // Get all the characters in this game, remove them from this game, and give them experience.
        getCharactersForGame(GameRowKey, function (error, characters) {
            if (characters.length > 0) {
                
                let updatedCharacters = characters.map(function (character) {
                    return Object.assign({}, character, {
                        currentGame: { "_": "" },
                        experience: { "_": character.experience + gainedExp }
                    })
                })
                updateCharacters(
                    updatedCharacters,
                    function (error, result) {
                        // Finally mark the game as completed and return it.
                        saveGame(Object.assign({}, game, { completed: true }), callback)
                    }

                )
            } else {
                saveGame(Object.assign({}, game, { completed: true }), callback)
            }
        })
    })
}

module.exports = {
    storageClient: storageClient,
    entityResolver: entityResolver,

    getAllCharacters: getAllCharacters,
    saveCharacter: saveCharacter,
    getCharacter: getCharacter,
    deleteCharacter: deleteCharacter,
    joinGame: joinGame,
    leaveGame: leaveGame,

    getAllGames: getAllGames,
    getCharactersForGame: getCharactersForGame,
    saveGame: saveGame,
    getGame: getGame,
    deleteGame: deleteGame,
    completeGame: completeGame
}
const https = require('https')

function githubUser(req, res, next) {
    const authHeader = req.get('Authorization')
    if (!authHeader) {
        res.status(401).json({ message: "Please supply your github OAuth token in the Authorization header." })
    } else {
        https.get(
            "https://api.github.com/user",
            {
                headers: {
                    Authorization: authHeader,
                    'User-Agent': 'seafielp-CS496-final-project'
                }
            },
            function (res) {
                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                  try {
                    const parsedData = JSON.parse(rawData);
                    req.githubUsername = parsedData.login
                    next()
                  } catch (e) {
                    console.error(e.message);
                    next()
                  }
                });
            }
        )
    }
}

module.exports = githubUser 
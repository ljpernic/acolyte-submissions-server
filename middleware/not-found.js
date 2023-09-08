const notFound = (req, res) => res.status(404).send('Route does not exist. Sorry! ')

module.exports = notFound

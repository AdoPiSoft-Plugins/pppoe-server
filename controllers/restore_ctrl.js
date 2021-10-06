var csv = require('csvtojson')
var core = require('plugin-core')
var { dbi } = core

exports.import = async (req, res, next) => {
  try {
    let file = req.files.file
    let data = await csv().fromFile(file.tempFilePath)
    let count = 0
    let skipped = 0
    for (let c of data) {
      try {
        await dbi.models.PppoeAccount.create(c)
        count++
      } catch (e) {
        skipped++
      }
    }
    res.json({count, skipped})
  } catch (e) {
    next(e)
  }
}

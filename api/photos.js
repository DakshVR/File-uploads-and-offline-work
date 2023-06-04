/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')
const multer = require("multer")
const crypto = require("node:crypto")

const {savePhotoInfo} = require('../models/photo')
const { validateAgainstSchema } = require('../lib/validation')
const {
    PhotoSchema,
    insertNewPhoto,
    getPhotoById
} = require('../models/photo')
const { callbackify } = require('node:util')

const router = Router()



const imageTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif"
}
const upload = multer({
    storage: multer.diskStorage({
        destination: `${__dirname}/uploads`,
        filename: (req, file, callback) => {
            const filename = crypto.pseudoRandomBytes(16).toString("hex")
            const extension = imageTypes[file.mimetype]
            callback(null, `${filename}.${extension}`)
        }
    }),
    fileFilter: (req, file, callback) => {
        callback(null, !!imageTypes[file.mimetype])
    }
})

/*
 * POST /photos - Route to create a new photo.
 */
// router.post('/', async (req, res) => {
//     if (validateAgainstSchema(req.body, PhotoSchema)) {
//         try {
//             const id = await insertNewPhoto(req.body)
//             res.status(201).send({
//                 id: id
//             })
//         } catch (err) {
//             next(err)
//         }
//     } else {
//         res.status(400).send({
//             error: "Request body is not a valid photo object"
//         })
//     }
// })

/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const photo = await getPhotoById(req.params.id)
        if (photo) {
            res.status(200).send(photo)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

/*
 * POST /photos/ - Route to post photo.
 */
router.post("/",  upload.single("image"),async function (req, res, next) {
      console.log("Req File=====", req.file);
      console.log("req Body====", req.body);
      if (req.file && req.body && req.body.userId){
        const photo = {
            contentType: req.file.mimetype,
            filename: req.file.filename,
            path: req.file.path,
            userId: req.body.userId
        }
        const id = await savePhotoInfo(photo)
        res.status(200).send({
            id: id
        })
      } else{
        res.status(400).send({
            err: "Invalid File"
        })
      }
});

module.exports = router
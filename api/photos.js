/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')
const multer = require("multer")
const crypto = require("node:crypto")


const { validateAgainstSchema } = require('../lib/validation')
const {
    PhotoSchema,
    insertNewPhoto,
    getPhotoById,
    savePhotoInfo,
    savePhotoFile,
    getPhotoDownloadStreamByFileName
} = require('../models/photo')
const { callbackify } = require('node:util')

const router = Router()
const express = require('express');



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

// router.use('/media/photos', express.static('uploads/'));

router.get("/media/photos/:filename", function (req, res, next) {

    getPhotoDownloadStreamByFileName(req.params.filename)
        .on("error", function(err){
            if(err.code === "ENOENT"){
                next()
            }else{
                next(err)
            }
        })
        .on("file", function(file){
            res.status(200).type(file.metadata.contentType)
        })
        .pipe(res)
})

/*
 * GET /photos/{id} - Route to fetch info about a specific photo.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const photo = await getPhotoById(req.params.id)
        if (photo) {
            // delete photo.path
            const resBody = {
                _id: photo._id,
                filename: photo.filename,
                contentType: photo.metadata.contentType,
                userId: photo.metadata.userId,
                url: `/media/photos/${photo.filename}`
            }
            // photo.url = `/media/photos/${photo.filename}`
            res.status(200).send(resBody)
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
        // const id = await savePhotoInfo(photo)
        const id = await savePhotoFile(photo)
        // Delete Photo From Uploads
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
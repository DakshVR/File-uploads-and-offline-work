/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')

const { validateAgainstSchema } = require('../lib/validation')
const {
    PhotoSchema,
    insertNewPhoto,
    getPhotoById
} = require('../models/photo')

const router = Router()

/*
 * POST /photos - Route to create a new photo.
 */
router.post('/', async (req, res) => {
    if (validateAgainstSchema(req.body, PhotoSchema)) {
        try {
            const id = await insertNewPhoto(req.body)
            res.status(201).send({
                id: id
            })
        } catch (err) {
            next(err)
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid photo object"
        })
    }
})

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

module.exports = router

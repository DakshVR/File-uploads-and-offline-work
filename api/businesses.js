/*
 * API sub-router for businesses collection endpoints.
 */

const { Router } = require('express')

const { validateAgainstSchema } = require('../lib/validation')
const {
    BusinessSchema,
    getBusinessesPage,
    insertNewBusiness,
    getBusinessById
} = require('../models/business')

const router = Router()

/*
 * GET /businesses - Route to return a paginated list of businesses.
 */
router.get('/', async (req, res) => {
    try {
        /*
         * Fetch page info, generate HATEOAS links for surrounding pages and then
         * send response.
         */
        const businessPage = await getBusinessesPage(parseInt(req.query.page) || 1)
        businessPage.links = {}
        if (businessPage.page < businessPage.totalPages) {
            businessPage.links.nextPage = `/businesses?page=${businessPage.page + 1}`
            businessPage.links.lastPage = `/businesses?page=${businessPage.totalPages}`
        }
        if (businessPage.page > 1) {
            businessPage.links.prevPage = `/businesses?page=${businessPage.page - 1}`
            businessPage.links.firstPage = '/businesses?page=1'
        }
        res.status(200).send(businessPage)
    } catch (err) {
        next(err)
    }
})

/*
 * POST /businesses - Route to create a new business.
 */
router.post('/', async (req, res) => {
    if (validateAgainstSchema(req.body, BusinessSchema)) {
        try {
            const id = await insertNewBusiness(req.body)
            res.status(201).send({
                id: id
            })
        } catch (err) {
            next(err)
        }
    } else {
        res.status(400).send({
            error: "Request body is not a valid business object."
        })
    }
})

/*
 * GET /businesses/{id} - Route to fetch info about a specific business.
 */
router.get('/:id', async (req, res, next) => {
    try {
        const business = await getBusinessById(req.params.id)
        if (business) {
            res.status(200).send(business)
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

module.exports = router

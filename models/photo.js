/*
 * Photo schema and data accessor methods.
 */

const { ObjectId } = require('mongodb')

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')

/*
 * Schema describing required/optional fields of a photo object.
 */
const PhotoSchema = {
    businessId: { required: true },
    caption: { required: false }
}
exports.PhotoSchema = PhotoSchema

/*
 * Executes a DB query to insert a new photo into the database.  Returns
 * a Promise that resolves to the ID of the newly-created photo entry.
 */
async function insertNewPhoto(photo) {
    photo = extractValidFields(photo, PhotoSchema)
    photo.businessId = ObjectId(photo.businessId)
    const db = getDbReference()
    const collection = db.collection('photos')
    const result = await collection.insertOne(photo)
    return result.insertedId
}
exports.insertNewPhoto = insertNewPhoto

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
    const db = getDbReference()
    const collection = db.collection('photos')
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const results = await collection
        .find({ _id: new ObjectId(id) })
        .toArray()
        return results[0]
    }
}
exports.getPhotoById = getPhotoById

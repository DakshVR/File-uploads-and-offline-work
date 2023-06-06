/*
 * Photo schema and data accessor methods.
 */

const { ObjectId, GridFSBucket } = require('mongodb')
const fs = require("node:fs")

const { getDbReference } = require('../lib/mongo')
const { extractValidFields } = require('../lib/validation')
const { getBusinessById } = require('./business')

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
// async function insertNewPhoto(photo) {
//     photo = extractValidFields(photo, PhotoSchema)
//     photo.businessId = ObjectId(photo.businessId)
//     const db = getDbReference()
//     const collection = db.collection('photos')
//     const result = await collection.insertOne(photo)
//     return result.insertedId
// }
// exports.insertNewPhoto = insertNewPhoto

async function savePhotoInfo(photo){
    const db = getDbReference()
    const collection = db.collection('photos')
    const result = await collection.insertOne(photo)
    return result.insertedId
}
exports.savePhotoInfo = savePhotoInfo

async function savePhotoFile(photo){
    return new Promise(function(resolve, reject){
        const db = getDbReference()
        const bucket = new GridFSBucket(db, { bucketName: "photos"})
        const metaDeta = {
            contentType: photo.contentType,
            userId: photo.userId,
            businessId: new ObjectId(photo.businessId)     
        }

        const uploadStream = bucket.openUploadStream(
            photo.filename,
            
            { metadata: metaDeta}
        )

        fs.createReadStream(photo.path).pipe(uploadStream)
            .on("error", function (err){
                reject(err)
            })
            .on("finish", function(result){
                resolve(result._id)
            })
    })
} 
exports.savePhotoFile = savePhotoFile

async function saveNewThumbnail(filename, photoId) {
    return new Promise(function (resolve, reject) {
      // photo = extractValidFields(photo, PhotoSchema)
      // photo.businessId = ObjectId(photo.businessId)
      const db = getDbReference();
  
      const bucket = new GridFSBucket(db, { bucketName: "thumbs" });
      const metadata = { contentType: "image/jpeg", photoId: photoId };
      const uploadStream = bucket.openUploadStream(filename, {
        metadata: metadata,
      });
      fs.readdirSync("thumbs/").forEach((file) => {
        console.log(file);
      });
      fs.createReadStream(`thumbs/${filename}`)
        .pipe(uploadStream)
        .on("error", function (err) {
          reject(err);
        })
        .on("finish", function (result) {
          resolve(result._id);
        });
    });
  }
exports.saveNewThumbnail = saveNewThumbnail;

/*
 * Executes a DB query to fetch a single specified photo based on its ID.
 * Returns a Promise that resolves to an object containing the requested
 * photo.  If no photo with the specified ID exists, the returned Promise
 * will resolve to null.
 */
async function getPhotoById(id) {
    const db = getDbReference()
    // const collection = db.collection('photos')
    const bucket = new GridFSBucket(db, { bucketName: "photos"})
    
    if (!ObjectId.isValid(id)) {
        return null
    } else {
        const results = await bucket.find({_id: new ObjectId(id)})
            .toArray()
        // const results = await collection
        // .find({ _id: new ObjectId(id) })
        // .toArray()
        return results[0]
    }
}
exports.getPhotoById = getPhotoById


exports.getPhotoDownloadStreamByFileName = function (filename) {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: "photos" })
    return bucket.openDownloadStreamByName(filename)
}

exports.getDownloadStreamById = function (id) {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: "photos" });
    if (!ObjectId.isValid(id)) {
      return null;
    } else {
      return bucket.openDownloadStream(new ObjectId(id));
    }
  };

exports.getThumbsDownloadStreamByFilename = function (filename) {
    const db = getDbReference();
    const bucket = new GridFSBucket(db, { bucketName: "thumbs" });
    return bucket.openDownloadStreamByName(filename);
  };

exports.updateThumdId = async function (id, thumbId) {
    const db = getDbReference();
    const collection = db.collection("photos.files");
    if (!ObjectId.isValid(id)) {
      return null;
    } else {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { thumbId: thumbId } }
      );
    }
  };

exports.updateImageTagsById = async function (id, tags) {
    const db = getDbReference();
    const collection = db.collection("photos.files");
    if (!ObjectId.isValid(id)) {
      return null;
    } else {
      const result = await collection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { "metadata.tags": tags } }
      );
      return result.matchedCount > 0;
    }
  };

  
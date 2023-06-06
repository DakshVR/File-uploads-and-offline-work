const { Router, static } = require("express");
const express = require("express");
const { getPhotoDownloadStreamByFileName, getThumbsDownloadStreamByFilename } = require("../models/photo");
const router = Router();

router.get("/photos/:filename", function (req, res, next) {
  getPhotoDownloadStreamByFileName(req.params.filename)
    .on("error", function (err) {
      if (err.code === "ENOENT") {
        next();
      } else {
        next(err);
      }
    })
    .on("file", function (file) {
      res.status(200).type(file.metadata.contentType);
    })
    .pipe(res);
});
router.get("/thumbs/:filename", function (req, res, next) {
  getThumbsDownloadStreamByFilename(req.params.filename)
    .on("error", function (err) {
      if (err.code === "ENOENT") {
        next();
      } else {
        next(err);
      }
    })
    .on("file", function (file) {
      res.status(200).type(file.metadata.contentType);
    })
    .pipe(res);
});


module.exports = router;



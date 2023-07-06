
# Assignment 4

**Assignment due at 11:59pm on Monday 6/5/2023**<br/>
**Demo due by 5:00pm on Friday 6/16/2023**

The goal of this assignment is to incorporate file storage into our API and to start using RabbitMQ to perform some basic offline data enrichment.  There are a few parts to this assignment, described below.

You are provided some starter code in this repository that uses MongoDB as a backing to implement a reduced subset of the businesses API we've been working with all term.  The starter code contains the following components:
  * An API server is implemented in `server.js`.
  * Individual API routes are modularized within the `api/` directory.
  * Sequelize models are implemented in the `models/` directory.
  * A script in `initDb.js` that populates the database with initial data from the `data/` directory.  You can run this script by running `npm run initdb`.

Feel free to use this code as your starting point for this assignment.  You may also use your own solution to assignment 2 and/or assignment 3 as your starting point if you like.

## 1. Support photo file uploads

Your first task for the assignment is to modify the `POST /photos` endpoint to support actual photo uploads.  Specifically, you should update this endpoint to expect a multipart form-data body that contains a `file` field in addition to the fields currently supported by the endpoint (`businessId` and `caption`).  In requests to this endpoint, the `file` field should specifically contain raw binary data for an image file.  The endpoint should accept images in either the JPEG (`image/jpeg`) or PNG (`image/png`) format.  Files in any other format should result in the API server returning an error response.

## 2. Store uploaded photo data in GridFS

Once your API successfully accepts image file uploads to the `POST /photos` endpoint, you should modify the API to store those image files in GridFS in the MongoDB database that's already powering the API.  Photo metadata corresponding the image files (i.e. `businessId` and `caption`) should be stored alongside the files themselves.

Once your API is storing photo data in GridFS, it should no longer use the `photos` MongoDB collection in which it currently stores photo metadata.  In other words, all data related to the `photos` collection should be stored in GridFS.  This will require you to update other API endpoints to work with the data stored in GridFS, including:
  * `GET /businesses/{id}`
  * `GET /photos/{id}`

Once a photo is saved in GridFS, you should make it available for download via a URL with the following format, where `{id}` represents the ID of the photo and the file extension (`.jpg` or `.png`) is based on the format of the uploaded image:
```
/media/photos/{id}.jpg
```
OR
```
/media/photos/{id}.png
```
Make sure to include this URL in responses from the `GET /photos/{id}` endpoint, so clients will know how to download the image.

## 3. Add an offline thumbnail generation process

Your final task in the assignment is to add an offline data enrichment process that generates a 100x100 thumbnail version of every photo uploaded to the API.  This offline data enrichment process should be facilitated using a RabbitMQ queue.  This task can be broken into a few separate steps:

  * **Start a RabbitMQ daemon running in a Docker container.**  You can do this with the [official RabbitMQ Docker image](https://hub.docker.com/_/rabbitmq/).

  * **Turn your API server into a RabbitMQ producer.**  Specifically, each time a new photo is uploaded and stored into your GridFS database, your API server should add a new task to a RabbitMQ queue corresponding to the new photo that was just uploaded.  The task should contain information (e.g. the ID of the just-uploaded photo) that will eventually allow RabbitMQ consumers (which you'll write) to fetch the original image file out of GridFS.

  * **Implement a RabbitMQ consumer that generates thumbnail images.**  Your consumer should specifically use information from each RabbitMQ message it processes to fetch a photo file from GridFS and generate a resized and/or cropped thumbnail version of that photo that is 100px wide and 100px high.  All thumbnail images should be in JPEG format (i.e. `image/jpeg`).

    Thumbnail images should be stored in GridFS in a *different* bucket than the one where original images are stored (e.g. store original photos in a bucket called `photos` and thumbnail images in a bucket called `thumbs`).

    There are multiple packages on NPM you can use to actually perform the image resizing itself, including [Jimp](https://www.npmjs.com/package/jimp) and [sharp](https://www.npmjs.com/package/sharp).  Each of these has a straightforward interface.  However, you're free to use whatever tool you like to perform the resizing.

  * **Create an association between the original photo and its thumbnail.**  After your RabbitMQ consumer generates a thumbnail image and stores it in GridFS, you'll need to represent the one-to-one association between original and thumbnail so you can "find" the thumbnail from the original image.  The easiest way to do this is, once the thumbnail is generated and stored in GridFS, to store the database ID of the thumbnail image within the metatata for the *original* photo in the database.  For example, you could add a `thumbId` field to the original photo's metatata:
    ```
    {
      "businessId": ObjectId("..."),
      "caption": "...",
      "thumbId": ObjectId("...")
    }
    ```

    Doing this will allow you to easily access the thumbnail image once you've fetched the metadata for the original photo.

  * **Make the thumbnails available for download.**  Finally, once thumbnails are generated and linked to their originals, you should make it possible for clients to download them.  Thumbnails should be downloadable through a URL with the following format, where `{id}` is the ID of the *original* photo corresponding to the thumbnail:
    ```
    /media/thumbs/{id}.jpg
    ```
    To facilitate downloading a photo's thumbnail, the thumbnail's URL should be included in the response from the `GET /photos/{id}` endpoint.

    **Again, it's important that the same ID should be used to download both the original photo and its thumbnail.**  This should be the same ID that's used to fetch photo information from the `GET /photos/{id}` endpoint.  For example the following requests should all fetch a different kind of information related to the original photo with ID "5ce48a2ddf60d448aed2b1c1" (metadata, original photo bytes, and thumbnail photo bytes):
    ```
    GET /photos/5ce48a2ddf60d448aed2b1c1
    GET /media/photos/5ce48a2ddf60d448aed2b1c1.jpg
    GET /media/thumbs/5ce48a2ddf60d448aed2b1c1.jpg
    ```

When your consumer is working correctly, you should be able to launch one or more instances of the consumer running alongside your API server, the RabbitMQ daemon, and the MongoDB server, and you should be able to see the consumers processing photos as they're uploaded.  Note that only the RabbitMQ daemon and the MongoDB server need to be run within Docker containers.  The API server and RabbitMQ consumer(s) can run either in Docker or directly on your host machine.

## Running code in GitHub Codespaces

For this assignment, I've enabled a feature called [GitHub Codespaces](https://docs.github.com/en/codespaces/) that will provide you with a private online environment where you can develop and test your code for the assignment.  This environment will be centered around a browser-based version of the [VS Code](https://code.visualstudio.com/) editor.  You can access the Codespace by clicking "Create codespace on main" under the "Code" button in your assignment repository on GitHub:

![Image of GitHub Codespaces button](https://www.dropbox.com/s/wvijvh130fjuud5/Screen%20Shot%202022-05-24%20at%2011.17.58%20AM.png?raw=true)

You may use this browser-based editor as much or as little as you like, and in general, I encourage you to stick with whatever development setup already works best for you (i.e. your preferred editor running on your preferred development machine).

The reason I'm providing the Codespace is to provide an environment where it will be easy to use Docker if you've been having trouble running Docker on your development machine.  In particular, Docker should be already installed in the Codespace when you launch it, and you can use it through the Codespace terminal just as we discussed in lecture.

You can access the Codespace terminal through the menu of the browser-based version of VS Code associated with the Codespace:

![Image of Codespace terminal access](https://www.dropbox.com/s/nqebudssjvcwyw5/Screen%20Shot%202022-05-24%20at%2011.45.34%20AM.png?raw=true)

Inside this terminal, you should be able to run your code as described above.

If you're editing outside the browser-based version of VS Code associated with your Codespace, and you want to test your code inside the Codespace, you'll need to make sure you use Git to pull your most recent commit(s) into the Codespace.  You can do this through the browser-based VS Code's Git integration:

![Image of VS Code Git pull command](https://www.dropbox.com/s/d4rlv954af0q6r4/Screen%20Shot%202022-05-24%20at%2011.37.23%20AM.png?raw=true)

## Submission

We'll be using GitHub Classroom for this assignment, and you will submit your assignment via GitHub.  Just make sure your completed files are committed and pushed by the assignment's deadline to the main branch of the GitHub repo that was created for you by GitHub Classroom.  A good way to check whether your files are safely submitted is to look at the main branch your assignment repo on the github.com website (i.e. https://github.com/osu-cs493-sp23/assignment-4-YourGitHubUsername/). If your changes show up there, you can consider your files submitted.

## Grading criteria

This assignment is worth 100 total points, broken down as follows:

  * 20 points: API has a `POST /photos` endpoint that supports image uploads through multipart formdata request bodies
    * 5 points: `POST /photos` endpoint correctly accepts multipart formdata bodies
    * 5 points: Image file data is correctly extracted from multipart formdata bodies
    * 5 points: Only image files of the specified types are accepted by `POST /photos`
    * 5 points: Non-file fields `businessId` and `caption` are correctly handled by `POST /photos`

  * 30 points: API correctly stores uploaded images in GridFS and makes them available for download
    * 10 points: Photo files are correctly stored in a GridFS bucket
    * 5 points: `GET /photos/{id}` and `GET /businesses/{id}` correctly retrieve relevant photo meta data from GridFS
    * 10 points: Photo files can be downloaded from GridFS through `GET /media/photos/{id}.png` or `GET /media/photos/{id}.jpg`
    * 5 points: `{id}` in `GET /media/photos/{id}...` matches `{id}` used in `GET /photos/{id}`

  * 30 points: API correctly uses an offline process powered by RabbitMQ to generate thumbnail images and store them in GridFS
    * 5 points: API server correctly generates a RabbitMQ task each time a photo is uploaded
    * 10 points: Offline process correctly consumes RabbitMQ tasks and reads photo files from GridFS
    * 5 points: Offline process correctly generates a 100x100 thumbnail image of each uploaded photo
    * 10 points: Offline process correctly stores thumbnail images in GridFS
    * 5 points: Thumbnail info correctly included in photo metadata retrieved from `GET /photos/{id}`
    * 10 points: Thumbnail image files can be downloaded from GridFS through `GET /media/thumbs/{id}.jpg`
    * 5 points: `{id}` in `GET /media/thumbs/{id}.jpg` matches `{id}` used in `GET /photos/{id}`

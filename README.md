
## 1. Support photo file uploads
## 2. Store uploaded photo data in GridFS
Once a photo is saved in GridFS, it is available for download via a URL:
```
/media/photos/{id}.jpg
```
OR
```
/media/photos/{id}.png
```
## 3. Add an offline thumbnail generation process

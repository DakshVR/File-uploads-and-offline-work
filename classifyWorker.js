const mobilenet = require("@tensorflow-models/mobilenet");
const {
  getDownloadStreamById,
  updateImageTagsById,
  getPhotoById,
  getImageDownloadStreamByFilename,
  saveNewThumbnail,
} = require("./models/photo");

const { connectToRabbitMQ, getChannel } = require("./lib/rabbitmq");
const { connectToDb } = require("./lib/mongo");
const Jimp = require("jimp");

async function run() {
  await connectToRabbitMQ("photos");
  const channel = getChannel();
  channel.consume("photos", async (msg) => {
    if (msg) {
      const id = msg.content.toString();
      const downloadStream = getDownloadStreamById(id);

      const imageData = [];
      downloadStream.on("data", function (data) {
        imageData.push(data);
      });
      downloadStream.on("end", async function () {
        const imgBuffer = Buffer.concat(imageData);
        const tags = ["cat"];
        const result = await updateImageTagsById(id, tags);
        const photo = await getPhotoById(id);

        const fullimage = await Jimp.read(imgBuffer);
        await fullimage.resize(100, 100);

        await fullimage.writeAsync(`thumbs/${photo.filename}`);

        const thumbId = await saveNewThumbnail(photo.filename, photo._id);
        await updateThumdId(id, thumbId);
      });
    }
    channel.ack(msg);
  });
}

connectToDb(function () {
  run();
});

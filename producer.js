const amqp = require("amqplib")

const rabbitMqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitMqUrl = `amqp://${rabbitMqHost}`

async function run() {
    try {
        const connection = await amqp.connect(rabbitMqUrl)
        const channel = await connection.createChannel();
        await channel.assertQueue("echo")

        const message = "The quick brown fox jumped over the lazy dog"
        message.split(" ").forEach(word => {
            channel.sendToQueue("echo", Buffer.from(word))
        })
        setTimeout(() => connection.close(), 1000)
    } catch (err) {
        console.error(err)
    }
}

run()
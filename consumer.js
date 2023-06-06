const amqp = require("amqplib")

const rabbitMqHost = process.env.RABBITMQ_HOST || "localhost"
const rabbitMqUrl = `amqp://${rabbitMqHost}`

async function run() {
    try {
        const connection = await amqp.connect(rabbitMqUrl)
        const channel = await connection.createChannel();
        await channel.assertQueue("echo")

        channel.consume("echo", msg => {
            if (msg) {
                console.log(msg.content.toString())
            }
            channel.ack(msg)
        })
    } catch (err) {
        console.error(err)
    }
}

run()
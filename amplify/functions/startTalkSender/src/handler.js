export async function handler(event) {
  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const newItem = record.dynamodb.NewImage;

      const sender = newItem.sender.S;
      const message = newItem.message.S;
      const room = newItem.room.S;
      const createdAt = newItem.createdAt.S;
      const expireAt = newItem.expireAt.S;

      return {
        sender,
        message,
        room,
        createdAt
      };
    }
  }
}
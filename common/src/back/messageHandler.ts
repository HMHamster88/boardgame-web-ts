export interface TypedMessage {
    type: string
}

export type MessageTypeOf<T extends TypedMessage> = T['type']

type MessageHandler<T extends TypedMessage> = (message: T) => void

export type MesasgeHandlers<T extends TypedMessage> = {
    [K in Pick<T, 'type'>['type']]: MessageHandler<Extract<T, { type: K }>>
}

export async function handleMessage<T extends TypedMessage>(handlers: MesasgeHandlers<T>, message: TypedMessage): Promise<boolean> {
    const handler = (handlers as any)[message.type]
    if (handler) {
        try {
            await handler(message)
            return true
        } catch (error) {
            console.error('Handle message error', error)
            return false
        }

    }
    return false
}
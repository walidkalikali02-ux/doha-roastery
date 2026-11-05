type SendResponse = {
  data: { id: string } | null
  error: { message: string; statusCode?: number | null } | null
}

export async function deliverOrderEmail(options: {
  notifiedAt: string | null
  send: () => Promise<SendResponse>
  markSent: () => Promise<void>
  wait?: (milliseconds: number) => Promise<void>
}) {
  if (options.notifiedAt) return { sent: true, newlySent: false }

  const wait = options.wait ?? ((ms) => new Promise<void>((resolve) => setTimeout(resolve, ms)))
  let accepted = false
  let message = 'Email delivery failed'

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      // Once accepted, retry only the database write, never the email itself.
      if (!accepted) {
        const { data, error } = await options.send()
        if (error) {
          message = error.message
          if (error.statusCode && error.statusCode < 500 && ![409, 429].includes(error.statusCode)) {
            break
          }
          throw new Error(message)
        }
        if (!data?.id) throw new Error('Email provider returned no message ID')
        accepted = true
      }
      await options.markSent()
      return { sent: true, newlySent: true }
    } catch (error) {
      message = error instanceof Error ? error.message : String(error)
      if (attempt < 2) await wait(1000 * 2 ** attempt)
    }
  }

  return { sent: false, newlySent: false, error: message }
}

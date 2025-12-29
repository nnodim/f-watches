import { addDataAndFileToRequest, Endpoint } from 'payload'

export const VerifyEmailEndpoint: Endpoint = {
  path: '/verify/:token',
  method: 'get',
  handler: async (req) => {
    await addDataAndFileToRequest(req)
    const token = req.routeParams?.token ?? ''

    // Find user with this token
    const result = await req.payload.find({
      collection: 'users',
      where: {
        _verificationToken: {
          equals: token,
        },
      },
    })

    if (result.docs.length > 0) {
      const user = result.docs[0]

      // Mark as verified and clear the token
      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          _verified: true,
          _verificationToken: null,
        },
      })

      return Response.json({ success: true }, { status: 200 })
    } else {
      return Response.json({ error: 'Invalid token' }, { status: 400 })
    }
  },
}

import prisma from '@/lib/prisma'
import { requireAuth, requireRole } from '@/lib/middleware'

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const current = await requireAuth(req)
  if (!current)
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  const id = params.id
  const hospital = await prisma.hospital.findUnique({ where: { id } })
  if (!hospital)
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })

  // ✅ Only superAdmin/government or hospital owner
  if (!requireRole(current, ['superAdmin', 'government']) && hospital.userId !== current.id)
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  // ✅ Prevent access if hospital is not verified
  if (!hospital.isVerified)
    return new Response(JSON.stringify({ error: 'this hospital is not verified yet' }), { status: 403 })

  return new Response(
    JSON.stringify({
      hospital,
      message: `Hospital "${hospital.name}" is verified and active.`,
    }),
    { status: 200 }
  )
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const current = await requireAuth(req)
  if (!current)
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  const id = params.id
  const body = await req.json().catch(() => ({}))
  const hospital = await prisma.hospital.findUnique({ where: { id } })
  if (!hospital)
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })

  // ✅ Only superAdmin/government or hospital owner can update
  if (!requireRole(current, ['superAdmin', 'government']) && hospital.userId !== current.id)
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const data: any = {}
  if (body.name) data.name = body.name
  if (body.code) data.code = body.code
  if (body.description) data.description = body.description
  if (body.address) data.address = body.address
  if (body.phone) data.phone = body.phone
  if (body.email) data.email = body.email.toLowerCase()
  if (body.password) data.password = body.password
  if (body.licenseNo) data.licenseNo = body.licenseNo
  if (body.licenseTakeDate) data.licenseTakeDate = new Date(body.licenseTakeDate)
  if (body.licenseExpiryDate) data.licenseExpiryDate = new Date(body.licenseExpiryDate)
  if (typeof body.isActive === 'boolean') data.isActive = body.isActive

  // ✅ Recalculate isVerified based on completion of required fields
  const finalData = { ...hospital, ...data }
  const isNowComplete =
    finalData.name &&
    finalData.code &&
    finalData.email &&
    finalData.password &&
    finalData.licenseNo &&
    finalData.address &&
    finalData.phone &&
    finalData.description &&
    finalData.licenseTakeDate &&
    finalData.licenseExpiryDate

  data.isVerified = !!isNowComplete

  try {
    const updated = await prisma.hospital.update({ where: { id }, data })
    return new Response(
      JSON.stringify({
        hospital: updated,
        message: updated.isVerified
          ? `Hospital "${updated.name}" is now verified and active.`
          : `Hospital "${updated.name}" information updated but still incomplete.`,
      }),
      { status: 200 }
    )
  } catch (e) {
    return new Response(JSON.stringify({ error: 'update failed', details: String(e) }), { status: 400 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const current = await requireAuth(req)
  if (!current)
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  const id = params.id
  const hospital = await prisma.hospital.findUnique({ where: { id } })
  if (!hospital)
    return new Response(JSON.stringify({ error: 'not found' }), { status: 404 })

  // ✅ Only superAdmin/government or hospital owner
  if (!requireRole(current, ['superAdmin', 'government']) && hospital.userId !== current.id)
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  try {
    await prisma.hospital.delete({ where: { id } })
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'delete failed', details: String(e) }), { status: 400 })
  }
}

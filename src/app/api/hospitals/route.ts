import prisma from '@/lib/prisma'
import { hashPassword } from '@/lib/password'
import { requireAuth, requireRole } from '@/lib/middleware'

// Create a hospital (POST) and list hospitals (GET)
export async function POST(req: Request) {
  const current = await requireAuth(req)
  if (!current)
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  if (!requireRole(current, ['superAdmin', 'government']))
    return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403 })

  const body = await req.json().catch(() => ({}))
  const {
    name,
    code,
    description,
    address,
    phone,
    email,
    licenseNo,
    licenseTakeDate,
    licenseExpiryDate,
    password,
  } = body

  // ✅ check required fields
  if (!name || !code || !email || !licenseNo || !licenseTakeDate || !licenseExpiryDate || !password)
    return new Response(
      JSON.stringify({
        error:
          'Missing required fields: name, code, email, licenseNo, licenseTakeDate, licenseExpiryDate, password',
      }),
      { status: 400 }
    )

  // ✅ user cannot register multiple hospitals
  const existingHospital = await prisma.hospital.findFirst({
    where: { userId: current.id },
  })
  if (existingHospital)
    return new Response(
      JSON.stringify({ error: 'You already have a registered hospital.' }),
      { status: 403 }
    )

  // ✅ check uniqueness for hospital info
  const exists = await prisma.hospital.findFirst({
    where: {
      OR: [{ name }, { code }, { email }, { licenseNo }],
    },
  })
  if (exists)
    return new Response(
      JSON.stringify({
        error:
          'hospital with same name/code/email/licenseNo already exists',
      }),
      { status: 409 }
    )

  // ✅ hash password before saving
  const hashedPassword = await hashPassword(password)

  // ✅ verify only if all info is provided and valid
  const isFullyCompleted =
    !!(
      name &&
      code &&
      email &&
      licenseNo &&
      licenseTakeDate &&
      licenseExpiryDate &&
      address &&
      phone &&
      description
    )

  // ✅ create hospital
  const created = await prisma.hospital.create({
    data: {
      name,
      code,
      description: description || '',
      address: address || '',
      phone: phone || '',
      email: email.toLowerCase(),
      password: hashedPassword,
      licenseNo,
      licenseTakeDate: new Date(licenseTakeDate),
      licenseExpiryDate: new Date(licenseExpiryDate),
      userId: current.id,
      isActive: true, // default active
      isVerified: isFullyCompleted, // verified only if info is complete
    },
  })

  // ✅ create hospital admin user automatically
  await prisma.hospitalUser.create({
    data: {
      name: `${created.name} Admin`,
      email: created.email,
      phone: created.phone || '',
      password: hashedPassword,
      role: 'admin',
      hospitalId: created.id,
      hospitalName: created.name,
    },
  })

  const message = created.isVerified
    ? `Hospital "${created.name}" has been successfully registered, verified, and activated.`
    : `Hospital "${created.name}" has been registered but not yet verified. Please complete all required info.`

  return new Response(
    JSON.stringify({ hospital: created, message }),
    { status: 201 }
  )
}

export async function GET(req: Request) {
  const current = await requireAuth(req)
  if (!current)
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401 })

  // superAdmin/government can see all hospitals
  if (requireRole(current, ['superAdmin', 'government'])) {
    const hospitals = await prisma.hospital.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return new Response(JSON.stringify({ hospitals }), { status: 200 })
  }

  // non-admin users: only see their own hospital(s)
  const hospitals = await prisma.hospital.findMany({
    where: { userId: current.id },
    orderBy: { createdAt: 'desc' },
  })
  return new Response(JSON.stringify({ hospitals }), { status: 200 })
}

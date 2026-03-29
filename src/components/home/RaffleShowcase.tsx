import { Button } from '@/components/ui/button'
import configPromise from '@payload-config'
import Link from 'next/link'
import { getPayload } from 'payload'

export async function RaffleShowcase() {
  const payload = await getPayload({ config: configPromise })
  const raffles = await payload.find({
    collection: 'raffles',
    depth: 0,
    limit: 1,
    pagination: false,
    where: {
      status: {
        in: ['scheduled', 'open'],
      },
    },
  })

  const raffle = raffles.docs[0]

  if (!raffle) return null

  return (
    <section className="container mt-14 w-full">
      <div className="overflow-hidden rounded-3xl md:rounded-[2.5rem] border bg-linear-to-br from-[#15090a] via-[#3b0f12] to-[#120505] text-white shadow-[0_30px_100px_rgba(136,18,26,0.28)] w-full">
        <div className="w-full grid gap-10 px-3 py-4 md:px-10 md:py-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-14">
          <div className="space-y-6 w-full">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.35em] text-[#f7d27c]">Live Raffle</p>
              <h2 className="max-w-xl w-full text-3xl font-semibold leading-tight md:text-5xl">
                {raffle.title}
              </h2>
              <p className="max-w-xl w-full text-base leading-7 text-white/75">
                {raffle.description ||
                  'Buy a raffle ticket on our site and get a shot at winning something special before draw day.'}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Ticket Price</p>
                <p className="mt-2 text-2xl font-semibold text-[#f7d27c]">
                  ₦{((raffle.ticketPrice ?? 0) / 100).toLocaleString()}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Draw Date</p>
                <p className="mt-2 text-lg font-semibold">
                  {new Date(raffle.drawDate).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-white/55">Prize</p>
                <p className="mt-2 text-lg font-semibold">
                  {raffle.prizeType === 'free' ? 'Free Watch' : '50% Off'}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild className="bg-[#f7d27c] text-black hover:bg-[#ffe4a7]">
                <Link href={raffle.slug ? `/raffles/${raffle.slug}` : '/raffles'}>Buy raffle</Link>
              </Button>
              {/* <Button
                asChild
                variant="outline"
                className="border-white/15 bg-white/5 text-white hover:bg-white/10"
              >
                <Link href="/raffles">See All Raffles</Link>
              </Button> */}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <div className="relative h-88 w-88 max-w-full sm:h-104 sm:w-104">
              <img src="/images/raffle.png" className='animate-spin' alt="" />
              {/* <svg
                className="h-full w-full drop-shadow-[0_20px_45px_rgba(247,210,124,0.25)]"
                viewBox="0 0 400 400"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <radialGradient id="wheelGlow" cx="50%" cy="50%" r="60%">
                    <stop offset="0%" stopColor="#fff6d7" />
                    <stop offset="60%" stopColor="#f6cf75" />
                    <stop offset="100%" stopColor="#9d5a10" />
                  </radialGradient>
                  <radialGradient id="wheelCenter" cx="50%" cy="50%" r="55%">
                    <stop offset="0%" stopColor="#ffe8ad" />
                    <stop offset="100%" stopColor="#b77219" />
                  </radialGradient>
                </defs>

                <circle cx="200" cy="200" r="188" fill="url(#wheelGlow)" />
                <circle cx="200" cy="200" r="164" fill="#fdf0cc" opacity="0.9" />

                {[
                  '#d6182d',
                  '#ffe8b4',
                  '#d6182d',
                  '#ffe8b4',
                  '#d6182d',
                  '#ffe8b4',
                  '#d6182d',
                  '#ffe8b4',
                  '#d6182d',
                  '#ffe8b4',
                  '#d6182d',
                  '#ffe8b4',
                ].map((fill, index) => {
                  const startAngle = index * 30 - 90
                  const endAngle = startAngle + 30
                  const startRadians = (Math.PI / 180) * startAngle
                  const endRadians = (Math.PI / 180) * endAngle
                  const x1 = 200 + 164 * Math.cos(startRadians)
                  const y1 = 200 + 164 * Math.sin(startRadians)
                  const x2 = 200 + 164 * Math.cos(endRadians)
                  const y2 = 200 + 164 * Math.sin(endRadians)

                  return (
                    <path
                      key={index}
                      d={`M 200 200 L ${x1} ${y1} A 164 164 0 0 1 ${x2} ${y2} Z`}
                      fill={fill}
                      opacity={fill === '#d6182d' ? 0.96 : 0.94}
                    />
                  )
                })}

                {[
                  { label: 'FREE', x: 124, y: 96, rotate: -58 },
                  { label: '50%', x: 258, y: 92, rotate: 56 },
                  { label: 'SPIN', x: 312, y: 210, rotate: 90 },
                  { label: 'WIN', x: 245, y: 320, rotate: 150 },
                  { label: 'LUCK', x: 95, y: 306, rotate: -150 },
                  { label: 'TRY', x: 78, y: 200, rotate: -90 },
                ].map((item) => (
                  <text
                    key={item.label}
                    fill={item.label === 'SPIN' || item.label === 'WIN' ? '#fff6da' : '#6f050f'}
                    fontFamily="var(--font-montserrat)"
                    fontSize="22"
                    fontWeight="700"
                    textAnchor="middle"
                    transform={`rotate(${item.rotate} ${item.x} ${item.y})`}
                    x={item.x}
                    y={item.y}
                  >
                    {item.label}
                  </text>
                ))}

                <circle cx="200" cy="200" r="58" fill="#ffe8b4" opacity="0.45" />
                <circle cx="200" cy="200" r="28" fill="url(#wheelCenter)" />
                <path d="M200 12 L220 54 L180 54 Z" fill="#f7d27c" />
                <circle cx="200" cy="200" r="8" fill="#7d4200" />
              </svg> */}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

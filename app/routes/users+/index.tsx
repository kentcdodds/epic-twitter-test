import { json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { prisma } from '~/utils/db.server.ts'
import { getUserImgSrc } from '~/utils/misc.ts'

export async function loader() {
	const users = await prisma.user.findMany({
		select: {
			id: true,
			name: true,
			username: true,
			imageId: true,
		},
	})
	return json({ users })
}

export default function UsersIndex() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="container mx-auto">
			<h1 className="text-h1">Users</h1>
			<div className="rounded-3xl bg-night-500 px-12 py-8">
				<ul className="flex flex-wrap justify-center gap-8">
					{data.users.map(user => (
						<li key={user.id}>
							<Link to={user.username} className="flex flex-col gap-2">
								<img
									src={getUserImgSrc(user.imageId)}
									alt={user.name ?? user.username}
									className="h-36 w-36 rounded-full"
								/>
								<div>{user.name}</div>
								<div className="text-day-400">{user.username}</div>
							</Link>
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}

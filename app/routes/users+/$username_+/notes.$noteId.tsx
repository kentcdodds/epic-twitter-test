import { json, type DataFunctionArgs } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import invariant from 'tiny-invariant'
import { GeneralErrorBoundary } from '~/components/error-boundary.tsx'
import { DeleteNote } from '~/routes/resources+/delete-note.tsx'
import { getUserId, requireUserId } from '~/utils/auth.server.ts'
import { prisma } from '~/utils/db.server.ts'
import { ButtonLink } from '~/utils/forms.tsx'

export async function loader({ request, params }: DataFunctionArgs) {
	const userId = await getUserId(request)
	const note = await prisma.note.findUnique({
		where: {
			id: params.noteId,
		},
		select: {
			id: true,
			title: true,
			content: true,
			ownerId: true,
		},
	})
	const favorite = userId
		? await prisma.favorite.findFirst({
				where: {
					ownerId: userId,
					noteId: params.noteId,
				},
				select: { id: true },
		  })
		: null
	if (!note) {
		throw new Response('Not found', { status: 404 })
	}
	return json({
		note,
		isFavorited: Boolean(favorite),
		isOwner: userId === note.ownerId,
	})
}

export async function action({ request, params }: DataFunctionArgs) {
	const userId = await requireUserId(request)
	invariant(params.noteId, 'noteId is required')
	const form = await request.formData()
	const isFavorited = form.get('isFavorited') === 'true'
	if (isFavorited) {
		await prisma.favorite.create({
			select: { id: true },
			data: {
				ownerId: userId,
				noteId: params.noteId,
			},
		})
	} else {
		await prisma.favorite.deleteMany({
			where: {
				ownerId: userId,
				noteId: params.noteId,
			},
		})
	}
	return json({ status: 'success' })
}

export default function NoteRoute() {
	const data = useLoaderData<typeof loader>()
	const favoriteFetcher = useFetcher()

	const pendingFavorite = favoriteFetcher.state !== 'idle'
	const isFavorite = pendingFavorite
		? favoriteFetcher.formData?.get('isFavorited') === 'true'
		: data.isFavorited

	return (
		<div className="flex h-full flex-col">
			<div className="flex-grow">
				<h2 className="mb-2 text-h2 lg:mb-6">{data.note.title}</h2>
				<p className="text-sm md:text-lg">{data.note.content}</p>
			</div>
			<div className="flex justify-end gap-4">
				<favoriteFetcher.Form method="POST">
					<input
						type="hidden"
						name="isFavorited"
						value={(!isFavorite).toString()}
					/>
					<button type="submit">{isFavorite ? '❤️' : '🖤'}</button>
				</favoriteFetcher.Form>
				{data.isOwner ? (
					<>
						<DeleteNote id={data.note.id} />
						<ButtonLink size="md" variant="primary" to="edit">
							Edit
						</ButtonLink>
					</>
				) : null}
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: () => <p>Note not found</p>,
			}}
		/>
	)
}

import type { Post } from './api'
export type ReplyNode = {
  post: Post
  children: ReplyNode[]
  missingParent: boolean
}
export function replyTree(
  posts: Post[],
  rootId: string,
  order: 'old' | 'new' | 'top',
): ReplyNode[] {
  const nodes = new Map(
    posts.map((post) => [
      post.id,
      { post, children: [], missingParent: false } as ReplyNode,
    ]),
  )
  const roots: ReplyNode[] = []
  for (const node of nodes.values()) {
    const parent = node.post.parent_id
      ? nodes.get(node.post.parent_id)
      : undefined
    if (parent && parent !== node && parent.post.created <= node.post.created)
      parent.children.push(node)
    else {
      node.missingParent = node.post.parent_id !== rootId
      roots.push(node)
    }
  }
  function sort(items: ReplyNode[]): ReplyNode[] {
    items.sort(
      (a, b) =>
        (order === 'top' ? b.post.score - a.post.score : 0) ||
        (order === 'new'
          ? b.post.created - a.post.created
          : a.post.created - b.post.created) ||
        a.post.id.localeCompare(b.post.id),
    )
    for (const node of items) sort(node.children)
    return items
  }
  return sort(roots)
}

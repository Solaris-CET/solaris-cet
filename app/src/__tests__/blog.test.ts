import { describe, expect, it } from 'vitest'

import { getBlogPost, listBlogPosts, listBlogTags } from '@/lib/blog'

describe('blog', () => {
  it('loads posts for en/ro/es', () => {
    expect(listBlogPosts('en').length).toBeGreaterThan(0)
    expect(listBlogPosts('ro').length).toBeGreaterThan(0)
    expect(listBlogPosts('es').length).toBeGreaterThan(0)
  })

  it('finds launch post by slug', () => {
    const en = getBlogPost('en', 'launch')
    const ro = getBlogPost('ro', 'launch')
    const es = getBlogPost('es', 'launch')
    expect(en?.frontmatter.title).toContain('Launch')
    expect(ro?.frontmatter.title).toContain('Lansare')
    expect(es?.frontmatter.title).toContain('Lanzamiento')
    expect(en?.html).toContain('<p>')
  })

  it('extracts tags list', () => {
    const tags = listBlogTags('en')
    expect(tags).toContain('ton')
  })
})


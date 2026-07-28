import {siteMeta} from '../content/site-content'

const siteUrl = 'https://ruangmain.web.id'

export function updateDocumentMeta(title: string = siteMeta.title, description: string = siteMeta.description, path = '/') {
  const canonicalUrl = new URL(path, siteUrl).href
  document.title = title
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', description)
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonicalUrl)
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', title)
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', description)
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', canonicalUrl)
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', title)
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', description)
}

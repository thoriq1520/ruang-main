import {siteMeta} from '../content/site-content'

const siteUrl = 'https://ruangmain.web.id'

export function updateDocumentMeta(title: string = siteMeta.title, description: string = siteMeta.description, path = '/', image?: string) {
  const canonicalUrl = new URL(path, siteUrl).href
  document.title = title
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', description)
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', canonicalUrl)
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', title)
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', description)
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', canonicalUrl)
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', title)
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', description)

  if (image) {
    const imageUrl = new URL(image, siteUrl).href
    let ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]')
    if (!ogImage) {
      ogImage = document.createElement('meta')
      ogImage.setAttribute('property', 'og:image')
      document.head.appendChild(ogImage)
    }
    ogImage.setAttribute('content', imageUrl)

    let twImage = document.querySelector<HTMLMetaElement>('meta[name="twitter:image"]')
    if (!twImage) {
      twImage = document.createElement('meta')
      twImage.setAttribute('name', 'twitter:image')
      document.head.appendChild(twImage)
    }
    twImage.setAttribute('content', imageUrl)
  }
}

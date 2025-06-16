import Head from 'next/head'
import { siteConfig } from '@/config/meta'

interface MetaTagsProps {
  title?: string
  description?: string
  image?: string
  url?: string
}

export function MetaTags({ 
  title = siteConfig.name,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  url = siteConfig.url 
}: MetaTagsProps) {
  const fullTitle = title === siteConfig.name ? title : `${title} | ${siteConfig.name}`

  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
    </Head>
  )
}

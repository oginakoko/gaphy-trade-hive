import { Helmet } from 'react-helmet-async';

interface MetaTagsProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: string;
}

const MetaTags = ({ title, description, image, url, type = 'website' }: MetaTagsProps) => {
  const siteUrl = 'https://gaphyhive.ai';
  const defaultImage = `${siteUrl}/og-image.png`;

  return (
    <Helmet>
      <title>{title} | GaphyHive</title>
      <meta name="description" content={description} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url || siteUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image || defaultImage} />
      <meta property="og:site_name" content="GaphyHive" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || defaultImage} />
      <meta name="twitter:site" content="@GAPHY_OFFICIAL" />

      <link rel="canonical" href={url || siteUrl} />
    </Helmet>
  );
};

export default MetaTags;

import React from 'react';
import { Helmet } from 'react-helmet-async';

/**
 * Professional SEO Component
 * @param {string} title - Page title
 * @param {string} description - Meta description
 * @param {string} keywords - Meta keywords
 * @param {string} image - Image for social sharing
 * @param {string} url - Canonical URL
 */
const SEO = ({ 
  title, 
  description, 
  keywords, 
  image = "/src/assets/sparkle.png", 
  url = "https://sparkle-hub.vercel.app/" 
}) => {
  const siteTitle = "Sparkle Hub";
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const defaultDescription = "Premium handmade resin art and personalized jewelry in Pakistan. Customized gifts, coasters, and earrings.";
  const defaultKeywords = "resin art, jewelry pakistan, handmade gifts, sparkle hub, epoxy art, customized accessories";

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      <meta name="keywords" content={keywords || defaultKeywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};

export default SEO;

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
  const defaultDescription = "Sparkle Hub (by Maryam) offers handmade resin art including custom keychains, coasters, jewelry, and personalized gifts in Pakistan. Unique epoxy resin crafts made with love for birthdays, weddings, and special occasions. Order custom designs online.";
  const defaultKeywords = "resin art Pakistan, handmade resin products Pakistan, epoxy resin crafts, custom resin gifts Pakistan, personalized handmade gifts, resin business online Pakistan, small handmade business Pakistan, resin keychains custom name, resin coasters handmade, epoxy resin jewelry Pakistan, custom name plates resin, personalized gifts for her Pakistan, birthday gift handmade resin, wedding gift resin decor, resin art in Gujranwala, handmade gifts in Punjab Pakistan, custom resin gifts near me, online resin shop Pakistan, resin artist Pakistan, buy handmade gifts online Pakistan, custom gift ideas Pakistan, unique birthday gifts handmade, personalized gift shop Pakistan, aesthetic handmade gifts, resin art Pakistan, handmade resin products, custom resin gifts Pakistan, epoxy resin crafts, personalized gifts Pakistan, resin keychains custom, resin coasters handmade, resin jewelry Pakistan, small handmade business Pakistan, custom gifts online Pakistan, Resin by Maryam, Sparkle Hub";

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
